/**
 * POST /api/resolve-account
 *
 * Resolves a Nigerian bank account number to the account holder's name
 * using the Flutterwave API. Used to confirm seller identity before
 * creating a subaccount.
 *
 * Body: { account_number, bank_code }
 */
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
    const { account_number, bank_code } = req.body;
    if (!account_number || !bank_code) {
      return res.status(400).json({ error: 'Missing account_number or bank_code' });
    }

    const response = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
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
