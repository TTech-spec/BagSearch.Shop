import { useState, useEffect, useRef, useContext } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import LogoIcon from './components/Logo.jsx';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';
import { useCart } from './context/CartContext';
import { buildWhatsAppUrl, normalizeWhatsAppNumber } from './utils/whatsapp';
import { useSEO, SITE_URL } from './hooks/useSEO';
import { useIsMobileViewport } from './hooks/useIsMobileViewport';
import { slugify, extractIdFromParam, productPath } from './utils/slugify';
import { triggerGoogleReviewSurvey } from './components/GoogleCustomerReviews';
import { payForProduct, useFlutterwavePreload, getSellerSubaccountId } from './components/FlutterwavePayment';
import { getOptimizedImageUrl, IMG_SIZES } from './utils/imageUtils';
import ProductGallery from './components/products/ProductGallery.jsx';
import CountUp from './components/ui/CountUp.jsx';
import { T, FONT_SANS, FONT_SERIF, EASE_OUT, naira } from './theme/luxe';
import { sellerPath } from './utils/sellerPath';

// ─── Bag Color Map ─────────────────────────────────────────────────────────────
const BAG_COLOR_MAP = {
  black:'#1A1A1A',white:'#F5F5F0',beige:'#D4B896',camel:'#C19A6B',tan:'#A67C52',
  brown:'#6B3F2A',burgundy:'#722F37',red:'#CC2200',pink:'#E8A0A0',blush:'#F2C4B8',
  orange:'#E8762B',yellow:'#E8C84A',olive:'#808000',green:'#2D6A3F',mint:'#98D8C8',
  teal:'#2A7A7A',navy:'#1A2E5A',blue:'#2255CC',cobalt:'#0047AB',purple:'#6A2D8F',
  lavender:'#B8A0D8',grey:'#888888',silver:'#C0C0C0',gold:'#CFB53B',
  multicolor:'linear-gradient(135deg,#C94B2C,#E8856A,#F9DDD0,#2255CC,#2D6A3F)',
};

const titleCase = (s) => String(s).trim().replace(/[-_]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

// Turns the stored colours (names, hex codes or {id,hex} objects) into swatches.
const parseColors = (raw) => {
  try {
    if (!raw || (Array.isArray(raw) && raw.length === 0)) return [];
    const arr = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : [raw]);
    return arr.map((c) => {
      if (typeof c === 'string') {
        const isCode = c.startsWith('#') || c.startsWith('rgb') || c.startsWith('linear');
        return { name: isCode ? null : titleCase(c), value: isCode ? c : (BAG_COLOR_MAP[c.toLowerCase().trim()] || c) };
      }
      const id = String(c?.id || c?.name || '');
      return { name: c?.name || c?.label || (id ? titleCase(id) : null), value: c?.hex || BAG_COLOR_MAP[id.toLowerCase()] || T.ink2 };
    });
  } catch { return []; }
};

// Where did this view come from? Used by the seller dashboard's "How buyers find you".
const detectViewSource = (locationKey) => {
  try {
    const raw = sessionStorage.getItem('bs_search_source');
    if (raw) {
      const { type, at } = JSON.parse(raw);
      if (type === 'visual' && Date.now() - at < 30 * 60 * 1000) return 'visual';
    }
  } catch { /* storage blocked */ }
  // Landing straight on a product page means a shared link or a search engine.
  if (locationKey === 'default') return 'referral';
  return 'direct';
};

const WaIcon = ({ size = 18, color = T.green }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const BagIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8h12l1 12H5L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
);
const LockIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
);
const ShieldIcon = ({ size = 18, color = T.green }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>
);
const VerifiedIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Verified seller" role="img">
    <path fill={T.green} d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9L3.2 15.8l1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z" />
    <path d="M8 12.2l2.7 2.6L16 9.6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const StarIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={T.accent} aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>
);
const PinIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);

// ─── Motion presets ───────────────────────────────────────────────────────────
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } } };
const rise = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } } };

const PAGE_CSS = `
  .pd-root *, .pd-root *::before, .pd-root *::after { box-sizing: border-box; }
  .pd-root h1, .pd-root h2, .pd-root h3, .pd-root p { margin: 0; }
  .pd-root button { font-family: inherit; }
  .pd-root a { color: ${T.accentInk}; }
  .pd-root :focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; border-radius: 6px; }
  @keyframes pdShimmer { 0% { background-position: -400px 0 } 100% { background-position: 400px 0 } }
  @keyframes pdSpin { to { transform: rotate(360deg) } }
  .pd-skel { background: linear-gradient(90deg, ${T.sand} 0px, #F8F2EB 160px, ${T.sand} 320px); background-size: 800px 100%; animation: pdShimmer 1.3s linear infinite; border-radius: 12px; }
  .pd-shine { position: absolute; inset: 0; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%); transform: translateX(-120%); transition: transform 0.7s cubic-bezier(0.22,1,0.36,1); pointer-events: none; }
  .pd-cta:hover .pd-shine { transform: translateX(120%); }
  .pd-card-img { transition: transform 0.6s cubic-bezier(0.22,1,0.36,1); }
  .pd-card:hover .pd-card-img { transform: scale(1.06); }
  .pd-nav-link { position: relative; text-decoration: none; }
  .pd-nav-link::after { content: ''; position: absolute; left: 0; right: 0; bottom: -6px; height: 2px; background: ${T.accent}; transform: scaleX(0); transform-origin: left; transition: transform 0.3s cubic-bezier(0.22,1,0.36,1); }
  .pd-nav-link:hover::after { transform: scaleX(1); }
  @media (prefers-reduced-motion: reduce) { .pd-skel { animation: none; } .pd-shine { display: none; } }
`;

function NetworkLoader({ onRetry }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(250,246,241,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 300, gap: 18, fontFamily: FONT_SANS }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${T.line}`, borderTopColor: T.accent, animation: 'pdSpin 1s linear infinite' }} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: T.ink, marginBottom: 4 }}>No connection</p>
        <p style={{ fontSize: 14, color: T.ink2 }}>Check your network and try again.</p>
      </div>
      <button type="button" onClick={onRetry} style={{ height: 44, padding: '0 24px', borderRadius: 999, border: 'none', cursor: 'pointer', background: T.ink, color: '#fff', fontWeight: 800, fontSize: 14 }}>Retry</button>
    </motion.div>
  );
}

function LoadingSkeleton({ isMobile }) {
  return (
    <div className="pd-root" style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT_SANS }}>
      <style>{PAGE_CSS}</style>
      <div role="status" aria-label="Loading product" style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? 0 : '96px 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1.15fr) minmax(0,1fr)', gap: isMobile ? 20 : 64 }}>
        <div className="pd-skel" style={{ aspectRatio: '4 / 5', borderRadius: isMobile ? 0 : 18 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: isMobile ? '0 20px' : 0 }}>
          <div className="pd-skel" style={{ width: 140, height: 14 }} />
          <div className="pd-skel" style={{ width: '90%', height: 44 }} />
          <div className="pd-skel" style={{ width: '60%', height: 44 }} />
          <div className="pd-skel" style={{ width: 180, height: 36, marginTop: 12 }} />
          <div className="pd-skel" style={{ width: '100%', height: 56, marginTop: 24 }} />
          <div className="pd-skel" style={{ width: '100%', height: 96 }} />
        </div>
      </div>
    </div>
  );
}

function Accordion({ id, title, open, onToggle, children }) {
  return (
    <div style={{ borderBottom: `1px solid ${T.line}` }}>
      <h3 style={{ margin: 0 }}>
        <button type="button" id={`${id}-btn`} aria-expanded={open} aria-controls={`${id}-panel`} onClick={onToggle}
          style={{ width: '100%', minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: '16px 0', cursor: 'pointer', color: T.ink, fontSize: 15, fontWeight: 800, textAlign: 'left' }}>
          {title}
          <motion.svg animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.3, ease: EASE_OUT }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></motion.svg>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={`${id}-panel`} role="region" aria-labelledby={`${id}-btn`}
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }} style={{ overflow: 'hidden' }}>
            <div style={{ paddingBottom: 18, fontSize: 15, lineHeight: 1.7, color: T.ink2 }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QtyStepper({ quantity, setQuantity, max }) {
  const btn = { width: 48, height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 20, color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 56, borderRadius: 12, border: `1px solid ${T.lineStrong}`, background: T.surface, flexShrink: 0 }}>
      <motion.button type="button" whileTap={{ scale: 0.85 }} aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ ...btn, opacity: quantity <= 1 ? 0.35 : 1 }}>−</motion.button>
      <span aria-live="polite" style={{ width: 32, textAlign: 'center', fontWeight: 800, fontSize: 16, overflow: 'hidden', height: 24, position: 'relative' }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={quantity} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={{ duration: 0.2 }} style={{ display: 'block' }}>{quantity}</motion.span>
        </AnimatePresence>
      </span>
      <motion.button type="button" whileTap={{ scale: 0.85 }} aria-label="Increase quantity" disabled={quantity >= max} onClick={() => setQuantity(q => Math.min(max, q + 1))} style={{ ...btn, opacity: quantity >= max ? 0.35 : 1 }}>+</motion.button>
    </div>
  );
}

function AddToCartLabel({ added }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {added ? (
        <motion.span key="added" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.05 }} />
          </svg>
          Added to cart
        </motion.span>
      ) : (
        <motion.span key="add" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BagIcon /> Add to cart
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function SimilarCard({ p, index, navigate }) {
  return (
    <motion.a href={productPath(p.name, p.id)} className="pd-card"
      onClick={(e) => { e.preventDefault(); navigate(productPath(p.name, p.id)); }}
      initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: (index % 4) * 0.08, ease: EASE_OUT }}
      whileHover={{ y: -6 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12, textDecoration: 'none', color: T.ink }}>
      <div style={{ position: 'relative', aspectRatio: '4 / 5', borderRadius: 14, overflow: 'hidden', background: T.photo }}>
        <img className="pd-card-img" src={getOptimizedImageUrl(p.images?.[0], IMG_SIZES.card.width, IMG_SIZES.card.height)} alt={`${p.brand || ''} ${p.name}`} loading="lazy" width="400" height="500"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {p.discountedPrice && (
          <span style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 999, background: T.accent, color: '#fff', fontSize: 11, fontWeight: 800 }}>Sale</span>
        )}
      </div>
      <div>
        {p.brand && <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.muted }}>{p.brand}</div>}
        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>{naira(p.discountedPrice ?? p.rawPrice)}</span>
          {p.discountedPrice && <span style={{ fontSize: 13, color: T.muted, textDecoration: 'line-through' }}>{naira(p.rawPrice)}</span>}
        </div>
      </div>
    </motion.a>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { addToCart, cartCount } = useCart();
  const isMobile = useIsMobileViewport(900);
  const hasBottomNav = useIsMobileViewport(768); // MobileBottomNav shows at this width

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartAdded, setCartAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [sellerInfo, setSellerInfo] = useState({ verified: false, rating: null, reviewCount: 0, listingCount: null, profileSlug: null });
  const [openSection, setOpenSection] = useState('description');
  const [toast, setToast] = useState('');
  const viewLoggedRef = useRef(null);
  useFlutterwavePreload();

  useEffect(() => { fetchProduct(); window.scrollTo(0, 0); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!product?.id || product.isMock) return;
    if (viewLoggedRef.current === product.id) return;
    viewLoggedRef.current = product.id;
    (async () => {
      try {
        const { error } = await supabase.from('product_views').insert({
          product_id: product.id,
          buyer_id: user?.id || null,
          buyer_name: user?.user_metadata?.full_name || user?.email || null,
          buyer_email: user?.email || null,
          source: detectViewSource(location.key),
        }, { returning: 'minimal' });
        if (error) console.error('Product view insert error:', error.message);
      } catch (err) {
        console.error('Failed to log product view:', err);
      }
    })();
  }, [product?.id, product?.isMock, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSellerInfo = async (sellerId) => {
    if (!sellerId) return;
    const [rev, ver, cnt, usr] = await Promise.allSettled([
      supabase.from('seller_reviews').select('rating').eq('seller_id', sellerId),
      supabase.from('seller_verifications').select('status').eq('seller_id', sellerId).maybeSingle(),
      supabase.from('products').select('id', { count: 'exact', head: true }).or(`user_id.eq.${sellerId},seller_id.eq.${sellerId}`),
      supabase.from('users').select('profile_slug').eq('user_id', sellerId).maybeSingle(),
    ]);
    const ratings = rev.status === 'fulfilled' && !rev.value.error ? (rev.value.data || []).map(r => Number(r.rating)).filter(Boolean) : [];
    setSellerInfo({
      verified: ver.status === 'fulfilled' && ver.value.data?.status === 'approved',
      rating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      reviewCount: ratings.length,
      listingCount: cnt.status === 'fulfilled' && !cnt.value.error ? cnt.value.count : null,
      profileSlug: usr.status === 'fulfilled' ? usr.value.data?.profile_slug || null : null,
    });
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);

      // Support both plain UUID and slug-based params (name--shortId)
      const resolvedId = extractIdFromParam(id);
      const isShortSlugId = resolvedId && resolvedId.length === 8 && resolvedId !== id;

      let data = null;
      let error = null;

      if (isShortSlugId) {
        const response = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);

        error = response.error;
        data = (response.data || []).find((item) => String(item.id || '').startsWith(resolvedId)) || null;

        if (!error && !data) {
          error = { message: `No product found for short id prefix "${resolvedId}"`, code: 'PGRST116' };
        }
      } else {
        const response = await supabase
          .from('products')
          .select('*')
          .eq('id', resolvedId)
          .single();

        data = response.data;
        error = response.error;
      }

      if (error) throw error;
      if (data) {
        // Redirect to canonical SEO-friendly URL if not already there
        const canonicalPath = productPath(data.name, data.id);
        if (window.location.pathname !== canonicalPath) {
          window.history.replaceState(null, '', canonicalPath);
        }

        const rawPrice = parseFloat(data.price || 0) || 0;
        const disc = data.discounted_price != null ? parseFloat(data.discounted_price) : null;
        const discountedPrice = disc != null && disc > 0 && disc < rawPrice ? disc : null;

        const fmt = {
          id: data.id,
          name: data.name || 'Untitled Product',
          brand: data.brand || '',
          seller: data.seller_name || 'BagSearch seller',
          sellerId: data.seller_id || data.user_id || '',
          sellerPhone: data.whatsapp || '',
          sellerLocation: data.location || '',
          description: data.description || '',
          quantity: data.quantity != null ? parseInt(data.quantity) : null,
          colors: parseColors(data.colors),
          category: data.category || 'Bags',
          condition: data.condition || '',
          images: data.images?.length > 0 ? data.images : ['https://via.placeholder.com/600'],
          isMock: false,
          rawPrice,
          discountedPrice,
          effectivePrice: discountedPrice ?? rawPrice,
          rawId: data.id,
          slug: slugify(data.name),
          whatsapp: data.whatsapp || '',
          user_id: data.user_id || data.seller_id || null,
          seller_id: data.seller_id || data.user_id || null,
        };
        setProduct(fmt);
        setSelectedColor(0);
        setQuantity(1);
        setOpenSection('description');

        fetchSellerInfo(fmt.sellerId);
        await fetchSimilarProducts(data);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setNetworkError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarProducts = async (currentProduct) => {
    try {
      const { data: similarData, error } = await supabase
        .from('products')
        .select('*')
        .or(`category.eq.${currentProduct.category},brand.eq.${currentProduct.brand}`)
        .neq('id', currentProduct.id)
        .limit(8);

      if (error) {
        console.error('Error fetching similar products:', error);
        return;
      }

      setSimilarProducts((similarData || []).map(p => {
        const raw = parseFloat(p.price || 0) || 0;
        const d = p.discounted_price != null ? parseFloat(p.discounted_price) : null;
        return {
          id: p.id,
          name: p.name || 'Untitled Product',
          brand: p.brand || '',
          rawPrice: raw,
          discountedPrice: d != null && d > 0 && d < raw ? d : null,
          images: p.images?.length > 0 ? p.images : ['https://via.placeholder.com/600'],
        };
      }));
    } catch (err) {
      console.error('Error fetching similar products:', err);
    }
  };

  useEffect(() => {
    const goOffline = () => setNetworkError(true);
    const goOnline = () => setNetworkError(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    if (!navigator.onLine) setNetworkError(true);
    return () => { window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // ── SEO: dynamic meta tags, OG, Twitter Card, JSON-LD ──────────────────────
  const seoKeywords = product
    ? [
        product.brand,
        product.category,
        product.name,
        'luxury bag Nigeria',
        'authentic designer bag',
        product.brand && 'buy ' + product.brand + ' bag',
        product.category + ' Nigeria',
      ]
        .filter(Boolean)
        .join(', ')
    : 'luxury bags Nigeria, designer handbags';

  const seoDescription = product
    ? `Buy ${product.brand ? product.brand + ' ' : ''}${product.name}. ${product.description?.slice(0, 120) || ''} Available on BagSearch Nigeria.`
    : 'Discover authentic luxury designer bags on BagSearch Nigeria.';

  const seoSchema = product
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Product',
            '@id': `${SITE_URL}${productPath(product.name, product.rawId)}#product`,
            name: product.name,
            description: product.description || product.name,
            image: product.images,
            sku: product.rawId,
            ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
            offers: {
              '@type': 'Offer',
              priceCurrency: 'NGN',
              price: product.effectivePrice,
              priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              availability: product.quantity === 0
                ? 'https://schema.org/OutOfStock'
                : product.quantity != null && product.quantity < 3
                ? 'https://schema.org/LimitedAvailability'
                : 'https://schema.org/InStock',
              itemCondition: product.condition?.toLowerCase().includes('new')
                ? 'https://schema.org/NewCondition'
                : product.condition?.toLowerCase().includes('refurb')
                ? 'https://schema.org/RefurbishedCondition'
                : 'https://schema.org/UsedCondition',
              url: `${SITE_URL}${productPath(product.name, product.rawId)}`,
              seller: { '@type': 'Organization', name: product.seller, url: `${SITE_URL}${sellerPath(sellerInfo.profileSlug, product.sellerId)}` },
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
              { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
              { '@type': 'ListItem', position: 3, name: product.name, item: `${SITE_URL}${productPath(product.name, product.rawId)}` },
            ],
          },
        ],
      }
    : null;

  useSEO({
    title: product ? `${product.name}${product.brand ? ` | ${product.brand} Bag` : ''} | BagSearch Nigeria` : 'Product | BagSearch',
    description: seoDescription,
    keywords: seoKeywords,
    image: product?.images?.[0],
    url: product ? productPath(product.name, product.rawId) : null,
    type: 'product',
    schema: seoSchema,
  });

  if (loading) return <LoadingSkeleton isMobile={isMobile} />;

  if (!product) {
    return (
      <div className="pd-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: T.bg, gap: 16, fontFamily: FONT_SANS, padding: 24, textAlign: 'center' }}>
        <style>{PAGE_CSS}</style>
        {networkError && <NetworkLoader onRetry={() => window.location.reload()} />}
        <h1 style={{ fontFamily: FONT_SERIF, fontSize: 40, fontWeight: 600, color: T.ink }}>This bag isn't here</h1>
        <p style={{ color: T.ink2, fontSize: 15 }}>It may have sold or been removed by the seller.</p>
        <button type="button" onClick={() => navigate('/products')} style={{ height: 48, padding: '0 24px', background: T.ink, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>Browse bags</button>
      </div>
    );
  }

  const soldOut = product.quantity === 0;
  const maxQty = product.quantity ?? 99;
  const lowStock = product.quantity != null && product.quantity > 0 && product.quantity <= 5;
  const color = product.colors[selectedColor];
  const savings = product.discountedPrice ? product.rawPrice - product.discountedPrice : 0;
  const discountPct = product.discountedPrice ? Math.round((savings / product.rawPrice) * 100) : 0;

  const handleAddToCart = () => {
    if (soldOut) return;
    const rawSrc = product.images?.length > 0 ? product.images[0] : '';
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        seller: product.seller || 'Seller',
        sellerId: product.sellerId || product.seller_id || '',
        price: product.rawPrice,
        discountedPrice: product.discountedPrice,
        src: rawSrc,
        whatsapp: product.sellerPhone || product.whatsapp || '',
      });
    }
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2200);
  };

  const handleBuyNow = async () => {
    if (soldOut) return;
    if (!user) { navigate('/login'); return; }
    const price = product.effectivePrice;
    if (!price || price <= 0) { alert('Price not available for this product.'); return; }
    setBuyingNow(true);

    let sellerId = product.user_id || null;
    const sellerSubaccountId = await getSellerSubaccountId(sellerId);

    payForProduct({
      amount: price * quantity,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.email || '',
      productName: product.name || '',
      productId: product.id || '',
      sellerName: product.seller || '',
      sellerId,
      sellerSubaccountId,
      onSuccess: async (response) => {
        setBuyingNow(false);
        // Create order record
        try {
          await supabase.from('orders').insert([{
            buyer_id: user.id,
            seller_id: sellerId,
            product_id: product.id,
            product_name: product.name || '',
            product_image: product.images?.[0] || '',
            quantity,
            unit_price: price,
            total_price: price * quantity,
            status: 'paid',
            flutterwave_tx_ref: response.tx_ref || response.txRef || '',
            flutterwave_tx_id: response.transaction_id?.toString() || '',
          }]);
          // Notify seller
          if (sellerId) {
            supabase.from('notifications').insert([{
              seller_id: sellerId,
              type: 'new_order',
              title: 'New order received!',
              message: `${user.user_metadata?.full_name || 'A buyer'} ordered "${product.name}" (×${quantity}) for ₦${(price * quantity).toLocaleString()}. Payment held until delivery is confirmed.`,
              is_read: false,
            }]).catch(() => {});
          }
        } catch (err) { console.warn('Order record failed:', err); }
        triggerGoogleReviewSurvey({ email: user.email || '', productName: product.name || '', productId: product.id || '' });
        navigate('/orders');
      },
      onClose: () => { setBuyingNow(false); },
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${productPath(product.name, product.id)}`;
    try {
      if (navigator.share) { await navigator.share({ title: product.name, text: `${product.name} on BagSearch`, url }); return; }
      await navigator.clipboard.writeText(url);
      setToast('Link copied');
    } catch { /* share sheet dismissed */ }
  };

  const whatsappUrl = (() => {
    const number = normalizeWhatsAppNumber(product.sellerPhone || '');
    if (!number) return '';
    const productLink = `${window.location.origin}/products/${product.id}`;
    const msg = `Hi! I'm interested in the *${product.name}*.\nProduct link: ${productLink}\nIs it still available?`;
    return buildWhatsAppUrl(number, msg);
  })();
  const onWhatsAppClick = () => {
    setTimeout(() => triggerGoogleReviewSurvey({ email: user?.email || '', productName: product?.name || '', productId: product?.id || '' }), 1500);
  };

  const sellerInitials = product.seller.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const words = product.name.split(/\s+/);
  const eyebrow = [product.brand, product.category].filter(Boolean).join(' · ');
  const shopPath = product.sellerId ? sellerPath(sellerInfo.profileSlug, product.sellerId) : '/vendors';

  // ── Pieces ────────────────────────────────────────────────────────────────
  const stockLine = soldOut ? (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: T.redInk }}>Sold out</span>
  ) : lowStock ? (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: T.accentInk }}>
      <span style={{ position: 'relative', width: 8, height: 8 }}>
        <motion.span animate={{ scale: [1, 2.4], opacity: [0.5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          style={{ position: 'absolute', inset: 0, borderRadius: 999, background: T.accent }} />
        <span style={{ position: 'absolute', inset: 0, borderRadius: 999, background: T.accent }} />
      </span>
      Only {product.quantity} left
    </span>
  ) : (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: T.green }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: T.green }} />In stock
    </span>
  );

  const buyButton = (height, label) => (
    <motion.button type="button" className="pd-cta" onClick={handleBuyNow} disabled={buyingNow || soldOut}
      whileHover={soldOut ? undefined : { y: -2, boxShadow: '0 12px 28px rgba(180,65,14,0.32)' }} whileTap={soldOut ? undefined : { scale: 0.97 }}
      style={{ position: 'relative', overflow: 'hidden', flex: '1 1 0', minWidth: 0, whiteSpace: 'nowrap', height, borderRadius: 12, border: 'none', background: soldOut ? T.lineStrong : T.accent, color: '#fff', fontSize: 16, fontWeight: 800, cursor: soldOut ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 6px 18px rgba(180,65,14,0.22)', opacity: buyingNow ? 0.75 : 1 }}>
      <span className="pd-shine" />
      {buyingNow ? (
        <><span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'pdSpin .8s linear infinite' }} />Opening checkout…</>
      ) : soldOut ? 'Sold out' : (<><LockIcon />{label}</>)}
    </motion.button>
  );

  const cartButton = (height, extra = {}) => (
    <motion.button type="button" onClick={handleAddToCart} disabled={soldOut}
      whileHover={soldOut ? undefined : { y: -2 }} whileTap={soldOut ? undefined : { scale: 0.97 }}
      animate={{ background: cartAdded ? T.greenSoft : T.surface, borderColor: cartAdded ? T.green : T.ink, color: cartAdded ? T.green : T.ink }}
      style={{ height, borderRadius: 12, border: '1.5px solid', whiteSpace: 'nowrap', fontSize: 15, fontWeight: 700, cursor: soldOut ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: soldOut ? 0.4 : 1, ...extra }}>
      <AddToCartLabel added={cartAdded} />
    </motion.button>
  );

  const infoColumn = (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 20 : 24, minWidth: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {eyebrow && (
          <motion.div variants={rise} style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.accentInk }}>{eyebrow}</motion.div>
        )}
        <h1 aria-label={product.name} style={{ fontFamily: FONT_SERIF, fontWeight: 600, fontSize: isMobile ? 34 : 'clamp(38px, 3.6vw, 50px)', lineHeight: 1.06, letterSpacing: '-0.01em', color: T.ink }}>
          {words.map((w, i) => (
            <span key={i} aria-hidden="true">
              {i > 0 && ' '}
              <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em' }}>
                <motion.span style={{ display: 'inline-block' }} initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: 0.15 + i * 0.05, duration: 0.75, ease: EASE_OUT }}>{w}</motion.span>
              </span>
            </span>
          ))}
        </h1>
        <motion.div variants={rise} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {product.condition && <span style={{ padding: '6px 12px', borderRadius: 999, background: T.sand, fontSize: 12, fontWeight: 700, color: T.ink2 }}>{product.condition}</span>}
          {sellerInfo.verified && (
            <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              style={{ padding: '6px 12px', borderRadius: 999, background: T.greenSoft, fontSize: 12, fontWeight: 700, color: T.green, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>Verified seller
            </motion.span>
          )}
          {sellerInfo.rating != null && (
            <a href={shopPath} onClick={(e) => { e.preventDefault(); navigate(shopPath); }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: T.ink2, textDecoration: 'none', marginLeft: 4 }}>
              <StarIcon /><strong style={{ color: T.ink }}>{sellerInfo.rating.toFixed(1)}</strong> · {sellerInfo.reviewCount} seller review{sellerInfo.reviewCount === 1 ? '' : 's'}
            </a>
          )}
        </motion.div>
      </div>

      <motion.div variants={rise} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '20px 0', borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: isMobile ? 30 : 36, fontWeight: 800, letterSpacing: '-0.02em', color: T.ink, fontVariantNumeric: 'tabular-nums' }}>
              <CountUp value={product.effectivePrice} format={naira} duration={0.9} />
            </span>
            {product.discountedPrice && <span style={{ fontSize: 16, color: T.muted, textDecoration: 'line-through' }}>{naira(product.rawPrice)}</span>}
            {discountPct > 0 && (
              <motion.span initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.6, type: 'spring', stiffness: 380, damping: 14 }}
                style={{ padding: '4px 10px', borderRadius: 999, background: T.accent, color: '#fff', fontSize: 12, fontWeight: 800 }}>−{discountPct}%</motion.span>
            )}
          </div>
          {savings > 0 && <div style={{ fontSize: 13, color: T.green, fontWeight: 700, marginTop: 4 }}>Seller discount · you save {naira(savings)}</div>}
        </div>
        {stockLine}
      </motion.div>

      {product.colors.length > 0 && (
        <motion.fieldset variants={rise} style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend style={{ padding: 0, marginBottom: 12, fontSize: 14, fontWeight: 700, color: T.ink }}>
            Colour{color?.name && <span style={{ fontWeight: 500, color: T.ink2 }}> — {color.name}</span>}
          </legend>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {product.colors.map((c, i) => (
              <motion.button key={i} type="button" onClick={() => setSelectedColor(i)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                aria-label={c.name || `Colour ${i + 1}`} aria-pressed={i === selectedColor}
                style={{ position: 'relative', width: 44, height: 44, borderRadius: 999, border: `1px solid ${T.line}`, padding: 4, background: T.surface, cursor: 'pointer' }}>
                <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: 999, background: c.value, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }} />
                {i === selectedColor && (
                  <motion.span layoutId="pd-swatch-ring" transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    style={{ position: 'absolute', inset: -2, borderRadius: 999, border: `2px solid ${T.ink}` }} />
                )}
              </motion.button>
            ))}
          </div>
        </motion.fieldset>
      )}

      {isMobile ? (
        !soldOut && product.quantity !== 1 && (
          <motion.div variants={rise} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Quantity</span>
            <QtyStepper quantity={quantity} setQuantity={setQuantity} max={maxQty} />
          </motion.div>
        )
      ) : (
        <motion.div variants={rise} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {!soldOut && <QtyStepper quantity={quantity} setQuantity={setQuantity} max={maxQty} />}
            {buyButton(56, `Buy now · ${naira(product.effectivePrice * quantity)}`)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: whatsappUrl ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: 12 }}>
            {cartButton(52)}
            {whatsappUrl && (
              <motion.a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={onWhatsAppClick}
                whileHover={{ y: -2, borderColor: T.green }} whileTap={{ scale: 0.97 }}
                style={{ height: 52, borderRadius: 12, border: `1.5px solid ${T.lineStrong}`, background: T.surface, color: T.ink, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
                <WaIcon /> Ask on WhatsApp
              </motion.a>
            )}
          </div>
        </motion.div>
      )}

      <motion.div variants={rise} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: isMobile ? '14px 16px' : 0, borderRadius: 12, background: isMobile ? T.greenSoft : 'transparent', fontSize: isMobile ? 14 : 13, lineHeight: 1.5, color: isMobile ? '#1C3A2A' : T.ink2 }}>
        <ShieldIcon size={isMobile ? 20 : 16} />
        <span>{isMobile && <strong>Escrow protected. </strong>}Your payment is held until you confirm the bag arrived as described.</span>
      </motion.div>

      <motion.a variants={rise} href={shopPath} onClick={(e) => { e.preventDefault(); navigate(shopPath); }}
        whileHover={{ y: -3, boxShadow: '0 12px 30px rgba(28,20,16,0.08)' }}
        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: isMobile ? 16 : 20, borderRadius: 16, background: T.surface, border: `1px solid ${T.line}`, textDecoration: 'none', color: T.ink }}>
        <div style={{ width: isMobile ? 48 : 56, height: isMobile ? 48 : 56, borderRadius: 999, background: T.ink, color: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_SERIF, fontSize: isMobile ? 20 : 24, fontWeight: 600, flexShrink: 0 }}>{sellerInitials}</div>
        <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 16, fontWeight: 800 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.seller}</span>
            {sellerInfo.verified && <VerifiedIcon />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.ink2, flexWrap: 'wrap' }}>
            {product.sellerLocation && <><PinIcon />{titleCase(product.sellerLocation)}</>}
            {product.sellerLocation && sellerInfo.listingCount != null && <span aria-hidden="true">·</span>}
            {sellerInfo.listingCount != null && <span>{sellerInfo.listingCount} listing{sellerInfo.listingCount === 1 ? '' : 's'}</span>}
          </div>
        </div>
        <span style={{ height: 44, padding: '0 18px', borderRadius: 999, border: `1px solid ${T.lineStrong}`, display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>Visit shop</span>
      </motion.a>

      <motion.div variants={rise} style={{ borderTop: `1px solid ${T.line}` }}>
        <Accordion id="pd-desc" title="Description" open={openSection === 'description'} onToggle={() => setOpenSection(s => s === 'description' ? '' : 'description')}>
          <p style={{ whiteSpace: 'pre-line' }}>{product.description || 'The seller has not added a description yet. Ask them on WhatsApp for more photos or details.'}</p>
        </Accordion>
        <Accordion id="pd-details" title="Details" open={openSection === 'details'} onToggle={() => setOpenSection(s => s === 'details' ? '' : 'details')}>
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 24px', margin: 0 }}>
            {[
              ['Brand', product.brand],
              ['Category', product.category],
              ['Condition', product.condition],
              ['Colours', product.colors.map(c => c.name).filter(Boolean).join(', ')],
              ['Available', product.quantity != null ? String(product.quantity) : ''],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={{ display: 'contents' }}>
                <dt style={{ fontWeight: 700, color: T.ink }}>{k}</dt>
                <dd style={{ margin: 0 }}>{v}</dd>
              </div>
            ))}
          </dl>
        </Accordion>
        <Accordion id="pd-delivery" title="Delivery & returns" open={openSection === 'delivery'} onToggle={() => setOpenSection(s => s === 'delivery' ? '' : 'delivery')}>
          <p>Delivery is arranged with the seller. Message them to agree on timing and cost for your location.</p>
          <p style={{ marginTop: 10 }}>When you pay through BagSearch, the seller is paid only after you confirm the bag arrived as described. Ask the seller about their returns policy before you buy.</p>
        </Accordion>
      </motion.div>
    </motion.div>
  );

  const trustStrip = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginLeft: product.images.length > 1 ? 92 : 0 }}>
      {[
        { icon: <ShieldIcon size={22} />, title: 'Escrow protection', sub: 'Paid out after you confirm delivery' },
        { icon: <VerifiedIcon size={22} />, title: 'Verified sellers', sub: 'Sellers confirm their ID with NIN' },
        { icon: <WaIcon size={22} />, title: 'Chat before you buy', sub: 'Ask for more photos on WhatsApp' },
      ].map((t, i) => (
        <motion.div key={t.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 * i, duration: 0.5, ease: EASE_OUT }}
          style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 16, borderRadius: 12, background: T.surface, border: `1px solid ${T.line}` }}>
          <span style={{ flexShrink: 0, display: 'flex' }}>{t.icon}</span>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{t.title}</div><div style={{ fontSize: 12, color: T.ink2, marginTop: 2, lineHeight: 1.45 }}>{t.sub}</div></div>
        </motion.div>
      ))}
    </div>
  );

  const similarSection = similarProducts.length > 0 && (
    <section style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24, marginTop: isMobile ? 24 : 72 }}>
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: EASE_OUT }}
        style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: FONT_SERIF, fontWeight: 600, fontSize: isMobile ? 28 : 38, color: T.ink }}>More like this</h2>
        <a href={`/products?category=${encodeURIComponent(product.category)}`} onClick={(e) => { e.preventDefault(); navigate('/products'); }}
          style={{ fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>View all →</a>
      </motion.div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, minmax(0, 1fr))`, gap: isMobile ? 14 : 24 }}>
        {similarProducts.slice(0, isMobile ? 4 : 8).map((p, idx) => <SimilarCard key={p.id} p={p} index={idx} navigate={navigate} />)}
      </div>
    </section>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="pd-root" style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT_SANS, color: T.ink }}>
        <style>{PAGE_CSS}</style>
        {networkError && <NetworkLoader onRetry={() => window.location.reload()} />}

        {!isMobile && (
          <motion.header initial={{ y: -72 }} animate={{ y: 0 }} transition={{ duration: 0.5, ease: EASE_OUT }}
            style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${T.line}` }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', height: 72, padding: '0 40px', display: 'flex', alignItems: 'center', gap: 36 }}>
              <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: T.ink, flexShrink: 0 }}>
                <LogoIcon size="32px" />
                <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>Bag<span style={{ color: T.accent }}>Search</span></span>
              </a>
              <nav aria-label="Main" style={{ display: 'flex', gap: 28, fontSize: 14, fontWeight: 600 }}>
                {[['Shop', '/products'], ['Sellers', '/vendors'], ['Hot deals', '/hot-deals'], ['Reels', '/reels']].map(([label, to]) => (
                  <a key={to} href={to} className="pd-nav-link" onClick={(e) => { e.preventDefault(); navigate(to); }} style={{ color: T.ink2 }}>{label}</a>
                ))}
              </nav>
              <form role="search" onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.currentTarget).get('q'); navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products'); }}
                style={{ flexGrow: 1, height: 44, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderRadius: 999, background: T.sand, color: T.muted }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
                <label htmlFor="pd-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Search bags</label>
                <input id="pd-search" name="q" type="search" placeholder="Search bags, brands, sellers" style={{ border: 'none', background: 'transparent', outline: 'none', font: 'inherit', fontSize: 14, color: T.ink, flexGrow: 1, minWidth: 0 }} />
              </form>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <motion.button type="button" whileTap={{ scale: 0.9 }} aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`} onClick={() => navigate('/cart')}
                  style={{ position: 'relative', width: 44, height: 44, borderRadius: 999, border: 'none', background: 'transparent', color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BagIcon size={21} />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span key={cartCount} initial={{ scale: 0 }} animate={{ scale: [0, 1.35, 1] }} exit={{ scale: 0 }} transition={{ duration: 0.4 }}
                        style={{ position: 'absolute', top: 4, right: 2, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: T.accent, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                <motion.button type="button" whileTap={{ scale: 0.9 }} aria-label="Account" onClick={() => navigate(user ? '/profile' : '/login')}
                  style={{ width: 44, height: 44, borderRadius: 999, border: `1px solid ${T.line}`, background: T.surface, color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" /></svg>
                </motion.button>
              </div>
            </div>
          </motion.header>
        )}

        {isMobile ? (
          <main style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 200 }}>
            <ProductGallery images={product.images} alt={[product.brand, product.name].filter(Boolean).join(' ')} isMobile
              wishlisted={wishlisted} onToggleWishlist={() => setWishlisted(w => !w)} onShare={handleShare}
              onBack={() => (window.history.length > 1 ? navigate(-1) : navigate('/products'))} />
            <div style={{ padding: '24px 20px 0' }}>
              {infoColumn}
              {similarSection}
            </div>
          </main>
        ) : (
          <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 40px 96px' }}>
            <motion.nav aria-label="Breadcrumb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.muted, marginBottom: 28, flexWrap: 'wrap' }}>
              <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} style={{ color: T.muted, textDecoration: 'none' }}>Home</a>
              <span aria-hidden="true">/</span>
              <a href="/products" onClick={(e) => { e.preventDefault(); navigate('/products'); }} style={{ color: T.muted, textDecoration: 'none' }}>{titleCase(product.category)}</a>
              <span aria-hidden="true">/</span>
              <span aria-current="page" style={{ color: T.ink, fontWeight: 600 }}>{product.name}</span>
            </motion.nav>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)', gap: 64, alignItems: 'start' }}>
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE_OUT }}
                style={{ position: 'sticky', top: 96, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <ProductGallery images={product.images} alt={[product.brand, product.name].filter(Boolean).join(' ')} isMobile={false}
                  wishlisted={wishlisted} onToggleWishlist={() => setWishlisted(w => !w)} onShare={handleShare} />
                {trustStrip}
              </motion.div>
              {infoColumn}
            </div>
            {similarSection}
          </main>
        )}

        {isMobile && (
          <motion.div initial={{ y: 140 }} animate={{ y: 0 }} transition={{ delay: 0.45, duration: 0.55, ease: EASE_OUT }}
            style={{ position: 'fixed', left: 0, right: 0, bottom: hasBottomNav ? 76 : 0, zIndex: 40, padding: '12px 16px', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: `1px solid ${T.line}`, boxShadow: '0 -6px 20px rgba(28,20,16,0.08)', display: 'flex', gap: 10 }}>
            {whatsappUrl && (
              <motion.a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={onWhatsAppClick} whileTap={{ scale: 0.92 }} aria-label="Ask the seller on WhatsApp"
                style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 12, border: `1.5px solid ${T.lineStrong}`, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WaIcon size={22} />
              </motion.a>
            )}
            {cartButton(52, { flex: 1, minWidth: 0, fontSize: 14 })}
            {buyButton(52, 'Buy now')}
          </motion.div>
        )}

        <AnimatePresence>
          {toast && (
            <motion.div role="status" initial={{ opacity: 0, y: 20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }}
              style={{ position: 'fixed', left: '50%', bottom: isMobile ? 170 : 32, zIndex: 100, padding: '12px 20px', borderRadius: 999, background: T.ink, color: '#fff', fontSize: 14, fontWeight: 700, boxShadow: '0 10px 30px rgba(28,20,16,0.25)' }}>
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
