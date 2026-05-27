create extension if not exists "pgcrypto";

create table if not exists faith_words (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  normalized_word text not null,
  category text,
  difficulty text default 'normal',
  active boolean default true,
  created_at timestamp default now()
);

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  correct_option text not null check (correct_option in ('A', 'B', 'C')),
  explanation text,
  difficulty text default 'normal',
  category text,
  active boolean default true,
  created_at timestamp default now()
);

alter table faith_words enable row level security;
alter table quiz_questions enable row level security;

drop policy if exists "anon_select_faith_words" on faith_words;
drop policy if exists "anon_select_quiz_questions" on quiz_questions;

create policy "anon_select_faith_words" on faith_words for select to anon using (active = true);
create policy "anon_select_quiz_questions" on quiz_questions for select to anon using (active = true);
-- Escrita deve ser feita por script/admin. Se for necessário sem service role no MVP,
-- crie policies temporárias de insert/update para anon e remova antes de produção.
