-- ============================================================
-- VORTEX FITNESS CLUB — FULL DATABASE SCHEMA
-- Run this entire file in your new Supabase SQL Editor
-- (Dashboard → SQL Editor → paste → Run)
-- ============================================================

-- ============================================================
-- SECTION 1: TABLES
-- ============================================================

-- 1a. PROFILES
--     Stores all users: members, trainers, and the owner
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  full_name   TEXT,
  role        TEXT        NOT NULL DEFAULT 'member'
                          CHECK (role IN ('member', 'trainer', 'owner')),
  avatar_url  TEXT,
  phone       TEXT,
  push_subscription JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1b. REQUESTS
--     Members request diet/workout/both plans from trainers
CREATE TABLE IF NOT EXISTS public.requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trainer_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_type TEXT        NOT NULL CHECK (request_type IN ('diet', 'workout', 'both')),
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'in_progress', 'completed')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1c. ROUTINES
--     Workout routines created by trainers for members
CREATE TABLE IF NOT EXISTS public.routines (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trainer_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_label       TEXT        NOT NULL,
  exercise_db_id  TEXT        NOT NULL,
  exercise_name   TEXT        NOT NULL,
  sets            INTEGER     NOT NULL DEFAULT 3,
  reps            TEXT        NOT NULL DEFAULT '10',
  notes           TEXT,
  order_index     INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1d. DIET_PLANS
--     Diet plans created by trainers for members
CREATE TABLE IF NOT EXISTS public.diet_plans (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trainer_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_time   TEXT        NOT NULL,
  food_items  TEXT        NOT NULL,
  calories    INTEGER,
  protein_g   INTEGER,
  carbs_g     INTEGER,
  fat_g       INTEGER,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1e. ROUTINE_TEMPLATES
--     Reusable workout templates saved by trainers
CREATE TABLE IF NOT EXISTS public.routine_templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  exercises   JSONB       NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1f. BOOKMARKS
--     Exercises bookmarked by any user
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_db_id  TEXT        NOT NULL,
  exercise_name   TEXT        NOT NULL,
  exercise_gif    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_db_id)
);

-- 1g. GYM_NOTICES
--     Announcements posted by the owner; visible to all members & trainers
CREATE TABLE IF NOT EXISTS public.gym_notices (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'info'
                          CHECK (type IN ('info', 'warning', 'success')),
  created_by  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1h. GYM_TIMETABLE
--     Gym opening hours, editable by the owner
CREATE TABLE IF NOT EXISTS public.gym_timetable (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  day_label     TEXT        NOT NULL,
  open_time     TEXT        NOT NULL DEFAULT '6:00 AM',
  close_time    TEXT        NOT NULL DEFAULT '10:00 PM',
  is_closed     BOOLEAN     NOT NULL DEFAULT false,
  display_order INTEGER     NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default timetable rows
INSERT INTO public.gym_timetable (day_label, open_time, close_time, is_closed, display_order) VALUES
  ('Monday – Friday', '6:00 AM', '10:00 PM', false, 1),
  ('Saturday',        '7:00 AM', '8:00 PM',  false, 2),
  ('Sunday',          '8:00 AM', '6:00 PM',  false, 3),
  ('Public Holidays', '8:00 AM', '4:00 PM',  false, 4)
ON CONFLICT DO NOTHING;


-- ============================================================
-- SECTION 2: TRIGGER — AUTO-CREATE PROFILE ON SIGN UP
--     Runs when a new user registers via Supabase Auth.
--     Defaults role to 'member' (signup page always passes 'member').
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_notices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_timetable     ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ─────────────────────────────────────────────────
-- Anyone authenticated can read profiles (needed for trainer/member lists)
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── REQUESTS ─────────────────────────────────────────────────
CREATE POLICY "Members can create requests"
  ON public.requests FOR INSERT
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Members and trainers can read requests"
  ON public.requests FOR SELECT
  USING (auth.uid() = member_id OR auth.uid() = trainer_id);

CREATE POLICY "Trainers can update their requests"
  ON public.requests FOR UPDATE
  USING (auth.uid() = trainer_id);

-- Owner can read all requests (for owner dashboard stats)
CREATE POLICY "Owner can read all requests"
  ON public.requests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- ── ROUTINES ─────────────────────────────────────────────────
CREATE POLICY "Members and trainers can read routines"
  ON public.routines FOR SELECT
  USING (auth.uid() = member_id OR auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert routines"
  ON public.routines FOR INSERT
  WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update routines"
  ON public.routines FOR UPDATE
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete routines"
  ON public.routines FOR DELETE
  USING (auth.uid() = trainer_id);

-- ── DIET_PLANS ───────────────────────────────────────────────
CREATE POLICY "Users can read own diet plans"
  ON public.diet_plans FOR SELECT
  USING (auth.uid() = member_id OR auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert diet plans"
  ON public.diet_plans FOR INSERT
  WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update diet plans"
  ON public.diet_plans FOR UPDATE
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete diet plans"
  ON public.diet_plans FOR DELETE
  USING (auth.uid() = trainer_id);

-- ── ROUTINE_TEMPLATES ────────────────────────────────────────
CREATE POLICY "Trainers manage own templates"
  ON public.routine_templates FOR ALL
  USING (auth.uid() = trainer_id)
  WITH CHECK (auth.uid() = trainer_id);

-- ── BOOKMARKS ────────────────────────────────────────────────
CREATE POLICY "Users manage own bookmarks"
  ON public.bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── GYM_NOTICES ──────────────────────────────────────────────
-- Everyone (authenticated) can read notices
CREATE POLICY "Anyone can view notices"
  ON public.gym_notices FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only the owner can post notices
CREATE POLICY "Owner can insert notices"
  ON public.gym_notices FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Only the owner can delete notices
CREATE POLICY "Owner can delete notices"
  ON public.gym_notices FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- ── GYM_TIMETABLE ────────────────────────────────────────────
-- Everyone can read
CREATE POLICY "Anyone can view timetable"
  ON public.gym_timetable FOR SELECT
  USING (true);

-- Only the owner can modify
CREATE POLICY "Owner can manage timetable"
  ON public.gym_timetable FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  );


-- ============================================================
-- SECTION 4: OWNER ACCOUNT SETUP
--
-- IMPORTANT: After running this SQL, do the following:
--
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User"
--    Email:    vortexfitnessclub001@gmail.com
--    Password: Mahin@005
--    ✅ Auto Confirm User → Save
--
-- 3. Then call POST /api/seed-owner from your app to create
--    the owner profile row with role='owner'.
--    (Open browser console: fetch('/api/seed-owner',{method:'POST'}))
--
-- OR run this SQL manually once you have the owner's auth user UUID:
--
--   INSERT INTO public.profiles (id, email, full_name, role)
--   VALUES (
--     '<PASTE-OWNER-UUID-HERE>',
--     'vortexfitnessclub001@gmail.com',
--     'Vortex Owner',
--     'owner'
--   )
--   ON CONFLICT (id) DO UPDATE SET role = 'owner';
--
-- ============================================================
