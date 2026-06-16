import { supabase } from './api';

// ─── Browser-native image fingerprinting ─────────────────────────────────────
// Generates a compact color + edge histogram from the image using Canvas API.
// No external model, no WASM, no network requests — works everywhere.

const GRID = 8;          // 8×8 spatial grid
const COLOR_BINS = 8;    // hue bins per cell
const VECTOR_SIZE = GRID * GRID * COLOR_BINS; // 512-dim

function rgbToHue(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return h;
}

export async function getImageEmbeddingFromFile(file) {
  if (!file) return [];
  const objectUrl = URL.createObjectURL(file);
  try {
    return await getImageEmbeddingFromSource(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function getImageEmbeddingFromSource(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = GRID * 16;
        canvas.height = GRID * 16;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const vec = new Float32Array(VECTOR_SIZE);
        const cellW = canvas.width / GRID;
        const cellH = canvas.height / GRID;

        for (let gy = 0; gy < GRID; gy++) {
          for (let gx = 0; gx < GRID; gx++) {
            const hist = new Float32Array(COLOR_BINS);
            let count = 0;
            for (let py = 0; py < cellH; py++) {
              for (let px = 0; px < cellW; px++) {
                const x = Math.floor(gx * cellW + px);
                const y = Math.floor(gy * cellH + py);
                const i = (y * canvas.width + x) * 4;
                const r = data[i] / 255, g = data[i+1] / 255, b = data[i+2] / 255;
                const sat = Math.max(r,g,b) - Math.min(r,g,b);
                // weight by saturation so grey/white backgrounds don't dominate
                const hue = rgbToHue(r, g, b);
                const bin = Math.min(Math.floor(hue * COLOR_BINS), COLOR_BINS - 1);
                hist[bin] += sat > 0.1 ? 1 : 0.1;
                count++;
              }
            }
            // normalize cell histogram
            const sum = hist.reduce((a, v) => a + v, 0) || 1;
            const base = (gy * GRID + gx) * COLOR_BINS;
            for (let b = 0; b < COLOR_BINS; b++) {
              vec[base + b] = hist[b] / sum;
            }
          }
        }
        resolve(Array.from(vec));
      } catch (e) {
        console.error('Embedding generation failed:', e);
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = src;
  });
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function upsertProductImageEmbedding(productId, imageUrl, embedding) {
  if (!productId || !imageUrl || !embedding || embedding.length === 0) return;
  try {
    await supabase.from('product_image_embeddings').upsert(
      [{ product_id: productId, image_url: imageUrl, embedding, model: 'canvas-color-histogram-v1' }],
      { onConflict: 'product_id' }
    );
  } catch (error) {
    console.warn('Embedding upsert skipped:', error?.message || error);
  }
}

export async function findVisualMatchesByEmbedding(imageFile, allProducts, limit = 20) {
  const queryEmbedding = await getImageEmbeddingFromFile(imageFile);
  if (!queryEmbedding.length) return [];

  const ids = (allProducts || []).map(p => p.id).filter(Boolean);
  if (!ids.length) return [];

  let rows = [];
  try {
    const { data, error } = await supabase
      .from('product_image_embeddings')
      .select('product_id, embedding')
      .in('product_id', ids);

    if (error) {
      console.error('Embedding fetch error:', error.code, error.message);
      throw error;
    }
    rows = data || [];
    console.log(`Embedding rows fetched: ${rows.length} / ${ids.length} products`);
  } catch (error) {
    console.warn('Embedding lookup skipped:', error?.message || error);
    return [];
  }

  // If no stored embeddings, generate on-the-fly from product image URLs
  if (rows.length === 0) {
    console.log('No stored embeddings — computing on-the-fly from product images…');
    const results = await computeLiveMatches(queryEmbedding, allProducts, limit);
    return results;
  }

  const productMap = new Map(allProducts.map(p => [p.id, p]));
  const scored = rows
    .map((row) => {
      const product = productMap.get(row.product_id);
      let emb = row.embedding;
      if (Array.isArray(emb) && emb.length === 1 && Array.isArray(emb[0])) emb = emb[0];
      emb = Array.isArray(emb) ? emb.map(Number) : [];
      if (!product || emb.length !== queryEmbedding.length) return null;
      return { ...product, _visualSim: cosineSimilarity(queryEmbedding, emb) };
    })
    .filter(Boolean)
    .sort((a, b) => b._visualSim - a._visualSim);

  if (!scored.length) return [];
  const best = scored[0]._visualSim;
  if (best < 0.5) return [];
  const min = Math.max(0.5, best * 0.85);
  return scored.filter(p => p._visualSim >= min).slice(0, limit);
}

// Compute embeddings live from product image URLs (no DB needed)
async function computeLiveMatches(queryEmbedding, allProducts, limit) {
  const CONCURRENCY = 6;
  const results = [];

  for (let i = 0; i < allProducts.length; i += CONCURRENCY) {
    const batch = allProducts.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (product) => {
        const imgUrl = product.src || product.images?.[0];
        if (!imgUrl) return null;
        const emb = await getImageEmbeddingFromSource(imgUrl);
        if (!emb.length) return null;
        return { ...product, _visualSim: cosineSimilarity(queryEmbedding, emb) };
      })
    );
    results.push(...batchResults.filter(Boolean));
  }

  const sorted = results.sort((a, b) => b._visualSim - a._visualSim);
  if (!sorted.length) return [];
  const best = sorted[0]._visualSim;
  if (best < 0.5) return [];
  const min = Math.max(0.5, best * 0.85);
  return sorted.filter(p => p._visualSim >= min).slice(0, limit);
}
