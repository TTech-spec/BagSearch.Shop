import { getFlutterwaveConfig, authHeaders } from './_flutterwave-auth.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://www.bagsearch.shop', 'https://bagsearch.shop'];
  res.setHeader('Access-Control-Allow-Origin', allowed.includes(origin) ? origin : allowed[0]);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const config = await getFlutterwaveConfig();
    if (!config) return res.status(500).json({ error: 'Payment configuration missing' });

    const { account_number, bank_code } = req.body;
    if (!account_number || !bank_code) {
      return res.status(400).json({ error: 'Missing account_number or bank_code' });
    }

    const response = await fetch(`${config.baseUrl}/accounts/resolve`, {
      method: 'POST',
      headers: authHeaders(config.token),
      body: JSON.stringify({ account_number, account_bank: bank_code }),
    });

    const data = await response.json();
    console.log('Flutterwave resolve response:', response.status, JSON.stringify(data));

    if (data.status === 'success') {
      return res.status(200).json({
        success: true,
        account_name: data.data.account_name,
        account_number: data.data.account_number,
      });
    } else {
      return res.status(400).json({ error: data.message || 'Could not resolve account', flw_status: response.status });
    }
  } catch (err) {
    console.error('Account resolve error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
