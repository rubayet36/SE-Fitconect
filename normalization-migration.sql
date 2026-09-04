-- ============================================================
-- FITCONNECT – NORMALIZATION MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. Routine plan header table ─────────────────────────────
CREATE TABLE IF NOT EXISTS routine_plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE routine_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers manage their own routine plans" ON routine_plans;
CREATE POLICY "Trainers manage their own routine plans"
  ON routine_plans FOR ALL
  USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Members read their own routine plans" ON routine_plans;
CREATE POLICY "Members read their own routine plans"
  ON routine_plans FOR SELECT
  USING (auth.uid() = member_id);

-- Add plan_id FK to routines (nullable — existing rows stay intact)
ALTER TABLE routines
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES routine_plans(id) ON DELETE SET NULL;

-- ── 2. Diet plan header table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS diet_plan_headers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE diet_plan_headers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers manage their own diet plan headers" ON diet_plan_headers;
CREATE POLICY "Trainers manage their own diet plan headers"
  ON diet_plan_headers FOR ALL
  USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Members read their own diet plan headers" ON diet_plan_headers;
CREATE POLICY "Members read their own diet plan headers"
  ON diet_plan_headers FOR SELECT
  USING (auth.uid() = member_id);

-- Add plan_id FK to diet_plans (nullable — existing rows stay intact)
ALTER TABLE diet_plans
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES diet_plan_headers(id) ON DELETE SET NULL;

-- ── 3. Routine template exercises child table ─────────────────
CREATE TABLE IF NOT EXISTS routine_template_exercises (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     uuid NOT NULL REFERENCES routine_templates(id) ON DELETE CASCADE,
  exercise_db_id  text NOT NULL,
  exercise_name   text NOT NULL,
  body_part       text,
  equipment       text,
  target          text,
  gif_url         text,
  sets            integer NOT NULL DEFAULT 3,
  reps            text    NOT NULL DEFAULT '10',
  notes           text,
  order_index     integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE routine_template_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers manage their own template exercises" ON routine_template_exercises;
CREATE POLICY "Trainers manage their own template exercises"
  ON routine_template_exercises FOR ALL
  USING (
    auth.uid() = (
      SELECT trainer_id FROM routine_templates WHERE id = template_id
    )
  );

-- ── 4. Migrate existing exercises JSON → child rows ───────────
-- Converts any existing routine_templates.exercises JSON arrays into rows.
-- Safe to run even if the column is empty or the table has no data.
INSERT INTO routine_template_exercises
  (template_id, exercise_db_id, exercise_name, body_part, equipment, target, gif_url, sets, reps, notes, order_index)
SELECT
  rt.id,
  COALESCE(ex->>'id', ex->>'exercise_db_id', ''),
  COALESCE(ex->>'name', ex->>'exercise_name', 'Exercise'),
  ex->>'bodyPart',
  ex->>'equipment',
  ex->>'target',
  COALESCE(ex->>'gifUrl', ex->>'gif_url'),
  COALESCE((ex->>'sets')::integer, 3),
  COALESCE(ex->>'reps', '10'),
  ex->>'notes',
  (row_number() OVER (PARTITION BY rt.id ORDER BY ordinality) - 1)::integer
FROM routine_templates rt,
     jsonb_array_elements(
       CASE
         WHEN jsonb_typeof(rt.exercises::jsonb) = 'array' THEN rt.exercises::jsonb
         ELSE '[]'::jsonb
       END
     ) WITH ORDINALITY AS ex(ex, ordinality)
WHERE rt.exercises IS NOT NULL
  AND rt.exercises::text NOT IN ('[]', 'null', '')
ON CONFLICT DO NOTHING;

-- ── 5. Drop the old exercises JSON column ─────────────────────
-- ONLY run after confirming migration above worked.
-- Quick check first: SELECT count(*) FROM routine_template_exercises;
ALTER TABLE routine_templates DROP COLUMN IF EXISTS exercises;
