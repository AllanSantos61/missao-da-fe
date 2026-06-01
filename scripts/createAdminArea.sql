create extension if not exists "pgcrypto";

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

insert into public.admin_users (username, password_hash)
values ('admin', '$2b$12$RHOYvlZHowbEyGHPjF9I1uiOmnEBNLVVZiSBuPJxtGLKQzsLWPHWK')
on conflict (username)
do update set password_hash = excluded.password_hash;

alter table public.admin_users enable row level security;

drop policy if exists "deny_anon_admin_users" on public.admin_users;
create policy "deny_anon_admin_users"
on public.admin_users
for all
to anon
using (false)
with check (false);

revoke all on public.admin_users from anon;
revoke all on public.admin_users from authenticated;
