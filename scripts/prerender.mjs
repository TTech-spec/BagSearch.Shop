/**
 * prerender.mjs — Post-build static HTML generator
 *
 * Runs after `vite build`. For each static route, it copies dist/index.html,
 * injects the correct <title>, <meta description>, canonical, and OG tags,
 * and writes the result to dist/{route}/index.html.
 *
 * This means non-JS crawlers (Bing, WhatsApp, Twitter scrapers) immediately
 * receive the correct metadata without executing JavaScript.
 *
 * The React bundle still loads and hydrates normally for real users.
 *
 * Usage: node scripts/prerender.mjs
 * Called automatically by the build script in package.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { faqSchema } from '../src/utils/contactFaq.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const SITE_URL = 'https://www.bagsearch.shop';

// ── Static route definitions ───────────────────────────────────────────────
const ROUTES = [
  {
    path: '/',
    title: 'BagSearch | Buy & Sell Luxury Designer Bags in Nigeria',
    description: "Nigeria's AI-powered luxury bag marketplace. Upload any photo to find matching bags instantly. Buy authentic Chanel, Hermès, LV & more. Free for sellers to list.",
    ogType: 'website',
  },
  {
    path: '/products',
    h1: 'Shop Luxury Designer Bags in Nigeria',
    title: 'Shop Luxury Designer Bags in Nigeria | BagSearch',
    description: 'Browse authentic luxury designer handbags, shoulder bags, clutches and totes. Shop Chanel, Hermès, Louis Vuitton, Gucci from verified sellers across Nigeria.',
    ogType: 'website',
  },
  {
    path: '/hot-deals',
    h1: 'Hot Deals on Designer Bags',
    title: 'Hot Deals & Discounted Bags | BagSearch Nigeria',
    description: 'Limited-time deals on authentic luxury bags. Up to 70% off designer handbags, totes & clutches from verified sellers across Nigeria. Shop before they sell out!',
    ogType: 'website',
  },
  {
    path: '/about',
    h1: 'About BagSearch',
    title: "About BagSearch | Nigeria's AI Luxury Bag Marketplace",
    description: "Learn about BagSearch, Nigeria's AI-powered luxury bag marketplace. Our story, mission, and commitment to authentic bags and verified sellers across Nigeria.",
    ogType: 'website',
  },
  {
    path: '/contact',
    h1: 'Contact BagSearch',
    schema: { '@context': 'https://schema.org', ...faqSchema() },
    title: 'Contact Us | BagSearch Support Nigeria',
    description: 'Contact BagSearch support via WhatsApp or email. Get help with orders, listings, and accounts. Available Mon–Sat 8AM–8PM WAT.',
    ogType: 'website',
  },
  {
    path: '/policy',
    h1: 'Privacy Policy',
    title: 'Privacy Policy | BagSearch Nigeria',
    description: "Read the BagSearch privacy policy. Learn how we collect, use, and protect your personal data on Nigeria's luxury bag marketplace.",
    ogType: 'website',
  },
  {
    path: '/terms-of-service',
    h1: 'Terms of Service',
    title: 'Terms of Service | BagSearch Nigeria',
    description: "Read BagSearch's terms of service. Rules and guidelines for buyers and sellers on Nigeria's luxury bag marketplace.",
    ogType: 'website',
  },
  {
    path: '/vendors',
    h1: 'Verified Bag Sellers in Nigeria',
    title: 'Verified Bag Sellers & Vendors in Nigeria | BagSearch',
    description: 'Browse verified bag sellers across Lagos, Abuja and all of Nigeria. Compare ratings, see each vendor’s collection and chat with sellers directly on BagSearch.',
    ogType: 'website',
  },
  {
    path: '/reels',
    h1: 'Bag Videos from Nigerian Sellers',
    title: 'Reels — Bag Videos | BagSearch',
    description: 'Watch short bag videos from verified sellers across Nigeria: unboxings, styling tips and close-up showcases of designer handbags, totes and clutches.',
    ogType: 'website',
  },
  {
    path: '/pricing',
    h1: 'Seller Plans & Pricing',
    title: 'Seller Plans & Pricing | BagSearch Nigeria',
    description: 'Choose a plan to sell bags on BagSearch. Free, Pro (₦1,000/mo), or Premium (₦5,000/mo). Unlimited uploads, search boost, and more.',
    ogType: 'website',
  },
];

// ── HTML tag injection helpers ─────────────────────────────────────────────

function setTag(html, selector, attr, value) {
  const escaped = value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const re = new RegExp(`(<${selector}[^>]*\\s${attr}=")[^"]*(")`,'i');
  if (re.test(html)) return html.replace(re, `$1${escaped}$2`);
  return html;
}

function injectMeta(html, route) {
  const canonical = `${SITE_URL}${route.path}`;
  const { title, description, ogType = 'website' } = route;

  // <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

  // <meta name="description">
  html = setTag(html, 'meta[^>]*name="description"', 'content', description);

  // <link rel="canonical">
  html = setTag(html, 'link[^>]*rel="canonical"', 'href', canonical);

  // OG tags
  html = setTag(html, 'meta[^>]*property="og:title"', 'content', title);
  html = setTag(html, 'meta[^>]*property="og:description"', 'content', description);
  html = setTag(html, 'meta[^>]*property="og:url"', 'content', canonical);
  html = setTag(html, 'meta[^>]*property="og:type"', 'content', ogType);

  // Twitter tags
  html = setTag(html, 'meta[^>]*name="twitter:title"', 'content', title);
  html = setTag(html, 'meta[^>]*name="twitter:description"', 'content', description);

  // Page-specific JSON-LD (e.g. the FAQ on /contact)
  if (route.schema) {
    const json = JSON.stringify(route.schema).replace(/</g, '\\u003c');
    html = html.replace('</head>', `<script type="application/ld+json">${json}</script>\n  </head>`);
  }

  // Crawler-only body (#static-prerender): swap the homepage hero heading and
  // intro for this page's own, so every route doesn't read as the homepage.
  if (route.h1) {
    const text = (v) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    html = html.replace(
      /(<h1 id="hero-h1"[^>]*>)[\s\S]*?(<\/h1>\s*<p[^>]*>)[\s\S]*?(<\/p>)/,
      `$1${text(route.h1)}$2${text(description)}$3`
    );
  }

  return html;
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  const indexPath = path.join(DIST, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('❌  dist/index.html not found — run `vite build` first');
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(indexPath, 'utf-8');
  let generated = 0;

  for (const route of ROUTES) {
    if (route.path === '/') {
      const html = injectMeta(baseHtml, route);
      fs.writeFileSync(indexPath, html, 'utf-8');
      console.log(`✓  /  →  dist/index.html`);
      generated++;
      continue;
    }

    const routeDir = path.join(DIST, route.path.replace(/^\//, ''));
    fs.mkdirSync(routeDir, { recursive: true });

    const html = injectMeta(baseHtml, route);
    const outPath = path.join(routeDir, 'index.html');
    fs.writeFileSync(outPath, html, 'utf-8');
    console.log(`✓  ${route.path}  →  dist${route.path}/index.html`);
    generated++;
  }

  console.log(`\n✅  Prerender complete — ${generated} pages generated`);
}

main();
