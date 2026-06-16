-- Fix the notification trigger function
-- Run this in your Supabase SQL Editor

-- First, check what columns actually exist in the products table
SELECT '=== CHECKING PRODUCTS TABLE STRUCTURE ===' as step;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Drop and recreate the function with correct column names
DROP FUNCTION IF EXISTS create_product_view_notification() CASCADE;

CREATE OR REPLACE FUNCTION create_product_view_notification()
RETURNS TRIGGER AS $$
DECLARE
  seller_id_value uuid;
  buyer_name_text TEXT;
BEGIN
  -- Get the seller id from the product row (only use user_id since seller_id doesn't exist)
  SELECT p.user_id
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_product_view_create_notification ON public.product_views;

CREATE TRIGGER on_product_view_create_notification
  AFTER INSERT ON public.product_views
  FOR EACH ROW
  EXECUTE FUNCTION create_product_view_notification();

-- Verify the fix
SELECT '=== VERIFICATION ===' as step;
SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_product_view_create_notification' AND trigger_schema = 'public';

SELECT 'Notification trigger fixed!' as result;
