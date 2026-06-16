/**
 * Transforms a Cloudinary image URL to add automatic optimization.
 * - f_auto: serves WebP to browsers that support it (smaller files)
 * - q_auto: automatic quality compression
 * - w_, h_: resize to exact display size so browser doesn't download huge images
 * - c_fill: crop to fill the dimensions
 */
export function getOptimizedImageUrl(url, width = 400, height = 300) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com')) return url;

  const transform = `w_${width},h_${height},c_fill,f_auto,q_auto`;

  // If already has transformations after /upload/, replace them
  if (url.includes('/upload/')) {
    // Avoid double-transforming
    if (url.includes('f_auto') || url.includes('q_auto')) return url;
    return url.replace('/upload/', `/upload/${transform}/`);
  }

  return url;
}

/**
 * Preset sizes for different contexts
 */
export const IMG_SIZES = {
  card: { width: 400, height: 300 },       // product grid cards
  thumb: { width: 120, height: 120 },       // cart / small thumbnails
  hero: { width: 800, height: 600 },        // featured / hero images
  detail: { width: 900, height: 675 },      // product detail page
};
