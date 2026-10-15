/**
 * Canonical seller URLs. Every seller page lives at /seller/{profile_slug},
 * falling back to /seller/{user_id} when the seller has no publishable slug.
 * Shared by the app, the bot middleware and both sitemap generators so links,
 * canonical tags and sitemap <loc>s always agree.
 */

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Test/QA accounts — never published in the sitemap.
export const TEST_SLUG_RE = /(^|-)(test|qa|demo|dummy)(-|$)/i;

// Slugs auto-derived from an email address expose the seller's email, so they
// are never used in public URLs; the user_id URL is used instead.
export const EMAIL_SLUG_RE = /(gmail|yahoo|hotmail|outlook|icloud|live|aol|proton)(com|net|co)?/i;

export function publicSellerSlug(profileSlug) {
  const slug = String(profileSlug || '').trim();
  if (!slug || EMAIL_SLUG_RE.test(slug)) return null;
  return slug;
}

export function sellerPath(profileSlug, userId) {
  const key = publicSellerSlug(profileSlug) || userId;
  return key ? `/seller/${encodeURIComponent(key)}` : '/vendors';
}
