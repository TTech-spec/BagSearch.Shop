import axios from 'axios';

const PINECONE_API_KEY = 'pcsk_3CYBJh_Q1cP5VALa2g6W9v9mCEHYcuTY26jfeRB3hJNPWSeZUpKPThGpSRvReoT6bmaavr';
const endpoints = [
  'https://api.pinecone.io/models',
  'https://api.pinecone.io/embed',
  'https://api.pinecone.io/inference/models',
  'https://api.pinecone.io/inference/embed'
];

async function debug() {
  for (const url of endpoints) {
    console.log(`Testing ${url}...`);
    try {
      const method = url.endsWith('embed') ? 'post' : 'get';
      const data = url.endsWith('embed') ? {
        model: 'multilingual-e5-large',
        inputs: [{ text: 'test' }]
      } : undefined;

      const response = await axios({
        method,
        url,
        data,
        headers: { 'Api-Key': PINECONE_API_KEY }
      });
      console.log(`  SUCCESS: ${url} (Status: ${response.status})`);
      if (url.endsWith('models')) {
        console.log('  Models:', response.data.models?.map(m => m.name) || response.data);
      }
    } catch (error) {
      console.log(`  FAILED: ${url} (Status: ${error.response?.status || error.message})`);
    }
  }
}

debug();
