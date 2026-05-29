create extension if not exists "pgcrypto";

create table if not exists journey_days (
  id uuid primary key default gen_random_uuid(),
  day_number integer unique not null,
  title text not null,
  bible_reference text not null,
  bible_book text,
  chapter_start integer,
  verse_start integer,
  chapter_end integer,
  verse_end integer,
  estimated_minutes integer default 10,
  faith_word text not null,
  normalized_faith_word text not null,
  reading_xp integer default 40,
  quiz_xp integer default 45,
  word_xp integer default 35,
  active boolean default true,
  created_at timestamp default now()
);

create table if not exists journey_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  journey_day_id uuid references journey_days(id) on delete cascade,
  day_number integer not null,
  question_order integer not null,
  question text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  correct_option text not null check (correct_option in ('A', 'B', 'C')),
  explanation text,
  created_at timestamp default now(),
  unique (day_number, question_order)
);

create table if not exists user_journey_progress (
  id uuid primary key default gen_random_uuid(),
  player_name text not null unique,
  journey_start_date date not null default current_date,
  current_journey_day integer default 1,
  highest_unlocked_day integer default 1,
  completed_days integer default 0,
  current_streak integer default 0,
  best_streak integer default 0,
  total_xp integer default 0,
  weekly_xp integer default 0,
  last_completed_date date,
  last_access_date date,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists user_journey_day_status (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  day_number integer not null,
  status text not null check (status in ('locked', 'available', 'pending', 'completed')),
  reading_completed boolean default false,
  quiz_completed boolean default false,
  word_completed boolean default false,
  total_xp_earned integer default 0,
  completed_at timestamp,
  completed_date date,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique (player_name, day_number)
);

alter table journey_days enable row level security;
alter table journey_quiz_questions enable row level security;
alter table user_journey_progress enable row level security;
alter table user_journey_day_status enable row level security;

drop policy if exists "anon_select_journey_days" on journey_days;
drop policy if exists "anon_select_journey_quiz_questions" on journey_quiz_questions;
drop policy if exists "anon_select_user_journey_progress" on user_journey_progress;
drop policy if exists "anon_insert_user_journey_progress" on user_journey_progress;
drop policy if exists "anon_update_user_journey_progress" on user_journey_progress;
drop policy if exists "anon_select_user_journey_day_status" on user_journey_day_status;
drop policy if exists "anon_insert_user_journey_day_status" on user_journey_day_status;
drop policy if exists "anon_update_user_journey_day_status" on user_journey_day_status;

create policy "anon_select_journey_days" on journey_days for select to anon using (active = true);
create policy "anon_select_journey_quiz_questions" on journey_quiz_questions for select to anon using (true);

create policy "anon_select_user_journey_progress" on user_journey_progress for select to anon using (true);
create policy "anon_insert_user_journey_progress" on user_journey_progress for insert to anon with check (true);
create policy "anon_update_user_journey_progress" on user_journey_progress for update to anon using (true) with check (true);

create policy "anon_select_user_journey_day_status" on user_journey_day_status for select to anon using (true);
create policy "anon_insert_user_journey_day_status" on user_journey_day_status for insert to anon with check (true);
create policy "anon_update_user_journey_day_status" on user_journey_day_status for update to anon using (true) with check (true);
