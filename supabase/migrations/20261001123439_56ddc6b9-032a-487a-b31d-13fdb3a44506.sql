revoke execute on function public.has_role(uuid, app_role) from public, anon;
revoke execute on function public.update_my_profile(text, text) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.orders_set_amount() from public, anon, authenticated;
revoke execute on function public.approve_order(uuid) from public, anon;
revoke execute on function public.reject_order(uuid, text) from public, anon;
revoke execute on function public.pay_with_wallet(text, uuid, uuid, text) from public, anon;
revoke execute on function public.admin_adjust_balance(uuid, numeric, text) from public, anon;
revoke execute on function public.admin_set_service(uuid, text, timestamptz) from public, anon;
grant execute on function public.has_role(uuid, app_role) to authenticated;
grant execute on function public.update_my_profile(text, text), public.approve_order(uuid), public.reject_order(uuid, text),
  public.pay_with_wallet(text, uuid, uuid, text), public.admin_adjust_balance(uuid, numeric, text),
  public.admin_set_service(uuid, text, timestamptz) to authenticated;