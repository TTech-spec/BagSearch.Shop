import { pipeline, env } from '@xenova/transformers';
import { supabase } from './api';

const EMBEDDING_MODEL = 'Xenova/clip-vit-base-patch32';
let extractorPromise = null;

// Always fetch model files from Hugging Face CDN — never try to resolve locally
env.allowLocalModels = false;
env.useBrowserCache = true;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', EMBEDDING_MODEL);
  }
  return extractorPromise;
}

function toArray(output) {
  if (!output) return [];
  if (Array.isArray(output)) return output;
  if (output.data && typeof output.data.length === 'number') return Array.from(output.data);
  return [];
}

export async function getImageEmbeddingFromSource(source) {
  try {
    const extractor = await getExtractor();
    const out = await extractor(source, { pooling: 'mean', normalize: true });
    return toArray(out);
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return [];
  }
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

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
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
      [{
        product_id: productId,
        image_url: imageUrl,
        embedding,
        model: EMBEDDING_MODEL
      }],
      { onConflict: 'product_id' }
    );
  } catch (error) {
    // Keep product flow resilient when table is not set up yet.
    console.warn('Embedding upsert skipped:', error?.message || error);
  }
}

export async function findVisualMatchesByEmbedding(imageFile, allProducts, limit = 20) {
  const queryEmbedding = await getImageEmbeddingFromFile(imageFile);
  if (!queryEmbedding.length) return [];

  const ids = (allProducts || []).map(p => p.id).filter(Boolean);
  if (!ids.length) return [];

  // Allow anon reads so visual search works for logged-out users too
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

  const productMap = new Map(allProducts.map(p => [p.id, p]));
  const scored = rows
    .map((row) => {
      const product = productMap.get(row.product_id);
      // embedding may come back as a nested array [[...]] from jsonb — flatten it
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
  if (best < 0.3) return [];
  const min = Math.max(0.3, best * 0.82);
  return scored.filter(p => p._visualSim >= min).slice(0, limit);
}

