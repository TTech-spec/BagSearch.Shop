-- Lets you leave a specific reason when rejecting a seller's NIN submission
-- (e.g. "Photo is blurry" or "Name doesn't match your account"), instead of
-- sellers only ever seeing a generic "not approved" message.
--
-- Run this once in the Supabase SQL editor. It only adds a column — no
-- existing data or policies are touched.

ALTER TABLE public.seller_verifications
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- ─── How to reject a submission with a reason ───────────────────────────────
-- Supabase Studio → Table Editor → seller_verifications → open the row →
-- set status = 'rejected', rejection_reason = whatever you want them to see
-- (e.g. "Photo is too blurry to read, please retake in good lighting."),
-- and reviewed_at = now(). Leaving rejection_reason blank still works — the
-- app falls back to a generic message.
