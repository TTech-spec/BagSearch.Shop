import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LogoIcon from './components/Logo.jsx';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';
import { buildWhatsAppUrl, normalizeWhatsAppNumber } from './utils/whatsapp';

// ─── Bag Color Map ─────────────────────────────────────────────────────────────
const BAG_COLOR_MAP = {
  black:'#1A1A1A',white:'#F5F5F0',beige:'#D4B896',camel:'#C19A6B',tan:'#A67C52',
  brown:'#6B3F2A',burgundy:'#722F37',red:'#CC2200',pink:'#E8A0A0',blush:'#F2C4B8',
  orange:'#E8762B',yellow:'#E8C84A',olive:'#808000',green:'#2D6A3F',mint:'#98D8C8',
  teal:'#2A7A7A',navy:'#1A2E5A',blue:'#2255CC',cobalt:'#0047AB',purple:'#6A2D8F',
  lavender:'#B8A0D8',grey:'#888888',silver:'#C0C0C0',gold:'#CFB53B',
  multicolor:'linear-gradient(135deg,#C94B2C,#E8856A,#F9DDD0,#2255CC,#2D6A3F)',
};

const resolveColor = (c) => {
  if (!c) return '#c84b11';
  if (typeof c === 'string') {
    if (c.startsWith('#') || c.startsWith('rgb') || c.startsWith('linear')) return c;
    return BAG_COLOR_MAP[c.toLowerCase().trim()] || c;
  }
  return c.hex || BAG_COLOR_MAP[String(c.id || '').toLowerCase()] || '#c84b11';
};

const C = {
  primary:      '#c84b11',
  primaryLight: '#f97316',
  primaryBg:    '#fde8d8',
  primaryPale:  '#fdf4ee',
  primaryBorder:'#f9c4a0',
  accent:       '#ea580c',
  success:      '#16a34a',
  successBg:    '#dcfce7',
  danger:       '#dc2626',
  dangerBg:     '#fef2f2',
  surface:      '#ffffff',
  surfaceDim:   '#fdf8f5',
  border:       '#f0d9cc',
  borderLight:  '#f7ece4',
  text:         '#1a0a00',
  textMid:      '#5c3317',
  textMuted:    '#9a6348',
  textFaint:    '#c4957a',
};

// ─── Mock data removed — all data fetched from Supabase ──────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────
const WaIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function StarRating({ rating }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2 }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="13" height="13" viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? C.primaryLight : C.border}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

function NetworkLoader({ onRetry }) {
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(253,244,238,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:100,gap:20 }}>
      <div style={{ position:'relative',width:56,height:56 }}>
        <div style={{ position:'absolute',inset:0,borderRadius:'50%',border:`3px solid ${C.borderLight}` }}/>
        <div style={{ position:'absolute',inset:0,borderRadius:'50%',border:`3px solid transparent`,borderTopColor:C.primary,animation:'spin 1s linear infinite' }}/>
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:15,fontWeight:800,color:C.text,marginBottom:4 }}>No connection</p>
        <p style={{ fontSize:12,color:C.textMuted }}>Check your network and try again</p>
      </div>
      <button onClick={onRetry} style={{ padding:'10px 24px',borderRadius:100,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,color:'white',fontWeight:800,fontSize:13 }}>Retry</button>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartAdded, setCartAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [imgZoom, setImgZoom] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const viewLoggedRef = useRef(null);

  useEffect(() => { fetchProduct(); }, [id]);

  useEffect(() => {
    if (!product?.id || product.isMock) return;
    if (viewLoggedRef.current === product.id) return;
    viewLoggedRef.current = product.id;
    
    // Debug logging
    console.log('=== PRODUCT VIEW DEBUG ===');
    console.log('Product ID:', product.id);
    console.log('Product isMock:', product.isMock);
    console.log('User:', user);
    console.log('User ID:', user?.id);
    console.log('User email:', user?.email);
    console.log('User metadata:', user?.user_metadata);
    
    // #region agent log
    fetch('http://127.0.0.1:7528/ingest/c73351d5-2de0-4b35-8a7b-a781b1fe77c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'25b601'},body:JSON.stringify({sessionId:'25b601',runId:'initial',hypothesisId:'H1-H2',location:'src/productDetail.jsx:logView:start',message:'About to insert product view',data:{productId:product.id,buyerId:user?.id||null,buyerEmail:user?.email||null,isMock:!!product?.isMock},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const logView = async () => {
      try {
        const viewData = {
          product_id: product.id,
          buyer_id: user?.id || null,
          buyer_name: user?.user_metadata?.full_name || user?.email || null,
          buyer_email: user?.email || null,
          source: 'product_detail',
        };
        
        console.log('Inserting view data:', viewData);
        console.log('Data types:', {
          product_id: typeof product.id,
          buyer_id: typeof (user?.id || null),
          buyer_name: typeof (user?.user_metadata?.full_name || user?.email || null),
          buyer_email: typeof (user?.email || null),
          source: typeof 'product_detail'
        });
        
        const { error } = await supabase.from('product_views').insert(viewData, { returning: 'minimal' });
        
        if (error) {
          console.error('Product view insert error:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
        } else {
          console.log('Product view inserted successfully');
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7528/ingest/c73351d5-2de0-4b35-8a7b-a781b1fe77c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'25b601'},body:JSON.stringify({sessionId:'25b601',runId:'initial',hypothesisId:'H1',location:'src/productDetail.jsx:logView:result',message:'product_views insert finished',data:{productId:product.id,buyerId:user?.id||null,error:error?{message:error.message,code:error.code,details:error.details,hint:error.hint}:null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      } catch (err) { 
        console.error('Failed to log product view:', err); 
      }
    };
    logView();
  }, [product?.id, product?.isMock, user?.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      if (id && ['1','2','3','4','5'].includes(id)) {
        // mock IDs no longer supported
      }
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      // #region agent log
      fetch('http://127.0.0.1:7528/ingest/c73351d5-2de0-4b35-8a7b-a781b1fe77c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'25b601'},body:JSON.stringify({sessionId:'25b601',runId:'initial',hypothesisId:'H2',location:'src/productDetail.jsx:fetchProduct:result',message:'Fetched product by route id',data:{routeId:id,foundProductId:data?.id||null,error:error?{message:error.message,code:error.code}:null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (error) throw error;
      if (data) {
        const fmt = {
          id: data.id,
          name: data.name,
          brand: data.brand,
          seller: data.seller_name || 'Anonymous Seller',
          sellerPhone: data.whatsapp || "2348147061837",
          sellerLocation: data.location || "Lagos, Nigeria",
          sellerVerified: true,
          sellerJoined: "2023",
          sub: `${data.brand} • ${data.condition}`,
          description: data.description || "No description provided.",
          price: `₦${parseFloat(data.price).toLocaleString()}`,
          originalPrice: `₦${(parseFloat(data.price)*1.15).toLocaleString()}`,
          quantity: data.quantity != null ? parseInt(data.quantity) : null,
          lowStock: data.quantity != null ? parseInt(data.quantity) < 5 : false,
          rating: 4.8,
          reviews: 24,
          colors: (() => {
            const raw = data.colors;
            if (!raw || (Array.isArray(raw) && raw.length === 0)) return ["#c84b11","#f97316"];
            const arr = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : [raw]);
            return arr.map(c => resolveColor(c));
          })(),
          sizes: ["S","M","L"],
          category: data.category || "General",
          images: data.images?.length > 0 ? data.images : ['https://via.placeholder.com/600'],
          isMock: false,
        };
        setProduct(fmt);
        setSelectedColor(fmt.colors[0]);
        
        // Fetch similar products after main product is loaded
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
      // Fetch products with similar category or brand
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
      
      if (similarData && similarData.length > 0) {
        const formattedSimilar = similarData.map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          price: `₦${parseFloat(p.price).toLocaleString()}`,
          images: p.images?.length > 0 ? p.images : ['https://via.placeholder.com/600'],
          colors: (() => {
            const raw = p.colors;
            if (!raw || (Array.isArray(raw) && raw.length === 0)) return ["#c84b11"];
            const arr = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : [raw]);
            return arr.map(c => resolveColor(c));
          })(),
        }));
        setSimilarProducts(formattedSimilar);
      }
    } catch (err) {
      console.error('Error fetching similar products:', err);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setPageLoaded(true), 80);
    const goOffline = () => setNetworkError(true);
    const goOnline = () => setNetworkError(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    if (!navigator.onLine) setNetworkError(true);
    return () => { clearTimeout(t); window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); };
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.primaryPale }}>
        <div style={{ width:40,height:40,borderRadius:'50%',border:`3px solid ${C.borderLight}`,borderTopColor:C.primary,animation:'spin 1s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:C.primaryPale,gap:20 }}>
        <h2 style={{ color:C.text }}>Product not found</h2>
        <button onClick={() => navigate('/products')} style={{ padding:'10px 20px',background:C.primary,color:'white',border:'none',borderRadius:8,cursor:'pointer' }}>Back to Products</button>
      </div>
    );
  }

  const handleAddToCart = () => {
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2200);
  };

  const parsePrice = (p) => parseFloat((p || '0').toString().replace(/[^0-9.]/g, ''));
  const currentPrice = parsePrice(product.price);
  const originalPrice = parsePrice(product.originalPrice);
  const discount = originalPrice > 0 ? Math.round((1 - currentPrice / originalPrice) * 100) : 0;
  const whatsappUrl = (() => {
    const number = normalizeWhatsAppNumber(product.sellerPhone || '');
    if (!number) return '';
    const productLink = `${window.location.origin}/products/${product.id}`;
    const msg = `Hi! I'm interested in the *${product.name}*.\nProduct link: ${productLink}\nIs it still available?`;
    return buildWhatsAppUrl(number, msg);
  })();

  return (
    <div style={{
      minHeight:'100vh',
      background:`radial-gradient(ellipse 80% 50% at 50% -10%, ${C.primaryBg} 0%, #fff 60%)`,
      fontFamily:"'Sora', sans-serif",
      opacity: pageLoaded ? 1 : 0,
      transform: pageLoaded ? 'none' : 'translateY(12px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.97)} }
        @keyframes floatUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes badgePop { 0%{transform:scale(0)} 60%{transform:scale(1.25)} 100%{transform:scale(1)} }
        @keyframes waveIn { from{clip-path:inset(0 100% 0 0)} to{clip-path:inset(0 0% 0 0)} }

        .fade-in   { animation: floatUp 0.55s ease both; }
        .fade-in-1 { animation: floatUp 0.55s 0.08s ease both; }
        .fade-in-2 { animation: floatUp 0.55s 0.16s ease both; }
        .fade-in-3 { animation: floatUp 0.55s 0.24s ease both; }
        .fade-in-4 { animation: floatUp 0.55s 0.32s ease both; }
        .fade-in-5 { animation: floatUp 0.55s 0.40s ease both; }

        .thumb-btn { transition: transform 0.25s ease, border-color 0.2s; }
        .thumb-btn:hover { transform: scale(1.05); }

        .size-btn { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        .size-btn:hover { transform: scale(1.07); }

        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; cursor:pointer; }
        .card-hover:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(200,75,17,0.13); }
        .card-hover:hover .card-img { transform: scale(1.05); }
        .card-img { transition: transform 0.5s ease; }

        .cta-btn { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .cta-btn:hover { transform: translateY(-2px) scale(1.02); }
        .cta-btn:active { transform: scale(0.97); }

        .wa-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }

        .wishlist-btn { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .wishlist-btn:hover { transform: scale(1.18); }

        .img-zoom { transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94); cursor:zoom-in; }
        .img-zoom:hover { transform: scale(1.04); }
        .img-zoom.zoomed { transform: scale(1.08); cursor:zoom-out; }

        .bar-accent {
          height: 3px;
          background: linear-gradient(90deg, #c84b11, #f97316, #ea580c, #f97316, #c84b11);
          background-size: 300% auto;
          animation: gradShift 4s ease-in-out infinite;
        }

        .progress-track { background: #f7ece4; border-radius:99px; overflow:hidden; }
        .progress-fill {
          height:100%; background: linear-gradient(90deg,#c84b11,#f97316);
          border-radius:99px; animation: waveIn 1.2s 0.5s ease both;
        }

        /* ── Layout ── */
        .product-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 900px) {
          .product-grid { grid-template-columns: 1fr 1fr; gap: 48px; }
        }

        .similar-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 768px) {
          .similar-grid { grid-template-columns: repeat(4, 1fr); gap: 20px; }
        }

        /* ── Sticky bottom bar (mobile only) ── */
        .sticky-bar { display: none; }
        @media (max-width: 767px) {
          .sticky-bar { display: flex; }
          .desktop-cta { display: none !important; }
          .main-wrap { padding-bottom: 88px; }
        }
        @media (min-width: 768px) {
          .sticky-bar { display: none !important; }
        }

        /* ── Header responsive ── */
        .nav-back-label { display: inline; }
        @media (max-width: 480px) {
          .nav-back-label { display: none; }
        }
      `}</style>

      {networkError && <NetworkLoader onRetry={() => window.location.reload()} />}

      {/* ══════════════════════ HEADER ══════════════════════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.borderLight}`,
        boxShadow: `0 1px 20px rgba(200,75,17,0.06)`,
      }}>
        <div className="bar-accent" />
        <div style={{
          maxWidth: 1320,
          margin: '0 auto',
          /* key fix: snug padding, items tightly controlled */
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          gap: 12,
        }}>

          {/* LEFT: hamburger (mobile) + logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            {/* Hamburger — mobile only, plain icon button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Menu"
              style={{
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', background: 'transparent',
                cursor: 'pointer', borderRadius: 8, color: C.textMid,
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
              </svg>
            </button>

            {/* Logo */}
            <div
              onClick={() => navigate('/')}
              style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', userSelect:'none', flexShrink:0 }}
            >
              <LogoIcon size="32px" />
              <span style={{ fontSize:17, fontWeight:900, color:C.text, letterSpacing:'-0.5px', whiteSpace:'nowrap' }}>
                Bag<span style={{ color:C.primary }}>Search</span>
              </span>
            </div>
          </div>

          {/* RIGHT: back button only — small, inline, no cart clutter */}
          <button
            onClick={() => navigate('/products')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 14px',
              height: 36,
              borderRadius: 10,
              border: `1.5px solid ${C.primaryBorder}`,
              background: C.primaryBg,
              color: C.primary,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.primary; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.primaryBg; e.currentTarget.style.color = C.primary; }}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
            <span className="nav-back-label">Back to Shop</span>
          </button>
        </div>
      </header>

      {/* ══════════════════════ SIDEBAR (mobile) ══════════════════════ */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{ position:'fixed',inset:0,background:'rgba(26,10,0,0.4)',zIndex:60 }}
        />
      )}
      <aside style={{
        position: 'fixed', top:0, left:0, height:'100%', width:260,
        background: 'white', zIndex: 70,
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: `6px 0 32px rgba(200,75,17,0.1)`,
        padding: '20px 16px',
        display: 'flex', flexDirection:'column', gap:8,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <LogoIcon size="28px" />
            <span style={{ fontWeight:900, fontSize:15, color:C.text }}>BagSearch</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)}
            style={{ width:32,height:32,borderRadius:8,border:'none',background:C.primaryBg,color:C.primary,cursor:'pointer',fontSize:14,fontWeight:800 }}>
            ✕
          </button>
        </div>
        {[
          { label:'← Back to Shop', action: () => navigate('/products'), primary:true },
          { label:'👤 Profile', action: () => navigate('/profile') },
        ].map(({ label, action, primary }) => (
          <button key={label} onClick={() => { setIsSidebarOpen(false); action?.(); }}
            style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'12px 14px', borderRadius:12, border:'none',
              background: primary ? C.primaryBg : 'transparent',
              cursor:'pointer', color: primary ? C.primary : C.text,
              fontSize:14, fontWeight: primary ? 700 : 600, textAlign:'left',
              transition:'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background=C.primaryBg; e.currentTarget.style.color=C.primary; }}
            onMouseLeave={e => { e.currentTarget.style.background=primary?C.primaryBg:'transparent'; e.currentTarget.style.color=primary?C.primary:C.text; }}>
            {label}
          </button>
        ))}
      </aside>

      {/* ══════════════════════ MAIN ══════════════════════ */}
      <main className="main-wrap" style={{ maxWidth:1320, margin:'0 auto', padding:'24px 16px 40px' }}>

        {/* Breadcrumb */}
        <nav className="fade-in" style={{ display:'flex',alignItems:'center',gap:6,fontSize:11,color:C.textFaint,marginBottom:20,flexWrap:'wrap' }}>
          <span style={{ cursor:'pointer' }} onMouseEnter={e=>e.target.style.color=C.primary} onMouseLeave={e=>e.target.style.color=C.textFaint}>Home</span>
          <span>›</span>
          <span style={{ cursor:'pointer' }}>{product.category}</span>
          <span>›</span>
          <span style={{ color:C.textMid, fontWeight:600 }}>{product.name}</span>
        </nav>

        {/* ══ PRODUCT GRID ══ */}
        <div className="product-grid">

          {/* ── LEFT: Images ── */}
          <div className="fade-in-1" style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* Hero image */}
            <div style={{
              position:'relative', borderRadius:20, overflow:'hidden',
              background:`linear-gradient(135deg,${C.primaryBg},${C.primaryPale})`,
              border:`1.5px solid ${C.borderLight}`,
              aspectRatio:'4/3',
              boxShadow:`0 8px 40px rgba(200,75,17,0.1)`,
            }}>
              <img
                src={product.images[activeImg]}
                alt={product.name}
                className={`img-zoom${imgZoom?' zoomed':''}`}
                onClick={() => setImgZoom(z=>!z)}
                style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}
              />
              <div style={{ position:'absolute',bottom:0,left:0,right:0,height:'35%',background:'linear-gradient(to top,rgba(26,10,0,0.12),transparent)',pointerEvents:'none' }}/>

              {/* Wishlist */}
              <button
                className="wishlist-btn"
                onClick={() => setWishlisted(w=>!w)}
                style={{
                  position:'absolute',top:12,right:12,
                  width:38,height:38,borderRadius:11,border:'none',cursor:'pointer',
                  background:'rgba(255,255,255,0.9)',backdropFilter:'blur(8px)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  boxShadow:'0 2px 10px rgba(0,0,0,0.08)',
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill={wishlisted?'#dc2626':'none'} stroke={wishlisted?'#dc2626':C.textMid} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                </svg>
              </button>

              {/* Counter */}
              <div style={{ position:'absolute',bottom:10,left:10,background:'rgba(255,255,255,0.88)',backdropFilter:'blur(8px)',borderRadius:99,padding:'4px 11px',fontSize:11,fontWeight:700,color:C.textMid,border:`1px solid ${C.borderLight}` }}>
                {activeImg+1} / {product.images.length}
              </div>
              <div style={{ position:'absolute',bottom:10,right:10,background:'rgba(255,255,255,0.7)',backdropFilter:'blur(8px)',borderRadius:99,padding:'4px 10px',fontSize:10,color:C.textMuted,fontWeight:600 }}>
                {imgZoom ? 'Zoom out' : 'Click to zoom'}
              </div>
            </div>

            {/* Thumbnails */}
            <div style={{ display:'flex', gap:10 }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className="thumb-btn"
                  style={{
                    flex:1, borderRadius:12, overflow:'hidden', padding:0,
                    border:`2px solid ${activeImg===i ? C.primary : C.borderLight}`,
                    background:'transparent', cursor:'pointer', aspectRatio:'1',
                    boxShadow: activeImg===i ? `0 0 0 3px ${C.primaryBg}` : 'none',
                  }}>
                  <img src={img} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}/>
                </button>
              ))}
            </div>

            {/* Trust strip */}
            <div style={{ display:'flex',borderRadius:14,border:`1.5px solid ${C.borderLight}`,overflow:'hidden',background:C.surfaceDim }}>
              {[
                { icon:'🚚', label:'Free Delivery', sub:'Orders over $500' },
                { icon:'🔄', label:'Easy Returns', sub:'30-day policy' },
                { icon:'🔒', label:'Secure Pay', sub:'256-bit SSL' },
              ].map((item, i) => (
                <div key={i} style={{ flex:1,padding:'11px 8px',textAlign:'center',borderLeft:i>0?`1px solid ${C.borderLight}`:'none' }}>
                  <div style={{ fontSize:17,marginBottom:3 }}>{item.icon}</div>
                  <p style={{ fontSize:10,fontWeight:800,color:C.textMid }}>{item.label}</p>
                  <p style={{ fontSize:9,color:C.textFaint }}>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Details ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Badges + Title */}
            <div className="fade-in-2">
              <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:10,flexWrap:'wrap' }}>
                <span style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,color:'white',fontSize:9,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',padding:'4px 11px',borderRadius:99 }}>
                  {product.brand}
                </span>
                <span style={{ background:C.successBg,color:C.success,fontSize:9,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',padding:'4px 9px',borderRadius:99 }}>
                  ✓ Authentic
                </span>
                {discount > 0 && (
                  <span style={{ background:C.dangerBg,color:C.danger,fontSize:9,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',padding:'4px 9px',borderRadius:99 }}>
                    -{discount}% OFF
                  </span>
                )}
              </div>
              <h1 style={{ fontSize:'clamp(22px,4vw,30px)',fontWeight:900,color:C.text,lineHeight:1.15,letterSpacing:'-0.5px',marginBottom:5 }}>
                {product.name}
              </h1>
              <p style={{ color:C.textMuted,fontSize:13,fontWeight:500 }}>{product.sub}</p>
            </div>

            {/* Rating */}
            <div className="fade-in-2" style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
              <div style={{ display:'flex',alignItems:'center',gap:7,background:C.surfaceDim,border:`1.5px solid ${C.borderLight}`,borderRadius:100,padding:'6px 12px' }}>
                <StarRating rating={product.rating}/>
                <span style={{ fontSize:12,fontWeight:800,color:C.text }}>{product.rating}</span>
                <span style={{ fontSize:11,color:C.textFaint }}>({product.reviews})</span>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:6,fontSize:12,color:C.textMuted }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:C.success,boxShadow:`0 0 0 3px ${C.successBg}` }}/>
                {product.quantity != null ? `${product.quantity} available` : 'In stock'}
              </div>
            </div>

            {/* Price block */}
            <div className="fade-in-2" style={{
              background:`linear-gradient(135deg,${C.primaryBg},${C.primaryPale})`,
              borderRadius:16,padding:'16px 18px',
              border:`1.5px solid ${C.primaryBorder}`,
              display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,
            }}>
              <div>
                <div style={{ display:'flex',alignItems:'baseline',gap:10 }}>
                  <span style={{ fontSize:'clamp(26px,5vw,34px)',fontWeight:900,color:C.primary,letterSpacing:'-1px' }}>{product.price}</span>
                  <span style={{ fontSize:15,color:C.textFaint,textDecoration:'line-through' }}>{product.originalPrice}</span>
                </div>
                <p style={{ fontSize:11,color:C.textMuted,marginTop:2 }}>
                  You save <strong style={{ color:C.success }}>₦{(originalPrice-currentPrice).toLocaleString()}</strong>
                </p>
              </div>
              <div style={{ minWidth:110 }}>
                <p style={{ fontSize:9,fontWeight:700,color:C.textFaint,marginBottom:5 }}>STOCK LEVEL</p>
                <div className="progress-track" style={{ height:6,width:'100%' }}>
                  <div className="progress-fill" style={{ width:`${Math.min(((product.quantity||0)/20)*100,100)}%`,height:'100%' }}/>
                </div>
                <p style={{ fontSize:9,color:C.textMuted,marginTop:4 }}>🔒 {product.quantity != null ? `${product.quantity} units left` : 'Limited stock'}</p>
              </div>
            </div>

            {/* Description */}
            <div className="fade-in-3">
              <p style={{ fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textFaint,marginBottom:8 }}>About</p>
              <p style={{ color:C.textMid,fontSize:14,lineHeight:1.75,fontWeight:500 }}>{product.description}</p>
            </div>

            {/* Colors */}
            <div className="fade-in-3">
              <p style={{ fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textFaint,marginBottom:10 }}>Color</p>
              <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
                {product.colors.map(c => (
                  <button key={c} onClick={() => setSelectedColor(c)}
                    style={{
                      width:32,height:32,borderRadius:'50%',border:'none',cursor:'pointer',
                      background:c,
                      boxShadow: selectedColor===c
                        ? `0 0 0 2px white, 0 0 0 4px ${C.primary}, 0 4px 12px ${c}99`
                        : `0 0 0 1.5px ${C.border}`,
                      transform: selectedColor===c ? 'scale(1.15)' : 'scale(1)',
                      transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div className="fade-in-3">
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
                <p style={{ fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textFaint }}>Size</p>
                <button style={{ fontSize:11,color:C.primary,fontWeight:700,background:'none',border:'none',cursor:'pointer',textDecoration:'underline' }}>Size guide →</button>
              </div>
              <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)} className="size-btn"
                    style={{
                      padding:'8px 15px',borderRadius:10,
                      border:`1.5px solid ${selectedSize===s ? C.primary : C.border}`,
                      background: selectedSize===s ? `linear-gradient(135deg,${C.primary},${C.primaryLight})` : 'white',
                      color: selectedSize===s ? 'white' : C.textMid,
                      fontSize:12,fontWeight:800,cursor:'pointer',
                      boxShadow: selectedSize===s ? `0 4px 12px ${C.primary}44` : 'none',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* ── CTA (desktop only) ── */}
            <div className="desktop-cta fade-in-4" style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                {/* Qty */}
                <div style={{ display:'flex',alignItems:'center',border:`1.5px solid ${C.border}`,borderRadius:12,overflow:'hidden',background:'white',flexShrink:0 }}>
                  <button onClick={() => setQuantity(q=>Math.max(1,q-1))}
                    style={{ width:40,height:44,border:'none',background:'transparent',cursor:'pointer',fontSize:19,color:C.textMid,fontWeight:700,transition:'background 0.2s' }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.primaryBg}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>−</button>
                  <span style={{ width:40,textAlign:'center',fontSize:14,fontWeight:900,color:C.text }}>{quantity}</span>
                  <button onClick={() => setQuantity(q=>Math.min(product.quantity??99,q+1))}
                    style={{ width:40,height:44,border:'none',background:'transparent',cursor:'pointer',fontSize:19,color:C.textMid,fontWeight:700,transition:'background 0.2s' }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.primaryBg}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>+</button>
                </div>

                {/* Add to cart */}
                <button onClick={handleAddToCart} className="cta-btn"
                  style={{
                    flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                    padding:'13px 0',borderRadius:12,border:'none',cursor:'pointer',
                    background: cartAdded ? `linear-gradient(135deg,${C.success},#22c55e)` : `linear-gradient(135deg,${C.primary},${C.primaryLight})`,
                    color:'white',fontWeight:800,fontSize:14,
                    boxShadow: cartAdded ? `0 6px 20px ${C.success}55` : `0 6px 20px ${C.primary}44`,
                    transition:'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  }}>
                  {cartAdded
                    ? <><svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Added to Cart!</>
                    : <><svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>Add to Cart</>
                  }
                </button>
              </div>

              {/* WhatsApp */}
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="wa-btn"
                style={{
                  display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                  padding:'13px 0',borderRadius:12,textDecoration:'none',
                  background:`linear-gradient(135deg,#16a34a,#22c55e)`,
                  color:'white',fontWeight:800,fontSize:14,
                  boxShadow:`0 6px 20px #16a34a44`,
                  transition:'all 0.25s',
                }}>
                <WaIcon size={16}/>Chat Seller on WhatsApp
              </a>
            </div>

            {/* Seller card */}
            <div className="fade-in-5" style={{
              background:'white',borderRadius:18,
              border:`1.5px solid ${C.borderLight}`,
              padding:16,display:'flex',flexDirection:'column',gap:12,
              boxShadow:`0 4px 20px rgba(200,75,17,0.06)`,
            }}>
              <p style={{ fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textFaint }}>Seller</p>
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <div style={{
                  width:46,height:46,borderRadius:13,flexShrink:0,
                  background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,
                  color:'white',display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:20,fontWeight:900,boxShadow:`0 4px 12px ${C.primary}44`,
                }}>
                  {product.seller.charAt(0)}
                </div>
                <div>
                  <div style={{ display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' }}>
                    <p style={{ fontWeight:800,color:C.text,fontSize:14 }}>{product.seller}</p>
                    {product.sellerVerified && (
                      <span style={{ background:C.primaryBg,color:C.primary,fontSize:9,fontWeight:800,padding:'2px 8px',borderRadius:99 }}>✓ Verified</span>
                    )}
                  </div>
                  <p style={{ fontSize:11,color:C.textFaint,marginTop:2 }}>Member since {product.sellerJoined} · ⭐ 4.9 rating</p>
                </div>
              </div>
              <div style={{ display:'flex',alignItems:'flex-start',gap:9,background:C.surfaceDim,borderRadius:11,padding:'11px 13px',border:`1px solid ${C.borderLight}` }}>
                <svg style={{ width:13,height:13,color:C.primary,marginTop:2,flexShrink:0 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                </svg>
                <div>
                  <p style={{ fontSize:9,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',color:C.textFaint }}>Location</p>
                  <p style={{ fontSize:12,fontWeight:600,color:C.textMid,marginTop:2 }}>{product.sellerLocation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ SIMILAR PRODUCTS ══ */}
        <div style={{ marginTop:52 }}>
          <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:20 }}>
            <div style={{ width:4,height:26,borderRadius:99,background:`linear-gradient(180deg,${C.primary},${C.primaryLight})` }}/>
            <h2 style={{ fontSize:'clamp(18px,3vw,22px)',fontWeight:900,color:C.text }}>Similar Products</h2>
            <div style={{ flex:1,height:1,background:`linear-gradient(90deg,${C.borderLight},transparent)` }}/>
            <button onClick={() => navigate('/products')} style={{ fontSize:12,color:C.primary,fontWeight:700,background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
              View All
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
            </button>
          </div>

          <div className="similar-grid">
            {similarProducts.map((p, idx) => (
              <div key={p.id} className="card-hover"
                style={{ background:'white',borderRadius:18,overflow:'hidden',border:`1.5px solid ${C.borderLight}`,animation:`floatUp 0.55s ${0.05+idx*0.07}s ease both` }}>
                <div style={{ position:'relative',overflow:'hidden',aspectRatio:'4/3',background:C.primaryBg }}>
                  <img src={p.images?.[0]} alt={p.name} className="card-img" style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}/>
                  {p.lowStock && (
                    <span style={{ position:'absolute',top:9,left:9,background:C.danger,color:'white',fontSize:9,fontWeight:800,padding:'3px 9px',borderRadius:99,letterSpacing:'0.06em',textTransform:'uppercase' }}>
                      Low Stock
                    </span>
                  )}
                </div>
                <div style={{ padding:'12px 13px 14px' }}>
                  <h3 style={{ fontWeight:800,fontSize:13,color:C.text,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.name}</h3>
                  <p style={{ fontSize:11,color:C.textFaint,marginBottom:9,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.seller}</p>
                  <div style={{ display:'flex',gap:4,marginBottom:10 }}>
                    {p.colors.map((color,i) => (
                      <span key={i} style={{ width:14,height:14,borderRadius:'50%',background:color,border:'2px solid white',outline:`1px solid ${C.border}`,display:'inline-block' }}/>
                    ))}
                  </div>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                    <p style={{ fontSize:17,fontWeight:900,color:C.primary }}>{p.price}</p>
                    <button onClick={() => navigate(`/products/${p.id}`)}
                      style={{ padding:'6px 13px',background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,color:'white',fontWeight:800,fontSize:11,border:'none',borderRadius:8,cursor:'pointer',transition:'all 0.2s' }}
                      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';}}
                      onMouseLeave={e=>{e.currentTarget.style.transform='none';}}>
                      View →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ══════════════════════ STICKY BOTTOM BAR (mobile) ══════════════════════ */}
      <div className="sticky-bar" style={{
        position:'fixed',bottom:0,left:0,right:0,zIndex:40,
        background:'rgba(255,255,255,0.97)',backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        borderTop:`1px solid ${C.borderLight}`,
        padding:'10px 14px',gap:8,alignItems:'center',
        boxShadow:'0 -4px 20px rgba(0,0,0,0.07)',
      }}>
        {/* Qty stepper */}
        <div style={{ display:'flex',alignItems:'center',border:`1.5px solid ${C.border}`,borderRadius:10,overflow:'hidden',background:'white',flexShrink:0 }}>
          <button onClick={() => setQuantity(q=>Math.max(1,q-1))}
            style={{ width:34,height:42,border:'none',background:'transparent',cursor:'pointer',fontSize:18,color:C.textMid,fontWeight:700 }}>−</button>
          <span style={{ width:30,textAlign:'center',fontSize:13,fontWeight:900,color:C.text }}>{quantity}</span>
          <button onClick={() => setQuantity(q=>Math.min(product.quantity??99,q+1))}
            style={{ width:34,height:42,border:'none',background:'transparent',cursor:'pointer',fontSize:18,color:C.textMid,fontWeight:700 }}>+</button>
        </div>

        {/* Add to cart */}
        <button onClick={handleAddToCart}
          style={{
            flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,
            padding:'11px 0',borderRadius:10,border:'none',cursor:'pointer',
            background: cartAdded ? `linear-gradient(135deg,${C.success},#22c55e)` : `linear-gradient(135deg,${C.primary},${C.primaryLight})`,
            color:'white',fontWeight:800,fontSize:13,
            boxShadow: cartAdded ? `0 4px 14px ${C.success}55` : `0 4px 14px ${C.primary}44`,
            transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
          {cartAdded
            ? <><svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Added!</>
            : <>🛒 Add to Cart</>
          }
        </button>

        {/* WhatsApp */}
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
          style={{
            display:'flex',alignItems:'center',justifyContent:'center',gap:5,
            padding:'11px 13px',
            background:`linear-gradient(135deg,#16a34a,#22c55e)`,
            color:'white',fontWeight:800,fontSize:12,borderRadius:10,
            textDecoration:'none',flexShrink:0,
            boxShadow:`0 4px 14px #16a34a44`,
            transition:'all 0.25s',
          }}>
          <WaIcon size={14}/> Chat
        </a>
      </div>
    </div>
  );
}
