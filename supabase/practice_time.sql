-- Run this once in the Supabase SQL Editor (adds practice-time tracking)

create table practice_time (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  exercise_id text references exercises on delete cascade not null,
  seconds int not null check (seconds > 0),
  created_at timestamptz default now()
);

alter table practice_time enable row level security;

create policy "Users can view own practice time"
  on practice_time for select using (auth.uid() = user_id);
create policy "Users can insert own practice time"
  on practice_time for insert with check (auth.uid() = user_id);
