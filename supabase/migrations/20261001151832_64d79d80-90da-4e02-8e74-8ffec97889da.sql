revoke execute on function public.set_gateway_secret(text,text) from public, anon;
revoke execute on function public.list_gateway_secrets() from public, anon;
revoke execute on function public.admin_delete_plan(uuid) from public, anon;
grant execute on function public.set_gateway_secret(text,text) to authenticated;
grant execute on function public.list_gateway_secrets() to authenticated;
grant execute on function public.admin_delete_plan(uuid) to authenticated;