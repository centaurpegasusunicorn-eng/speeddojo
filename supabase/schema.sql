-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

-- Profiles: one row per user, extends Supabase's built-in auth.users
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  has_paid boolean default false,
  created_at timestamptz default now()
);

-- Exercises: the library of practice videos
create table exercises (
  id text primary key,            -- e.g. 'shadow-strike'
  name text not null,
  video_url text not null,
  original_bpm int not null
);

-- Reps: every single logged practice attempt
create table reps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  exercise_id text references exercises on delete cascade not null,
  bpm int not null,
  clean boolean not null,
  created_at timestamptz default now()
);

-- The 12 exercises are added by supabase/exercises.sql (run it after this file)

-- Row Level Security: students can only see/write their own reps and profile
alter table profiles enable row level security;
alter table reps enable row level security;
alter table exercises enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can view own reps"
  on reps for select using (auth.uid() = user_id);
create policy "Users can insert own reps"
  on reps for insert with check (auth.uid() = user_id);

create policy "Anyone signed in can view exercises"
  on exercises for select using (auth.role() = 'authenticated');

-- Auto-create a profile row whenever a new user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
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
