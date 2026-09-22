-- ─── Reels feature — run this in Supabase SQL Editor ────────────────────────

-- 1. reels table
CREATE TABLE IF NOT EXISTS public.reels (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_name  text NOT NULL DEFAULT 'Anonymous Seller',
  caption      text NOT NULL DEFAULT '',
  video_url    text NOT NULL,
  thumbnail_url text,
  likes        integer NOT NULL DEFAULT 0,
  views        integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reels_user_id_idx    ON public.reels(user_id);
CREATE INDEX IF NOT EXISTS reels_created_at_idx ON public.reels(created_at DESC);

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reels"         ON public.reels;
DROP POLICY IF EXISTS "Sellers can insert own reels"  ON public.reels;
DROP POLICY IF EXISTS "Sellers can update own reels"  ON public.reels;
DROP POLICY IF EXISTS "Sellers can delete own reels"  ON public.reels;

CREATE POLICY "Anyone can view reels"
  ON public.reels FOR SELECT USING (true);

CREATE POLICY "Sellers can insert own reels"
  ON public.reels FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sellers can update own reels"
  ON public.reels FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sellers can delete own reels"
  ON public.reels FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 2. reel_likes table (one row per user per reel)
CREATE TABLE IF NOT EXISTS public.reel_likes (
  id       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id  uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE (reel_id, user_id)
);

CREATE INDEX IF NOT EXISTS reel_likes_reel_id_idx ON public.reel_likes(reel_id);

ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reel likes"       ON public.reel_likes;
DROP POLICY IF EXISTS "Authenticated users can like"     ON public.reel_likes;
DROP POLICY IF EXISTS "Authenticated users can unlike"   ON public.reel_likes;

CREATE POLICY "Anyone can view reel likes"
  ON public.reel_likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like"
  ON public.reel_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can unlike"
  ON public.reel_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3. reel_comments table
CREATE TABLE IF NOT EXISTS public.reel_comments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id    uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Anonymous',
  text       text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reel_comments_reel_id_idx    ON public.reel_comments(reel_id);
CREATE INDEX IF NOT EXISTS reel_comments_created_at_idx ON public.reel_comments(created_at ASC);

ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reel comments"       ON public.reel_comments;
DROP POLICY IF EXISTS "Authenticated users can comment"     ON public.reel_comments;
DROP POLICY IF EXISTS "Users can delete own comments"       ON public.reel_comments;

CREATE POLICY "Anyone can view reel comments"
  ON public.reel_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment"
  ON public.reel_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.reel_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4. Helper function: increment reel views safely
CREATE OR REPLACE FUNCTION public.increment_reel_views(reel_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.reels SET views = views + 1 WHERE id = reel_id;
$$;
