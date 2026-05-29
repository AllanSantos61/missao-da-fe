create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  local_user_id text,
  player_name text not null,
  total_xp integer not null default 0,
  weekly_xp integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists user_id text;
alter table public.profiles add column if not exists local_user_id text;
alter table public.profiles add column if not exists player_name text;
alter table public.profiles add column if not exists total_xp integer default 0;
alter table public.profiles add column if not exists weekly_xp integer default 0;
alter table public.profiles add column if not exists current_streak integer default 0;
alter table public.profiles add column if not exists best_streak integer default 0;
alter table public.profiles add column if not exists created_at timestamptz default now();

with ranked_profiles as (
  select
    id,
    row_number() over (
      partition by user_id
      order by created_at desc nulls last, id desc
    ) as row_number
  from public.profiles
  where user_id is not null
)
delete from public.profiles profiles
using ranked_profiles ranked
where profiles.id = ranked.id
  and ranked.row_number > 1;

create unique index if not exists profiles_user_id_uidx
  on public.profiles(user_id)
  where user_id is not null;
create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists profiles_player_name_idx on public.profiles(player_name);
create index if not exists profiles_weekly_xp_idx on public.profiles(weekly_xp desc);

create table if not exists public.user_journey_progress (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  local_user_id text,
  player_name text not null default 'visitante',
  journey_start_date date not null default current_date,
  current_journey_day integer not null default 1,
  highest_unlocked_day integer not null default 1,
  completed_days integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  total_xp integer not null default 0,
  weekly_xp integer not null default 0,
  last_completed_date date,
  last_access_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_journey_progress add column if not exists user_id text;
alter table public.user_journey_progress add column if not exists local_user_id text;
alter table public.user_journey_progress add column if not exists player_name text;
alter table public.user_journey_progress add column if not exists journey_start_date date default current_date;
alter table public.user_journey_progress add column if not exists current_journey_day integer default 1;
alter table public.user_journey_progress add column if not exists highest_unlocked_day integer default 1;
alter table public.user_journey_progress add column if not exists completed_days integer default 0;
alter table public.user_journey_progress add column if not exists current_streak integer default 0;
alter table public.user_journey_progress add column if not exists best_streak integer default 0;
alter table public.user_journey_progress add column if not exists total_xp integer default 0;
alter table public.user_journey_progress add column if not exists weekly_xp integer default 0;
alter table public.user_journey_progress add column if not exists last_completed_date date;
alter table public.user_journey_progress add column if not exists last_access_date date;
alter table public.user_journey_progress add column if not exists created_at timestamptz default now();
alter table public.user_journey_progress add column if not exists updated_at timestamptz default now();

with ranked_progress as (
  select
    id,
    row_number() over (
      partition by user_id
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as row_number
  from public.user_journey_progress
  where user_id is not null
)
delete from public.user_journey_progress progress
using ranked_progress ranked
where progress.id = ranked.id
  and ranked.row_number > 1;

alter table public.user_journey_progress drop constraint if exists user_journey_progress_player_name_key;
create unique index if not exists user_journey_progress_user_id_uidx
  on public.user_journey_progress(user_id)
  where user_id is not null;
create index if not exists user_journey_progress_user_id_idx on public.user_journey_progress(user_id);
create index if not exists user_journey_progress_player_name_idx on public.user_journey_progress(player_name);
create index if not exists user_journey_progress_weekly_xp_idx on public.user_journey_progress(weekly_xp desc);

alter table public.profiles enable row level security;
alter table public.user_journey_progress enable row level security;

drop policy if exists "anon_select_profiles" on public.profiles;
drop policy if exists "anon_insert_profiles" on public.profiles;
drop policy if exists "anon_update_profiles" on public.profiles;
drop policy if exists "anon_select_user_journey_progress" on public.user_journey_progress;
drop policy if exists "anon_insert_user_journey_progress" on public.user_journey_progress;
drop policy if exists "anon_update_user_journey_progress" on public.user_journey_progress;

create policy "anon_select_profiles"
on public.profiles
for select
to anon
using (true);

create policy "anon_insert_profiles"
on public.profiles
for insert
to anon
with check (true);

create policy "anon_update_profiles"
on public.profiles
for update
to anon
using (true)
with check (true);

create policy "anon_select_user_journey_progress"
on public.user_journey_progress
for select
to anon
using (true);

create policy "anon_insert_user_journey_progress"
on public.user_journey_progress
for insert
to anon
with check (true);

create policy "anon_update_user_journey_progress"
on public.user_journey_progress
for update
to anon
using (true)
with check (true);

grant usage on schema public to anon;
grant select, insert, update on public.profiles to anon;
grant select, insert, update on public.user_journey_progress to anon;
