/**
 * useSEO — dynamically updates <head> meta tags for SEO, OG, and Twitter Cards.
 * Works with Vite + React (no SSR). For full crawlability, consider adding
 * a prerender step (e.g. vite-plugin-prerender) in production.
 */
import { useEffect } from 'react';

const SITE_NAME = 'BagSearch';
const SITE_URL = 'https://www.bagsearch.shop';

function setMeta(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!content) {
    // Clear the tag if it exists — don't leave stale values
    if (el) el.removeAttribute('content');
    return;
  }
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
  noindex = false,
}) {
  useEffect(() => {
    const fullTitle = title || SITE_NAME;
    const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL;
    const ogImage = image || `${SITE_URL}/og-default.jpg`;
    const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow';

    // ── Basic ──────────────────────────────────────────────────────────────
    document.title = fullTitle;
    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('robots', robotsContent);

    // ── Canonical (only set when indexable and url is known) ──────────────
    if (!noindex && url) {
      setLink('canonical', canonicalUrl);
    }

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
    if (schema && !noindex) {
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
      document.title = SITE_NAME;
      setMeta('robots', 'index, follow');
      // Reset canonical so stale URLs don't persist across route transitions
      const canonicalEl = document.querySelector('link[rel="canonical"]');
      if (canonicalEl) canonicalEl.setAttribute('href', SITE_URL + '/');
      // Reset OG tags to site defaults so previous page values don't leak
      setMeta('og:title', SITE_NAME, 'property');
      setMeta('og:description', '', 'property');
      setMeta('og:image', `${SITE_URL}/og-default.jpg`, 'property');
      setMeta('og:url', SITE_URL, 'property');
      setMeta('og:type', 'website', 'property');
      setMeta('twitter:title', SITE_NAME);
      setMeta('twitter:description', '');
      setMeta('twitter:image', `${SITE_URL}/og-default.jpg`);
      const schemaScript = document.getElementById(schemaId);
      if (schemaScript) schemaScript.remove();
    };
  }, [title, description, keywords, image, url, type, schema, noindex]);
}

export { SITE_URL, SITE_NAME };
