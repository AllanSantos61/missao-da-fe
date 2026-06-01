alter table public.user_journey_day_status
add column if not exists word_attempts_history jsonb default '[]'::jsonb;

alter table public.user_journey_day_status
add column if not exists word_result jsonb;

alter table public.user_journey_day_status
add column if not exists word_attempts integer default 0;

alter table public.user_journey_day_status
add column if not exists word_completed boolean default false;

create index if not exists user_journey_day_status_word_completed_idx
on public.user_journey_day_status(word_completed);
