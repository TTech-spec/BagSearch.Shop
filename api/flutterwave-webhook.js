import { createClient } from '@supabase/supabase-js';
import { getFlutterwaveConfig, authHeaders } from './_flutterwave-auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const WEBHOOK_HASH = process.env.FLUTTERWAVE_WEBHOOK_HASH;
  if (WEBHOOK_HASH) {
    const signature = req.headers['verif-hash'];
    if (!signature || signature !== WEBHOOK_HASH) {
      console.warn('Webhook signature mismatch');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing env vars for webhook processing');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  let config;
  try {
    config = await getFlutterwaveConfig();
  } catch {
    console.error('Failed to get Flutterwave config for webhook verification');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!config) {
    console.error('Missing Flutterwave credentials for webhook processing');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const payload = req.body;
    const txData = payload?.data;

    if (!txData || !txData.id) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const verifyRes = await fetch(`${config.baseUrl}/transactions/${txData.id}/verify`, {
      headers: { 'Authorization': `Bearer ${config.token}` },
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

    if (txRef.startsWith('BS-SUB-')) {
      const parts = txRef.split('-');
      const plan = parts[2];
      const userId = parts[3];

      if (plan && userId) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

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

        await supabase.from('payments').upsert({
          user_id: userId,
          payment_type: 'subscription',
          plan,
          amount,
          flutterwave_tx_ref: txRef,
          flutterwave_tx_id: String(tx.id),
          flutterwave_status: 'successful',
        }, { onConflict: 'flutterwave_tx_ref', ignoreDuplicates: true });

        console.log(`Subscription activated: ${plan} for user ${userId}`);
      }
    } else if (txRef.startsWith('BS-')) {
      const productId = meta.product_id || null;
      const sellerId = meta.seller_id || null;
      const buyerEmail = tx.customer?.email || '';

      let buyerId = null;
      if (buyerEmail) {
        const { data: userData } = await supabase
          .from('users')
          .select('user_id')
          .eq('email', buyerEmail)
          .maybeSingle();
        buyerId = userData?.user_id || null;
      }

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

      console.log(`Product payment confirmed: ${txRef} — NGN ${amount}`);
    }

    return res.status(200).json({ status: 'success' });

  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(200).json({ status: 'error', message: err.message });
  }
}
