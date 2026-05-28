import axios from 'axios';
// API key removed for security - use environment variable: PINECONE_API_KEY
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || import.meta.env.VITE_PINECONE_API_KEY;

if (!PINECONE_API_KEY) {
  console.error('PINECONE_API_KEY environment variable is not set');
  process.exit(1);
}

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
