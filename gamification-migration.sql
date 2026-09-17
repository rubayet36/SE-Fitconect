-- ============================================================
-- FitConnect Gamification Migration
-- Team Member 1 — Database Architect & Backend API Lead
-- Branch: feature/gamification-database-api
-- ============================================================

-- ─────────────────────────────────────────────
-- TABLE 1: exercise_logs
-- Stores exercises submitted by members for trainer approval.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trainer_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_name   TEXT        NOT NULL,
  exercise_db_id  TEXT,
  sets_completed  INTEGER     NOT NULL DEFAULT 1,
  reps_completed  TEXT        NOT NULL DEFAULT '10',
  duration_mins   INTEGER,
  notes           TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'approved', 'rejected')),
  points_awarded  INTEGER     NOT NULL DEFAULT 0,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TABLE 2: member_points
-- Tracks cumulative points per member (leaderboard source of truth).
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.member_points (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id      UUID        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_points   INTEGER     NOT NULL DEFAULT 0,
  weekly_points  INTEGER     NOT NULL DEFAULT 0,
  monthly_points INTEGER     NOT NULL DEFAULT 0,
  streak_days    INTEGER     NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TABLE 3: point_transactions
-- Immutable audit log — every point earned/deducted is recorded here.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_log_id UUID        REFERENCES public.exercise_logs(id) ON DELETE SET NULL,
  points          INTEGER     NOT NULL,
  reason          TEXT        NOT NULL,
  awarded_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TABLE 4: badges
-- Badge definitions (seeded by owner/system).
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badges (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  description      TEXT        NOT NULL,
  icon_emoji       TEXT        NOT NULL DEFAULT '🏅',
  points_required  INTEGER     NOT NULL DEFAULT 100,
  badge_type       TEXT        NOT NULL DEFAULT 'milestone'
                               CHECK (badge_type IN ('milestone', 'streak', 'special')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default badges
INSERT INTO public.badges (name, description, icon_emoji, points_required, badge_type) VALUES
  ('First Rep',      'Logged your very first exercise!',       '🌱', 10,   'milestone'),
  ('On Fire',        'Earned 100 points total',                '🔥', 100,  'milestone'),
  ('Iron Will',      'Earned 500 points total',                '💪', 500,  'milestone'),
  ('Elite Athlete',  'Earned 1000 points total',               '🏆', 1000, 'milestone'),
  ('3-Day Streak',   'Worked out 3 days in a row',             '⚡', 0,   'streak'),
  ('7-Day Streak',   'Worked out 7 days in a row',             '🌟', 0,   'streak'),
  ('30-Day Legend',  'Worked out 30 days in a row',            '👑', 0,   'streak')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- TABLE 5: member_badges
-- Junction table — which badges each member has earned.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.member_badges (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id   UUID        NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, badge_id)
);

-- ============================================================
-- TASK 2: Point Award Logic (Trigger Function)
-- Called automatically when a trainer approves an exercise log.
-- ============================================================
CREATE OR REPLACE FUNCTION public.award_points_on_approval()
RETURNS TRIGGER AS $$
DECLARE
  pts INTEGER;
BEGIN
  -- Calculate points: base 10 + 2 per set + bonus for duration >= 30 mins
  pts := 10 + (NEW.sets_completed * 2);
  IF NEW.duration_mins IS NOT NULL AND NEW.duration_mins >= 30 THEN
    pts := pts + 5;
  END IF;

  -- Update the log with points awarded and review timestamp
  NEW.points_awarded := pts;
  NEW.reviewed_at := now();

  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- Insert or update member_points
    INSERT INTO public.member_points (member_id, total_points, weekly_points, monthly_points, streak_days, last_activity_date)
    VALUES (NEW.member_id, pts, pts, pts, 1, CURRENT_DATE)
    ON CONFLICT (member_id) DO UPDATE SET
      total_points       = member_points.total_points + pts,
      weekly_points      = member_points.weekly_points + pts,
      monthly_points     = member_points.monthly_points + pts,
      streak_days        = CASE
                             WHEN member_points.last_activity_date = CURRENT_DATE - INTERVAL '1 day'
                             THEN member_points.streak_days + 1
                             ELSE 1
                           END,
      last_activity_date = CURRENT_DATE,
      updated_at         = now();

    -- Immutable audit log
    INSERT INTO public.point_transactions (member_id, exercise_log_id, points, reason, awarded_by)
    VALUES (NEW.member_id, NEW.id, pts, 'Exercise approved: ' || NEW.exercise_name, NEW.trainer_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_exercise_approved ON public.exercise_logs;
CREATE TRIGGER on_exercise_approved
  BEFORE UPDATE ON public.exercise_logs
  FOR EACH ROW EXECUTE PROCEDURE public.award_points_on_approval();

-- ============================================================
-- Badge auto-award function
-- Checks milestone badges after points are updated
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
  badge_rec RECORD;
BEGIN
  -- Check milestone badges based on total_points
  FOR badge_rec IN
    SELECT b.id
    FROM public.badges b
    WHERE b.badge_type = 'milestone'
      AND b.points_required <= NEW.total_points
      AND NOT EXISTS (
        SELECT 1 FROM public.member_badges mb
        WHERE mb.member_id = NEW.member_id AND mb.badge_id = b.id
      )
  LOOP
    INSERT INTO public.member_badges (member_id, badge_id)
    VALUES (NEW.member_id, badge_rec.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Check streak badges
  FOR badge_rec IN
    SELECT b.id, b.name
    FROM public.badges b
    WHERE b.badge_type = 'streak'
      AND (
        (b.name = '3-Day Streak'  AND NEW.streak_days >= 3)  OR
        (b.name = '7-Day Streak'  AND NEW.streak_days >= 7)  OR
        (b.name = '30-Day Legend' AND NEW.streak_days >= 30)
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.member_badges mb
        WHERE mb.member_id = NEW.member_id AND mb.badge_id = b.id
      )
  LOOP
    INSERT INTO public.member_badges (member_id, badge_id)
    VALUES (NEW.member_id, badge_rec.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_points_updated ON public.member_points;
CREATE TRIGGER on_points_updated
  AFTER INSERT OR UPDATE ON public.member_points
  FOR EACH ROW EXECUTE PROCEDURE public.check_and_award_badges();

-- ============================================================
-- TASK 3: Row Level Security Policies
-- ============================================================

-- ── exercise_logs ──────────────────────────────────────────
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can insert own logs"
  ON public.exercise_logs FOR INSERT
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Members and trainers can view logs"
  ON public.exercise_logs FOR SELECT
  USING (auth.uid() = member_id OR auth.uid() = trainer_id);

CREATE POLICY "Trainers can approve/reject logs"
  ON public.exercise_logs FOR UPDATE
  USING (auth.uid() = trainer_id);

-- ── member_points (leaderboard is public to all authenticated users) ──
ALTER TABLE public.member_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view points"
  ON public.member_points FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "System can manage member_points"
  ON public.member_points FOR ALL
  USING (auth.uid() = member_id);

-- ── point_transactions ─────────────────────────────────────
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own transactions"
  ON public.point_transactions FOR SELECT
  USING (auth.uid() = member_id);

-- ── badges ─────────────────────────────────────────────────
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  USING (auth.role() = 'authenticated');

-- ── member_badges ──────────────────────────────────────────
ALTER TABLE public.member_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can view earned badges"
  ON public.member_badges FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "System inserts member badges"
  ON public.member_badges FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Weekly/Monthly Points Reset
-- Run this as a Supabase Scheduled Function (pg_cron):
--
--   Weekly reset (every Monday at midnight UTC):
--     SELECT cron.schedule('reset-weekly-points', '0 0 * * 1',
--       'UPDATE public.member_points SET weekly_points = 0, updated_at = now()');
--
--   Monthly reset (1st of each month at midnight UTC):
--     SELECT cron.schedule('reset-monthly-points', '0 0 1 * *',
--       'UPDATE public.member_points SET monthly_points = 0, updated_at = now()');
--
-- Alternatively, call these from a Next.js cron route (Vercel Cron Jobs):
--   GET /api/gamification/reset-points?type=weekly  (every Monday)
--   GET /api/gamification/reset-points?type=monthly (1st of month)
-- ============================================================
