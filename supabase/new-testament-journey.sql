create extension if not exists "pgcrypto";

create table if not exists bible_readings (
  id uuid primary key default gen_random_uuid(),
  order_index integer not null unique,
  testament text default 'novo_testamento',
  book text not null,
  chapter_start integer not null,
  verse_start integer,
  chapter_end integer,
  verse_end integer,
  reference text not null,
  title text,
  content text,
  source text,
  estimated_minutes integer default 10,
  active boolean default true,
  created_at timestamp default now()
);

alter table bible_readings add column if not exists source text;
alter table bible_readings add column if not exists active boolean default true;
alter table bible_readings alter column content drop not null;

create table if not exists user_bible_progress (
  id uuid primary key default gen_random_uuid(),
  player_name text not null unique,
  current_reading_index integer default 1,
  completed_readings integer default 0,
  total_readings integer default 365,
  current_streak integer default 0,
  best_streak integer default 0,
  last_completed_date date,
  missed_days integer default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists user_reading_history (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  reading_index integer not null,
  reading_reference text not null,
  completed_at timestamp default now(),
  completed_date date not null,
  xp_earned integer default 40,
  unique (player_name, reading_index)
);

create table if not exists user_calendar_status (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  calendar_date date not null,
  status text not null check (status in ('completed', 'missed', 'pending')),
  reading_index integer,
  xp_earned integer default 0,
  created_at timestamp default now(),
  unique (player_name, calendar_date)
);

create table if not exists reading_plan (
  id uuid primary key default gen_random_uuid(),
  day_number integer not null unique,
  reading_id uuid references bible_readings(id),
  reference text,
  book text,
  chapter_start integer,
  verse_start integer,
  chapter_end integer,
  verse_end integer,
  title text,
  estimated_minutes integer default 10,
  xp_reward integer default 40,
  active boolean default true
);

alter table reading_plan add column if not exists reference text;
alter table reading_plan add column if not exists book text;
alter table reading_plan add column if not exists chapter_start integer;
alter table reading_plan add column if not exists verse_start integer;
alter table reading_plan add column if not exists chapter_end integer;
alter table reading_plan add column if not exists verse_end integer;

create table if not exists user_journey_progress (
  id uuid primary key default gen_random_uuid(),
  player_name text not null unique,
  journey_start_date date not null default current_date,
  current_streak integer default 0,
  best_streak integer default 0,
  total_xp integer default 0,
  last_access_date date,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists user_journey_days (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  day_number integer not null,
  status text not null check (status in ('completed', 'pending', 'available', 'locked')),
  completed_at timestamp,
  completed_date date,
  xp_earned integer default 0,
  created_at timestamp default now(),
  unique (player_name, day_number)
);

alter table bible_readings enable row level security;
alter table user_bible_progress enable row level security;
alter table user_reading_history enable row level security;
alter table user_calendar_status enable row level security;
alter table reading_plan enable row level security;
alter table user_journey_progress enable row level security;
alter table user_journey_days enable row level security;

drop policy if exists "anon_select_bible_readings" on bible_readings;
drop policy if exists "anon_insert_bible_readings" on bible_readings;
drop policy if exists "anon_update_bible_readings" on bible_readings;
drop policy if exists "anon_select_user_bible_progress" on user_bible_progress;
drop policy if exists "anon_insert_user_bible_progress" on user_bible_progress;
drop policy if exists "anon_update_user_bible_progress" on user_bible_progress;
drop policy if exists "anon_select_user_reading_history" on user_reading_history;
drop policy if exists "anon_insert_user_reading_history" on user_reading_history;
drop policy if exists "anon_update_user_reading_history" on user_reading_history;
drop policy if exists "anon_select_user_calendar_status" on user_calendar_status;
drop policy if exists "anon_insert_user_calendar_status" on user_calendar_status;
drop policy if exists "anon_update_user_calendar_status" on user_calendar_status;
drop policy if exists "anon_select_reading_plan" on reading_plan;
drop policy if exists "anon_select_user_journey_progress" on user_journey_progress;
drop policy if exists "anon_insert_user_journey_progress" on user_journey_progress;
drop policy if exists "anon_update_user_journey_progress" on user_journey_progress;
drop policy if exists "anon_select_user_journey_days" on user_journey_days;
drop policy if exists "anon_insert_user_journey_days" on user_journey_days;
drop policy if exists "anon_update_user_journey_days" on user_journey_days;

create policy "anon_select_bible_readings" on bible_readings for select to anon using (true);
create policy "anon_insert_bible_readings" on bible_readings for insert to anon with check (true);
create policy "anon_update_bible_readings" on bible_readings for update to anon using (true) with check (true);

create policy "anon_select_user_bible_progress" on user_bible_progress for select to anon using (true);
create policy "anon_insert_user_bible_progress" on user_bible_progress for insert to anon with check (true);
create policy "anon_update_user_bible_progress" on user_bible_progress for update to anon using (true) with check (true);

create policy "anon_select_user_reading_history" on user_reading_history for select to anon using (true);
create policy "anon_insert_user_reading_history" on user_reading_history for insert to anon with check (true);
create policy "anon_update_user_reading_history" on user_reading_history for update to anon using (true) with check (true);

create policy "anon_select_user_calendar_status" on user_calendar_status for select to anon using (true);
create policy "anon_insert_user_calendar_status" on user_calendar_status for insert to anon with check (true);
create policy "anon_update_user_calendar_status" on user_calendar_status for update to anon using (true) with check (true);
create policy "anon_select_reading_plan" on reading_plan for select to anon using (active = true);

create policy "anon_select_user_journey_progress" on user_journey_progress for select to anon using (true);
create policy "anon_insert_user_journey_progress" on user_journey_progress for insert to anon with check (true);
create policy "anon_update_user_journey_progress" on user_journey_progress for update to anon using (true) with check (true);

create policy "anon_select_user_journey_days" on user_journey_days for select to anon using (true);
create policy "anon_insert_user_journey_days" on user_journey_days for insert to anon with check (true);
create policy "anon_update_user_journey_days" on user_journey_days for update to anon using (true) with check (true);

insert into bible_readings (order_index, book, chapter_start, reference, title, content, source, estimated_minutes)
values
  (1, 'Mateus', 1, 'Mateus 1', 'A genealogia e o nascimento de Jesus', null, 'Bible API (translation=almeida) sob demanda; texto nao armazenado no MVP.', 10),
  (2, 'Mateus', 2, 'Mateus 2', 'Os magos, a fuga e o retorno', null, 'Bible API (translation=almeida) sob demanda; texto nao armazenado no MVP.', 10),
  (3, 'Mateus', 3, 'Mateus 3', 'Joao Batista prepara o caminho', null, 'Bible API (translation=almeida) sob demanda; texto nao armazenado no MVP.', 8),
  (4, 'Mateus', 4, 'Mateus 4', 'Jesus no deserto e o inicio da missao', null, 'Bible API (translation=almeida) sob demanda; texto nao armazenado no MVP.', 10),
  (5, 'Mateus', 5, 'Mateus 5', 'O sermao da montanha', null, 'Bible API (translation=almeida) sob demanda; texto nao armazenado no MVP.', 12)
on conflict (order_index) do nothing;
