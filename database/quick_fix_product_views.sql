-- Quick fix for product views RLS
-- Run this in your Supabase SQL Editor

-- Disable RLS temporarily to test if that's the issue
ALTER TABLE product_views DISABLE ROW LEVEL SECURITY;

-- Test manual insert
SELECT 'Testing manual insert...' as step;
INSERT INTO product_views (
    product_id, 
    buyer_id, 
    buyer_name, 
    buyer_email, 
    source
) VALUES (
    'a55cc3ae-d6a6-4bc6-8d6a-f798080904be', 
    'a1f185ef-bcc6-42e2-baf6-5193908c4080', 
    'Test User', 
    'jim112@gmail.com', 
    'rls_test'
)
ON CONFLICT DO NOTHING;

-- Check if it was inserted
SELECT * FROM product_views 
WHERE source = 'rls_test' 
ORDER BY viewed_at DESC 
LIMIT 1;

-- Re-enable RLS with proper policies
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert views
CREATE POLICY "Anyone can insert product views"
  ON public.product_views FOR INSERT
  WITH CHECK (true);

-- Allow sellers to view views of their products
CREATE POLICY "Sellers can view their product views"
  ON public.product_views FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM public.products
      WHERE user_id = auth.uid()
    )
  );

-- Allow buyers to view their own views
CREATE POLICY "Buyers can view own views"
  ON public.product_views FOR SELECT
  USING (buyer_id = auth.uid());

SELECT 'Product views RLS fixed!' as result;
