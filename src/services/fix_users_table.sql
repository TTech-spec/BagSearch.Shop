-- Add missing columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name     text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone         text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url    text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS brand_name    text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS brand_story   text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bag_categories jsonb DEFAULT '[]';

-- Make sure RLS is on
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile"    ON public.users;
DROP POLICY IF EXISTS "Users can update own profile"  ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile"  ON public.users;
DROP POLICY IF EXISTS "Public can read brand profiles" ON public.users;

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow anyone to read brand info for vendor pages
CREATE POLICY "Public can read brand profiles"
  ON public.users FOR SELECT
  USING (true);

-- Auto-create a users row when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (user_id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing auth users — skip any that conflict on email or user_id
INSERT INTO public.users (user_id, full_name, email)
SELECT
  au.id,
  au.raw_user_meta_data->>'full_name',
  au.email
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.user_id = au.id
)
AND NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.email = au.email
)
ON CONFLICT DO NOTHING;
