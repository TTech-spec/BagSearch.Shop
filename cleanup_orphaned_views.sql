-- Clean up orphaned views when products are deleted
-- Run this in your Supabase SQL Editor

-- Create a function to clean up views for deleted products
CREATE OR REPLACE FUNCTION cleanup_orphaned_product_views()
RETURNS void AS $$
BEGIN
    -- Delete views for products that no longer exist
    DELETE FROM public.product_views 
    WHERE product_id NOT IN (
        SELECT id FROM public.products
    );
    
    RAISE LOG 'Cleaned up orphaned product views';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically clean up views when products are deleted
DROP TRIGGER IF EXISTS cleanup_views_on_product_delete ON public.products;

CREATE TRIGGER cleanup_views_on_product_delete
  AFTER DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_orphaned_product_views();

-- Manual cleanup (run once to clean existing orphaned views)
SELECT 'Cleaning up existing orphaned views...' as step;

-- Show how many orphaned views will be cleaned
SELECT 
    COUNT(*) as orphaned_views_to_delete
FROM public.product_views 
WHERE product_id NOT IN (
    SELECT id FROM public.products
);

-- Perform the cleanup
DELETE FROM public.product_views 
WHERE product_id NOT IN (
    SELECT id FROM public.products
);

-- Show results
SELECT 
    COUNT(*) as remaining_views,
    (SELECT COUNT(*) FROM public.product_views) - COUNT(*) as total_deleted
FROM public.product_views;

SELECT 'Orphaned views cleanup complete!' as result;
