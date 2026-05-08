-- Add profile_slug column to users table for custom profile URLs
-- Run this in your Supabase SQL Editor

-- Add profile_slug column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_slug TEXT;

-- Create unique index on profile_slug to ensure uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_profile_slug 
ON public.users (profile_slug);

-- Add comment to describe the column
COMMENT ON COLUMN public.users.profile_slug IS 'Custom profile URL slug for users (e.g., john-doe, luxury-bags)';

-- Create function to generate unique profile slug if not provided
CREATE OR REPLACE FUNCTION generate_profile_slug(full_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Generate base slug from full name
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(
                    regexp_replace(
                      regexp_replace(
                        regexp_replace(
                          regexp_replace(
                            regexp_replace(
                              regexp_replace(
                                regexp_replace(
                                  regexp_replace(
                                    regexp_replace(
                                      regexp_replace(
                                        regexp_replace(
                                          regexp_replace(
                                            regexp_replace(
                                              regexp_replace(
                                                regexp_replace(
                                                  regexp_replace(
                                                    regexp_replace(
                                                      regexp_replace(
                                                        regexp_replace(
                                                          regexp_replace(
                                                            regexp_replace(
                                                              regexp_replace(
                                                                regexp_replace(
                                                                  regexp_replace(
                                                                    regexp_replace(
                                                                      regexp_replace(
                                                                        regexp_replace(
                                                                          regexp_replace(
                                                                            regexp_replace(
                                                                              regexp_replace(
                                                                                regexp_replace(
                                                                                  regexp_replace(
                                                                                    regexp_replace(
                                                                                      regexp_replace(full_name, '[^a-zA-Z0-9\s-]', '', 'g'),
                                                                                    '[_]+', '_',
                                                                                    'g'
                                                                                  ),
                                                                                  '_$', '',
                                                                                  'g'
                                                                                ),
                                                                                '^[_]+', '',
                                                                                'g'
                                                                              ),
                                                                              '\s+', '-',
                                                                              'g'
                                                                            ),
                                                                            '-+$', '',
                                                                            'g'
                                                                          ),
                                                                          '-+', '-',
                                                                          'g'
                                                                        ),
                                                                        '^-+', '',
                                                                        'g'
                                                                      ),
                                                                      '[^-a-zA-Z0-9]', '',
                                                                      'g'
                                                                    ),
                                                                    '--+', '-',
                                                                    'g'
                                                                  ),
                                                                  '-$', '',
                                                                  'g'
                                                                ),
                                                                '^[^a-zA-Z0-9]+', '',
                                                                'g'
                                                              )
                                                            ),
                                                            '--+', '-',
                                                            'g'
                                                          ),
                                                          '-$', '',
                                                          'g'
                                                        ),
                                                        '^[^a-zA-Z0-9]+', '',
                                                        'g'
                                                      )
                                                    ),
                                                    '--+', '-',
                                                    'g'
                                                  ),
                                                  '-$', '',
                                                  'g'
                                                ),
                                                '^[^a-zA-Z0-9]+', '',
                                                'g'
                                              )
                                            ),
                                            '--+', '-',
                                            'g'
                                          ),
                                          '-$', '',
                                          'g'
                                        ),
                                        '^[^a-zA-Z0-9]+', '',
                                        'g'
                                      )
                                    ),
                                    '--+', '-',
                                    'g'
                                  ),
                                  '-$', '',
                                  'g'
                                ),
                                '^[^a-zA-Z0-9]+', '',
                                'g'
                              )
                            ),
                            '--+', '-',
                            'g'
                          ),
                          '-$', '',
                          'g'
                        ),
                        '^[^a-zA-Z0-9]+', '',
                        'g'
                      )
                    ),
                    '--+', '-',
                    'g'
                  ),
                  '-$', '',
                  'g'
                ),
                '^[^a-zA-Z0-9]+', '',
                'g'
              )
            ),
            '--+', '-',
            'g'
          ),
          '-$', '',
          'g'
        ),
        '^[^a-zA-Z0-9]+', '',
        'g'
      )
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

-- Create trigger to auto-generate profile slug for new users
CREATE OR REPLACE FUNCTION auto_generate_profile_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if profile_slug is null or empty
  IF NEW.profile_slug IS NULL OR NEW.profile_slug = '' THEN
    NEW.profile_slug := generate_profile_slug(
      COALESCE(NEW.full_name, NEW.email, 'user')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user insertions
DROP TRIGGER IF EXISTS on_user_create_profile_slug ON public.users;

CREATE TRIGGER on_user_create_profile_slug
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_profile_slug();

-- Update existing users without profile_slug
UPDATE public.users 
SET profile_slug = generate_profile_slug(
  COALESCE(full_name, email, 'user')
)
WHERE profile_slug IS NULL OR profile_slug = '';

-- Test the column
SELECT 'Profile slug column added successfully!' as result;

-- Show sample of updated users
SELECT 
  user_id,
  full_name,
  email,
  profile_slug,
  CASE 
    WHEN profile_slug IS NOT NULL THEN 'Slug generated'
    ELSE 'No slug'
  END as slug_status
FROM public.users 
LIMIT 5;
