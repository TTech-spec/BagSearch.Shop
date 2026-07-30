-- ─── notifications table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id   uuid REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name   text,
  buyer_email  text,
  type         text NOT NULL DEFAULT 'product_view',
  title        text NOT NULL,
  message      text,
  is_read      boolean DEFAULT false,
  metadata     jsonb DEFAULT '{}',
  created_at   timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS notifications_seller_id_idx ON public.notifications(seller_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON public.notifications(type);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own notifications
CREATE POLICY "Sellers can view their notifications"
  ON public.notifications FOR SELECT
  USING (seller_id = auth.uid());

-- Sellers can update their own notifications (mark as read)
CREATE POLICY "Sellers can update their notifications"
  ON public.notifications FOR UPDATE
  USING (seller_id = auth.uid());

-- System can insert notifications for sellers
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Function to create notification when product is viewed
CREATE OR REPLACE FUNCTION create_product_view_notification()
RETURNS TRIGGER AS $$
DECLARE
  seller_id_value uuid;
  buyer_name_text TEXT;
BEGIN
  -- Get the seller id from the product row without depending on auth.users access
  SELECT COALESCE(p.user_id, p.seller_id)
  INTO seller_id_value
  FROM public.products p
  WHERE p.id = NEW.product_id;

  IF seller_id_value IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get buyer name if available
  buyer_name_text := COALESCE(NEW.buyer_name, 'A buyer');

  -- Don't create notification if seller is viewing their own product
  IF seller_id_value = NEW.buyer_id THEN
    RETURN NEW;
  END IF;

  -- Create notification for the seller
  INSERT INTO public.notifications (
    seller_id,
    product_id,
    buyer_id,
    buyer_name,
    buyer_email,
    type,
    title,
    message,
    metadata
  ) VALUES (
    seller_id_value,
    NEW.product_id,
    NEW.buyer_id,
    buyer_name_text,
    NEW.buyer_email,
    'product_view',
    'Product Viewed',
    format('%s viewed your product', buyer_name_text),
    jsonb_build_object(
      'viewed_at', NEW.viewed_at,
      'source', NEW.source
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create notification on product view
DROP TRIGGER IF EXISTS on_product_view_create_notification ON public.product_views;
CREATE TRIGGER on_product_view_create_notification
  AFTER INSERT ON public.product_views
  FOR EACH ROW
  EXECUTE FUNCTION create_product_view_notification();
