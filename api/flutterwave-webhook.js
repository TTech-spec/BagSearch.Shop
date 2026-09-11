/**
 * POST /api/flutterwave-webhook
 *
 * Receives payment notifications from Flutterwave.
 * Verifies the payment, then updates Supabase:
 *   - Product purchases → records confirmed payment
 *   - Subscriptions → activates seller plan
 *
 * Required env vars:
 *   FLUTTERWAVE_SECRET_KEY   — to verify transactions
 *   FLUTTERWAVE_WEBHOOK_HASH — the secret hash you set in Flutterwave dashboard
 *   SUPABASE_URL             — Supabase project URL
 *   SUPABASE_SERVICE_KEY     — Supabase service role key (not anon key)
 */
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── 1. Verify webhook signature ──────────────────────────────────────────
  const WEBHOOK_HASH = process.env.FLUTTERWAVE_WEBHOOK_HASH;
  if (WEBHOOK_HASH) {
    const signature = req.headers['verif-hash'];
    if (!signature || signature !== WEBHOOK_HASH) {
      console.warn('Webhook signature mismatch');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SECRET_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing env vars for webhook processing');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const payload = req.body;
    const event = payload?.event;
    const txData = payload?.data;

    if (!txData || !txData.id) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // ── 2. Verify transaction with Flutterwave API ─────────────────────────
    const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${txData.id}/verify`, {
      headers: { 'Authorization': `Bearer ${SECRET_KEY}` },
    });
    const verifyData = await verifyRes.json();

    if (verifyData.status !== 'success' || verifyData.data?.status !== 'successful') {
      console.warn('Transaction verification failed:', verifyData);
      return res.status(200).json({ status: 'ignored', reason: 'payment not successful' });
    }

    const tx = verifyData.data;
    const txRef = tx.tx_ref || '';
    const amount = tx.amount;
    const meta = tx.meta || {};

    // ── 3. Handle subscription payments ────────────────────────────────────
    if (txRef.startsWith('BS-SUB-')) {
      const parts = txRef.split('-'); // BS-SUB-{plan}-{userId}-{timestamp}
      const plan = parts[2];
      const userId = parts[3];

      if (plan && userId) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        // Upsert subscription
        await supabase.from('seller_subscriptions').upsert({
          user_id: userId,
          plan,
          status: 'active',
          flutterwave_tx_ref: txRef,
          flutterwave_tx_id: String(tx.id),
          amount,
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        // Record payment
        await supabase.from('payments').upsert({
          user_id: userId,
          payment_type: 'subscription',
          plan,
          amount,
          flutterwave_tx_ref: txRef,
          flutterwave_tx_id: String(tx.id),
          flutterwave_status: 'successful',
        }, { onConflict: 'flutterwave_tx_ref', ignoreDuplicates: true });

        console.log(`✅ Subscription activated: ${plan} for user ${userId}`);
      }
    }

    // ── 4. Handle product purchase payments ─────────────────────────────────
    else if (txRef.startsWith('BS-')) {
      const productId = meta.product_id || null;
      const sellerId = meta.seller_id || null;
      const buyerEmail = tx.customer?.email || '';

      // Find buyer user ID from email
      let buyerId = null;
      if (buyerEmail) {
        const { data: userData } = await supabase
          .from('users')
          .select('user_id')
          .eq('email', buyerEmail)
          .maybeSingle();
        buyerId = userData?.user_id || null;
      }

      // Record confirmed payment
      await supabase.from('payments').upsert({
        user_id: buyerId,
        payment_type: 'product_purchase',
        amount,
        flutterwave_tx_ref: txRef,
        flutterwave_tx_id: String(tx.id),
        flutterwave_status: 'successful',
        product_id: productId,
        seller_id: sellerId,
        metadata: {
          product_name: meta.product_name || '',
          seller_name: meta.seller_name || '',
          buyer_email: buyerEmail,
          verified_at: new Date().toISOString(),
        },
      }, { onConflict: 'flutterwave_tx_ref', ignoreDuplicates: true });

      console.log(`✅ Product payment confirmed: ${txRef} — ₦${amount}`);
    }

    return res.status(200).json({ status: 'success' });

  } catch (err) {
    console.error('Webhook processing error:', err);
    // Return 200 so Flutterwave doesn't keep retrying
    return res.status(200).json({ status: 'error', message: err.message });
  }
}
