/**
 * backfill_embeddings.mjs
 *
 * Generates CLIP image embeddings for all existing products that don't
 * have a row in product_image_embeddings yet, then upserts them.
 *
 * Usage:
 *   node backfill_embeddings.mjs
 *
 * Requires in .env:
 *   VITE_SUPABASE_URL=...
 *   VITE_SUPABASE_ANON_KEY=...
 */

import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';

// ─── Config ───────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const MODEL        = 'Xenova/clip-vit-base-patch32';
const BATCH_SIZE   = 5;   // products processed in parallel per batch
const DELAY_MS     = 300; // ms between batches to avoid rate limits

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────
let extractor = null;
async function getExtractor() {
  if (!extractor) {
    console.log(`⏳  Loading CLIP model (${MODEL}) — first run downloads ~170 MB…`);
    extractor = await pipeline('feature-extraction', MODEL);
    console.log('✅  Model loaded');
  }
  return extractor;
}

function toArray(output) {
  if (!output) return [];
  if (Array.isArray(output)) return output;
  if (output.data && typeof output.data.length === 'number') return Array.from(output.data);
  return [];
}

async function generateEmbedding(imageUrl) {
  try {
    const ext = await getExtractor();
    const out = await ext(imageUrl, { pooling: 'mean', normalize: true });
    return toArray(out);
  } catch (err) {
    console.warn(`  ⚠️  Embedding failed for ${imageUrl}: ${err.message}`);
    return [];
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔍  Fetching products without embeddings…\n');

  // 1. Get all product IDs that already have embeddings
  const { data: existing, error: existErr } = await supabase
    .from('product_image_embeddings')
    .select('product_id');

  if (existErr) {
    console.error('❌  Could not fetch existing embeddings:', existErr.message);
    process.exit(1);
  }

  const alreadyDone = new Set((existing || []).map(r => r.product_id));
  console.log(`   Already embedded: ${alreadyDone.size} products`);

  // 2. Fetch all products
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, images')
    .order('created_at', { ascending: true });

  if (prodErr) {
    console.error('❌  Could not fetch products:', prodErr.message);
    process.exit(1);
  }

  // 3. Filter to only those missing embeddings and that have at least one image
  const todo = (products || []).filter(p => {
    if (alreadyDone.has(p.id)) return false;
    const imgs = Array.isArray(p.images) ? p.images : [];
    return imgs.length > 0 && imgs[0];
  });

  if (todo.length === 0) {
    console.log('🎉  All products already have embeddings. Nothing to do!');
    return;
  }

  console.log(`📦  ${todo.length} products need embeddings\n`);

  let done = 0;
  let failed = 0;

  // 4. Process in batches
  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (product) => {
      const imageUrl = Array.isArray(product.images) ? product.images[0] : null;
      if (!imageUrl) { failed++; return; }

      process.stdout.write(`  [${done + failed + 1}/${todo.length}] ${product.name || product.id} … `);

      const embedding = await generateEmbedding(imageUrl);
      if (!embedding.length) {
        process.stdout.write('SKIP (no embedding)\n');
        failed++;
        return;
      }

      const { error: upsertErr } = await supabase
        .from('product_image_embeddings')
        .upsert([{
          product_id: product.id,
          image_url:  imageUrl,
          embedding,
          model:      MODEL,
        }], { onConflict: 'product_id' });

      if (upsertErr) {
        process.stdout.write(`FAIL (${upsertErr.message})\n`);
        failed++;
      } else {
        process.stdout.write('✅\n');
        done++;
      }
    }));

    if (i + BATCH_SIZE < todo.length) await sleep(DELAY_MS);
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`✅  Done:   ${done}`);
  console.log(`⚠️   Failed: ${failed}`);
  console.log(`─────────────────────────────────────\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
