-- DEBUG VENDOR DETAILS DATA ISSUES
-- Run this in Supabase SQL Editor to check table structures and data

-- Step 1: Check products table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check sample products data
SELECT 
  id,
  name,
  user_id,
  seller_id,
  created_at,
  price,
  images
FROM public.products 
LIMIT 5;

-- Step 3: Check if there are products for a specific seller (replace with actual seller ID)
-- Replace 'your-seller-id-here' with an actual seller user_id from your users table
SELECT 
  id,
  name,
  user_id,
  seller_id,
  created_at,
  price
FROM public.products 
WHERE user_id = 'your-seller-id-here' 
   OR seller_id = 'your-seller-id-here'
LIMIT 10;

-- Step 4: Check product_views table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_views' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 5: Check sample product_views data
SELECT 
  id,
  product_id,
  buyer_id,
  buyer_name,
  buyer_email,
  buyer_phone,
  viewed_at,
  source
FROM public.product_views 
LIMIT 5;

-- Step 6: Check seller_reviews table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'seller_reviews' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 7: Check sample seller_reviews data
SELECT 
  id,
  seller_id,
  author_name,
  rating,
  text,
  created_at
FROM public.seller_reviews 
LIMIT 5;

-- Step 8: Get a list of all sellers (users with products)
SELECT DISTINCT
  u.user_id,
  u.full_name,
  u.brand_name,
  COUNT(p.id) as product_count
FROM public.users u
LEFT JOIN public.products p ON u.user_id = p.user_id OR u.user_id = p.seller_id
WHERE u.full_name IS NOT NULL OR u.brand_name IS NOT NULL
GROUP BY u.user_id, u.full_name, u.brand_name
HAVING COUNT(p.id) > 0
ORDER BY product_count DESC
LIMIT 10;

-- Step 9: Check if there are any products at all
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as products_with_user_id,
  COUNT(CASE WHEN seller_id IS NOT NULL THEN 1 END) as products_with_seller_id
FROM public.products;

-- Step 10: Check if there are any views at all
SELECT 
  COUNT(*) as total_views,
  COUNT(DISTINCT product_id) as products_with_views,
  COUNT(DISTINCT buyer_id) as unique_buyers
FROM public.product_views;

-- Step 11: Check if there are any reviews at all
SELECT 
  COUNT(*) as total_reviews,
  COUNT(DISTINCT seller_id) as sellers_with_reviews,
  AVG(rating) as avg_rating
FROM public.seller_reviews;

SELECT 'Vendor details debug complete!' as result;
