-- ─── Trigger: notify seller when a review is posted ──────────────────────────
-- Run this in your Supabase SQL Editor.
-- Requires: notifications table (setup_notifications.sql already run).

CREATE OR REPLACE FUNCTION create_seller_review_notification()
RETURNS TRIGGER AS $$
DECLARE
  reviewer_name text;
  star_text     text;
BEGIN
  -- Use the author_name from the review, fallback to 'Someone'
  reviewer_name := COALESCE(NULLIF(TRIM(NEW.author_name), ''), 'Someone');

  -- Build a star string e.g. "★★★★☆"
  star_text := REPEAT('★', NEW.rating) || REPEAT('☆', 5 - NEW.rating);

  -- Insert notification for the seller
  INSERT INTO public.notifications (
    seller_id,
    product_id,
    buyer_id,
    buyer_name,
    type,
    title,
    message,
    metadata
  ) VALUES (
    NEW.seller_id,
    NULL,
    NULL,
    reviewer_name,
    'seller_review',
    'New Review Received',
    format('%s left you a %s review: "%s"',
      reviewer_name,
      star_text,
      LEFT(NEW.text, 80) || CASE WHEN LENGTH(NEW.text) > 80 THEN '…' ELSE '' END
    ),
    jsonb_build_object(
      'review_id',   NEW.id,
      'rating',      NEW.rating,
      'author_name', reviewer_name,
      'review_text', NEW.text,
      'created_at',  NEW.created_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_seller_review_create_notification ON public.seller_reviews;

-- Fire after every new review insert
CREATE TRIGGER on_seller_review_create_notification
  AFTER INSERT ON public.seller_reviews
  FOR EACH ROW
  EXECUTE FUNCTION create_seller_review_notification();

SELECT 'Review notification trigger created!' AS status;
