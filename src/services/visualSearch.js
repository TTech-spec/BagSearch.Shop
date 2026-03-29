// src/services/visualSearch.js — Imagga visual search
const IMAGGA_AUTH = 'Basic YWNjX2QyMTI3NTliZTg4MWQxMzo1ZThkYzdiNWYxNzBjNmY1NjM1MjdiYTk3NWU1MDlkMA==';
const IMAGGA_TAGS_URL = 'https://api.imagga.com/v2/tags';
const IMAGGA_COLORS_URL = 'https://api.imagga.com/v2/colors';

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
  'black':['black'],'brown':['brown','tan','camel'],'red':['red','burgundy'],
  'white':['white','beige','ivory'],'beige':['beige','tan','camel'],
  'gold':['gold'],'silver':['silver'],'pink':['pink','blush'],
  'blue':['blue','navy','cobalt'],'green':['green','olive'],
  'yellow':['yellow'],'orange':['orange'],'purple':['purple','lavender'],
  'grey':['grey','gray'],'gucci':['gucci'],'chanel':['chanel'],
  'prada':['prada'],'hermes':['hermes'],'coach':['coach'],'dior':['dior'],
  'louis vuitton':['louis vuitton','lv'],
};

const addTag = (tagMap, tag, confidence) => {
  const key = tag.toLowerCase().trim();
  if (!key || key.length < 2) return;
  if (!tagMap.has(key) || tagMap.get(key) < confidence) tagMap.set(key, confidence);
  for (const exp of (BAG_KEYWORD_MAP[key] || [])) {
    if (!tagMap.has(exp) || tagMap.get(exp) < confidence * 0.8) tagMap.set(exp, confidence * 0.8);
  }
};

export const analyzeImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  // 1. Fetch Tags
  const tagsResponse = await fetch(IMAGGA_TAGS_URL, {
    method: 'POST',
    headers: { 
      'Authorization': IMAGGA_AUTH
    },
    body: formData,
  });

  if (!tagsResponse.ok) {
    const err = await tagsResponse.json().catch(() => ({}));
    throw new Error(err?.status?.text || `Imagga tags error ${tagsResponse.status}`);
  }

  const tagsData = await tagsResponse.json();
  const rawTags = tagsData.result?.tags || [];

  const tagMap = new Map();
  for (const t of rawTags) {
    addTag(tagMap, t.tag.en, t.confidence);
  }

  // 2. Optional: Fetch Colors for better matching (Keeping logic from before)
  try {
    const colorFormData = new FormData();
    colorFormData.append('image', imageFile);

    const colorsResponse = await fetch(IMAGGA_COLORS_URL, {
      method: 'POST',
      headers: { 
        'Authorization': IMAGGA_AUTH
      },
      body: colorFormData,
    });
    
    if (colorsResponse.ok) {
      const colorsData = await colorsResponse.json();
      const dominantColors = colorsData.result?.colors?.image_colors || [];
      for (const color of dominantColors) {
        const { r, g, b } = color;
        const s = color.percent;
        if (r > 180 && g < 80 && b < 80) addTag(tagMap, 'red', s);
        else if (r < 60 && g < 60 && b < 60) addTag(tagMap, 'black', s);
        else if (r > 200 && g > 200 && b > 200) addTag(tagMap, 'white', s);
        else if (r > 150 && g > 100 && b < 80) addTag(tagMap, 'brown', s);
        else if (r > 180 && g > 140 && b < 80) addTag(tagMap, 'camel', s);
        else if (r < 80 && g < 80 && b > 150) addTag(tagMap, 'blue', s);
        else if (r < 80 && g > 120 && b < 80) addTag(tagMap, 'green', s);
        else if (r > 120 && g > 120 && b > 120) addTag(tagMap, 'grey', s);
      }
    }
  } catch (err) {
    console.error('Imagga colors error:', err);
  }

  return Array.from(tagMap.entries())
    .map(([tag, confidence]) => ({ tag, confidence }))
    .sort((a, b) => b.confidence - a.confidence);
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
  const bagTags = ['bag','handbag','tote','clutch','backpack','satchel','purse','leather','fashion'];
  if (tags.some(t => bagTags.some(b => t.tag.includes(b)))) score += 10;
  return score;
};

export const visualSearch = async (imageFile, allProducts) => {
  const tags = await analyzeImage(imageFile);
  console.log('Vision tags:', tags.slice(0, 10).map(t => `${t.tag}(${t.confidence.toFixed(0)})`).join(', '));
  const scored = allProducts
    .map(p => ({ ...p, _score: scoreProduct(p, tags) }))
    .filter(p => p._score > 0)
    .sort((a, b) => b._score - a._score);
  return scored.length > 0 ? scored : allProducts.slice(0, 20);
};

export const generateImageEmbedding = async () => { throw new Error('Use visualSearch() instead.'); };
export const queryPinecone = async () => [];
export const upsertToPinecone = async () => {};
export const deleteFromPinecone = async () => {};
