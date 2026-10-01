ALTER TABLE public.orders DROP CONSTRAINT orders_kind_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_kind_check CHECK (kind = ANY (ARRAY['new','renew','topup','upgrade']));
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

CREATE OR REPLACE FUNCTION public.upgrade_diff(_service_id uuid, _user_id uuid, _plan_id uuid)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
declare cur numeric; nxt numeric;
begin
  select pl.price into cur from public.services s join public.plans pl on pl.id = s.plan_id
    where s.id = _service_id and s.user_id = _user_id and s.status not in ('terminated');
  select price into nxt from public.plans where id = _plan_id and active;
  if cur is null or nxt is null then raise exception 'Invalid service or plan'; end if;
  if nxt <= cur then raise exception 'Choose a bigger plan to upgrade'; end if;
  return nxt - cur;
end $$;
REVOKE EXECUTE ON FUNCTION public.upgrade_diff(uuid,uuid,uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.upgrade_diff(uuid,uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.orders_set_amount()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
  elsif new.kind = 'upgrade' then
    new.amount := public.upgrade_diff(new.service_id, new.user_id, new.plan_id);
  end if;
  if new.kind in ('new','renew') and coalesce(new.coupon_code,'') <> '' then
    d := public.check_coupon(new.coupon_code, new.amount);
    update public.coupons set used_count = used_count + 1 where upper(code) = upper(trim(new.coupon_code));
    new.discount := d;
    new.amount := greatest(new.amount - d, 1);
  else
    new.discount := 0; new.coupon_code := null;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.approve_order(_order_id uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
    update public.services set due_date = greatest(due_date, now()) + interval '30 days', reminder_sent_at = null,
      status = case when status = 'suspended' then 'active' else status end where id = o.service_id;
    sid := o.service_id;
  elsif o.kind = 'upgrade' then
    update public.services set plan_id = o.plan_id where id = o.service_id;
    sid := o.service_id;
  end if;
  update public.orders set status = 'approved', reviewed_at = now() where id = o.id;
  insert into public.admin_logs (admin_id, action, target) values (auth.uid(), 'Approved order', '#' || o.invoice_no);
  return sid;
end; $function$;

CREATE OR REPLACE FUNCTION public.system_approve_order(_order_id uuid, _trx text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare o public.orders; pl public.plans; sid uuid;
begin
  select * into o from public.orders where id = _order_id for update;
  if o.id is null or o.status <> 'pending' then return null; end if;
  update public.orders set trx_id = _trx where id = o.id;
  if o.kind = 'topup' then
    update public.profiles set balance = balance + o.amount where id = o.user_id;
    insert into public.wallet_transactions (user_id, amount, note) values (o.user_id, o.amount, 'Top-up #' || o.invoice_no);
  elsif o.kind = 'new' then
    select * into pl from public.plans where id = o.plan_id;
    insert into public.services (user_id, plan_id, name) values (o.user_id, o.plan_id, coalesce(nullif(o.server_name,''), pl.name || ' server'))
      returning id into sid;
    update public.orders set service_id = sid where id = o.id;
  elsif o.kind = 'renew' then
    update public.services set due_date = greatest(due_date, now()) + interval '30 days', reminder_sent_at = null,
      status = case when status = 'suspended' then 'active' else status end where id = o.service_id;
    sid := o.service_id;
  elsif o.kind = 'upgrade' then
    update public.services set plan_id = o.plan_id where id = o.service_id;
    sid := o.service_id;
  end if;
  update public.orders set status = 'approved', reviewed_at = now() where id = o.id;
  insert into public.admin_logs (admin_id, action, target) values (null, 'AuraPay auto-approved', '#' || o.invoice_no);
  return sid;
end $function$;

CREATE OR REPLACE FUNCTION public.pay_with_wallet(_kind text, _plan_id uuid, _service_id uuid, _server_name text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare price numeric; bal numeric; sid uuid; pid uuid := _plan_id; inv int;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if _kind = 'new' then
    select p.price into price from public.plans p where p.id = _plan_id and p.active;
  elsif _kind = 'renew' then
    select p.price, s.plan_id into price, pid from public.services s join public.plans p on p.id = s.plan_id
      where s.id = _service_id and s.user_id = auth.uid() and s.status <> 'terminated';
  elsif _kind = 'upgrade' then
    price := public.upgrade_diff(_service_id, auth.uid(), _plan_id);
  else raise exception 'Invalid'; end if;
  if price is null then raise exception 'Invalid plan or service'; end if;
  select balance into bal from public.profiles where id = auth.uid() for update;
  if bal < price then raise exception 'Not enough wallet balance'; end if;
  update public.profiles set balance = balance - price where id = auth.uid();
  if _kind = 'new' then
    insert into public.services (user_id, plan_id, name)
      values (auth.uid(), pid, coalesce(nullif(_server_name,''), (select name from public.plans where id = pid) || ' server'))
      returning id into sid;
  elsif _kind = 'renew' then
    update public.services set due_date = greatest(due_date, now()) + interval '30 days', reminder_sent_at = null,
      status = case when status = 'suspended' then 'active' else status end where id = _service_id;
    sid := _service_id;
  else
    update public.services set plan_id = pid where id = _service_id;
    sid := _service_id;
  end if;
  insert into public.orders (user_id, kind, plan_id, service_id, server_name, amount, method, status, reviewed_at)
    values (auth.uid(), _kind, pid, sid, _server_name, price, 'wallet', 'approved', now()) returning invoice_no into inv;
  insert into public.wallet_transactions (user_id, amount, note) values (auth.uid(), -price, 'Invoice #' || inv);
  return sid;
end; $function$;

INSERT INTO public.settings(key,value) VALUES ('email_verification','1') ON CONFLICT (key) DO NOTHING;