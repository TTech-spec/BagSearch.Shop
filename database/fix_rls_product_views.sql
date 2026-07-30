-- Fix RLS policies for product_views
-- Run this in your Supabase SQL Editor

-- Check current policies
SELECT 'Current RLS policies on product_views:' as info;
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'product_views' AND schemaname = 'public';

-- Drop existing policies
DROP POLICY IF EXISTS "Sellers can view their product views" ON public.product_views;
DROP POLICY IF EXISTS "Buyers can view own views" ON public.product_views;
DROP POLICY IF EXISTS "Anyone can insert product views" ON public.product_views;

-- Create new policies that allow anyone to insert views
CREATE POLICY "Anyone can insert product views"
  ON public.product_views FOR INSERT
  WITH CHECK (true);

-- Allow sellers to view views of their products
CREATE POLICY "Sellers can view their product views"
  ON public.product_views FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM public.products
      WHERE user_id = auth.uid() OR seller_id = auth.uid()
    )
  );

-- Allow buyers to view their own views
CREATE POLICY "Buyers can view own views"
  ON public.product_views FOR SELECT
  USING (buyer_id = auth.uid());

-- Allow anonymous users to insert (if needed)
CREATE POLICY "Anonymous can insert product views"
  ON public.product_views FOR INSERT
  WITH CHECK (true);

-- Verify policies
SELECT 'Updated RLS policies on product_views:' as info;
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'product_views' AND schemaname = 'public';

SELECT 'RLS policies fixed!' as result;
