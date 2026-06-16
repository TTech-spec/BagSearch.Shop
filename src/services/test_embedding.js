import axios from 'axios';
// API key removed for security - use environment variable: PINECONE_API_KEY
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || import.meta.env.VITE_PINECONE_API_KEY;

if (!PINECONE_API_KEY) {
  console.error('PINECONE_API_KEY environment variable is not set');
  process.exit(1);
}
const PINECONE_INFERENCE_URL = 'https://api.pinecone.io/embed';

async function testEmbedding() {
  try {
    const response = await axios.post(
      PINECONE_INFERENCE_URL,
      {
        model: 'multimodal-clip-vit-base-patch32',
        parameters: { input_type: 'passage' },
        inputs: [{ text: 'Hello world' }]
      },
      {
        headers: {
          'Api-Key': PINECONE_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Success! Response format:');
    console.log(JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
  } catch (error) {
    console.error('Error:', error.response ? error.response.status : error.message);
    if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
  }
}

testEmbedding();
