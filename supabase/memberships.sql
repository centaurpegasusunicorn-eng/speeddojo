-- Run this once in the Supabase SQL Editor (adds paid memberships)
--
-- One row per paying student. Only the server can write here (using the
-- secret service key, after Stripe confirms a payment). Students can read
-- their own row but can't change it, so nobody can unlock themselves.

create table if not exists memberships (
  user_id uuid primary key references auth.users on delete cascade,
  access_until timestamptz,             -- full access until this moment
  stripe_customer_id text,
  stripe_subscription_id text,
  last_checkout_session text,           -- stops one payment counting twice
  updated_at timestamptz default now()
);

alter table memberships enable row level security;

drop policy if exists "Users can view own membership" on memberships;
create policy "Users can view own membership"
  on memberships for select using (auth.uid() = user_id);
