-- ============================================================================
-- Add factory partner: Rick — Yoyo Bags (+86 181 6645 6218)
-- Run once in the Supabase SQL editor.
--
-- Rick has no email yet, so the account gets a placeholder login email.
-- When he opens his profile page, the app asks for his real email
-- (needs_email = true) and Supabase emails him a confirmation link.
--
-- BEFORE RUNNING: replace REPLACE_WITH_TEMP_PASSWORD with a temporary
-- password and send it to Rick privately (WhatsApp/WeChat). Don't commit it.
-- ============================================================================

DO $$
DECLARE
  new_id   uuid := gen_random_uuid();
  login    text := 'yoyobags@factory.bagsearch.shop';  -- placeholder login email
  temp_pw  text := 'REPLACE_WITH_TEMP_PASSWORD';
BEGIN
  IF temp_pw = 'REPLACE_WITH_TEMP_PASSWORD' THEN
    RAISE EXCEPTION 'Set a temporary password first';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = login) THEN
    RAISE EXCEPTION 'Yoyo Bags account already exists';
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
    login, crypt(temp_pw, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', 'factory'),
    jsonb_build_object(
      'full_name',     'Rick',
      'business_name', 'Yoyo Bags',
      'phone',         '+8618166456218',
      'role',          'factory',
      'city',          'China',
      'needs_email',   true
    ),
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), new_id, new_id::text,
    jsonb_build_object('sub', new_id::text, 'email', login, 'email_verified', true),
    'email', now(), now(), now()
  );

  -- Profile row (the handle_new_user trigger usually creates it; this fills the rest).
  INSERT INTO public.users (user_id, full_name, email, phone, role, brand_name)
  VALUES (new_id, 'Rick', login, '+8618166456218', 'factory', 'Yoyo Bags')
  ON CONFLICT (user_id) DO UPDATE
    SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone,
        role = EXCLUDED.role, brand_name = EXCLUDED.brand_name;

  RAISE NOTICE 'Created Yoyo Bags factory account: %', new_id;
END $$;

-- Check it worked:
-- SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'yoyobags@factory.bagsearch.shop';
