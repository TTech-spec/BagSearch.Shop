-- FIX PRODUCT_VIEWS RELATIONSHIPS
-- Run this in Supabase SQL Editor to add proper foreign key relationships

-- Step 1: Check current product_views table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'product_views' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check if users table has the expected primary key
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name IN ('user_id', 'id')
ORDER BY column_name;

-- Step 3: Check if products table has the expected primary key
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'product_id')
ORDER BY column_name;

-- Step 4: Add foreign key relationships if they don't exist
-- Add relationship between product_views.buyer_id and users.user_id
DO $$
BEGIN
  -- Check if foreign key already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'product_views' 
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'buyer_id'
  ) THEN
    -- Add foreign key constraint
    ALTER TABLE public.product_views 
    ADD CONSTRAINT fk_product_views_buyer_id 
    FOREIGN KEY (buyer_id) REFERENCES public.users(user_id);
    
    RAISE NOTICE 'Added foreign key for buyer_id';
  ELSE
    RAISE NOTICE 'Foreign key for buyer_id already exists';
  END IF;
END $$;

-- Step 5: Add relationship between product_views.product_id and products.id
DO $$
BEGIN
  -- Check if foreign key already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'product_views' 
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'product_id'
  ) THEN
    -- Add foreign key constraint
    ALTER TABLE public.product_views 
    ADD CONSTRAINT fk_product_views_product_id 
    FOREIGN KEY (product_id) REFERENCES public.products(id);
    
    RAISE NOTICE 'Added foreign key for product_id';
  ELSE
    RAISE NOTICE 'Foreign key for product_id already exists';
  END IF;
END $$;

-- Step 6: Test the relationships with a sample query
SELECT 
  pv.id,
  pv.product_id,
  pv.buyer_id,
  pv.buyer_name,
  pv.viewed_at,
  p.name as product_name,
  p.images,
  u.full_name as buyer_full_name,
  u.email as buyer_email
FROM public.product_views pv
LEFT JOIN public.products p ON pv.product_id = p.id
LEFT JOIN public.users u ON pv.buyer_id = u.user_id
ORDER BY pv.viewed_at DESC
LIMIT 5;

-- Step 7: Refresh schema cache (this might be needed for Supabase to recognize relationships)
NOTIFY pgrst, 'reload schema';

SELECT 'Product views relationships fixed!' as result;
