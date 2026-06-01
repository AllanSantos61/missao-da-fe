create extension if not exists "pgcrypto";

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

insert into public.admin_users (username, password_hash)
values ('admin', '$2b$12$iBI.f3AbGflxaJa9BBC7/uAUEHI1xTeTRTDE3aqUaEQ9hS6U6XVdi')
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
grant select, insert, update, delete on public.admin_users to service_role;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'daily_results',
    'user_journey_progress',
    'user_journey_day_status',
    'journey_days',
    'journey_quiz_questions',
    'app_events',
    'public_results'
  ]
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format('grant select, insert, update, delete on public.%I to service_role', table_name);
    end if;
  end loop;
end $$;
