alter table public.profiles
add column if not exists local_user_id text;

alter table public.profiles
add column if not exists user_id text;

create index if not exists profiles_local_user_id_idx
on public.profiles(local_user_id);

create index if not exists profiles_user_id_idx
on public.profiles(user_id);
