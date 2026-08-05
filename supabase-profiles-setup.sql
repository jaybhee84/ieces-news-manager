-- ============================================================
-- IECES News Manager — Profiles & Allowed Users Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Run AFTER supabase-setup.sql
-- ============================================================

-- 1. Allowed users whitelist (admin adds emails here)
create table if not exists public.allowed_users (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  added_at   timestamptz default now()
);

alter table public.allowed_users enable row level security;

-- Anyone can check if their email is allowed (needed for registration)
create policy "Public read allowed_users"
  on public.allowed_users for select
  using (true);

-- Only authenticated admins can insert/delete
create policy "Auth manage allowed_users"
  on public.allowed_users for all
  to authenticated
  using (true)
  with check (true);

-- 2. Profiles table (stores name, username linked to auth.users)
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text unique not null,
  username       text unique not null,
  family_name    text not null,
  first_name     text not null,
  middle_initial text,
  created_at     timestamptz default now()
);

alter table public.profiles enable row level security;

-- Public read so login-by-username lookup works
create policy "Public read profiles"
  on public.profiles for select
  using (true);

-- Users can only insert their own profile
create policy "Insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- ============================================================
-- HOW TO ADD ALLOWED USERS (as admin):
-- In Supabase → SQL Editor, run:
--
--   insert into public.allowed_users (email)
--   values ('teacher@deped.gov.ph');
--
-- Or go to Table Editor → allowed_users → Insert Row
-- ============================================================
