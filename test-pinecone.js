import axios from 'axios';
// API key removed for security - use environment variable: PINECONE_API_KEY
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || import.meta.env.VITE_PINECONE_API_KEY;

if (!PINECONE_API_KEY) {
  console.error('PINECONE_API_KEY environment variable is not set');
  process.exit(1);
}

async function test(label, url, method = 'get') {
  try {
    const res = await axios({
      method,
      url,
      headers: { 'Api-Key': PINECONE_API_KEY }
    });
    console.log(`SUCCESS [${label}]:`, JSON.stringify(res.data, null, 2).slice(0, 200));
  } catch (e) {
    console.error(`ERROR [${label}]:`, e.response?.status, e.message);
  }
}

async function run() {
  try {
    const res = await axios.get('https://api.pinecone.io/indexes', {
      headers: { 'Api-Key': PINECONE_API_KEY }
    });
    console.log('INDEX DETAILS:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('ERROR:', e.response?.status, e.message);
  }
}
run();
