create table public.gateway_secrets (key text primary key, value text not null default '', updated_at timestamptz not null default now());
grant all on public.gateway_secrets to service_role;
alter table public.gateway_secrets enable row level security;

create or replace function public.set_gateway_secret(_key text, _value text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  if _key not in ('ptero_api_key','aurapay_api_key','aurapay_secret') then raise exception 'Unknown key'; end if;
  insert into public.gateway_secrets(key,value,updated_at) values (_key,_value,now())
    on conflict (key) do update set value = excluded.value, updated_at = now();
  insert into public.admin_logs(admin_id,action,target) values (auth.uid(),'Updated API key',_key);
end $$;

create or replace function public.list_gateway_secrets() returns table(key text, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  return query select g.key, g.updated_at from public.gateway_secrets g where g.value <> '';
end $$;

alter table public.plans add column if not exists archived boolean not null default false;

create or replace function public.admin_delete_plan(_plan_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare n text; used boolean;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select name into n from public.plans where id = _plan_id;
  used := exists(select 1 from public.services where plan_id = _plan_id) or exists(select 1 from public.orders where plan_id = _plan_id);
  if used then
    update public.plans set active = false, archived = true, featured = false where id = _plan_id;
    insert into public.admin_logs(admin_id,action,target) values (auth.uid(),'Archived plan',n);
    return 'archived';
  end if;
  delete from public.plans where id = _plan_id;
  insert into public.admin_logs(admin_id,action,target) values (auth.uid(),'Deleted plan',n);
  return 'deleted';
end $$;

insert into public.settings(key,value) values ('gw_bkash','1'),('gw_nagad','1'),('gw_rocket','1'),('gw_wallet','1'),('gw_aurapay','0')
on conflict (key) do nothing;