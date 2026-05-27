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
  content text not null,
  estimated_minutes integer default 10,
  created_at timestamp default now()
);

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

alter table bible_readings enable row level security;
alter table user_bible_progress enable row level security;
alter table user_reading_history enable row level security;
alter table user_calendar_status enable row level security;

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

insert into bible_readings (order_index, book, chapter_start, reference, title, content, estimated_minutes)
values
  (1, 'Mateus', 1, 'Mateus 1', 'A genealogia e o nascimento de Jesus', 'Conteudo temporario para MVP. Substituir por texto biblico com licenca autorizada antes de publicar a leitura integral.', 10),
  (2, 'Mateus', 2, 'Mateus 2', 'Os magos, a fuga e o retorno', 'Conteudo temporario para MVP. Substituir por texto biblico com licenca autorizada antes de publicar a leitura integral.', 10),
  (3, 'Mateus', 3, 'Mateus 3', 'Joao Batista prepara o caminho', 'Conteudo temporario para MVP. Substituir por texto biblico com licenca autorizada antes de publicar a leitura integral.', 8),
  (4, 'Mateus', 4, 'Mateus 4', 'Jesus no deserto e o inicio da missao', 'Conteudo temporario para MVP. Substituir por texto biblico com licenca autorizada antes de publicar a leitura integral.', 10),
  (5, 'Mateus', 5, 'Mateus 5', 'O sermao da montanha', 'Conteudo temporario para MVP. Substituir por texto biblico com licenca autorizada antes de publicar a leitura integral.', 12)
on conflict (order_index) do nothing;
