const V4_TOKEN_URL = 'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token';
const V4_BASE = 'https://api.flutterwave.cloud/f4b/production';
const V3_BASE = 'https://api.flutterwave.com/v3';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getV4Token(clientId, clientSecret) {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const res = await fetch(V4_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to obtain Flutterwave access token');
  }

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

export async function getFlutterwaveConfig() {
  const clientId = process.env.FLUTTERWAVE_CLIENT_ID;
  const clientSecret = process.env.FLUTTERWAVE_CLIENT_SECRET;
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

  if (clientId && clientSecret) {
    const token = await getV4Token(clientId, clientSecret);
    return { baseUrl: V4_BASE, token };
  }

  if (secretKey) {
    return { baseUrl: V3_BASE, token: secretKey };
  }

  return null;
}

export function authHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
