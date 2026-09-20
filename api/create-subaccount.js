import { getFlutterwaveConfig, authHeaders } from './_flutterwave-auth.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://www.bagsearch.shop', 'https://bagsearch.shop'];
  res.setHeader('Access-Control-Allow-Origin', allowed.includes(origin) ? origin : allowed[0]);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const config = await getFlutterwaveConfig();
    if (!config) return res.status(500).json({ error: 'Payment configuration missing' });

    const { bank_code, account_number, business_name, user_id } = req.body;

    if (!bank_code || !account_number || !business_name) {
      return res.status(400).json({ error: 'Missing required fields: bank_code, account_number, business_name' });
    }

    const response = await fetch(`${config.baseUrl}/subaccounts`, {
      method: 'POST',
      headers: authHeaders(config.token),
      body: JSON.stringify({
        account_bank: bank_code,
        account_number: account_number,
        business_name: business_name,
        business_email: `seller-${user_id}@bagsearch.shop`,
        business_contact: business_name,
        business_contact_mobile: '08000000000',
        business_mobile: '08000000000',
        country: 'NG',
        split_type: 'flat',
        split_value: 0,
      }),
    });

    const data = await response.json();

    if (data.status === 'success') {
      return res.status(200).json({
        success: true,
        subaccount_id: data.data.subaccount_id,
        account_name: data.data.full_name || data.data.account_name || business_name,
      });
    } else {
      return res.status(400).json({
        error: data.message || 'Failed to create subaccount',
        details: data,
      });
    }
  } catch (err) {
    console.error('Subaccount creation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
