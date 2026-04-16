import axios from 'axios';
const PINECONE_API_KEY = 'pcsk_3CYBJh_Q1cP5VALa2g6W9v9mCEHYcuTY26jfeRB3hJNPWSeZUpKPThGpSRvReoT6bmaavr';

async function listModels() {
  try {
    const response = await axios.get('https://api.pinecone.io/models', {
      headers: {
        'Api-Key': PINECONE_API_KEY
      }
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

listModels();
