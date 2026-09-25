-- Run this in Supabase SQL Editor to fix the infinite recursion RLS issue on profiles table:

-- 1. Replace SELECT policy with non-recursive policy
DROP POLICY IF EXISTS "Owner can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 2. Create security definer function (bypasses RLS recursion)
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  );
$$;

-- 3. Replace owner UPDATE policy
DROP POLICY IF EXISTS "Owner can update any profile" ON public.profiles;
CREATE POLICY "Owner can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 4. Ensure admin@vortex.com has role 'owner' in both profiles and auth metadata
UPDATE public.profiles
SET role = 'owner', status = 'active'
WHERE email = 'admin@vortex.com';
