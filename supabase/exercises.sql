-- Adds (or updates) all 12 exercises. Safe to run more than once.
-- Run in the Supabase SQL Editor: Project > SQL Editor > New query.
--
-- Why this matters: every logged rep must point at a row in this table, so
-- reps on an exercise that isn't listed here are rejected by the database.
--
-- The app itself reads names, videos and tempos from lib/mockData.ts.
-- This table only needs one row per exercise id. If you ever ADD an
-- exercise to lib/mockData.ts, add a matching line here and run it again.
-- Never change an id once students have logged reps against it.

insert into exercises (id, name, video_url, original_bpm) values
  ('shadow-strike', 'Shadow Strike', '/100.mp4',       60),
  ('silent-step',   'Silent Step',   '/100.mp4',       60),
  ('lesson-3',      'Exercise 3',    '/lesson-3.mp4',  80),
  ('lesson-4',      'Exercise 4',    '/lesson-4.mp4',  80),
  ('lesson-5',      'Exercise 5',    '/lesson-5.mp4',  80),
  ('lesson-6',      'Exercise 6',    '/lesson-6.mp4',  90),
  ('lesson-7',      'Exercise 7',    '/lesson-7.mp4',  90),
  ('lesson-8',      'Exercise 8',    '/lesson-8.mp4',  90),
  ('lesson-9',      'Exercise 9',    '/lesson-9.mp4',  100),
  ('lesson-10',     'Exercise 10',   '/lesson-10.mp4', 100),
  ('lesson-11',     'Exercise 11',   '/lesson-11.mp4', 100),
  ('lesson-12',     'Exercise 12',   '/lesson-12.mp4', 100)
on conflict (id) do update set
  name = excluded.name,
  video_url = excluded.video_url,
  original_bpm = excluded.original_bpm;
