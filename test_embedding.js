import axios from 'axios';
const PINECONE_API_KEY = 'pcsk_3CYBJh_Q1cP5VALa2g6W9v9mCEHYcuTY26jfeRB3hJNPWSeZUpKPThGpSRvReoT6bmaavr';
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
