create extension if not exists "pgcrypto";

alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists parish text;
alter table public.profiles add column if not exists group_name text;
alter table public.profiles add column if not exists diocese text;
alter table public.profiles add column if not exists reminder_period text;
alter table public.profiles add column if not exists reminder_time text;

create index if not exists profiles_city_weekly_xp_idx on public.profiles(city, weekly_xp desc);
create index if not exists profiles_parish_weekly_xp_idx on public.profiles(parish, weekly_xp desc);
create index if not exists profiles_group_weekly_xp_idx on public.profiles(group_name, weekly_xp desc);
create index if not exists profiles_diocese_weekly_xp_idx on public.profiles(diocese, weekly_xp desc);

create table if not exists public.public_results (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  player_name text not null,
  result_date date not null,
  journey_day integer not null,
  reading_completed boolean not null default false,
  quiz_score integer not null default 0,
  word_attempts integer not null default 0,
  daily_xp integer not null default 0,
  streak integer not null default 0,
  share_slug text unique not null,
  created_at timestamptz not null default now()
);

alter table public.public_results add column if not exists user_id text;
alter table public.public_results add column if not exists player_name text;
alter table public.public_results add column if not exists result_date date;
alter table public.public_results add column if not exists journey_day integer;
alter table public.public_results add column if not exists reading_completed boolean default false;
alter table public.public_results add column if not exists quiz_score integer default 0;
alter table public.public_results add column if not exists word_attempts integer default 0;
alter table public.public_results add column if not exists daily_xp integer default 0;
alter table public.public_results add column if not exists streak integer default 0;
alter table public.public_results add column if not exists share_slug text;
alter table public.public_results add column if not exists created_at timestamptz default now();

create unique index if not exists public_results_share_slug_uidx on public.public_results(share_slug);
create index if not exists public_results_user_date_idx on public.public_results(user_id, result_date);

alter table public.public_results enable row level security;

drop policy if exists "anon_select_public_results" on public.public_results;
drop policy if exists "anon_insert_public_results" on public.public_results;
drop policy if exists "anon_update_public_results" on public.public_results;

create policy "anon_select_public_results"
on public.public_results
for select
to anon
using (true);

create policy "anon_insert_public_results"
on public.public_results
for insert
to anon
with check (true);

create policy "anon_update_public_results"
on public.public_results
for update
to anon
using (true)
with check (true);

grant usage on schema public to anon;
grant select, insert, update on public.profiles to anon;
grant select, insert, update on public.public_results to anon;
