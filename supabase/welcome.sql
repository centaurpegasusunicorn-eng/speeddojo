-- Run this once in the Supabase SQL Editor (the welcome page + Day 1 photo)

-- Remembers that a student has been through the welcome, on any device
alter table profiles add column if not exists welcomed_at timestamptz;

-- Private storage for Day 1 photos. Each student's photo lives in a folder
-- named after their account, and only they can see, replace or delete it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('day1-photos', 'day1-photos', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "Day 1 photo: view own" on storage.objects;
create policy "Day 1 photo: view own" on storage.objects
  for select to authenticated
  using (bucket_id = 'day1-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Day 1 photo: add own" on storage.objects;
create policy "Day 1 photo: add own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'day1-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Day 1 photo: replace own" on storage.objects;
create policy "Day 1 photo: replace own" on storage.objects
  for update to authenticated
  using (bucket_id = 'day1-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Day 1 photo: delete own" on storage.objects;
create policy "Day 1 photo: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'day1-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
