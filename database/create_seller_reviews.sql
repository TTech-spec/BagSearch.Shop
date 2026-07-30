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

-- Anyone can read reviews
CREATE POLICY "Public can read reviews"
  ON public.seller_reviews FOR SELECT USING (true);

-- Anyone can insert a review
CREATE POLICY "Anyone can post a review"
  ON public.seller_reviews FOR INSERT WITH CHECK (true);
