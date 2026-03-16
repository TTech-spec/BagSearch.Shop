// src/services/pinecone.js
import axios from 'axios';

// PINECONE API DETAILS
const PINECONE_API_KEY = 'pcsk_3CYBJh_Q1cP5VALa2g6W9v9mCEHYcuTY26jfeRB3hJNPWSeZUpKPThGpSRvReoT6bmaavr';
const PINECONE_INDEX_HOST = 'https://luxe-index-92v2zjt.svc.us-east-1-aws.pinecone.io'; 
const PINECONE_INFERENCE_URL = 'https://api.pinecone.io/embed';
const PINECONE_API_VERSION = '2024-07';

// IMAGGA API DETAILS
const IMAGGA_AUTH = 'Basic YWNjX2QyMTI3NTliZTg4MWQxMzo1ZThkYzdiNWYxNzBjNmY1NjM1MjdiYTk3NWU1MDlkMA==';
const IMAGGA_URL = 'https://api.imagga.com/v2/tags';

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
 * Image analysis using Imagga Tagging API
 * @param {File|string} imageInput - File object or base64 string
 * @returns {Promise<string>} - tags combined into a description
 */
const analyzeImageWithImagga = async (imageInput) => {
  const formData = new FormData();
  
  try {
    if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
      // Convert base64 to Blob for Imagga
      const res = await fetch(imageInput);
      const blob = await res.blob();
      formData.append('image', blob, 'image.jpg');
    } else {
      formData.append('image', imageInput);
    }

    const response = await axios.post(IMAGGA_URL, formData, {
      headers: {
        'Authorization': IMAGGA_AUTH
      }
    });

    if (response.data && response.data.result && response.data.result.tags) {
      // Get top 5 tags to form a description
      const tags = response.data.result.tags
        .slice(0, 5)
        .map(t => t.tag.en)
        .join(' ');
      return tags;
    }
    throw new Error('Imagga response parse failed');
  } catch (error) {
    console.error('Imagga Tagging Error:', error.response?.data || error.message);
    return "luxury bag"; // generic fallback
  }
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
 * Visual search entry: Image -> analysis -> embedding
 * @param {File} imageFile - User uploaded image
 */
export const generateImageEmbedding = async (imageFile) => {
  console.log('👜 Visual search: analyzing image with Imagga...');
  const desc = await analyzeImageWithImagga(imageFile);
  console.log('🎨 Imagga Tags:', desc);
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
 * Delete vectors from Pinecone
 * @param {string[]} ids - Array of product IDs to delete
 */
export const deleteFromPinecone = async (ids) => {
  if (!ids || ids.length === 0) return;
  try {
    await axios.post(
      `${PINECONE_INDEX_HOST}/vectors/delete`,
      { ids: ids.map(id => String(id)) },
      {
        headers: {
          'Api-Key': PINECONE_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Deleted from Pinecone:', ids);
  } catch (error) {
    console.error('Pinecone Delete Error:', error.response?.data || error.message);
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
