export function slugify(text) {
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

export function productPath(name, id) {
  const slug = slugify(name);
  const shortId = String(id).slice(0, 8);
  return `/products/${slug}--${shortId}`;
}

export function extractIdFromParam(param) {
  if (!param) return null;

  const parts = param.split('--');
  if (parts.length > 1) return parts[parts.length - 1];
  return param;
}
