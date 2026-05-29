create extension if not exists "pgcrypto";

create table if not exists public.site_stats (
  id text primary key default 'global',
  total_visits integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.site_stats (id, total_visits, updated_at)
values ('global', 0, now())
on conflict (id) do nothing;

create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id text,
  player_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint app_events_event_name_not_blank check (char_length(trim(event_name)) > 0)
);

create table if not exists public.journey_days (
  id uuid primary key default gen_random_uuid(),
  day_number integer unique not null,
  title text not null,
  bible_reference text not null,
  bible_book text,
  chapter_start integer,
  verse_start integer,
  chapter_end integer,
  verse_end integer,
  estimated_minutes integer not null default 10,
  faith_word text not null,
  normalized_faith_word text not null,
  reading_xp integer not null default 40,
  quiz_xp integer not null default 45,
  word_xp integer not null default 35,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.journey_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  journey_day_id uuid references public.journey_days(id) on delete cascade,
  day_number integer not null,
  question_order integer not null,
  question text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  correct_option text not null,
  explanation text,
  created_at timestamptz not null default now(),
  constraint journey_quiz_correct_option_valid check (correct_option in ('A', 'B', 'C')),
  constraint journey_quiz_question_order_valid check (question_order between 1 and 3)
);

alter table public.journey_days add column if not exists day_number integer;
alter table public.journey_days add column if not exists title text;
alter table public.journey_days add column if not exists bible_reference text;
alter table public.journey_days add column if not exists bible_book text;
alter table public.journey_days add column if not exists chapter_start integer;
alter table public.journey_days add column if not exists verse_start integer;
alter table public.journey_days add column if not exists chapter_end integer;
alter table public.journey_days add column if not exists verse_end integer;
alter table public.journey_days add column if not exists estimated_minutes integer default 10;
alter table public.journey_days add column if not exists faith_word text;
alter table public.journey_days add column if not exists normalized_faith_word text;
alter table public.journey_days add column if not exists reading_xp integer default 40;
alter table public.journey_days add column if not exists quiz_xp integer default 45;
alter table public.journey_days add column if not exists word_xp integer default 35;
alter table public.journey_days add column if not exists active boolean default true;
alter table public.journey_days add column if not exists created_at timestamptz default now();

alter table public.journey_quiz_questions add column if not exists journey_day_id uuid references public.journey_days(id) on delete cascade;
alter table public.journey_quiz_questions add column if not exists day_number integer;
alter table public.journey_quiz_questions add column if not exists question_order integer;
alter table public.journey_quiz_questions add column if not exists question text;
alter table public.journey_quiz_questions add column if not exists option_a text;
alter table public.journey_quiz_questions add column if not exists option_b text;
alter table public.journey_quiz_questions add column if not exists option_c text;
alter table public.journey_quiz_questions add column if not exists correct_option text;
alter table public.journey_quiz_questions add column if not exists explanation text;
alter table public.journey_quiz_questions add column if not exists created_at timestamptz default now();

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

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists profiles_player_name_idx on public.profiles(player_name);
create index if not exists profiles_weekly_xp_idx on public.profiles(weekly_xp desc);

create table if not exists public.daily_results (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  local_user_id text,
  player_name text not null,
  challenge_date date not null,
  challenge_type text not null,
  xp_earned integer not null default 0,
  completed boolean not null default true,
  completed_at timestamptz not null default now()
);

alter table public.daily_results add column if not exists user_id text;
alter table public.daily_results add column if not exists local_user_id text;
alter table public.daily_results add column if not exists player_name text;
alter table public.daily_results add column if not exists challenge_date date;
alter table public.daily_results add column if not exists challenge_type text;
alter table public.daily_results add column if not exists xp_earned integer default 0;
alter table public.daily_results add column if not exists completed boolean default true;
alter table public.daily_results add column if not exists completed_at timestamptz default now();

with ranked_daily_results as (
  select
    id,
    row_number() over (
      partition by player_name, challenge_date, challenge_type
      order by completed_at desc nulls last, id desc
    ) as row_number
  from public.daily_results
  where player_name is not null
    and challenge_date is not null
    and challenge_type is not null
)
delete from public.daily_results daily_results
using ranked_daily_results ranked
where daily_results.id = ranked.id
  and ranked.row_number > 1;

create unique index if not exists daily_results_player_date_type_uidx
  on public.daily_results(player_name, challenge_date, challenge_type);
create index if not exists daily_results_user_id_idx on public.daily_results(user_id);
create index if not exists daily_results_challenge_date_idx on public.daily_results(challenge_date);
create index if not exists daily_results_weekly_ranking_idx
  on public.daily_results(challenge_date, completed, player_name);

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

alter table public.user_journey_progress drop constraint if exists user_journey_progress_player_name_key;
create unique index if not exists user_journey_progress_user_id_uidx
  on public.user_journey_progress(user_id)
  where user_id is not null;
create index if not exists user_journey_progress_player_name_idx on public.user_journey_progress(player_name);
create index if not exists user_journey_progress_weekly_xp_idx on public.user_journey_progress(weekly_xp desc);

create table if not exists public.user_journey_day_status (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  local_user_id text,
  player_name text not null default 'visitante',
  day_number integer not null,
  status text not null default 'pending',
  reading_completed boolean not null default false,
  quiz_completed boolean not null default false,
  word_completed boolean not null default false,
  total_xp_earned integer not null default 0,
  completed_at timestamptz,
  completed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_journey_day_status_valid check (status in ('locked', 'available', 'pending', 'completed'))
);

alter table public.user_journey_day_status add column if not exists user_id text;
alter table public.user_journey_day_status add column if not exists local_user_id text;
alter table public.user_journey_day_status add column if not exists player_name text;
alter table public.user_journey_day_status add column if not exists day_number integer;
alter table public.user_journey_day_status add column if not exists status text default 'pending';
alter table public.user_journey_day_status add column if not exists reading_completed boolean default false;
alter table public.user_journey_day_status add column if not exists quiz_completed boolean default false;
alter table public.user_journey_day_status add column if not exists word_completed boolean default false;
alter table public.user_journey_day_status add column if not exists total_xp_earned integer default 0;
alter table public.user_journey_day_status add column if not exists completed_at timestamptz;
alter table public.user_journey_day_status add column if not exists completed_date date;
alter table public.user_journey_day_status add column if not exists created_at timestamptz default now();
alter table public.user_journey_day_status add column if not exists updated_at timestamptz default now();

alter table public.user_journey_day_status drop constraint if exists user_journey_day_status_player_name_day_number_key;
alter table public.user_journey_day_status drop constraint if exists user_journey_day_unique;
create unique index if not exists user_journey_day_status_user_day_uidx
  on public.user_journey_day_status(user_id, day_number)
  where user_id is not null;
create index if not exists user_journey_day_status_player_day_idx
  on public.user_journey_day_status(player_name, day_number);
create index if not exists user_journey_day_status_status_idx on public.user_journey_day_status(status);
create index if not exists user_journey_day_status_completed_date_idx on public.user_journey_day_status(completed_date);

create unique index if not exists journey_days_day_number_uidx on public.journey_days(day_number);
create index if not exists journey_days_day_number_idx on public.journey_days(day_number);
create index if not exists journey_days_active_idx on public.journey_days(active);
create index if not exists journey_quiz_questions_day_number_idx on public.journey_quiz_questions(day_number);
create index if not exists journey_quiz_questions_day_order_idx on public.journey_quiz_questions(day_number, question_order);
create index if not exists app_events_event_name_idx on public.app_events(event_name);
create index if not exists app_events_user_id_idx on public.app_events(user_id);
create index if not exists app_events_created_at_idx on public.app_events(created_at desc);

alter table public.journey_days enable row level security;
alter table public.journey_quiz_questions enable row level security;
alter table public.user_journey_progress enable row level security;
alter table public.user_journey_day_status enable row level security;
alter table public.profiles enable row level security;
alter table public.daily_results enable row level security;
alter table public.site_stats enable row level security;
alter table public.app_events enable row level security;

drop policy if exists "anon_select_journey_days" on public.journey_days;
drop policy if exists "anon_select_journey_quiz_questions" on public.journey_quiz_questions;
drop policy if exists "anon_select_user_journey_progress" on public.user_journey_progress;
drop policy if exists "anon_insert_user_journey_progress" on public.user_journey_progress;
drop policy if exists "anon_update_user_journey_progress" on public.user_journey_progress;
drop policy if exists "anon_select_user_journey_day_status" on public.user_journey_day_status;
drop policy if exists "anon_insert_user_journey_day_status" on public.user_journey_day_status;
drop policy if exists "anon_update_user_journey_day_status" on public.user_journey_day_status;
drop policy if exists "anon_select_profiles" on public.profiles;
drop policy if exists "anon_insert_profiles" on public.profiles;
drop policy if exists "anon_update_profiles" on public.profiles;
drop policy if exists "anon_select_daily_results" on public.daily_results;
drop policy if exists "anon_insert_daily_results" on public.daily_results;
drop policy if exists "anon_update_daily_results" on public.daily_results;
drop policy if exists "anon_select_site_stats" on public.site_stats;
drop policy if exists "anon_insert_site_stats" on public.site_stats;
drop policy if exists "anon_update_site_stats" on public.site_stats;
drop policy if exists "anon_insert_app_events" on public.app_events;

create policy "anon_select_journey_days"
on public.journey_days
for select
to anon
using (active = true);

create policy "anon_select_journey_quiz_questions"
on public.journey_quiz_questions
for select
to anon
using (true);

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

create policy "anon_select_user_journey_day_status"
on public.user_journey_day_status
for select
to anon
using (true);

create policy "anon_insert_user_journey_day_status"
on public.user_journey_day_status
for insert
to anon
with check (true);

create policy "anon_update_user_journey_day_status"
on public.user_journey_day_status
for update
to anon
using (true)
with check (true);

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

create policy "anon_select_daily_results"
on public.daily_results
for select
to anon
using (true);

create policy "anon_insert_daily_results"
on public.daily_results
for insert
to anon
with check (true);

create policy "anon_update_daily_results"
on public.daily_results
for update
to anon
using (true)
with check (true);

create policy "anon_select_site_stats"
on public.site_stats
for select
to anon
using (true);

create policy "anon_insert_site_stats"
on public.site_stats
for insert
to anon
with check (true);

create policy "anon_update_site_stats"
on public.site_stats
for update
to anon
using (id = 'global')
with check (id = 'global');

create policy "anon_insert_app_events"
on public.app_events
for insert
to anon
with check (true);

grant usage on schema public to anon;
grant select on public.journey_days to anon;
grant select on public.journey_quiz_questions to anon;
grant select, insert, update on public.user_journey_progress to anon;
grant select, insert, update on public.user_journey_day_status to anon;
grant select, insert, update on public.profiles to anon;
grant select, insert, update on public.daily_results to anon;
grant select, insert, update on public.site_stats to anon;
grant insert on public.app_events to anon;
