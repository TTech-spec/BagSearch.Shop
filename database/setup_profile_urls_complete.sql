-- COMPLETE PROFILE URL SYSTEM SETUP
-- Run this in your Supabase SQL Editor
-- This will add profile_slug column and set up custom URLs for all users

-- Step 1: Add profile_slug column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_slug TEXT;

-- Step 2: Create unique index to ensure no duplicate URLs
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_profile_slug 
ON public.users (profile_slug);

-- Step 3: Add comment to describe the column
COMMENT ON COLUMN public.users.profile_slug IS 'Custom profile URL slug for users (e.g., john-doe, luxury-bags)';

-- Step 4: Simple slug generation function
CREATE OR REPLACE FUNCTION generate_profile_slug(full_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Generate clean slug from full name
  base_slug := lower(
    regexp_replace(
      regexp_replace(full_name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
  
  -- Set initial slug
  slug := base_slug;
  
  -- Check if slug exists and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.users WHERE profile_slug = slug AND user_id != (SELECT user_id FROM auth.users WHERE id = current_setting('request.jwt.claim.sub', true)::uuid)) LOOP
    slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Auto-generate slug for new users
CREATE OR REPLACE FUNCTION auto_generate_profile_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_slug IS NULL OR NEW.profile_slug = '' THEN
    NEW.profile_slug := generate_profile_slug(
      COALESCE(NEW.full_name, NEW.email, 'user')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for new users
DROP TRIGGER IF EXISTS on_user_create_profile_slug ON public.users;

CREATE TRIGGER on_user_create_profile_slug
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_profile_slug();

-- Step 7: Generate slugs for existing users
UPDATE public.users 
SET profile_slug = generate_profile_slug(
  COALESCE(full_name, email, 'user')
)
WHERE profile_slug IS NULL OR profile_slug = '';

-- Step 8: Test the setup
SELECT 'Setup complete! Profile URL system is now ready.' as status;

-- Step 9: Show sample results
SELECT 
  user_id,
  full_name,
  email,
  profile_slug,
  CASE 
    WHEN profile_slug IS NOT NULL THEN 'Custom URL'
    ELSE 'Generated URL'
  END as url_type,
  CASE 
    WHEN profile_slug IS NOT NULL THEN 
      'https://bagsearch.ng/seller/' || profile_slug
    ELSE 
      'https://bagsearch.ng/seller/' || generate_profile_slug(full_name)
  END as profile_url
FROM public.users 
ORDER BY created_at DESC
LIMIT 10;

-- Step 10: Verify column exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'profile_slug';
