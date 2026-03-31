import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lpmdbmzvvnpyuukvahiy.supabase.co',
  'sb_publishable_0yyeE9BeKTfoSeRl37sbNw_AvYDQ9QA'
);

async function check() {
  const { data } = await supabase.from('products').select('name, whatsapp').limit(5);
  data?.forEach(p => {
    const raw = p.whatsapp || '';
    const digits = raw.replace(/\D/g, '');
    console.log(`Product: ${p.name}`);
    console.log(`  whatsapp raw: "${raw}"`);
    console.log(`  digits only: "${digits}"`);
    console.log(`  wa.me link: https://wa.me/${digits}`);
    console.log('');
  });
}

check();
