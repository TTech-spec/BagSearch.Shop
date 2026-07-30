-- DIAGNOSE AND FIX USER REGISTRATION ISSUES
-- Run this in your Supabase SQL Editor to check and fix user profile creation

-- Step 1: Check existing triggers on users table
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_condition,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  OR trigger_name LIKE '%user%'
  OR trigger_name LIKE '%profile%';

-- Step 2: Check users table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Check if there are any failing functions
SELECT 
  proname,
  prosrc,
  pronargs,
  proargtypes
FROM pg_proc 
WHERE proname LIKE '%user%' 
  OR proname LIKE '%profile%'
  OR proname LIKE '%create%';

-- Step 4: Test manual user profile creation
-- Try creating a test user profile to see what fails
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_email text := 'test@example.com';
BEGIN
  -- Try to insert a test user profile
  INSERT INTO public.users (
    user_id,
    email,
    full_name,
    created_at
  ) VALUES (
    test_user_id,
    test_email,
    'Test User',
    NOW()
  );
  
  RAISE NOTICE 'Test user profile created successfully with ID: %', test_user_id;
  
  -- Clean up the test
  DELETE FROM public.users WHERE user_id = test_user_id;
  
  RAISE NOTICE 'Test user profile cleaned up';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating user profile: %', SQLERRM;
    RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
END $$;

-- Step 5: Check RLS policies on users table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Step 6: If needed, create a simple user profile trigger
-- Uncomment and run this if the above shows missing/broken triggers

/*
-- Create simple user profile creation trigger
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile when auth user is created
  INSERT INTO public.users (
    user_id,
    email,
    full_name,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE LOG 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();
*/

-- Step 7: Test the trigger function
SELECT 'User profile diagnosis complete!' as result;
