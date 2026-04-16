-- Debug script for product views not being recorded
-- Run this in your Supabase SQL Editor

-- 1. Check if product_views table exists and has correct structure
SELECT '=== CHECKING product_views TABLE ===' as step;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'product_views' AND table_schema = 'public';

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'product_views' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check RLS policies on product_views
SELECT '=== CHECKING RLS POLICIES ===' as step;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'product_views' AND schemaname = 'public';

-- 3. Test manual insertion (this should work regardless of RLS)
SELECT '=== TESTING MANUAL INSERT ===' as step;

-- Get a real product first
SELECT 'Available products:' as info;
SELECT id, name, user_id, seller_id FROM products LIMIT 3;

-- Get a real user (or use NULL for anonymous)
SELECT 'Available users:' as info;
SELECT id, email FROM auth.users LIMIT 3;

-- Manual test query (uncomment and replace IDs after running above):
/*
-- Test direct insertion
INSERT INTO product_views (
    product_id, 
    buyer_id, 
    buyer_name, 
    buyer_email, 
    source, 
    viewed_at
) VALUES (
    'YOUR_PRODUCT_ID_HERE', 
    NULL, -- or 'YOUR_USER_ID_HERE' for logged in user
    'Test Buyer', 
    'test@example.com', 
    'manual_test', 
    NOW()
);

-- Check if it was inserted
SELECT * FROM product_views 
WHERE buyer_name = 'Test Buyer' 
ORDER BY viewed_at DESC 
LIMIT 1;
*/

-- 4. Check recent product views
SELECT '=== RECENT PRODUCT VIEWS ===' as step;
SELECT 
    pv.id,
    pv.product_id,
    pv.buyer_id,
    pv.buyer_name,
    pv.buyer_email,
    pv.source,
    pv.viewed_at,
    p.name as product_name,
    p.user_id as seller_id
FROM product_views pv
LEFT JOIN products p ON pv.product_id = p.id
ORDER BY pv.viewed_at DESC 
LIMIT 10;

-- 5. Check if there are any database constraints or issues
SELECT '=== CHECKING CONSTRAINTS ===' as step;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'product_views' AND tc.table_schema = 'public';

-- 6. Check if the table has proper permissions
SELECT '=== CHECKING PERMISSIONS ===' as step;
SELECT 
    grantee,
    privilege_type,
    table_schema,
    table_name
FROM information_schema.role_table_grants
WHERE table_name = 'product_views' AND table_schema = 'public';

SELECT 'Debug complete! Check the results above.' as result;
