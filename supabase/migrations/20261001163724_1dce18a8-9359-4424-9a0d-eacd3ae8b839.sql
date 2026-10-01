alter table public.orders drop constraint orders_method_check;
alter table public.orders add constraint orders_method_check check (method in ('bkash','nagad','rocket','wallet','aurapay','manual'));
alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check check (status in ('pending','approved','rejected','refunded'));
alter table public.orders add column if not exists discount numeric not null default 0;
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists description text;
create unique index if not exists orders_aurapay_trx_uq on public.orders(method, trx_id) where trx_id is not null and method='aurapay';

alter table public.profiles add column if not exists ptero_user_id integer;
alter table public.profiles add column if not exists ptero_username text;

create table public.vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  amount numeric not null check (amount > 0),
  max_uses integer not null default 1,
  used_count integer not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.vouchers to authenticated;
grant all on public.vouchers to service_role;
alter table public.vouchers enable row level security;
create policy "vouchers admin" on public.vouchers for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.voucher_claims (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.vouchers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric not null,
  created_at timestamptz not null default now(),
  unique (voucher_id, user_id)
);
grant select on public.voucher_claims to authenticated;
grant all on public.voucher_claims to service_role;
alter table public.voucher_claims enable row level security;
create policy "claims read" on public.voucher_claims for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind text not null default 'percent' check (kind in ('percent','fixed')),
  value numeric not null check (value > 0),
  max_uses integer not null default 0,
  used_count integer not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.coupons to authenticated;
grant all on public.coupons to service_role;
alter table public.coupons enable row level security;
create policy "coupons admin" on public.coupons for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.canned_replies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.canned_replies to authenticated;
grant all on public.canned_replies to service_role;
alter table public.canned_replies enable row level security;
create policy "canned admin" on public.canned_replies for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.claim_voucher(_code text) returns numeric
language plpgsql security definer set search_path = public as $$
declare v public.vouchers;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select * into v from public.vouchers where upper(code) = upper(trim(_code)) for update;
  if v.id is null or not v.active then raise exception 'Invalid voucher code'; end if;
  if v.expires_at is not null and v.expires_at < now() then raise exception 'This voucher has expired'; end if;
  if v.used_count >= v.max_uses then raise exception 'This voucher has been fully used'; end if;
  if exists(select 1 from public.voucher_claims where voucher_id = v.id and user_id = auth.uid()) then raise exception 'You already claimed this voucher'; end if;
  insert into public.voucher_claims(voucher_id,user_id,amount) values (v.id, auth.uid(), v.amount);
  update public.vouchers set used_count = used_count + 1 where id = v.id;
  update public.profiles set balance = balance + v.amount where id = auth.uid();
  insert into public.wallet_transactions(user_id,amount,note) values (auth.uid(), v.amount, 'Voucher ' || v.code);
  return v.amount;
end $$;

-- coupon preview (no usage change)
create or replace function public.check_coupon(_code text, _amount numeric) returns numeric
language plpgsql stable security definer set search_path = public as $$
declare c public.coupons; d numeric;
begin
  select * into c from public.coupons where upper(code) = upper(trim(_code));
  if c.id is null or not c.active then raise exception 'Invalid coupon'; end if;
  if c.expires_at is not null and c.expires_at < now() then raise exception 'Coupon expired'; end if;
  if c.max_uses > 0 and c.used_count >= c.max_uses then raise exception 'Coupon fully used'; end if;
  d := case when c.kind = 'percent' then round(_amount * least(c.value,100) / 100) else least(c.value, _amount) end;
  return d;
end $$;

-- price trigger now applies coupon
create or replace function public.orders_set_amount() returns trigger
language plpgsql security definer set search_path = public as $$
declare p numeric; d numeric := 0;
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
  if new.kind in ('new','renew') and coalesce(new.coupon_code,'') <> '' then
    d := public.check_coupon(new.coupon_code, new.amount);
    update public.coupons set used_count = used_count + 1 where upper(code) = upper(trim(new.coupon_code));
    new.discount := d;
    new.amount := greatest(new.amount - d, 1);
  else
    new.discount := 0;
  end if;
  return new;
end $$;

create or replace function public.set_gateway_secret(_key text, _value text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  if _key not in ('ptero_api_key','aurapay_brand_key') then raise exception 'Unknown key'; end if;
  insert into public.gateway_secrets(key,value,updated_at) values (_key,_value,now())
    on conflict (key) do update set value = excluded.value, updated_at = now();
  insert into public.admin_logs(admin_id,action,target) values (auth.uid(),'Updated API key',_key);
end $$;

update public.gateway_secrets set key = 'aurapay_brand_key' where key = 'aurapay_api_key' and not exists (select 1 from public.gateway_secrets where key='aurapay_brand_key');
delete from public.gateway_secrets where key in ('aurapay_secret','aurapay_api_key');

create or replace function public.admin_create_invoice(_user_id uuid, _amount numeric, _description text) returns integer
language plpgsql security definer set search_path = public as $$
declare inv int;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  if _amount <= 0 then raise exception 'Amount must be positive'; end if;
  insert into public.orders(user_id, kind, amount, method, status, description)
    values (_user_id, 'topup', _amount, 'manual', 'pending', _description) returning invoice_no into inv;
  insert into public.admin_logs(admin_id,action,target) values (auth.uid(),'Created invoice','#'||inv);
  return inv;
end $$;

create or replace function public.admin_refund_order(_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select * into o from public.orders where id = _order_id for update;
  if o.id is null or o.status <> 'approved' then raise exception 'Only paid orders can be refunded'; end if;
  update public.orders set status = 'refunded', reviewed_at = now() where id = o.id;
  update public.profiles set balance = balance + o.amount where id = o.user_id;
  insert into public.wallet_transactions(user_id,amount,note) values (o.user_id, o.amount, 'Refund #' || o.invoice_no);
  insert into public.admin_logs(admin_id,action,target) values (auth.uid(),'Refunded to wallet','#'||o.invoice_no);
end $$;

create or replace function public.suspend_overdue() returns integer
language plpgsql security definer set search_path = public as $$
declare n int; days int;
begin
  with u as (update public.services set status = 'suspended' where status = 'active' and due_date < now() returning 1)
  select count(*)::int into n from u;
  select nullif(value,'')::int into days from public.settings where key = 'terminate_after_days';
  if days is not null and days > 0 then
    update public.services set status = 'terminated' where status = 'suspended' and due_date < now() - make_interval(days => days);
  end if;
  return n;
end $$;

revoke execute on function public.claim_voucher(text), public.check_coupon(text,numeric), public.admin_create_invoice(uuid,numeric,text), public.admin_refund_order(uuid) from anon, public;
grant execute on function public.claim_voucher(text), public.check_coupon(text,numeric), public.admin_create_invoice(uuid,numeric,text), public.admin_refund_order(uuid) to authenticated;

insert into public.settings(key,value) values ('logo_url',''),('favicon_url',''),('support_email',''),('footer_text',''),('terminate_after_days','')
on conflict (key) do nothing;