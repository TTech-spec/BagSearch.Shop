import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lpmdbmzvvnpyuukvahiy.supabase.co',
  'sb_publishable_0yyeE9BeKTfoSeRl37sbNw_AvYDQ9QA'
);

async function check() {
  const { data, error } = await supabase.from('products').select('*').limit(3);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Columns:", Object.keys(data[0] || {}));
    data.forEach((p, i) => {
      console.log(`\n--- Product ${i + 1} ---`);
      console.log("name:", p.name);
      console.log("quantity:", p.quantity, "(type:", typeof p.quantity, ")");
      console.log("colors:", p.colors, "(type:", typeof p.colors, ")");
    });
  }
}

check();
