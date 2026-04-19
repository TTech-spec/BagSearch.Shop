// src/services/pinecone.js — Google Vision visual search

const GOOGLE_VISION_API_KEY = 'AIzaSyD25zh624d0PIcqIDl9zY1Yz4Kn8ZoW2b8';
const GOOGLE_VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

const BAG_KEYWORD_MAP = {
  'handbag':['handbag','bag','tote','purse'],
  'bag':['bag','handbag','tote','satchel','clutch'],
  'tote bag':['tote','bag'],
  'shoulder bag':['shoulder','crossbody','bag'],
  'clutch':['clutch','evening','bag'],
  'backpack':['backpack','bag'],
  'satchel':['satchel','bag'],
  'leather':['leather'],
  'leather goods':['leather'],
  'fashion accessory':['bag','fashion'],
  'fashion':['bag','fashion'],
  'luxury':['luxury','designer'],
  'black':['black'],
  'brown':['brown','tan','camel'],
  'red':['red','burgundy'],
  'white':['white','beige','ivory'],
  'beige':['beige','tan','camel'],
  'gold':['gold'],
  'silver':['silver'],
  'pink':['pink','blush'],
  'blue':['blue','navy','cobalt'],
  'green':['green','olive'],
  'yellow':['yellow'],
  'orange':['orange'],
  'purple':['purple','lavender'],
  'grey':['grey','gray'],
  'gucci':['gucci'],
  'louis vuitton':['louis vuitton','lv'],
  'chanel':['chanel'],
  'prada':['prada'],
  'hermes':['hermes'],
  'coach':['coach'],
  'dior':['dior'],
};


const fileToBase64Content = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });

const addTag = (tagMap, tag, confidence) => {
  const key = tag.toLowerCase().trim();
  if (!key || key.length < 2) return;
  if (!tagMap.has(key) || tagMap.get(key) < confidence) tagMap.set(key, confidence);
  for (const exp of (BAG_KEYWORD_MAP[key] || [])) {
    if (!tagMap.has(exp) || tagMap.get(exp) < confidence * 0.8) tagMap.set(exp, confidence * 0.8);
  }
};

export const analyzeImageWithGoogleVision = async (imageFile) => {
  const base64Content = await fileToBase64Content(imageFile);
  const response = await fetch(GOOGLE_VISION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { content: base64Content },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 30 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
          { type: 'WEB_DETECTION', maxResults: 15 },
          { type: 'IMAGE_PROPERTIES', maxResults: 5 },
        ],
      }],
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Google Vision error ${response.status}`);
  }
  const data = await response.json();
  const result = data.responses?.[0];
  if (!result) throw new Error('Google Vision returned empty response');

  const tagMap = new Map();
  for (const label of result.labelAnnotations || [])
    addTag(tagMap, label.description, (label.score || 0) * 100);
  for (const obj of result.localizedObjectAnnotations || [])
    addTag(tagMap, obj.name, (obj.score || 0) * 100);
  for (const entity of result.webDetection?.webEntities || [])
    if (entity.description && (entity.score || 0) > 0.2)
      addTag(tagMap, entity.description, (entity.score || 0) * 100);

  for (const color of result.imagePropertiesAnnotation?.dominantColors?.colors || []) {
    const { red: r = 0, green: g = 0, blue: b = 0 } = color.color || {};
    const s = (color.score || 0) * 100;
    if (r > 180 && g < 80 && b < 80) addTag(tagMap, 'red', s);
    else if (r < 60 && g < 60 && b < 60) addTag(tagMap, 'black', s);
    else if (r > 200 && g > 200 && b > 200) addTag(tagMap, 'white', s);
    else if (r > 150 && g > 100 && b < 80) addTag(tagMap, 'brown', s);
    else if (r > 180 && g > 140 && b < 80) addTag(tagMap, 'camel', s);
    else if (r < 80 && g < 80 && b > 150) addTag(tagMap, 'blue', s);
    else if (r < 80 && g > 120 && b < 80) addTag(tagMap, 'green', s);
    else if (r > 120 && g > 120 && b > 120) addTag(tagMap, 'grey', s);
  }

  const tags = Array.from(tagMap.entries())
    .map(([tag, confidence]) => ({ tag, confidence }))
    .sort((a, b) => b.confidence - a.confidence);

  console.log('Vision tags:', tags.slice(0, 12).map(t => `${t.tag}(${t.confidence.toFixed(0)})`).join(', '));
  return tags;
};


const scoreProduct = (product, tags) => {
  const fields = [
    product.name, product.category, product.brand,
    product.condition, product.description, product.sub,
    ...(product.colors || []).map(c => c.id || ''),
  ].filter(Boolean).join(' ').toLowerCase();

  let score = 0;
  for (const { tag, confidence } of tags) {
    for (const word of tag.split(/\s+/).filter(w => w.length > 1)) {
      if (fields.includes(word)) score += confidence;
    }
  }
  const bagTags = ['bag','handbag','tote','clutch','backpack','satchel','purse','leather goods','fashion accessory'];
  if (tags.some(t => bagTags.some(b => t.tag.includes(b)))) score += 10;
  return score;
};

export const visualSearch = async (imageFile, allProducts) => {
  const tags = await analyzeImageWithGoogleVision(imageFile);
  const scored = allProducts
    .map(p => ({ ...p, _score: scoreProduct(p, tags) }))
    .filter(p => p._score > 0)
    .sort((a, b) => b._score - a._score);
  return scored.length > 0 ? scored : allProducts.slice(0, 20);
};

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

export const generateImageEmbedding = async () => { throw new Error('Use visualSearch() instead.'); };
export const queryPinecone = async () => [];
export const upsertToPinecone = async () => {};
export const deleteFromPinecone = async () => {};
