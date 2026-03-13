// src/services/pinecone.js
import axios from 'axios';

// PINECONE API DETAILS
const PINECONE_API_KEY = 'pcsk_3CYBJh_Q1cP5VALa2g6W9v9mCEHYcuTY26jfeRB3hJNPWSeZUpKPThGpSRvReoT6bmaavr';
const PINECONE_INDEX_HOST = 'https://luxe-index-92v2zjt.svc.us-east-1-aws.pinecone.io'; 
const PINECONE_INFERENCE_URL = 'https://api.pinecone.io/embed';
const PINECONE_API_VERSION = '2024-07';

/**
 * Helper to convert file to base64
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Canvas-based image analysis: dominant color, shape → text description
 * @param {File} imageFile 
 * @returns {Promise<string>} - "black rectangular leather handbag"
 */
const analyzeImageForText = async (imageFile) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // 1. Dominant color
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const colors = getDominantColor(imageData.data);
      const colorName = rgbToName(colors[0], colors[1], colors[2]);
      
      // 2. Shape/aspect
      const aspect = img.width / img.height;
      const shape = aspect > 1.2 ? 'tote' : aspect < 0.8 ? 'clutch' : 'crossbody';
      
      // 3. Description (optimized for bag search)
      const desc = `${colorName} ${shape} bag`;
      resolve(desc);
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
};

/**
 * Get dominant RGB from image data
 */
const getDominantColor = (data) => {
  const colorCount = {};
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const key = `${Math.round(r/32)*32},${Math.round(g/32)*32},${Math.round(b/32)*32}`;
    colorCount[key] = (colorCount[key] || 0) + 1;
  }
  
  const [[r,g,b], count] = Object.entries(colorCount).reduce((a, [key, count]) => count > a[1] ? [key.split(',').map(Number), count] : a, [[0,0,0], 0]);
  return [r,g,b];
};

/**
 * Simple RGB → color name
 */
const rgbToName = (r, g, b) => {
  if (r > 200 && g > 200 && b > 200) return 'white';
  if (r > 100 && g < 50 && b < 50) return 'red';
  if (r > 100 && g > 100 && b < 50) return 'orange';
  if (r < 50 && g > 100 && b < 50) return 'green';
  if (r < 50 && g < 50 && b > 100) return 'blue';
  if (r < 80 && g < 80 && b < 80) return 'black';
  return 'brown';
};

/**
 * Generate text embedding (Pinecone text model - works reliably)
 */
const generateTextEmbedding = async (text) => {
  try {
    const response = await axios.post(
      PINECONE_INFERENCE_URL,
      {
        model: 'text-embedding-large-3',
        inputs: [{ text }]
      },
      {
        headers: {
          'Api-Key': PINECONE_API_KEY,
          'Content-Type': 'application/json',
          'X-Pinecone-Api-Version': PINECONE_API_VERSION
        }
      }
    );
    
    if (response.data?.data?.[0]?.embedding) {
      return response.data.data[0].embedding;
    }
    throw new Error('Text embedding response parse failed');
  } catch (error) {
    console.error('Text Embedding Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Visual search entry: Image → analysis → embedding
 * @param {File} imageFile - User uploaded image
 */
export const generateImageEmbedding = async (imageFile) => {
  console.log('👜 Visual search: analyzing image...');
  const desc = await analyzeImageForText(imageFile);
  console.log('🎨 Analysis:', desc);
  return await generateTextEmbedding(desc);
};

/**
 * Query Pinecone for similar products
 */
export const queryPinecone = async (vector) => {
  try {
    const response = await axios.post(
      `${PINECONE_INDEX_HOST}/query`,
      {
        vector: vector,
        topK: 12,
        includeMetadata: true
      },
      {
        headers: {
          'Api-Key': PINECONE_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.matches || [];
  } catch (error) {
    console.error('Pinecone Query Error:', error.response?.data || error.message);
    return [];
  }
};

/**
 * Upsert product to Pinecone (call from createProduct.jsx)
 */
export const upsertToPinecone = async (id, imageFile, metadata) => {
  try {
    const vector = await generateImageEmbedding(imageFile);
    await axios.post(
      `${PINECONE_INDEX_HOST}/vectors/upsert`,
      {
        vectors: [{
          id: String(id),
          values: vector,
          metadata
        }]
      },
      {
        headers: {
          'Api-Key': PINECONE_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Product upserted to Pinecone:', id);
  } catch (error) {
    console.error('Pinecone Upsert Error:', error.response?.data || error.message);
  }
};
