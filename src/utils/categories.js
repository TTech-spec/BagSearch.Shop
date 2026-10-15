/**
 * Indexable bag-category pages: /products?category={id}.
 * The ids match the category filter in Product.jsx (see mapCategory there);
 * `match` lists the substrings of the free-text products.category column that
 * map to each id. Shared by the app, the bot middleware and both sitemaps.
 */

export const SEO_CATEGORIES = {
  tote:      { label: 'Tote Bags',                match: ['tote'] },
  clutch:    { label: 'Clutch Bags',              match: ['clutch'] },
  crossbody: { label: 'Crossbody Bags',           match: ['crossbody'] },
  backpack:  { label: 'Backpacks',                match: ['backpack'] },
  satchel:   { label: 'Shoulder Bags & Satchels', match: ['satchel', 'handbag', 'shoulder'] },
  evening:   { label: 'Evening Bags',             match: ['evening'] },
  mini:      { label: 'Mini Bags',                match: ['mini'] },
};

export function categoryPath(id) {
  return `/products?category=${id}`;
}

export function categorySEO(id) {
  const cat = SEO_CATEGORIES[id];
  if (!cat) return null;
  return {
    h1: `${cat.label} in Nigeria`,
    title: `Shop ${cat.label} in Nigeria | BagSearch`,
    description: `Shop authentic designer ${cat.label.toLowerCase()} from verified sellers across Lagos, Abuja and all of Nigeria. Compare prices and chat with sellers on BagSearch.`,
    keywords: `${cat.label.toLowerCase()} Nigeria, designer ${cat.label.toLowerCase()}, buy ${cat.label.toLowerCase()} Lagos, luxury ${cat.label.toLowerCase()}`,
  };
}
