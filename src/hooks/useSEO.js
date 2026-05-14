/**
 * useSEO — dynamically updates <head> meta tags for SEO, OG, and Twitter Cards.
 * Works with Vite + React (no SSR). For full crawlability, consider adding
 * a prerender step (e.g. vite-plugin-prerender) in production.
 */
import { useEffect } from 'react';

const SITE_NAME = 'BagSearch';
const SITE_URL = import.meta.env.VITE_APP_URL || 'https://bagsearch.shop';

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useSEO({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  schema,
}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL;
    const ogImage = image || `${SITE_URL}/og-default.jpg`;

    // ── Basic ──────────────────────────────────────────────────────────────
    document.title = fullTitle;
    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('robots', 'index, follow');

    // ── Canonical ──────────────────────────────────────────────────────────
    setLink('canonical', canonicalUrl);

    // ── Open Graph ─────────────────────────────────────────────────────────
    setMeta('og:type', type, 'property');
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:image', ogImage, 'property');
    setMeta('og:url', canonicalUrl, 'property');
    setMeta('og:site_name', SITE_NAME, 'property');
    setMeta('og:image:width', '1200', 'property');
    setMeta('og:image:height', '630', 'property');

    // ── Twitter Card ───────────────────────────────────────────────────────
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage);

    // ── JSON-LD Schema ─────────────────────────────────────────────────────
    const schemaId = 'seo-jsonld';
    let schemaEl = document.getElementById(schemaId);
    if (schema) {
      if (!schemaEl) {
        schemaEl = document.createElement('script');
        schemaEl.id = schemaId;
        schemaEl.type = 'application/ld+json';
        document.head.appendChild(schemaEl);
      }
      schemaEl.textContent = JSON.stringify(schema);
    } else if (schemaEl) {
      schemaEl.remove();
    }

    return () => {
      // Reset to defaults on unmount
      document.title = SITE_NAME;
      const schemaScript = document.getElementById(schemaId);
      if (schemaScript) schemaScript.remove();
    };
  }, [title, description, keywords, image, url, type, schema]);
}

export { SITE_URL, SITE_NAME };
