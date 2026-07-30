-- Complete diagnostic and fix script for notifications
-- Run this in your Supabase SQL Editor

-- 1. Check current state
SELECT '=== DIAGNOSTIC CHECK ===' as step;

-- Check tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('notifications', 'product_views') AND table_schema = 'public';

-- Check trigger
SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_product_view_create_notification' AND trigger_schema = 'public';

-- Check function
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'create_product_view_notification' AND routine_schema = 'public';

-- 2. Check recent data
SELECT '=== RECENT DATA ===' as step;

-- Recent product views
SELECT 
    pv.id,
    pv.product_id,
    pv.buyer_id,
    pv.buyer_name,
    pv.viewed_at,
    p.name as product_name,
    p.user_id as seller_id
FROM product_views pv
LEFT JOIN products p ON pv.product_id = p.id
ORDER BY pv.viewed_at DESC 
LIMIT 5;

-- Recent notifications
SELECT 
    n.id,
    n.seller_id,
    n.product_id,
    n.buyer_name,
    n.type,
    n.title,
    n.message,
    n.is_read,
    n.created_at,
    p.name as product_name
FROM notifications n
LEFT JOIN products p ON n.product_id = p.id
ORDER BY n.created_at DESC 
LIMIT 5;

-- 3. FIXES
SELECT '=== APPLYING FIXES ===' as step;

-- Drop and recreate the function (fix potential issues)
DROP FUNCTION IF EXISTS create_product_view_notification() CASCADE;

CREATE OR REPLACE FUNCTION create_product_view_notification()
RETURNS TRIGGER AS $$
DECLARE
  seller_id_value uuid;
  buyer_name_text TEXT;
BEGIN
  -- Get the seller id from the product row
  SELECT COALESCE(p.user_id, p.seller_id)
  INTO seller_id_value
  FROM public.products p
  WHERE p.id = NEW.product_id;

  -- Log for debugging
  RAISE LOG 'Product view trigger: product_id=%, buyer_id=%, seller_id=%', 
    NEW.product_id, NEW.buyer_id, seller_id_value;

  IF seller_id_value IS NULL THEN
    RAISE LOG 'No seller found for product %', NEW.product_id;
    RETURN NEW;
  END IF;

  -- Get buyer name if available
  buyer_name_text := COALESCE(NEW.buyer_name, 'A buyer');

  -- Don't create notification if seller is viewing their own product
  IF seller_id_value = NEW.buyer_id THEN
    RAISE LOG 'Seller viewing own product - skipping notification';
    RETURN NEW;
  END IF;

  -- Create notification for the seller
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
    NEW.buyer_email,
    'product_view',
    'Product Viewed',
    format('%s viewed your product', buyer_name_text),
    jsonb_build_object(
      'viewed_at', NEW.viewed_at,
      'source', NEW.source
    )
  );

  RAISE LOG 'Notification created for seller %', seller_id_value;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_product_view_create_notification ON public.product_views;

CREATE TRIGGER on_product_view_create_notification
  AFTER INSERT ON public.product_views
  FOR EACH ROW
  EXECUTE FUNCTION create_product_view_notification();

-- 4. Verify setup
SELECT '=== VERIFICATION ===' as step;

SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_product_view_create_notification' AND trigger_schema = 'public';

SELECT 'Fix complete! Test by viewing a product.' as result;
