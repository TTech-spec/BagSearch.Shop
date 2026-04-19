/**
 * Sitemap generator - run via: npm run generate:sitemap
 * Uses native fetch (Node 18+) so no SDK keeps the process alive.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { slugify } from './slugify.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = resolve(__dirname, '../../.env');
try {
  const envFile = readFileSync(envPath, 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.warn('Warning: Could not read .env, using existing env vars');
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = (process.env.VITE_APP_URL || 'https://bag-search-shop.vercel.app').replace(/\/$/, '');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/products', priority: '0.9', changefreq: 'hourly' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
];

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isSchemaMismatch(message) {
  const lowered = String(message || '').toLowerCase();
  return (
    lowered.includes('does not exist') ||
    lowered.includes('could not find') ||
    lowered.includes('column')
  );
}

async function fetchProducts() {
  const queryVariants = [
    'select=id,name,updated_at,created_at&status=eq.active',
    'select=id,name,created_at&status=eq.active',
    'select=id,name,updated_at,created_at',
    'select=id,name,created_at',
  ];

  let lastError = null;

  for (const query of queryVariants) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?${query}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      return await res.json();
    }

    const text = await res.text();
    lastError = new Error(`Supabase error (${res.status}): ${text}`);

    if (!isSchemaMismatch(text)) {
      throw lastError;
    }
  }

  throw lastError || new Error('Failed to fetch products from Supabase');
}

async function generate() {
  console.log('Fetching products from Supabase...');

  const products = await fetchProducts();
  const today = new Date().toISOString().split('T')[0];

  const urls = [
    ...staticRoutes.map((route) => ({
      loc: `${SITE_URL}${route.path}`,
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority,
    })),
    ...products.map((product) => {
      const lastModified = product.updated_at || product.created_at || today;
      return {
        loc: `${SITE_URL}/products/${slugify(product.name)}--${String(product.id).slice(0, 8)}`,
        lastmod: lastModified.split('T')[0],
        changefreq: 'weekly',
        priority: '0.8',
      };
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  const outPath = resolve(__dirname, '../../public/sitemap.xml');
  writeFileSync(outPath, xml, 'utf-8');

  console.log(`Created sitemap.xml with ${urls.length} URLs (${products.length} products + ${staticRoutes.length} static)`);
  console.log(outPath);
}

generate().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
