import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lpmdbmzvvnpyuukvahiy.supabase.co',
  'sb_publishable_0yyeE9BeKTfoSeRl37sbNw_AvYDQ9QA'
);

async function run() {
  // Test if table exists
  const { error } = await supabase.from('search_history').select('id').limit(1);
  if (!error) {
    console.log('search_history table already exists');
    return;
  }

  console.log('Table missing, creating via SQL...');

  // Create via raw SQL using Supabase's rpc or just insert a dummy row approach
  // Since we can't run DDL with anon key, print the SQL to run in Supabase dashboard
  console.log('\nRun this SQL in your Supabase SQL Editor:\n');
  console.log(`
CREATE TABLE IF NOT EXISTS public.search_history (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query       text NOT NULL,
  type        text NOT NULL DEFAULT 'text',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_history_user_id_idx ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS search_history_created_at_idx ON public.search_history(created_at DESC);

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
  `);
}

run();
