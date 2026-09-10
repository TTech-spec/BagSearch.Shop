-- ============================================================================
-- Reels feature — video shorts from bag sellers
-- Run this migration against your Supabase project to create the reels tables.
-- ============================================================================

-- 1. Main reels table
CREATE TABLE IF NOT EXISTS reels (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_name   text NOT NULL DEFAULT 'Anonymous Seller',
  seller_avatar  text,                -- optional avatar URL
  video_url     text NOT NULL,        -- Cloudinary video URL
  thumbnail_url text,                 -- auto-generated or uploaded thumbnail
  caption       text DEFAULT '',
  product_id    uuid,                 -- optional link to a product listing
  product_name  text,                 -- denormalized for display
  product_price text,                 -- denormalized for display
  likes_count   integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count  integer DEFAULT 0,
  views_count   integer DEFAULT 0,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 2. Likes on reels
CREATE TABLE IF NOT EXISTS reel_likes (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id   uuid NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(reel_id, user_id)
);

-- 3. Comments on reels
CREATE TABLE IF NOT EXISTS reel_comments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id    uuid NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name  text NOT NULL DEFAULT 'User',
  text       text NOT NULL,
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_reels_user_id ON reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_active ON reels(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_reel_likes_reel ON reel_likes(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_likes_user ON reel_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_reel_comments_reel ON reel_comments(reel_id);

-- 5. RLS policies — sellers can insert their own reels; everyone can read active ones
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view active reels
CREATE POLICY "Anyone can view active reels"
  ON reels FOR SELECT
  USING (is_active = true);

-- Authenticated users can insert their own reels
CREATE POLICY "Sellers can insert own reels"
  ON reels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update/delete their own reels
CREATE POLICY "Sellers can update own reels"
  ON reels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Sellers can delete own reels"
  ON reels FOR DELETE
  USING (auth.uid() = user_id);

-- Likes: anyone authed can like, see all likes
CREATE POLICY "Anyone can view likes"
  ON reel_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like"
  ON reel_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
  ON reel_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Comments: anyone authed can comment, everyone can read
CREATE POLICY "Anyone can view comments"
  ON reel_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can comment"
  ON reel_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON reel_comments FOR DELETE
  USING (auth.uid() = user_id);
