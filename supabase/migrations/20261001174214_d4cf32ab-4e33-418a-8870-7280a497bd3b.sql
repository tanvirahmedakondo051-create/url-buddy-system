revoke execute on function public.has_role(uuid, public.app_role) from anon;
drop policy if exists "plans public read" on public.plans;
create policy "plans anon read" on public.plans for select to anon using (active);
create policy "plans auth read" on public.plans for select to authenticated using (active or public.has_role(auth.uid(),'admin'));
drop policy if exists "ann read" on public.announcements;
create policy "ann anon read" on public.announcements for select to anon using (published);
create policy "ann auth read" on public.announcements for select to authenticated using (published or public.has_role(auth.uid(),'admin'));