alter table public.orders add constraint orders_profile_fk foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.services add constraint services_profile_fk foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.tickets add constraint tickets_profile_fk foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.wallet_transactions add constraint wallet_profile_fk foreign key (user_id) references public.profiles(id) on delete cascade;