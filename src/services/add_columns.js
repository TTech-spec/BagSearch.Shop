// Script to add missing columns to products table
import { supabase } from './services/api.js';

async function addMissingColumns() {
  try {
    // Add quantity column if it doesn't exist
    const { error: qtyError } = await supabase.rpc('add_column_if_not_exists', {
      table_name: 'products',
      column_name: 'quantity',
      column_type: 'integer',
      default_value: 1
    });

    if (qtyError) {
      console.log('Quantity column might already exist or RPC not available:', qtyError.message);
    }

    // Add colors column if it doesn't exist
    const { error: colorError } = await supabase.rpc('add_column_if_not_exists', {
      table_name: 'products',
      column_name: 'colors',
      column_type: 'text[]',
      default_value: '[]'
    });

    if (colorError) {
      console.log('Colors column might already exist or RPC not available:', colorError.message);
    }

    console.log('Attempted to add missing columns');
  } catch (error) {
    console.error('Error adding columns:', error);
  }
}

addMissingColumns();