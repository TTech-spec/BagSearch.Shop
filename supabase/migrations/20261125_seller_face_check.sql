-- ============================================================================
-- Seller face check: a live selfie taken at sign-up, reviewed by an admin.
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- To review: open Storage > seller-selfies to see the photo, then in the
-- Table editor set seller_face_checks.status to 'approved' or 'rejected'
-- (and fill rejection_reason if rejected).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.seller_face_checks (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id        uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  selfie_path      text NOT NULL,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason text,
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz
);

ALTER TABLE public.seller_face_checks ENABLE ROW LEVEL SECURITY;

-- A seller sees only their own row.
DROP POLICY IF EXISTS seller_face_checks_select ON public.seller_face_checks;
CREATE POLICY seller_face_checks_select ON public.seller_face_checks
  FOR SELECT TO authenticated
  USING (auth.uid() = seller_id);

-- A seller can submit (or resubmit) their own selfie, always as 'pending'.
-- Only an admin using the dashboard can set 'approved' or 'rejected'.
DROP POLICY IF EXISTS seller_face_checks_insert ON public.seller_face_checks;
CREATE POLICY seller_face_checks_insert ON public.seller_face_checks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id AND status = 'pending');

DROP POLICY IF EXISTS seller_face_checks_update ON public.seller_face_checks;
CREATE POLICY seller_face_checks_update ON public.seller_face_checks
  FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id AND status = 'pending');

-- Private bucket: selfies are never public.
INSERT INTO storage.buckets (id, name, public)
VALUES ('seller-selfies', 'seller-selfies', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS seller_selfies_insert ON storage.objects;
CREATE POLICY seller_selfies_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'seller-selfies'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS seller_selfies_select ON storage.objects;
CREATE POLICY seller_selfies_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'seller-selfies'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
