create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint journey_days_day_number_range check (day_number between 1 and 365),
  constraint journey_days_minutes_positive check (estimated_minutes > 0),
  constraint journey_days_xp_non_negative check (reading_xp >= 0 and quiz_xp >= 0 and word_xp >= 0),
  constraint journey_days_word_5_letters check (char_length(normalized_faith_word) = 5),
  constraint journey_days_chapter_positive check (chapter_start is null or chapter_start > 0),
  constraint journey_days_chapter_end_positive check (chapter_end is null or chapter_end > 0),
  constraint journey_days_verse_positive check (verse_start is null or verse_start > 0),
  constraint journey_days_verse_end_positive check (verse_end is null or verse_end > 0)
);

create table if not exists public.journey_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  journey_day_id uuid not null references public.journey_days(id) on delete cascade,
  day_number integer not null,
  question_order integer not null,
  question text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  correct_option text not null,
  explanation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint journey_quiz_day_number_range check (day_number between 1 and 365),
  constraint journey_quiz_order_range check (question_order between 1 and 3),
  constraint journey_quiz_correct_option_valid check (correct_option in ('A', 'B', 'C')),
  constraint journey_quiz_unique_day_order unique (day_number, question_order)
);

create table if not exists public.user_journey_progress (
  id uuid primary key default gen_random_uuid(),
  user_id text unique,
  player_name text not null,
  journey_start_date date not null default current_date,
  current_journey_day integer not null default 1,
  highest_unlocked_day integer not null default 1,
  completed_days integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  total_xp integer not null default 0,
  weekly_xp integer not null default 0,
  last_completed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_journey_player_name_not_blank check (char_length(trim(player_name)) > 0),
  constraint user_journey_current_day_range check (current_journey_day between 1 and 365),
  constraint user_journey_highest_day_range check (highest_unlocked_day between 1 and 365),
  constraint user_journey_completed_days_range check (completed_days between 0 and 365),
  constraint user_journey_streak_non_negative check (current_streak >= 0 and best_streak >= 0),
  constraint user_journey_xp_non_negative check (total_xp >= 0 and weekly_xp >= 0)
);

create table if not exists public.user_journey_day_status (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  player_name text not null,
  day_number integer not null,
  status text not null,
  reading_completed boolean not null default false,
  quiz_completed boolean not null default false,
  word_completed boolean not null default false,
  total_xp_earned integer not null default 0,
  completed_at timestamptz,
  completed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_journey_day_unique unique (user_id, day_number),
  constraint user_journey_day_player_name_not_blank check (char_length(trim(player_name)) > 0),
  constraint user_journey_day_number_range check (day_number between 1 and 365),
  constraint user_journey_day_status_valid check (status in ('locked', 'available', 'pending', 'completed')),
  constraint user_journey_day_xp_non_negative check (total_xp_earned >= 0),
  constraint user_journey_day_completed_consistency check (
    status <> 'completed'
    or (reading_completed = true and quiz_completed = true and word_completed = true)
  )
);

alter table public.user_journey_progress add column if not exists user_id text;
alter table public.user_journey_progress add column if not exists local_user_id text;
alter table public.user_journey_day_status add column if not exists user_id text;
alter table public.user_journey_day_status add column if not exists local_user_id text;

alter table public.user_journey_progress drop constraint if exists user_journey_progress_player_name_key;
alter table public.user_journey_day_status drop constraint if exists user_journey_day_status_player_name_day_number_key;
alter table public.user_journey_day_status drop constraint if exists user_journey_day_unique;
create unique index if not exists idx_user_journey_progress_user_id_unique
  on public.user_journey_progress(user_id)
  where user_id is not null;
create unique index if not exists idx_user_journey_day_status_user_day_unique
  on public.user_journey_day_status(user_id, day_number)
  where user_id is not null;

create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id text,
  player_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint app_events_event_name_not_blank check (char_length(trim(event_name)) > 0)
);

alter table if exists public.profiles add column if not exists user_id text;
alter table if exists public.profiles add column if not exists local_user_id text;
create index if not exists idx_profiles_user_id on public.profiles(user_id);

create index if not exists idx_journey_days_day_number on public.journey_days(day_number);
create index if not exists idx_journey_days_active on public.journey_days(active);
create index if not exists idx_journey_days_reference on public.journey_days(bible_reference);

create index if not exists idx_journey_quiz_day_number on public.journey_quiz_questions(day_number);
create index if not exists idx_journey_quiz_journey_day_id on public.journey_quiz_questions(journey_day_id);

create index if not exists idx_user_journey_progress_player_name on public.user_journey_progress(player_name);
create index if not exists idx_user_journey_progress_user_id on public.user_journey_progress(user_id);
create index if not exists idx_user_journey_progress_weekly_xp on public.user_journey_progress(weekly_xp desc);

create index if not exists idx_user_journey_day_status_player_name on public.user_journey_day_status(player_name);
create index if not exists idx_user_journey_day_status_user_id on public.user_journey_day_status(user_id);
create index if not exists idx_user_journey_day_status_player_day on public.user_journey_day_status(player_name, day_number);
create index if not exists idx_user_journey_day_status_status on public.user_journey_day_status(status);
create index if not exists idx_user_journey_day_status_completed_date on public.user_journey_day_status(completed_date);
create index if not exists idx_app_events_event_name on public.app_events(event_name);
create index if not exists idx_app_events_user_id on public.app_events(user_id);
create index if not exists idx_app_events_created_at on public.app_events(created_at desc);

drop trigger if exists trg_journey_days_updated_at on public.journey_days;
create trigger trg_journey_days_updated_at
before update on public.journey_days
for each row execute function public.set_updated_at();

drop trigger if exists trg_journey_quiz_questions_updated_at on public.journey_quiz_questions;
create trigger trg_journey_quiz_questions_updated_at
before update on public.journey_quiz_questions
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_journey_progress_updated_at on public.user_journey_progress;
create trigger trg_user_journey_progress_updated_at
before update on public.user_journey_progress
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_journey_day_status_updated_at on public.user_journey_day_status;
create trigger trg_user_journey_day_status_updated_at
before update on public.user_journey_day_status
for each row execute function public.set_updated_at();

alter table public.journey_days enable row level security;
alter table public.journey_quiz_questions enable row level security;
alter table public.user_journey_progress enable row level security;
alter table public.user_journey_day_status enable row level security;
alter table public.app_events enable row level security;

drop policy if exists "anon_select_journey_days" on public.journey_days;
drop policy if exists "anon_select_journey_quiz_questions" on public.journey_quiz_questions;
drop policy if exists "anon_select_user_journey_progress" on public.user_journey_progress;
drop policy if exists "anon_insert_user_journey_progress" on public.user_journey_progress;
drop policy if exists "anon_update_user_journey_progress" on public.user_journey_progress;
drop policy if exists "anon_select_user_journey_day_status" on public.user_journey_day_status;
drop policy if exists "anon_insert_user_journey_day_status" on public.user_journey_day_status;
drop policy if exists "anon_update_user_journey_day_status" on public.user_journey_day_status;
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
grant insert on public.app_events to anon;
