-- ─── product_views table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_views (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id   uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name   text,
  buyer_email  text,
  buyer_phone  text,
  source       text DEFAULT 'product_detail',
  viewed_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_views_product_id_idx ON public.product_views(product_id);
CREATE INDEX IF NOT EXISTS product_views_buyer_id_idx   ON public.product_views(buyer_id);
CREATE INDEX IF NOT EXISTS product_views_viewed_at_idx  ON public.product_views(viewed_at DESC);

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Sellers can see views of their own products
CREATE POLICY "Sellers can view their product views"
  ON public.product_views FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM public.products
      WHERE user_id = auth.uid()
    )
  );

-- Anyone (including anon) can insert a view
CREATE POLICY "Anyone can insert product views"
  ON public.product_views FOR INSERT
  WITH CHECK (true);

-- Buyers can see their own views
CREATE POLICY "Buyers can view own views"
  ON public.product_views FOR SELECT
  USING (buyer_id = auth.uid());


-- ─── search_history RLS fix (table already exists) ────────────────────────────
-- Drop and recreate policies to ensure they work
DROP POLICY IF EXISTS "Users can view own search history"   ON public.search_history;
DROP POLICY IF EXISTS "Users can insert own search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can delete own search history" ON public.search_history;

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON public.search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history"
  ON public.search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history"
  ON public.search_history FOR DELETE
  USING (auth.uid() = user_id);
