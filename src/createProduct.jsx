import { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';
import LogoIcon from './components/Logo.jsx';
import CountUp from './components/ui/CountUp.jsx';
import { sanitizeInput, validateRequired, validatePrice, validatePhone } from './utils/securityUtils';
import { uploadLimiter } from './utils/rateLimiter';
import { SecureErrorHandler } from './utils/errorHandler';
import { normalizeWhatsAppNumber } from './utils/whatsapp';
import { getImageEmbeddingFromSource, upsertProductImageEmbedding } from './services/imageEmbeddings';
import { useSEO } from './hooks/useSEO';
import { useUploadLimit, recordUpload } from './hooks/useUploadLimit';
import { useIsMobileViewport } from './hooks/useIsMobileViewport';
import { T, FONT_SANS, FONT_SERIF, EASE_OUT, naira } from './theme/luxe';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || 'products';

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
  console.error('Cloudinary Configuration Error:', {
    cloudName: CLOUDINARY_CLOUD_NAME ? 'set' : 'missing',
    uploadPreset: CLOUDINARY_UPLOAD_PRESET ? 'set' : 'missing'
  });
}

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

const MAX_PHOTOS = 10;

const CONDITIONS = [
  { value: 'Pristine (Like New)',    title: 'Pristine',  hint: 'Like new, no signs of use' },
  { value: 'Excellent (Minor Wear)', title: 'Excellent', hint: 'Minor wear, hard to spot' },
  { value: 'Very Good (Gentle Use)', title: 'Very good', hint: 'Gentle, visible use' },
  { value: 'Fair (Visible Wear)',    title: 'Fair',      hint: 'Clear wear, priced to match' },
];
const BRANDS = ['Chanel', 'Hermès', 'Louis Vuitton', 'Gucci', 'Prada', 'Dior', 'Balenciaga', 'Fendi', 'Celine', 'Bottega Veneta', 'Other'];
const CATEGORIES = ['Handbags', 'Shoulder Bags', 'Clutches', 'Totes', 'Backpacks', 'Crossbody', 'Evening Bags', 'Mini Bags', 'Satchels'];
const QUICK_DETAILS = ['Dust bag included', 'Authenticity card included', 'Original box included', 'No visible flaws'];
const LOCATIONS_BY_STATE = Object.entries(
  NIGERIAN_LOCATIONS.reduce((acc, l) => { (acc[l.state] = acc[l.state] || []).push(l); return acc; }, {})
);

// Dark tick on pale swatches, white tick on dark ones
function isLightHex(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 160;
}

const Icon = {
  bag: (s = 40) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8h12l1 12H5L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
  ),
  plus: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
  ),
  camera: (s = 26) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
  ),
  close: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
  ),
  star: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg>
  ),
  search: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
  ),
  tag: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12l-8 8-9-9V3h8z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>
  ),
  back: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
  ),
  up: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
  ),
  alert: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.5" /></svg>
  ),
  whatsapp: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 7c0 5.45-4.44 9.88-9.88 9.88zm8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41z" /></svg>
  ),
};

function DrawnTick({ size = 18, color = '#fff', delay = 0 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <motion.path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, ease: 'easeOut', delay }} />
    </svg>
  );
}

function Section({ n, title, subtitle, optional, isMobile, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: EASE_OUT }}
      aria-labelledby={`cp-sec-${n}`}
      style={{
        background: T.surface, border: `1px solid ${T.line}`, borderRadius: 20,
        padding: isMobile ? 20 : '28px 32px', display: 'flex', flexDirection: 'column', gap: isMobile ? 18 : 22,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 14 }}>
        <span aria-hidden="true" style={{
          width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: '50%', flexShrink: 0,
          background: T.accentSoft, color: T.accentInk, fontWeight: 800, fontSize: isMobile ? 13 : 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{n}</span>
        <div>
          <h2 id={`cp-sec-${n}`} style={{ margin: 0, fontFamily: FONT_SERIF, fontWeight: 600, fontSize: isMobile ? 25 : 28, lineHeight: 1.1 }}>
            {title}
            {optional && <span style={{ fontFamily: FONT_SANS, fontSize: isMobile ? 13 : 14, fontWeight: 600, color: T.muted, marginLeft: 8 }}>optional</span>}
          </h2>
          {subtitle && !isMobile && <p style={{ margin: '2px 0 0', fontSize: 14, color: T.muted }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function Field({ label, htmlFor, hint, optional, children }) {
  const LabelTag = htmlFor ? 'label' : 'span';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <LabelTag htmlFor={htmlFor} style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>
        {label}{optional && <span style={{ fontWeight: 500, color: T.muted }}> (optional)</span>}
      </LabelTag>
      {children}
      {hint && <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.5 }}>{hint}</p>}
    </div>
  );
}

export default function CreateProduct() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const errorRef = useRef(null);
  const idRef = useRef(0);
  const isMobile = useIsMobileViewport();
  const reduce = useReducedMotion();
  const { canUpload, plan, used, limit, loading: limitLoading } = useUploadLimit('product');

  useSEO({
    title: 'Upload Product | BagSearch',
    description: 'List your bag for sale on BagSearch Nigeria. Upload photos, set your price, and reach buyers across Nigeria.',
    type: 'website',
    noindex: true,
  });

  const [formData, setFormData] = useState({
    name: '', brand: '', category: '',
    condition: 'Pristine (Like New)',
    description: '', price: '', location: '', whatsapp: '',
    quantity: '1',
    discountEnabled: false,
    discountType: 'percentage',
    discountValue: '',
    discountLabel: '',
  });

  const [selectedColors, setSelectedColors] = useState([]);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [published, setPublished] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [showAllColours, setShowAllColours] = useState(false);
  // One full row on desktop, two rows of 7 on phones
  const COLOURS_COLLAPSED = isMobile ? 14 : 13;

  // Free the preview blobs when the page goes away
  const imagesRef = useRef(images);
  useEffect(() => { imagesRef.current = images; }, [images]);
  useEffect(() => () => imagesRef.current.forEach(img => URL.revokeObjectURL(img.preview)), []);

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }, [error, reduce]);

  const set = (patch) => setFormData(prev => ({ ...prev, ...patch }));
  const toggleColor = (colorId) => {
    setSelectedColors(prev => prev.includes(colorId) ? prev.filter(c => c !== colorId) : [...prev, colorId]);
  };

  const rawPrice = parseInt((formData.price || '0').toString().replace(/,/g, '')) || 0;
  const discountVal = parseFloat(formData.discountValue) || 0;
  const discountedPrice = formData.discountEnabled && discountVal > 0
    ? formData.discountType === 'percentage'
      ? Math.round(rawPrice * (1 - discountVal / 100))
      : Math.max(0, rawPrice - discountVal)
    : null;
  const savingsAmount = discountedPrice !== null ? rawPrice - discountedPrice : 0;
  const discountShown = rawPrice > 0 && discountedPrice !== null && discountedPrice > 0 && savingsAmount > 0;
  const buyerPays = discountShown ? discountedPrice : rawPrice;

  const checklist = [
    { label: 'Photos',    done: images.length > 0 },
    { label: 'Bag name',  done: !!formData.name.trim() },
    { label: 'Brand',     done: !!formData.brand },
    { label: 'Category',  done: !!formData.category },
    { label: 'Condition', done: !!formData.condition },
    { label: 'Colours',   done: selectedColors.length > 0 },
    { label: 'Quantity',  done: parseInt(formData.quantity) >= 1 },
    { label: 'Price',     done: rawPrice > 0 },
    { label: 'City',      done: !!formData.location },
    { label: 'WhatsApp',  done: !!formData.whatsapp.trim() },
  ];
  const doneCount = checklist.filter(c => c.done).length;
  const missing = [
    !images.length && 'photos', !formData.name.trim() && 'bag name', !formData.brand && 'brand',
    !formData.category && 'category', !rawPrice && 'price', !formData.location && 'city',
    !formData.whatsapp.trim() && 'WhatsApp number',
  ].filter(Boolean);
  const limitReached = !limitLoading && !canUpload;
  const planName = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Free';
  const locationLabel = NIGERIAN_LOCATIONS.find(l => l.id === formData.location)?.label;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const sanitizedValue = type === 'checkbox' ? checked : sanitizeInput(value);
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
  };

  const processFiles = (files) => {
    if (!files.length) return;
    if (!uploadLimiter.isAllowed(user?.id || 'anonymous')) {
      setError(SecureErrorHandler.handleError(new Error('Too many upload attempts. Please try again later.'), 'file_upload').message);
      return;
    }
    const accepted = [];
    let problem = null;
    for (const file of files) {
      try { validateFile(file); accepted.push(file); }
      catch (err) { problem = SecureErrorHandler.handleError(err, 'file_upload').message; }
    }
    const room = MAX_PHOTOS - images.length;
    if (accepted.length > room) {
      problem = room > 0 ? `You can add up to ${MAX_PHOTOS} photos, so only the first ${room} were added.` : `You've already added ${MAX_PHOTOS} photos, the most a listing can have.`;
    }
    const toAdd = accepted.slice(0, Math.max(0, room)).map(file => ({ id: ++idRef.current, file, preview: URL.createObjectURL(file) }));
    if (toAdd.length) setImages(prev => [...prev, ...toAdd]);
    setError(problem);
  };

  const handleImageChange = (e) => {
    processFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    processFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  };

  const removeImage = (id) => setImages(prev => {
    const gone = prev.find(img => img.id === id);
    if (gone) URL.revokeObjectURL(gone.preview);
    return prev.filter(img => img.id !== id);
  });
  const makeCover = (id) => setImages(prev => {
    const pick = prev.find(img => img.id === id);
    return pick ? [pick, ...prev.filter(img => img.id !== id)] : prev;
  });

  const addDetail = (text) => {
    const current = formData.description.trimEnd();
    const next = current ? `${current}\n${text}.` : `${text}.`;
    if (next.length <= 1000) set({ description: next });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (uploading || published) return;
    try {
      if (!user) throw new Error('You must be logged in to list a product');
      if (!canUpload) throw new Error(`You've reached today's limit of ${limit} listings on the ${planName} plan. Upgrade at /pricing to list more.`);
      if (images.length === 0) throw new Error('Please add at least one photo');

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
      for (let i = 0; i < images.length; i++) {
        setStatus(images.length > 1 ? `Uploading photo ${i + 1} of ${images.length}…` : 'Uploading photo…');
        const imageUrl = await uploadImageToCloudinary(images[i].file, user.id);
        uploadedImageUrls.push(imageUrl);
      }
      setStatus('Saving your listing…');

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

      // Record upload for plan limit tracking
      await recordUpload(user.id, 'product');

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

      setPublished(true);
      setTimeout(() => navigate('/products'), reduce ? 400 : 1200);
    } catch (err) {
      // Log the real error to console so it's visible during debugging
      console.error('[performListing] Upload failed:', err?.message || err);
      // Show the actual error message directly — don't hide it behind a generic string
      setError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setStatus('');
    }
  };

  // ── pieces ────────────────────────────────────────────────────────────────
  const tileSize = isMobile ? 104 : undefined;

  const photoTile = (img, idx) => (
    <motion.div
      key={img.id}
      layout={!reduce}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      style={{
        position: 'relative', borderRadius: 14, overflow: 'hidden', background: T.photo,
        aspectRatio: '1 / 1', width: tileSize, flexShrink: 0,
      }}
    >
      <img src={img.preview} alt={idx === 0 ? 'Cover photo' : `Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      {idx === 0 ? (
        <motion.span layoutId={reduce ? undefined : 'cp-cover-badge'} style={{ position: 'absolute', left: 8, bottom: 8, padding: '4px 9px', borderRadius: 999, background: T.ink, color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '0.04em' }}>
          COVER
        </motion.span>
      ) : (
        <button type="button" className="cp-tile-btn" onClick={() => makeCover(img.id)} aria-label={`Make photo ${idx + 1} the cover`}
          style={{ position: 'absolute', left: 6, bottom: 6, height: 32, padding: '0 10px', borderRadius: 999, border: 'none', background: 'rgba(28,20,16,.66)', color: '#fff', font: `700 11px ${FONT_SANS}`, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          {Icon.star(12)} Cover
        </button>
      )}
      <button type="button" className="cp-tile-btn" onClick={() => removeImage(img.id)} aria-label={`Remove photo ${idx + 1}`}
        style={{ position: 'absolute', top: 6, right: 6, width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(28,20,16,.66)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        {Icon.close(12)}
      </button>
    </motion.div>
  );

  const addTile = images.length < MAX_PHOTOS && (
    <motion.button
      key="add" type="button" layout={!reduce} onClick={() => fileInputRef.current?.click()}
      whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
      style={{
        aspectRatio: '1 / 1', width: tileSize, flexShrink: 0, borderRadius: 14,
        border: `2px dashed ${T.lineStrong}`, background: T.bg, color: T.accentInk,
        font: `700 13px ${FONT_SANS}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
      }}
    >
      {isMobile ? Icon.camera(24) : Icon.plus(24)}
      {isMobile ? <span>Camera or<br />gallery</span> : 'Add photos'}
    </motion.button>
  );

  const priceSummary = (
    <AnimatePresence initial={false}>
      {discountShown && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          role="status"
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: T.greenSoft, color: T.green, fontSize: 14 }}
        >
          {Icon.tag(18)}
          <span>Buyers pay <b><CountUp value={discountedPrice} format={naira} duration={0.6} /></b> and save {naira(savingsAmount)}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const publishLabel = published ? (
    <><DrawnTick size={20} /> Published</>
  ) : uploading ? (
    <><span className="cp-spin" aria-hidden="true" /> {status || 'Publishing…'}</>
  ) : (
    <>{Icon.up(18)} Publish listing</>
  );

  const publishButton = (height = 56) => (
    <motion.button
      type="submit" disabled={uploading || published || limitReached}
      whileHover={uploading || published || limitReached ? undefined : { y: -1 }}
      whileTap={uploading || published || limitReached ? undefined : { scale: 0.98 }}
      animate={{ backgroundColor: published ? T.green : limitReached ? T.lineStrong : T.accent }}
      transition={{ duration: 0.3 }}
      aria-live="polite"
      style={{
        height, width: '100%', border: 'none', borderRadius: 14, color: '#fff',
        font: `700 16px ${FONT_SANS}`, cursor: uploading || published || limitReached ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, whiteSpace: 'nowrap', overflow: 'hidden',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={published ? 'done' : uploading ? 'busy' : 'idle'}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {publishLabel}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );

  const readyText = limitReached
    ? `You've used all ${limit} listings for today on the ${planName} plan.`
    : missing.length ? `Still needed: ${missing.join(', ')}.` : 'All set. Buyers can find it as soon as you publish.';

  const progressBar = (h = 6) => (
    <div style={{ height: h, borderRadius: h, background: T.lineSoft, overflow: 'hidden' }}>
      <motion.div
        initial={false} animate={{ scaleX: doneCount / checklist.length }}
        transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        style={{ height: '100%', background: T.accent, borderRadius: h, transformOrigin: 'left center' }}
      />
    </div>
  );

  // ── page ──────────────────────────────────────────────────────────────────
  return (
    <MotionConfig reducedMotion="user">
      <div style={{ background: T.bg, minHeight: '100vh', fontFamily: FONT_SANS, color: T.ink }}>
        <style>{`
          .cp-input{width:100%;height:50px;box-sizing:border-box;border:1.5px solid ${T.line};border-radius:12px;padding:0 16px;font:500 16px ${FONT_SANS};color:${T.ink};background:#fff;outline:none;transition:border-color .2s,box-shadow .2s}
          .cp-input::placeholder{color:#9A8A80}
          .cp-input:hover{border-color:${T.lineStrong}}
          .cp-input:focus{border-color:${T.accent};box-shadow:0 0 0 4px rgba(180,65,14,.12)}
          select.cp-input{cursor:pointer}
          textarea.cp-input{height:auto;min-height:140px;padding:14px 16px;line-height:1.55;resize:vertical}
          .cp-input::-webkit-inner-spin-button,.cp-input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
          .cp-grid{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:40px;align-items:start}
          .cp-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
          .cp-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
          .cp-cond{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
          .cp-photos{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
          .cp-tile-btn{transition:background .2s}
          .cp-tile-btn:hover{background:rgba(28,20,16,.85)!important}
          .cp-chip{transition:background .2s,color .2s,border-color .2s}
          .cp-chip:hover:not(:disabled){background:${T.accentSoft}!important;color:${T.accentInk}!important}
          .cp-spin{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;animation:cpSpin .7s linear infinite}
          @keyframes cpSpin{to{transform:rotate(360deg)}}
          button:focus-visible,a:focus-visible{outline:3px solid rgba(180,65,14,.45);outline-offset:2px}
          @media (max-width:1100px){.cp-grid{grid-template-columns:minmax(0,1fr) 320px;gap:28px}.cp-cond{grid-template-columns:repeat(2,minmax(0,1fr))}.cp-photos{grid-template-columns:repeat(4,minmax(0,1fr))}}
          @media (max-width:560px){.cp-2,.cp-3{grid-template-columns:minmax(0,1fr)}}
          @media (prefers-reduced-motion:reduce){.cp-spin{animation-duration:1.6s}}
        `}</style>

        {/* ── Top bar ── */}
        {isMobile ? (
          <motion.header
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, ease: EASE_OUT }}
            style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: `1px solid ${T.line}`, padding: 'calc(6px + env(safe-area-inset-top)) 8px 12px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 48 }}>
              <button type="button" onClick={() => navigate(-1)} aria-label="Back"
                style={{ width: 44, height: 44, border: 'none', background: 'none', color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {Icon.back()}
              </button>
              <h1 style={{ flexGrow: 1, margin: 0, fontSize: 17, fontWeight: 800 }}>List a bag</h1>
              <span style={{ padding: '0 12px', fontSize: 14, fontWeight: 700, color: T.accentInk }} aria-label={`${doneCount} of ${checklist.length} details added`}>
                {doneCount} of {checklist.length}
              </span>
            </div>
            <div style={{ margin: '4px 12px 0' }}>{progressBar(5)}</div>
          </motion.header>
        ) : (
          <motion.header
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, ease: EASE_OUT }}
            style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: `1px solid ${T.line}` }}
          >
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', gap: 36 }}>
              <a href="/products" onClick={e => { e.preventDefault(); navigate('/products'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: T.accent }}>
                <LogoIcon size={24} />
                <span style={{ fontSize: 21, fontWeight: 800, color: T.ink }}>Bag<span style={{ color: T.accent }}>Search</span></span>
              </a>
              <nav aria-label="Seller" style={{ display: 'flex', gap: 28, flexGrow: 1 }}>
                {[['Dashboard', '/seller-profile'], ['My listings', '/seller-listing']].map(([label, to]) => (
                  <a key={to} href={to} onClick={e => { e.preventDefault(); navigate(to); }} style={{ fontSize: 15, fontWeight: 600, color: T.ink2, textDecoration: 'none' }}>{label}</a>
                ))}
              </nav>
            </div>
          </motion.header>
        )}

        <input ref={fileInputRef} type="file" accept={ALLOWED_TYPES.join(',')} multiple style={{ display: 'none' }} onChange={handleImageChange} />

        <main style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '20px 16px 220px' : '40px 24px 96px' }}>
          {/* ── Page header ── */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
              <div>
                <motion.nav aria-label="Breadcrumb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ fontSize: 14, color: T.muted, marginBottom: 12 }}>
                  <a href="/seller-profile" onClick={e => { e.preventDefault(); navigate('/seller-profile'); }} style={{ color: T.muted }}>Dashboard</a> / <span style={{ color: T.ink }}>List a bag</span>
                </motion.nav>
                <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.12 }}
                  style={{ margin: 0, fontFamily: FONT_SERIF, fontWeight: 600, fontSize: 56, lineHeight: 1 }}>
                  List a bag
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.22 }}
                  style={{ margin: '10px 0 0', fontSize: 16, color: T.ink2 }}>
                  Buyers can find it by name, brand or photo as soon as you publish.
                </motion.p>
              </div>
              {!limitLoading && limit > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 999, background: T.surface, border: `1px solid ${T.line}`, fontSize: 14, color: T.ink2 }}>
                  <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: limitReached ? T.redInk : T.green }} />
                  {planName} plan · <b style={{ color: T.ink }}>{used} of {limit}</b> listings used today
                </motion.div>
              )}
            </div>
          )}
          {isMobile && !limitLoading && limit > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.ink2, marginBottom: 16 }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: limitReached ? T.redInk : T.green }} />
              {planName} plan · <b style={{ color: T.ink }}>{used} of {limit}</b> listings used today
            </div>
          )}

          <AnimatePresence>
            {limitReached && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 14, background: T.amberSoft, border: `1px solid ${T.amberLine}`, color: T.amberInk, fontSize: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                {Icon.alert(18)}
                <span style={{ flex: '1 1 240px' }}>You&apos;ve reached today&apos;s limit of {limit} listings on the {planName} plan.</span>
                <a href="/pricing" onClick={e => { e.preventDefault(); navigate('/pricing'); }} style={{ fontWeight: 700, color: T.amberInk }}>See plans</a>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate={false}>
            <div className={isMobile ? undefined : 'cp-grid'}>
              {/* ── FORM COLUMN ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24, minWidth: 0 }}>
                <AnimatePresence>
                  {error && (
                    <motion.div ref={errorRef} role="alert"
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0, x: reduce ? 0 : [0, -6, 6, -3, 3, 0] }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', borderRadius: 14, background: T.redSoft, color: T.redInk, fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>
                      <span style={{ flexShrink: 0, marginTop: 1 }}>{Icon.alert(18)}</span>
                      <span style={{ flexGrow: 1 }}>{error}</span>
                      <button type="button" onClick={() => setError(null)} aria-label="Dismiss" style={{ width: 32, height: 32, marginTop: -6, marginRight: -6, border: 'none', background: 'none', color: T.redInk, cursor: 'pointer', flexShrink: 0 }}>{Icon.close(12)}</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 1 — Photos */}
                <Section n={1} title="Photos" subtitle="The first photo is your cover. Use the star to change it." isMobile={isMobile}>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
                    onDrop={handleDrop}
                    style={{ position: 'relative', borderRadius: 16 }}
                  >
                    {images.length === 0 && !isMobile ? (
                      <motion.button type="button" onClick={() => fileInputRef.current?.click()}
                        animate={{ scale: dragOver ? 1.01 : 1, borderColor: dragOver ? T.accent : T.lineStrong, backgroundColor: dragOver ? T.accentSoft : T.bg }}
                        whileHover={{ borderColor: T.accent }}
                        style={{ width: '100%', padding: '44px 20px', borderRadius: 16, border: '2px dashed', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, font: `500 15px ${FONT_SANS}`, color: T.ink2 }}>
                        <motion.span animate={reduce ? undefined : { y: dragOver ? -6 : [0, -4, 0] }} transition={dragOver ? { duration: 0.2 } : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                          style={{ width: 56, height: 56, borderRadius: '50%', background: T.accentSoft, color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {Icon.camera(26)}
                        </motion.span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>{dragOver ? 'Drop to add' : 'Drag photos here or browse'}</span>
                        <span style={{ fontSize: 13, color: T.muted }}>Front, back, inside and any serial number or tag</span>
                      </motion.button>
                    ) : (
                      <div className={isMobile ? undefined : 'cp-photos'}
                        style={isMobile ? { display: 'flex', gap: 10, overflowX: 'auto', margin: '0 -20px', padding: '2px 20px 4px', scrollSnapType: 'x proximity' } : undefined}>
                        {isMobile && addTile}
                        <AnimatePresence initial={false}>
                          {images.map(photoTile)}
                        </AnimatePresence>
                        {!isMobile && addTile}
                      </div>
                    )}
                    <AnimatePresence>
                      {dragOver && images.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ position: 'absolute', inset: -6, borderRadius: 18, border: `2px dashed ${T.accent}`, background: 'rgba(246,230,218,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: T.accentInk, pointerEvents: 'none' }}>
                          Drop to add
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
                      JPG, PNG or WEBP · up to 5 MB each · {images.length} of {MAX_PHOTOS} added
                      {isMobile && images.length > 1 ? ' · tap Cover to change your cover photo' : ''}
                    </p>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.green, fontWeight: 600 }}>
                      {Icon.search(16)} Bright, clear photos show up better in photo search
                    </span>
                  </div>
                </Section>

                {/* 2 — About the bag */}
                <Section n={2} title="About the bag" subtitle="What buyers search for." isMobile={isMobile}>
                  <Field label="Bag name" htmlFor="cp-name">
                    <input id="cp-name" name="name" className="cp-input" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Chanel Classic Flap Caviar" autoComplete="off" />
                  </Field>
                  <div className="cp-2">
                    <Field label="Brand" htmlFor="cp-brand">
                      <select id="cp-brand" name="brand" className="cp-input" value={formData.brand} onChange={handleInputChange} required style={{ color: formData.brand ? T.ink : T.muted }}>
                        <option value="">Select a brand</option>
                        {BRANDS.map(b => <option key={b}>{b}</option>)}
                      </select>
                    </Field>
                    <Field label="Category" htmlFor="cp-category">
                      <select id="cp-category" name="category" className="cp-input" value={formData.category} onChange={handleInputChange} required style={{ color: formData.category ? T.ink : T.muted }}>
                        <option value="">Select a category</option>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Condition">
                    <div role="radiogroup" aria-label="Condition" className={isMobile ? undefined : 'cp-cond'} style={isMobile ? { display: 'flex', flexDirection: 'column', gap: 8 } : undefined}>
                      {CONDITIONS.map(c => {
                        const on = formData.condition === c.value;
                        return (
                          <motion.button key={c.value} type="button" role="radio" aria-checked={on} onClick={() => set({ condition: c.value })}
                            whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                            style={{
                              position: 'relative', minHeight: isMobile ? 60 : 84, padding: isMobile ? '12px 14px' : 14, borderRadius: 14,
                              border: `1.5px solid ${on ? 'transparent' : T.line}`, background: on ? T.accentSoft : T.surface,
                              textAlign: 'left', cursor: 'pointer', color: T.ink, font: `500 14px ${FONT_SANS}`,
                              display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: isMobile ? 'center' : 'flex-start', gap: isMobile ? 12 : 4,
                              transition: 'background .25s',
                            }}>
                            {on && (
                              <motion.span layoutId={reduce ? undefined : 'cp-cond-ring'} aria-hidden="true"
                                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                                style={{ position: 'absolute', inset: 0, borderRadius: 14, border: `1.5px solid ${T.accent}`, boxShadow: '0 0 0 3px rgba(180,65,14,.12)', pointerEvents: 'none' }} />
                            )}
                            {isMobile && (
                              <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, boxSizing: 'border-box', border: on ? `6px solid ${T.accent}` : `2px solid ${T.lineStrong}`, background: '#fff', transition: 'border .2s' }} />
                            )}
                            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 15, fontWeight: 800 }}>{c.title}</span>
                              <span style={{ fontSize: isMobile ? 13 : 12, color: T.muted, lineHeight: 1.4 }}>{c.hint}</span>
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </Field>
                  <Field label={<>Colours <span style={{ fontWeight: 500, color: T.muted }}>· {selectedColors.length ? BAG_COLORS.filter(c => selectedColors.includes(c.id)).map(c => c.label).join(', ') : 'pick all that apply'}</span></>}>
                    <motion.div layout={!reduce} style={isMobile
                      ? { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8, justifyItems: 'center' }
                      : { display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      <AnimatePresence initial={false}>
                        {(showAllColours ? BAG_COLORS : BAG_COLORS.slice(0, COLOURS_COLLAPSED)).map((c, i) => {
                          const on = selectedColors.includes(c.id);
                          const gradient = c.hex.startsWith('linear');
                          return (
                            <motion.button key={c.id} type="button" onClick={() => toggleColor(c.id)} aria-pressed={on} aria-label={c.label} title={c.label}
                              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
                              transition={{ duration: 0.25, delay: i >= COLOURS_COLLAPSED ? (i - COLOURS_COLLAPSED) * 0.02 : 0 }}
                              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                              style={{
                                width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', padding: 0,
                                background: c.hex, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: on ? '2px solid #fff' : `1.5px solid ${c.border || T.lineStrong}`,
                                boxShadow: on ? `0 0 0 2.5px ${T.ink}` : 'none', transition: 'box-shadow .2s, border .2s',
                              }}>
                              <AnimatePresence>
                                {on && (
                                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 26 }} style={{ display: 'flex', filter: gradient ? 'drop-shadow(0 1px 2px rgba(0,0,0,.5))' : undefined }}>
                                    <DrawnTick size={isMobile ? 16 : 18} color={!gradient && isLightHex(c.hex) ? T.ink : '#fff'} />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </motion.button>
                          );
                        })}
                      </AnimatePresence>
                    </motion.div>
                    {BAG_COLORS.length > COLOURS_COLLAPSED && (
                      <button type="button" onClick={() => setShowAllColours(v => !v)} aria-expanded={showAllColours}
                        style={{ alignSelf: 'flex-start', minHeight: 44, padding: '0 2px', border: 'none', background: 'none', font: `700 14px ${FONT_SANS}`, color: T.accentInk, cursor: 'pointer' }}>
                        {showAllColours ? 'Show fewer colours' : `Show all ${BAG_COLORS.length} colours`}
                      </button>
                    )}
                  </Field>
                </Section>

                {/* 3 — Price and stock */}
                <Section n={3} title="Price and stock" subtitle="Buyers pay into escrow. You're paid once they confirm delivery." isMobile={isMobile}>
                  <div className="cp-2">
                    <Field label="Price" htmlFor="cp-price" hint={isMobile ? "Buyers pay into escrow. You're paid once they confirm delivery." : undefined}>
                      <div style={{ position: 'relative' }}>
                        <span aria-hidden="true" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: formData.price ? T.ink : T.muted }}>₦</span>
                        <input id="cp-price" name="price" className="cp-input" inputMode="numeric" required placeholder="e.g. 45,000"
                          value={formData.price ? formatNaira(formData.price) : ''}
                          onChange={e => { const raw = e.target.value.replace(/,/g, ''); if (/^\d*$/.test(raw)) set({ price: raw }); }}
                          style={{ paddingLeft: 36, fontWeight: 700 }} />
                      </div>
                    </Field>
                    <Field label="Quantity in stock" htmlFor="cp-qty">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <motion.button type="button" whileTap={{ scale: 0.9 }} aria-label="Decrease quantity"
                          disabled={(parseInt(formData.quantity) || 1) <= 1}
                          onClick={() => set({ quantity: String(Math.max(1, (parseInt(formData.quantity) || 1) - 1)) })}
                          style={{ width: 50, height: 50, flexShrink: 0, border: `1.5px solid ${T.line}`, borderRadius: 12, background: T.surface, font: `700 20px ${FONT_SANS}`, color: T.ink, cursor: 'pointer', opacity: (parseInt(formData.quantity) || 1) <= 1 ? 0.4 : 1 }}>−</motion.button>
                        <input id="cp-qty" className="cp-input" type="number" min="1" inputMode="numeric" value={formData.quantity}
                          onChange={e => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) set({ quantity: v }); }}
                          onBlur={e => { const v = parseInt(e.target.value); if (!v || v < 1) set({ quantity: '1' }); }}
                          style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, padding: 0, MozAppearance: 'textfield' }} />
                        <motion.button type="button" whileTap={{ scale: 0.9 }} aria-label="Increase quantity"
                          onClick={() => set({ quantity: String((parseInt(formData.quantity) || 0) + 1) })}
                          style={{ width: 50, height: 50, flexShrink: 0, border: `1.5px solid ${T.line}`, borderRadius: 12, background: T.surface, font: `700 20px ${FONT_SANS}`, color: T.ink, cursor: 'pointer' }}>+</motion.button>
                      </div>
                    </Field>
                  </div>

                  <div style={{ border: `1px solid ${formData.discountEnabled ? T.lineStrong : T.line}`, borderRadius: 16, overflow: 'hidden', transition: 'border-color .3s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: T.bg }}>
                      <div style={{ flexGrow: 1 }}>
                        <div id="cp-discount-label" style={{ fontSize: 15, fontWeight: 800 }}>Offer a discount</div>
                        <div style={{ fontSize: 13, color: T.muted }}>Discounted bags get a Sale tag in the shop.</div>
                      </div>
                      <button type="button" role="switch" aria-checked={formData.discountEnabled} aria-labelledby="cp-discount-label"
                        onClick={() => set({ discountEnabled: !formData.discountEnabled })}
                        style={{ width: 52, height: 30, flexShrink: 0, borderRadius: 15, border: 'none', padding: 3, cursor: 'pointer', display: 'flex', justifyContent: formData.discountEnabled ? 'flex-end' : 'flex-start', background: formData.discountEnabled ? T.accent : T.lineStrong, transition: 'background .25s' }}>
                        <motion.span layout={!reduce} transition={{ type: 'spring', stiffness: 600, damping: 32 }}
                          style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
                      </button>
                    </div>
                    <AnimatePresence initial={false}>
                      {formData.discountEnabled && (
                        <motion.div key="discount"
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: EASE_OUT }} style={{ overflow: 'hidden' }}>
                          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16, borderTop: `1px solid ${T.line}` }}>
                            <div className="cp-3">
                              <Field label="Type">
                                <div style={{ display: 'flex', padding: 4, background: T.sand, borderRadius: 12, height: 50, boxSizing: 'border-box' }}>
                                  {[['percentage', '% off'], ['fixed', '₦ off']].map(([val, label]) => {
                                    const on = formData.discountType === val;
                                    return (
                                      <button key={val} type="button" aria-pressed={on} onClick={() => set({ discountType: val, discountValue: '' })}
                                        style={{ position: 'relative', flex: 1, border: 'none', borderRadius: 9, background: 'transparent', cursor: 'pointer', font: `700 14px ${FONT_SANS}`, color: on ? T.ink : T.muted }}>
                                        {on && <motion.span layoutId={reduce ? undefined : 'cp-disc-pill'} transition={{ type: 'spring', stiffness: 500, damping: 36 }} style={{ position: 'absolute', inset: 0, borderRadius: 9, background: '#fff', boxShadow: '0 1px 3px rgba(28,20,16,.12)' }} />}
                                        <span style={{ position: 'relative' }}>{label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </Field>
                              <Field label={formData.discountType === 'percentage' ? 'Percent off' : 'Amount off'} htmlFor="cp-dv">
                                <div style={{ position: 'relative' }}>
                                  <span aria-hidden="true" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: T.muted }}>{formData.discountType === 'percentage' ? '%' : '₦'}</span>
                                  <input id="cp-dv" name="discountValue" className="cp-input" type="number" min="1" max={formData.discountType === 'percentage' ? 99 : undefined} inputMode="numeric"
                                    value={formData.discountValue} onChange={handleInputChange} placeholder={formData.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 5000'} style={{ paddingLeft: 34 }} />
                                </div>
                              </Field>
                              <Field label="Label" optional htmlFor="cp-dl">
                                <input id="cp-dl" name="discountLabel" className="cp-input" value={formData.discountLabel} onChange={handleInputChange} placeholder="e.g. Weekend deal" />
                              </Field>
                            </div>
                            {formData.discountType === 'percentage' && (
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {[5, 10, 15, 20, 25, 30, 50].map(pct => {
                                  const on = formData.discountValue === String(pct);
                                  return (
                                    <motion.button key={pct} type="button" className="cp-chip" whileTap={{ scale: 0.94 }} aria-pressed={on}
                                      onClick={() => set({ discountValue: String(pct) })}
                                      style={{ minHeight: 36, padding: '0 14px', borderRadius: 999, cursor: 'pointer', font: `700 13px ${FONT_SANS}`, border: `1.5px solid ${on ? T.accent : T.line}`, background: on ? T.accent : T.surface, color: on ? '#fff' : T.ink2 }}>
                                      {pct}% off
                                    </motion.button>
                                  );
                                })}
                              </div>
                            )}
                            {priceSummary}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Section>

                {/* 4 — Location and contact */}
                <Section n={4} title="Location and contact" subtitle="Buyers near you see your bag first." isMobile={isMobile}>
                  <div className="cp-2">
                    <Field label="City" htmlFor="cp-location">
                      <select id="cp-location" name="location" className="cp-input" value={formData.location} onChange={handleInputChange} required style={{ color: formData.location ? T.ink : T.muted }}>
                        <option value="">Select your city</option>
                        {LOCATIONS_BY_STATE.map(([state, locs]) => (
                          <optgroup key={state} label={state}>
                            {locs.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </Field>
                    <Field label="WhatsApp number" htmlFor="cp-wa" hint="Buyers message you here before they buy.">
                      <div style={{ position: 'relative' }}>
                        <span aria-hidden="true" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: formData.whatsapp ? '#1D7044' : T.muted, transition: 'color .25s' }}>{Icon.whatsapp(18)}</span>
                        <input id="cp-wa" name="whatsapp" className="cp-input" type="tel" autoComplete="tel" value={formData.whatsapp} onChange={handleInputChange} required placeholder="0801 234 5678" style={{ paddingLeft: 42 }} />
                      </div>
                      <AnimatePresence>
                        {formData.whatsapp && normalizeWhatsAppNumber(formData.whatsapp) && (
                          <motion.a initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            href={`https://wa.me/${normalizeWhatsAppNumber(formData.whatsapp)}`} target="_blank" rel="noopener noreferrer"
                            style={{ alignSelf: 'flex-start', fontSize: 13, fontWeight: 700, color: T.accentInk }}>
                            Test your WhatsApp link
                          </motion.a>
                        )}
                      </AnimatePresence>
                    </Field>
                  </div>
                </Section>

                {/* 5 — Description */}
                <Section n={5} title="Description" optional subtitle="Honest details build trust and cut down on questions." isMobile={isMobile}>
                  <Field label="Describe the bag" htmlFor="cp-desc">
                    <textarea id="cp-desc" name="description" className="cp-input" maxLength={1000} value={formData.description} onChange={handleInputChange}
                      placeholder="Wear and tear, material, what's included (dust bag, card, box), any flaws…" />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {QUICK_DETAILS.map(text => {
                          const added = formData.description.toLowerCase().includes(text.toLowerCase());
                          return (
                            <motion.button key={text} type="button" className="cp-chip" disabled={added} whileTap={{ scale: 0.95 }} onClick={() => addDetail(text)}
                              style={{ minHeight: 36, padding: '0 12px', borderRadius: 999, border: 'none', background: added ? T.greenSoft : T.sand, color: added ? T.green : T.ink2, font: `600 13px ${FONT_SANS}`, cursor: added ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                              {added ? <DrawnTick size={14} color={T.green} /> : '+'} {text}
                            </motion.button>
                          );
                        })}
                      </div>
                      <span style={{ fontSize: 12, color: T.muted, whiteSpace: 'nowrap', paddingTop: 10 }}>{formData.description.length}/1000</span>
                    </div>
                  </Field>
                </Section>

                {isMobile && (
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: T.muted, textAlign: 'center' }}>{readyText}</p>
                )}
              </div>

              {/* ── PREVIEW + CHECKLIST (desktop) ── */}
              {!isMobile && (
                <motion.aside
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.25 }}
                  style={{ position: 'sticky', top: 96, display: 'flex', flexDirection: 'column', gap: 20 }}
                  aria-label="Listing preview"
                >
                  <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 20, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', color: T.muted }}>SHOP PREVIEW</span>
                      <span style={{ fontSize: 12, color: T.muted }}>Updates as you type</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: 128, height: 160, flexShrink: 0, borderRadius: 14, background: T.photo, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A8927F' }}>
                      <AnimatePresence mode="popLayout" initial={false}>
                        {images[0] ? (
                          <motion.img key={images[0].id} src={images[0].preview} alt=""
                            initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE_OUT }}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <motion.span key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{Icon.bag(48)}</motion.span>
                        )}
                      </AnimatePresence>
                      <AnimatePresence>
                        {discountShown && (
                          <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                            style={{ position: 'absolute', left: 8, top: 8, maxWidth: 'calc(100% - 16px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '4px 9px', borderRadius: 999, background: T.accent, color: '#fff', fontSize: 11, fontWeight: 800 }}>
                            {formData.discountLabel || 'Sale'}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <div style={{ minWidth: 0, flexGrow: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: T.muted }}>{(formData.brand || 'Brand').toUpperCase()}</div>
                      <div style={{ fontSize: 16, margin: '4px 0 8px', lineHeight: 1.35, color: formData.name ? T.ink : T.muted, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{formData.name || 'Your bag name'}</div>
                      <div style={{ fontSize: 20, fontWeight: 800 }}>{buyerPays > 0 ? <CountUp value={buyerPays} format={naira} duration={0.6} /> : '₦—'}</div>
                      {discountShown && <div style={{ fontSize: 14, color: T.muted, textDecoration: 'line-through' }}>{naira(rawPrice)}</div>}
                      {locationLabel && <div style={{ fontSize: 13, color: T.muted, marginTop: 6 }}>{locationLabel}</div>}
                    </div>
                    </div>
                  </div>

                  <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 20, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 16, fontWeight: 800 }}>Ready to publish</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.accentInk }}>{doneCount} of {checklist.length}</span>
                    </div>
                    {progressBar(6)}
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px 12px' }}>
                      {checklist.map(item => (
                        <li key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: item.done ? T.ink : T.muted }}>
                          <span style={{ position: 'relative', width: 18, height: 18, flexShrink: 0 }}>
                            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${T.lineStrong}` }} />
                            <AnimatePresence>
                              {item.done && (
                                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                                  style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <DrawnTick size={12} delay={0.08} />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </span>
                          {item.label}<span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{item.done ? ' done' : ' not done'}</span>
                        </li>
                      ))}
                    </ul>
                    {publishButton(56)}
                    <p style={{ margin: 0, fontSize: 13, color: T.muted, textAlign: 'center', lineHeight: 1.5 }}>{readyText}</p>
                  </div>
                </motion.aside>
              )}
            </div>

            {/* ── Sticky publish bar (mobile) — sits just above the bottom nav ── */}
            {isMobile && (
              <motion.div
                initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.3 }}
                style={{
                  position: 'fixed', left: 12, right: 12, bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', zIndex: 45,
                  background: T.surface, border: `1px solid ${T.line}`, borderRadius: 18, padding: 10,
                  display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 12px 32px rgba(28,20,16,.16)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, paddingLeft: 6 }}>
                  <span style={{ fontSize: 12, color: T.muted }}>Buyers pay</span>
                  <span style={{ fontSize: 18, fontWeight: 800, whiteSpace: 'nowrap' }}>{buyerPays > 0 ? <CountUp value={buyerPays} format={naira} duration={0.6} /> : '₦—'}</span>
                </div>
                <div style={{ flexGrow: 1, minWidth: 0 }}>{publishButton(52)}</div>
              </motion.div>
            )}
          </form>
        </main>
      </div>
    </MotionConfig>
  );
}
