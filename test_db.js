import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lpmdbmzvvnpyuukvahiy.supabase.co',
  'sb_publishable_0yyeE9BeKTfoSeRl37sbNw_AvYDQ9QA'
);

async function check() {
  console.log('=== users table ===');
  const { data, error } = await supabase.from('users').select('*').limit(5);
  if (error) console.log('ERROR:', error.message, error.code);
  else {
    console.log('Row count:', data.length);
    console.log('Columns:', Object.keys(data[0] || {}));
    data.forEach((u, i) => {
      console.log(`\nUser ${i+1}:`);
      console.log('  user_id:', u.user_id);
      console.log('  full_name:', u.full_name);
      console.log('  brand_name:', u.brand_name);
      console.log('  brand_story:', u.brand_story);
      console.log('  avatar_url:', u.avatar_url);
      console.log('  phone:', u.phone);
      console.log('  bag_categories:', u.bag_categories);
    });
  }

  console.log('\n=== products user_ids ===');
  const { data: prods } = await supabase.from('products').select('user_id, seller_name').limit(5);
  prods?.forEach(p => console.log(' ', p.user_id, '-', p.seller_name));
}

check();
