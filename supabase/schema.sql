-- ============================================================================
-- Ohio Docket Hub — Supabase schema (Phase 1)
--
-- DRAFT — nothing here is live yet.
-- Run this in the Supabase SQL editor AFTER the (free) Supabase project has
-- been created. It creates the three Phase 1 tables in the `public` schema
-- and locks them down with row-level security so each signed-in user can
-- only see and change their own rows.
--
-- Notes:
-- - Users come from Supabase Auth (auth.users). There is no passwords table.
-- - RLS is the real security boundary: the anon key is safe to ship in the
--   frontend ONLY because these policies are enabled. The service-role key
--   bypasses RLS entirely — never put it in the app or share it publicly.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles: one row per user, keyed to the Supabase Auth user id.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- saved_cases: cases a user has bookmarked to follow.
-- `snapshot` keeps the last CourtCase payload the server returned (same
-- shape as the app's src/courts/types.ts CourtCase) so the saved list can
-- render before a fresh lookup runs.
-- ----------------------------------------------------------------------------
create table if not exists public.saved_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  county text not null,
  case_number text not null,
  title text,
  court text,
  last_status text,
  snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_cases_user_id_idx
  on public.saved_cases (user_id);

-- ----------------------------------------------------------------------------
-- alert_preferences: one row per user; email alerts are opt-in (default off).
-- ----------------------------------------------------------------------------
create table if not exists public.alert_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_alerts boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Row-level security: enable on all three tables, then per-user policies.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.saved_cases enable row level security;
alter table public.alert_preferences enable row level security;

-- profiles (owner key is `id`) ------------------------------------------------
drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles: delete own" on public.profiles;
create policy "profiles: delete own"
  on public.profiles for delete
  using (auth.uid() = id);

-- saved_cases (owner key is `user_id`) ---------------------------------------
drop policy if exists "saved_cases: select own" on public.saved_cases;
create policy "saved_cases: select own"
  on public.saved_cases for select
  using (auth.uid() = user_id);

drop policy if exists "saved_cases: insert own" on public.saved_cases;
create policy "saved_cases: insert own"
  on public.saved_cases for insert
  with check (auth.uid() = user_id);

drop policy if exists "saved_cases: update own" on public.saved_cases;
create policy "saved_cases: update own"
  on public.saved_cases for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saved_cases: delete own" on public.saved_cases;
create policy "saved_cases: delete own"
  on public.saved_cases for delete
  using (auth.uid() = user_id);

-- alert_preferences (owner key is `user_id`) ---------------------------------
drop policy if exists "alert_preferences: select own" on public.alert_preferences;
create policy "alert_preferences: select own"
  on public.alert_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "alert_preferences: insert own" on public.alert_preferences;
create policy "alert_preferences: insert own"
  on public.alert_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "alert_preferences: update own" on public.alert_preferences;
create policy "alert_preferences: update own"
  on public.alert_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "alert_preferences: delete own" on public.alert_preferences;
create policy "alert_preferences: delete own"
  on public.alert_preferences for delete
  using (auth.uid() = user_id);
