-- Missão da Fé - Supabase Auth e vínculo de progresso
-- Execute no Supabase SQL Editor.

alter table public.profiles
  add column if not exists auth_user_id uuid,
  add column if not exists local_user_id text,
  add column if not exists player_name text,
  add column if not exists email text,
  add column if not exists is_admin boolean default false;

alter table public.user_journey_progress
  add column if not exists auth_user_id uuid,
  add column if not exists local_user_id text;

alter table public.user_journey_day_status
  add column if not exists auth_user_id uuid,
  add column if not exists local_user_id text;

alter table public.daily_results
  add column if not exists auth_user_id uuid,
  add column if not exists local_user_id text;

alter table public.public_results
  add column if not exists auth_user_id uuid,
  add column if not exists local_user_id text;

create index if not exists profiles_auth_user_id_idx on public.profiles(auth_user_id);
create index if not exists profiles_local_user_id_idx on public.profiles(local_user_id);
create index if not exists progress_auth_user_id_idx on public.user_journey_progress(auth_user_id);
create index if not exists progress_local_user_id_idx on public.user_journey_progress(local_user_id);
create index if not exists journey_day_status_auth_user_id_idx on public.user_journey_day_status(auth_user_id);
create index if not exists journey_day_status_local_user_id_idx on public.user_journey_day_status(local_user_id);
create index if not exists daily_results_auth_user_id_idx on public.daily_results(auth_user_id);
create index if not exists daily_results_local_user_id_idx on public.daily_results(local_user_id);
create index if not exists public_results_auth_user_id_idx on public.public_results(auth_user_id);
create index if not exists public_results_local_user_id_idx on public.public_results(local_user_id);

create unique index if not exists profiles_auth_user_id_unique_idx
  on public.profiles(auth_user_id)
  where auth_user_id is not null;

alter table public.profiles enable row level security;
alter table public.user_journey_progress enable row level security;
alter table public.user_journey_day_status enable row level security;
alter table public.daily_results enable row level security;
alter table public.public_results enable row level security;

drop policy if exists "profiles anon read own or public mvp" on public.profiles;
create policy "profiles anon read own or public mvp"
on public.profiles for select
to anon, authenticated
using (true);

drop policy if exists "profiles anon upsert mvp" on public.profiles;
create policy "profiles anon upsert mvp"
on public.profiles for insert
to anon, authenticated
with check (true);

drop policy if exists "profiles anon update mvp" on public.profiles;
create policy "profiles anon update mvp"
on public.profiles for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "journey progress anon read mvp" on public.user_journey_progress;
create policy "journey progress anon read mvp"
on public.user_journey_progress for select
to anon, authenticated
using (true);

drop policy if exists "journey progress anon insert mvp" on public.user_journey_progress;
create policy "journey progress anon insert mvp"
on public.user_journey_progress for insert
to anon, authenticated
with check (true);

drop policy if exists "journey progress anon update mvp" on public.user_journey_progress;
create policy "journey progress anon update mvp"
on public.user_journey_progress for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "journey day anon read mvp" on public.user_journey_day_status;
create policy "journey day anon read mvp"
on public.user_journey_day_status for select
to anon, authenticated
using (true);

drop policy if exists "journey day anon insert mvp" on public.user_journey_day_status;
create policy "journey day anon insert mvp"
on public.user_journey_day_status for insert
to anon, authenticated
with check (true);

drop policy if exists "journey day anon update mvp" on public.user_journey_day_status;
create policy "journey day anon update mvp"
on public.user_journey_day_status for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "daily results anon read mvp" on public.daily_results;
create policy "daily results anon read mvp"
on public.daily_results for select
to anon, authenticated
using (true);

drop policy if exists "daily results anon insert mvp" on public.daily_results;
create policy "daily results anon insert mvp"
on public.daily_results for insert
to anon, authenticated
with check (true);

drop policy if exists "daily results anon update mvp" on public.daily_results;
create policy "daily results anon update mvp"
on public.daily_results for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "public results public read" on public.public_results;
create policy "public results public read"
on public.public_results for select
to anon, authenticated
using (true);

drop policy if exists "public results anon write mvp" on public.public_results;
create policy "public results anon write mvp"
on public.public_results for insert
to anon, authenticated
with check (true);

drop policy if exists "public results anon update mvp" on public.public_results;
create policy "public results anon update mvp"
on public.public_results for update
to anon, authenticated
using (true)
with check (true);
