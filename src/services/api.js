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
    { url: supabaseUrl, keyLength: supabaseKey ? supabaseKey.length : 0 }
  );
} else {
  console.log('Supabase initialized with URL:', supabaseUrl, 'and key starting with:', supabaseKey.substring(0, 10));
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