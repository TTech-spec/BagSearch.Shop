// src/services/pinecone.js
// Visual search powered entirely by Imagga tag analysis

const IMAGGA_AUTH = 'Basic YWNjX2QyMTI3NTliZTg4MWQxMzo1ZThkYzdiNWYxNzBjNmY1NjM1MjdiYTk3NWU1MDlkMA==';
const IMAGGA_URL = 'https://api.imagga.com/v2/tags';

/**
 * Analyze an image with Imagga and return tags with confidence scores
 * @param {File|string} imageInput - File object or base64/URL string
 * @returns {Promise<Array<{tag: string, confidence: number}>>}
 */
export const analyzeImageWithImagga = async (imageInput) => {
  const formData = new FormData();

  if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
    const res = await fetch(imageInput);
    const blob = await res.blob();
    formData.append('image', blob, 'image.jpg');
  } else if (typeof imageInput === 'string' && imageInput.startsWith('http')) {
    formData.append('image_url', imageInput);
  } else {
    formData.append('image', imageInput);
  }

  const response = await fetch(`${IMAGGA_URL}?limit=20`, {
    method: 'POST',
    headers: { Authorization: IMAGGA_AUTH },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.status?.text || `Imagga error ${response.status}`);
  }

  const data = await response.json();
  if (!data?.result?.tags) throw new Error('Imagga response parse failed');

  return data.result.tags.map(t => ({ tag: t.tag.en.toLowerCase(), confidence: t.confidence }));
};

/**
 * Score a product against a list of tags
 */
const scoreProduct = (product, tags) => {
  const fields = [
    product.name,
    product.category,
    product.brand,
    product.condition,
    product.description,
    product.sub,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const productWords = fields.split(/[\s,•\-\/]+/).filter(w => w.length > 2);

  let score = 0;
  for (const { tag, confidence } of tags) {
    const tagWords = tag.split(/\s+/).filter(w => w.length > 2);
    for (const tagWord of tagWords) {
      if (productWords.some(pw => pw.includes(tagWord) || tagWord.includes(pw))) {
        score += confidence / tagWords.length;
      }
    }
  }
  return score;
};

/**
 * Visual search: upload image → get Imagga tags → rank products by tag match
 * @param {File} imageFile
 * @param {Array} allProducts - products already loaded in the app
 * @returns {Promise<Array>} - matched products sorted by relevance, highest first
 */
export const visualSearch = async (imageFile, allProducts) => {
  const tags = await analyzeImageWithImagga(imageFile);
  console.log('Imagga tags:', tags.slice(0, 10).map(t => `${t.tag}(${t.confidence.toFixed(0)})`).join(', '));

  const scored = allProducts
    .map(p => ({ ...p, _score: scoreProduct(p, tags) }))
    .filter(p => p._score > 0)
    .sort((a, b) => b._score - a._score);

  return scored;
};

// ─── Legacy exports kept so nothing else breaks ─────────────────────────────

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

export const generateImageEmbedding = async () => {
  throw new Error('Pinecone removed. Use visualSearch() instead.');
};

export const queryPinecone = async () => [];

export const upsertToPinecone = async () => {};

export const deleteFromPinecone = async () => {};
