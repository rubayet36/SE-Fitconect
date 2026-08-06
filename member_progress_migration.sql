-- ============================================================
-- FITCONNECT — MEMBER PROGRESS & LOG HISTORY MIGRATION
-- Run this script in Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. MEMBER BODY METRICS
CREATE TABLE IF NOT EXISTS public.member_body_metrics (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  weight_kg     NUMERIC(5,2),
  body_fat_pct  NUMERIC(4,1),
  chest_cm      NUMERIC(5,1),
  waist_cm      NUMERIC(5,1),
  biceps_cm     NUMERIC(5,1),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. MEMBER WORKOUT LOGS
CREATE TABLE IF NOT EXISTS public.member_workout_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  exercise_name   TEXT        NOT NULL,
  sets_completed  INTEGER     NOT NULL DEFAULT 1,
  reps_completed  TEXT        NOT NULL DEFAULT '10',
  weight_kg       NUMERIC(5,2),
  is_pr           BOOLEAN     NOT NULL DEFAULT false,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.member_body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_workout_logs ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR MEMBER_BODY_METRICS
CREATE POLICY "Members manage own body metrics"
  ON public.member_body_metrics FOR ALL
  USING (auth.uid() = member_id)
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Trainers view member body metrics"
  ON public.member_body_metrics FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('trainer', 'owner'))
  );

-- 4. RLS POLICIES FOR MEMBER_WORKOUT_LOGS
CREATE POLICY "Members manage own workout logs"
  ON public.member_workout_logs FOR ALL
  USING (auth.uid() = member_id)
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Trainers view member workout logs"
  ON public.member_workout_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('trainer', 'owner'))
  );
