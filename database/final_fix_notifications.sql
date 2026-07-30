-- Final fix for notifications - handles existing policies
-- Run this in your Supabase SQL Editor

-- Step 1: Fix the notification trigger (main issue)
SELECT '=== FIXING NOTIFICATION TRIGGER ===' as step;

-- Drop existing function and trigger
DROP FUNCTION IF EXISTS create_product_view_notification() CASCADE;
DROP TRIGGER IF EXISTS on_product_view_create_notification ON public.product_views;

-- Recreate function with correct column reference
CREATE OR REPLACE FUNCTION create_product_view_notification()
RETURNS TRIGGER AS $$
DECLARE
  seller_id_value uuid;
  buyer_name_text TEXT;
BEGIN
  -- Get the seller id from the product row (only use user_id)
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

  -- Get buyer name
  buyer_name_text := COALESCE(NEW.buyer_name, 'A buyer');

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_product_view_create_notification
  AFTER INSERT ON public.product_views
  FOR EACH ROW
  EXECUTE FUNCTION create_product_view_notification();

-- Step 2: Fix product views RLS
SELECT '=== FIXING PRODUCT VIEWS RLS ===' as step;

-- Disable RLS temporarily
ALTER TABLE product_views DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can insert product views" ON public.product_views;
DROP POLICY IF EXISTS "Sellers can view their product views" ON public.product_views;
DROP POLICY IF EXISTS "Buyers can view own views" ON public.product_views;
DROP POLICY IF EXISTS "Anonymous can insert product views" ON public.product_views;

-- Re-enable RLS
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- Create clean policies
CREATE POLICY "Anyone can insert product views"
  ON public.product_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sellers can view their product views"
  ON public.product_views FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM public.products
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can view own views"
  ON public.product_views FOR SELECT
  USING (buyer_id = auth.uid());

-- Step 3: Test the fix
SELECT '=== TESTING THE FIX ===' as step;

-- Test manual insert
INSERT INTO product_views (
    product_id, 
    buyer_id, 
    buyer_name, 
    buyer_email, 
    source
) VALUES (
    'a55cc3ae-d6a6-4bc6-8d6a-f798080904be', 
    'a1f185ef-bcc6-42e2-baf6-5193908c4080', 
    'Test User Final', 
    'jim112@gmail.com', 
    'final_test'
)
ON CONFLICT DO NOTHING;

-- Verify the insert worked
SELECT * FROM product_views 
WHERE source = 'final_test' 
ORDER BY viewed_at DESC 
LIMIT 1;

-- Check if notification was created
SELECT * FROM notifications 
WHERE buyer_name = 'Test User Final' 
ORDER BY created_at DESC 
LIMIT 1;

SELECT '=== FIX COMPLETE ===' as step;
SELECT 'Product views and notifications should now work!' as result;
