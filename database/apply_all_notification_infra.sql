-- ════════════════════════════════════════════════════════════════════════════
-- Consolidated, idempotent setup for: notifications, seller reviews,
-- push subscriptions, and the DB triggers that fire the send-push-notification
-- Edge Function (already deployed) for reviews, product-view, and new-product
-- (hot deals / new bag uploaded) events.
--
-- Safe to run any number of times — every statement guards against re-running
-- on a database where some/all of this already exists.
--
-- Run this once in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lpmdbmzvvnpyuukvahiy/sql/new
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. notifications table ────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS notifications_seller_id_idx ON public.notifications(seller_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON public.notifications(type);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can view their notifications" ON public.notifications;
CREATE POLICY "Sellers can view their notifications"
  ON public.notifications FOR SELECT USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "Sellers can update their notifications" ON public.notifications;
CREATE POLICY "Sellers can update their notifications"
  ON public.notifications FOR UPDATE USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT WITH CHECK (true);

-- product_view -> notification trigger
CREATE OR REPLACE FUNCTION create_product_view_notification()
RETURNS TRIGGER AS $$
DECLARE
  seller_id_value uuid;
  buyer_name_text TEXT;
BEGIN
  SELECT COALESCE(p.user_id, p.seller_id)
  INTO seller_id_value
  FROM public.products p
  WHERE p.id = NEW.product_id;

  IF seller_id_value IS NULL THEN
    RETURN NEW;
  END IF;

  buyer_name_text := COALESCE(NEW.buyer_name, 'A buyer');

  IF seller_id_value = NEW.buyer_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (
    seller_id, product_id, buyer_id, buyer_name, buyer_email,
    type, title, message, metadata
  ) VALUES (
    seller_id_value, NEW.product_id, NEW.buyer_id, buyer_name_text, NEW.buyer_email,
    'product_view', 'Product Viewed', format('%s viewed your product', buyer_name_text),
    jsonb_build_object('viewed_at', NEW.viewed_at, 'source', NEW.source)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_product_view_create_notification ON public.product_views;
CREATE TRIGGER on_product_view_create_notification
  AFTER INSERT ON public.product_views
  FOR EACH ROW
  EXECUTE FUNCTION create_product_view_notification();

-- ─── 2. seller_reviews table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.seller_reviews (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id    uuid NOT NULL,
  author_name  text DEFAULT 'Anonymous',
  rating       integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text         text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seller_reviews_seller_id_idx ON public.seller_reviews(seller_id);

ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read reviews" ON public.seller_reviews;
CREATE POLICY "Public can read reviews"
  ON public.seller_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can post a review" ON public.seller_reviews;
CREATE POLICY "Anyone can post a review"
  ON public.seller_reviews FOR INSERT WITH CHECK (true);

-- ─── 3. push_subscriptions table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  device_label text,
  user_agent text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);

CREATE OR REPLACE FUNCTION public.update_push_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS push_subscriptions_set_updated_at ON public.push_subscriptions;
CREATE TRIGGER push_subscriptions_set_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_push_subscriptions_updated_at();

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view their own push subscriptions"
ON public.push_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can create their own push subscriptions"
ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update their own push subscriptions"
ON public.push_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete their own push subscriptions"
ON public.push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ─── 4. seller_reviews -> notifications trigger ─────────────────────────────
CREATE OR REPLACE FUNCTION create_seller_review_notification()
RETURNS TRIGGER AS $$
DECLARE
  reviewer_name text;
  star_text     text;
BEGIN
  reviewer_name := COALESCE(NULLIF(TRIM(NEW.author_name), ''), 'Someone');
  star_text := REPEAT('★', NEW.rating) || REPEAT('☆', 5 - NEW.rating);

  INSERT INTO public.notifications (
    seller_id, product_id, buyer_id, buyer_name, type, title, message, metadata
  ) VALUES (
    NEW.seller_id, NULL, NULL, reviewer_name, 'seller_review', 'New Review Received',
    format('%s left you a %s review: "%s"', reviewer_name, star_text,
      LEFT(NEW.text, 80) || CASE WHEN LENGTH(NEW.text) > 80 THEN '…' ELSE '' END),
    jsonb_build_object('review_id', NEW.id, 'rating', NEW.rating,
      'author_name', reviewer_name, 'review_text', NEW.text, 'created_at', NEW.created_at)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_seller_review_create_notification ON public.seller_reviews;
CREATE TRIGGER on_seller_review_create_notification
  AFTER INSERT ON public.seller_reviews
  FOR EACH ROW
  EXECUTE FUNCTION create_seller_review_notification();

-- ─── 5. new product -> broadcast notifications trigger (hot deals / new bag uploaded) ──
CREATE OR REPLACE FUNCTION public.create_new_product_broadcast_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_user_id uuid;
  product_image text;
BEGIN
  seller_user_id := coalesce(new.user_id, new.seller_id);

  IF seller_user_id IS NULL THEN
    RETURN new;
  END IF;

  product_image := CASE
    WHEN new.images IS NOT NULL AND jsonb_typeof(to_jsonb(new.images)) = 'array' AND jsonb_array_length(to_jsonb(new.images)) > 0
      THEN new.images[1]
    ELSE NULL
  END;

  INSERT INTO public.notifications (
    seller_id, product_id, buyer_id, buyer_name, type, title, message, metadata
  )
  SELECT
    ps.user_id AS seller_id,
    new.id AS product_id,
    seller_user_id AS buyer_id,
    coalesce(new.seller_name, 'A seller') AS buyer_name,
    'product_upload' AS type,
    'New Product Uploaded' AS title,
    coalesce(new.seller_name, 'A seller') || ' just uploaded "' || coalesce(new.name, 'a new product') || '"' AS message,
    jsonb_build_object(
      'product_name', new.name,
      'seller_name', coalesce(new.seller_name, 'A seller'),
      'price', new.price,
      'image', product_image,
      'broadcast', true
    ) AS metadata
  FROM (
    SELECT DISTINCT user_id
    FROM public.push_subscriptions
    WHERE is_active = true
  ) ps
  WHERE ps.user_id <> seller_user_id;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_product_create_broadcast_notification ON public.products;
CREATE TRIGGER on_product_create_broadcast_notification
  AFTER INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.create_new_product_broadcast_notifications();

-- ─── 6. notifications -> send-push-notification Edge Function trigger ──────
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.send_push_notification_for_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_url text := 'https://lpmdbmzvvnpyuukvahiy.supabase.co';
  trigger_secret text := 'a457af34ff48dc2cf78a1e6a91d1001c95752f42ce021c8613c396c44f49d106';
BEGIN
  PERFORM net.http_post(
    url := project_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || trigger_secret
    ),
    body := jsonb_build_object(
      'sellerId', new.seller_id,
      'notificationId', new.id,
      'title', coalesce(new.title, 'BagSearch'),
      'body', coalesce(new.message, 'You have a new notification.'),
      'url', case
        when new.product_id is not null then '/products/' || new.product_id::text
        else '/seller-profile'
      end,
      'tag', coalesce(new.type, 'bagsearch-notification')
    )
  );

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS notifications_send_push_trigger ON public.notifications;
CREATE TRIGGER notifications_send_push_trigger
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_push_notification_for_notification();

SELECT 'All notification + push infrastructure applied.' AS status;
