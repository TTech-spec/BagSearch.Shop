// src/services/visualSearch.js — Visual Search using CLIP embeddings
import { findVisualMatchesByEmbedding } from './imageEmbeddings';

// Imagga API integration removed - now using CLIP embeddings via imageEmbeddings.js
// This provides better visual similarity matching without external API dependencies

export const visualSearch = async (imageFile, allProducts) => {
  // Primary path: CLIP embedding cosine similarity
  const embeddingMatches = await findVisualMatchesByEmbedding(imageFile, allProducts, 20);
  if (embeddingMatches.length > 0) {
    console.log(`Found ${embeddingMatches.length} embedding-based visual matches`);
    return embeddingMatches;
  }

  // Return empty — don't show random products when no similar match found
  console.warn('No embedding matches found. Ensure the RLS policy allows anon reads on product_image_embeddings.');
  return [];
};

// Legacy exports for compatibility - these are no longer used
export const generateImageEmbedding = async () => { throw new Error('Use visualSearch() instead.'); };
export const queryPinecone = async () => [];
export const upsertToPinecone = async () => {};
export const deleteFromPinecone = async () => {};
