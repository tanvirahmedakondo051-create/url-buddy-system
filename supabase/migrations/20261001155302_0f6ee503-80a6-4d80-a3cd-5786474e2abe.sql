create unique index if not exists orders_aurapay_trx_uniq on public.orders (trx_id) where method = 'aurapay' and trx_id is not null;

create or replace function public.system_approve_order(_order_id uuid, _trx text)
returns uuid language plpgsql security definer set search_path = public as $$
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
    update public.services set due_date = greatest(due_date, now()) + interval '30 days',
      status = case when status = 'suspended' then 'active' else status end where id = o.service_id;
    sid := o.service_id;
  end if;
  update public.orders set status = 'approved', reviewed_at = now() where id = o.id;
  insert into public.admin_logs (admin_id, action, target) values (null, 'AuraPay auto-approved', '#' || o.invoice_no);
  return sid;
end $$;
revoke all on function public.system_approve_order(uuid, text) from public, anon, authenticated;
grant execute on function public.system_approve_order(uuid, text) to service_role;