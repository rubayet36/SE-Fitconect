-- ============================================================
-- FitConnect Owner User & Trainer Management Migration
-- Branch: feature/owner-user-trainer-management
-- ============================================================

-- 1. Add account status column to profiles (active, paused, blocked)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'paused', 'blocked'));

-- 2. Populate any existing nulls to 'active'
UPDATE public.profiles
SET status = 'active'
WHERE status IS NULL;

-- 3. Add trainer professional profile columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS certifications TEXT;

-- 4. Create index for fast filtering by role and status
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON public.profiles(role, status);

-- 5. Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Self update policy: Users can update their own profile details (bio, specialization, phone, etc.)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 7. Owner full update policy: Allows owners to modify any user's role and status
DROP POLICY IF EXISTS "Owner can update any profile" ON public.profiles;
CREATE POLICY "Owner can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
);

-- 8. Owner read policy: Ensure owners can view all profiles
DROP POLICY IF EXISTS "Owner can view all profiles" ON public.profiles;
CREATE POLICY "Owner can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
);
