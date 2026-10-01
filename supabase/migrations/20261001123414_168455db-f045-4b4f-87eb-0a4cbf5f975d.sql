create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles or admin" on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  balance numeric(12,2) not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles read" on public.profiles for select to authenticated
using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "profiles admin update" on public.profiles for update to authenticated
using (public.has_role(auth.uid(),'admin'));

-- users may only edit name/phone on their own profile
create or replace function public.update_my_profile(_full_name text, _phone text)
returns void language sql security definer set search_path = public
as $$ update public.profiles set full_name = _full_name, phone = _phone where id = auth.uid() $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- plans
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier text not null default 'Mini',
  price numeric(10,2) not null,
  ram_mb int not null,
  disk_gb int not null,
  cpu_pct int not null,
  features text[] not null default '{}',
  featured boolean not null default false,
  active boolean not null default true,
  sort int not null default 0,
  egg_id int,
  created_at timestamptz not null default now()
);
grant select on public.plans to anon, authenticated;
grant insert, update, delete on public.plans to authenticated;
grant all on public.plans to service_role;
alter table public.plans enable row level security;
create policy "plans public read" on public.plans for select to anon, authenticated
using (active or public.has_role(auth.uid(),'admin'));
create policy "plans admin write" on public.plans for all to authenticated
using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.plans (name,tier,price,ram_mb,disk_gb,cpu_pct,features,featured,sort) values
('Mini-v1','Mini',100,512,2,50,'{"1 server","Web console","Daily backup"}',false,1),
('Mini-v2','Mini',150,768,3,50,'{"1 server","Web console","Daily backup"}',false,2),
('Mini-v3','Mini',200,1024,4,75,'{"1 server","Web console","Daily backup"}',true,3),
('Pro-v1','Pro',350,2048,10,100,'{"Custom domain","SFTP access","Daily backup"}',true,4),
('Pro-v2','Pro',450,3072,20,150,'{"Custom domain","SFTP access","Daily backup"}',false,5),
('Pro-v3','Pro',550,4096,30,200,'{"Custom domain","SFTP access","Priority support"}',false,6),
('Mega-v1','Mega',600,4096,40,300,'{"Custom domain","Static IP","Priority support"}',true,7),
('Mega-v2','Mega',850,6144,60,400,'{"Custom domain","Static IP","Priority support"}',false,8);

-- services
create table public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id),
  name text not null,
  status text not null default 'pending_setup',
  ptero_server_id int,
  ptero_identifier text,
  due_date timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);
grant select on public.services to authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
create policy "services read" on public.services for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- orders (= invoices + payments)
create sequence public.invoice_seq start 1001;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  invoice_no int not null default nextval('public.invoice_seq'),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null default 'new' check (kind in ('new','renew','topup')),
  plan_id uuid references public.plans(id),
  service_id uuid references public.services(id) on delete set null,
  server_name text,
  amount numeric(10,2) not null,
  method text not null check (method in ('bkash','nagad','rocket','wallet')),
  trx_id text,
  sender text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
grant usage on sequence public.invoice_seq to authenticated;
grant select, insert on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders read" on public.orders for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "orders create own pending" on public.orders for insert to authenticated
with check (user_id = auth.uid() and status = 'pending' and method <> 'wallet' and amount > 0);

-- price check on insert (server-side, prevents tampering)
create or replace function public.orders_set_amount()
returns trigger language plpgsql security definer set search_path = public as $$
declare p numeric;
begin
  if new.kind = 'new' then
    select price into p from public.plans where id = new.plan_id and active;
    if p is null then raise exception 'Invalid plan'; end if;
    new.amount := p;
  elsif new.kind = 'renew' then
    select pl.price, s.plan_id into p, new.plan_id from public.services s join public.plans pl on pl.id = s.plan_id
      where s.id = new.service_id and s.user_id = new.user_id;
    if p is null then raise exception 'Invalid service'; end if;
    new.amount := p;
  end if;
  return new;
end; $$;
create trigger orders_amount before insert on public.orders
for each row when (new.status = 'pending') execute function public.orders_set_amount();

-- wallet
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null,
  note text,
  created_at timestamptz not null default now()
);
grant select on public.wallet_transactions to authenticated;
grant all on public.wallet_transactions to service_role;
alter table public.wallet_transactions enable row level security;
create policy "wallet read" on public.wallet_transactions for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- tickets
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_no int not null default (floor(random()*900000)+100000)::int,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject text not null,
  department text not null default 'Technical',
  priority text not null default 'Medium',
  status text not null default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.tickets to authenticated;
grant all on public.tickets to service_role;
alter table public.tickets enable row level security;
create policy "tickets read" on public.tickets for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "tickets create" on public.tickets for insert to authenticated
with check (user_id = auth.uid());
create policy "tickets update" on public.tickets for update to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  is_staff boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.ticket_messages to authenticated;
grant all on public.ticket_messages to service_role;
alter table public.ticket_messages enable row level security;
create policy "msgs read" on public.ticket_messages for select to authenticated
using (exists (select 1 from public.tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy "msgs create" on public.ticket_messages for insert to authenticated
with check (user_id = auth.uid() and (
  (not is_staff and exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid()))
  or public.has_role(auth.uid(),'admin')));

-- announcements
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;
grant all on public.announcements to service_role;
alter table public.announcements enable row level security;
create policy "ann read" on public.announcements for select to anon, authenticated
using (published or public.has_role(auth.uid(),'admin'));
create policy "ann admin" on public.announcements for all to authenticated
using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.announcements (title, body) values
('Welcome to zerobot', 'Your new hosting panel is live. Order a plan and pay with bKash, Nagad or Rocket.');

-- settings
create table public.settings (
  key text primary key,
  value text not null default ''
);
grant select on public.settings to anon, authenticated;
grant insert, update, delete on public.settings to authenticated;
grant all on public.settings to service_role;
alter table public.settings enable row level security;
create policy "settings read" on public.settings for select to anon, authenticated using (true);
create policy "settings admin" on public.settings for all to authenticated
using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.settings (key, value) values
('site_name','zerobot'),('bkash_number','01XXXXXXXXX'),('nagad_number','01XXXXXXXXX'),('rocket_number','01XXXXXXXXX'),
('ptero_url',''),('ptero_location_id','1'),('ptero_docker_image','ghcr.io/parkervcp/yolks:nodejs_18'),
('ptero_startup','npm start'),('ptero_environment','{}');

-- admin logs
create table public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  target text,
  created_at timestamptz not null default now()
);
grant select, insert on public.admin_logs to authenticated;
grant all on public.admin_logs to service_role;
alter table public.admin_logs enable row level security;
create policy "logs admin read" on public.admin_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "logs admin insert" on public.admin_logs for insert to authenticated
with check (public.has_role(auth.uid(),'admin') and admin_id = auth.uid());

-- ===== actions =====
create or replace function public.approve_order(_order_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare o public.orders; pl public.plans; sid uuid;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select * into o from public.orders where id = _order_id for update;
  if o.id is null or o.status <> 'pending' then raise exception 'Order not pending'; end if;
  if o.kind = 'topup' then
    update public.profiles set balance = balance + o.amount where id = o.user_id;
    insert into public.wallet_transactions (user_id, amount, note) values (o.user_id, o.amount, 'Top-up #' || o.invoice_no);
  elsif o.kind = 'new' then
    select * into pl from public.plans where id = o.plan_id;
    insert into public.services (user_id, plan_id, name) values (o.user_id, o.plan_id, coalesce(nullif(o.server_name,''), pl.name || ' server'))
      returning id into sid;
    update public.orders set service_id = sid where id = o.id;
  elsif o.kind = 'renew' then
    update public.services set due_date = greatest(due_date, now()) + interval '30 days',
      status = case when status = 'suspended' then 'active' else status end where id = o.service_id;
    sid := o.service_id;
  end if;
  update public.orders set status = 'approved', reviewed_at = now() where id = o.id;
  insert into public.admin_logs (admin_id, action, target) values (auth.uid(), 'Approved order', '#' || o.invoice_no);
  return sid;
end; $$;

create or replace function public.reject_order(_order_id uuid, _note text)
returns void language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  update public.orders set status = 'rejected', admin_note = _note, reviewed_at = now()
    where id = _order_id and status = 'pending' returning invoice_no into n;
  insert into public.admin_logs (admin_id, action, target) values (auth.uid(), 'Rejected order', '#' || n);
end; $$;

create or replace function public.pay_with_wallet(_kind text, _plan_id uuid, _service_id uuid, _server_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare price numeric; bal numeric; sid uuid; pid uuid := _plan_id; inv int;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if _kind = 'new' then
    select p.price into price from public.plans p where p.id = _plan_id and p.active;
  elsif _kind = 'renew' then
    select p.price, s.plan_id into price, pid from public.services s join public.plans p on p.id = s.plan_id
      where s.id = _service_id and s.user_id = auth.uid() and s.status <> 'terminated';
  else raise exception 'Invalid'; end if;
  if price is null then raise exception 'Invalid plan or service'; end if;
  select balance into bal from public.profiles where id = auth.uid() for update;
  if bal < price then raise exception 'Not enough wallet balance'; end if;
  update public.profiles set balance = balance - price where id = auth.uid();
  if _kind = 'new' then
    insert into public.services (user_id, plan_id, name)
      values (auth.uid(), pid, coalesce(nullif(_server_name,''), (select name from public.plans where id = pid) || ' server'))
      returning id into sid;
  else
    update public.services set due_date = greatest(due_date, now()) + interval '30 days',
      status = case when status = 'suspended' then 'active' else status end where id = _service_id;
    sid := _service_id;
  end if;
  insert into public.orders (user_id, kind, plan_id, service_id, server_name, amount, method, status, reviewed_at)
    values (auth.uid(), _kind, pid, sid, _server_name, price, 'wallet', 'approved', now()) returning invoice_no into inv;
  insert into public.wallet_transactions (user_id, amount, note) values (auth.uid(), -price, 'Invoice #' || inv);
  return sid;
end; $$;

create or replace function public.admin_adjust_balance(_user_id uuid, _amount numeric, _note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  update public.profiles set balance = balance + _amount where id = _user_id;
  insert into public.wallet_transactions (user_id, amount, note) values (_user_id, _amount, coalesce(_note,'Admin adjustment'));
  insert into public.admin_logs (admin_id, action, target) values (auth.uid(), 'Adjusted balance ' || _amount, _user_id::text);
end; $$;

create or replace function public.admin_set_service(_service_id uuid, _status text, _due timestamptz)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  if _status not in ('pending_setup','active','suspended','terminated') then raise exception 'Bad status'; end if;
  update public.services set status = _status, due_date = coalesce(_due, due_date) where id = _service_id;
  insert into public.admin_logs (admin_id, action, target) values (auth.uid(), 'Service set to ' || _status, _service_id::text);
end; $$;

create or replace function public.suspend_overdue()
returns int language sql security definer set search_path = public as $$
  with u as (update public.services set status = 'suspended' where status = 'active' and due_date < now() returning 1)
  select count(*)::int from u
$$;
revoke execute on function public.suspend_overdue() from public, anon, authenticated;