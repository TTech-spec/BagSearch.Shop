import { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';
import LogoIcon from './components/Logo.jsx';
import { sanitizeInput, validateRequired, validatePrice, validatePhone } from './utils/securityUtils';
import { uploadLimiter } from './utils/rateLimiter';
import { SecureErrorHandler } from './utils/errorHandler';
import { getImageEmbeddingFromSource, upsertProductImageEmbedding } from './services/imageEmbeddings';

// ─── WARM COLOR PALETTE (BagSearch Theme) ───────────────────────────────────────
const C = {
  primary:      '#C94B2C',
  primaryLight: '#E8856A',
  primaryBg:    '#F9DDD0',
  primaryPale:  '#FFF5F2',
  primaryBorder:'#F0C8BB',
  accent:       '#B33A1E',
  success:      '#C94B2C',
  successBg:    '#F9DDD0',
  successLight: '#FCE8E0',
  danger:       '#DC2626',
  dangerBg:     '#FEF2F2',
  surface:      '#FFFFFF',
  surfaceDim:   '#FDF8F5',
  border:       '#F0D9CC',
  borderLight:  '#F7ECE4',
  text:         '#1A0A00',
  textMid:      '#7A4030',
  textMuted:    '#B07060',
  textFaint:    '#E8C4B5',
};

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || 'products';

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
  console.error('Cloudinary Configuration Error:', {
    cloudName: CLOUDINARY_CLOUD_NAME ? 'set' : 'missing',
    uploadPreset: CLOUDINARY_UPLOAD_PRESET ? 'set' : 'missing'
  });
}

const MS = ({ name, size = 22, style: s = {} }) => (
  <span style={{ fontFamily: "'Material Symbols Outlined'", fontWeight: "normal", fontStyle: "normal", fontSize: size, lineHeight: 1, display: "inline-block", textTransform: "none", letterSpacing: "normal", whiteSpace: "nowrap", direction: "ltr", fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24", ...s }}>
    {name}
  </span>
);

// ─── Nigerian locations ───────────────────────────────────────────────────────
const NIGERIAN_LOCATIONS = [
  { id: 'umuahia', label: 'Umuahia', state: 'Abia', emoji: '👜' },
  { id: 'yola', label: 'Yola', state: 'Adamawa', emoji: '🌅' },
  { id: 'uyo', label: 'Uyo', state: 'Akwa Ibom', emoji: '🌴' },
  { id: 'awka', label: 'Awka', state: 'Anambra', emoji: '🛍️' },
  { id: 'bauchi', label: 'Bauchi', state: 'Bauchi', emoji: '🏜️' },
  { id: 'yenagoa', label: 'Yenagoa', state: 'Bayelsa', emoji: '🌊' },
  { id: 'makurdi', label: 'Makurdi', state: 'Benue', emoji: '🌾' },
  { id: 'maiduguri', label: 'Maiduguri', state: 'Borno', emoji: '🏺' },
  { id: 'calabar', label: 'Calabar', state: 'Cross River', emoji: '🌿' },
  { id: 'asaba', label: 'Asaba', state: 'Delta', emoji: '🛢️' },
  { id: 'abakaliki', label: 'Abakaliki', state: 'Ebonyi', emoji: '⛰️' },
  { id: 'benin-city', label: 'Benin City', state: 'Edo', emoji: '👑' },
  { id: 'ado-ekiti', label: 'Ado-Ekiti', state: 'Ekiti', emoji: '📚' },
  { id: 'enugu', label: 'Enugu', state: 'Enugu', emoji: '🏞️' },
  { id: 'gombe', label: 'Gombe', state: 'Gombe', emoji: '🌄' },
  { id: 'owerri', label: 'Owerri', state: 'Imo', emoji: '✨' },
  { id: 'dutse', label: 'Dutse', state: 'Jigawa', emoji: '🌾' },
  { id: 'kaduna', label: 'Kaduna', state: 'Kaduna', emoji: '🏙️' },
  { id: 'kano', label: 'Kano', state: 'Kano', emoji: '🕌' },
  { id: 'katsina', label: 'Katsina', state: 'Katsina', emoji: '🧵' },
  { id: 'birnin-kebbi', label: 'Birnin Kebbi', state: 'Kebbi', emoji: '🌽' },
  { id: 'lokoja', label: 'Lokoja', state: 'Kogi', emoji: '🚢' },
  { id: 'ilorin', label: 'Ilorin', state: 'Kwara', emoji: '🪡' },
  { id: 'lagos', label: 'Lagos', state: 'Lagos', emoji: '🌊' },
  { id: 'lafia', label: 'Lafia', state: 'Nasarawa', emoji: '🪨' },
  { id: 'minna', label: 'Minna', state: 'Niger', emoji: '🌻' },
  { id: 'abeokuta', label: 'Abeokuta', state: 'Ogun', emoji: '🪨' },
  { id: 'akure', label: 'Akure', state: 'Ondo', emoji: '🌳' },
  { id: 'osogbo', label: 'Osogbo', state: 'Osun', emoji: '🪘' },
  { id: 'ibadan', label: 'Ibadan', state: 'Oyo', emoji: '🏛️' },
  { id: 'jos', label: 'Jos', state: 'Plateau', emoji: '⛰️' },
  { id: 'port-harcourt', label: 'Port Harcourt', state: 'Rivers', emoji: '⚓' },
  { id: 'sokoto', label: 'Sokoto', state: 'Sokoto', emoji: '🌙' },
  { id: 'jalingo', label: 'Jalingo', state: 'Taraba', emoji: '🌿' },
  { id: 'damaturu', label: 'Damaturu', state: 'Yobe', emoji: '☀️' },
  { id: 'gusau', label: 'Gusau', state: 'Zamfara', emoji: '🌾' },
  { id: 'abuja', label: 'Abuja', state: 'FCT', emoji: '🏛️' },
];

// ─── Bag color palette ────────────────────────────────────────────────────────
const BAG_COLORS = [
  { id: 'black',        label: 'Black',        hex: '#1A1A1A' },
  { id: 'white',        label: 'White',        hex: '#F5F5F0', border: '#D0C8BE' },
  { id: 'beige',        label: 'Beige',        hex: '#D4B896' },
  { id: 'camel',        label: 'Camel',        hex: '#C19A6B' },
  { id: 'tan',          label: 'Tan',          hex: '#A67C52' },
  { id: 'brown',        label: 'Brown',        hex: '#6B3F2A' },
  { id: 'burgundy',     label: 'Burgundy',     hex: '#722F37' },
  { id: 'red',          label: 'Red',          hex: '#CC2200' },
  { id: 'pink',         label: 'Pink',         hex: '#E8A0A0' },
  { id: 'blush',        label: 'Blush',        hex: '#F2C4B8' },
  { id: 'orange',       label: 'Orange',       hex: '#E8762B' },
  { id: 'yellow',       label: 'Yellow',       hex: '#E8C84A' },
  { id: 'olive',        label: 'Olive',        hex: '#808000' },
  { id: 'green',        label: 'Green',        hex: '#2D6A3F' },
  { id: 'mint',         label: 'Mint',         hex: '#98D8C8' },
  { id: 'teal',         label: 'Teal',         hex: '#2A7A7A' },
  { id: 'navy',         label: 'Navy',         hex: '#1A2E5A' },
  { id: 'blue',         label: 'Blue',         hex: '#2255CC' },
  { id: 'cobalt',       label: 'Cobalt',       hex: '#0047AB' },
  { id: 'purple',       label: 'Purple',       hex: '#6A2D8F' },
  { id: 'lavender',     label: 'Lavender',     hex: '#B8A0D8' },
  { id: 'grey',         label: 'Grey',         hex: '#888888' },
  { id: 'silver',       label: 'Silver',       hex: '#C0C0C0' },
  { id: 'gold',         label: 'Gold',         hex: '#CFB53B' },
  { id: 'multicolor',   label: 'Multi',        hex: 'linear-gradient(135deg,#C94B2C,#E8856A,#F9DDD0,#2255CC,#2D6A3F)' },
];

// ─── Progress steps definition ────────────────────────────────────────────────
const STEPS = [
  { id: 'images',      label: 'Photos',      icon: 'photo_camera',      field: 'images' },
  { id: 'name',        label: 'Bag Name',    icon: 'label',             field: 'name' },
  { id: 'brand',       label: 'Brand',       icon: 'workspace_premium', field: 'brand' },
  { id: 'category',    label: 'Category',    icon: 'category',          field: 'category' },
  { id: 'condition',   label: 'Condition',   icon: 'star',              field: 'condition' },
  { id: 'colors',      label: 'Colors',      icon: 'palette',           field: 'colors' },
  { id: 'quantity',    label: 'Quantity',    icon: 'inventory_2',       field: 'quantity' },
  { id: 'price',       label: 'Price',       icon: 'payments',          field: 'price' },
  { id: 'location',    label: 'Location',    icon: 'location_on',       field: 'location' },
  { id: 'whatsapp',    label: 'WhatsApp',    icon: 'chat',              field: 'whatsapp' },
  { id: 'description', label: 'Description', icon: 'description',       field: 'description' },
];

// ─── Utility ──────────────────────────────────────────────────────────────────
function formatNaira(value) {
  if (!value) return '';
  const num = parseInt(value.toString().replace(/,/g, ''), 10);
  if (isNaN(num)) return value;
  return num.toLocaleString('en-NG');
}

// Security utilities for file upload validation
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 4096;

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('File size must be less than 5MB');
  }
  const suspiciousPatterns = [
    /\.php$/, /\.js$/, /\.exe$/, /\.bat$/, /\.cmd$/,
    /\.sh$/, /\.ps1$/, /\.vbs$/, /\.jar$/, /\.com$/
  ];
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    throw new Error('Invalid file type detected');
  }
  return true;
}

async function uploadImageToCloudinary(file, userId) {
  validateFile(file);
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    const missing = [];
    if (!CLOUDINARY_CLOUD_NAME) missing.push('VITE_CLOUDINARY_CLOUD_NAME');
    if (!CLOUDINARY_UPLOAD_PRESET) missing.push('VITE_CLOUDINARY_UPLOAD_PRESET');
    throw new Error(`Cloudinary is not configured. Missing: ${missing.join(', ')}. Please check your .env file and RESTART your dev server.`);
  }
  const payload = new FormData();
  payload.append('file', file);
  payload.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  payload.append('folder', `${CLOUDINARY_FOLDER}/${userId}`);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: payload });
    const data = await res.json();
    if (!res.ok || !data?.secure_url) throw new Error(data?.error?.message || 'Failed to upload image to Cloudinary.');
    return data.secure_url;
  } catch (err) {
    if (err.message === 'Failed to fetch') throw new Error('Cloudinary is unreachable. Please check your internet connection or Cloudinary cloud name.');
    throw err;
  }
}

export default function CreateProduct() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', brand: '', category: '',
    condition: 'Pristine (Like New)',
    description: '', price: '', location: '', whatsapp: '',
    quantity: '',
    discountEnabled: false,
    discountType: 'percentage',
    discountValue: '',
    discountLabel: '',
  });

  const [selectedColors, setSelectedColors] = useState([]);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);


  const toggleColor = (colorId) => {
    setSelectedColors(prev =>
      prev.includes(colorId) ? prev.filter(c => c !== colorId) : [...prev, colorId]
    );
  };

  const getStepDone = useCallback((step) => {
    if (step.field === 'images')   return images.length > 0;
    if (step.field === 'condition') return true;
    if (step.field === 'colors')   return selectedColors.length > 0;
    if (step.field === 'quantity') return !!formData.quantity && parseInt(formData.quantity) >= 1;
    return !!formData[step.field]?.toString().trim();
  }, [formData, images, selectedColors]);

  const completedCount = STEPS.filter(s => getStepDone(s)).length;
  const progressPct = Math.round((completedCount / STEPS.length) * 100);
  const progressColor = progressPct < 35 ? C.primary : progressPct < 70 ? C.primaryLight : C.primary;
  const progressLabel = progressPct < 35 ? 'Just getting started' : progressPct < 70 ? 'Making great progress!' : progressPct < 100 ? 'Almost ready to list!' : '🎉 Ready to list!';

  const rawPrice = parseInt((formData.price || '0').toString().replace(/,/g, '')) || 0;
  const discountVal = parseFloat(formData.discountValue) || 0;
  const discountedPrice = formData.discountEnabled && discountVal > 0
    ? formData.discountType === 'percentage'
      ? Math.round(rawPrice * (1 - discountVal / 100))
      : Math.max(0, rawPrice - discountVal)
    : null;
  const savingsAmount = discountedPrice !== null ? rawPrice - discountedPrice : 0;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const sanitizedValue = type === 'checkbox' ? checked : sanitizeInput(value);
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current.click();
  };

  const processFile = (file) => {
    if (!uploadLimiter.isAllowed(user?.id || 'anonymous')) {
      const secureError = SecureErrorHandler.handleError(new Error('Too many upload attempts. Please try again later.'), 'file_upload');
      setError(secureError.message);
      return;
    }
    try {
      validateFile(file);
      if (images.length >= 10) throw new Error('Max 10 photos');
      setImages(prev => [...prev, { file, preview: URL.createObjectURL(file) }]);
      setError(null);
    } catch (error) {
      const secureError = SecureErrorHandler.handleError(error, 'file_upload');
      setError(secureError.message);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
    if (!file) return;
    processFile(file);
  };

  const removeImage = (index) => setImages(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (!user) throw new Error('You must be logged in to list a product');
      if (images.length === 0) throw new Error('Please upload at least one image');

      const sanitizedName = sanitizeInput(formData.name);
      validateRequired(sanitizedName, 'Product name');
      const sanitizedWhatsApp = sanitizeInput(formData.whatsapp);
      validateRequired(sanitizedWhatsApp, 'WhatsApp number');
      validatePhone(sanitizedWhatsApp);
      validatePrice(formData.price);
      if (!sanitizedWhatsApp.trim()) throw new Error('Please enter your WhatsApp number');

      setError(null);
      performListing();
    } catch (err) {
      const secureError = SecureErrorHandler.handleError(err, 'product_creation');
      setError(secureError.message);
    }
  };

  const performListing = async () => {
    try {
      setUploading(true); setError(null);

      const sanitizedName = sanitizeInput(formData.name);
      const sanitizedBrand = sanitizeInput(formData.brand);
      const sanitizedDescription = sanitizeInput(formData.description);
      const sanitizedWhatsApp = sanitizeInput(formData.whatsapp);

      const uploadedImageUrls = [];
      for (const img of images) {
        const imageUrl = await uploadImageToCloudinary(img.file, user.id);
        uploadedImageUrls.push(imageUrl);
      }

      const price = formData.price.toString().replace(/,/g, '');
      const insertData = {
        user_id: user.id,
        name: sanitizedName,
        brand: sanitizedBrand,
        category: sanitizeInput(formData.category),
        condition: sanitizeInput(formData.condition),
        description: sanitizedDescription,
        price: price || '0',
        location: sanitizeInput(formData.location),
        whatsapp: sanitizedWhatsApp,
        quantity: parseInt(formData.quantity) || 1,
        colors: selectedColors,
        discount_enabled: formData.discountEnabled,
        discount_type: formData.discountType,
        discount_value: formData.discountEnabled ? discountVal : null,
        discount_label: formData.discountEnabled ? formData.discountLabel : null,
        discounted_price: discountedPrice,
        images: uploadedImageUrls,
        seller_name: user.user_metadata?.full_name || 'Anonymous Seller',
      };

      let { data: insertedData, error: insertError } = await supabase.from('products').insert([insertData]).select();
      if (insertError) throw insertError;

      try {
        const inserted = insertedData && insertedData[0];
        const firstImage = uploadedImageUrls[0];
        if (inserted?.id && firstImage) {
          const embedding = await getImageEmbeddingFromSource(firstImage);
          if (embedding.length > 0) {
            await upsertProductImageEmbedding(inserted.id, firstImage, embedding);
          }
        }
      } catch (embeddingError) {
        console.warn('Product created but embedding setup failed:', embeddingError);
      }

      navigate('/products');
    } catch (err) {
      const secureError = SecureErrorHandler.handleError(err, 'product_creation');
      setError(secureError.message);
      setShowAdGate(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ background: C.surfaceDim, minHeight: "100vh", fontFamily: "'Manrope', sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&family=DM+Serif+Display:ital@0;1&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeSlideUp   { from{opacity:0;transform:translateY(28px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlideDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn       { from{opacity:0;transform:scale(0.94)}       to{opacity:1;transform:scale(1)}     }
        @keyframes fadeIn        { from{opacity:0}                              to{opacity:1}                        }
        @keyframes shimmerProg   { 0%{transform:translateX(-120%)} 100%{transform:translateX(320%)} }
        @keyframes stepPop       { 0%{transform:scale(0.7)} 60%{transform:scale(1.18)} 100%{transform:scale(1)} }
        @keyframes stepRipple    { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(2.4);opacity:0} }
        @keyframes pctBounce     { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-4px)} }
        @keyframes imgAppear     { from{opacity:0;transform:scale(0.8) rotate(-3deg)} to{opacity:1;transform:scale(1) rotate(0)} }
        @keyframes bounce        { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes uploadPulse   { 0%,100%{opacity:1} 50%{opacity:0.55} }
        @keyframes sectionIn     { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tickDraw      { from{stroke-dashoffset:30} to{stroke-dashoffset:0} }
        @keyframes waPing        { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.2);opacity:0} }
        @keyframes colorPop      { 0%{transform:scale(0.5)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
        @keyframes discountSlide { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes priceCross    { from{width:0} to{width:100%} }
        @keyframes savingsPop    { 0%{transform:scale(0.7);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes tagWiggle     { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} }
        @keyframes spin          { to{transform:rotate(360deg)} }
        @keyframes adModalIn     { from{opacity:0;transform:scale(0.9) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }

        ::-webkit-scrollbar        { width: 5px; }
        ::-webkit-scrollbar-track  { background: transparent; }
        ::-webkit-scrollbar-thumb  { background: ${C.textFaint}; border-radius: 3px; }

        .field-input {
          width: 100%; height: 46px; padding: 0 16px;
          border: 1.5px solid ${C.border}; border-radius: 12px;
          font-family: 'Manrope', sans-serif; font-size: 14px; font-weight: 500;
          color: ${C.text}; background: white; outline: none;
          letter-spacing: normal; word-spacing: normal;
          transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.18s ease;
        }
        .field-input:focus {
          border-color: ${C.primary};
          box-shadow: 0 0 0 3px rgba(201,75,44,0.12);
          transform: translateY(-1px);
        }
        .field-input:not(:placeholder-shown):not(:focus) {
          border-color: ${C.primaryLight};
          background: ${C.successBg};
        }
        .field-select { appearance: none; cursor: pointer; }

        .img-thumb { animation: imgAppear 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .img-thumb:hover .remove-btn { opacity: 1 !important; transform: scale(1) !important; }

        .qty-input-wrap {
          display: flex; align-items: stretch;
          border: 1.5px solid ${C.border}; border-radius: 14px;
          overflow: hidden; background: white;
          transition: border-color 0.25s, box-shadow 0.25s;
        }
        .qty-input-wrap:focus-within {
          border-color: ${C.primary};
          box-shadow: 0 0 0 3px rgba(201,75,44,0.12);
        }
        .qty-spin-btn {
          width: 44px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          background: ${C.primaryPale}; color: ${C.primary};
          transition: background 0.18s, transform 0.12s;
          flex-shrink: 0; font-size: 20px; font-weight: 700;
          user-select: none;
        }
        .qty-spin-btn:hover:not(:disabled) { background: ${C.primaryBg}; }
        .qty-spin-btn:active:not(:disabled) { transform: scale(0.9); }
        .qty-spin-btn:disabled { background: ${C.surfaceDim}; color: ${C.textFaint}; cursor: not-allowed; }
        .qty-number-input {
          flex: 1; border: none; outline: none; text-align: center;
          font-size: 22px; font-weight: 900; color: ${C.text};
          font-family: 'Manrope', sans-serif; background: white;
          min-width: 0; padding: 10px 4px;
          -moz-appearance: textfield;
        }
        .qty-number-input::-webkit-inner-spin-button,
        .qty-number-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .qty-number-input:focus { background: ${C.primaryPale}; color: ${C.primary}; }

        .color-swatch {
          width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
          position: relative; flex-shrink: 0;
          border: 2.5px solid transparent;
        }
        .color-swatch:hover { transform: scale(1.18); }
        .color-swatch.selected {
          transform: scale(1.18);
          animation: colorPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .color-swatch.selected::after {
          content: '✓';
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 900;
          color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.6);
          border-radius: 50%;
        }

        .discount-toggle {
          position: relative; display: inline-flex; align-items: center;
          width: 48px; height: 26px; cursor: pointer;
        }
        .discount-toggle input { opacity: 0; width: 0; height: 0; }
        .discount-slider {
          position: absolute; inset: 0; border-radius: 13px;
          transition: background 0.3s;
        }
        .discount-slider::before {
          content: ''; position: absolute;
          width: 20px; height: 20px; border-radius: 50%;
          left: 3px; top: 3px; background: white;
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        .discount-toggle input:checked + .discount-slider::before { transform: translateX(22px); }

        .discount-type-btn {
          flex: 1; padding: 9px 0; border: 1.5px solid ${C.border};
          background: white; color: ${C.textMid}; font-family: 'Manrope',sans-serif;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px;
        }
        .discount-type-btn:first-child { border-radius: 10px 0 0 10px; border-right: none; }
        .discount-type-btn:last-child  { border-radius: 0 10px 10px 0; }
        .discount-type-btn.active {
          background: ${C.primary}; color: white; border-color: ${C.primary};
          box-shadow: 0 2px 8px ${C.primary}50;
        }

        .discount-body { animation: discountSlide 0.35s cubic-bezier(0.22,1,0.36,1) both; }

        .price-original-crossed {
          position: relative; display: inline-block; color: ${C.textMuted};
        }
        .price-original-crossed::after {
          content: ''; position: absolute;
          height: 2px; background: ${C.danger};
          top: 50%; left: 0; right: 0;
          animation: priceCross 0.4s ease 0.1s both;
        }

        .savings-badge { animation: savingsPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        .discount-tag-icon { animation: tagWiggle 1.4s ease-in-out infinite; display: inline-block; }

        @media (max-width: 768px) {
          .create-title { font-size: 28px !important; }
        }
        @media (max-width: 480px) {
          .create-main { padding: 24px 12px 60px !important; }
          .create-title { font-size: 24px !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        background: "rgba(255,255,255,0.94)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 1px 20px rgba(0,0,0,0.05)",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(-100%)",
        transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)"
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: C.primary }} onClick={() => navigate('/products')}>
            <LogoIcon size={24} />
            <span style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: "-0.5px" }}>Bag<span style={{ color: C.primary }}>Search</span></span>
          </div>
          <button onClick={() => navigate('/seller-profile')} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", borderRadius: 10,
            border: "none", background: C.primary, color: "white", fontSize: 13, fontWeight: 700,
            cursor: "pointer", transition: "all 0.2s", boxShadow: `0 2px 8px ${C.primary}80`
          }}
            onMouseEnter={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.primary; e.currentTarget.style.transform = "none"; }}>
            <MS name="person" size={17} /> Profile
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px 80px" }} className="create-main">

        {/* Breadcrumb */}
        <nav style={{
          display: "flex", gap: 6, alignItems: "center", fontSize: 13, color: C.textMuted, marginBottom: 24,
          opacity: mounted ? 1 : 0, animation: mounted ? "fadeSlideDown 0.5s ease 0.1s both" : "none"
        }}>
          <a href="#" onClick={e => { e.preventDefault(); navigate('/seller-profile'); }} style={{ color: C.primary, fontWeight: 700, textDecoration: "none" }}>Dashboard</a>
          <MS name="chevron_right" size={16} style={{ color: C.textFaint }} />
          <span style={{ color: C.text, fontWeight: 600 }}>List a Bag</span>
        </nav>

        {/* Page title */}
        <div style={{ marginBottom: 32, opacity: mounted ? 1 : 0, animation: mounted ? "fadeSlideUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.15s both" : "none" }}>
          <h1 style={{
            fontSize: "clamp(2rem,5vw,2.8rem)", fontWeight: 900, color: C.text,
            letterSpacing: "-0.04em", lineHeight: 1.1, fontFamily: "'DM Serif Display', serif", marginBottom: 8
          }} className="create-title">List Your Bag</h1>
          <p style={{ color: C.textMuted, fontSize: 15, fontWeight: 500, maxWidth: 520 }}>
            Fill in all details below. Our AI visual search will index your bag for maximum buyer visibility.
          </p>
        </div>

        {/* ── LIVE PROGRESS TRACKER ── */}
        <div style={{
          background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`,
          padding: "24px 24px 20px", marginBottom: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          opacity: mounted ? 1 : 0, animation: mounted ? "scaleIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.25s both" : "none",
          overflow: "hidden", position: "relative"
        }}>
          {progressPct === 100 && (
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${C.primary}10 0%, ${C.primaryLight}15 100%)`, pointerEvents: "none", borderRadius: 20 }} />
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: C.textMuted, marginBottom: 3 }}>Listing Progress</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{progressLabel}</div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: progressColor, letterSpacing: "-0.04em", transition: "color 0.5s ease", lineHeight: 1 }}>{progressPct}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: progressColor }}>%</span>
            </div>
          </div>
          <div style={{ height: 10, background: C.borderLight, borderRadius: 9999, overflow: "hidden", marginBottom: 20, position: "relative" }}>
            <div style={{
              height: "100%", background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`,
              borderRadius: 9999, width: `${progressPct}%`,
              transition: "width 0.65s cubic-bezier(0.34,1.56,0.64,1)",
              position: "relative", overflow: "hidden",
              boxShadow: `0 0 12px ${C.primary}88`,
            }}>
              {progressPct > 5 && (
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.3) 50%, transparent 80%)", animation: "shimmerProg 2s ease-in-out infinite" }} />
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {STEPS.map((step) => {
              const done = getStepDone(step);
              return (
                <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0, minWidth: 56 }}>
                  <div style={{ position: "relative", width: 36, height: 36 }}>
                    {done && <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${C.primary}`, opacity: 0.4, animation: "stepRipple 1.8s ease-out infinite" }} />}
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: done ? C.primary : C.borderLight,
                      border: done ? `2px solid ${C.primary}` : `2px solid ${C.border}`,
                      transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                      transform: done ? "scale(1)" : "scale(0.92)",
                      animation: done ? "stepPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
                      position: "relative", zIndex: 1,
                      boxShadow: done ? `0 3px 12px ${C.primary}80` : "none",
                    }}>
                      {done ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 30, strokeDashoffset: 0, animation: "tickDraw 0.3s ease both" }} />
                        </svg>
                      ) : (
                        <MS name={step.icon} size={16} style={{ color: C.textMuted }} />
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: done ? C.primary : C.textMuted, letterSpacing: "0.06em", textAlign: "center", textTransform: "uppercase", transition: "color 0.3s" }}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: C.dangerBg, border: `1px solid ${C.danger}40`, color: C.danger,
            padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, marginBottom: 20,
            display: "flex", alignItems: "center", gap: 8, animation: "scaleIn 0.3s ease both"
          }}>
            <MS name="error" size={18} style={{ color: C.danger, flexShrink: 0 }} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── SECTION 1: Images ── */}
          <FormSection icon="photo_camera" title="Upload Photos" subtitle="Add up to 10 clear photos" delay={0.35} mounted={mounted}>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={handleUploadAreaClick}
              style={{
                border: `2px dashed ${dragOver ? C.primary : images.length > 0 ? C.primaryLight : C.border}`,
                borderRadius: 16, padding: "36px 20px", cursor: "pointer", textAlign: "center",
                background: dragOver ? C.primaryPale : images.length > 0 ? C.successBg : C.surfaceDim,
                transition: "all 0.3s ease", transform: dragOver ? "scale(1.01)" : "none",
                position: 'relative',
              }}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />

              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: images.length > 0 ? C.successBg : C.primaryPale,
                margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center",
                animation: dragOver ? "bounce 0.6s ease infinite" : images.length === 0 ? "uploadPulse 2s ease-in-out infinite" : "none"
              }}>
                <MS name={images.length > 0 ? "check_circle" : "cloud_upload"} size={30} style={{ color: C.primary }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 5 }}>
                {images.length > 0
                  ? `${images.length} photo${images.length > 1 ? 's' : ''} added — add another?`
                  : "Drag & drop or click to upload"}
              </p>
              <p style={{ fontSize: 12, color: C.textMuted }}>
                One photo at a time · up to 10 total (Front, Back, Inside, Serial Number)
              </p>
            </div>

            {images.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 10, marginTop: 16 }}>
                {images.map((img, idx) => (
                  <div key={idx} className="img-thumb" style={{
                    aspectRatio: "1", borderRadius: 12, overflow: "hidden", position: "relative",
                    border: `2px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    animationDelay: `${idx * 50}ms`
                  }}>
                    <img src={img.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button type="button" className="remove-btn" onClick={e => { e.stopPropagation(); removeImage(idx); }}
                      style={{
                        position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%",
                        border: "none", background: C.danger, color: "white", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: 0, transform: "scale(0.8)", transition: "all 0.2s"
                      }}>
                      <MS name="close" size={14} />
                    </button>
                    {idx === 0 && <span style={{
                      position: "absolute", bottom: 4, left: 4, fontSize: 9, fontWeight: 800,
                      letterSpacing: "0.08em", textTransform: "uppercase", background: C.text,
                      color: "white", padding: "2px 6px", borderRadius: 4
                    }}>Main</span>}
                  </div>
                ))}
              </div>
            )}
          </FormSection>

          {/* ── SECTION 2: Bag Details ── */}
          <FormSection icon="label" title="Bag Details" subtitle="Basic information about your bag" delay={0.45} mounted={mounted}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>

              <FieldGroup label="Bag Name" done={!!formData.name}>
                <input name="name" value={formData.name} onChange={handleInputChange} required className="field-input" placeholder="e.g., Chanel Classic Flap Caviar" type="text" />
              </FieldGroup>

              <FieldGroup label="Brand" done={!!formData.brand}>
                <div style={{ position: "relative" }}>
                  <select name="brand" value={formData.brand} onChange={handleInputChange} required className="field-input field-select" style={{ paddingRight: 40 }}>
                    <option value="">Select a brand</option>
                    {['Chanel','Hermès','Louis Vuitton','Gucci','Prada','Dior','Balenciaga','Fendi','Celine','Bottega Veneta','Other'].map(b => <option key={b}>{b}</option>)}
                  </select>
                  <MS name="expand_more" size={18} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none" }} />
                </div>
              </FieldGroup>

              <FieldGroup label="Category" done={!!formData.category}>
                <div style={{ position: "relative" }}>
                  <select name="category" value={formData.category} onChange={handleInputChange} required className="field-input field-select" style={{ paddingRight: 40 }}>
                    <option value="">Select category</option>
                    {['Handbags','Shoulder Bags','Clutches','Totes','Backpacks','Crossbody','Evening Bags','Mini Bags','Satchels'].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <MS name="expand_more" size={18} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none" }} />
                </div>
              </FieldGroup>

              <FieldGroup label="Condition" done={true}>
                <div style={{ position: "relative" }}>
                  <select name="condition" value={formData.condition} onChange={handleInputChange} required className="field-input field-select" style={{ paddingRight: 40 }}>
                    {['Pristine (Like New)','Excellent (Minor Wear)','Very Good (Gentle Use)','Fair (Visible Wear)'].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <MS name="expand_more" size={18} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none" }} />
                </div>
              </FieldGroup>

              <FieldGroup label="Quantity Available" done={!!formData.quantity && parseInt(formData.quantity) >= 1}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="qty-input-wrap">
                    <button type="button" className="qty-spin-btn"
                      disabled={!formData.quantity || parseInt(formData.quantity) <= 1}
                      onClick={() => setFormData(p => ({ ...p, quantity: String(Math.max(1, (parseInt(p.quantity) || 1) - 1)) }))}>
                      −
                    </button>
                    <input
                      type="number" min="1"
                      className="qty-number-input"
                      value={formData.quantity}
                      placeholder="0"
                      onChange={e => {
                        const v = e.target.value;
                        if (v === '' || /^\d+$/.test(v))
                          setFormData(p => ({ ...p, quantity: v }));
                      }}
                      onBlur={e => {
                        const v = parseInt(e.target.value);
                        if (!v || v < 1) setFormData(p => ({ ...p, quantity: '1' }));
                      }}
                    />
                    <button type="button" className="qty-spin-btn"
                      onClick={() => setFormData(p => ({ ...p, quantity: String((parseInt(p.quantity) || 0) + 1) }))}>
                      +
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[1, 2, 3, 5, 10, 20].map(n => {
                      const active = parseInt(formData.quantity) === n;
                      return (
                        <button key={n} type="button"
                          onClick={() => setFormData(p => ({ ...p, quantity: String(n) }))}
                          style={{
                            padding: "4px 13px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                            cursor: "pointer", transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                            fontFamily: "'Manrope', sans-serif",
                            border: `1.5px solid ${active ? C.primary : C.border}`,
                            background: active ? C.primary : "white",
                            color: active ? "white" : C.textMid,
                            transform: active ? "scale(1.08)" : "scale(1)",
                            boxShadow: active ? `0 3px 10px ${C.primary}50` : "none",
                          }}>
                          {n}
                        </button>
                      );
                    })}
                  </div>
                  {formData.quantity && parseInt(formData.quantity) > 1 && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 10,
                      background: C.primaryPale, border: `1px solid ${C.primaryBorder}`,
                      animation: "scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
                    }}>
                      <MS name="inventory_2" size={15} style={{ color: C.primary, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>
                        {parseInt(formData.quantity) >= 50
                          ? `${formData.quantity} bags in stock — bulk ready! 🎉`
                          : parseInt(formData.quantity) >= 10
                          ? `${formData.quantity} bags in stock — perfect for bulk buyers!`
                          : `${formData.quantity} bags available — great selection!`}
                      </span>
                    </div>
                  )}
                </div>
              </FieldGroup>

            </div>

            {/* ── BAG COLORS ── */}
            <div style={{ marginTop: 22, borderTop: `1px solid ${C.borderLight}`, paddingTop: 20 }}>
              <FieldGroup label="Available Colors" done={selectedColors.length > 0}>
                <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 12, marginTop: -4 }}>
                  Select all colors this bag is available in
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                  {BAG_COLORS.map(color => {
                    const isSelected = selectedColors.includes(color.id);
                    const isMulti = color.id === 'multicolor';
                    return (
                      <div key={color.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <button
                          type="button"
                          className={`color-swatch${isSelected ? ' selected' : ''}`}
                          onClick={() => toggleColor(color.id)}
                          title={color.label}
                          style={{
                            background: isMulti ? color.hex : color.hex,
                            backgroundImage: isMulti ? color.hex : undefined,
                            borderColor: isSelected ? C.primary : (color.border || 'transparent'),
                            boxShadow: isSelected
                              ? `0 0 0 3px ${C.primary}40, 0 3px 10px rgba(0,0,0,0.15)`
                              : '0 1px 4px rgba(0,0,0,0.12)',
                          }}
                        />
                        <span style={{
                          fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                          letterSpacing: "0.05em", color: isSelected ? C.primary : C.textMuted,
                          transition: "color 0.2s",
                        }}>{color.label}</span>
                      </div>
                    );
                  })}
                </div>
                {selectedColors.length > 0 && (
                  <div style={{
                    display: "flex", flexWrap: "wrap", gap: 7, padding: "10px 14px",
                    background: C.primaryPale, borderRadius: 12, border: `1px solid ${C.primaryBorder}`,
                    animation: "scaleIn 0.3s ease both",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 4 }}>
                      <MS name="palette" size={14} style={{ color: C.primary }} /> Selected:
                    </span>
                    {selectedColors.map(cid => {
                      const c = BAG_COLORS.find(x => x.id === cid);
                      return (
                        <span key={cid} style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "3px 10px 3px 6px", borderRadius: 20,
                          background: "white", border: `1.5px solid ${C.primaryBorder}`,
                          fontSize: 11, fontWeight: 700, color: C.textMid,
                        }}>
                          <span style={{
                            width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
                            background: c?.id === 'multicolor' ? undefined : c?.hex,
                            backgroundImage: c?.id === 'multicolor' ? c?.hex : undefined,
                            border: `1px solid ${c?.border || 'rgba(0,0,0,0.1)'}`,
                            display: "inline-block",
                          }} />
                          {c?.label}
                          <button type="button" onClick={() => toggleColor(cid)} style={{
                            width: 14, height: 14, borderRadius: "50%", border: "none",
                            background: C.textFaint, color: C.textMid, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 9, fontWeight: 900, padding: 0, marginLeft: 1,
                          }}>✕</button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </FieldGroup>
            </div>
          </FormSection>

          {/* ── SECTION 3: Pricing & Location ── */}
          <FormSection icon="payments" title="Pricing & Location" subtitle="Set your price in Naira and where you're selling from" delay={0.55} mounted={mounted}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginBottom: 24 }}>

              <FieldGroup label="Price (₦)" done={!!formData.price}>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                    fontSize: 16, fontWeight: 800, color: formData.price ? C.primary : C.textMuted,
                    lineHeight: 1, transition: "color 0.25s", userSelect: "none"
                  }}>₦</span>
                  <input
                    name="price" value={formData.price ? formatNaira(formData.price) : ''} required
                    onChange={e => {
                      const raw = e.target.value.replace(/,/g, '');
                      if (/^\d*$/.test(raw)) setFormData(prev => ({ ...prev, price: raw }));
                    }}
                    className="field-input" placeholder="e.g., 2,500,000" type="text"
                    style={{ paddingLeft: 32 }}
                  />
                </div>
                {formData.price && (
                  <p style={{ fontSize: 11, color: C.primary, fontWeight: 700, marginTop: 5 }}>
                    ≈ ${(parseInt(formData.price) / 1600).toFixed(0)} USD at current rate
                  </p>
                )}
              </FieldGroup>

              <FieldGroup label="Your Location" done={!!formData.location}>
                <div style={{ position: "relative" }}>
                  <select name="location" value={formData.location} onChange={handleInputChange} required className="field-input field-select" style={{ paddingRight: 40 }}>
                    <option value="">Select your city</option>
                    {Object.entries(NIGERIAN_LOCATIONS.reduce((acc, l) => { (acc[l.state] = acc[l.state] || []).push(l); return acc; }, {})).map(([state, locs]) => (
                      <optgroup key={state} label={`── ${state}`}>
                        {locs.map(l => <option key={l.id} value={l.id}>{l.emoji} {l.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <MS name="expand_more" size={18} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none" }} />
                </div>
                {formData.location && (() => {
                  const loc = NIGERIAN_LOCATIONS.find(l => l.id === formData.location);
                  return loc ? (
                    <div style={{
                      marginTop: 8, display: "flex", alignItems: "center", gap: 7,
                      padding: "7px 12px", background: C.primaryPale, border: `1px solid ${C.primaryBorder}`,
                      borderRadius: 8, animation: "scaleIn 0.3s ease both"
                    }}>
                      <span style={{ fontSize: 16 }}>{loc.emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>{loc.label}, {loc.state}</span>
                    </div>
                  ) : null;
                })()}
              </FieldGroup>

            </div>

            {/* ── DISCOUNT MODULE ── */}
            <div style={{
              borderRadius: 16, border: `1.5px solid ${formData.discountEnabled ? C.primary : C.border}`,
              overflow: "hidden", transition: "border-color 0.3s, box-shadow 0.3s",
              boxShadow: formData.discountEnabled ? `0 0 0 3px ${C.primary}15, 0 4px 20px ${C.primary}20` : "none",
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px",
                background: formData.discountEnabled
                  ? `linear-gradient(135deg, ${C.primary}18 0%, ${C.primaryLight}12 100%)`
                  : C.surfaceDim,
                transition: "background 0.4s",
                cursor: "pointer",
              }} onClick={() => setFormData(p => ({ ...p, discountEnabled: !p.discountEnabled }))}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                    background: formData.discountEnabled ? C.primary : C.primaryPale,
                    transition: "background 0.3s",
                  }}>
                    <span className="discount-tag-icon" style={{ fontSize: 17 }}>🏷️</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: formData.discountEnabled ? C.primary : C.text, transition: "color 0.3s" }}>
                      Run a Discount
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>
                      {formData.discountEnabled ? "Discount is active — buyers will see the sale price" : "Attract more buyers with a special offer"}
                    </div>
                  </div>
                </div>
                <label className="discount-toggle" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" name="discountEnabled" checked={formData.discountEnabled} onChange={handleInputChange} />
                  <span className="discount-slider" style={{ background: formData.discountEnabled ? C.primary : C.textFaint }} />
                </label>
              </div>

              {formData.discountEnabled && (
                <div className="discount-body" style={{ padding: "18px 18px 20px", borderTop: `1px solid ${C.primaryBorder}`, background: C.primaryPale }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Discount Type</div>
                    <div style={{ display: "flex" }}>
                      <button type="button" className={`discount-type-btn${formData.discountType === 'percentage' ? ' active' : ''}`}
                        onClick={() => setFormData(p => ({ ...p, discountType: 'percentage', discountValue: '' }))}>
                        <span style={{ fontSize: 16 }}>%</span> Percentage
                      </button>
                      <button type="button" className={`discount-type-btn${formData.discountType === 'fixed' ? ' active' : ''}`}
                        onClick={() => setFormData(p => ({ ...p, discountType: 'fixed', discountValue: '' }))}>
                        <span style={{ fontSize: 14, fontWeight: 900 }}>₦</span> Fixed Amount
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                        {formData.discountType === 'percentage' ? 'Discount %' : 'Amount Off (₦)'}
                      </div>
                      <div style={{ position: "relative" }}>
                        <span style={{
                          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                          fontSize: 14, fontWeight: 800, color: C.primary, userSelect: "none"
                        }}>
                          {formData.discountType === 'percentage' ? '%' : '₦'}
                        </span>
                        <input
                          type="number" min="1" max={formData.discountType === 'percentage' ? 99 : undefined}
                          name="discountValue" value={formData.discountValue}
                          onChange={handleInputChange}
                          className="field-input"
                          placeholder={formData.discountType === 'percentage' ? 'e.g., 15' : 'e.g., 50000'}
                          style={{ paddingLeft: 30, background: "white" }}
                        />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                        Sale Label <span style={{ color: C.textFaint, fontWeight: 600 }}>(optional)</span>
                      </div>
                      <input
                        name="discountLabel" value={formData.discountLabel}
                        onChange={handleInputChange}
                        className="field-input"
                        placeholder='e.g., "Flash Sale" or "Weekend Deal"'
                        style={{ background: "white" }}
                      />
                    </div>
                  </div>
                  {formData.discountType === 'percentage' && (
                    <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                      {[5, 10, 15, 20, 25, 30, 50].map(pct => {
                        const active = formData.discountValue === String(pct);
                        return (
                          <button key={pct} type="button"
                            onClick={() => setFormData(p => ({ ...p, discountValue: String(pct) }))}
                            style={{
                              padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800,
                              cursor: "pointer", transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                              fontFamily: "'Manrope', sans-serif",
                              border: `1.5px solid ${active ? C.primary : C.primaryBorder}`,
                              background: active ? C.primary : "white",
                              color: active ? "white" : C.textMid,
                              transform: active ? "scale(1.1)" : "scale(1)",
                              boxShadow: active ? `0 3px 10px ${C.primary}50` : "none",
                            }}>
                            {pct}% off
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {rawPrice > 0 && discountVal > 0 && discountedPrice !== null && discountedPrice > 0 && (
                    <div style={{
                      padding: "14px 16px", borderRadius: 14,
                      background: "white", border: `1.5px solid ${C.primaryBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      flexWrap: "wrap", gap: 10,
                      animation: "savingsPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
                    }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textMuted, marginBottom: 5 }}>
                          {formData.discountLabel || 'Sale'} Preview
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                          <span className="price-original-crossed" style={{ fontSize: 16, fontWeight: 700 }}>
                            ₦{formatNaira(rawPrice)}
                          </span>
                          <span style={{ fontSize: 22, fontWeight: 900, color: C.primary, letterSpacing: "-0.03em" }}>
                            ₦{formatNaira(discountedPrice)}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>
                          ≈ ${(discountedPrice / 1600).toFixed(0)} USD
                        </div>
                      </div>
                      <div className="savings-badge" style={{
                        padding: "10px 16px", borderRadius: 12,
                        background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                        color: "white", textAlign: "center",
                        boxShadow: `0 4px 14px ${C.primary}60`,
                      }}>
                        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em" }}>
                          {formData.discountType === 'percentage' ? `${discountVal}%` : `₦${formatNaira(savingsAmount)}`}
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.88, marginTop: 1 }}>
                          {formData.discountType === 'percentage' ? `Save ₦${formatNaira(savingsAmount)}` : 'OFF'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </FormSection>

          {/* ── SECTION 4: WhatsApp Contact ── */}
          <FormSection icon="chat" title="WhatsApp Contact" subtitle="Buyers will reach you directly on WhatsApp" delay={0.65} mounted={mounted}>
            <FieldGroup label="Your WhatsApp Number" done={!!formData.whatsapp}>
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {formData.whatsapp && <div style={{ position: "absolute", width: 22, height: 22, borderRadius: "50%", background: `${C.primary}30`, animation: "waPing 1.8s ease-out infinite" }} />}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={formData.whatsapp ? C.primary : C.textMuted} style={{ position: "relative", zIndex: 1, transition: "fill 0.3s" }}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} required className="field-input" placeholder="e.g., 08012345678 or +2348012345678" type="tel" style={{ paddingLeft: 42 }} />
              </div>
              <p style={{ fontSize: 11, color: C.textMuted, marginTop: 5 }}>Buyers will tap "Chat on WhatsApp" to contact you directly about this listing.</p>
              {formData.whatsapp && (
                <a href={`https://wa.me/${formData.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7, marginTop: 10,
                    padding: "7px 14px", borderRadius: 8, background: C.successBg, border: `1px solid ${C.primaryBorder}`,
                    color: C.primary, fontSize: 12, fontWeight: 700, textDecoration: "none",
                    transition: "all 0.2s", animation: "scaleIn 0.3s ease both"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.primaryBg}
                  onMouseLeave={e => e.currentTarget.style.background = C.successBg}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Test your WhatsApp link
                </a>
              )}
            </FieldGroup>
          </FormSection>

          {/* ── SECTION 5: Description ── */}
          <FormSection icon="description" title="Description" subtitle="Describe condition, history, and details" delay={0.75} mounted={mounted}>
            <FieldGroup label="Detailed Description" done={!!formData.description}>
              <div style={{
                border: `1.5px solid ${formData.description ? C.primaryLight : C.border}`,
                borderRadius: 12, overflow: "hidden", transition: "border-color 0.25s, box-shadow 0.25s"
              }}
                onFocusCapture={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}20`; }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = formData.description ? C.primaryLight : C.border; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", background: C.surfaceDim, borderBottom: `1px solid ${C.border}` }}>
                  {[["format_bold","Bold"],["format_italic","Italic"],["format_list_bulleted","List"]].map(([icon, label]) => (
                    <button key={icon} type="button" title={label} style={{
                      width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      color: C.textMuted, transition: "all 0.18s"
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.primaryBg; e.currentTarget.style.color = C.primary; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; }}>
                      <MS name={icon} size={18} />
                    </button>
                  ))}
                  <div style={{ marginLeft: "auto", fontSize: 10, color: C.textFaint, fontWeight: 700 }}>{formData.description.length}/1000</div>
                </div>
                <textarea name="description" value={formData.description} onChange={handleInputChange} required maxLength={1000}
                  style={{
                    width: "100%", minHeight: 130, padding: "14px 16px", border: "none", outline: "none",
                    resize: "vertical", fontFamily: "inherit", fontSize: 14, color: C.text, lineHeight: 1.65,
                    letterSpacing: "normal", wordSpacing: "normal",
                    background: C.surface, whiteSpace: "pre-wrap", wordWrap: "break-word"
                  }}
                  placeholder="Describe any wear and tear, material details, authentication cards included, where and when purchased, any flaws to be transparent about…" />
              </div>
            </FieldGroup>
          </FormSection>

          {/* ── SUBMIT FOOTER ── */}
          <div style={{
            marginTop: 28, background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`,
            padding: "20px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
            opacity: mounted ? 1 : 0, animation: mounted ? "fadeSlideUp 0.5s ease 0.85s both" : "none"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.successBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={C.primary}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>Buyers contact via WhatsApp</p>
                <p style={{ fontSize: 11, color: C.textMuted }}>Get live purchase inquiries directly to your phone</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button type="button" onClick={() => navigate('/seller-profile')} style={{
                padding: "11px 20px", borderRadius: 12, border: `1px solid ${C.border}`,
                background: "white", color: C.textMuted, fontSize: 13, fontWeight: 700,
                cursor: "pointer", transition: "all 0.2s"
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}>
                Cancel
              </button>
              <button type="submit" disabled={uploading} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "11px 28px", borderRadius: 12,
                border: "none", background: C.primary, color: "white", fontSize: 14, fontWeight: 800,
                cursor: uploading ? "not-allowed" : "pointer",
                transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                boxShadow: `0 4px 16px ${C.primary}80`, opacity: uploading ? 0.7 : 1
              }}
                onMouseEnter={e => { if (!uploading) { e.currentTarget.style.transform = "translateY(-2px) scale(1.03)"; e.currentTarget.style.boxShadow = `0 8px 24px ${C.primary}`; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 4px 16px ${C.primary}80`; }}>
                {uploading ? (
                  <>
                    <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Uploading…
                  </>
                ) : (
                  <>{progressPct === 100 ? '🎉 ' : ''}List My Bag <MS name="arrow_forward" size={18} /></>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <footer style={{ marginTop: 40, textAlign: "center", opacity: mounted ? 1 : 0, animation: mounted ? "fadeIn 0.6s ease 1s both" : "none" }}>
          <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 10 }}>
            Need help? Chat with us on{' '}
            <a href="https://wa.me/2348147061837" target="_blank" rel="noopener noreferrer" style={{ color: C.primary, fontWeight: 700, textDecoration: "none" }}>WhatsApp Support</a>
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            {['Terms','Privacy','Authentication Guide'].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: C.textFaint, textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.color = C.primary}
                onMouseLeave={e => e.currentTarget.style.color = C.textFaint}>{l}</a>
            ))}
          </div>
        </footer>
      </main>
    </div>
  );
}

function FormSection({ icon, title, subtitle, delay, mounted, children }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`,
      overflow: "hidden", marginBottom: 20, boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
      opacity: mounted ? 1 : 0, animation: mounted ? `sectionIn 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}s both` : "none"
    }}>
      <div style={{
        padding: "18px 24px", borderBottom: `1px solid ${C.borderLight}`,
        background: C.surfaceDim, display: "flex", alignItems: "center", gap: 12
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: C.primaryPale, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <MS name={icon} size={19} style={{ color: C.primary }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ padding: "22px 24px" }}>{children}</div>
    </div>
  );
}

function FieldGroup({ label, done, children }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: done ? C.primary : C.textMid, letterSpacing: "0.02em", transition: "color 0.3s" }}>{label}</span>
        {done && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "stepPop 0.3s ease both" }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      {children}
    </div>
  );
}