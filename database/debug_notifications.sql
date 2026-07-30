-- Debug script to check notification system setup
-- Run this in your Supabase SQL Editor to diagnose issues

-- 1. Check if notifications table exists
SELECT 'Checking notifications table...' as step;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'notifications' AND table_schema = 'public';

-- 2. Check if product_views table exists
SELECT 'Checking product_views table...' as step;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'product_views' AND table_schema = 'public';

-- 3. Check if trigger exists
SELECT 'Checking trigger...' as step;
SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_product_view_create_notification' AND trigger_schema = 'public';

-- 4. Check if function exists
SELECT 'Checking function...' as step;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'create_product_view_notification' AND routine_schema = 'public';

-- 5. Check recent product_views
SELECT 'Recent product_views (last 10):' as step;
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
LIMIT 10;

-- 6. Check recent notifications
SELECT 'Recent notifications (last 10):' as step;
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
LIMIT 10;

-- 7. Test trigger manually
SELECT 'Testing trigger manually...' as step;

-- First, let's insert a test product view (this should trigger notification)
-- NOTE: Replace these IDs with actual values from your database
-- Get a real product ID first:
SELECT id, name, user_id FROM products LIMIT 1;

-- Get a real user ID (or use NULL for anonymous):
SELECT id, email FROM auth.users LIMIT 1;

-- Manual test query (uncomment and replace IDs after running the queries above):
/*
INSERT INTO product_views (
    product_id, 
    buyer_id, 
    buyer_name, 
    buyer_email, 
    source, 
    viewed_at
) VALUES (
    'YOUR_PRODUCT_ID_HERE', 
    'YOUR_USER_ID_HERE', 
    'Test Buyer', 
    'test@example.com', 
    'test_manual', 
    NOW()
);

-- Check if notification was created
SELECT * FROM notifications WHERE buyer_name = 'Test Buyer' ORDER BY created_at DESC LIMIT 1;
*/

-- 8. Check RLS policies
SELECT 'Checking RLS policies...' as step;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'notifications' AND schemaname = 'public';

SELECT 'Debug complete!' as step;
