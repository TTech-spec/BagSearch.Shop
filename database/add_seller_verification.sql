-- Seller verification: "Community Trusted" (review-based, automatic) and
-- "ID Submitted" (NIN photo, manually reviewed by the project owner via the
-- Supabase table editor — no in-app admin panel).
--
-- Run this once in the Supabase SQL editor before deploying the app changes
-- that depend on it.

-- ─── 1. Lock down seller_reviews ────────────────────────────────────────────
-- Previously anyone (no login required) could post unlimited reviews with a
-- free-text author_name. This ties every review to a real logged-in buyer
-- and caps it at one review per buyer per seller.

ALTER TABLE public.seller_reviews
  ADD COLUMN IF NOT EXISTS buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS seller_reviews_seller_buyer_unique
  ON public.seller_reviews (seller_id, buyer_id)
  WHERE buyer_id IS NOT NULL;

DROP POLICY IF EXISTS "Anyone can post a review" ON public.seller_reviews;
CREATE POLICY "Logged-in buyers can post a review"
  ON public.seller_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Buyers can update their own review" ON public.seller_reviews;
CREATE POLICY "Buyers can update their own review"
  ON public.seller_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Buyers can delete their own review" ON public.seller_reviews;
CREATE POLICY "Buyers can delete their own review"
  ON public.seller_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = buyer_id);

-- ─── 2. Community Trusted badge (automatic) ─────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS community_trusted boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.check_seller_community_trusted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  distinct_reviewers integer;
BEGIN
  IF NEW.buyer_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(DISTINCT buyer_id) INTO distinct_reviewers
  FROM public.seller_reviews
  WHERE seller_id = NEW.seller_id AND buyer_id IS NOT NULL;

  IF distinct_reviewers >= 10 THEN
    UPDATE public.users SET community_trusted = true
    WHERE user_id = NEW.seller_id AND community_trusted = false;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_seller_review_check_trusted ON public.seller_reviews;
CREATE TRIGGER on_seller_review_check_trusted
  AFTER INSERT ON public.seller_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.check_seller_community_trusted();

-- ─── 3. ID Submitted badge (manual review, no NIN API) ──────────────────────
-- A separate table (not a column on users) so RLS can allow a seller to
-- submit/resubmit without ever letting them set status to 'approved'
-- themselves — only you, reviewing in the Supabase dashboard with the
-- service role, can do that.

CREATE TABLE IF NOT EXISTS public.seller_verifications (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id      uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nin_image_path text NOT NULL,
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  submitted_at   timestamptz NOT NULL DEFAULT now(),
  reviewed_at    timestamptz
);

ALTER TABLE public.seller_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can view their own verification" ON public.seller_verifications;
CREATE POLICY "Sellers can view their own verification"
  ON public.seller_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- Public can check whether a seller is approved (for the storefront badge)
-- without seeing the image path or other sellers' submissions.
DROP POLICY IF EXISTS "Public can check approval status" ON public.seller_verifications;
CREATE POLICY "Public can check approval status"
  ON public.seller_verifications FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Sellers can submit their own verification" ON public.seller_verifications;
CREATE POLICY "Sellers can submit their own verification"
  ON public.seller_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id AND status = 'pending');

-- Resubmission after a rejection: sellers may update their own row, but the
-- new row must still be status = 'pending' — they cannot set it to
-- 'approved' themselves.
DROP POLICY IF EXISTS "Sellers can resubmit their own verification" ON public.seller_verifications;
CREATE POLICY "Sellers can resubmit their own verification"
  ON public.seller_verifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id AND status = 'pending');

-- ─── 4. Private storage bucket for NIN photos ───────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('nin-documents', 'nin-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Sellers can upload their own NIN photo" ON storage.objects;
CREATE POLICY "Sellers can upload their own NIN photo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'nin-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Sellers can view their own NIN photo" ON storage.objects;
CREATE POLICY "Sellers can view their own NIN photo"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'nin-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Sellers can replace their own NIN photo" ON storage.objects;
CREATE POLICY "Sellers can replace their own NIN photo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'nin-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'nin-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Sellers can delete their own NIN photo" ON storage.objects;
CREATE POLICY "Sellers can delete their own NIN photo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'nin-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── How to review a submission ─────────────────────────────────────────────
-- 1. Supabase Studio → Table Editor → seller_verifications → find status='pending' rows.
-- 2. Supabase Studio → Storage → nin-documents → open {seller_id}/... to view the photo.
-- 3. Cross-check the name on the ID against the seller's account name if desired.
-- 4. Edit the row: set status to 'approved' or 'rejected', and reviewed_at = now().
