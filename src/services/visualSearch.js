// src/services/visualSearch.js — Enhanced Visual Search with Multiple AI Services
import { findVisualMatchesByEmbedding } from './imageEmbeddings';

const IMAGGA_AUTH = 'Basic YWNjX2QyMTI3NTliZTg4MWQxMzo1ZThkYzdiNWYxNzBjNmY1NjM1MjdiYTk3NWU1MDlkMA==';
const IMAGGA_TAGS_URL = 'https://api.imagga.com/v2/tags';
const IMAGGA_COLORS_URL = 'https://api.imagga.com/v2/colors';

// Enhanced bag-specific keywords with more variants
const BAG_KEYWORD_MAP = {
  'handbag': ['handbag', 'bag', 'tote', 'purse', 'shoulder bag', 'crossbody', 'clutch'],
  'bag': ['bag', 'handbag', 'tote', 'satchel', 'clutch', 'shoulder bag', 'crossbody', 'backpack'],
  'tote bag': ['tote', 'bag', 'shoulder bag', 'canvas bag'],
  'shoulder bag': ['shoulder', 'crossbody', 'bag', 'messenger bag'],
  'clutch': ['clutch', 'evening', 'bag', 'small bag'],
  'backpack': ['backpack', 'bag', 'rucksack'],
  'satchel': ['satchel', 'bag', 'shoulder bag'],
  'leather': ['leather', 'genuine leather', 'full grain leather', 'top grain leather'],
  'leather goods': ['leather', 'leather goods'],
  'fashion accessory': ['bag', 'fashion', 'accessory'],
  'fashion': ['bag', 'fashion', 'style', 'trendy'],
  'luxury': ['luxury', 'designer', 'premium', 'high-end'],
  'designer': ['designer', 'luxury', 'brand name', 'signature'],
  // Enhanced color mapping with more shades
  'black': ['black', 'charcoal', 'ebony', 'jet black', 'midnight'],
  'brown': ['brown', 'tan', 'camel', 'cognac', 'chocolate', 'espresso', 'mocha'],
  'red': ['red', 'burgundy', 'wine', 'cherry', 'crimson', 'scarlet'],
  'white': ['white', 'beige', 'ivory', 'cream', 'off-white', 'pearl', 'snow'],
  'beige': ['beige', 'tan', 'camel', 'sand', 'khaki', 'neutral'],
  'gold': ['gold', 'golden', 'metallic', 'shimmer'],
  'silver': ['silver', 'metallic', 'gunmetal'],
  'pink': ['pink', 'blush', 'rose', 'fuchsia', 'magenta'],
  'blue': ['blue', 'navy', 'cobalt', 'sky', 'azure', 'denim'],
  'green': ['green', 'olive', 'emerald', 'forest', 'mint', 'sage'],
  'yellow': ['yellow', 'mustard', 'gold', 'amber'],
  'orange': ['orange', 'terracotta', 'coral', 'peach'],
  'purple': ['purple', 'lavender', 'violet', 'plum'],
  'grey': ['grey', 'gray', 'slate', 'charcoal', 'heather'],
  // Enhanced brand recognition
  'gucci': ['gucci', 'gg', 'double g'],
  'chanel': ['chanel', 'cc', 'interlocking c'],
  'prada': ['prada', 'triangle logo'],
  'hermes': ['hermes', 'h', 'orange box'],
  'coach': ['coach', 'c', 'horse and carriage'],
  'dior': ['dior', 'cd', 'lady dior'],
  'louis vuitton': ['louis vuitton', 'lv', 'monogram'],
  'material': ['canvas', 'leather', 'suede', 'nylon', 'patent', 'crocodile', 'ostrich'],
  'pattern': ['monogram', 'logo', 'checkered', 'striped', 'solid', 'textured'],
  'shape': ['structured', 'slouchy', 'boxy', 'rounded', 'rectangular', 'curved'],
  'size': ['mini', 'small', 'medium', 'large', 'oversized'],
};

const addTag = (tagMap, tag, confidence) => {
  const key = tag.toLowerCase().trim();
  if (!key || key.length < 2) return;
  if (!tagMap.has(key) || tagMap.get(key) < confidence) tagMap.set(key, confidence);
  for (const exp of (BAG_KEYWORD_MAP[key] || [])) {
    if (!tagMap.has(exp) || tagMap.get(exp) < confidence * 0.8) tagMap.set(exp, confidence * 0.8);
  }
};

const CATEGORY_HINTS = {
  tote: ['tote', 'tote bag'],
  clutch: ['clutch', 'evening bag'],
  crossbody: ['crossbody', 'shoulder bag', 'messenger bag'],
  backpack: ['backpack', 'rucksack'],
  satchel: ['satchel', 'handbag', 'top handle'],
  evening: ['evening', 'party bag'],
  mini: ['mini', 'small bag', 'micro bag'],
};

const getCategoryHints = (tags) => {
  const tagsText = (tags || []).map((t) => String(t.tag || '').toLowerCase()).join(' ');
  return Object.entries(CATEGORY_HINTS)
    .filter(([, hints]) => hints.some((hint) => tagsText.includes(hint)))
    .map(([category]) => category);
};

// Enhanced color analysis with better RGB detection
const analyzeColor = (r, g, b, percent) => {
  const colors = [];
  
  // More precise color detection
  if (r > 200 && g > 200 && b > 200) colors.push({ name: 'white', confidence: percent });
  else if (r < 50 && g < 50 && b < 50) colors.push({ name: 'black', confidence: percent });
  else if (r > 150 && g < 100 && b < 100) colors.push({ name: 'red', confidence: percent });
  else if (r > 200 && g > 150 && b < 100) colors.push({ name: 'orange', confidence: percent });
  else if (r > 200 && g > 200 && b < 100) colors.push({ name: 'yellow', confidence: percent });
  else if (r < 100 && g > 150 && b < 100) colors.push({ name: 'green', confidence: percent });
  else if (r < 100 && g < 100 && b > 150) colors.push({ name: 'blue', confidence: percent });
  else if (r > 150 && g > 100 && b > 150) colors.push({ name: 'purple', confidence: percent });
  else if (r > 100 && g > 80 && b < 80) colors.push({ name: 'brown', confidence: percent });
  else if (r > 180 && g > 140 && b < 100) colors.push({ name: 'camel', confidence: percent });
  else if (r > 200 && g > 180 && b > 180) colors.push({ name: 'pink', confidence: percent });
  else if (r > 150 && g > 150 && b > 150) colors.push({ name: 'grey', confidence: percent });
  
  return colors;
};

// Enhanced image analysis with multiple features
export const analyzeImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  try {
    // 1. Fetch Tags from Imagga
    const tagsResponse = await fetch(IMAGGA_TAGS_URL, {
      method: 'POST',
      headers: { 
        'Authorization': IMAGGA_AUTH
      },
      body: formData,
    });

    if (!tagsResponse.ok) {
      const err = await tagsResponse.json().catch(() => ({}));
      throw new Error(err?.status?.text || `Imagga tags error ${tagsResponse.status}`);
    }

    const tagsData = await tagsResponse.json();
    const rawTags = tagsData.result?.tags || [];

    const tagMap = new Map();
    
    // Process tags with enhanced weighting for bag-specific terms
    for (const t of rawTags) {
      const tag = t.tag.en.toLowerCase();
      const confidence = t.confidence;
      
      // Boost confidence for bag-specific terms
      const bagSpecificTerms = ['handbag', 'bag', 'tote', 'purse', 'shoulder bag', 'clutch', 'backpack', 'satchel'];
      const isBagSpecific = bagSpecificTerms.some(term => tag.includes(term));
      const boostedConfidence = isBagSpecific ? confidence * 1.5 : confidence;
      
      addTag(tagMap, tag, boostedConfidence);
    }

    // 2. Enhanced Color Analysis
    try {
      const colorFormData = new FormData();
      colorFormData.append('image', imageFile);

      const colorsResponse = await fetch(IMAGGA_COLORS_URL, {
        method: 'POST',
        headers: { 
          'Authorization': IMAGGA_AUTH
        },
        body: colorFormData,
      });
      
      if (colorsResponse.ok) {
        const colorsData = await colorsResponse.json();
        const dominantColors = colorsData.result?.colors?.image_colors || [];
        
        for (const color of dominantColors) {
          const { r, g, b } = color;
          const percent = color.percent;
          const detectedColors = analyzeColor(r, g, b, percent);
          
          for (const detectedColor of detectedColors) {
            addTag(tagMap, detectedColor.name, detectedColor.confidence);
          }
        }
      }
    } catch (err) {
      console.error('Imagga colors error:', err);
    }

    // 3. Add contextual tags based on dominant features
    const topTags = Array.from(tagMap.entries())
      .map(([tag, confidence]) => ({ tag, confidence }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    // Add contextual bag type tags
    const hasBagTag = topTags.some(t => t.tag.includes('bag'));
    const hasShoulderTag = topTags.some(t => t.tag.includes('shoulder'));
    const hasLeatherTag = topTags.some(t => t.tag.includes('leather'));
    
    if (hasBagTag && !hasShoulderTag) {
      addTag(tagMap, 'handbag', 0.8);
    }
    if (hasLeatherTag) {
      addTag(tagMap, 'leather goods', 0.7);
    }

    return Array.from(tagMap.entries())
      .map(([tag, confidence]) => ({ tag, confidence }))
      .sort((a, b) => b.confidence - a.confidence);

  } catch (error) {
    console.error('Image analysis failed:', error);
    return [];
  }
};


// Enhanced product scoring with multiple factors
const scoreProduct = (product, tags) => {
  const fields = [
    product.name, product.category, product.brand,
    product.condition, product.description, product.sub,
    ...(product.colors || []).map(c => c.id || ''),
  ].filter(Boolean).join(' ').toLowerCase();

  let score = 0;
  let exactHit = false;
  let brandHit = false;
  let categoryHit = false;
  let colorHit = false;
  let materialHit = false;
  let bagTypeHit = false;

  // Enhanced scoring with different weight factors
  for (const { tag, confidence } of tags) {
    const tagWords = tag.split(/\s+/).filter(w => w.length > 1);
    
    for (const word of tagWords) {
      // Exact name matches (highest weight)
      if (product.name && product.name.toLowerCase().includes(word)) {
        score += confidence * 3;
        exactHit = true;
      }
      // Category matches (high weight)
      else if (product.category && product.category.toLowerCase().includes(word)) {
        score += confidence * 2.5;
        categoryHit = true;
      }
      // Brand matches (high weight)
      else if (product.brand && product.brand.toLowerCase().includes(word)) {
        score += confidence * 2.5;
        brandHit = true;
      }
      // Description matches (medium weight)
      else if (product.description && product.description.toLowerCase().includes(word)) {
        score += confidence * 1.5;
      }
      // Color matches (medium weight)
      else if (product.colors && product.colors.some(c => 
        (c.id && c.id.toLowerCase().includes(word)) || 
        (c.name && c.name.toLowerCase().includes(word))
      )) {
        score += confidence * 1.8;
        colorHit = true;
      }
    }
  }

  // Light bonuses only if the product text actually contains the concept.
  // (Big generic boosts here were causing “bag-ish but wrong item” false positives.)
  const bagTags = ['bag','handbag','tote','clutch','backpack','satchel','purse'];
  const materialTags = ['leather', 'canvas', 'suede', 'patent', 'nylon', 'crocodile', 'ostrich'];
  const tagsText = tags.map(t => t.tag.toLowerCase()).join(' ');

  bagTypeHit = bagTags.some(b => tagsText.includes(b)) && bagTags.some(b => fields.includes(b));
  materialHit = materialTags.some(m => tagsText.includes(m)) && materialTags.some(m => fields.includes(m));
  if (bagTypeHit) score += 3;
  if (materialHit) score += 2;

  // Brand-specific bonuses (exact matches get huge boost)
  const luxuryBrands = ['gucci', 'chanel', 'prada', 'hermes', 'coach', 'dior', 'louis vuitton'];
  for (const brand of luxuryBrands) {
    if (tags.some(t => t.tag.toLowerCase() === brand.toLowerCase()) && 
        product.brand && product.brand.toLowerCase().includes(brand)) {
      score += 25;
      break;
    }
  }

  // Hard guardrails: if we only matched weak signals (e.g., generic description words),
  // down-weight to avoid returning unrelated items.
  const strongSignals = [exactHit, brandHit, categoryHit].filter(Boolean).length;
  const weakOnly = strongSignals === 0 && (colorHit || materialHit || bagTypeHit);
  if (weakOnly) score *= 0.55;

  // Normalize score by tag confidence average
  const avgConfidence = tags.reduce((sum, t) => sum + t.confidence, 0) / tags.length;
  const normalizedScore = score * (avgConfidence / 50);

  return Math.max(0, normalizedScore);
};

export const visualSearch = async (imageFile, allProducts) => {
  // Primary path: CLIP embedding cosine similarity
  const embeddingMatches = await findVisualMatchesByEmbedding(imageFile, allProducts, 20);
  if (embeddingMatches.length > 0) {
    console.log(`Found ${embeddingMatches.length} embedding-based visual matches`);
    return embeddingMatches;
  }

  // Imagga requires a server-side proxy — CORS blocks it in the browser.
  // Return all products so the UI is never empty while embeddings are being set up.
  console.warn('No embedding matches found. Ensure the RLS policy allows anon reads on product_image_embeddings.');
  return allProducts.slice(0, 20);
};

// Helper function to analyze match quality
const getMatchDetails = (product, tags) => {
  const details = {
    hasExactNameMatch: false,
    hasBrandMatch: false,
    hasCategoryMatch: false,
    hasColorMatch: false,
    hasMaterialMatch: false,
    hasBagTypeMatch: false,
    confidence: 0
  };
  
  const avgConfidence = tags.reduce((sum, t) => sum + t.confidence, 0) / tags.length;
  details.confidence = avgConfidence;
  
  const fields = [
    product.name, product.category, product.brand,
    product.condition, product.description, product.sub,
    ...(product.colors || []).map(c => c.id || ''),
    ...(product.colors || []).map(c => c.name || ''),
  ].filter(Boolean).join(' ').toLowerCase();

  const bagTags = ['bag','handbag','tote','clutch','backpack','satchel','purse'];
  const materialTags = ['leather', 'canvas', 'suede', 'patent', 'nylon', 'crocodile', 'ostrich'];

  const tagsText = tags.map(t => t.tag.toLowerCase()).join(' ');
  details.hasBagTypeMatch = bagTags.some(b => tagsText.includes(b)) && bagTags.some(b => fields.includes(b));
  details.hasMaterialMatch = materialTags.some(m => tagsText.includes(m)) && materialTags.some(m => fields.includes(m));

  for (const { tag } of tags) {
    if (product.name && product.name.toLowerCase().includes(tag.toLowerCase())) {
      details.hasExactNameMatch = true;
    }
    if (product.brand && product.brand.toLowerCase().includes(tag.toLowerCase())) {
      details.hasBrandMatch = true;
    }
    if (product.category && product.category.toLowerCase().includes(tag.toLowerCase())) {
      details.hasCategoryMatch = true;
    }
    if (product.colors && product.colors.some(c => 
      (c.id && c.id.toLowerCase().includes(tag.toLowerCase())) || 
      (c.name && c.name.toLowerCase().includes(tag.toLowerCase()))
    )) {
      details.hasColorMatch = true;
    }
  }
  
  return details;
};

// Remove very similar products to avoid showing duplicates
const removeSimilarProducts = (products) => {
  const deduped = [];
  const seen = new Set();
  
  for (const product of products) {
    // Create a signature for the product
    const signature = `${product.brand || ''}-${product.name || ''}-${product.category || ''}`.toLowerCase();
    
    // Check if we've seen a very similar product
    const isDuplicate = Array.from(seen).some(seenSig => {
      const similarity = calculateSimilarity(signature, seenSig);
      return similarity > 0.8; // 80% similarity threshold
    });
    
    if (!isDuplicate) {
      deduped.push(product);
      seen.add(signature);
    }
  }
  
  return deduped;
};

// Calculate string similarity
const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  if (shorter.length === 0) return 0.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

// Simple Levenshtein distance implementation
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

export const generateImageEmbedding = async () => { throw new Error('Use visualSearch() instead.'); };
export const queryPinecone = async () => [];
export const upsertToPinecone = async () => {};
export const deleteFromPinecone = async () => {};
