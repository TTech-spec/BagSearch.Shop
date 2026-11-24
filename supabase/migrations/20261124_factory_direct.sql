-- ============================================================================
-- Factory Direct: bag manufacturers post products buyers can see.
-- A factory account is a user with user_metadata.role = 'factory'.
-- New posts start as 'pending' and only show once an admin sets 'approved'.
-- ============================================================================

-- Allow the 'factory' role on profiles (was buyer/seller only).
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('buyer', 'seller', 'factory'));

CREATE TABLE IF NOT EXISTS factory_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  factory_name TEXT NOT NULL,
  factory_city TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  price_usd NUMERIC(10,2) NOT NULL CHECK (price_usd > 0),
  moq INTEGER NOT NULL DEFAULT 1 CHECK (moq > 0),
  lead_time_days INTEGER,
  custom_logo BOOLEAN NOT NULL DEFAULT false,
  samples BOOLEAN NOT NULL DEFAULT false,
  single_pieces BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_factory_products_status ON factory_products(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_factory_products_factory ON factory_products(factory_id);

ALTER TABLE factory_products ENABLE ROW LEVEL SECURITY;

-- Everyone sees approved posts; factories also see their own.
CREATE POLICY factory_products_select ON factory_products
  FOR SELECT USING (status = 'approved' OR auth.uid() = factory_id);

-- Only factory accounts insert, only as themselves, only as pending.
CREATE POLICY factory_products_insert ON factory_products
  FOR INSERT WITH CHECK (
    auth.uid() = factory_id
    AND status = 'pending'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'factory'
  );

CREATE POLICY factory_products_delete ON factory_products
  FOR DELETE USING (auth.uid() = factory_id);

-- Public bucket for factory product photos; factories write only into their own folder.
INSERT INTO storage.buckets (id, name, public) VALUES ('factory-images', 'factory-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY factory_images_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'factory-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'factory'
  );
