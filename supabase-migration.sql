-- =====================================================
-- VORTEX FITNESS CLUB - Supabase Database Migration
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'trainer')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('diet', 'workout', 'both')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ROUTINES TABLE
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_label TEXT NOT NULL,
  exercise_db_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '10',
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. DIET_PLANS TABLE
CREATE TABLE IF NOT EXISTS public.diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_time TEXT NOT NULL,
  food_items TEXT NOT NULL,
  calories INTEGER,
  protein_g INTEGER,
  carbs_g INTEGER,
  fat_g INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ROUTINE_TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.routine_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_db_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  exercise_gif TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_db_id)
);

-- =====================================================
-- AUTO-CREATE PROFILE ON SIGN UP
-- =====================================================
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

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- PROFILES: users can read all (for trainer/member lists), update their own
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- REQUESTS: members can insert + read own, trainers can read + update theirs
CREATE POLICY "Members can create requests" ON public.requests
  FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Members can read own requests" ON public.requests
  FOR SELECT USING (auth.uid() = member_id OR auth.uid() = trainer_id);

CREATE POLICY "Trainers can update their requests" ON public.requests
  FOR UPDATE USING (auth.uid() = trainer_id);

-- ROUTINES: members read own, trainers read/write for their members
CREATE POLICY "Members can read own routines" ON public.routines
  FOR SELECT USING (auth.uid() = member_id OR auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert routines" ON public.routines
  FOR INSERT WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update routines" ON public.routines
  FOR UPDATE USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete routines" ON public.routines
  FOR DELETE USING (auth.uid() = trainer_id);

-- DIET_PLANS: same pattern as routines
CREATE POLICY "Users can read own diet plans" ON public.diet_plans
  FOR SELECT USING (auth.uid() = member_id OR auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert diet plans" ON public.diet_plans
  FOR INSERT WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update diet plans" ON public.diet_plans
  FOR UPDATE USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete diet plans" ON public.diet_plans
  FOR DELETE USING (auth.uid() = trainer_id);

-- ROUTINE_TEMPLATES: trainers manage their own
CREATE POLICY "Trainers manage own templates" ON public.routine_templates
  FOR ALL USING (auth.uid() = trainer_id)
  WITH CHECK (auth.uid() = trainer_id);

-- BOOKMARKS: users manage their own
CREATE POLICY "Users manage own bookmarks" ON public.bookmarks
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
