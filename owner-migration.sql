-- ============================================================
-- VORTEX FITNESS CLUB – DATABASE MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Allow 'owner' as a valid role value
--    (If your role column uses a CHECK constraint, this updates it)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('member', 'trainer', 'owner'));

  -- 2. Create gym_timetable table
  CREATE TABLE IF NOT EXISTS gym_timetable (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      day_label text NOT NULL,
        open_time text NOT NULL DEFAULT '6:00 AM',
          close_time text NOT NULL DEFAULT '10:00 PM',
            is_closed boolean NOT NULL DEFAULT false,
              display_order int NOT NULL DEFAULT 0,
                updated_at timestamptz NOT NULL DEFAULT now()
                );

                -- 3. Enable RLS on gym_timetable
                ALTER TABLE gym_timetable ENABLE ROW LEVEL SECURITY;

                DROP POLICY IF EXISTS "Anyone can view timetable" ON gym_timetable;
                CREATE POLICY "Anyone can view timetable" ON gym_timetable
                  FOR SELECT USING (true);

                  DROP POLICY IF EXISTS "Owner can manage timetable" ON gym_timetable;
                  CREATE POLICY "Owner can manage timetable" ON gym_timetable
                    FOR ALL USING (
                        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
                          );

                          -- 4. Seed default timetable rows
                          INSERT INTO gym_timetable (day_label, open_time, close_time, is_closed, display_order) VALUES
                            ('Monday – Friday', '6:00 AM', '10:00 PM', false, 1),
                              ('Saturday',        '7:00 AM', '8:00 PM',  false, 2),
                                ('Sunday',          '8:00 AM', '6:00 PM',  false, 3),
                                  ('Public Holidays', '8:00 AM', '4:00 PM',  false, 4)
                                  ON CONFLICT DO NOTHING;

                                  -- 5. Update gym_notices RLS: only owner can insert/delete
                                  --    (Keep SELECT open for everyone including members)
                                  DROP POLICY IF EXISTS "Anyone can view notices" ON gym_notices;
                                  CREATE POLICY "Anyone can view notices" ON gym_notices
                                    FOR SELECT USING (true);

                                    DROP POLICY IF EXISTS "Trainers can insert notices" ON gym_notices;
                                    DROP POLICY IF EXISTS "Trainers can delete notices" ON gym_notices;
                                    DROP POLICY IF EXISTS "Owner can insert notices" ON gym_notices;
                                    DROP POLICY IF EXISTS "Owner can delete notices" ON gym_notices;

                                    CREATE POLICY "Owner can insert notices" ON gym_notices
                                      FOR INSERT WITH CHECK (
                                          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
                                            );

                                            CREATE POLICY "Owner can delete notices" ON gym_notices
                                              FOR DELETE USING (
                                                  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
                                                    );

                                                    -- ============================================================
                                                    -- AFTER RUNNING THIS SQL:
                                                    -- 1. Go to Supabase Dashboard → Authentication → Users
                                                    -- 2. Click "Add User" (or "Invite user")
                                                    -- 3. Email: vortexfitnessclub001@gmail.com
                                                    -- 4. Password: Mahin@005
                                                    -- 5. Check "Auto Confirm User"
                                                    -- 6. Save the user
                                                    -- 7. Then call: POST /api/seed-owner  (from browser or curl)
                                                    --    This will set the profile row with role='owner'
                                                    -- ============================================================
                                                    