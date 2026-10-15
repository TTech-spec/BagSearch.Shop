/**
 * Indexable city pages: /products?location={id}.
 * The ids match NIGERIAN_LOCATIONS in Product.jsx; `ids` lists the
 * products.location values each page covers (Lagos State spans its areas,
 * mirroring the LAGOS_IDS filter there). `sitemap` marks the pages listed in
 * the sitemaps. Shared by the app, the bot middleware and both sitemaps.
 */

const LAGOS_IDS = ['lagos', 'lagos-island', 'lagos-mainland', 'victoria-island', 'lekki'];

export const SEO_LOCATIONS = {
  lagos:            { name: 'Lagos',            ids: LAGOS_IDS,            sitemap: true },
  'lagos-island':   { name: 'Lagos Island',     ids: ['lagos-island'] },
  'lagos-mainland': { name: 'Lagos Mainland',   ids: ['lagos-mainland'] },
  'victoria-island':{ name: 'Victoria Island',  ids: ['victoria-island'],  sitemap: true },
  lekki:            { name: 'Lekki',            ids: ['lekki'],            sitemap: true },
  abuja:            { name: 'Abuja',            ids: ['abuja'],            sitemap: true },
  wuse:             { name: 'Wuse, Abuja',      ids: ['wuse'] },
  kano:             { name: 'Kano',             ids: ['kano'],             sitemap: true },
  ibadan:           { name: 'Ibadan',           ids: ['ibadan'],           sitemap: true },
  'port-harcourt':  { name: 'Port Harcourt',    ids: ['port-harcourt'],    sitemap: true },
  enugu:            { name: 'Enugu',            ids: ['enugu'],            sitemap: true },
  'benin-city':     { name: 'Benin City',       ids: ['benin-city'],       sitemap: true },
  calabar:          { name: 'Calabar',          ids: ['calabar'] },
  warri:            { name: 'Warri',            ids: ['warri'] },
  aba:              { name: 'Aba',              ids: ['aba'] },
  onitsha:          { name: 'Onitsha',          ids: ['onitsha'] },
};

export function locationPath(id) {
  return `/products?location=${id}`;
}

export function locationSEO(id) {
  const loc = SEO_LOCATIONS[id];
  if (!loc) return null;
  return {
    h1: `Designer Bags for Sale in ${loc.name}`,
    title: `Buy Designer Bags in ${loc.name} | BagSearch Nigeria`,
    description: `Shop authentic designer handbags, totes and clutches from verified sellers in ${loc.name}. Compare prices, chat on WhatsApp and arrange fast local delivery on BagSearch.`,
    keywords: `bags in ${loc.name}, designer bags ${loc.name}, buy bags ${loc.name}, handbags for sale ${loc.name}, luxury bags ${loc.name}`,
  };
}
