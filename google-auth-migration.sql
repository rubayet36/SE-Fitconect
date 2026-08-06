-- ============================================================
-- VORTEX FITNESS CLUB — GOOGLE AUTH MIGRATION
-- Run this in Supabase Dashboard → SQL Editor → Run
--
-- This adds support for:
--   1. user_id_code column (Gym Member ID) on profiles
--   2. Updated trigger to capture Google avatar_url on signup
-- ============================================================


-- ============================================================
-- STEP 1: Add user_id_code column to profiles
-- ============================================================
-- This is the gym-assigned Member ID (e.g. "VFC-001")
-- Nullable because Google users won't have it until they fill the Setup Profile form

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_id_code TEXT DEFAULT NULL;

-- Optional: Add a unique constraint so no two members share the same Gym ID
-- (Uncomment if you want this enforced at DB level)
-- ALTER TABLE public.profiles
--   ADD CONSTRAINT profiles_user_id_code_unique UNIQUE (user_id_code);


-- ============================================================
-- STEP 2: Update the auto-create trigger to capture Google avatar
-- ============================================================
-- When Google signs up a user, their picture comes in raw_user_meta_data->>'avatar_url'
-- We update the trigger to capture that automatically.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',   -- Google sends 'name', not 'full_name'
      ''
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    NEW.raw_user_meta_data->>'avatar_url'   -- Google profile picture
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (no changes needed to the trigger itself)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================
-- STEP 3: Allow members to update their own user_id_code
-- ============================================================
-- The existing "Users can update own profile" policy already covers this
-- because it uses USING (auth.uid() = id) with no column restriction.
-- No additional policy change needed.


-- ============================================================
-- STEP 4: Verify the migration
-- ============================================================
-- Run this SELECT to confirm the column was added:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'profiles'
--   AND column_name = 'user_id_code';
-- Expected output: user_id_code | text | YES


-- ============================================================
-- DONE ✅
-- Now follow the Google Cloud + Supabase setup guide.
-- ============================================================
