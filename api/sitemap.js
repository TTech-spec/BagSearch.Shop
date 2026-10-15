/**
 * Dynamic XML Sitemap — Vercel Serverless Function
 * Route: /api/sitemap  (rewritten to /sitemap.xml via vercel.json)
 *
 * Combines:
 *   1. Static pages (homepage, /products, /hot-deals, /about, /contact, etc.)
 *   2. All published products from Supabase (live, always up-to-date)
 *   3. All public seller profiles from Supabase
 *
 * Uses the same slug format as the React app:
 *   Products → /products/{slug}--{shortId}
 *   Sellers  → /seller/{profile_slug}, or /seller/{user_id} (see sellerPath)
 */

import { TEST_SLUG_RE, sellerPath } from '../src/utils/sellerPath.js';
import { SEO_CATEGORIES, categoryPath } from '../src/utils/categories.js';
import { SEO_LOCATIONS, locationPath } from '../src/utils/locations.js';

const SITE_URL = 'https://www.bagsearch.shop';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// Mirrors src/utils/slugify.js — must stay in sync
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function productPath(name, id) {
  const slug = slugify(name);
  const shortId = String(id).slice(0, 8);
  return `/products/${slug}--${shortId}`;
}

// Query Supabase REST API with keyset pagination to bypass the 1000-row cap
async function supabaseGet(table, select, filters = '') {
  const PAGE = 1000;
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Accept: 'application/json',
    Prefer: 'count=none',
  };
  let all = [];
  let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}${filters}&limit=${PAGE}&offset=${offset}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Supabase error ${res.status} on ${table}`);
    const page = await res.json();
    all = all.concat(page);
    if (page.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, lastmod, changefreq, priority) {
  const mod = lastmod ? lastmod.slice(0, 10) : new Date().toISOString().slice(0, 10);
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${mod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// Static pages that never change
const STATIC_PAGES = [
  { path: '/',               changefreq: 'daily',   priority: '1.0' },
  { path: '/products',       changefreq: 'hourly',  priority: '0.9' },
  ...Object.keys(SEO_CATEGORIES).map(id => ({ path: categoryPath(id), changefreq: 'daily', priority: '0.8' })),
  ...Object.keys(SEO_LOCATIONS).filter(id => SEO_LOCATIONS[id].sitemap).map(id => ({ path: locationPath(id), changefreq: 'daily', priority: '0.7' })),
  { path: '/hot-deals',      changefreq: 'daily',   priority: '0.8' },
  { path: '/vendors',        changefreq: 'daily',   priority: '0.7' },
  { path: '/reels',          changefreq: 'daily',   priority: '0.6' },
  { path: '/pricing',        changefreq: 'monthly', priority: '0.6' },
  { path: '/about',          changefreq: 'monthly', priority: '0.7' },
  { path: '/contact',        changefreq: 'monthly', priority: '0.5' },
  { path: '/policy',         changefreq: 'monthly', priority: '0.6' },
  { path: '/terms-of-service', changefreq: 'monthly', priority: '0.5' },
];

export default async function handler(req, res) {
  try {
    // Fetch products and sellers in parallel
    const [products, sellerRows] = await Promise.all([
      supabaseGet(
        'products',
        'id,name,updated_at,user_id',
        '&order=updated_at.desc'
      ).catch(() => []),
      supabaseGet(
        'users',
        'user_id,updated_at,profile_slug',
        '&role=eq.seller&order=updated_at.desc'
      ).catch(() => []),
    ]);

    // Only include sellers who have at least one listed product, never
    // test/QA accounts.
    const activeSellerIds = new Set(products.filter(p => p.user_id).map(p => p.user_id));
    const sellers = sellerRows
      .filter(s => activeSellerIds.has(s.user_id))
      .filter(s => !TEST_SLUG_RE.test(s.profile_slug || ''));

    const today = new Date().toISOString().slice(0, 10);

    const entries = [
      // 1. Static pages
      ...STATIC_PAGES.map(p =>
        urlEntry(`${SITE_URL}${p.path}`, today, p.changefreq, p.priority)
      ),

      // 2. Product pages
      ...products
        .filter(p => p.id && p.name)
        .map(p =>
          urlEntry(
            `${SITE_URL}${productPath(p.name, p.id)}`,
            p.updated_at || today,
            'weekly',
            '0.8'
          )
        ),

      // 3. Seller profile pages — same canonical URL the app and middleware use
      ...sellers
        .filter(s => s.user_id)
        .map(s =>
          urlEntry(
            `${SITE_URL}${sellerPath(s.profile_slug, s.user_id)}`,
            s.updated_at || today,
            'weekly',
            '0.6'
          )
        ),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.status(200).send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    // Fall back to a minimal valid sitemap so Google never gets a 500
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/products</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>
</urlset>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(fallback);
  }
}
