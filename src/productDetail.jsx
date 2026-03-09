import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './images/a00b2158-82d4-4c37-8602-a33e18a7a9f2_removalai_preview.png';

// ─── BagSearch-inspired Color Palette ───────────────────────────────────────────
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

// ─── Mock Data ────────────────────────────────────────────────────────────────
const product = {
  id: 1,
  name: "The Midnight Satchel",
  brand: "Luxury Bags Co.",
  seller: "Chukwuemeka Stores",
  sellerPhone: "2348147061837",
  sellerLocation: "Balogun Market, Lagos Island, Lagos",
  sellerVerified: true,
  sellerJoined: "2021",
  sub: "Italian Leather • Midnight Blue",
  description: "Crafted from premium Italian leather, The Midnight Satchel combines timeless elegance with modern functionality. Its structured silhouette and deep midnight blue tone make it the perfect statement piece for any occasion — from boardrooms to evening soirées.",
  price: "$2,450",
  originalPrice: "$2,900",
  quantity: 12,
  lowStock: false,
  rating: 4.7,
  reviews: 128,
  colors: ["#1a1a2e", "#16213e", "#0f3460"],
  sizes: ["XS", "S", "M", "L", "XL"],
  category: "Satchels",
  images: [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBbc5dxE3grW8p08E8TtaWN5L8YARMDRthJf6pzKLJE7uj3eaIfhldAvqZBwEJ869mgq48jOcjGej6zLtlrV4spzEjXI3d3TnAtGQYDXhni_ERAbMCU5__dE5BTSySucF66-Tam-NPTm_L4wqZ4ri_euRX9gy3LOCm6Q8qwFgqFbplPdoz-wl2wnadQozRro5HBbjY0oG7WHOAFumWG3QkohBlRJf0LbZVdQs-EXHx9fofCLvfgCPZD96qWxLrXQCkDmEa1lpUdDF8",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC4l4XxqEhg8z3Flsf7ZlIUFWrALv7ps665xW56yrgFRslzAdD8YE8CoGD-eHc5CacM6ltr04XU04cFLCpo8kDWGQ_weuz7LJtzNEiwKXnDPmS1dFGrUin6u_w_KTD22tWJNcoIDmUEnnpE16CoUlghbfJ2e8VbxUV9NMUovHe1m0JdZmWvgSoLg7m8tCVCrIoUA2AMfdq2nGHljOnIjvN70QLD3Fj3DB2ZrxBERaq5OsNIfnX3c1t8u90vZG9fObqWGRCJkS7Lu1E",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBzVp1X2BUmdMSacdYElQUo1EI0AX_HNnADAw0PqFaM21IZLnoz6FHGphS31RK7sGzuTWcAkDVJK3MffDwMu8j08stgkWwTOSMv3b22bG7UdLKwQkzxfBWXdCbaYcDRjP2fiM9QzE9eq4RxVtFRxag3qQJ2IGsQveOf1NFHld9r4KFty1XXBbtDWXmK0y3PRdfG7CU6avgFtgyBtBegIo7AgdFiUMuXSmQvxDuP-jxNqqjbzKXoD16k_L5VQOm2xKo5TPfiEegqZd8",
  ],
};

const similarProducts = [
  { id: 2, name: "Ivory Essential Tote", seller: "Eco Style Hub", price: "$1,800", lowStock: true, colors: ["#f5f0e8","#e8ddd0","#d4c5b0"], src: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2iIgrfiMmBYx39D4_vHqJgAshrgoMIswLRfc2TNvfzLU12RyRG8nYTV1JSaGLpieTiA4SFxSz28wVJu8RVEbJzuVBbJbm6Gj5XK9oEHZunRQAVk_1t0P2NjMKC3plNviwYC5tcEKM-Va_JQwOW6RTDFxwhgZ-7Nrxc3I_zAk8i6QRqKlYvomRE5405JaFLrDywqdjnveGzzlneGcygTz_tQjdyk0NKuib_RBkzl9yaB4TmD9ec64_I1ha5hAbnVobuns0GjFuACo" },
  { id: 3, name: "Azure Mini Crossbody", seller: "Trendy Fashion Hub", price: "$1,250", lowStock: false, colors: ["#4a90d9","#357abd","#2868a8"], src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWO3irJ8GaADXHeVY-yLkBtsMwf3aoWwrPn6wqNY6K3DQq5LRcnFU6uJLYrYogD3twAiyFOntXJo8lQB3TyvMSVyRVC83zW6fHePyMWWYMM7uMNr0NFSVsU5mMhmgLZLRetdBuW-wV7IZDu8YwfunNKPxxcKjQYjjrdIwnPqXIVJzFMkZQjSnuYmsGn-3_UCSVtFpy_q12OcXgiujP6FAg01qNspjZ-dZzUa6E-_Vu12dwOpIL1c7srZV9Y8-FziRBfEBc_BMZ3xk" },
  { id: 4, name: "Onyx Evening Clutch", seller: "Elite Accessories", price: "$3,100", lowStock: true, colors: ["#1a1a1a","#333333","#4d4d4d"], src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4l4XxqEhg8z3Flsf7ZlIUFWrALv7ps665xW56yrgFRslzAdD8YE8CoGD-eHc5CacM6ltr04XU04cFLCpo8kDWGQ_weuz7LJtzNEiwKXnDPmS1dFGrUin6u_w_KTD22tWJNcoIDmUEnnpE16CoUlghbfJ2e8VbxUV9NMUovHe1m0JdZmWvgSoLg7m8tCVCrIoUA2AMfdq2nGHljOnIjvN70QLD3Fj3DB2ZrxBERaq5OsNIfnX3c1t8u90vZG9fObqWGRCJkS7Lu1E" },
  { id: 5, name: "Crimson Structured Bag", seller: "Premium Leather Co.", price: "$3,200", lowStock: false, colors: ["#c0392b","#e74c3c","#922b21"], src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzVp1X2BUmdMSacdYElQUo1EI0AX_HNnADAw0PqFaM21IZLnoz6FHGphS31RK7sGzuTWcAkDVJK3MffDwMu8j08stgkWwTOSMv3b22bG7UdLKwQkzxfBWXdCbaYcDRjP2fiM9QzE9eq4RxVtFRxag3qQJ2IGsQveOf1NFHld9r4KFty1XXBbtDWXmK0y3PRdfG7CU6avgFtgyBtBegIo7AgdFiUMuXSmQvxDuP-jxNqqjbzKXoD16k_L5VQOm2xKo5TPfiEegqZd8" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const LogoIcon = ({ size = 26 }) => (
  <span style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', flexShrink: 0 }}>
    <img
      src={logoImage}
      alt="BagSearch logo"
      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', transform: 'scale(1.45)', transformOrigin: 'center', filter: 'drop-shadow(0 3px 8px rgba(201,75,44,0.25))' }}
    />
  </span>
);

const WaIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function StarRating({ rating }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:3 }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s <= Math.round(rating) ? C.primaryLight : C.border}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

// ─── Network Error Loader ─────────────────────────────────────────────────────
function NetworkLoader({ onRetry }) {
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(253,244,238,0.97)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      zIndex:100, gap:20,
    }}>
      <div style={{ position:'relative', width:64, height:64 }}>
        <div style={{
          position:'absolute', inset:0, borderRadius:'50%',
          border:`3px solid ${C.borderLight}`,
        }}/>
        <div style={{
          position:'absolute', inset:0, borderRadius:'50%',
          border:`3px solid transparent`,
          borderTopColor: C.primary,
          animation:'spin 1s linear infinite',
        }}/>
        <div style={{
          position:'absolute', inset:8,
          display:'flex', alignItems:'center', justifyContent:'center',
          color: C.primary,
        }}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"/>
          </svg>
        </div>
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:4 }}>No connection</p>
        <p style={{ fontSize:12, color:C.textMuted }}>Check your network and try again</p>
      </div>
      <button
        onClick={onRetry}
        style={{
          padding:'10px 24px', borderRadius:100, border:'none', cursor:'pointer',
          background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,
          color:'white', fontWeight:800, fontSize:13,
          boxShadow:`0 4px 14px ${C.primary}44`,
          transition:'transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform='none'}
      >
        Retry
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductDetail() {
  const navigate = useNavigate();
  const [activeImg, setActiveImg] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartAdded, setCartAdded] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [imgZoom, setImgZoom] = useState(false);

  // simulate page entry animation
  useEffect(() => {
    const t = setTimeout(() => setPageLoaded(true), 80);
    // detect offline
    const goOffline = () => setNetworkError(true);
    const goOnline = () => setNetworkError(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    if (!navigator.onLine) setNetworkError(true);
    return () => { clearTimeout(t); window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); };
  }, []);

  const handleAddToCart = () => {
    setCartAdded(true);
    setCartCount(c => c + quantity);
    setTimeout(() => setCartAdded(false), 2200);
  };

  const whatsappMsg = encodeURIComponent(`Hi! I'm interested in the *${product.name}* by ${product.brand} listed at ${product.price}. Is it still available?`);
  const whatsappUrl = `https://wa.me/${product.sellerPhone}?text=${whatsappMsg}`;

  const discount = Math.round((1 - 2450 / 2900) * 100);
  const openCartInProducts = () => navigate('/products', { state: { openCart: true } });

  return (
    <div style={{
      minHeight:'100vh',
      background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${C.primaryBg} 0%, #fff 60%)`,
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
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes badgePop { 0%{transform:scale(0)} 60%{transform:scale(1.25)} 100%{transform:scale(1)} }
        @keyframes waveIn { from{clip-path:inset(0 100% 0 0)} to{clip-path:inset(0 0% 0 0)} }
        @keyframes dotBounce { 0%,80%,100%{transform:scale(0);opacity:0} 40%{transform:scale(1);opacity:1} }

        .fade-in { animation: floatUp 0.55s ease both; }
        .fade-in-d1 { animation: floatUp 0.55s 0.08s ease both; }
        .fade-in-d2 { animation: floatUp 0.55s 0.16s ease both; }
        .fade-in-d3 { animation: floatUp 0.55s 0.24s ease both; }
        .fade-in-d4 { animation: floatUp 0.55s 0.32s ease both; }
        .fade-in-d5 { animation: floatUp 0.55s 0.4s ease both; }

        .thumb-btn { transition: transform 0.25s ease, border-color 0.2s; }
        .thumb-btn:hover { transform: scale(1.04); }

        .size-btn { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        .size-btn:hover { transform: scale(1.06); }

        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; cursor:pointer; }
        .card-hover:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(200,75,17,0.13); }
        .card-hover:hover .card-img-inner { transform: scale(1.05); }
        .card-img-inner { transition: transform 0.5s ease; }

        .cta-btn { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .cta-btn:hover { transform: translateY(-2px) scale(1.02); }
        .cta-btn:active { transform: scale(0.97); }

        .wa-btn { transition: all 0.25s ease; }
        .wa-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }

        .wishlist-btn { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .wishlist-btn:hover { transform: scale(1.18); }
        .wishlist-btn.active { animation: pulse 0.4s ease; }

        .bar-accent {
          height:3px;
          background: linear-gradient(90deg, ${C.primary}, ${C.primaryLight}, ${C.accent}, ${C.primaryLight}, ${C.primary});
          background-size: 300% auto;
          animation: gradShift 4s ease-in-out infinite;
        }

        .img-zoom { transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94); cursor:zoom-in; }
        .img-zoom:hover { transform: scale(1.04); }
        .img-zoom.zoomed { transform: scale(1.08); cursor:zoom-out; }

        .badge-new { animation: badgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }

        .progress-track { background: ${C.borderLight}; border-radius:99px; overflow:hidden; }
        .progress-fill {
          height:100%;
          background: linear-gradient(90deg, ${C.primary}, ${C.primaryLight});
          border-radius:99px;
          animation: waveIn 1.2s 0.5s ease both;
        }

        /* Sticky bottom bar */
        .sticky-bar {
          display:none;
        }
        @media (max-width:767px) {
          .sticky-bar { display:flex; }
          .desktop-cta { display:none !important; }
          .main-wrap { padding-bottom: 84px; }
        }
        @media (min-width:768px) {
          .sticky-bar { display:none !important; }
          .main-wrap { padding-bottom: 0; }
        }

        /* Responsive grid */
        .product-grid {
          display:grid;
          grid-template-columns:1fr;
          gap:28px;
        }
        @media (min-width:900px) {
          .product-grid { grid-template-columns:1fr 1fr; gap:48px; }
        }
        .similar-grid {
          display:grid;
          grid-template-columns:repeat(2,1fr);
          gap:14px;
        }
        .mobile-only {}
        .desktop-only { display: flex; }
        @media (min-width:768px) {
          .similar-grid { grid-template-columns:repeat(4,1fr); gap:20px; }
          .mobile-only { display: none !important; }
        }
        @media (max-width:767px) {
          .desktop-only { display: none !important; }
        }
      `}</style>

      {/* Network Error Overlay */}
      {networkError && <NetworkLoader onRetry={() => window.location.reload()} />}

      {/* ═══ HEADER ═══ */}
      <header style={{
        position:'sticky', top:0, zIndex:50,
        background:'rgba(255,255,255,0.92)',
        backdropFilter:'blur(20px)',
        borderBottom:`1px solid ${C.borderLight}`,
        boxShadow:`0 1px 24px rgba(200,75,17,0.06)`,
      }}>
        <div className="bar-accent" />
        <div style={{ maxWidth:1320, margin:'0 auto', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', height:60 }}>

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            style={{ padding:8, border:'none', background:'transparent', cursor:'pointer', color:C.textMid, borderRadius:8 }}
            className="mobile-only"
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
            </svg>
          </button>

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:7, color:C.primary, cursor:'pointer', userSelect:'none' }}>
            <LogoIcon size="clamp(34px, 5vw, 50px)" />
            <span style={{ fontSize:19, fontWeight:900, color:C.text, letterSpacing:'-0.6px' }}>
              Bag<span style={{ color:C.primary }}>Search</span>
            </span>
          </div>

          {/* Desktop nav */}
          <nav style={{ display:'flex', alignItems:'center', gap:8 }}>
            {/* Search */}
            <button className="desktop-only" style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'8px 16px', borderRadius:100,
              border:'none',
              background:'transparent', cursor:'pointer', color:C.textMuted,
              fontSize:12, fontWeight:600,
              transition:'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color=C.primary; }}
              onMouseLeave={e => { e.currentTarget.style.color=C.textMuted; }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35"/></svg>
              Search
            </button>

            {/* Cart */}
            <button style={{ position:'relative', padding:10, borderRadius:12, border:`1.5px solid ${C.border}`, background:C.surfaceDim, cursor:'pointer', color:C.textMid, transition:'all 0.2s' }}
              onClick={openCartInProducts}
              onMouseEnter={e => { e.currentTarget.style.background=C.primaryBg; e.currentTarget.style.borderColor=C.primaryBorder; }}
              onMouseLeave={e => { e.currentTarget.style.background=C.surfaceDim; e.currentTarget.style.borderColor=C.border; }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
              {cartCount > 0 && (
                <span className="badge-new" style={{ position:'absolute', top:-5, right:-5, minWidth:18, height:18, padding:'0 4px', background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`, color:'white', fontSize:9, fontWeight:900, borderRadius:99, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid white' }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Back to shop */}
            <button style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'8px 16px', borderRadius:100,
              border:`1.5px solid ${C.primaryBorder}`,
              background:C.primaryBg, cursor:'pointer',
              color:C.primary, fontSize:12, fontWeight:700,
              transition:'all 0.2s',
            }}
              onClick={() => navigate('/products')}
              onMouseEnter={e => { e.currentTarget.style.background=C.primary; e.currentTarget.style.color='white'; }}
              onMouseLeave={e => { e.currentTarget.style.background=C.primaryBg; e.currentTarget.style.color=C.primary; }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
              Back to Shop
            </button>
          </nav>
        </div>
      </header>

      {/* ═══ MOBILE SIDEBAR ═══ */}
      {isSidebarOpen && (
        <div className="mobile-only" style={{ position:'fixed', inset:0, background:'rgba(26,10,0,0.4)', zIndex:60 }} onClick={() => setIsSidebarOpen(false)}/>
      )}
      <div className="mobile-only" style={{
        position:'fixed', top:0, left:0, height:'100%', width:260,
        background:'white', zIndex:70,
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
        boxShadow:`6px 0 32px rgba(200,75,17,0.1)`,
        padding:'20px 16px',
        display:'flex', flexDirection:'column', gap:12,
      }}>
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
          <button onClick={() => setIsSidebarOpen(false)} style={{ width:32, height:32, borderRadius:8, border:'none', background:C.primaryBg, color:C.primary, cursor:'pointer', fontSize:14, fontWeight:800 }}>✕</button>
        </div>
        {[{ label:'Profile', icon:'👤', action: () => navigate('/profile') },{ label:`Cart ${cartCount>0?`(${cartCount})`:''}`, icon:'🛒', action: openCartInProducts }].map(({ label, icon, action }) => (
          <button key={label} onClick={() => { setIsSidebarOpen(false); action?.(); }} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, border:'none', background:'transparent', cursor:'pointer', color:C.text, fontSize:14, fontWeight:600, textAlign:'left', transition:'all 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.background=C.primaryBg; e.currentTarget.style.color=C.primary; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=C.text; }}>
            <span>{icon}</span><span>{label}</span>
          </button>
        ))}
        <hr style={{ border:`1px solid ${C.borderLight}` }}/>
        <button onClick={() => navigate('/products')} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, border:'none', background:'transparent', cursor:'pointer', color:C.primary, fontSize:14, fontWeight:700, textAlign:'left' }}>
          ← Back to Shop
        </button>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="main-wrap" style={{ maxWidth:1320, margin:'0 auto', padding:'28px 20px 40px' }}>

        {/* Breadcrumb */}
        <nav className="fade-in" style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:C.textFaint, marginBottom:24, flexWrap:'wrap' }}>
          <span style={{ cursor:'pointer', transition:'color 0.2s' }} onMouseEnter={e=>e.target.style.color=C.primary} onMouseLeave={e=>e.target.style.color=C.textFaint}>Home</span>
          <span style={{ color:C.borderLight }}>›</span>
          <span style={{ cursor:'pointer' }}>{product.category}</span>
          <span style={{ color:C.borderLight }}>›</span>
          <span style={{ color:C.textMid, fontWeight:600 }}>{product.name}</span>
        </nav>

        {/* ═══ MAIN GRID ═══ */}
        <div className="product-grid">

          {/* LEFT: Images */}
          <div className="fade-in-d1" style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* Hero image */}
            <div style={{
              position:'relative', borderRadius:24, overflow:'hidden',
              background:`linear-gradient(135deg, ${C.primaryBg}, ${C.primaryPale})`,
              border:`1.5px solid ${C.borderLight}`,
              aspectRatio:'4/3',
              boxShadow:`0 8px 40px rgba(200,75,17,0.1)`,
            }}>
              <img
                src={product.images[activeImg]}
                alt={product.name}
                className={`img-zoom${imgZoom?' zoomed':''}`}
                onClick={() => setImgZoom(z => !z)}
                style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
              />

              {/* Gradient overlay bottom */}
              <div style={{
                position:'absolute', bottom:0, left:0, right:0, height:'40%',
                background:'linear-gradient(to top, rgba(26,10,0,0.15), transparent)',
                pointerEvents:'none',
              }}/>

              {/* Wishlist */}
              <button
                className={`wishlist-btn${wishlisted?' active':''}`}
                onClick={() => setWishlisted(w=>!w)}
                style={{
                  position:'absolute', top:14, right:14,
                  width:40, height:40, borderRadius:12,
                  border:'none', cursor:'pointer',
                  background:'rgba(255,255,255,0.9)',
                  backdropFilter:'blur(8px)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 2px 10px rgba(0,0,0,0.08)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlisted?'#dc2626':'none'} stroke={wishlisted?'#dc2626':C.textMid} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                </svg>
              </button>

              {/* Image counter */}
              <div style={{
                position:'absolute', bottom:12, left:12,
                background:'rgba(255,255,255,0.88)', backdropFilter:'blur(8px)',
                borderRadius:99, padding:'4px 12px',
                fontSize:11, fontWeight:700, color:C.textMid,
                border:`1px solid ${C.borderLight}`,
              }}>
                {activeImg + 1} / {product.images.length}
              </div>

              {/* Zoom hint */}
              <div style={{
                position:'absolute', bottom:12, right:12,
                background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)',
                borderRadius:99, padding:'4px 10px',
                fontSize:10, fontWeight:600, color:C.textMuted,
              }}>
                {imgZoom ? 'Zoom out' : 'Click to zoom'}
              </div>
            </div>

            {/* Thumbnails */}
            <div style={{ display:'flex', gap:10 }}>
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className="thumb-btn"
                  style={{
                    flex:1, borderRadius:12, overflow:'hidden', padding:0,
                    border:`2px solid ${activeImg===i ? C.primary : C.borderLight}`,
                    background:'transparent', cursor:'pointer',
                    aspectRatio:'1',
                    boxShadow: activeImg===i ? `0 0 0 3px ${C.primaryBg}` : 'none',
                    outline: activeImg===i ? `2px solid ${C.primaryBorder}` : 'none',
                  }}
                >
                  <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                </button>
              ))}
            </div>

            {/* Delivery info strip */}
            <div style={{
              display:'flex', gap:0, borderRadius:16,
              border:`1.5px solid ${C.borderLight}`,
              overflow:'hidden', background:C.surfaceDim,
            }}>
              {[
                { icon:'🚚', label:'Free Delivery', sub:'Orders over $500' },
                { icon:'🔄', label:'Easy Returns', sub:'30-day policy' },
                { icon:'🔒', label:'Secure Pay', sub:'256-bit SSL' },
              ].map((item, i) => (
                <div key={i} style={{
                  flex:1, padding:'12px 10px', textAlign:'center',
                  borderLeft: i>0 ? `1px solid ${C.borderLight}` : 'none',
                }}>
                  <div style={{ fontSize:18, marginBottom:3 }}>{item.icon}</div>
                  <p style={{ fontSize:10, fontWeight:800, color:C.textMid }}>{item.label}</p>
                  <p style={{ fontSize:9, color:C.textFaint }}>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Product Info */}
          <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

            {/* Brand + Name */}
            <div className="fade-in-d2">
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                <span style={{
                  background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,
                  color:'white', fontSize:9, fontWeight:800,
                  letterSpacing:'0.12em', textTransform:'uppercase',
                  padding:'4px 12px', borderRadius:99,
                }}>
                  {product.brand}
                </span>
                <span style={{
                  background:C.successBg, color:C.success,
                  fontSize:9, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase',
                  padding:'4px 10px', borderRadius:99,
                }}>
                  ✓ Authentic
                </span>
                <span style={{
                  background:C.dangerBg, color:C.danger,
                  fontSize:9, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase',
                  padding:'4px 10px', borderRadius:99,
                }}>
                  -{discount}% OFF
                </span>
              </div>
              <h1 style={{ fontSize:28, fontWeight:900, color:C.text, lineHeight:1.15, letterSpacing:'-0.5px', marginBottom:6 }}>
                {product.name}
              </h1>
              <p style={{ color:C.textMuted, fontSize:14, fontWeight:500 }}>{product.sub}</p>
            </div>

            {/* Rating + reviews */}
            <div className="fade-in-d2" style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, background:C.surfaceDim, border:`1.5px solid ${C.borderLight}`, borderRadius:100, padding:'6px 12px' }}>
                <StarRating rating={product.rating}/>
                <span style={{ fontSize:12, fontWeight:800, color:C.text }}>{product.rating}</span>
                <span style={{ fontSize:11, color:C.textFaint }}>({product.reviews})</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:C.textMuted }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:C.success, boxShadow:`0 0 0 3px ${C.successBg}` }}/>
                {product.quantity} in stock
              </div>
            </div>

            {/* Price */}
            <div className="fade-in-d2" style={{
              background:`linear-gradient(135deg, ${C.primaryBg}, ${C.primaryPale})`,
              borderRadius:16, padding:'16px 20px',
              border:`1.5px solid ${C.primaryBorder}`,
              display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8,
            }}>
              <div>
                <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
                  <span style={{ fontSize:34, fontWeight:900, color:C.primary, letterSpacing:'-1px' }}>{product.price}</span>
                  <span style={{ fontSize:16, color:C.textFaint, textDecoration:'line-through' }}>{product.originalPrice}</span>
                </div>
                <p style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>
                  You save <strong style={{ color:C.success }}>$450</strong> on this item
                </p>
              </div>
              {/* Stock progress */}
              <div style={{ minWidth:120 }}>
                <p style={{ fontSize:10, fontWeight:700, color:C.textFaint, marginBottom:5 }}>STOCK LEVEL</p>
                <div className="progress-track" style={{ height:6, width:'100%' }}>
                  <div className="progress-fill" style={{ width:`${(product.quantity/20)*100}%`, height:'100%' }}/>
                </div>
                <p style={{ fontSize:9, color:C.textMuted, marginTop:4 }}>🔒 Only {product.quantity} units left</p>
              </div>
            </div>

            {/* Description */}
            <p className="fade-in-d3" style={{ color:C.textMuted, fontSize:13.5, lineHeight:1.7 }}>{product.description}</p>

            {/* Colors */}
            <div className="fade-in-d3">
              <p style={{ fontSize:10, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:C.textFaint, marginBottom:10 }}>Color</p>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {product.colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    style={{
                      width:34, height:34, borderRadius:'50%', border:'none', cursor:'pointer',
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
            <div className="fade-in-d3">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <p style={{ fontSize:10, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:C.textFaint }}>Size</p>
                <button style={{ fontSize:11, color:C.primary, fontWeight:700, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Size guide →</button>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {product.sizes.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className="size-btn"
                    style={{
                      padding:'8px 16px', borderRadius:10,
                      border:`1.5px solid ${selectedSize===s ? C.primary : C.border}`,
                      background: selectedSize===s
                        ? `linear-gradient(135deg,${C.primary},${C.primaryLight})`
                        : 'white',
                      color: selectedSize===s ? 'white' : C.textMid,
                      fontSize:12, fontWeight:800, cursor:'pointer',
                      boxShadow: selectedSize===s ? `0 4px 12px ${C.primary}44` : 'none',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty + Cart + WhatsApp — desktop */}
            <div className="desktop-cta fade-in-d4" style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                {/* Qty */}
                <div style={{
                  display:'flex', alignItems:'center',
                  border:`1.5px solid ${C.border}`, borderRadius:12,
                  overflow:'hidden', background:'white',
                  boxShadow:`0 2px 8px rgba(0,0,0,0.04)`,
                }}>
                  <button onClick={() => setQuantity(q => Math.max(1,q-1))} style={{ width:42, height:46, border:'none', background:'transparent', cursor:'pointer', fontSize:20, color:C.textMid, transition:'background 0.2s', fontWeight:700 }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.primaryBg}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>−</button>
                  <span style={{ width:44, textAlign:'center', fontSize:15, fontWeight:900, color:C.text }}>{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(product.quantity,q+1))} style={{ width:42, height:46, border:'none', background:'transparent', cursor:'pointer', fontSize:20, color:C.textMid, transition:'background 0.2s', fontWeight:700 }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.primaryBg}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>+</button>
                </div>

                {/* Add to cart */}
                <button
                  onClick={handleAddToCart}
                  className="cta-btn"
                  style={{
                    flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    padding:'13px 0', borderRadius:12, border:'none', cursor:'pointer',
                    background: cartAdded
                      ? `linear-gradient(135deg,${C.success},#22c55e)`
                      : `linear-gradient(135deg,${C.primary},${C.primaryLight})`,
                    color:'white', fontWeight:800, fontSize:14,
                    boxShadow: cartAdded
                      ? `0 6px 20px ${C.success}55`
                      : `0 6px 20px ${C.primary}44`,
                    transition:'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                >
                  {cartAdded ? (
                    <><svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Added to Cart!</>
                  ) : (
                    <><svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>Add to Cart</>
                  )}
                </button>
              </div>

              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="wa-btn"
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'13px 0', borderRadius:12, textDecoration:'none',
                  background:`linear-gradient(135deg,#16a34a,#22c55e)`,
                  color:'white', fontWeight:800, fontSize:14,
                  boxShadow:`0 6px 20px #16a34a44`,
                }}
              >
                <WaIcon size={17}/>
                Chat Seller on WhatsApp
              </a>
            </div>

            {/* Seller Card */}
            <div className="fade-in-d5" style={{
              background:'white', borderRadius:20,
              border:`1.5px solid ${C.borderLight}`,
              padding:18, display:'flex', flexDirection:'column', gap:14,
              boxShadow:`0 4px 20px rgba(200,75,17,0.06)`,
            }}>
              <p style={{ fontSize:10, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:C.textFaint }}>Seller</p>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{
                  width:48, height:48, borderRadius:14, flexShrink:0,
                  background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,
                  color:'white', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:22, fontWeight:900,
                  boxShadow:`0 4px 12px ${C.primary}44`,
                }}>
                  {product.seller.charAt(0)}
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                    <p style={{ fontWeight:800, color:C.text, fontSize:15 }}>{product.seller}</p>
                    {product.sellerVerified && (
                      <span style={{ background:C.primaryBg, color:C.primary, fontSize:9, fontWeight:800, padding:'3px 8px', borderRadius:99 }}>✓ Verified</span>
                    )}
                  </div>
                  <p style={{ fontSize:11, color:C.textFaint, marginTop:2 }}>Member since {product.sellerJoined} • ⭐ 4.9 seller rating</p>
                </div>
              </div>
              <div style={{
                display:'flex', alignItems:'flex-start', gap:10,
                background:C.surfaceDim, borderRadius:12, padding:'12px 14px',
                border:`1px solid ${C.borderLight}`,
              }}>
                <svg style={{ width:15, height:15, color:C.primary, marginTop:2, flexShrink:0 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                </svg>
                <div>
                  <p style={{ fontSize:9, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:C.textFaint }}>Location</p>
                  <p style={{ fontSize:12, fontWeight:600, color:C.textMid, marginTop:2 }}>{product.sellerLocation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SIMILAR PRODUCTS ═══ */}
        <div style={{ marginTop:56 }}>
          {/* Section header */}
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
            <div style={{ width:4, height:28, borderRadius:99, background:`linear-gradient(180deg,${C.primary},${C.primaryLight})` }}/>
            <h2 style={{ fontSize:22, fontWeight:900, color:C.text }}>Similar Products</h2>
            <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${C.borderLight},transparent)` }}/>
            <button style={{ fontSize:12, color:C.primary, fontWeight:700, background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
              View All
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
            </button>
          </div>

          <div className="similar-grid">
            {similarProducts.map((p, idx) => (
              <div
                key={p.id}
                className="card-hover"
                style={{
                  background:'white', borderRadius:20, overflow:'hidden',
                  border:`1.5px solid ${C.borderLight}`,
                  animation:`floatUp 0.55s ${0.05 + idx * 0.07}s ease both`,
                }}
              >
                <div style={{ position:'relative', overflow:'hidden', aspectRatio:'4/3', background:C.primaryBg }}>
                  <img src={p.src} alt={p.name} className="card-img-inner" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                  {p.lowStock && (
                    <span style={{ position:'absolute', top:10, left:10, background:C.danger, color:'white', fontSize:9, fontWeight:800, padding:'3px 10px', borderRadius:99, letterSpacing:'0.06em', textTransform:'uppercase', boxShadow:`0 2px 8px ${C.danger}55`, animation:'pulse 2s ease infinite' }}>
                      Low Stock
                    </span>
                  )}
                  {/* Quick view overlay */}
                  <div style={{
                    position:'absolute', inset:0,
                    background:'rgba(26,10,0,0)', backdropFilter:'blur(0px)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all 0.3s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(26,10,0,0.18)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(26,10,0,0)'; }}
                  />
                </div>
                <div style={{ padding:'14px 14px 16px' }}>
                  <h3 style={{ fontWeight:800, fontSize:14, color:C.text, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</h3>
                  <p style={{ fontSize:11, color:C.textFaint, marginBottom:10, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.seller}</p>
                  <div style={{ display:'flex', gap:5, marginBottom:12 }}>
                    {p.colors.map((color,i) => (
                      <span key={i} style={{ width:16, height:16, borderRadius:'50%', background:color, border:'2px solid white', outline:`1px solid ${C.border}`, display:'inline-block' }}/>
                    ))}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <p style={{ fontSize:19, fontWeight:900, color:C.primary }}>{p.price}</p>
                    <button style={{
                      padding:'7px 14px', background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,
                      color:'white', fontWeight:800, fontSize:11, border:'none',
                      borderRadius:8, cursor:'pointer',
                      boxShadow:`0 3px 10px ${C.primary}44`,
                      transition:'all 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 6px 16px ${C.primary}44`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=`0 3px 10px ${C.primary}44`; }}
                    >
                      View →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ STICKY BOTTOM BAR (mobile) ═══ */}
      <div className="sticky-bar" style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:40,
        background:'rgba(255,255,255,0.97)', backdropFilter:'blur(20px)',
        borderTop:`1px solid ${C.borderLight}`,
        padding:'10px 16px', gap:8, alignItems:'center',
        boxShadow:'0 -6px 24px rgba(0,0,0,0.07)',
      }}>
        {/* qty */}
        <div style={{ display:'flex', alignItems:'center', border:`1.5px solid ${C.border}`, borderRadius:10, overflow:'hidden', background:'white', flexShrink:0 }}>
          <button onClick={() => setQuantity(q=>Math.max(1,q-1))} style={{ width:36,height:42,border:'none',background:'transparent',cursor:'pointer',fontSize:18,color:C.textMid,fontWeight:700 }}>−</button>
          <span style={{ width:32,textAlign:'center',fontSize:14,fontWeight:900,color:C.text }}>{quantity}</span>
          <button onClick={() => setQuantity(q=>Math.min(product.quantity,q+1))} style={{ width:36,height:42,border:'none',background:'transparent',cursor:'pointer',fontSize:18,color:C.textMid,fontWeight:700 }}>+</button>
        </div>
        {/* add to cart */}
        <button onClick={handleAddToCart} style={{
          flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,
          padding:'11px 0',borderRadius:10,border:'none',cursor:'pointer',
          background: cartAdded ? `linear-gradient(135deg,${C.success},#22c55e)` : `linear-gradient(135deg,${C.primary},${C.primaryLight})`,
          color:'white',fontWeight:800,fontSize:13,
          boxShadow: cartAdded ? `0 4px 14px ${C.success}55` : `0 4px 14px ${C.primary}44`,
          transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {cartAdded
            ? <><svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Added!</>
            : <>🛒 Add</>
          }
        </button>
        {/* whatsapp */}
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{
          display:'flex',alignItems:'center',justifyContent:'center',gap:6,
          padding:'11px 14px',background:`linear-gradient(135deg,#16a34a,#22c55e)`,
          color:'white',fontWeight:800,fontSize:12,borderRadius:10,
          textDecoration:'none',flexShrink:0,
          boxShadow:`0 4px 14px #16a34a44`,
        }}>
          <WaIcon size={14}/> Chat
        </a>
      </div>
    </div>
  );
}

