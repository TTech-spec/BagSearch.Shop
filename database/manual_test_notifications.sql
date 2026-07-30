-- Manual test for notifications
-- Run this in Supabase SQL Editor

-- First, get a real product and user
SELECT 'Get product info:' as step;
SELECT id, name, user_id FROM products LIMIT 3;

SELECT 'Get user info:' as step;
SELECT id, email FROM auth.users LIMIT 3;

-- Then run this test (replace with actual IDs from above):
/*
-- Test the trigger manually
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
    'manual_test', 
    NOW()
);

-- Check if notification was created
SELECT * FROM notifications 
WHERE buyer_name = 'Test Buyer' 
ORDER BY created_at DESC 
LIMIT 1;
*/
