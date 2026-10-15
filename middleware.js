/**
 * Vercel Edge Middleware — serves real per-page SEO metadata to crawlers.
 *
 * This is a client-side-rendered SPA (see src/hooks/useSEO.js): real users get
 * correct title/description/JSON-LD only after JS runs. Crawlers that don't
 * execute JS (most of robots.txt's allow-list, plus link-preview bots) see the
 * same generic index.html on every /products, /seller, /vendor URL. This
 * middleware detects those bots, looks up the underlying Supabase record, and
 * injects the same meta fields useSEO() would apply client-side — so bots and
 * real users end up seeing equivalent metadata (dynamic rendering, not
 * cloaking). Everything else (human traffic) passes through untouched.
 */

import { sellerPath } from './src/utils/sellerPath.js';
import { SEO_CATEGORIES, categoryPath, categorySEO } from './src/utils/categories.js';

export const config = {
  matcher: ['/products', '/products/:path*', '/seller/:path*', '/vendor/:path*'],
};

const SITE_URL = 'https://www.bagsearch.shop';
const SITE_NAME = 'BagSearch';

const BOT_UA_RE =
  /GPTBot|ChatGPT-User|ClaudeBot|anthropic-ai|PerplexityBot|Google-Extended|Googlebot|Amazonbot|Meta-ExternalAgent|cohere-ai|CCBot|YouBot|facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|Slackbot|LinkedInBot|Discordbot|Bingbot/i;

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
  return `/products/${slugify(name)}--${String(id).slice(0, 8)}`;
}

function extractIdFromParam(param) {
  if (!param) return null;
  const parts = param.split('--');
  if (parts.length > 1) return parts[parts.length - 1];
  return param;
}

// Sentinel for "the lookup succeeded and the record does not exist", as
// opposed to null, which means "lookup failed or wasn't possible". Only
// NOT_FOUND may turn into a 404 — a Supabase outage must never 404 real pages.
const NOT_FOUND = Symbol('not-found');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHORT_ID_RE = /^[0-9a-f]{8}$/i;

async function supabaseFetch(path) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function firstRowOrNotFound(rows) {
  if (!Array.isArray(rows)) return null;
  return rows.length > 0 ? rows[0] : NOT_FOUND;
}

async function fetchProductByParam(rawParam) {
  const resolvedId = extractIdFromParam(rawParam);
  if (!resolvedId) return null;

  if (SHORT_ID_RE.test(resolvedId) && resolvedId !== rawParam) {
    // Short id = first 8 hex chars of the uuid. Query the uuid range sharing
    // that prefix instead of scanning only the latest 500 products.
    const p = resolvedId.toLowerCase();
    const rows = await supabaseFetch(
      `products?select=*&id=gte.${p}-0000-0000-0000-000000000000&id=lte.${p}-ffff-ffff-ffff-ffffffffffff&limit=1`
    );
    return firstRowOrNotFound(rows);
  }

  if (UUID_RE.test(resolvedId)) {
    return firstRowOrNotFound(await supabaseFetch(`products?select=*&id=eq.${resolvedId}`));
  }

  return null;
}

const VENDOR_FIELDS = 'user_id,full_name,brand_name,brand_story,avatar_url,profile_slug';

async function fetchVendorByParam(rawParam) {
  if (!rawParam) return null;
  // Same resolution as the app: user_id for uuids, otherwise profile_slug.
  const filter = UUID_RE.test(rawParam)
    ? `user_id=eq.${rawParam}`
    : `profile_slug=eq.${encodeURIComponent(rawParam)}`;
  const vendor = firstRowOrNotFound(await supabaseFetch(`users?select=${VENDOR_FIELDS}&${filter}`));
  return vendor === NOT_FOUND ? null : vendor;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const PRODUCT_LIST_FIELDS = 'id,name,brand,price,discounted_price,images';
const LIST_LIMIT = 48;

function naira(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? `₦${Math.round(n).toLocaleString('en-NG')}` : '';
}

async function fetchSellerSummary(userId) {
  if (!UUID_RE.test(String(userId || ''))) return null;
  const rows = await supabaseFetch(`users?select=user_id,brand_name,full_name,profile_slug&user_id=eq.${userId}`);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function fetchProductsBySeller(userId) {
  const rows = await supabaseFetch(
    `products?select=${PRODUCT_LIST_FIELDS}&user_id=eq.${userId}&order=created_at.desc&limit=${LIST_LIMIT}`
  );
  return Array.isArray(rows) ? rows : [];
}

async function fetchProductsByCategory(id) {
  const cat = SEO_CATEGORIES[id];
  if (!cat) return [];
  const or = cat.match.map((m) => `category.ilike.*${m}*`).join(',');
  const rows = await supabaseFetch(
    `products?select=${PRODUCT_LIST_FIELDS}&or=(${encodeURIComponent(or)})&order=created_at.desc&limit=${LIST_LIMIT}`
  );
  return Array.isArray(rows) ? rows : [];
}

// Crawler-visible list of product links — mirrors what the app renders.
function productListHtml(products) {
  if (!products.length) return '<p>No bags listed right now — check back soon.</p>';
  const items = products
    .filter((p) => p.id && p.name)
    .map((p) => {
      const price = p.discounted_price ? naira(p.discounted_price) : naira(p.price);
      const label = [p.brand, price].filter(Boolean).join(' · ');
      return `<li><a href="${productPath(p.name, p.id)}">${escapeHtml(p.name)}</a>${label ? ` — ${escapeHtml(label)}` : ''}</li>`;
    })
    .join('');
  return `<ul>${items}</ul>`;
}

function buildProductMeta(product, seller) {
  const name = product.name || 'Product';
  const brand = product.brand || '';
  const path = productPath(name, product.id);
  const canonicalUrl = `${SITE_URL}${path}`;
  const image = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : `${SITE_URL}/og-default.jpg`;

  const title = `${name}${brand ? ` | ${brand} Bag` : ''} | BagSearch Nigeria`;
  const description = `Buy authentic ${brand ? `${brand} ` : ''}${name}. ${(product.description || '').slice(0, 120)} Available on BagSearch Nigeria.`;
  const keywords = [brand, product.category, name, 'luxury bag Nigeria', 'authentic designer bag', `buy ${brand} bag`, `${product.category} Nigeria`]
    .filter(Boolean)
    .join(', ');

  const sellerName = seller?.brand_name || seller?.full_name || product.seller_name || 'BagSearch seller';
  const sellerUrlPath = sellerPath(seller?.profile_slug, product.user_id || product.seller_id);
  const price = parseFloat(product.price) || 0;
  const quantity = product.quantity != null ? parseInt(product.quantity) : null;
  const availability =
    quantity === 0
      ? 'https://schema.org/OutOfStock'
      : quantity != null && quantity < 3
      ? 'https://schema.org/LimitedAvailability'
      : 'https://schema.org/InStock';
  const conditionLower = (product.condition || '').toLowerCase();
  const itemCondition = conditionLower.includes('new')
    ? 'https://schema.org/NewCondition'
    : conditionLower.includes('refurb')
    ? 'https://schema.org/RefurbishedCondition'
    : 'https://schema.org/UsedCondition';

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${canonicalUrl}#product`,
        name,
        description: product.description,
        image: product.images,
        sku: product.id,
        brand: { '@type': 'Brand', name: brand },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'NGN',
          price,
          priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          availability,
          itemCondition,
          url: canonicalUrl,
          seller: { '@type': 'Organization', name: sellerName, url: `${SITE_URL}${sellerUrlPath}` },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
          { '@type': 'ListItem', position: 3, name, item: canonicalUrl },
        ],
      },
    ],
  };

  const offerPrice = product.discounted_price ? naira(product.discounted_price) : naira(product.price);
  const facts = [
    brand && `Brand: ${escapeHtml(brand)}`,
    product.category && `Category: ${escapeHtml(product.category)}`,
    product.condition && `Condition: ${escapeHtml(product.condition)}`,
  ].filter(Boolean).join(' · ');
  const body = `
    <nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/products">Bags</a> › ${escapeHtml(name)}</nav>
    <article>
      <h1>${escapeHtml(name)}</h1>
      <img src="${escapeHtml(image)}" alt="${escapeHtml(brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${name}` : name)}" width="600" height="750" style="max-width:100%;height:auto;">
      ${facts ? `<p>${facts}</p>` : ''}
      ${offerPrice ? `<p>Price: <strong>${offerPrice}</strong>${product.discounted_price ? ` <s>${naira(product.price)}</s>` : ''}</p>` : ''}
      <p>${availability.endsWith('OutOfStock') ? 'Sold out' : 'In stock'}</p>
      ${product.description ? `<p>${escapeHtml(product.description)}</p>` : ''}
      <p>Sold by <a href="${sellerUrlPath}">${escapeHtml(sellerName)}</a>, delivering across Nigeria.</p>
    </article>
    <p><a href="/products">Browse more designer bags</a></p>`;

  return { title, description, keywords, image, canonicalUrl, type: 'website', schema, body };
}

function buildVendorMeta(vendor, products) {
  const sellerName = vendor.brand_name || vendor.full_name || 'Verified Seller';
  // Same canonical the app uses, whichever of /seller/{slug}, /seller/{uuid}
  // or /vendor/{...} the bot requested.
  const canonicalUrl = `${SITE_URL}${sellerPath(vendor.profile_slug, vendor.user_id)}`;

  const title = `${sellerName} | Verified Seller | BagSearch`;
  const description = `Browse ${sellerName}'s authentic bag collection on BagSearch. Verified seller delivering across Nigeria.`;
  const keywords = `${sellerName} seller, verified seller, ${sellerName} bags, authentic bags Nigeria`;
  const image = vendor.avatar_url || `${SITE_URL}/logo.png`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: sellerName,
    description: vendor.brand_story || `Verified seller on BagSearch`,
    logo: image,
    url: canonicalUrl,
  };

  const body = `
    <nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/vendors">Sellers</a> › ${escapeHtml(sellerName)}</nav>
    <h1>${escapeHtml(sellerName)}</h1>
    <p>${escapeHtml(vendor.brand_story || `${sellerName} is a verified bag seller on BagSearch, delivering across Nigeria.`)}</p>
    <h2>Bags from ${escapeHtml(sellerName)}</h2>
    ${productListHtml(products)}
    <p><a href="/vendors">See all verified sellers</a></p>`;

  return { title, description, keywords, image, canonicalUrl, type: 'ProfilePage', schema, body };
}

function buildCategoryMeta(id, products) {
  const seo = categorySEO(id);
  const canonicalUrl = `${SITE_URL}${categoryPath(id)}`;
  const image = products.find((p) => Array.isArray(p.images) && p.images[0])?.images[0] || `${SITE_URL}/og-default.jpg`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: seo.h1,
    description: seo.description,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 20).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}${productPath(p.name, p.id)}`,
        name: p.name,
      })),
    },
  };
  const body = `
    <nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/products">Bags</a> › ${escapeHtml(SEO_CATEGORIES[id].label)}</nav>
    <h1>${escapeHtml(seo.h1)}</h1>
    <p>${escapeHtml(seo.description)}</p>
    ${productListHtml(products)}
    <p>More categories: ${Object.entries(SEO_CATEGORIES)
      .filter(([cid]) => cid !== id)
      .map(([cid, c]) => `<a href="${categoryPath(cid)}">${escapeHtml(c.label)}</a>`)
      .join(' · ')}</p>`;

  return { title: seo.title, description: seo.description, keywords: seo.keywords, image, canonicalUrl, type: 'website', schema, body };
}

function injectMeta(html, meta) {
  let out = html;

  out = out.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(meta.title)}</title>`);
  out = out.replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${escapeHtml(meta.description)}$2`);
  out = out.replace(/(<meta\s+name="keywords"\s+content=")[^"]*(")/, `$1${escapeHtml(meta.keywords)}$2`);
  out = out.replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${meta.canonicalUrl}$2`);

  out = out.replace(/(<meta\s+property="og:type"\s+content=")[^"]*(")/, `$1${meta.type}$2`);
  out = out.replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${escapeHtml(meta.title)}$2`);
  out = out.replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${escapeHtml(meta.description)}$2`);
  out = out.replace(/(<meta\s+property="og:image"\s+content=")[^"]*(")/, `$1${meta.image}$2`);
  out = out.replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/, `$1${meta.canonicalUrl}$2`);

  out = out.replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/, `$1${escapeHtml(meta.title)}$2`);
  out = out.replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, `$1${escapeHtml(meta.description)}$2`);
  out = out.replace(/(<meta\s+name="twitter:image"\s+content=")[^"]*(")/, `$1${meta.image}$2`);

  // Escape "<" so seller-written text can't close the <script> tag.
  const schemaJson = JSON.stringify(meta.schema).replace(/</g, '\\u003c');
  const schemaScript = `<script type="application/ld+json" id="seo-jsonld-bot">${schemaJson}</script>`;
  out = out.replace('</head>', `${schemaScript}\n  </head>`);

  // Replace the homepage body inside #static-prerender with this page's own
  // content, so crawlers that don't run JS see the product/seller/category.
  if (meta.body) {
    out = out.replace(/(<div id="static-prerender"[\s\S]*?<main[^>]*>)[\s\S]*?(<\/main>)/, (_, open, close) => `${open}${meta.body}\n        ${close}`);
  }

  return out;
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_UA_RE.test(ua)) return;

  const url = new URL(request.url);
  const { pathname } = url;

  let meta = null;
  let productMissing = false;

  if (pathname === '/products' || pathname === '/products/') {
    // Only category pages get custom content; plain /products is prerendered.
    const categoryId = url.searchParams.get('category');
    if (!SEO_CATEGORIES[categoryId]) return;
    meta = buildCategoryMeta(categoryId, await fetchProductsByCategory(categoryId));
  } else if (pathname.startsWith('/products/')) {
    const param = pathname.slice('/products/'.length).split('/')[0];
    const product = await fetchProductByParam(decodeURIComponent(param));
    if (product === NOT_FOUND) productMissing = true;
    else if (product) meta = buildProductMeta(product, await fetchSellerSummary(product.user_id || product.seller_id));
  } else if (pathname.startsWith('/seller/') || pathname.startsWith('/vendor/')) {
    const prefix = pathname.startsWith('/seller/') ? '/seller/' : '/vendor/';
    const param = pathname.slice(prefix.length).split('/')[0];
    const vendor = await fetchVendorByParam(decodeURIComponent(param));
    if (vendor) meta = buildVendorMeta(vendor, await fetchProductsBySeller(vendor.user_id));
  }

  if (!meta && !productMissing) return;

  const shellRes = await fetch(new URL('/index.html', request.url), {
    headers: { 'user-agent': ua },
  });
  if (!shellRes.ok) return;

  const shellHtml = await shellRes.text();

  if (productMissing) {
    // Deleted/sold or mistyped listing: tell crawlers it's gone instead of
    // serving a 200 that duplicates the homepage (soft 404).
    const html = shellHtml
      .replace(/<title>.*?<\/title>/s, `<title>Product not found | ${SITE_NAME}</title>`)
      .replace(/(<meta\s+name="robots"\s+content=")[^"]*(")/, '$1noindex, follow$2');
    return new Response(html, {
      status: 404,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=600',
        'x-robots-tag': 'noindex, follow',
      },
    });
  }

  const html = injectMeta(shellHtml, meta);

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
      'x-robots-tag': 'index, follow',
    },
  });
}
