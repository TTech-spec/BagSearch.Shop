/**
 * Converts a product name to a URL-friendly slug.
 * e.g. "Luxury Black Handbag" → "luxury-black-handbag"
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // spaces → hyphens
    .replace(/[^\w-]+/g, '')     // remove non-word chars
    .replace(/--+/g, '-')        // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');    // trim leading/trailing hyphens
}

/**
 * Builds a clean SEO-friendly product URL path.
 * e.g. /products/luxury-black-handbag--abc123
 * The ID suffix ensures uniqueness even if names collide.
 */
export function productPath(name, id) {
  const slug = slugify(name);
  const shortId = String(id).slice(0, 8);
  return `/products/${slug}--${shortId}`;
}

/**
 * Extracts the real product ID from a slug-based URL param.
 * Handles both:
 *   - "luxury-black-handbag--abc12345"  → "abc12345" (then look up by prefix)
 *   - plain UUID "abc12345-..."          → returned as-is
 */
export function extractIdFromParam(param) {
  if (!param) return null;
  // If it contains "--", the part after the last "--" is the short ID prefix
  const parts = param.split('--');
  if (parts.length > 1) return parts[parts.length - 1];
  return param; // plain ID fallback
}
