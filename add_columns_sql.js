// Script to add missing columns to products table using raw SQL
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lpmdbmzvvnpyuukvahiy.supabase.co';
const supabaseKey = 'sb_publishable_0yyeE9BeKTfoSeRl37sbNw_AvYDQ9QA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumns() {
  try {
    // Try to add quantity column
    console.log('Adding quantity column...');
    const { error: qtyError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;`
    });

    if (qtyError) {
      console.log('Error adding quantity column:', qtyError.message);
    } else {
      console.log('Quantity column added successfully');
    }

    // Try to add colors column
    console.log('Adding colors column...');
    const { error: colorError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT '{}';`
    });

    if (colorError) {
      console.log('Error adding colors column:', colorError.message);
    } else {
      console.log('Colors column added successfully');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

addColumns();