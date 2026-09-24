import { useState, useEffect, useContext, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';
import { deleteFromPinecone } from './services/visualSearch';
import NotificationsDropdown from './components/NotificationsDropdown';
import { useSEO, SITE_URL } from './hooks/useSEO';
import { normalizeWhatsAppNumber } from './utils/whatsapp';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import SellerOverview from './components/seller/SellerOverview.jsx';
import { T, FONT_SANS, FONT_SERIF, EASE_OUT } from './theme/luxe';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  primary:      T.accent,
  primaryLight: '#C9561F',
  primaryBg:    T.accentSoft,
  primaryPale:  T.bg,
  primaryBorder:'#E9C9B2',
  hero:         '#EAD3C1',
  heroDark:     '#E0C2AC',
  accent:       T.accentHover,
  success:      T.green,
  successBg:    T.greenSoft,
  danger:       '#B42318',
  dangerBg:     '#FDF1EF',
  surface:      T.surface,
  surfaceDim:   T.bg,
  surfacePeach: T.sand,
  border:       T.line,
  borderLight:  T.lineSoft,
  cardBorder:   T.line,
  text:         T.ink,
  textDark:     T.ink,
  textMid:      T.ink2,
  textMuted:    T.muted,
  textFaint:    '#A08E82',
};

// ─── Bag categories ───────────────────────────────────────────────────────────
const BAG_CATEGORIES = [
  { id:'luxury',     emoji:'👜', label:'Luxury',      desc:'Hermès, LV, Chanel'  },
  { id:'designer',   emoji:'✨', label:'Designer',    desc:'Gucci, Prada, Dior'  },
  { id:'streetwear', emoji:'🎒', label:'Streetwear',  desc:'Supreme, Off-White'  },
  { id:'tote',       emoji:'🛍️', label:'Tote',        desc:'Everyday carry'      },
  { id:'crossbody',  emoji:'👝', label:'Crossbody',   desc:'Compact & stylish'   },
  { id:'clutch',     emoji:'💼', label:'Clutch',      desc:'Evening & events'    },
  { id:'backpack',   emoji:'🎽', label:'Backpacks',   desc:'Functional & urban'  },
  { id:'vintage',    emoji:'🏺', label:'Vintage',     desc:'Pre-loved classics'  },
  { id:'custom',     emoji:'🔧', label:'Custom',      desc:'Bespoke pieces'      },
];

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

async function enrichBuyerViewsWithProfiles(rows) {
  const buyerIds = [...new Set((rows || []).map((row) => row.buyer_id).filter(Boolean))];
  if (!buyerIds.length) return rows || [];
  const { data, error } = await supabase
    .from('users')
    .select('user_id,full_name,email,phone')
    .in('user_id', buyerIds);
  if (error) { console.error('buyer profile fetch error:', error.message || error); return rows || []; }
  const profileMap = new Map((data || []).map((row) => [row.user_id, row]));
  return (rows || []).map((row) => ({ ...row, users: profileMap.get(row.buyer_id) || null }));
}

function isMissingColumnError(err) {
  const msg  = String(err?.message || '').toLowerCase();
  const code = String(err?.code    || '').toUpperCase();
  return (
    code === '42703' || code === 'PGRST204' ||
    (msg.includes('column') && msg.includes('does not exist')) ||
    (msg.includes('could not find') && msg.includes('column') && msg.includes('schema cache'))
  );
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

function SparkleIcon({ size = 16, color = C.primary, animated = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: animated ? "sparklePulse 1s ease-in-out infinite" : "none", flexShrink: 0 }}>
      <path d="M12 2L13.09 8.26L19 6L14.74 10.91L21 12L14.74 13.09L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.09L3 12L9.26 10.91L5 6L10.91 8.26L12 2Z" fill={color}/>
    </svg>
  );
}

// ─── Real Social Media Icons ───────────────────────────────────────────────────
const SocialIcons = {
  WhatsApp: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  Twitter: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  Instagram: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  ),
  Facebook: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  Telegram: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  ),
  TikTok: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
};

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
      style={{ display:"grid", gridTemplateColumns:"2.2fr 1.2fr 1.3fr 1fr 1.4fr", padding:"14px 24px", alignItems:"center", borderBottom:`1px solid ${C.borderLight}`, background:hov?"#fffaf5":"white", transition:"background 0.18s", opacity:ready?1:0, animation:ready?`rowSlide 0.45s cubic-bezier(0.22,1,0.36,1) ${index*70+100}ms both`:"none" }}>
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
        ) : row.phone && normalizeWhatsAppNumber(row.phone) ? (
          <a href={`https://wa.me/${normalizeWhatsAppNumber(row.phone)}?text=Hi%2C%20following%20up%20on%20${encodeURIComponent(row.bag)}`}
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
      style={{ background:hov?"#fffaf5":"white", borderRadius:14, border:`1px solid ${C.borderLight}`, padding:"16px", marginBottom:12, transition:"all 0.25s cubic-bezier(0.22,1,0.36,1)", boxShadow:hov?`0 6px 24px rgba(200,75,17,0.07)`:`0 1px 6px rgba(0,0,0,0.04)`, transform:hov?"translateY(-2px)":"none", opacity:ready?1:0, animation:ready?`cardSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) ${index*80+100}ms both`:"none" }}>
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
        ) : row.phone && normalizeWhatsAppNumber(row.phone) ? (
          <a href={`https://wa.me/${normalizeWhatsAppNumber(row.phone)}?text=Hi%2C%20following%20up%20on%20${encodeURIComponent(row.bag)}`}
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

// ══════════════════════════════════════════════════════════════════════════════
// ─── DISCOUNT PROMO CARD ──────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function DiscountPromoCard({ navigate, visible }) {
  const [dismissed, setDismissed] = useState(false);
  const [hov, setHov] = useState(false);

  if (dismissed) return null;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(12px)',
        marginBottom: 20,
        background: 'white',
        borderRadius: 16,
        border: `1.5px solid #fde8d8`,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        boxShadow: hov
          ? '0 6px 28px rgba(200,75,17,0.12)'
          : '0 2px 12px rgba(200,75,17,0.06)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'opacity 0.5s ease 200ms, transform 0.5s cubic-bezier(0.22,1,0.36,1) 200ms, box-shadow 0.25s ease',
      }}
    >
      {/* left accent stripe */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: `linear-gradient(180deg, ${C.primary}, ${C.primaryLight})`,
        borderRadius: '16px 0 0 16px',
      }}/>

      {/* icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: C.primaryBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginLeft: 6,
      }}>
        <MS name="local_offer" size={20} style={{ color: C.primary }}/>
      </div>

      {/* text */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 2 }}>
          Run a discount to attract more buyers 🎯
        </p>
        <p style={{ fontSize: 11, color: C.textMuted, fontWeight: 500, lineHeight: 1.5 }}>
          Listings with a price drop get up to 3× more views. Add one now!
        </p>
      </div>

      {/* CTA button */}
      <button
        onClick={() => navigate('/upload-product')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 10, border: 'none',
          background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
          color: 'white', fontSize: 12, fontWeight: 800,
          cursor: 'pointer', fontFamily: "'Manrope',sans-serif",
          boxShadow: '0 3px 12px rgba(200,75,17,0.3)',
          transition: 'all 0.22s cubic-bezier(0.22,1,0.36,1)',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(200,75,17,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(200,75,17,0.3)'; }}
      >
        <MS name="add" size={14}/> Add Discount
      </button>

      {/* dismiss */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          width: 26, height: 26, borderRadius: 8, border: `1px solid ${C.borderLight}`,
          background: C.surfaceDim, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: C.textFaint,
          flexShrink: 0, transition: 'all 0.18s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.primaryBg; e.currentTarget.style.color = C.primary; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.surfaceDim; e.currentTarget.style.color = C.textFaint; }}
        title="Dismiss"
      >
        <MS name="close" size={14}/>
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── GET VERIFIED CARD ───────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const VERIFIED_REVIEW_GOAL = 10;

function VerifiedBadgeCard({ seller, visible, reviewCount, reviewsLoading, onShare }) {
  const [copied, setCopied] = useState(false);
  const profileUrl = `${window.location.origin}/vendor/${seller?.id || ''}`;
  const progress = Math.min(reviewCount / VERIFIED_REVIEW_GOAL, 1);
  const remaining = Math.max(VERIFIED_REVIEW_GOAL - reviewCount, 0);
  const goalReached = !reviewsLoading && remaining === 0;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
    } catch {
      const el = document.createElement('input');
      el.value = profileUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [profileUrl]);

  return (
    <div
      className={`verify-frame${visible ? ' is-visible' : ''}`}
      style={{ marginBottom: 28, boxShadow: '0 4px 24px rgba(200,75,17,0.1)' }}
    >
      <div style={{ background: 'white', borderRadius: 20, padding: '22px 24px', display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div
          className="verify-badge-icon"
          style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg,${C.primary},#facc15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 24px rgba(200,75,17,0.35)' }}
        >
          <MS name="verified" size={26} style={{ color: 'white' }}/>
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 15, fontWeight: 900, color: C.text }}>Get Your Community Trusted Badge</p>
            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: goalReached ? C.successBg : '#fef9c3', color: goalReached ? C.success : '#a16207', border: `1px solid ${goalReached ? '#bbf7d0' : '#fde68a'}`, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              {reviewsLoading ? '…' : goalReached ? 'GOAL REACHED' : `${remaining} REVIEW${remaining === 1 ? '' : 'S'} TO GO`}
            </span>
          </div>
          <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6, fontWeight: 500, marginBottom: 14 }}>
            Ask happy customers to log in and leave you a review, and share your profile link so more buyers can find and vouch for you.
            Sellers with {VERIFIED_REVIEW_GOAL}+ reviews from different logged-in buyers earn a Community Trusted badge on their storefront.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 20, background: C.surfaceDim, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: reviewsLoading ? '4%' : `${progress * 100}%`, borderRadius: 20, background: `linear-gradient(90deg,${C.primary},#facc15)`, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }}/>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, whiteSpace: 'nowrap' }}>
              {reviewsLoading ? '…' : `${Math.min(reviewCount, VERIFIED_REVIEW_GOAL)}/${VERIFIED_REVIEW_GOAL}`}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: C.surfaceDim, border: `1.5px solid ${C.borderLight}`, borderRadius: 12, overflow: 'hidden' }}>
              <MS name="link" size={15} style={{ color: C.textFaint, flexShrink: 0 }}/>
              <span style={{ fontSize: 12, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{profileUrl}</span>
            </div>
            <button
              onClick={handleCopy}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${copied ? '#bbf7d0' : C.borderLight}`, background: copied ? C.successBg : 'white', color: copied ? C.success : C.textMuted, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'Manrope',sans-serif", whiteSpace: 'nowrap', transition: 'all 0.2s' }}
              onMouseEnter={e=>{ if(!copied){ e.currentTarget.style.background=C.surfaceDim; e.currentTarget.style.borderColor=C.primaryBorder; } }}
              onMouseLeave={e=>{ if(!copied){ e.currentTarget.style.background='white'; e.currentTarget.style.borderColor=C.borderLight; } }}
            >
              <MS name={copied ? 'check' : 'content_copy'} size={15}/> {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={onShare}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${C.primary},${C.accent})`, color: 'white', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'Manrope',sans-serif", whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(200,75,17,0.3)', transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)' }}
              onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(200,75,17,0.42)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 16px rgba(200,75,17,0.3)'; }}
            >
              <MS name="ios_share" size={15}/> Share Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── ID SUBMITTED CARD (NIN photo, manually reviewed) ───────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function compressImageToJpeg(file, maxDim = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not process image')), 'image/jpeg', quality);
      };
      img.onerror = () => reject(new Error('Could not read image'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

const NIN_STATUS_META = {
  none:     { label: 'Not submitted',   color: '#9a6348', bg: '#fdf8f5', border: '#f7ece4' },
  pending:  { label: 'Under review',    color: '#a16207', bg: '#fef9c3', border: '#fde68a' },
  approved: { label: 'Verified',        color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
  rejected: { label: 'Not approved',    color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

function NinVerificationCard({ sellerId, visible }) {
  const [status, setStatus] = useState('none');
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const loadStatus = useCallback(async () => {
    if (!sellerId) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('seller_verifications').select('status,nin_image_path,rejection_reason').eq('seller_id', sellerId).maybeSingle();
      if (data) {
        setStatus(data.status);
        setRejectionReason(data.rejection_reason || '');
        if (data.nin_image_path) {
          const { data: signed } = await supabase.storage.from('nin-documents').createSignedUrl(data.nin_image_path, 3600);
          setPreviewUrl(signed?.signedUrl || null);
        } else {
          setPreviewUrl(null);
        }
      } else {
        setStatus('none');
        setRejectionReason('');
        setPreviewUrl(null);
      }
    } catch (err) {
      console.error('Failed to load NIN verification status:', err);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !sellerId) return;
    if (!file.type.startsWith('image/')) { setUploadError('Please upload an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError('Image is too large (max 10MB).'); return; }

    setUploading(true);
    setUploadError('');
    try {
      const compressed = await compressImageToJpeg(file);
      const path = `${sellerId}/nin-${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage.from('nin-documents').upload(path, compressed, { contentType: 'image/jpeg', upsert: false });
      if (uploadErr) throw uploadErr;

      const { error: upsertErr } = await supabase.from('seller_verifications').upsert({
        seller_id: sellerId,
        nin_image_path: path,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        rejection_reason: null,
      }, { onConflict: 'seller_id' });
      if (upsertErr) throw upsertErr;

      await loadStatus();
    } catch (err) {
      console.error('NIN upload failed:', err);
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const meta = NIN_STATUS_META[status] || NIN_STATUS_META.none;
  const buttonLabel = uploading ? 'Uploading…' : status === 'none' ? 'Upload NIN photo' : status === 'rejected' ? 'Resubmit photo' : 'Replace photo';

  return (
    <div
      className={`verify-frame${visible ? ' is-visible' : ''}`}
      style={{ marginBottom: 28, boxShadow: '0 4px 24px rgba(200,75,17,0.1)' }}
    >
      <div style={{ background: 'white', borderRadius: 20, padding: '22px 24px', display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg,${C.primary},#facc15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 24px rgba(200,75,17,0.35)' }}>
          <MS name="badge" size={26} style={{ color: 'white' }}/>
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 15, fontWeight: 900, color: C.text }}>Verified Badge</p>
            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              {loading ? '…' : meta.label.toUpperCase()}
            </span>
          </div>
          <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6, fontWeight: 500, marginBottom: 14 }}>
            Upload a photo of your NIN slip or card. We review submissions manually — this isn't an automated government
            database check, but it raises the bar for scammers and gives us evidence to act on if something goes wrong.
          </p>

          {status === 'rejected' && (
            <p style={{ fontSize: 12, color: C.danger, fontWeight: 700, marginBottom: 10, lineHeight: 1.6 }}>
              {rejectionReason
                ? <>Not approved: <span style={{ fontWeight: 600 }}>{rejectionReason}</span></>
                : "Your last submission wasn't approved. Please upload a clearer photo of your NIN."}
            </p>
          )}
          {uploadError && (
            <p style={{ fontSize: 12, color: C.danger, fontWeight: 700, marginBottom: 10 }}>{uploadError}</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {previewUrl && (
              <img src={previewUrl} alt="Your submitted NIN document" loading="lazy" width="56" height="56" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: `1.5px solid ${C.borderLight}` }}/>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect}/>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || status === 'approved'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12, border: `1.5px solid ${C.borderLight}`, background: status === 'approved' ? C.surfaceDim : 'white', color: status === 'approved' ? C.textFaint : C.textMuted, fontSize: 12, fontWeight: 800, cursor: uploading || status === 'approved' ? 'default' : 'pointer', fontFamily: "'Manrope',sans-serif" }}
            >
              <MS name={uploading ? 'progress_activity' : 'upload'} size={15}/>
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── BIRTHDAY CELEBRATION ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const CONFETTI_COLORS = ['#ec4899', '#f97316', '#facc15', '#34d399', '#60a5fa', '#a78bfa'];

function BirthdayCelebration({ seller }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const confettiRef = useRef(null);
  if (!confettiRef.current) {
    confettiRef.current = Array.from({ length: 28 }, (_, i) => ({
      left: Math.random() * 100,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 1.2,
      duration: 2.6 + Math.random() * 1.6,
      size: 6 + Math.random() * 6,
    }));
  }

  useEffect(() => {
    if (!seller?.date_of_birth) return;
    const dob = new Date(seller.date_of_birth);
    if (Number.isNaN(dob.getTime())) return;
    const today = new Date();
    const isBirthday = dob.getUTCMonth() === today.getUTCMonth() && dob.getUTCDate() === today.getUTCDate();
    if (!isBirthday) return;
    const todayKey = today.toISOString().split('T')[0];
    const seenKey = `bagsearch_birthday_seen_${todayKey}`;
    try {
      if (localStorage.getItem(seenKey) === '1') return;
    } catch { /* localStorage unavailable — show it anyway */ }
    setVisible(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
  }, [seller?.date_of_birth]);

  const dismiss = () => {
    const todayKey = new Date().toISOString().split('T')[0];
    try { localStorage.setItem(`bagsearch_birthday_seen_${todayKey}`, '1'); } catch { /* ignore */ }
    setMounted(false);
    setTimeout(() => setVisible(false), 350);
  };

  if (!visible) return null;

  const firstName = (seller?.name || 'there').split(' ')[0];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: mounted ? 'rgba(26,10,0,0.55)' : 'rgba(26,10,0,0)',
      backdropFilter: mounted ? 'blur(6px)' : 'none',
      transition: 'background 0.35s ease, backdrop-filter 0.35s ease',
      padding: 20,
    }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {confettiRef.current.map((c, i) => (
          <span key={i} style={{
            position: 'absolute', top: -20, left: `${c.left}%`,
            width: c.size, height: c.size * 0.4, background: c.color,
            borderRadius: 2, opacity: mounted ? 1 : 0,
            animation: mounted ? `confettiFall ${c.duration}s ease-in ${c.delay}s infinite` : 'none',
          }}/>
        ))}
      </div>

      <div style={{
        position: 'relative', zIndex: 1, width: 'min(420px, 100%)',
        background: 'linear-gradient(160deg,#fff7ed 0%,#fff 60%)',
        borderRadius: 28, padding: '40px 30px 30px',
        textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
        transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(30px)',
        opacity: mounted ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{
          width: 84, height: 84, margin: '0 auto 18px', borderRadius: '50%',
          background: 'linear-gradient(135deg,#ec4899,#f97316,#facc15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 42, boxShadow: '0 12px 32px rgba(236,72,153,0.4)',
          animation: mounted ? 'birthdayBounce 1.6s ease-in-out infinite' : 'none',
        }}>
          🎂
        </div>
        <h2 style={{
          fontSize: 26, fontWeight: 900, marginBottom: 10, letterSpacing: '-0.02em',
          backgroundImage: 'linear-gradient(90deg,#ec4899,#f97316,#facc15)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        }}>
          Happy Birthday, {firstName}! 🎉
        </h2>
        <p style={{ fontSize: 14, color: '#7A4030', lineHeight: 1.7, marginBottom: 26 }}>
          The whole BagSearch team is wishing you an amazing day. Thanks for being part of our seller community — here's to another great year! 🥳
        </p>
        <button onClick={dismiss} style={{
          padding: '13px 32px', borderRadius: 999, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#ec4899,#f97316)', color: 'white',
          fontWeight: 800, fontSize: 14, boxShadow: '0 10px 26px rgba(236,72,153,0.4)',
        }}>
          Thank you! 🎈
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── SHARE PROFILE MODAL ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function ShareProfileModal({ visible, onClose, seller }) {
  const [copied, setCopied] = useState(false);
  const profileUrl = `${window.location.origin}/vendor/${seller?.id || ''}`;
  const sellerName = seller?.name || 'BagSearch Seller';
  const shareText = `Check out ${sellerName}'s bag collection on BagSearch! 👜✨`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = profileUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [profileUrl]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: sellerName + ' on BagSearch', text: shareText, url: profileUrl });
      } catch (_) {}
    }
  }, [sellerName, shareText, profileUrl]);

  // ── Real social links with proper branded icons ────────────────────────────
  const socialLinks = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      color: '#25D366',
      textColor: '#fff',
      Icon: SocialIcons.WhatsApp,
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + profileUrl)}`,
    },
    {
      id: 'twitter',
      label: 'X / Twitter',
      color: '#000000',
      textColor: '#fff',
      Icon: SocialIcons.Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`,
    },
    {
      id: 'instagram',
      label: 'Instagram',
      color: '#E1306C',
      textColor: '#fff',
      Icon: SocialIcons.Instagram,
      href: `https://www.instagram.com/`,
      note: 'Copy link & paste in bio',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      color: '#1877F2',
      textColor: '#fff',
      Icon: SocialIcons.Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      id: 'telegram',
      label: 'Telegram',
      color: '#0088CC',
      textColor: '#fff',
      Icon: SocialIcons.Telegram,
      href: `https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      color: '#010101',
      textColor: '#fff',
      Icon: SocialIcons.TikTok,
      href: `https://www.tiktok.com/`,
      note: 'Copy link & share in bio',
    },
  ];

  if (!visible) return null;

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(26,10,0,0.45)", backdropFilter:"blur(4px)", animation:"overlayFade 0.2s ease" }}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:501, width:"min(520px, calc(100vw - 24px))", background:"white", borderRadius:24, boxShadow:`0 40px 100px rgba(200,75,17,0.18),0 10px 40px rgba(0,0,0,0.14)`, overflow:"hidden", animation:"modalPop 0.38s cubic-bezier(0.34,1.56,0.64,1)" }}>

        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,#2d1200 0%,#1a0a00 100%)`, padding:"22px 24px 20px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-30, right:-10, width:130, height:130, borderRadius:"50%", background:"rgba(200,75,17,0.13)", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", bottom:-20, left:80, width:80, height:80, borderRadius:"50%", background:"rgba(249,115,22,0.09)", pointerEvents:"none" }}/>
          <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(135deg,${C.primary},${C.accent})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 20px rgba(200,75,17,0.5)`, flexShrink:0 }}>
                <MS name="share" size={20} style={{ color:"white" }}/>
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:900, color:"#fff", letterSpacing:"-0.02em", fontFamily:"'DM Serif Display',serif" }}>Share Your Profile</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:500, marginTop:2 }}>Let buyers find you everywhere</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.6)", transition:"all 0.2s" }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.16)";e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.color="rgba(255,255,255,0.6)";}}>
              <MS name="close" size={17}/>
            </button>
          </div>
        </div>

        <div style={{ padding:"22px 24px 24px" }}>

          {/* Profile preview strip */}
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:C.surfaceDim, borderRadius:14, border:`1.5px solid ${C.borderLight}`, marginBottom:20 }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:900, color:"white", flexShrink:0 }}>
              {seller?.name ? seller.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : 'S'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:2 }}>{seller?.name || 'Your Store'}</p>
              <p style={{ fontSize:11, color:C.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{profileUrl}</p>
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:C.primaryBg, border:`1px solid ${C.primaryBorder}` }}>
              <MS name="verified" size={13} style={{ color:C.primary }}/>
              <span style={{ fontSize:10, fontWeight:800, color:C.primary }}>Pro Seller</span>
            </div>
          </div>

          {/* Copy link row */}
          <div style={{ marginBottom:22 }}>
            <p style={{ fontSize:10, fontWeight:800, color:C.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>Profile Link</p>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:C.surfaceDim, border:`1.5px solid ${C.borderLight}`, borderRadius:12, overflow:"hidden" }}>
                <MS name="link" size={15} style={{ color:C.textFaint, flexShrink:0 }}/>
                <span style={{ fontSize:12, color:C.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:500 }}>{profileUrl}</span>
              </div>
              <button onClick={handleCopy}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 18px", borderRadius:12, border:"none", background:copied?`linear-gradient(135deg,${C.success},#15803d)`:`linear-gradient(135deg,${C.primary},${C.accent})`, color:"white", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Manrope',sans-serif", transition:"all 0.3s cubic-bezier(0.22,1,0.36,1)", boxShadow:copied?`0 4px 16px rgba(22,163,74,0.35)`:`0 4px 16px rgba(200,75,17,0.35)`, whiteSpace:"nowrap", flexShrink:0 }}
                onMouseEnter={e=>{if(!copied){e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 8px 24px rgba(200,75,17,0.45)`;} }}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=copied?`0 4px 16px rgba(22,163,74,0.35)`:`0 4px 16px rgba(200,75,17,0.35)`;}}>
                <MS name={copied?"check":"content_copy"} size={15}/>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Social share grid — real branded icons */}
          <div>
            <p style={{ fontSize:10, fontWeight:800, color:C.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>Share On Social Media</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              {socialLinks.map((s) => (
                <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer"
                  onClick={s.note ? (e) => { e.preventDefault(); handleCopy(); } : undefined}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, padding:"16px 10px", borderRadius:14, border:`1.5px solid ${C.cardBorder}`, background:"white", cursor:"pointer", textDecoration:"none", transition:"all 0.25s cubic-bezier(0.22,1,0.36,1)", position:"relative", overflow:"hidden" }}
                  onMouseEnter={e=>{e.currentTarget.style.border=`1.5px solid ${s.color}40`;e.currentTarget.style.background=s.color+'12';e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 8px 24px ${s.color}25`;}}
                  onMouseLeave={e=>{e.currentTarget.style.border=`1.5px solid ${C.cardBorder}`;e.currentTarget.style.background="white";e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                  {/* Real brand icon in branded color circle */}
                  <div style={{ width:42, height:42, borderRadius:12, background:s.color, display:"flex", alignItems:"center", justifyContent:"center", color:s.textColor, flexShrink:0, boxShadow:`0 4px 14px ${s.color}40` }}>
                    <s.Icon size={s.id === 'twitter' ? 18 : 20}/>
                  </div>
                  <span style={{ fontSize:11, fontWeight:800, color:C.text, textAlign:"center" }}>{s.label}</span>
                  {s.note && <span style={{ fontSize:9, fontWeight:600, color:C.textFaint, textAlign:"center", lineHeight:1.3 }}>{s.note}</span>}
                </a>
              ))}
            </div>
          </div>

          {/* Native share button — shows only if supported */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <button onClick={handleNativeShare}
              style={{ marginTop:16, width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:9, padding:"13px", borderRadius:14, border:`1.5px dashed ${C.primaryBorder}`, background:C.primaryPale, color:C.primary, fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'Manrope',sans-serif", transition:"all 0.22s" }}
              onMouseEnter={e=>{e.currentTarget.style.background=C.primaryBg;e.currentTarget.style.borderColor=C.primary;}}
              onMouseLeave={e=>{e.currentTarget.style.background=C.primaryPale;e.currentTarget.style.borderColor=C.primaryBorder;}}>
              <MS name="ios_share" size={17}/>
              More Options…
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalPop {
          from{opacity:0;transform:translate(-50%,-50%) scale(0.93)}
          to{opacity:1;transform:translate(-50%,-50%) scale(1)}
        }
      `}</style>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── AI ASSIST (Gemini) ───────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// API key removed for security - use environment variable: GEMINI_API_KEY
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable is not set');
}
const GEMINI_MODELS = ["gemini-1.5-flash","gemini-1.5-flash-8b","gemini-1.0-pro"];

function useAIAssist() {
  const [loading, setLoading] = useState(false);
  const generate = async ({ prompt, onChunk, onDone, onError }) => {
    setLoading(true);
    let lastError = null;
    for (const model of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const res = await fetch(url, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{maxOutputTokens:800,temperature:0.9} }) });
        const data = await res.json();
        if (!res.ok) {
          const msg = data?.error?.message || "";
          if (msg.toLowerCase().includes("quota") || res.status===429 || res.status===403) { lastError="quota"; continue; }
          throw new Error(msg || `API error ${res.status}`);
        }
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        if (!text) throw new Error("Empty response — please try again.");
        let displayed = "";
        const words = text.split(" ");
        for (let i=0;i<words.length;i++) {
          displayed += (i===0?"" :" ") + words[i];
          onChunk?.(displayed);
          await new Promise(r=>setTimeout(r,24));
        }
        onDone?.(text);
        setLoading(false);
        return;
      } catch(e) {
        lastError = e.message;
        if (!String(e.message).toLowerCase().includes("quota")) break;
      }
    }
    const msg = lastError==="quota" ? "Your Gemini API quota is exhausted. Please upgrade your plan at ai.google.dev or try again tomorrow." : lastError||"AI error — please try again.";
    onError?.(msg);
    setLoading(false);
  };
  return { generate, loading };
}

// ─── AI Assist Modal ──────────────────────────────────────────────────────────
function AIAssistBubble({ visible, onClose, streaming, result, onAccept, onRegenerate, field }) {
  const isError = result && result.startsWith("Error:");
  const isQuota = result && result.toLowerCase().includes("quota");
  const chips = {
    brand_name:  [
      { label:"Bold & Memorable", icon:"bolt" },
      { label:"Elegant & Luxury",  icon:"diamond" },
      { label:"Short & Punchy",    icon:"flash_on" },
      { label:"Lagos-inspired",    icon:"location_on" },
    ],
    brand_story: [
      { label:"Origin Story",        icon:"auto_stories" },
      { label:"Craftsmanship",       icon:"handyman" },
      { label:"Bold & Aspirational", icon:"trending_up" },
      { label:"Warm & Personal",     icon:"favorite" },
    ],
  };
  const currentChips = chips[field] || chips.brand_story;
  if (!visible) return null;
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:400, background:"rgba(26,10,0,0.35)", backdropFilter:"blur(3px)", animation:"overlayFade 0.2s ease" }}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:401, width:"min(480px, calc(100vw - 32px))", background:"white", borderRadius:24, boxShadow:`0 32px 80px rgba(200,75,17,0.18),0 8px 32px rgba(0,0,0,0.12)`, overflow:"hidden", animation:"modalPop 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ background:`linear-gradient(135deg,#2d1200 0%,#1a0a00 100%)`, padding:"20px 22px 18px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-30, right:-20, width:120, height:120, borderRadius:"50%", background:"rgba(200,75,17,0.15)", pointerEvents:"none" }}/>
          <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:14, background:`linear-gradient(135deg,${C.primary},${C.accent})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 20px rgba(200,75,17,0.5)`, flexShrink:0 }}>
                <SparkleIcon size={20} color="white" animated={streaming}/>
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:900, color:"#fff", letterSpacing:"-0.02em", fontFamily:"'DM Serif Display',serif" }}>AI Brand Assistant</div>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:3 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:streaming?C.primaryLight:"#22c55e", animation:streaming?"pulse 1s ease-in-out infinite":"none" }}/>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.55)", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" }}>{streaming?"Generating…":"Powered by Gemini"}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.6)", transition:"all 0.2s" }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.15)";e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.color="rgba(255,255,255,0.6)";}}>
              <MS name="close" size={17}/>
            </button>
          </div>
          {streaming && <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:"rgba(255,255,255,0.08)" }}><div style={{ height:"100%", background:`linear-gradient(90deg,${C.primary},${C.primaryLight})`, animation:"progressPulse 1.5s ease-in-out infinite", borderRadius:2 }}/></div>}
        </div>
        <div style={{ padding:"20px 22px" }}>
          {!streaming && !result && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <div style={{ width:1, height:16, background:C.primaryBorder }}/>
                <p style={{ fontSize:10, fontWeight:800, color:C.textMuted, letterSpacing:"0.12em", textTransform:"uppercase" }}>{field==="brand_name"?"Pick a naming style":"Pick a story style"}</p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
                {currentChips.map((chip,i)=>(
                  <button key={i} onClick={()=>onRegenerate(chip.label)} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:14, border:`1.5px solid ${C.cardBorder}`, background:C.surface, cursor:"pointer", fontFamily:"'Manrope',sans-serif", transition:"all 0.22s cubic-bezier(0.22,1,0.36,1)", textAlign:"left" }}
                    onMouseEnter={e=>{e.currentTarget.style.border=`1.5px solid ${C.primary}`;e.currentTarget.style.background=C.primaryPale;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px rgba(200,75,17,0.12)`;}}
                    onMouseLeave={e=>{e.currentTarget.style.border=`1.5px solid ${C.cardBorder}`;e.currentTarget.style.background=C.surface;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                    <div style={{ width:30, height:30, borderRadius:9, background:C.primaryBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <MS name={chip.icon} size={15} style={{ color:C.primary }}/>
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:C.text, lineHeight:1.3 }}>{chip.label}</span>
                  </button>
                ))}
              </div>
              <p style={{ fontSize:11, color:C.textFaint, fontWeight:500, marginTop:14, textAlign:"center" }}>Click a style above to generate with AI ✨</p>
            </div>
          )}
          {streaming && !result && (
            <div style={{ padding:"6px 0" }}>
              {[100,85,70].map((w,i)=>(
                <div key={i} style={{ height:14, borderRadius:8, background:C.borderLight, marginBottom:10, width:`${w}%`, animation:`skeletonPulse 1.5s ease-in-out ${i*200}ms infinite` }}/>
              ))}
            </div>
          )}
          {result && (
            <div>
              {isError || isQuota ? (
                <div style={{ borderRadius:14, border:`1.5px solid #fecaca`, background:"#fff5f5", padding:"16px 18px" }}>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:"#fee2e2", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <MS name="error_outline" size={17} style={{ color:C.danger }}/>
                    </div>
                    <div>
                      <p style={{ fontSize:12, fontWeight:800, color:C.danger, marginBottom:4 }}>{isQuota?"Quota Exceeded":"Generation Failed"}</p>
                      <p style={{ fontSize:11, color:"#7f1d1d", fontWeight:500, lineHeight:1.6 }}>{isQuota?"Your Gemini free-tier limit is reached.":result.replace("Error: ","")}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <div style={{ width:1, height:16, background:C.primaryBorder }}/>
                    <p style={{ fontSize:10, fontWeight:800, color:C.textMuted, letterSpacing:"0.12em", textTransform:"uppercase" }}>AI Suggestion</p>
                    {!streaming && <span style={{ marginLeft:"auto", display:"inline-flex", alignItems:"center", gap:4, fontSize:10, fontWeight:700, color:C.success, background:C.successBg, padding:"3px 9px", borderRadius:20 }}><MS name="check_circle" size={12}/> Ready</span>}
                  </div>
                  <div style={{ background:`linear-gradient(135deg,${C.primaryPale},${C.surfaceDim})`, borderRadius:14, border:`1.5px solid ${C.primaryBorder}`, padding:"16px 18px", marginBottom:14, minHeight:56, fontSize:13, fontWeight:600, color:C.text, lineHeight:1.75, position:"relative" }}>
                    <span style={{ position:"absolute", top:10, left:14, fontSize:32, color:C.primaryBorder, fontFamily:"Georgia,serif", lineHeight:1, pointerEvents:"none", userSelect:"none" }}>"</span>
                    <span style={{ paddingLeft:18, display:"block" }}>
                      {result}
                      {streaming && <span style={{ display:"inline-block", width:2, height:"1em", background:C.primary, marginLeft:2, animation:"cursorBlink 0.65s step-end infinite", verticalAlign:"text-bottom", borderRadius:1 }}/>}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {((result && !isError && !isQuota) || streaming) && (
          <div style={{ padding:"0 22px 20px", display:"flex", gap:9, justifyContent:"flex-end", flexWrap:"wrap" }}>
            {!streaming && <button onClick={()=>onRegenerate(null)} style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 18px", borderRadius:12, border:`1.5px solid ${C.primaryBorder}`, background:"white", color:C.textMid, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Manrope',sans-serif", transition:"all 0.2s" }} onMouseEnter={e=>{e.currentTarget.style.background=C.primaryPale;e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.color=C.primary;}} onMouseLeave={e=>{e.currentTarget.style.background="white";e.currentTarget.style.borderColor=C.primaryBorder;e.currentTarget.style.color=C.textMid;}}><MS name="refresh" size={15}/> Try Again</button>}
            {!streaming && <button onClick={onAccept} style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 22px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.primary} 0%,${C.accent} 100%)`, color:"white", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Manrope',sans-serif", boxShadow:`0 6px 18px rgba(200,75,17,0.35)`, transition:"all 0.22s cubic-bezier(0.22,1,0.36,1)" }} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.transform="none";}}><MS name="check" size={15}/> Use This</button>}
            {streaming && <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:12, background:C.primaryBg, border:`1.5px solid ${C.primaryBorder}` }}><div style={{ width:14, height:14, border:`2px solid ${C.primaryBorder}`, borderTopColor:C.primary, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/><span style={{ fontSize:12, fontWeight:700, color:C.textMid }}>Writing your copy…</span></div>}
          </div>
        )}
        {(isError || isQuota) && <div style={{ padding:"0 22px 20px", display:"flex", justifyContent:"flex-end" }}><button onClick={onClose} style={{ padding:"10px 22px", borderRadius:12, border:`1.5px solid ${C.border}`, background:"white", color:C.textMid, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Manrope',sans-serif" }}>Close</button></div>}
      </div>
    </>
  );
}

// ── DeleteAccountModal ──────────────────────────────────────────────────────
function DeleteAccountModal({ visible, onClose, onConfirm, deleting, deleted }) {
  const [confirmText, setConfirmText] = useState('');
  const [shake, setShake] = useState(false);
  const isValid = confirmText.trim().toUpperCase() === 'DELETE';
  useEffect(() => { if (!visible) setConfirmText(''); }, [visible]);
  const handleInput = (e) => {
    setConfirmText(e.target.value);
    if (e.target.value.length >= 5 && e.target.value.trim().toUpperCase() !== 'DELETE') { setShake(true); setTimeout(()=>setShake(false),500); }
  };
  if (!visible) return null;
  const warnings = [
    { icon:'inventory_2', text: <><strong style={{color:'#dc2626',fontWeight:800}}>All your listings will be deleted</strong> — every product, photo, and price permanently removed.</> },
    { icon:'chat',        text: <><strong style={{color:'#dc2626',fontWeight:800}}>Your buyer inquiries and messages</strong> will be erased with no way to recover them.</> },
    { icon:'storefront',  text: <><strong style={{color:'#dc2626',fontWeight:800}}>Your seller profile, brand story, and stats</strong> will be gone forever.</> },
    { icon:'block',       text: <><strong style={{color:'#dc2626',fontWeight:800}}>Your account cannot be restored.</strong> You will need to create a brand-new account to sell again.</>, isX:true },
  ];
  return (
    <>
      <div onClick={!deleting&&!deleted?onClose:undefined} style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(10,0,0,0.65)', backdropFilter:'blur(5px)', animation:'overlayFade 0.25s ease' }}/>
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:601, width:'min(460px, calc(100vw - 32px))', background:'white', borderRadius:24, boxShadow:'0 40px 100px rgba(0,0,0,0.25)', overflow:'hidden', animation:shake?'deleteShakeX 0.5s ease':'deleteModalPop 0.4s cubic-bezier(0.34,1.28,0.64,1) both' }}>
        <div style={{ background:'linear-gradient(135deg,#1a0000 0%,#2d0808 100%)', padding:'28px 28px 24px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ width:54, height:54, borderRadius:16, background:'rgba(220,38,38,0.18)', border:'1.5px solid rgba(220,38,38,0.35)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
              <MS name="delete_forever" size={28} style={{ color:'#ef4444' }}/>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'-0.03em', marginBottom:5, fontFamily:"'DM Serif Display',serif" }}>Delete Your Account</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontWeight:500 }}>This action is permanent and cannot be undone</div>
              </div>
              {!deleting&&!deleted&&<button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.5)', transition:'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.15)';}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';}}>  <MS name="close" size={17}/></button>}
            </div>
          </div>
        </div>
        {deleted ? (
          <div style={{ padding:'40px 28px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'#dcfce7', border:'2px solid #86efac', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
              <MS name="check_circle" size={28} style={{ color:'#16a34a' }}/>
            </div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:6 }}>Account Deleted</div>
            <div style={{ fontSize:12, color:C.textMuted, fontWeight:500, lineHeight:1.6 }}>Your account has been permanently removed. Redirecting…</div>
          </div>
        ) : (
          <>
            <div style={{ padding:'22px 28px' }}>
              <div style={{ background:'#fff5f5', border:'1.5px solid #fecaca', borderRadius:14, padding:'14px 16px', marginBottom:20 }}>
                {warnings.map((w,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0', borderBottom:i<warnings.length-1?'1px solid #fee2e2':'none' }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:w.isX?'#dc2626':'#fecaca', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                      <MS name={w.icon} size={13} style={{ color:w.isX?'white':'#dc2626' }}/>
                    </div>
                    <div style={{ fontSize:12, color:'#7f1d1d', fontWeight:600, lineHeight:1.65 }}>{w.text}</div>
                  </div>
                ))}
              </div>
              <div>
                <label style={{ display:'block', fontSize:10, fontWeight:800, color:C.textMuted, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>Type <span style={{ color:C.danger, fontWeight:900 }}>DELETE</span> to confirm</label>
                <input type="text" value={confirmText} onChange={handleInput} placeholder="DELETE" autoComplete="off" disabled={deleting}
                  style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`2px solid ${isValid?'#dc2626':C.cardBorder}`, background:isValid?'#fff5f5':C.surfaceDim, fontSize:14, fontWeight:700, color:C.text, fontFamily:"'Manrope',monospace", outline:'none', transition:'all 0.25s', letterSpacing:'0.08em' }}/>
              </div>
            </div>
            <div style={{ padding:'0 28px 24px', display:'flex', gap:10 }}>
              <button onClick={onClose} disabled={deleting} style={{ flex:1, padding:'12px', borderRadius:12, border:`1.5px solid ${C.border}`, background:'white', fontSize:13, fontWeight:700, color:C.textMid, cursor:deleting?'not-allowed':'pointer', fontFamily:"'Manrope',sans-serif" }}>Cancel</button>
              <button onClick={()=>isValid&&!deleting&&onConfirm()} disabled={!isValid||deleting} style={{ flex:2, padding:'12px', borderRadius:12, border:'none', background:isValid&&!deleting?'linear-gradient(135deg,#dc2626 0%,#b91c1c 100%)':'#fca5a5', fontSize:13, fontWeight:800, color:'white', cursor:isValid&&!deleting?'pointer':'not-allowed', fontFamily:"'Manrope',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <MS name={deleting?'hourglass_empty':'delete_forever'} size={16} style={{ animation:deleting?'spin 0.8s linear infinite':'none' }}/>
                {deleting?'Deleting account…':'Permanently Delete'}
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes deleteShakeX{0%,100%{transform:translate(-50%,-50%)}15%{transform:translate(calc(-50% - 7px),-50%)}30%{transform:translate(calc(-50% + 6px),-50%)}45%{transform:translate(calc(-50% - 4px),-50%)}60%{transform:translate(calc(-50% + 3px),-50%)}75%{transform:translate(calc(-50% - 2px),-50%)}}
        @keyframes deleteModalPop{from{opacity:0;transform:translate(-50%,-50%) scale(0.93)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
      `}</style>
    </>
  );
}

// ── Edit Profile Components ────────────────────────────────────────────────────
const FloatInput = memo(function FloatInput({ label, value, onChange, type='text', icon, iconColor, hint, disabled }) {
  const [focused, setFocused] = useState(false);
  const has = value && value.length > 0;
  const handleChange = useCallback((e) => { if (onChange) onChange(e); }, [onChange]);
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", border:`2px solid ${focused?C.primary:has?C.heroDark:C.cardBorder}`, borderRadius:14, background:focused?C.primaryPale:C.surface, transition:"all 0.3s cubic-bezier(0.22,1,0.36,1)", boxShadow:focused?`0 0 0 4px ${C.primaryBg},0 6px 24px rgba(200,75,17,0.1)`:"none", overflow:"hidden" }}>
        {icon && <div style={{ paddingLeft:14, display:"flex", alignItems:"center", transform:focused?"scale(1.15)":"scale(1)", transition:"transform 0.3s" }}><MS name={icon} size={16} style={{ color:focused?C.primary:iconColor||C.textFaint }}/></div>}
        <div style={{ flex:1, position:"relative", paddingTop:20, paddingBottom:8, paddingLeft:icon?10:14, paddingRight:14 }}>
          <label style={{ position:"absolute", top:focused||has?5:"50%", transform:focused||has?"none":"translateY(-50%)", fontSize:focused||has?9:13, fontWeight:focused||has?800:500, color:focused?C.primary:C.textFaint, letterSpacing:focused||has?"0.12em":"0", textTransform:focused||has?"uppercase":"none", transition:"all 0.25s cubic-bezier(0.22,1,0.36,1)", pointerEvents:"none", fontFamily:"'Manrope',sans-serif" }}>{label}</label>
          <input type={type} value={value||''} onChange={handleChange} disabled={disabled} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontSize:13, fontWeight:600, color:C.text, fontFamily:"'Manrope',sans-serif", marginTop:2 }}/>
        </div>
      </div>
      {hint && <p style={{ fontSize:10, color:C.textFaint, fontWeight:500, marginTop:4, paddingLeft:4 }}>{hint}</p>}
    </div>
  );
});

const FloatInputAI = memo(function FloatInputAI({ label, value, onChange, icon, iconColor, hint }) {
  const [focused, setFocused] = useState(false);
  const [aiOpen, setAIOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [aiResult, setAIResult] = useState("");
  const { generate } = useAIAssist();
  const wrapRef = useRef(null);
  const has = value && value.length > 0;
  const handleChange = useCallback((e) => { if (onChange) onChange(e); }, [onChange]);
  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setAIOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const handleGenerate = useCallback(async (stylePref) => {
    setStreaming(true); setAIResult("");
    await generate({ prompt:`Generate a short, catchy bag brand name for a Nigerian seller. Style: ${stylePref||"bold and memorable"}. ${value?`Current name for reference: "${value}"`:""}. Rules: 1-3 words max. Premium-sounding. Relevant to handbags/fashion. Return ONLY the brand name — no quotes, no explanation.`, onChunk:(t)=>setAIResult(t), onDone:(t)=>{setAIResult(t.trim());setStreaming(false);}, onError:(e)=>{setAIResult("Error: "+e);setStreaming(false);} });
  }, [generate, value]);
  const handleAccept = useCallback(() => { onChange({ target:{ value:aiResult.trim() } }); setAIOpen(false); setAIResult(""); }, [onChange, aiResult]);
  return (
    <div ref={wrapRef} style={{ position:"relative" }}>
      <div style={{ display:"flex", alignItems:"center", border:`2px solid ${focused?C.primary:has?C.heroDark:C.cardBorder}`, borderRadius:14, background:focused?C.primaryPale:C.surface, transition:"all 0.3s cubic-bezier(0.22,1,0.36,1)", boxShadow:focused?`0 0 0 4px ${C.primaryBg},0 6px 24px rgba(200,75,17,0.1)`:"none" }}>
        {icon && <div style={{ paddingLeft:14, display:"flex", alignItems:"center" }}><MS name={icon} size={16} style={{ color:focused?C.primary:iconColor||C.textFaint }}/></div>}
        <div style={{ flex:1, position:"relative", paddingTop:20, paddingBottom:8, paddingLeft:icon?10:14, paddingRight:10 }}>
          <label style={{ position:"absolute", top:focused||has?5:"50%", transform:focused||has?"none":"translateY(-50%)", fontSize:focused||has?9:13, fontWeight:focused||has?800:500, color:focused?C.primary:C.textFaint, letterSpacing:focused||has?"0.12em":"0", textTransform:focused||has?"uppercase":"none", transition:"all 0.25s", pointerEvents:"none", fontFamily:"'Manrope',sans-serif" }}>{label}</label>
          <input value={value||''} onChange={handleChange} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontSize:13, fontWeight:600, color:C.text, fontFamily:"'Manrope',sans-serif", marginTop:2 }}/>
        </div>
        <button onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setAIOpen(v=>!v); if(!aiOpen){setAIResult("");setStreaming(false);} }} style={{ marginRight:10, width:32, height:32, borderRadius:10, border:"none", background:aiOpen?`linear-gradient(135deg,${C.primary},${C.accent})`:C.primaryBg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.25s", flexShrink:0 }}>
          <SparkleIcon size={15} color={aiOpen?"white":C.primary} animated={streaming}/>
        </button>
      </div>
      {hint && <p style={{ fontSize:10, color:C.textFaint, fontWeight:500, marginTop:4, paddingLeft:4 }}>{hint}</p>}
      <AIAssistBubble visible={aiOpen} field="brand_name" streaming={streaming} result={aiResult} onClose={()=>setAIOpen(false)} onAccept={handleAccept} onRegenerate={handleGenerate}/>
    </div>
  );
});

const BrandStoryBoxAI = memo(function BrandStoryBoxAI({ value, onChange, sellerName, bagCategories }) {
  const [focused, setFocused] = useState(false);
  const [aiOpen, setAIOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [aiResult, setAIResult] = useState("");
  const { generate } = useAIAssist();
  const wrapRef = useRef(null);
  const max = 400;
  const pct = Math.min(((value?.length||0)/max)*100,100);
  const circ = 2*Math.PI*13;
  const handleChange = useCallback((e) => { if (onChange) onChange(e.target.value.slice(0,max)); }, [onChange, max]);
  useEffect(() => {
    const h=(e)=>{ if(wrapRef.current&&!wrapRef.current.contains(e.target)) setAIOpen(false); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  }, []);
  const handleGenerate = useCallback(async (stylePref) => {
    setStreaming(true); setAIResult("");
    const catLabels=(bagCategories||[]).map(id=>BAG_CATEGORIES.find(c=>c.id===id)?.label).filter(Boolean).join(", ");
    await generate({ prompt:`Write a compelling brand story for a bag seller on BagSearch. Seller: ${sellerName||"a Nigerian bag seller"}. Categories: ${catLabels||"luxury & designer bags"}. Style: ${stylePref||"warm, authentic, and aspirational"}. ${value?`Existing story to improve: "${value}"`:""}. Requirements: 2-4 sentences, max 380 characters, first person, evokes trust and quality. Return ONLY the brand story text.`, onChunk:(t)=>setAIResult(t), onDone:(t)=>{setAIResult(t.trim().slice(0,max));setStreaming(false);}, onError:(e)=>{setAIResult("Error: "+e);setStreaming(false);} });
  }, [generate, sellerName, bagCategories, value, max]);
  const handleAccept = useCallback(() => { onChange(aiResult.trim().slice(0,max)); setAIOpen(false); setAIResult(""); }, [onChange, aiResult, max]);
  return (
    <div ref={wrapRef} style={{ position:"relative" }}>
      <div style={{ border:`2px solid ${focused?C.primary:(value&&value.length>0)?C.heroDark:C.cardBorder}`, borderRadius:16, background:focused?C.primaryPale:C.surface, transition:"all 0.3s", boxShadow:focused?`0 0 0 4px ${C.primaryBg},0 8px 32px rgba(200,75,17,0.1)`:"none" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:8, background:focused?C.primary:C.primaryBg, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.3s" }}>
              <MS name="auto_awesome" size={13} style={{ color:focused?"#fff":C.primary }}/>
            </div>
            <span style={{ fontSize:10, fontWeight:800, color:focused?C.primary:C.textFaint, letterSpacing:"0.12em", textTransform:"uppercase" }}>Brand Story</span>
          </div>
          <button onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setAIOpen(v=>!v); if(!aiOpen){setAIResult("");setStreaming(false);} }} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, border:`1.5px solid ${aiOpen?C.primary:C.primaryBorder}`, background:aiOpen?`linear-gradient(135deg,${C.primary},${C.accent})`:C.primaryPale, color:aiOpen?"white":C.primary, fontSize:10, fontWeight:800, cursor:"pointer", fontFamily:"'Manrope',sans-serif", letterSpacing:"0.06em", transition:"all 0.25s" }}>
            <SparkleIcon size={11} color={aiOpen?"white":C.primary} animated={streaming}/>
            {streaming?"Writing…":"AI Assist"}
          </button>
        </div>
        <textarea value={value||''} onChange={handleChange} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} placeholder="Tell buyers about your bag brand — your origin story, what makes your pieces special…" rows={4} style={{ width:"100%", border:"none", outline:"none", resize:"none", background:"transparent", padding:"10px 16px 0", fontSize:12, fontWeight:500, color:C.text, lineHeight:1.7, fontFamily:"'Manrope',sans-serif" }}/>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", padding:"4px 12px 10px", gap:7 }}>
          <span style={{ fontSize:10, color:C.textFaint, fontWeight:600 }}>{(value?.length||0)}/{max}</span>
          <svg width="30" height="30" viewBox="0 0 30 30" style={{ transform:"rotate(-90deg)" }}>
            <circle cx="15" cy="15" r="13" fill="none" stroke={C.borderLight} strokeWidth="2.5"/>
            <circle cx="15" cy="15" r="13" fill="none" stroke={pct>=100?C.danger:pct>75?C.accent:C.primary} strokeWidth="2.5" strokeDasharray={circ} strokeDashoffset={circ-(circ*pct)/100} strokeLinecap="round" style={{ transition:"stroke-dashoffset 0.4s ease,stroke 0.3s" }}/>
          </svg>
        </div>
      </div>
      <AIAssistBubble visible={aiOpen} field="brand_story" streaming={streaming} result={aiResult} onClose={()=>setAIOpen(false)} onAccept={handleAccept} onRegenerate={handleGenerate}/>
    </div>
  );
});

function CatChip({ cat, selected, onClick, index, visible }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:3, padding:"12px 14px", borderRadius:14, textAlign:"left", cursor:"pointer", border:`2px solid ${selected?C.primary:hov?C.heroDark:C.cardBorder}`, background:selected?`linear-gradient(135deg,${C.primaryBg},${C.hero}88)`:hov?C.primaryPale:C.surface, boxShadow:selected?`0 5px 20px rgba(200,75,17,0.2),inset 0 1px 0 rgba(255,255,255,0.5)`:"none", transform:selected?"scale(1.04)":hov?"translateY(-2px)":"scale(1)", opacity:visible?1:0, transition:`opacity 0.4s ease ${100+index*45}ms,transform 0.35s cubic-bezier(0.34,1.56,0.64,1),border-color 0.2s,background 0.2s,box-shadow 0.25s`, position:"relative", overflow:"hidden", fontFamily:"'Manrope',sans-serif" }}>
      {selected && <div style={{ position:"absolute", top:7, right:7, width:16, height:16, borderRadius:"50%", background:C.primary, display:"flex", alignItems:"center", justifyContent:"center" }}><MS name="check" size={10} style={{ color:"#fff" }}/></div>}
      <span style={{ fontSize:20, lineHeight:1 }}>{cat.emoji}</span>
      <span style={{ fontSize:11, fontWeight:800, color:selected?C.primary:C.text }}>{cat.label}</span>
      <span style={{ fontSize:9, fontWeight:500, color:selected?C.textMid:C.textFaint }}>{cat.desc}</span>
    </button>
  );
}

function SaveToast({ message, type, visible }) {
  return (
    <div style={{ position:"fixed", bottom:32, left:"50%", transform:`translateX(-50%) translateY(${visible?0:80}px)`, opacity:visible?1:0, transition:"all 0.45s cubic-bezier(0.22,1,0.36,1)", zIndex:9999, pointerEvents:"none", display:"flex", alignItems:"center", gap:10, padding:"12px 26px", borderRadius:50, background:type==="success"?`linear-gradient(135deg,${C.success},#15803d)`:`linear-gradient(135deg,${C.danger},#b91c1c)`, color:"#fff", fontSize:13, fontWeight:700, fontFamily:"'Manrope',sans-serif", boxShadow:"0 12px 40px rgba(0,0,0,0.22)" }}>
      <MS name={type==="success"?"check_circle":"error"} size={16} style={{ color:"#fff" }}/>{message}
    </div>
  );
}

function SCard({ children, visible, delay=0, extra={} }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.95)", backdropFilter:"blur(12px)", border:`1.5px solid ${C.cardBorder}`, borderRadius:20, padding:"28px", marginBottom:16, boxShadow:`0 6px 32px rgba(200,75,17,0.06)`, opacity:visible?1:0, transform:visible?"none":"translateY(24px)", transition:`opacity 0.55s ease ${delay}ms,transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms`, ...extra }}>
      {children}
    </div>
  );
}

function EditProfilePanel({ seller, userId, onSaved, panelIn }) {
  const [form, setForm] = useState({ full_name:'', email:'', phone:'', brand_name:'', brand_story:'' });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState({ visible:false, message:'', type:'success' });
  const [sec1In, setSec1In] = useState(false);
  const [sec2In, setSec2In] = useState(false);
  const [sec3In, setSec3In] = useState(false);
  const [catsIn, setCatsIn] = useState(false);

  useEffect(() => {
    if (!panelIn) return;
    setTimeout(()=>setSec1In(true),80);
    setTimeout(()=>setSec2In(true),220);
    setTimeout(()=>setSec3In(true),360);
    setTimeout(()=>setCatsIn(true),480);
  }, [panelIn]);

  useEffect(() => {
    if (!seller) return;
    setForm({ full_name:seller.name||'', email:seller.email||'', phone:seller.phone||'', brand_name:seller.brand_name||'', brand_story:seller.brand_story||'' });
    setCategories(seller.bag_categories||[]);
  }, [seller]);

  const showToast = useCallback((msg, type='success') => { setToast({ visible:true, message:msg, type }); setTimeout(()=>setToast(t=>({...t,visible:false})),3000); }, []);
  const handleFullName  = useCallback((e) => setForm(prev=>({...prev, full_name:e.target.value})), []);
  const handleEmail     = useCallback((e) => setForm(prev=>({...prev, email:e.target.value})), []);
  const handlePhone     = useCallback((e) => setForm(prev=>({...prev, phone:e.target.value})), []);
  const handleBrandName = useCallback((e) => setForm(prev=>({...prev, brand_name:e.target.value})), []);
  const handleBrandStory= useCallback((v) => setForm(prev=>({...prev, brand_story:v})), []);
  const toggleCat       = useCallback((id) => setCategories(prev=>prev.includes(id)?prev.filter(c=>c!==id):[...prev,id]), []);

  const handleSave = useCallback(async () => {
    if (!form.full_name.trim()) { showToast('Name is required','error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { showToast('Invalid email address','error'); return; }
    if (categories.length===0) { showToast('Pick at least one bag category','error'); return; }
    setSaving(true);
    try {
      const baseUpdates = { full_name:form.full_name.trim(), email:form.email.trim(), phone:form.phone.trim() };
      const fullUpdates = { ...baseUpdates, brand_name:form.brand_name.trim(), brand_story:form.brand_story.trim(), bag_categories:categories };
      let updates = fullUpdates;
      let { error } = await supabase.from('users').update(fullUpdates).eq('user_id',userId);
      if (error && isMissingColumnError(error)) { const fallback = await supabase.from('users').update(baseUpdates).eq('user_id',userId); error=fallback.error; updates=baseUpdates; }
      if (error) throw error;
      const { data:{user:authUser} } = await supabase.auth.getUser();
      const updateData = { data:{ full_name:form.full_name } };
      if (authUser && form.email!==authUser.email) updateData.email=form.email;
      const { error:authError } = await supabase.auth.updateUser(updateData);
      if (authError) throw authError;
      setSaved(true);
      showToast('Profile saved successfully! 🎉','success');
      onSaved?.({ ...updates, brand_name:updates.brand_name??'', brand_story:updates.brand_story??'', bag_categories:updates.bag_categories??[] });
      setTimeout(()=>setSaved(false),2800);
    } catch(e) { showToast(e.message||'Save failed','error'); }
    finally { setSaving(false); }
  }, [form, categories, userId, onSaved, showToast]);

  const SHead = ({ icon, title, subtitle, color=C.primary }) => (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22 }}>
      <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${color}18,${color}35)`, border:`1.5px solid ${color}35`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <MS name={icon} size={19} style={{ color }}/>
      </div>
      <div>
        <h4 style={{ fontSize:14, fontWeight:900, color:C.text, letterSpacing:"-0.02em", lineHeight:1, fontFamily:"'DM Serif Display',serif" }}>{title}</h4>
        {subtitle && <p style={{ fontSize:10, color:C.textFaint, fontWeight:500, marginTop:3 }}>{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div style={{ position:"relative" }}>
      <div style={{ borderRadius:20, overflow:"hidden", marginBottom:16, background:`linear-gradient(135deg,${C.hero} 0%,${C.heroDark} 55%,#f0a882 100%)`, padding:"28px 32px", boxShadow:`0 10px 48px rgba(200,75,17,0.14)`, position:"relative", opacity:panelIn?1:0, transform:panelIn?"translateY(0)":"translateY(20px)", transition:"opacity 0.6s ease,transform 0.6s cubic-bezier(0.22,1,0.36,1)" }}>
        <div style={{ position:"relative", zIndex:2 }}>
          <h3 style={{ fontSize:"clamp(1.3rem,3vw,1.8rem)", fontWeight:900, color:C.textDark, letterSpacing:"-0.04em", fontFamily:"'DM Serif Display',serif", lineHeight:1.1, marginBottom:8 }}>Shape How Buyers<br/><em style={{ fontStyle:"italic", color:C.primary }}>See Your Brand.</em></h3>
          <p style={{ fontSize:12, color:C.textMid, fontWeight:500 }}>{categories.length>0?categories.map(id=>BAG_CATEGORIES.find(c=>c.id===id)?.emoji).join(' '):'Pick your categories below ↓'}{" · "}<span style={{ opacity:0.7 }}>Tap ✨ for AI suggestions</span></p>
        </div>
      </div>
      <SCard visible={sec1In}>
        <SHead icon="person" title="Personal Info" subtitle="Your identity on BagSearch"/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14 }}>
          <FloatInput label="Full Name" value={form.full_name} onChange={handleFullName} icon="badge" iconColor={C.primary}/>
          <FloatInput label="Email" value={form.email} onChange={handleEmail} icon="mail" iconColor={C.accent} type="email"/>
          <FloatInput label="Phone" value={form.phone} onChange={handlePhone} icon="phone" iconColor={C.success} type="tel" hint="Include country code e.g. +234"/>
        </div>
      </SCard>
      <SCard visible={sec2In}>
        <SHead icon="storefront" title="Brand Identity" subtitle="Make your brand unforgettable — tap ✨ for Gemini AI help" color={C.accent}/>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <FloatInputAI label="Brand Name" value={form.brand_name} onChange={handleBrandName} icon="shopping_bag" iconColor={C.primary} hint="Your store name e.g. Adé Bags Lagos — tap ✨ for AI name ideas"/>
          <BrandStoryBoxAI value={form.brand_story} onChange={handleBrandStory} sellerName={form.brand_name||form.full_name} bagCategories={categories}/>
        </div>
      </SCard>
      <SCard visible={sec3In}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:22, flexWrap:"wrap", gap:8 }}>
          <SHead icon="sell" title="Bag Categories" subtitle="Select all that apply" color={C.primaryLight}/>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
            {categories.length>0 && <span style={{ fontSize:10, fontWeight:800, padding:"4px 11px", borderRadius:20, background:C.primaryBg, color:C.primary, border:`1px solid ${C.primaryBorder}` }}>{categories.length} selected</span>}
            {categories.length>0 && <button onClick={()=>setCategories([])} style={{ fontSize:10, fontWeight:600, color:C.textMuted, background:"none", border:"none", cursor:"pointer", textDecoration:"underline", fontFamily:"inherit" }}>Clear</button>}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10 }}>
          {BAG_CATEGORIES.map((cat,i)=><CatChip key={cat.id} cat={cat} selected={categories.includes(cat.id)} onClick={()=>toggleCat(cat.id)} index={i} visible={catsIn}/>)}
        </div>
      </SCard>
      <div style={{ display:"flex", justifyContent:"flex-end", gap:12, opacity:sec3In?1:0, transition:"opacity 0.5s ease 300ms" }}>
        <button onClick={handleSave} disabled={saving} style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 40px", borderRadius:16, border:"none", background:saved?`linear-gradient(135deg,${C.success},#15803d)`:`linear-gradient(135deg,${C.primary} 0%,${C.accent} 50%,${C.primaryLight} 100%)`, color:"#fff", fontSize:14, fontWeight:900, cursor:saving?"default":"pointer", fontFamily:"'DM Serif Display',serif", letterSpacing:"-0.02em", boxShadow:`0 8px 36px rgba(200,75,17,0.4)`, transition:"all 0.4s cubic-bezier(0.22,1,0.36,1)", position:"relative", overflow:"hidden" }} onMouseEnter={e=>{if(!saving){e.currentTarget.style.transform="translateY(-4px) scale(1.03)";}}} onMouseLeave={e=>{e.currentTarget.style.transform="none";}}>
          <MS name={saving?"hourglass_empty":saved?"check_circle":"save"} size={17} style={{ color:"#fff", animation:saving?"spin 0.8s linear infinite":"none" }}/>
          {saving?"Saving…":saved?"Profile Saved!":"Save My Profile"}
        </button>
      </div>
      <SaveToast message={toast.message} type={toast.type} visible={toast.visible}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export default function SellerProfile() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [seller,            setSeller]            = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab,         setActiveTab]         = useState('dashboard');

  const [buyerViews,          setBuyerViews]          = useState([]);
  const [reviewCount,         setReviewCount]         = useState(0);
  const [reviewsLoading,      setReviewsLoading]      = useState(true);
  const [hasBankDetails,      setHasBankDetails]      = useState(true); // assume true to avoid flash

  const [ready,         setReady]         = useState(false);
  const [editPanelIn,   setEditPanelIn]   = useState(false);
  const [shareModalOpen,setShareModalOpen]= useState(false);
  const [deleteModalOpen,setDeleteModalOpen] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [deleted,       setDeleted]       = useState(false);

  // SEO for seller dashboard (private - noindex)
  useSEO({
    title: 'Seller Dashboard | BagSearch',
    description: 'Manage your BagSearch seller account. View product views, buyer inquiries, update listings, and track your performance.',
    keywords: 'seller dashboard, manage listings, seller profile, product views, buyer inquiries, bag business',
    url: '/seller-profile',
    type: 'website',
    noindex: true // Prevent indexing of private dashboard
  });

  // Lets the verification cards play their entrance once the page has painted.
  useEffect(()=>{ const t=setTimeout(()=>setReady(true),400); return ()=>clearTimeout(t); },[]);

  useEffect(()=>{
    async function loadSeller() {
      try {
        if (!user){ setError('User not authenticated'); setLoading(false); return; }
        let { data, error:e } = await supabase.from('users').select('full_name,email,phone,brand_name,brand_story,bag_categories,date_of_birth').eq('user_id',user.id).maybeSingle();
        if (e && isMissingColumnError(e)) {
          const fallback = await supabase.from('users').select('full_name,email,phone').eq('user_id',user.id).maybeSingle();
          data=fallback.data; e=fallback.error;
        }
        if (e) throw e;
        setSeller({ name:data?.full_name||user.user_metadata?.full_name||'Seller', email:data?.email||user.email||'N/A', phone:data?.phone||user.user_metadata?.phone||'N/A', brand_name:data?.brand_name||'', brand_story:data?.brand_story||'', bag_categories:data?.bag_categories||[], date_of_birth:data?.date_of_birth||null, avatar:null, id:user.id });
      } catch(err){ setError(err.message); }
      finally { setLoading(false); }
    }
    loadSeller();

    // Check if seller has bank details set up
    if (user?.id) {
      supabase.from('seller_bank_details').select('id').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => { setHasBankDetails(!!data); })
        .catch(() => { /* graceful fallback */ });
    }
  },[user]);

  // Recent buyers who viewed this seller's bags (with contact details when available)
  useEffect(()=>{
    async function loadRecentViewers() {
      try {
        if (!user) return;
        const byUser = await supabase.from('products').select('id').eq('user_id',user.id);
        let rows=byUser.data||[], queryError=byUser.error;
        if (rows.length===0||(queryError&&isMissingColumnError(queryError))) {
          const bySeller=await supabase.from('products').select('id').eq('seller_id',user.id);
          if(!bySeller.error){rows=bySeller.data||[];queryError=null;}
          else if(!queryError||isMissingColumnError(queryError)) queryError=bySeller.error;
        }
        if (queryError&&rows.length===0&&!isMissingColumnError(queryError)) throw queryError;
        const productIds=rows.map(p=>p.id).filter(Boolean);
        if (!productIds.length){ setBuyerViews([]); return; }
        const {data:vd,error:ve}=await supabase.from('product_views').select(`id,product_id,buyer_id,viewed_at,source,buyer_name,buyer_phone,buyer_email,products:product_id(id,name,images)`).in('product_id',productIds).order('viewed_at',{ascending:false}).limit(20);
        if (!ve){ const enrichedViews=await enrichBuyerViewsWithProfiles(vd||[]); setBuyerViews(enrichedViews.map(mapBuyerViewRow)); }
        else setBuyerViews([]);
      } catch(e){ console.error(e); }
    }
    loadRecentViewers();
  },[user]);

  useEffect(()=>{
    async function loadReviewCount() {
      try {
        if (!user) return;
        setReviewsLoading(true);
        const { count, error:e } = await supabase.from('seller_reviews').select('id',{count:'exact',head:true}).eq('seller_id',user.id);
        if (e) throw e;
        setReviewCount(count||0);
      } catch(err){ console.error('Error loading review count:',err); }
      finally { setReviewsLoading(false); }
    }
    loadReviewCount();
  },[user]);

  const handleDeleteAccount = useCallback(async () => {
    setDeleting(true);
    try {
      const {data:{session}}=await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const userId=session.user.id;
      const {data:products}=await supabase.from('products').select('id').or(`user_id.eq.${userId},seller_id.eq.${userId}`);
      if (products&&products.length>0) {
        const productIds=products.map(p=>p.id);
        await deleteFromPinecone(productIds);
        await supabase.from('product_views').delete().in('product_id',productIds);
        await supabase.from('products').delete().in('id',productIds);
      }
      await supabase.from('product_views').delete().eq('buyer_id',userId);
      for (const {table,col} of [{table:'search_history',col:'user_id'},{table:'saved_items',col:'user_id'},{table:'orders',col:'user_id'}]) {
        try { await supabase.from(table).delete().eq(col,userId); } catch(_){}
      }
      const {data:fnData,error:fnError}=await supabase.functions.invoke('delete-account',{body:{userId}});
      if (fnError) { let msg=fnError.message; try{ const body=fnError.context?await fnError.context.json():null; if(body?.error) msg=body.error; }catch(_){} throw new Error(msg||'Failed to delete account'); }
      if (fnData?.error) throw new Error(fnData.error);
      setDeleted(true);
      setTimeout(async()=>{ await supabase.auth.signOut(); navigate('/'); },2200);
    } catch(e){ console.error('Delete account error:',e); setDeleting(false); }
  }, [navigate]);

  const switchTab = useCallback((tab) => {
    if (tab===activeTab) return;
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tab==='edit'){ setEditPanelIn(false); setTimeout(()=>setEditPanelIn(true),80); }
  }, [activeTab]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:T.bg, fontFamily:FONT_SANS }}>
      <div role="status" style={{ textAlign:"center" }}>
        <div style={{ width:36, height:36, border:`3px solid ${T.line}`, borderTopColor:T.accent, borderRadius:"50%", animation:"spin 0.7s linear infinite", margin:"0 auto 12px" }}/>
        <p style={{ color:T.ink2, fontSize:14, fontWeight:600 }}>Loading your dashboard…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:T.bg, fontFamily:FONT_SANS }}>
      <div style={{ textAlign:"center", maxWidth:360, padding:32 }}>
        <p style={{ color:T.redInk, fontWeight:700, marginBottom:16 }}>Something went wrong: {error}</p>
        <button onClick={()=>navigate('/products')} style={{ height:44, padding:"0 22px", background:T.ink, color:"white", border:"none", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:700 }}>Back to shopping</button>
      </div>
    </div>
  );

  const initials = seller?.name ? seller.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : 'S';
  const firstName = (seller?.name || 'there').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const heading = activeTab==='edit' ? 'Your shop profile' : `${greeting}, ${firstName}`;
  const today = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });

  return (
    <MotionConfig reducedMotion="user">
    <div style={{ display:"flex", minHeight:"100vh", background:T.bg, fontFamily:FONT_SANS, color:T.ink }}>
      <BirthdayCelebration seller={seller}/>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .sp-root :focus-visible{outline:2px solid ${T.accent};outline-offset:2px;border-radius:6px}

        @keyframes fadeUp       {from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)}}
        @keyframes rowSlide     {from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes cardSlideUp  {from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)}}
        @keyframes pulse        {0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes spin         {to{transform:rotate(360deg)}}
        @keyframes confettiFall {0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(360deg);opacity:0}}
        @keyframes birthdayBounce{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-8px) rotate(4deg)}}
        @keyframes popIn        {from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
        @keyframes overlayFade  {from{opacity:0}to{opacity:1}}
        @keyframes tabSlideIn   {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes progressPulse{0%{width:0%;opacity:1}70%{width:100%;opacity:1}100%{width:100%;opacity:0}}
        @keyframes modalPop     {from{opacity:0;transform:translate(-50%,-50%) scale(0.93)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        @keyframes sparklePulse {0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.2);opacity:0.7}}
        @keyframes verifyBorderWipe  {to{clip-path:inset(0 0% 0 0 round 22px)}}
        @keyframes verifyBorderShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        @keyframes verifyBadgePop   {0%{transform:scale(0.6);opacity:0}60%{transform:scale(1.12);opacity:1}100%{transform:scale(1);opacity:1}}
        .verify-frame{position:relative;border-radius:22px;padding:2px;background:linear-gradient(120deg,${C.primary},${C.primaryLight},#D9A93A,${C.primary});background-size:300% 300%;clip-path:inset(0 100% 0 0 round 22px)}
        .verify-frame.is-visible{animation:verifyBorderWipe 0.9s cubic-bezier(0.22,1,0.36,1) forwards,verifyBorderShift 7s ease-in-out 0.9s infinite}
        .verify-badge-icon{animation:none}
        .verify-frame.is-visible .verify-badge-icon{animation:verifyBadgePop 0.6s cubic-bezier(0.22,1,0.36,1) 0.75s backwards}
        @keyframes shareCardIn  {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scanLine     {0%{left:-40px}100%{left:calc(100% + 40px)}}
        @media (prefers-reduced-motion: reduce){
          .verify-frame{clip-path:inset(0 0% 0 0 round 22px) !important}
          .verify-frame.is-visible,.verify-frame.is-visible .verify-badge-icon{animation:none !important}
        }

        .sidebar-desktop{display:flex!important}
        .main-content{margin-left:248px!important}
        .hamburger-btn{display:none!important}
        .inquiry-table{display:block!important}
        .inquiry-cards{display:none!important}
        .hide-sm{display:flex!important}

        @media(max-width:900px){
          .sidebar-desktop{display:none!important}
          .main-content{margin-left:0!important}
          .hamburger-btn{display:flex!important}
          .inquiry-table{display:none!important}
          .inquiry-cards{display:block!important}
        }
        @media(max-width:600px){
          .page-padding{padding:20px 16px 120px!important}
          .header-inner{padding:0 12px!important}
          .hide-sm{display:none!important}
        }
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.lineStrong};border-radius:3px}
      `}</style>

      {/* ── DESKTOP SIDEBAR ── */}
      <motion.aside className="sidebar-desktop" initial={{ x:-40, opacity:0 }} animate={{ x:0, opacity:1 }} transition={{ duration:0.5, ease:EASE_OUT }}
        style={{ width:248, background:T.ink, position:"fixed", top:0, bottom:0, flexDirection:"column", zIndex:20 }}>
        <SidebarContents layoutGroup="desk" initials={initials} seller={seller} navigate={navigate} activeTab={activeTab} switchTab={switchTab} onDeleteClick={()=>setDeleteModalOpen(true)}/>
      </motion.aside>

      {/* ── MOBILE SIDEBAR ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div key="scrim" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={()=>setMobileSidebarOpen(false)}
              style={{ position:"fixed", inset:0, background:"rgba(20,14,11,0.55)", zIndex:60 }}/>
            <motion.aside key="drawer" role="dialog" aria-modal="true" aria-label="Seller menu"
              initial={{ x:'-100%' }} animate={{ x:0 }} exit={{ x:'-100%' }} transition={{ duration:0.35, ease:EASE_OUT }}
              style={{ width:272, background:T.ink, position:"fixed", top:0, left:0, bottom:0, display:"flex", flexDirection:"column", zIndex:70, boxShadow:"8px 0 32px rgba(0,0,0,0.3)" }}>
              <button type="button" aria-label="Close menu" onClick={()=>setMobileSidebarOpen(false)}
                style={{ position:"absolute", top:20, right:14, width:40, height:40, borderRadius:"50%", border:"none", background:"rgba(255,255,255,0.08)", color:T.onDark, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
              <SidebarContents layoutGroup="mob" initials={initials} seller={seller} navigate={navigate} activeTab={activeTab} switchTab={(t)=>{switchTab(t);setMobileSidebarOpen(false);}} onNav={()=>setMobileSidebarOpen(false)} onDeleteClick={()=>{setMobileSidebarOpen(false);setDeleteModalOpen(true);}}/>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN ── */}
      <main className="main-content sp-root" style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>

        <motion.header initial={{ y:-64 }} animate={{ y:0 }} transition={{ duration:0.45, ease:EASE_OUT }}
          style={{ height:64, background:"rgba(250,246,241,0.88)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", borderBottom:`1px solid ${T.line}`, display:"flex", alignItems:"center", position:"sticky", top:0, zIndex:30 }}>
          <div className="header-inner" style={{ width:"100%", padding:"0 40px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button type="button" className="hamburger-btn" aria-label="Open menu" onClick={()=>setMobileSidebarOpen(true)}
                style={{ width:44, height:44, borderRadius:12, border:`1px solid ${T.line}`, background:T.surface, cursor:"pointer", alignItems:"center", justifyContent:"center", color:T.ink }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
              </button>
              <span className="hamburger-btn" style={{ fontSize:17, fontWeight:800, alignItems:"center" }}>Bag<span style={{ color:T.accent }}>Search</span></span>
              <span className="sidebar-desktop" style={{ fontSize:13, color:T.muted, fontWeight:600 }}>{today}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
              <NotificationsDropdown/>
              <motion.button type="button" className="hide-sm" onClick={()=>setShareModalOpen(true)} whileHover={{ y:-1 }} whileTap={{ scale:0.96 }}
                style={{ height:44, padding:"0 16px", borderRadius:12, border:`1px solid ${T.lineStrong}`, background:T.surface, color:T.ink, fontSize:14, fontWeight:700, cursor:"pointer", alignItems:"center", gap:8, fontFamily:"inherit" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>
                Share shop
              </motion.button>
              <motion.button type="button" onClick={()=>navigate('/upload-product')} whileHover={{ y:-2, boxShadow:'0 10px 24px rgba(180,65,14,0.3)' }} whileTap={{ scale:0.96 }}
                style={{ height:44, padding:"0 18px", borderRadius:12, border:"none", background:T.accent, color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"inherit", boxShadow:'0 4px 14px rgba(180,65,14,0.22)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                New listing
              </motion.button>
            </div>
          </div>
        </motion.header>

        <div className="page-padding" style={{ padding:"32px 40px 64px", flex:1, maxWidth:1400, width:"100%" }}>

          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:16, marginBottom:28 }}>
            <div>
              <AnimatePresence mode="wait">
                <motion.h1 key={heading} aria-label={heading}
                  style={{ fontFamily:FONT_SERIF, fontSize:"clamp(32px,3.4vw,44px)", fontWeight:600, lineHeight:1.1, color:T.ink }}>
                  {heading.split(' ').map((w,i)=>(
                    <span key={i} aria-hidden="true">
                      {i>0 && ' '}
                      <span style={{ display:'inline-block', overflow:'hidden', verticalAlign:'top', paddingBottom:'0.08em' }}>
                        <motion.span style={{ display:'inline-block' }} initial={{ y:'110%' }} animate={{ y:0 }} exit={{ y:'-110%' }} transition={{ delay:i*0.06, duration:0.6, ease:EASE_OUT }}>{w}</motion.span>
                      </span>
                    </span>
                  ))}
                </motion.h1>
              </AnimatePresence>
              <p style={{ color:T.ink2, fontSize:14, marginTop:6 }}>
                {activeTab==='edit' ? 'Shape how buyers discover and trust your brand.' : "Here's how your shop is doing."}
              </p>
            </div>
            <div role="tablist" aria-label="Dashboard sections" style={{ display:"flex", padding:4, borderRadius:12, background:T.sand }}>
              {[{ key:'dashboard', label:'Overview' },{ key:'edit', label:'Shop profile' }].map(t=>(
                <button key={t.key} type="button" role="tab" aria-selected={activeTab===t.key} onClick={()=>switchTab(t.key)}
                  style={{ position:"relative", height:40, padding:"0 16px", borderRadius:9, border:"none", background:"transparent", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:activeTab===t.key?800:700, color:activeTab===t.key?T.ink:T.ink2 }}>
                  {activeTab===t.key && <motion.span layoutId="sp-tab-pill" transition={{ type:'spring', stiffness:450, damping:34 }} style={{ position:"absolute", inset:0, borderRadius:9, background:T.surface, boxShadow:'0 1px 3px rgba(28,20,16,0.12)' }}/>}
                  <span style={{ position:"relative" }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab==='dashboard' ? (
              <motion.div key="dash" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={{ duration:0.35, ease:EASE_OUT }}
                style={{ display:"flex", flexDirection:"column", gap:40 }}>

                <SellerOverview userId={user?.id} seller={seller} hasBankDetails={hasBankDetails} navigate={navigate} onEditProfile={()=>switchTab('edit')}/>

                <motion.section aria-labelledby="sp-viewers-h" initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-60px' }} transition={{ duration:0.55, ease:EASE_OUT }}>
                  <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:16, gap:10, flexWrap:"wrap" }}>
                    <div>
                      <h2 id="sp-viewers-h" style={{ fontFamily:FONT_SERIF, fontSize:28, fontWeight:600, color:T.ink }}>Recent viewers</h2>
                      <p style={{ fontSize:13, color:T.ink2, marginTop:2 }}>Buyers who looked at your bags — follow up while they're interested.</p>
                    </div>
                    <span style={{ fontSize:13, color:T.muted, fontWeight:600 }}>{buyerViews.length} most recent</span>
                  </div>

                  <div className="inquiry-table" style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.line}`, overflow:"hidden" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"2.2fr 1.2fr 1.3fr 1fr 1.4fr", padding:"14px 24px", background:T.bg, borderBottom:`1px solid ${T.line}` }}>
                      {['Bag','Buyer','Found via','When','Follow up'].map((h,i)=>(
                        <div key={h} style={{ fontSize:12, fontWeight:700, color:T.muted, textAlign:i===4?"right":"left" }}>{h}</div>
                      ))}
                    </div>
                    {buyerViews.map((row,i)=><InquiryRow key={row.id} row={row} index={i} ready/>)}
                    {buyerViews.length===0 && (
                      <div style={{ padding:"48px 24px", textAlign:"center" }}>
                        <p style={{ color:T.ink, fontSize:14, fontWeight:700 }}>No viewers yet</p>
                        <p style={{ color:T.ink2, fontSize:13, marginTop:4 }}>Buyers will appear here once they browse your listings.</p>
                      </div>
                    )}
                  </div>
                  <div className="inquiry-cards">
                    {buyerViews.map((row,i)=><InquiryCard key={row.id} row={row} index={i} ready/>)}
                    {buyerViews.length===0 && <p style={{ color:T.ink2, fontSize:14, padding:"24px 0" }}>No viewers yet — buyers will appear here once they browse your listings.</p>}
                  </div>
                </motion.section>

                <motion.section aria-labelledby="sp-grow-h" initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-60px' }} transition={{ duration:0.55, ease:EASE_OUT }}>
                  <h2 id="sp-grow-h" style={{ fontFamily:FONT_SERIF, fontSize:28, fontWeight:600, color:T.ink, marginBottom:16 }}>Grow your shop</h2>
                  <div id="seller-verify" style={{ scrollMarginTop:96 }}>
                    <NinVerificationCard sellerId={user?.id} visible={ready}/>
                  </div>
                  <VerifiedBadgeCard seller={seller} visible={ready} reviewCount={reviewCount} reviewsLoading={reviewsLoading} onShare={()=>setShareModalOpen(true)}/>
                  <DiscountPromoCard navigate={navigate} visible={ready}/>
                </motion.section>
              </motion.div>
            ) : (
              <motion.div key="edit" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={{ duration:0.35, ease:EASE_OUT }} style={{ maxWidth:720 }}>
                <EditProfilePanel seller={seller} userId={user?.id} panelIn={editPanelIn}
                  onSaved={(updates)=>setSeller(prev=>({ ...prev, name:updates.full_name, email:updates.email, phone:updates.phone, brand_name:updates.brand_name, brand_story:updates.brand_story, bag_categories:updates.bag_categories }))}/>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── SHARE PROFILE MODAL ── */}
      <ShareProfileModal visible={shareModalOpen} onClose={()=>setShareModalOpen(false)} seller={seller}/>

      <DeleteAccountModal visible={deleteModalOpen} onClose={()=>{ if(!deleting&&!deleted){setDeleteModalOpen(false);setDeleted(false);} }} onConfirm={handleDeleteAccount} deleting={deleting} deleted={deleted}/>
    </div>
    </MotionConfig>
  );
}

// ─── Sidebar contents ─────────────────────────────────────────────────────────
const NavIcon = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const NAV_ICONS = {
  dashboard: <NavIcon d={<><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>}/>,
  listings:  <NavIcon d={<><path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></>}/>,
  upload:    <NavIcon d={<><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/></>}/>,
  bank:      <NavIcon d={<path d="M3 10l9-6 9 6M5 10v9M19 10v9M9 10v9M15 10v9M3 21h18"/>}/>,
  pricing:   <NavIcon d={<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>}/>,
  edit:      <NavIcon d={<><circle cx="12" cy="8" r="4"/><path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5"/></>}/>,
  shop:      <NavIcon d={<><path d="M4 10v10h16V10"/><path d="M3 10l2-6h14l2 6"/><path d="M10 20v-5h4v5"/></>}/>,
  home:      <NavIcon d={<path d="M15 5l-7 7 7 7"/>}/>,
};

function SidebarContents({ layoutGroup, initials, seller, navigate, activeTab, switchTab, onNav, onDeleteClick }) {
  const navItems = [
    { key:'dashboard', label:'Overview' },
    { key:'listings',  label:'Listings' },
    { key:'upload',    label:'Upload a bag' },
    { key:'bank',      label:'Payouts' },
    { key:'pricing',   label:'Plans & pricing' },
    { key:'edit',      label:'Shop profile' },
    { key:'shop',      label:'View my shop' },
  ];

  const handleClick = useCallback((key) => {
    if (key==='dashboard'||key==='edit') switchTab?.(key);
    if (key==='listings') navigate('/seller-listing');
    if (key==='upload')   navigate('/upload-product');
    if (key==='bank')     navigate('/bank-details');
    if (key==='pricing')  navigate('/pricing');
    if (key==='shop')     navigate(`/vendor/${seller?.id || ''}`);
    if (key==='home')     navigate('/products');
    onNav?.();
  }, [navigate, switchTab, onNav, seller?.id]);

  return (
    <>
      <div style={{ padding:"24px 20px 16px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:10, background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", color:T.ink }}>{NAV_ICONS.listings}</div>
        <div>
          <div style={{ fontSize:17, fontWeight:800, color:T.bg, letterSpacing:"-0.02em" }}>Bag<span style={{ color:T.accentOnDark }}>Search</span></div>
          <div style={{ fontSize:11, color:T.onDarkMuted, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase" }}>Seller</div>
        </div>
      </div>

      <div style={{ margin:"0 16px 16px", display:"flex", alignItems:"center", gap:12, padding:12, borderRadius:12, background:T.dark2 }}>
        <div style={{ width:40, height:40, borderRadius:999, background:T.accentOnDark, color:T.ink, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, flexShrink:0 }}>{initials}</div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.bg, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{seller?.brand_name || seller?.name}</div>
          <div style={{ fontSize:12, color:T.onDarkMuted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{seller?.email}</div>
        </div>
      </div>

      <nav aria-label="Seller" style={{ flex:1, padding:"0 12px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" }}>
        {navItems.map((item,i)=>{
          const isActive=item.key===activeTab;
          return (
            <motion.button key={item.key} type="button" onClick={()=>handleClick(item.key)} aria-current={isActive?'page':undefined}
              initial={{ opacity:0, x:-14 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1+i*0.05, duration:0.4, ease:EASE_OUT }}
              whileHover={isActive ? undefined : { x:3 }}
              style={{ position:"relative", display:"flex", alignItems:"center", gap:12, height:44, padding:"0 12px", borderRadius:10, border:"none", background:"transparent", color:isActive?T.ink:T.onDark, cursor:"pointer", fontFamily:"inherit", fontSize:14, fontWeight:isActive?800:600, textAlign:"left" }}>
              {isActive && <motion.span layoutId={`sp-nav-active-${layoutGroup}`} transition={{ type:'spring', stiffness:420, damping:34 }} style={{ position:"absolute", inset:0, borderRadius:10, background:T.bg }}/>}
              <span style={{ position:"relative", display:"flex" }}>{NAV_ICONS[item.key]}</span>
              <span style={{ position:"relative" }}>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div style={{ padding:"16px 16px 20px", borderTop:`1px solid ${T.dark3}`, display:"flex", flexDirection:"column", gap:6 }}>
        <button type="button" onClick={()=>handleClick('home')}
          style={{ display:"flex", alignItems:"center", gap:10, height:44, padding:"0 12px", borderRadius:10, border:"none", background:"transparent", color:T.onDark, cursor:"pointer", fontFamily:"inherit", fontSize:14, fontWeight:600 }}>
          {NAV_ICONS.home} Back to shopping
        </button>
        <button type="button" onClick={onDeleteClick}
          style={{ display:"flex", alignItems:"center", gap:10, height:44, padding:"0 12px", borderRadius:10, border:"1px solid rgba(240,160,112,0.25)", background:"transparent", color:"#F4B7A6", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
          Delete account
        </button>
      </div>
    </>
  );
}
