// src/services/api.js
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// 1. Load variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// 2. validation helper
const isKeyValid = (key) => key && key.length > 20;

if (!supabaseUrl || !isKeyValid(supabaseKey)) {
  console.error(
    'CRITICAL: Supabase credentials missing or invalid in .env file.', 
    { url: supabaseUrl ? 'configured' : 'missing', keyLength: supabaseKey ? supabaseKey.length : 0 }
  );
} else {
  // Removed sensitive key logging for security
  console.log('Supabase initialized successfully');
}

// 3. Initialize Supabase
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseKey || ''
);

// 4. Helper to block requests if config is wrong
export const ensureSupabaseReady = () => {
  if (!supabaseUrl || !isKeyValid(supabaseKey)) {
    throw new Error('Supabase is not configured correctly. Check your .env VITE_SUPABASE_ANON_KEY.');
  }
};

// 5. API instance (optional, for your other backend calls)
export const api = axios.create({
  baseURL: 'https://your-api-base-url.com', 
});

// 6. Server-side text search with Supabase ilike
export async function searchProducts(query, locationId = null, category = null) {
  try {
    let queryBuilder = supabase
      .from('products')
      .select('*')
      .eq('status', 'active');

    // Apply text search with ilike (case-insensitive)
    if (query && query.trim()) {
      const searchTerm = `%${query.trim()}%`;
      queryBuilder = queryBuilder.or(
        `name.ilike.${searchTerm},brand.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm},sub.ilike.${searchTerm},seller.ilike.${searchTerm}`
      );
    }

    // Apply location filter
    if (locationId && locationId !== 'all') {
      queryBuilder = queryBuilder.eq('location', locationId);
    }

    // Apply category filter
    if (category && category !== 'all') {
      queryBuilder = queryBuilder.eq('category', category);
    }

    const { data, error } = await queryBuilder;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}