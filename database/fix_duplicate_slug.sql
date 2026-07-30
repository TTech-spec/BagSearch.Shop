-- Fix duplicate profile_slug by generating new unique slug
-- Run this in your Supabase SQL Editor

-- Find and fix the specific duplicate slug
UPDATE public.users 
SET profile_slug = generate_profile_slug(full_name)
WHERE profile_slug = 'adekola-timothy';

-- Show what was updated
SELECT 
  user_id,
  full_name,
  profile_slug as old_slug,
  generate_profile_slug(full_name) as new_slug
FROM public.users 
WHERE profile_slug = 'adekola-timothy';

-- Alternative: Generate new slug for all duplicates (if there are many)
WITH duplicates AS (
  SELECT profile_slug, COUNT(*) as count
  FROM public.users 
  WHERE profile_slug IS NOT NULL
  GROUP BY profile_slug
  HAVING COUNT(*) > 1
)
UPDATE public.users 
SET profile_slug = profile_slug || '-' || (row_number + 1)
FROM (
  SELECT 
    profile_slug,
    ROW_NUMBER() OVER (PARTITION BY profile_slug ORDER BY user_id) as row_number
  FROM duplicates
) AS dup
WHERE public.users.profile_slug = dup.profile_slug;

-- Verify the fix
SELECT 'Duplicate slug fix completed!' as result;

-- Show updated user
SELECT 
  user_id,
  full_name,
  profile_slug,
  'https://bagsearch.ng/seller/' || profile_slug as profile_url
FROM public.users 
WHERE full_name LIKE '%Timothy%' 
  OR full_name LIKE '%Adekola%'
LIMIT 5;
