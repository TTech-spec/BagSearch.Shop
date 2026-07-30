-- SIMPLE PROFILE URL SETUP
-- Run this step by step in Supabase SQL Editor

-- Step 1: Add the column (run this first)
ALTER TABLE public.users 
ADD COLUMN profile_slug TEXT;

-- Step 2: Create unique index
CREATE UNIQUE INDEX idx_users_profile_slug 
ON public.users (profile_slug);

-- Step 3: Update existing users with simple slugs
UPDATE public.users 
SET profile_slug = 
  CASE 
    WHEN full_name IS NOT NULL THEN 'user-' || lower(regexp_replace(email, '[^a-zA-Z0-9]', '', 'g'))
    ELSE lower(regexp_replace(regexp_replace(full_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
  END
WHERE profile_slug IS NULL;

-- Step 4: Test the setup
SELECT 'Profile slug column added successfully!' as status;

-- Show sample results
SELECT 
  user_id,
  full_name,
  profile_slug,
  'https://bagsearch.ng/seller/' || profile_slug as profile_url
FROM public.users 
WHERE profile_slug IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
