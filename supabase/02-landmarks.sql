-- Ink Crossing: landmark claims. Run this once in the Supabase SQL Editor (after 01-feedback.sql).
-- Every win at a landmark adds a row: the captain's name and their hold at that moment (the ghost the next captain fights).
-- The game reads the newest row for a landmark. Anyone may read; each anonymous player may only add rows as themselves.
create table if not exists crossing_landmarks (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  player_id uuid not null default auth.uid(),
  landmark text not null check (char_length(landmark) between 1 and 40),
  captain text not null check (char_length(captain) between 1 and 20),
  ship text not null check (char_length(ship) between 1 and 20),
  sea int not null check (sea between 1 and 3),
  ghost jsonb not null check (pg_column_size(ghost) < 4000),
  version text
);
create index if not exists crossing_landmarks_by_landmark on crossing_landmarks (landmark, created_at desc);
alter table crossing_landmarks enable row level security;
drop policy if exists "anyone reads landmark claims" on crossing_landmarks;
create policy "anyone reads landmark claims" on crossing_landmarks for select using (true);
drop policy if exists "players add their own claims" on crossing_landmarks;
create policy "players add their own claims" on crossing_landmarks for insert with check (auth.uid() = player_id);
