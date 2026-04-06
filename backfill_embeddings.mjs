/**
 * backfill_embeddings.mjs
 *
 * Generates canvas-based color histogram embeddings for all existing products
 * that don't have a row in product_image_embeddings yet, then upserts them.
 *
 * Usage:
 *   node --env-file=.env backfill_embeddings.mjs
 *
 * Requires:
 *   npm install canvas
 */

import { createClient } from '@supabase/supabase-js';
import { createCanvas, loadImage } from 'canvas';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const MODEL        = 'canvas-color-histogram-v1';
const GRID         = 8;
const COLOR_BINS   = 8;
const BATCH_SIZE   = 8;
const DELAY_MS     = 200;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function rgbToHue(r, g, b) {
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  if (max === min) return 0;
  const d = max - min;
  let h;
  if (max === r) h = ((g-b)/d + (g<b?6:0))/6;
  else if (max === g) h = ((b-r)/d + 2)/6;
  else h = ((r-g)/d + 4)/6;
  return h;
}

async function generateEmbedding(imageUrl) {
  try {
    const img = await loadImage(imageUrl);
    const size = GRID * 16;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    const vec = new Float32Array(GRID * GRID * COLOR_BINS);
    const cellW = size / GRID, cellH = size / GRID;

    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const hist = new Float32Array(COLOR_BINS);
        for (let py = 0; py < cellH; py++) {
          for (let px = 0; px < cellW; px++) {
            const x = Math.floor(gx*cellW+px), y = Math.floor(gy*cellH+py);
            const i = (y*size+x)*4;
            const r=data[i]/255, g=data[i+1]/255, b=data[i+2]/255;
            const sat = Math.max(r,g,b)-Math.min(r,g,b);
            const hue = rgbToHue(r,g,b);
            const bin = Math.min(Math.floor(hue*COLOR_BINS), COLOR_BINS-1);
            hist[bin] += sat > 0.1 ? 1 : 0.1;
          }
        }
        const sum = hist.reduce((a,v)=>a+v,0)||1;
        const base = (gy*GRID+gx)*COLOR_BINS;
        for (let b=0;b<COLOR_BINS;b++) vec[base+b]=hist[b]/sum;
      }
    }
    return Array.from(vec);
  } catch (err) {
    console.warn(`  ⚠️  Failed: ${err.message}`);
    return [];
  }
}

function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }

async function main() {
  console.log('\n🔍  Fetching products without embeddings…\n');

  const { data: existing } = await supabase.from('product_image_embeddings').select('product_id');
  const alreadyDone = new Set((existing||[]).map(r=>r.product_id));
  console.log(`   Already embedded: ${alreadyDone.size} products`);

  const { data: products, error } = await supabase
    .from('products').select('id,name,images').order('created_at',{ascending:true});
  if (error) { console.error('❌  Could not fetch products:', error.message); process.exit(1); }

  const todo = (products||[]).filter(p => {
    if (alreadyDone.has(p.id)) return false;
    const imgs = Array.isArray(p.images) ? p.images : [];
    return imgs.length > 0 && imgs[0];
  });

  if (!todo.length) { console.log('🎉  All products already have embeddings!'); return; }
  console.log(`📦  ${todo.length} products need embeddings\n`);

  let done=0, failed=0;

  for (let i=0; i<todo.length; i+=BATCH_SIZE) {
    const batch = todo.slice(i, i+BATCH_SIZE);
    await Promise.all(batch.map(async (product) => {
      const imageUrl = Array.isArray(product.images) ? product.images[0] : null;
      if (!imageUrl) { failed++; return; }
      process.stdout.write(`  [${done+failed+1}/${todo.length}] ${product.name||product.id} … `);
      const embedding = await generateEmbedding(imageUrl);
      if (!embedding.length) { process.stdout.write('SKIP\n'); failed++; return; }
      const { error: upsertErr } = await supabase
        .from('product_image_embeddings')
        .upsert([{product_id:product.id, image_url:imageUrl, embedding, model:MODEL}],
          {onConflict:'product_id'});
      if (upsertErr) { process.stdout.write(`FAIL (${upsertErr.message})\n`); failed++; }
      else { process.stdout.write('✅\n'); done++; }
    }));
    if (i+BATCH_SIZE < todo.length) await sleep(DELAY_MS);
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`✅  Done:   ${done}`);
  console.log(`⚠️   Failed: ${failed}`);
  console.log(`─────────────────────────────────────\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
