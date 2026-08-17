-- ─── Step 1: Find the broken trigger ────────────────────────────────────────
-- Run this first to see what triggers exist on the products table.
-- Look for any function body that references "seller_id".

SELECT
  t.trigger_name,
  t.event_manipulation,
  t.action_timing,
  p.proname   AS function_name,
  p.prosrc    AS function_body
FROM information_schema.triggers t
JOIN pg_trigger pt
  ON pt.tgname = t.trigger_name
JOIN pg_proc p
  ON p.oid = pt.tgfoid
WHERE t.event_object_table = 'products'
  AND t.event_object_schema = 'public';


-- ─── Step 2: Fix — drop & recreate any trigger that uses NEW.seller_id ───────
-- Once you've identified the trigger name from Step 1, replace
-- "your_trigger_name_here" and "your_function_name_here" below and run it.

-- Drop the broken trigger
DROP TRIGGER IF EXISTS your_trigger_name_here ON public.products;

-- Drop the broken function
DROP FUNCTION IF EXISTS public.your_function_name_here();


-- ─── Step 3: RLS policies for products table ─────────────────────────────────
-- These are safe to run regardless — they use user_id (the correct column).

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view products"        ON public.products;
DROP POLICY IF EXISTS "Sellers can insert own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can update own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can delete own products" ON public.products;

-- Everyone (including visitors) can browse products
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

-- Authenticated sellers can insert their own listings
CREATE POLICY "Sellers can insert own products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Sellers can edit their own listings
CREATE POLICY "Sellers can update own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Sellers can delete their own listings
CREATE POLICY "Sellers can delete own products"
  ON public.products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
