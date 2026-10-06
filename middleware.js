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

export const config = {
  matcher: ['/products/:path*', '/seller/:path*', '/vendor/:path*'],
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

function buildProductMeta(product) {
  const name = product.name || 'Product';
  const brand = product.brand || '';
  const path = productPath(name, product.id);
  const canonicalUrl = `${SITE_URL}${path}`;
  const image = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : `${SITE_URL}/og-default.jpg`;

  const title = `${name} | ${brand} Bag | BagSearch Nigeria`;
  const description = `Buy authentic ${brand} ${name}. ${(product.description || '').slice(0, 120)} Available on BagSearch Nigeria.`;
  const keywords = [brand, product.category, name, 'luxury bag Nigeria', 'authentic designer bag', `buy ${brand} bag`, `${product.category} Nigeria`]
    .filter(Boolean)
    .join(', ');

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
          seller: { '@type': 'Organization', name: product.seller_name || 'Anonymous Seller', url: `${SITE_URL}/seller/${product.user_id || product.seller_id || ''}` },
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

  return { title, description, keywords, image, canonicalUrl, type: 'website', schema };
}

function buildVendorMeta(vendor, rawParam) {
  const sellerName = vendor.brand_name || vendor.full_name || 'Verified Seller';
  const canonicalUrl = `${SITE_URL}/seller/${rawParam}`;

  const title = `${sellerName} | Verified Seller | BagSearch`;
  const description = `Browse ${sellerName}'s authentic bag collection on BagSearch. Verified seller delivering across Nigeria.`;
  const keywords = `${sellerName} seller, verified seller, ${sellerName} bags, authentic bags Nigeria`;
  const image = vendor.avatar_url || `${SITE_URL}/logo.png`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: sellerName,
    description: vendor.brand_story || `Verified seller on BagSearch`,
    image,
    url: canonicalUrl,
  };

  return { title, description, keywords, image, canonicalUrl, type: 'ProfilePage', schema };
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

  const schemaScript = `<script type="application/ld+json" id="seo-jsonld-bot">${JSON.stringify(meta.schema)}</script>`;
  out = out.replace('</head>', `${schemaScript}\n  </head>`);

  return out;
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_UA_RE.test(ua)) return;

  const url = new URL(request.url);
  const { pathname } = url;

  let meta = null;
  let productMissing = false;

  if (pathname.startsWith('/products/')) {
    const param = pathname.slice('/products/'.length).split('/')[0];
    const product = await fetchProductByParam(decodeURIComponent(param));
    if (product === NOT_FOUND) productMissing = true;
    else if (product) meta = buildProductMeta(product);
  } else if (pathname.startsWith('/seller/') || pathname.startsWith('/vendor/')) {
    const prefix = pathname.startsWith('/seller/') ? '/seller/' : '/vendor/';
    const param = pathname.slice(prefix.length).split('/')[0];
    const vendor = await fetchVendorByParam(decodeURIComponent(param));
    if (vendor) meta = buildVendorMeta(vendor, decodeURIComponent(param));
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
