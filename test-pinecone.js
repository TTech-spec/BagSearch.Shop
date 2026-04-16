import axios from 'axios';
async function test(label, url, method = 'get') {
  try {
    const res = await axios({
      method,
      url,
      headers: { 'Api-Key': 'pcsk_3CYBJh_Q1cP5VALa2g6W9v9mCEHYcuTY26jfeRB3hJNPWSeZUpKPThGpSRvReoT6bmaavr' }
    });
    console.log(`SUCCESS [${label}]:`, JSON.stringify(res.data, null, 2).slice(0, 200));
  } catch (e) {
    console.error(`ERROR [${label}]:`, e.response?.status, e.message);
  }
}

async function run() {
  try {
    const res = await axios.get('https://api.pinecone.io/indexes', {
      headers: { 'Api-Key': 'pcsk_3CYBJh_Q1cP5VALa2g6W9v9mCEHYcuTY26jfeRB3hJNPWSeZUpKPThGpSRvReoT6bmaavr' }
    });
    console.log('INDEX DETAILS:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('ERROR:', e.response?.status, e.message);
  }
}
run();
