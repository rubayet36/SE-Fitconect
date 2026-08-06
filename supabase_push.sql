-- Run this in your Supabase SQL Editor

-- 1. Ensure the email column exists (some early profiles might be missing it)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Add the push_subscription JSONB column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- 3. (Optional) Sync emails from auth.users if they are missing
UPDATE profiles 
SET email = (SELECT email FROM auth.users WHERE auth.users.id = profiles.id)
WHERE email IS NULL;
