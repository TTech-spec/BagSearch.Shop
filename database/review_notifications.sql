-- Create review notifications for sellers
-- Run this in your Supabase SQL Editor

-- Create function to create review notifications
CREATE OR REPLACE FUNCTION create_review_notification()
RETURNS TRIGGER AS $$
DECLARE
  seller_id_value uuid;
  reviewer_name TEXT;
BEGIN
  -- Get the seller id from the vendor (seller_reviews table already has seller_id)
  seller_id_value := NEW.seller_id;
  
  -- Get reviewer name
  reviewer_name := COALESCE(NEW.author_name, 'Anonymous');
  
  -- Don't create notification if seller is reviewing their own profile
  IF seller_id_value = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Create notification for the seller
  INSERT INTO public.notifications (
    seller_id,
    type,
    title,
    message,
    metadata
  ) VALUES (
    seller_id_value,
    'review',
    'New Review Posted',
    format('%s posted a review on your profile', reviewer_name),
    jsonb_build_object(
      'review_id', NEW.id,
      'rating', NEW.rating,
      'text', NEW.text,
      'author_name', NEW.author_name,
      'created_at', NEW.created_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new reviews
DROP TRIGGER IF EXISTS on_review_create_notification ON public.seller_reviews;

CREATE TRIGGER on_review_create_notification
  AFTER INSERT ON public.seller_reviews
  FOR EACH ROW
  EXECUTE FUNCTION create_review_notification();

-- Also create trigger for updated reviews
CREATE OR REPLACE FUNCTION update_review_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the notification message if review was updated
  UPDATE public.notifications 
  SET 
    message = format('%s updated their review on your profile', COALESCE(NEW.author_name, 'Anonymous')),
    metadata = jsonb_set(
      jsonb_set(
        jsonb_set(metadata, '{rating}', to_jsonb(NEW.rating)),
        '{text}', to_jsonb(NEW.text)
      ),
      '{updated_at}', to_jsonb(NEW.updated_at)
    ),
    created_at = NEW.updated_at
  WHERE metadata->>'review_id' = NEW.id::text 
    AND type = 'review';
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated reviews
DROP TRIGGER IF EXISTS on_review_update_notification ON public.seller_reviews;

CREATE TRIGGER on_review_update_notification
  AFTER UPDATE ON public.seller_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_notification();

-- Test the notification system
SELECT 'Review notification system setup complete!' as result;
