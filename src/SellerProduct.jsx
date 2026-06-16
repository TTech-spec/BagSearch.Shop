import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  primary: "#c84b11",
  primaryLight: "#f97316",
  primaryBg: "#fde8d8",
  primaryPale: "#fdf4ee",
  primaryBorder: "#f9c4a0",
  accent: "#ea580c",
  success: "#16a34a",
  successBg: "#dcfce7",
  danger: "#dc2626",
  surface: "#ffffff",
  surfaceDim: "#fdf8f5",
  border: "#f0d9cc",
  borderLight: "#f7ece4",
  text: "#1a0a00",
  textMid: "#5c3317",
  textMuted: "#9a6348",
  textFaint: "#c4957a",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatRelativeTime(value) {
  if (!value) return '—';
  const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  const ms = Date.now() - d.getTime();
  if (!Number.isFinite(ms)) return '—';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function mapBuyerViewRow(row) {
  const productName = row.product_name || row.products?.name || row.product?.name || 'Product';
  const img =
    row.product_image ||
    (Array.isArray(row.products?.images) ? row.products.images[0] : null) ||
    (Array.isArray(row.product?.images)  ? row.product.images[0]  : null) ||
    row.products?.image || row.product?.image ||
    'https://via.placeholder.com/96';
  const buyerName =
    row.buyer_name || row.users?.full_name || row.buyer?.full_name ||
    row.buyer_full_name || row.buyer_email || row.users?.email || 'Buyer';
  const buyerPhone = row.buyer_phone || row.users?.phone || row.buyer?.phone || row.phone || '';
  return {
    id: row.id, bag: productName, sku: '—', img,
    buyer: buyerName, phone: buyerPhone, source: row.source || row.view_source || 'direct',
    time: formatRelativeTime(row.viewed_at || row.created_at), replied: false,
  };
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────
const MS = ({ name, size = 22, style: s = {} }) => (
  <span style={{ fontFamily:"'Material Symbols Outlined'", fontWeight:"normal", fontStyle:"normal", fontSize:size, lineHeight:1, display:"inline-block", textTransform:"none", letterSpacing:"normal", whiteSpace:"nowrap", direction:"ltr", fontVariationSettings:"'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24", ...s }}>
    {name}
  </span>
);

const WhatsAppIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ─── Source badge ─────────────────────────────────────────────────────────────
function SourceBadge({ source }) {
  const map = {
    visual:   { icon:'image_search', label:'Visual Search', bg:C.primaryBg,  color:C.primary,   border:C.primaryBorder },
    direct:   { icon:'search',       label:'Direct Search', bg:C.surfaceDim, color:C.textMuted, border:C.border        },
    referral: { icon:'link',         label:'Referral',      bg:C.surfaceDim, color:C.textMuted, border:C.border        },
  };
  const s = map[source] || map.direct;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, background:s.bg, color:s.color, border:`1px solid ${s.border}`, whiteSpace:"nowrap" }}>
      <MS name={s.icon} size={13}/> {s.label}
    </span>
  );
}

// ─── Desktop inquiry row ──────────────────────────────────────────────────────
function InquiryRow({ row, index, ready }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"grid", gridTemplateColumns:"2.2fr 1.2fr 1.3fr 1fr 1.4fr", padding:"14px 24px", alignItems:"center", borderBottom:`1px solid ${C.borderLight}`, background:hov?"#fffaf5":"white", transition:"background 0.18s", opacity:ready?1:0, animation:ready?`fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) ${index*70+100}ms both`:"none" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:46, height:46, borderRadius:10, backgroundImage:`url('${row.img}')`, backgroundSize:"cover", backgroundPosition:"center", border:`1px solid ${C.borderLight}`, flexShrink:0, transition:"transform 0.3s", transform:hov?"scale(1.06)":"scale(1)" }}/>
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:C.text }}>{row.bag}</p>
          <p style={{ fontSize:11, color:C.textMuted, marginTop:1 }}>SKU: {row.sku}</p>
        </div>
      </div>
      <p style={{ fontSize:13, fontWeight:600, color:C.textMid }}>{row.buyer}</p>
      <SourceBadge source={row.source}/>
      <p style={{ fontSize:12, color:C.textMuted }}>{row.time}</p>
      <div style={{ textAlign:"right" }}>
        {row.replied ? (
          <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, background:C.surfaceDim, color:C.textMuted, fontSize:12, fontWeight:700 }}>
            <MS name="check_circle" size={16}/> Replied
          </span>
        ) : row.phone ? (
          <a href={`https://wa.me/${row.phone.replace(/\D/g, '')}?text=Hi%2C%20following%20up%20on%20${encodeURIComponent(row.bag)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, background:"#25D366", color:"white", fontSize:12, fontWeight:700, textDecoration:"none", transition:"all 0.2s", boxShadow:`0 2px 8px rgba(37,211,102,0.3)` }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 4px 12px rgba(37,211,102,0.4)`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`0 2px 8px rgba(37,211,102,0.3)`;}}>
            <WhatsAppIcon size={16}/> Chat on WhatsApp
          </a>
        ) : (
          <span style={{ fontSize:11, color:C.textFaint, fontWeight:600 }}>No phone available</span>
        )}
      </div>
    </div>
  );
}

// ─── Mobile inquiry card ──────────────────────────────────────────────────────
function InquiryCard({ row, index, ready }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:hov?"#fffaf5":"white", borderRadius:14, border:`1px solid ${C.borderLight}`, padding:"16px", marginBottom:12, transition:"all 0.25s cubic-bezier(0.22,1,0.36,1)", boxShadow:hov?`0 6px 24px rgba(200,75,17,0.07)`:`0 1px 6px rgba(0,0,0,0.04)`, transform:hov?"translateY(-2px)":"none", opacity:ready?1:0, animation:ready?`fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) ${index*80+100}ms both`:"none" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
        <div style={{ width:52, height:52, borderRadius:12, backgroundImage:`url('${row.img}')`, backgroundSize:"cover", backgroundPosition:"center", border:`1px solid ${C.borderLight}`, flexShrink:0 }}/>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.bag}</p>
          <p style={{ fontSize:11, color:C.textMuted }}>SKU: {row.sku}</p>
        </div>
        <SourceBadge source={row.source}/>
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div>
          <p style={{ fontSize:12, fontWeight:700, color:C.textMid }}>{row.buyer}</p>
          <p style={{ fontSize:11, color:C.textMuted }}>{row.time}</p>
        </div>
        {row.replied ? (
          <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, background:C.surfaceDim, color:C.textMuted, fontSize:12, fontWeight:700 }}>
            <MS name="check_circle" size={16}/> Replied
          </span>
        ) : row.phone ? (
          <a href={`https://wa.me/${row.phone.replace(/\D/g, '')}?text=Hi%2C%20following%20up%20on%20${encodeURIComponent(row.bag)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, background:"#25D366", color:"white", fontSize:12, fontWeight:700, textDecoration:"none", transition:"all 0.2s" }}
            onMouseEnter={e=>e.currentTarget.style.background="#22c35e"}
            onMouseLeave={e=>e.currentTarget.style.background="#25D366"}>
            <WhatsAppIcon size={15}/> Chat on WhatsApp
          </a>
        ) : (
          <span style={{ fontSize:11, color:C.textFaint, fontWeight:600 }}>No phone</span>
        )}
      </div>
    </div>
  );
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockVendorProducts = [
  { id: 1, name: "The Midnight Satchel", sub: "Italian Leather • Midnight Blue", price: 2450, quantity: 12, lowStock: false, category: "satchel", colors: ["#1a1a2e", "#16213e", "#0f3460"], src: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80", rating: 4.9, reviews: 48 },
  { id: 2, name: "Ember Tote Luxe", sub: "Full-Grain Leather • Cognac", price: 1950, quantity: 5, lowStock: true, category: "tote", colors: ["#8B4513", "#A0522D", "#CD853F"], src: "https://images.unsplash.com/photo-1594938298603-c8148c4b4357?w=500&q=80", rating: 4.7, reviews: 31 },
  { id: 3, name: "Onyx Evening Clutch", sub: "Polished Suede • Onyx Black", price: 3100, quantity: 2, lowStock: true, category: "evening", colors: ["#1a1a1a", "#333333", "#4d4d4d"], src: "https://images.unsplash.com/photo-1566150905458-1bf1a0e42c03?w=500&q=80", rating: 5.0, reviews: 22 },
  { id: 4, name: "Crimson Mini Bag", sub: "Napa Leather • Crimson", price: 1350, quantity: 9, lowStock: false, category: "mini", colors: ["#c0392b", "#e74c3c", "#922b21"], src: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&q=80", rating: 4.6, reviews: 57 },
  { id: 5, name: "Ivory Structured Tote", sub: "Vegan Leather • Ivory", price: 2200, quantity: 7, lowStock: false, category: "tote", colors: ["#f5f0e8", "#e8ddd0", "#d4c5b0"], src: "https://images.unsplash.com/photo-1575032617751-6ddec2089882?w=500&q=80", rating: 4.8, reviews: 39 },
  { id: 6, name: "Noir Crossbody", sub: "Genuine Leather • Noir", price: 1680, quantity: 4, lowStock: true, category: "crossbody", colors: ["#2c2c2c", "#111111", "#444444"], src: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80", rating: 4.5, reviews: 18 },
];

const mockReviews = [
  { id: 1, name: "Adaeze O.", avatar: "AO", rating: 5, date: "Feb 2025", text: "Absolutely stunning quality! The leather is buttery smooth and the stitching is immaculate. Worth every naira. Fast delivery to VI too!", product: "The Midnight Satchel", verified: true, helpful: 24, location: "Victoria Island" },
  { id: 2, name: "Funmi B.", avatar: "FB", rating: 5, date: "Jan 2025", text: "I've bought 3 bags from this vendor now. The quality is consistently exceptional. My friends always ask where I got them from!", product: "Ivory Structured Tote", verified: true, helpful: 18, location: "Lekki" },
  { id: 3, name: "Ngozi A.", avatar: "NA", rating: 4, date: "Dec 2024", text: "Beautiful bag, exactly as described. Delivery took 2 days which was great. Only minor issue was the packaging could be better for premium items.", product: "Ember Tote Luxe", verified: true, helpful: 11, location: "Ikoyi" },
  { id: 4, name: "Chidinma E.", avatar: "CE", rating: 5, date: "Nov 2024", text: "The Onyx clutch is EVERYTHING. I wore it to a wedding in Abuja and got so many compliments. The vendor even sent a handwritten note — such a class act!", product: "Onyx Evening Clutch", verified: true, helpful: 32, location: "Abuja" },
  { id: 5, name: "Temi K.", avatar: "TK", rating: 4, date: "Oct 2024", text: "Great bag for the price. Solid craftsmanship. Would've given 5 stars but the colour was slightly different from the photos — still gorgeous though.", product: "Crimson Mini Bag", verified: false, helpful: 7, location: "Surulere" },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.08) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useAnimatedCount(target, trigger) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let current = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(current);
      if (current >= target) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, [target, trigger]);
  return count;
}

// ─── Star Rating Component ─────────────────────────────────────────────────────
function Stars({ rating, size = 14, interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= (interactive ? (hovered || rating) : Math.round(rating)) ? "#f97316" : "#f0d9cc"}
          style={{ cursor: interactive ? "pointer" : "default", transition: "all 0.15s", transform: (interactive && i <= hovered) ? "scale(1.25)" : "scale(1)" }}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange && onChange(i)}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

// ─── Floating Particle ────────────────────────────────────────────────────────
function Particles() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: Math.random() * 6 + 2,
          height: Math.random() * 6 + 2,
          borderRadius: "50%",
          background: `rgba(200,75,17,${Math.random() * 0.3 + 0.05})`,
          animation: `particleFloat ${Math.random() * 8 + 5}s ease-in-out ${Math.random() * 4}s infinite alternate`,
        }} />
      ))}
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, index, onAddToCart }) {
  const [ref, visible] = useScrollReveal();
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (window.innerWidth < 768) return; // Disable tilt on mobile
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 12;
    const y = -((e.clientX - rect.left) / rect.width - 0.5) * 12;
    setTilt({ x, y });
  };

  const handleCart = (e) => {
    e.stopPropagation();
    setAdded(true);
    onAddToCart && onAddToCart(product);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
      onMouseMove={handleMouseMove}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? hovered && window.innerWidth >= 768 ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-6px) scale(1.02)` : "perspective(800px) rotateX(0) rotateY(0) translateY(0) scale(1)"
          : "translateY(40px) scale(0.95)",
        transition: visible
          ? "transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s, border-color 0.25s"
          : `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 90}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 90}ms`,
        background: "white",
        borderRadius: 20,
        overflow: "hidden",
        border: `1.5px solid ${hovered ? C.primaryBorder : C.borderLight}`,
        boxShadow: hovered ? `0 30px 60px rgba(200,75,17,0.18), 0 0 0 1px rgba(200,75,17,0.08)` : "0 4px 16px rgba(0,0,0,0.05)",
        cursor: "pointer",
        position: "relative",
        width: "100%",
        maxWidth: "100%",
      }}>
      {/* Shimmer on hover */}
      {hovered && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.15) 50%,transparent 70%)", animation: "shimCard 1.5s ease-in-out infinite", zIndex: 2, pointerEvents: "none", borderRadius: 20 }} />}

      {/* Image */}
      <div style={{ position: "relative", overflow: "hidden", height: "clamp(160px, 30vw, 220px)" }}>
        <img src={product.src} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)", transform: hovered ? "scale(1.1)" : "scale(1)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(26,10,0,0.5) 100%)", opacity: hovered ? 1 : 0, transition: "opacity 0.4s" }} />
        {product.lowStock && (
          <div style={{ position: "absolute", top: 10, left: 10, background: "linear-gradient(135deg,#dc2626,#ef4444)", color: "white", fontSize: "clamp(8px, 2vw, 9px)", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 20, boxShadow: "0 4px 12px rgba(220,38,38,0.5)", animation: "lowStockPulse 2s ease-in-out infinite" }}>⚡ Low Quantity</div>
        )}
        <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", borderRadius: 12, padding: "5px 10px", display: "flex", alignItems: "center", gap: 4 }}>
          <Stars rating={product.rating} size={10} />
          <span style={{ fontSize: 10, fontWeight: 800, color: C.primary }}>{product.rating}</span>
        </div>
        {/* Hover overlay label */}
        <div style={{ position: "absolute", bottom: 12, left: "50%", transform: hovered ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(16px)", opacity: hovered ? 1 : 0, transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)", background: "rgba(26,10,0,0.8)", backdropFilter: "blur(10px)", color: "white", fontSize: "clamp(8px, 2vw, 10px)", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", padding: "6px 18px", borderRadius: 20, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 3 }}>
          Quick View
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 14px" }}>
        <h3 style={{ fontWeight: 900, fontSize: "clamp(13px, 3vw, 15px)", color: C.text, marginBottom: 3, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{product.name}</h3>
        <p style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: C.textFaint, marginBottom: 10, fontWeight: 500 }}>{product.sub}</p>
        <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap" }}>
          {product.colors.map((col, i) => (
            <span key={i} style={{ width: "clamp(14px, 3vw, 16px)", height: "clamp(14px, 3vw, 16px)", borderRadius: "50%", background: col, border: "2px solid white", outline: `1.5px solid ${C.border}`, display: "inline-block", transition: "transform 0.2s", transform: hovered ? "scale(1.2)" : "scale(1)", transitionDelay: `${i * 30}ms` }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div>
            <p style={{ fontSize: "clamp(8px, 2vw, 9px)", color: C.textFaint, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 1 }}>{product.reviews} reviews</p>
            <Stars rating={product.rating} size={11} />
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 900, color: hovered ? C.primary : C.accent, letterSpacing: "-0.04em", lineHeight: 1, transition: "color 0.2s" }}>₦{product.price.toLocaleString()}</p>
            <p style={{ fontSize: "clamp(9px, 2vw, 10px)", color: C.textFaint, fontWeight: 600 }}>{product.quantity} left</p>
          </div>
        </div>
        <button onClick={handleCart} style={{
          width: "100%", padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 800, fontSize: "clamp(11px, 2.5vw, 12px)", letterSpacing: "0.04em",
          background: added ? "linear-gradient(135deg,#15803d,#16a34a)" : "linear-gradient(135deg,#c84b11,#f97316)",
          color: "white", transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: added ? "0 6px 18px rgba(22,163,74,0.45)" : "0 6px 16px rgba(200,75,17,0.4)",
          transform: added ? "scale(0.96)" : "scale(1)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        }}>
          {added ? (<><svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Added!</>) : (<>🛍️ Add to Cart</>)}
        </button>
      </div>
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review, index }) {
  const [ref, visible] = useScrollReveal();
  const [helpful, setHelpful] = useState(review.helpful);
  const [voted, setVoted] = useState(false);

  const avatarColors = [
    ["#c84b11", "#fde8d8"],
    ["#ea580c", "#fff7ed"],
    ["#9a3412", "#ffedd5"],
    ["#b45309", "#fef3c7"],
    ["#92400e", "#fffbeb"],
  ];
  const [bg, fg] = avatarColors[index % avatarColors.length];

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(-30px)",
      transition: `opacity 0.55s cubic-bezier(0.22,1,0.36,1) ${index * 80}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${index * 80}ms`,
      background: "white",
      borderRadius: 20,
      padding: "clamp(16px, 4vw, 24px)",
      border: `1.5px solid ${C.borderLight}`,
      boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
      position: "relative",
      overflow: "hidden",
      width: "100%",
    }}>
      {/* Decorative quote mark */}
      <div style={{ position: "absolute", top: 12, right: 20, fontSize: "clamp(40px, 10vw, 80px)", fontWeight: 900, color: C.primaryBg, lineHeight: 1, fontFamily: "Georgia, serif", pointerEvents: "none", userSelect: "none" }}>"</div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ width: "clamp(40px, 8vw, 46px)", height: "clamp(40px, 8vw, 46px)", borderRadius: "50%", background: `linear-gradient(135deg,${bg},${bg}dd)`, border: `2px solid ${fg}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "clamp(12px, 3vw, 14px)", color: bg, flexShrink: 0, boxShadow: `0 4px 12px ${bg}44` }}>
          <span style={{ color: "white" }}>{review.avatar}</span>
        </div>
        <div style={{ flex: 1, minWidth: "min(200px, 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
            <span style={{ fontWeight: 900, fontSize: "clamp(13px, 3vw, 14px)", color: C.text }}>{review.name}</span>
            {review.verified && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "clamp(8px, 2vw, 9px)", fontWeight: 800, background: C.successBg, color: C.success, border: "1px solid #a7f3d0", padding: "2px 7px", borderRadius: 20, letterSpacing: "0.08em" }}>
                <svg width="8" height="8" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> VERIFIED
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Stars rating={review.rating} size={12} />
            <span style={{ fontSize: "clamp(9px, 2vw, 10px)", color: C.textFaint, fontWeight: 600 }}>{review.date} · {review.location}</span>
          </div>
        </div>
      </div>

      <p style={{ fontSize: "clamp(12px, 3vw, 13px)", color: C.textMid, lineHeight: 1.75, marginBottom: 14, fontWeight: 500, position: "relative", zIndex: 1 }}>"{review.text}"</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: "clamp(8px, 2vw, 9px)", fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.1em" }}>Reviewed</span>
          <span style={{ fontSize: "clamp(9px, 2vw, 10px)", fontWeight: 800, color: C.primary, background: C.primaryBg, border: `1px solid ${C.primaryBorder}`, padding: "2px 9px", borderRadius: 20 }}>👜 {review.product}</span>
        </div>
        <button onClick={() => { if (!voted) { setHelpful(h => h + 1); setVoted(true); } }}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${voted ? C.primaryBorder : C.border}`, background: voted ? C.primaryBg : "white", color: voted ? C.primary : C.textFaint, fontSize: "clamp(10px, 2.5vw, 11px)", fontWeight: 700, cursor: voted ? "default" : "pointer", transition: "all 0.25s" }}>
          👍 {helpful}
        </button>
      </div>
    </div>
  );
}

// ─── Review Form ──────────────────────────────────────────────────────────────
function ReviewForm({ onSubmit }) {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [product, setProduct] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleSubmit = () => {
    if (!rating || !text.trim() || !name.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      onSubmit && onSubmit({ rating, name, text, product });
      setTimeout(() => { setSubmitted(false); setRating(0); setName(""); setText(""); setProduct(""); }, 3500);
    }, 1600);
  };

  const inputStyle = (field) => ({
    width: "100%", padding: "13px 16px", borderRadius: 14, border: `1.5px solid ${focused === field ? C.primary : C.border}`, background: focused === field ? "white" : C.surfaceDim, fontSize: "clamp(12px, 3vw, 13px)", color: C.text, fontFamily: "inherit", fontWeight: 500, outline: "none", transition: "all 0.25s", boxSizing: "border-box",
    boxShadow: focused === field ? `0 0 0 4px rgba(200,75,17,0.08)` : "none",
  });

  return (
    <div style={{ background: "white", borderRadius: 24, padding: "clamp(20px, 5vw, 32px)", border: `1.5px solid ${C.primaryBorder}`, boxShadow: `0 8px 40px rgba(200,75,17,0.1)`, position: "relative", overflow: "hidden" }}>
      {/* Top gradient stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg,#c84b11,#f97316,#ea580c,#f97316,#c84b11)", backgroundSize: "200% auto", animation: "meshFlow 3s ease-in-out infinite" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 26, flexWrap: "wrap" }}>
        <div style={{ width: "clamp(40px, 10vw, 48px)", height: "clamp(40px, 10vw, 48px)", borderRadius: 16, background: "linear-gradient(135deg,#c84b11,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(18px, 4vw, 20px)", boxShadow: "0 8px 20px rgba(200,75,17,0.4)" }}>✍️</div>
        <div>
          <h3 style={{ fontSize: "clamp(18px, 4vw, 20px)", fontWeight: 900, color: C.text, letterSpacing: "-0.03em", marginBottom: 2 }}>Write a Review</h3>
          <p style={{ fontSize: "clamp(11px, 2.5vw, 12px)", color: C.textFaint, fontWeight: 500 }}>Share your experience with this vendor</p>
        </div>
      </div>

      {submitted ? (
        <div style={{ textAlign: "center", padding: "40px 20px", animation: "bounceIn 0.6s ease both" }}>
          <div style={{ fontSize: "clamp(40px, 10vw, 56px)", marginBottom: 14, animation: "float 2s ease-in-out infinite" }}>🎉</div>
          <h4 style={{ fontSize: "clamp(18px, 4vw, 20px)", fontWeight: 900, color: C.text, marginBottom: 8 }}>Review Submitted!</h4>
          <p style={{ fontSize: "clamp(12px, 3vw, 13px)", color: C.textMuted, fontWeight: 500 }}>Thank you for sharing your experience</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Star Rating */}
          <div style={{ background: C.primaryBg, borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.primaryBorder}`, textAlign: "center" }}>
            <p style={{ fontSize: "clamp(10px, 2.5vw, 11px)", fontWeight: 800, color: C.textFaint, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Your Rating</p>
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap" }}>
              <Stars rating={rating} size={36} interactive onChange={setRating} />
            </div>
            {rating > 0 && (
              <p style={{ fontSize: "clamp(11px, 2.5vw, 12px)", fontWeight: 700, color: C.primary, marginTop: 8, animation: "fadeUp 0.3s ease both" }}>
                {["", "😞 Poor", "😐 Fair", "🙂 Good", "😊 Great", "🤩 Excellent!"][rating]}
              </p>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} style={inputStyle("name")} />
            <select value={product} onChange={e => setProduct(e.target.value)} onFocus={() => setFocused("product")} onBlur={() => setFocused(null)} style={{ ...inputStyle("product"), appearance: "none" }}>
              <option value="">Select product…</option>
              {mockVendorProducts.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          <textarea placeholder="Tell us about your experience — quality, delivery, packaging, etc." value={text} onChange={e => setText(e.target.value)} onFocus={() => setFocused("text")} onBlur={() => setFocused(null)} rows={4} style={{ ...inputStyle("text"), resize: "none" }} />

          <button onClick={handleSubmit} disabled={submitting || !rating || !text.trim() || !name.trim()}
            style={{
              width: "100%", padding: "15px 0", borderRadius: 14, border: "none", fontWeight: 900, fontSize: "clamp(13px, 3vw, 14px)", letterSpacing: "0.02em", cursor: (submitting || !rating || !text.trim() || !name.trim()) ? "not-allowed" : "pointer",
              background: (!rating || !text.trim() || !name.trim()) ? "#e5d5cc" : submitting ? "linear-gradient(135deg,#c84b11,#ea580c)" : "linear-gradient(135deg,#c84b11,#f97316)",
              color: "white", transition: "all 0.4s cubic-bezier(0.34,1.2,0.64,1)",
              boxShadow: (!rating || !text.trim() || !name.trim()) ? "none" : "0 8px 24px rgba(200,75,17,0.4)",
              transform: submitting ? "scale(0.97)" : "scale(1)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
            {submitting ? (
              <><div style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.35)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} /> Publishing Review…</>
            ) : "🌟 Publish Review"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Rating Breakdown ─────────────────────────────────────────────────────────
function RatingBreakdown({ reviews }) {
  const [ref, visible] = useScrollReveal();
  const avg = (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);
  const counts = [5, 4, 3, 2, 1].map(n => ({ star: n, count: reviews.filter(r => r.rating === n).length }));

  return (
    <div ref={ref} style={{ background: "white", borderRadius: 24, padding: "clamp(20px, 5vw, 28px)", border: `1.5px solid ${C.borderLight}`, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "all 0.55s cubic-bezier(0.22,1,0.36,1)" }}>
      <div style={{ textAlign: "center", marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${C.borderLight}` }}>
        <div style={{ fontSize: "clamp(48px, 10vw, 64px)", fontWeight: 900, color: C.primary, letterSpacing: "-0.05em", lineHeight: 1, marginBottom: 8 }}>{avg}</div>
        <Stars rating={parseFloat(avg)} size={20} />
        <p style={{ fontSize: "clamp(11px, 2.5vw, 12px)", color: C.textFaint, fontWeight: 600, marginTop: 6 }}>{reviews.length} verified reviews</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {counts.map(({ star, count }, i) => {
          const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
          return (
            <div key={star} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "clamp(10px, 2.5vw, 11px)", fontWeight: 800, color: C.textMid, width: 20, flexShrink: 0, textAlign: "right" }}>{star}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#f97316"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
              <div style={{ flex: 1, height: 8, background: C.borderLight, borderRadius: 99, overflow: "hidden", minWidth: 50 }}>
                <div style={{ height: "100%", width: visible ? `${pct}%` : "0%", background: star >= 4 ? "linear-gradient(90deg,#c84b11,#f97316)" : star === 3 ? "#f97316" : "#fb923c", borderRadius: 99, transition: `width 0.8s cubic-bezier(0.22,1,0.36,1) ${i * 80}ms`, boxShadow: pct > 20 ? "0 0 8px rgba(200,75,17,0.4)" : "none" }} />
              </div>
              <span style={{ fontSize: "clamp(9px, 2vw, 10px)", fontWeight: 700, color: C.textFaint, width: 28, flexShrink: 0 }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN VENDOR STOREFRONT ───────────────────────────────────────────────────
export default function VendorStorefront({ vendor: propVendor, onBack, onAddToCart }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const handleBack = onBack || (() => navigate('/products'));

  // Default vendor for demo
  const [vendor, setVendor] = useState(propVendor || location.state?.vendor || {
    id: "vendor-1", name: "Luxury Bags Co.", avatar: "👜", location: "Victoria Island, Lagos",
    rating: 4.9, reviews: 800, views: 18420, products: 47, joined: "Mar 2021",
    specialty: "Italian Leather", badge: "Top Rated",
    description: "Premium Italian leather bags crafted for the discerning buyer. Every piece is hand-stitched and comes with a certificate of authenticity. Based in Victoria Island, delivering across Nigeria.",
    tags: ["Luxury", "Leather", "Italian"], colors: ["#c84b11", "#f97316"],
  });

  const [activeTab, setActiveTab] = useState("products");
  const [filter, setFilter] = useState("all");
  const [vendorProducts, setVendorProducts] = useState([]);
  const [reviews, setReviews] = useState(mockReviews);
  const [buyerViews, setBuyerViews] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingViews, setLoadingViews] = useState(false);
  
  const [headerVisible, setHeaderVisible] = useState(false);
  const [floatMsg, setFloatMsg] = useState(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  const viewCount = useAnimatedCount(vendor.views, statsVisible);
  const reviewCount = useAnimatedCount(vendor.reviews, statsVisible);
  const productCount = useAnimatedCount(vendorProducts.length || vendor.products, statsVisible);

  useEffect(() => {
    setTimeout(() => setHeaderVisible(true), 80);
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.2 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  // Fetch real products if we have a real vendor ID
  useEffect(() => {
    async function fetchVendorData() {
      if (!vendor.id || vendor.id === "vendor-1") {
        setVendorProducts(mockVendorProducts);
        return;
      }
      try {
        setLoadingProducts(true);
        const { data, error } = await supabase.from('products').select('*').or(`user_id.eq.${vendor.id},seller_id.eq.${vendor.id}`).order('created_at', { ascending: false });
        if (error) throw error;
        if (data) {
          const formatted = data.map(p => ({
            id: p.id,
            name: p.name,
            sub: `${p.brand} • ${p.condition}`,
            price: parseFloat(p.price),
            quantity: p.quantity || 0,
            lowStock: (p.quantity || 0) < 5,
            category: p.category?.toLowerCase() || 'general',
            colors: Array.isArray(p.colors) ? p.colors : [],
            src: p.images?.[0] || 'https://via.placeholder.com/500',
            rating: 4.8,
            reviews: 12
          }));
          setVendorProducts(formatted);
        }
      } catch (err) {
        console.error('Error fetching vendor products:', err);
        setVendorProducts(mockVendorProducts);
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchVendorData();
  }, [vendor.id]);

  // Fetch real views if current user is this vendor
  useEffect(() => {
    async function fetchViews() {
      const isOwner = user && (user.id === vendor.id || user.id === vendor.user_id);
      if (!isOwner || !vendorProducts.length) return;

      try {
        setLoadingViews(true);
        const productIds = vendorProducts.map(p => p.id);
        const { data, error } = await supabase
          .from('product_views')
          .select(`id,viewed_at,source,buyer_name,buyer_phone,buyer_email,products:product_id(id,name,images),users!buyer_id(full_name,email,phone)`)
          .in('product_id', productIds)
          .order('viewed_at', { ascending: false })
          .limit(20);
        
        if (error) throw error;
        if (data) {
          setBuyerViews(data.map(mapBuyerViewRow));
        }
      } catch (err) {
        console.error('Error fetching views:', err);
      } finally {
        setLoadingViews(false);
      }
    }
    fetchViews();
  }, [user, vendor.id, vendorProducts]);

  const categories = ["all", ...new Set(vendorProducts.map(p => p.category))];
  const filtered = filter === "all" ? vendorProducts : vendorProducts.filter(p => p.category === filter);

  const handleAddToCart = (product) => {
    onAddToCart && onAddToCart(product);
    setFloatMsg(`${product.name} added to cart!`);
    setTimeout(() => setFloatMsg(null), 2200);
  };

  const handleNewReview = (review) => {
    setReviews(prev => [{
      id: Date.now(), name: review.name, avatar: review.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
      rating: review.rating, date: "Just now", text: review.text, product: review.product || "General", verified: false, helpful: 0, location: "Nigeria",
    }, ...prev]);
  };

  const avgRating = (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);

  // Mobile menu state for category filters (optional)
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg,${C.primaryPale} 0%,${C.surfaceDim} 20%,white 100%)`, fontFamily: "'Manrope',sans-serif", width: "100%", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&family=Cormorant+Garamond:wght@600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        
        /* Responsive keyframes */
        @keyframes meshFlow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimCard{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}
        @keyframes particleFloat{0%{transform:translateY(0) scale(1);opacity:0.3}100%{transform:translateY(-40px) scale(1.5);opacity:0}}
        @keyframes lowStockPulse{0%,100%{box-shadow:0 4px 12px rgba(220,38,38,0.5)}50%{box-shadow:0 4px 24px rgba(220,38,38,0.9)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounceIn{0%{opacity:0;transform:scale(0.7)}60%{opacity:1;transform:scale(1.05)}100%{transform:scale(1)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes floatMsg{0%{opacity:0;transform:translateX(-50%) translateY(20px)}15%{opacity:1;transform:translateX(-50%) translateY(0)}80%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-16px)}}
        @keyframes heroReveal{from{opacity:0;transform:translateY(30px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes tabUnderline{from{width:0}to{width:100%}}
        @keyframes badgePop{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
        @keyframes ringPulse{0%{transform:scale(1);opacity:0.6}100%{transform:scale(2);opacity:0}}
        
        /* Responsive classes */
        .cat-pill:hover{transform:translateY(-2px) scale(1.05)!important;}
        
        /* Responsive grid system */
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
          gap: clamp(12px, 3vw, 20px);
        }
        
        /* Responsive adjustments */
        @media (max-width: 640px) {
          .product-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .hero-content {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          
          .stat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          .reviews-layout {
            grid-template-columns: 1fr !important;
          }
          
          .sticky-sidebar {
            position: static !important;
            margin-top: 20px;
          }
        }
        
        @media (min-width: 641px) and (max-width: 1024px) {
          .product-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (min-width: 1025px) {
          .product-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        /* Mobile touch optimizations */
        @media (max-width: 768px) {
          button, .cat-pill, [role="button"] {
            min-height: 44px;
            min-width: 44px;
          }
          
          input, select, textarea {
            font-size: 16px !important; /* Prevents zoom on iOS */
          }
        }
        
        /* Safe area insets for modern mobile devices */
        @supports (padding: max(0px)) {
          body {
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
        }
      `}</style>

      {/* Float message - responsive positioning */}
      {floatMsg && <div style={{ 
        position: "fixed", 
        bottom: "max(16px, env(safe-area-inset-bottom))", 
        left: "50%", 
        transform: "translateX(-50%)",
        zIndex: 9999, 
        background: "linear-gradient(135deg,#c84b11,#f97316)", 
        color: "white", 
        padding: "clamp(10px, 3vw, 12px) clamp(18px, 5vw, 22px)", 
        borderRadius: 50, 
        fontSize: "clamp(12px, 3vw, 13px)", 
        fontWeight: 800, 
        whiteSpace: "nowrap", 
        boxShadow: "0 12px 40px rgba(200,75,17,0.5)", 
        animation: "floatMsg 2.2s ease both", 
        pointerEvents: "none", 
        display: "flex", 
        alignItems: "center", 
        gap: 8,
        maxWidth: "90vw",
      }}>
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{floatMsg}</span>
      </div>}

      {/* ── HERO BANNER ── */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        {/* Mesh gradient background */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,${vendor.colors[0]}22 0%,${vendor.colors[1]}15 50%,transparent 100%)` }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(200,75,17,0.06) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <Particles />

        {/* Decorative blobs - responsive sizing */}
        <div style={{ 
          position: "absolute", 
          right: "-20%", 
          top: "-20%", 
          width: "min(400px, 80vw)", 
          height: "min(400px, 80vw)", 
          borderRadius: "50%", 
          background: `radial-gradient(circle,${vendor.colors[1]}20 0%,transparent 70%)`, 
          filter: "blur(40px)", 
          animation: "float 8s ease-in-out infinite" 
        }} />
        <div style={{ 
          position: "absolute", 
          left: "-20%", 
          bottom: "-20%", 
          width: "min(300px, 60vw)", 
          height: "min(300px, 60vw)", 
          borderRadius: "50%", 
          background: `radial-gradient(circle,${vendor.colors[0]}18 0%,transparent 70%)`, 
          filter: "blur(30px)", 
          animation: "float 6s ease-in-out 2s infinite alternate" 
        }} />

        {/* Top bar */}
        <div style={{ height: 4, background: "linear-gradient(90deg,#c84b11,#f97316,#ea580c,#f97316,#c84b11)", backgroundSize: "200% auto", animation: "meshFlow 3s ease-in-out infinite" }} />

        <div style={{ 
          maxWidth: 1200, 
          margin: "0 auto", 
          padding: "clamp(16px, 5vw, 32px) clamp(16px, 4vw, 24px) clamp(24px, 6vw, 40px)", 
          position: "relative" 
        }}>
          {/* Back button */}
          {handleBack && (
            <button onClick={handleBack} style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 7, 
              padding: "clamp(8px, 2vw, 8px) clamp(12px, 3vw, 16px)", 
              borderRadius: 12, 
              border: `1.5px solid ${C.primaryBorder}`, 
              background: "rgba(255,255,255,0.7)", 
              backdropFilter: "blur(8px)", 
              color: C.primary, 
              fontSize: "clamp(11px, 2.5vw, 12px)", 
              fontWeight: 800, 
              cursor: "pointer", 
              marginBottom: "clamp(16px, 4vw, 24px)", 
              transition: "all 0.2s" 
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.transform = "translateX(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.7)"; e.currentTarget.style.transform = "none"; }}>
              ← Back to Vendors
            </button>
          )}

          {/* Hero content */}
          <div className="hero-content" style={{ 
            display: "flex", 
            alignItems: "flex-start", 
            gap: "clamp(16px, 4vw, 32px)", 
            opacity: headerVisible ? 1 : 0, 
            animation: headerVisible ? "heroReveal 0.7s cubic-bezier(0.22,1,0.36,1) both" : "none" 
          }}>
            {/* Avatar section */}
            <div style={{ position: "relative", flexShrink: 0, alignSelf: "center", margin: "0 auto 0 0" }}>
              {/* Pulsing rings */}
              <div style={{ position: "absolute", inset: "-12px", borderRadius: "50%", border: "1.5px solid rgba(200,75,17,0.25)", animation: "ringPulse 2s ease-out infinite" }} />
              <div style={{ position: "absolute", inset: "-6px", borderRadius: "50%", border: "1.5px solid rgba(200,75,17,0.18)", animation: "ringPulse 2s ease-out 0.6s infinite" }} />
              <div style={{ 
                width: "clamp(80px, 20vw, 110px)", 
                height: "clamp(80px, 20vw, 110px)", 
                borderRadius: "50%", 
                background: `linear-gradient(135deg,${vendor.colors[0]},${vendor.colors[1]})`, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: "clamp(32px, 8vw, 44px)", 
                boxShadow: `0 16px 48px ${vendor.colors[0]}55`, 
                border: "4px solid white", 
                position: "relative", 
                zIndex: 1 
              }}>
                {vendor.avatar}
              </div>
              {vendor.badge === "Top Rated" && (
                <div style={{ 
                  position: "absolute", 
                  bottom: "-6px", 
                  right: "-6px", 
                  background: "linear-gradient(135deg,#f59e0b,#f97316)", 
                  borderRadius: "50%", 
                  width: "clamp(28px, 7vw, 36px)", 
                  height: "clamp(28px, 7vw, 36px)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  border: "3px solid white", 
                  fontSize: "clamp(14px, 3.5vw, 16px)", 
                  boxShadow: "0 4px 12px rgba(245,158,11,0.5)", 
                  animation: "badgePop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.8s both", 
                  zIndex: 2 
                }}>⭐</div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <h1 style={{ 
                  fontSize: "clamp(1.5rem, 5vw, 2.6rem)", 
                  fontWeight: 900, 
                  color: C.text, 
                  letterSpacing: "-0.04em", 
                  fontFamily: "'Cormorant Garamond',serif", 
                  lineHeight: 1 
                }}>{vendor.name}</h1>
                {vendor.badge && <span style={{ 
                  fontSize: "clamp(9px, 2vw, 10px)", 
                  fontWeight: 900, 
                  background: "linear-gradient(135deg,#f59e0b,#f97316)", 
                  color: "white", 
                  padding: "4px 12px", 
                  borderRadius: 20, 
                  letterSpacing: "0.08em", 
                  textTransform: "uppercase", 
                  boxShadow: "0 4px 12px rgba(245,158,11,0.4)" 
                }}>{vendor.badge}</span>}
              </div>
              <p style={{ 
                fontSize: "clamp(12px, 3vw, 13px)", 
                color: C.textMuted, 
                marginBottom: 12, 
                fontWeight: 500, 
                display: "flex", 
                alignItems: "center", 
                gap: 6, 
                flexWrap: "wrap" 
              }}>
                <span>📍</span>{vendor.location} · <span>🗓️</span> Since {vendor.joined} · <span>💎</span> {vendor.specialty}
              </p>
              <p style={{ 
                fontSize: "clamp(13px, 3vw, 14px)", 
                color: C.textMid, 
                lineHeight: 1.75, 
                maxWidth: 560, 
                marginBottom: 16, 
                fontWeight: 500 
              }}>{vendor.description}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {vendor.tags.map(tag => (
                  <span key={tag} style={{ 
                    fontSize: "clamp(10px, 2.5vw, 11px)", 
                    fontWeight: 800, 
                    background: "rgba(255,255,255,0.8)", 
                    color: C.primary, 
                    border: `1.5px solid ${C.primaryBorder}`, 
                    padding: "4px 12px", 
                    borderRadius: 20, 
                    backdropFilter: "blur(4px)" 
                  }}>{tag}</span>
                ))}
                <span style={{ 
                  fontSize: "clamp(10px, 2.5vw, 11px)", 
                  fontWeight: 800, 
                  background: "rgba(255,255,255,0.8)", 
                  color: C.success, 
                  border: "1.5px solid #a7f3d0", 
                  padding: "4px 12px", 
                  borderRadius: 20, 
                  backdropFilter: "blur(4px)", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 4 
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block", animation: "ringPulse 2s ease-out infinite" }} />Active Seller
                </span>
              </div>
            </div>

            {/* Rating card */}
            <div style={{ 
              flexShrink: 0, 
              background: "rgba(255,255,255,0.85)", 
              backdropFilter: "blur(16px)", 
              borderRadius: 20, 
              padding: "clamp(16px, 4vw, 24px)", 
              border: `1.5px solid ${C.primaryBorder}`, 
              textAlign: "center", 
              boxShadow: "0 12px 40px rgba(200,75,17,0.1)", 
              minWidth: "min(140px, 100%)",
              width: "100%",
              maxWidth: "200px",
              marginTop: "clamp(12px, 3vw, 0)"
            }}>
              <div style={{ 
                fontSize: "clamp(32px, 8vw, 42px)", 
                fontWeight: 900, 
                color: C.primary, 
                letterSpacing: "-0.05em", 
                lineHeight: 1 
              }}>{avgRating}</div>
              <Stars rating={parseFloat(avgRating)} size={16} />
              <p style={{ 
                fontSize: "clamp(10px, 2.5vw, 11px)", 
                color: C.textFaint, 
                fontWeight: 700, 
                marginTop: 6 
              }}>{reviews.length} reviews</p>
              <div style={{ width: "100%", height: 1, background: C.borderLight, margin: "12px 0" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                <span style={{ fontSize: "clamp(10px, 2.5vw, 11px)", fontWeight: 700, color: C.success }}>100% Authentic</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div ref={statsRef} style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`, padding: "0 clamp(12px, 3vw, 24px)" }}>
        <div className="stat-grid" style={{ 
          maxWidth: 1200, 
          margin: "0 auto", 
          display: "grid", 
          gridTemplateColumns: "repeat(4,1fr)", 
          gap: 0 
        }}>
          {[
            { label: "Profile Views", value: viewCount, icon: "👁️", suffix: "" },
            { label: "Happy Buyers", value: 800, icon: "😊", suffix: "+" },
            { label: "Products Listed", value: productCount, icon: "👜", suffix: "" },
            { label: "Response Rate", value: 98, icon: "⚡", suffix: "%" },
          ].map((s, i) => (
            <div key={s.label} style={{ 
              padding: "clamp(12px, 3vw, 22px) clamp(8px, 2vw, 20px)", 
              textAlign: "center", 
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.15)" : "none" 
            }}>
              <div style={{ fontSize: "clamp(18px, 4vw, 22px)", marginBottom: 4 }}>{s.icon}</div>
              <div style={{ 
                fontSize: "clamp(18px, 4vw, 26px)", 
                fontWeight: 900, 
                color: "white", 
                letterSpacing: "-0.04em", 
                lineHeight: 1 
              }}>{s.value.toLocaleString()}{s.suffix}</div>
              <div style={{ 
                fontSize: "clamp(8px, 2vw, 10px)", 
                fontWeight: 700, 
                color: "rgba(255,255,255,0.7)", 
                textTransform: "uppercase", 
                letterSpacing: "0.1em", 
                marginTop: 3 
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ 
        position: "sticky", 
        top: 0, 
        zIndex: 40, 
        background: "rgba(255,255,255,0.95)", 
        backdropFilter: "blur(16px)", 
        borderBottom: `1px solid ${C.borderLight}`, 
        boxShadow: "0 2px 16px rgba(0,0,0,0.04)" 
      }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: "0 auto", 
          padding: "0 clamp(12px, 3vw, 24px)", 
          display: "flex", 
          gap: 0,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}>
          <style>{`
            div[style*="overflowX: auto"]::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {[
            { id: "products", label: "🛍️ Products", count: mockVendorProducts.length },
            { id: "reviews", label: "⭐ Reviews & Ratings", count: reviews.length },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "clamp(12px, 3vw, 16px) clamp(16px, 4vw, 24px)", 
              border: "none", 
              background: "transparent", 
              cursor: "pointer", 
              fontSize: "clamp(12px, 3vw, 13px)", 
              fontWeight: 800, 
              color: activeTab === tab.id ? C.primary : C.textFaint,
              borderBottom: `3px solid ${activeTab === tab.id ? C.primary : "transparent"}`, 
              transition: "all 0.25s", 
              display: "flex", 
              alignItems: "center", 
              gap: 8,
              whiteSpace: "nowrap",
            }}>
              {tab.label}
              <span style={{ 
                fontSize: "clamp(9px, 2vw, 10px)", 
                fontWeight: 900, 
                background: activeTab === tab.id ? C.primaryBg : C.borderLight, 
                color: activeTab === tab.id ? C.primary : C.textFaint, 
                padding: "2px 8px", 
                borderRadius: 20, 
                border: `1px solid ${activeTab === tab.id ? C.primaryBorder : C.border}` 
              }}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ 
        maxWidth: 1200, 
        margin: "0 auto", 
        padding: "clamp(20px, 5vw, 32px) clamp(12px, 3vw, 24px) clamp(40px, 8vw, 80px)" 
      }}>

        {/* ── PRODUCTS TAB ── */}
        {activeTab === "products" && (
          <div style={{ animation: "slideDown 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
            {/* Category filters */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              marginBottom: 24, 
              flexWrap: "wrap", 
              gap: 12 
            }}>
              <div>
                <h2 style={{ 
                  fontSize: "clamp(20px, 5vw, 22px)", 
                  fontWeight: 900, 
                  color: C.text, 
                  letterSpacing: "-0.03em", 
                  marginBottom: 2 
                }}>All Products</h2>
                <p style={{ 
                  fontSize: "clamp(11px, 2.5vw, 12px)", 
                  color: C.textFaint, 
                  fontWeight: 500 
                }}>{filtered.length} items available</p>
              </div>
              
              {/* Mobile filter toggle */}
              <button 
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                style={{
                  display: "none",
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: `1.5px solid ${C.primaryBorder}`,
                  background: "white",
                  color: C.primary,
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                  alignItems: "center",
                  gap: 8,
                }}
                className="mobile-filter-toggle"
              >
                <span>🔍</span> Filter Categories
              </button>
              
              <div style={{ 
                display: "flex", 
                gap: 7, 
                flexWrap: "wrap",
                width: "100%",
              }} className="category-filters">
                {categories.map((cat, i) => (
                  <button key={cat} className="cat-pill" onClick={() => setFilter(cat)} style={{
                    padding: "clamp(7px, 2vw, 7px) clamp(12px, 3vw, 16px)", 
                    borderRadius: 99, 
                    border: `1.5px solid ${filter === cat ? C.primary : C.border}`,
                    background: filter === cat ? "linear-gradient(135deg,#c84b11,#f97316)" : "white",
                    color: filter === cat ? "white" : C.textMid, 
                    fontSize: "clamp(11px, 2.5vw, 12px)", 
                    fontWeight: 800, 
                    cursor: "pointer",
                    transition: "all 0.25s cubic-bezier(0.34,1.2,0.64,1)", 
                    textTransform: "capitalize",
                    boxShadow: filter === cat ? "0 6px 18px rgba(200,75,17,0.4)" : "0 2px 8px rgba(0,0,0,0.04)",
                    animation: `fadeUp 0.4s ease ${i * 50}ms both`,
                  }}>{cat === "all" ? "✨ All" : cat}</button>
                ))}
              </div>
            </div>

            {/* Products grid */}
            <div className="product-grid">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} onAddToCart={handleAddToCart} />
              ))}
            </div>

            {/* Contact CTA */}
            <div style={{ 
              marginTop: 48, 
              background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`, 
              borderRadius: 24, 
              padding: "clamp(24px, 6vw, 40px) clamp(20px, 5vw, 36px)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              flexWrap: "wrap", 
              gap: 20, 
              position: "relative", 
              overflow: "hidden" 
            }}>
              <div style={{ 
                position: "absolute", 
                right: -40, 
                top: -40, 
                width: "clamp(150px, 30vw, 220px)", 
                height: "clamp(150px, 30vw, 220px)", 
                borderRadius: "50%", 
                background: "rgba(255,255,255,0.06)", 
                filter: "blur(20px)" 
              }} />
              <div style={{ position: "relative", width: "100%", maxWidth: 400 }}>
                <h3 style={{ 
                  fontSize: "clamp(20px, 5vw, 24px)", 
                  fontWeight: 900, 
                  color: "white", 
                  letterSpacing: "-0.03em", 
                  marginBottom: 8, 
                  fontFamily: "'Cormorant Garamond',serif" 
                }}>Looking for something specific?</h3>
                <p style={{ 
                  fontSize: "clamp(12px, 3vw, 13px)", 
                  color: "rgba(255,255,255,0.8)", 
                  fontWeight: 500, 
                  lineHeight: 1.6 
                }}>Chat directly with {vendor.name} on WhatsApp for custom orders, bulk pricing, or product inquiries.</p>
              </div>
              <a href={`https://wa.me/2348147061837?text=Hi%20${encodeURIComponent(vendor.name)}%2C%20I%20found%20you%20on%20BagSearch%20and%20would%20like%20to%20inquire%20about%20your%20products.`}
                target="_blank" rel="noopener noreferrer"
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 10, 
                  padding: "clamp(12px, 3vw, 14px) clamp(20px, 5vw, 28px)", 
                  background: "white", 
                  borderRadius: 14, 
                  fontWeight: 900, 
                  fontSize: "clamp(13px, 3vw, 14px)", 
                  color: C.primary, 
                  textDecoration: "none", 
                  boxShadow: "0 8px 28px rgba(0,0,0,0.15)", 
                  flexShrink: 0, 
                  transition: "all 0.25s", 
                  position: "relative",
                  width: "100%",
                  justifyContent: "center",
                  maxWidth: "300px",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.03)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.15)"; }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                Message on WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* ── REVIEWS TAB ── */}
        {activeTab === "reviews" && (
          <div style={{ animation: "slideDown 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
              gap: "clamp(16px, 4vw, 28px)", 
              alignItems: "start" 
            }} className="reviews-layout">

              {/* Left: reviews list */}
              <div style={{ minWidth: 0 }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  marginBottom: 22, 
                  flexWrap: "wrap", 
                  gap: 10 
                }}>
                  <div>
                    <h2 style={{ 
                      fontSize: "clamp(20px, 5vw, 22px)", 
                      fontWeight: 900, 
                      color: C.text, 
                      letterSpacing: "-0.03em", 
                      marginBottom: 2 
                    }}>Customer Reviews</h2>
                    <p style={{ 
                      fontSize: "clamp(11px, 2.5vw, 12px)", 
                      color: C.textFaint, 
                      fontWeight: 500 
                    }}>{reviews.length} verified purchases</p>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["All", "5★", "4★", "3★"].map(f => (
                      <button key={f} style={{ 
                        padding: "5px clamp(10px, 2vw, 13px)", 
                        borderRadius: 20, 
                        border: `1.5px solid ${C.border}`, 
                        background: f === "All" ? C.primaryBg : "white", 
                        color: f === "All" ? C.primary : C.textMid, 
                        fontSize: "clamp(10px, 2.5vw, 11px)", 
                        fontWeight: 800, 
                        cursor: "pointer", 
                        transition: "all 0.2s" 
                      }}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Form */}
                <div style={{ marginBottom: 28 }}>
                  <ReviewForm onSubmit={handleNewReview} />
                </div>

                {/* Reviews list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {reviews.map((review, i) => (
                    <ReviewCard key={review.id} review={review} index={i} />
                  ))}
                </div>
              </div>

              {/* Right: sticky rating breakdown */}
              <div style={{ position: "sticky", top: 80 }} className="sticky-sidebar">
                <RatingBreakdown reviews={reviews} />

                {/* Highlights */}
                <div style={{ 
                  marginTop: 16, 
                  background: "white", 
                  borderRadius: 20, 
                  padding: "clamp(18px, 4vw, 22px)", 
                  border: `1.5px solid ${C.borderLight}`, 
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)" 
                }}>
                  <h4 style={{ 
                    fontSize: "clamp(12px, 3vw, 13px)", 
                    fontWeight: 900, 
                    color: C.text, 
                    marginBottom: 14, 
                    letterSpacing: "-0.01em" 
                  }}>🏆 Vendor Highlights</h4>
                  {[
                    { icon: "📦", label: "Fast Dispatch", desc: "Ships within 24hrs", color: C.success, bg: C.successBg },
                    { icon: "✅", label: "Quality Assured", desc: "100% authentic items", color: "#2563eb", bg: "#dbeafe" },
                    { icon: "↩️", label: "Easy Returns", desc: "7-day return policy", color: C.primary, bg: C.primaryBg },
                    { icon: "💬", label: "Responsive", desc: "Replies within 1 hour", color: "#7c3aed", bg: "#ede9fe" },
                  ].map(h => (
                    <div key={h.label} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 12, 
                      padding: "10px 0", 
                      borderBottom: `1px solid ${C.borderLight}`,
                      flexWrap: "wrap" 
                    }}>
                      <div style={{ 
                        width: "clamp(32px, 8vw, 36px)", 
                        height: "clamp(32px, 8vw, 36px)", 
                        borderRadius: 10, 
                        background: h.bg, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontSize: "clamp(14px, 3.5vw, 16px)", 
                        flexShrink: 0 
                      }}>{h.icon}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ 
                          fontSize: "clamp(11px, 2.5vw, 12px)", 
                          fontWeight: 800, 
                          color: h.color 
                        }}>{h.label}</div>
                        <div style={{ 
                          fontSize: "clamp(9px, 2vw, 10px)", 
                          color: C.textFaint, 
                          fontWeight: 500 
                        }}>{h.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trust badges */}
                <div style={{ 
                  marginTop: 16, 
                  background: `linear-gradient(135deg,${C.primary}11,${C.primaryLight}08)`, 
                  borderRadius: 20, 
                  padding: "clamp(16px, 4vw, 20px)", 
                  border: `1.5px solid ${C.primaryBorder}`, 
                  textAlign: "center" 
                }}>
                  <p style={{ 
                    fontSize: "clamp(10px, 2.5vw, 11px)", 
                    fontWeight: 800, 
                    color: C.primary, 
                    marginBottom: 12, 
                    textTransform: "uppercase", 
                    letterSpacing: "0.1em" 
                  }}>BagSearch Certified</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
                    {["🔒 Secure", "⭐ Verified", "🛡️ Protected"].map(b => (
                      <span key={b} style={{ 
                        fontSize: "clamp(9px, 2vw, 10px)", 
                        fontWeight: 700, 
                        color: C.textMid 
                      }}>{b}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
