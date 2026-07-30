-- Fix buyer details in notifications
-- Run this in your Supabase SQL Editor

-- Step 1: Update the notification trigger to fetch buyer details properly
SELECT '=== UPDATING NOTIFICATION TRIGGER FOR BUYER DETAILS ===' as step;

-- Drop and recreate the function with better buyer detail fetching
DROP FUNCTION IF EXISTS create_product_view_notification() CASCADE;

CREATE OR REPLACE FUNCTION create_product_view_notification()
RETURNS TRIGGER AS $$
DECLARE
  seller_id_value uuid;
  buyer_name_text TEXT;
  buyer_email_text TEXT;
  buyer_phone_text TEXT;
  buyer_record RECORD;
BEGIN
  -- Get the seller id from the product row
  SELECT p.user_id
  INTO seller_id_value
  FROM public.products p
  WHERE p.id = NEW.product_id;

  IF seller_id_value IS NULL THEN
    RETURN NEW;
  END IF;

  -- Don't create notification if seller is viewing their own product
  IF seller_id_value = NEW.buyer_id THEN
    RETURN NEW;
  END IF;

  -- Try to get buyer details from users table if buyer_id exists
  IF NEW.buyer_id IS NOT NULL THEN
    SELECT 
      full_name,
      email,
      phone
    INTO buyer_record
    FROM public.users
    WHERE user_id = NEW.buyer_id;
    
    -- Use fetched details or fall back to what was provided
    buyer_name_text := COALESCE(
      buyer_record.full_name,
      NEW.buyer_name,
      'A buyer'
    );
    buyer_email_text := COALESCE(
      buyer_record.email,
      NEW.buyer_email
    );
    buyer_phone_text := COALESCE(buyer_record.phone, NULL);
  ELSE
    -- Anonymous buyer - use provided details
    buyer_name_text := COALESCE(NEW.buyer_name, 'A buyer');
    buyer_email_text := NEW.buyer_email;
    buyer_phone_text := NULL;
  END IF;

  -- Create notification for the seller with full buyer details
  INSERT INTO public.notifications (
    seller_id,
    product_id,
    buyer_id,
    buyer_name,
    buyer_email,
    type,
    title,
    message,
    metadata
  ) VALUES (
    seller_id_value,
    NEW.product_id,
    NEW.buyer_id,
    buyer_name_text,
    buyer_email_text,
    'product_view',
    'Product Viewed',
    format('%s viewed your product', buyer_name_text),
    jsonb_build_object(
      'viewed_at', NEW.viewed_at,
      'source', NEW.source,
      'buyer_phone', buyer_phone_text
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_product_view_create_notification
  AFTER INSERT ON public.product_views
  FOR EACH ROW
  EXECUTE FUNCTION create_product_view_notification();

-- Step 2: Check if users table has the right structure
SELECT '=== CHECKING USERS TABLE ===' as step;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Test the fix
SELECT '=== TESTING BUYER DETAILS FIX ===' as step;

-- Insert a test product view with a real buyer_id
INSERT INTO product_views (
    product_id, 
    buyer_id, 
    buyer_name, 
    buyer_email, 
    source
) VALUES (
    'a55cc3ae-d6a6-4bc6-8d6a-f798080904be', 
    'a1f185ef-bcc6-42e2-baf6-5193908c4080', 
    'Test Buyer', 
    'jim112@gmail.com', 
    'buyer_details_test'
)
ON CONFLICT DO NOTHING;

-- Check if notification was created with buyer details
SELECT 
    n.buyer_name,
    n.buyer_email,
    n.metadata->>'buyer_phone' as buyer_phone,
    n.message,
    n.created_at
FROM notifications n
WHERE n.buyer_name = 'Test Buyer' OR n.metadata->>'source' = 'buyer_details_test'
ORDER BY n.created_at DESC 
LIMIT 1;

SELECT 'Buyer details fix complete!' as result;
