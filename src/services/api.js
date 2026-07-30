// src/services/api.js
import { createClient } from '@supabase/supabase-js';

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

// Canonical bag color ids, matching BAG_COLORS in createProduct.jsx (the `colors` column
// is a text[] array of these ids, not free text, so ilike on name/description alone
// can't match a color-only search like "black bags").
const COLOR_KEYWORDS = [
  'black', 'white', 'beige', 'camel', 'tan', 'brown', 'burgundy', 'red', 'pink', 'blush',
  'orange', 'yellow', 'olive', 'green', 'mint', 'teal', 'navy', 'blue', 'cobalt', 'purple',
  'lavender', 'grey', 'silver', 'gold', 'multicolor',
];
const COLOR_ALIASES = { gray: 'grey', multi: 'multicolor', multicolour: 'multicolor' };

// 6. Server-side text search with Supabase ilike
export async function searchProducts(query, locationId = null, category = null) {
  try {
    let queryBuilder = supabase
      .from('products')
      .select('*');

    // Apply text search with ilike (case-insensitive)
    if (query && query.trim()) {
      const trimmed = query.trim();
      const searchTerm = `%${trimmed}%`;
      const orClauses = [
        `name.ilike.${searchTerm}`,
        `brand.ilike.${searchTerm}`,
        `description.ilike.${searchTerm}`,
        `category.ilike.${searchTerm}`,
        `seller_name.ilike.${searchTerm}`,
      ];

      // Also match color words (e.g. "black", "white") against the colors array,
      // so "black bags" surfaces products by their selected colors, not just
      // products whose name/description happen to literally say "black bags".
      const matchedColors = new Set();
      for (const word of trimmed.toLowerCase().split(/\s+/)) {
        const canonical = COLOR_ALIASES[word] || word;
        if (COLOR_KEYWORDS.includes(canonical)) matchedColors.add(canonical);
      }
      for (const color of matchedColors) {
        orClauses.push(`colors.cs.{${color}}`);
      }

      queryBuilder = queryBuilder.or(orClauses.join(','));
    }

    // Apply location filter
    if (locationId && locationId !== 'all') {
      const LAGOS_IDS = ['lagos', 'lagos-island', 'lagos-mainland', 'victoria-island', 'lekki'];
      if (locationId === 'lagos') {
        queryBuilder = queryBuilder.in('location', LAGOS_IDS);
      } else {
        queryBuilder = queryBuilder.eq('location', locationId);
      }
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