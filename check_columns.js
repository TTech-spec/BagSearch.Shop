import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lpmdbmzvvnpyuukvahiy.supabase.co';
const supabaseKey = 'sb_publishable_0yyeE9BeKTfoSeRl37sbNw_AvYDQ9QA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns:', Object.keys(data[0] || {}));
    console.log('Data:', data[0]);
  }
}
check();
