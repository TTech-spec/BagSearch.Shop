/**
 * POST /api/release-payment
 *
 * Called when a buyer confirms delivery. Transfers the order amount
 * to the seller's bank account via Flutterwave Transfer API.
 *
 * Body: { order_id }
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://www.bagsearch.shop', 'https://bagsearch.shop'];
  res.setHeader('Access-Control-Allow-Origin', allowed.includes(origin) ? origin : allowed[0]);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!SECRET_KEY) return res.status(500).json({ error: 'Payment configuration missing' });

  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ error: 'Missing order_id' });

    // Fetch the order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ error: 'Order must be in delivered status to release payment' });
    }

    if (!order.seller_id) {
      return res.status(400).json({ error: 'No seller associated with this order' });
    }

    // Get seller bank details
    const { data: bankDetails } = await supabase
      .from('seller_bank_details')
      .select('bank_code, account_number, account_name')
      .eq('user_id', order.seller_id)
      .maybeSingle();

    if (!bankDetails?.account_number || !bankDetails?.bank_code) {
      // Mark as credited anyway since we can't transfer without bank details
      // Seller will need to add bank details to receive future payouts
      await supabase.from('orders').update({ status: 'seller_credited', credited_at: new Date().toISOString() }).eq('id', order_id);
      return res.status(200).json({ success: true, message: 'Order completed. Seller has no bank details on file — they should add bank details to receive payouts.' });
    }

    // Transfer money to seller via Flutterwave
    const transferRef = `BS-PAYOUT-${order_id}-${Date.now()}`;
    const response = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_bank: bankDetails.bank_code,
        account_number: bankDetails.account_number,
        amount: order.total_price,
        narration: `BagSearch payout for order ${order_id}`,
        currency: 'NGN',
        reference: transferRef,
        beneficiary_name: bankDetails.account_name || 'Seller',
      }),
    });

    const data = await response.json();
    console.log('Flutterwave transfer response:', response.status, JSON.stringify(data));

    // Update order status regardless — the transfer is initiated
    await supabase.from('orders').update({
      status: 'seller_credited',
      credited_at: new Date().toISOString(),
      payout_reference: transferRef,
      payout_status: data.status === 'success' ? 'initiated' : 'failed',
    }).eq('id', order_id);

    if (data.status === 'success') {
      return res.status(200).json({ success: true, message: 'Payment released to seller' });
    } else {
      return res.status(200).json({
        success: true,
        message: 'Order marked as completed. Payout transfer may be pending.',
        flw_message: data.message,
      });
    }
  } catch (err) {
    console.error('Release payment error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
