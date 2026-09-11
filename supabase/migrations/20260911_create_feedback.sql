-- ============================================================================
-- Feedback table — collects user feedback about the app
-- Run this migration against your Supabase project to create the feedback table.
-- ============================================================================

CREATE TABLE IF NOT EXISTS feedback (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email    text,
  user_name     text DEFAULT 'Anonymous',
  rating        integer CHECK (rating >= 0 AND rating <= 5) DEFAULT 0,
  comment       text DEFAULT '',
  page          text DEFAULT '/',           -- which page the feedback was submitted from
  user_agent    text,                       -- browser/device info for debugging
  is_read       boolean DEFAULT false,      -- for admin to track reviewed feedback
  created_at    timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_is_read ON feedback(is_read) WHERE is_read = false;

-- RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (even anonymous) can insert feedback
CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- Only the user who submitted can see their own feedback
CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);
