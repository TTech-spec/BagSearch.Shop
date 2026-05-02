import { useState, useEffect, useContext, useMemo, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';
import { deleteFromPinecone } from './services/visualSearch';
import NotificationsDropdown from './components/NotificationsDropdown';
import LogoIcon from './components/Logo.jsx';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  primary:      '#c84b11',
  primaryLight: '#f97316',
  primaryBg:    '#fde8d8',
  primaryPale:  '#fdf4ee',
  primaryBorder:'#f9c4a0',
  hero:         '#f5c5a8',
  heroDark:     '#f0b090',
  accent:       '#ea580c',
  success:      '#16a34a',
  successBg:    '#dcfce7',
  danger:       '#dc2626',
  dangerBg:     '#fef2f2',
  surface:      '#ffffff',
  surfaceDim:   '#fdf8f5',
  surfacePeach: '#fde8d8',
  border:       '#f0d9cc',
  borderLight:  '#f7ece4',
  cardBorder:   '#f5ddd0',
  text:         '#1a0a00',
  textDark:     '#2d1200',
  textMid:      '#5c3317',
  textMuted:    '#9a6348',
  textFaint:    '#c4957a',
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

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
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

function StatCard({ stat, delay, ready }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:"white", borderRadius:16, padding:"22px 20px", border:`1px solid ${C.borderLight}`, boxShadow:hov?`0 8px 32px ${stat.glow},0 2px 8px rgba(0,0,0,0.06)`:`0 2px 10px rgba(200,75,17,0.05)`, transition:"all 0.3s cubic-bezier(0.22,1,0.36,1)", transform:hov?"translateY(-4px)":"none", cursor:"default", opacity:ready?1:0, animation:ready?`fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`:"none", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:stat.accent, opacity:hov?1:0, transition:"opacity 0.3s", borderRadius:"16px 16px 0 0" }}/>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:stat.glow, display:"flex", alignItems:"center", justifyContent:"center", transition:"transform 0.3s", transform:hov?"scale(1.1)":"scale(1)" }}>
          <MS name={stat.icon} size={20} style={{ color:stat.accent }}/>
        </div>
        <span style={{ fontSize:10, fontWeight:800, padding:"3px 9px", borderRadius:20, background:`${stat.accent}15`, color:stat.accent, letterSpacing:"0.06em" }}>{stat.badge}</span>
      </div>
      <p style={{ fontSize:12, color:C.textMuted, fontWeight:600, marginBottom:4 }}>{stat.label}</p>
      <p style={{ fontSize:24, fontWeight:900, color:C.text, letterSpacing:"-0.04em", lineHeight:1 }}>{stat.value}</p>
    </div>
  );
}

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

function AnimatedHeading({ text, sub, ready, delay = 0 }) {
  const chars = text.split('');
  return (
    <div style={{ opacity:ready?1:0, transition:`opacity 0.3s ease ${delay}ms` }}>
      <h3 style={{ fontSize:18, fontWeight:800, color:C.text, letterSpacing:"-0.02em", marginBottom:4, display:'flex', flexWrap:'wrap' }}>
        {chars.map((ch,i) => (
          <span key={i} style={{ display:'inline-block', opacity:ready?1:0, transform:ready?'none':'translateY(12px)', transition:`opacity 0.4s ease ${delay+i*28}ms,transform 0.4s cubic-bezier(0.22,1,0.36,1) ${delay+i*28}ms` }}>
            {ch===' '?'\u00a0':ch}
          </span>
        ))}
      </h3>
      {sub && <p style={{ fontSize:12, color:C.textMuted, fontWeight:500, opacity:ready?1:0, transform:ready?'none':'translateY(8px)', transition:`all 0.4s ease ${delay+chars.length*28+60}ms` }}>{sub}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── PROFILE URL GENERATOR ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function ProfileURLCard({ seller, userId, ready }) {
  const [slug,        setSlug]        = useState('');
  const [customSlug,  setCustomSlug]  = useState('');
  const [editing,     setEditing]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [copiedQR,    setCopiedQR]    = useState(false);
  const [slugError,   setSlugError]   = useState('');
  const [hov,         setHov]         = useState(false);
  const [showQR,      setShowQR]      = useState(false);
  const inputRef = useRef(null);

  const BASE_URL = typeof window !== 'undefined' ? `${window.location.origin}/seller/` : 'https://bagsearch.ng/seller/';

  // Generate initial slug from seller data
  useEffect(() => {
    if (!seller) return;
    const name = seller.brand_name || seller.name || '';
    const generated = slugify(name) || `seller-${userId?.slice(0,8) || 'store'}`;
    setSlug(generated);
    setCustomSlug(generated);
  }, [seller, userId]);

  // Load saved slug from DB if it exists
  useEffect(() => {
    if (!userId) return;
    supabase.from('users').select('profile_slug').eq('user_id', userId).maybeSingle()
      .then(({ data }) => {
        if (data?.profile_slug) {
          setSlug(data.profile_slug);
          setCustomSlug(data.profile_slug);
        }
      });
  }, [userId]);

  const profileURL = `${BASE_URL}${slug}`;

  const validateSlug = (val) => {
    if (!val.trim()) return 'URL handle cannot be empty';
    if (val.length < 3) return 'Must be at least 3 characters';
    if (!/^[a-z0-9-]+$/.test(val)) return 'Only lowercase letters, numbers and hyphens';
    if (val.startsWith('-') || val.endsWith('-')) return 'Cannot start or end with a hyphen';
    return '';
  };

  const handleSlugChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
    setCustomSlug(val);
    setSlugError(validateSlug(val));
  };

  const handleSave = async () => {
    const err = validateSlug(customSlug);
    if (err) { setSlugError(err); return; }
    setSaving(true);
    try {
      // Check uniqueness
      const { data: existing } = await supabase
        .from('users')
        .select('user_id')
        .eq('profile_slug', customSlug)
        .neq('user_id', userId)
        .maybeSingle();
      if (existing) { setSlugError('This URL handle is already taken. Try another.'); setSaving(false); return; }
      const { error } = await supabase.from('users').update({ profile_slug: customSlug }).eq('user_id', userId);
      if (error) throw error;
      setSlug(customSlug);
      setEditing(false);
      setSlugError('');
    } catch (e) {
      setSlugError(e.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = profileURL;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleCopyQRText = async () => {
    try {
      await navigator.clipboard.writeText(profileURL);
      setCopiedQR(true);
      setTimeout(() => setCopiedQR(false), 2000);
    } catch {}
  };

  const shareViaWhatsApp = () => {
    const msg = encodeURIComponent(`Check out my bag store on BagSearch! 🛍️\n${profileURL}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const shareViaInstagram = () => {
    // Instagram doesn't support direct URL share; copy to clipboard for IG bio
    handleCopy();
  };

  const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileURL)}&color=c84b11&bgcolor=fdf4ee&margin=12`;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'white',
        borderRadius: 20,
        border: `1.5px solid ${hov ? C.primaryBorder : C.borderLight}`,
        overflow: 'hidden',
        boxShadow: hov ? `0 12px 48px rgba(200,75,17,0.10)` : `0 2px 16px rgba(200,75,17,0.04)`,
        transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
        opacity: ready ? 1 : 0,
        transform: ready ? 'none' : 'translateY(20px)',
        marginBottom: 24,
      }}
    >
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, #1a0a00 0%, #2d1200 100%)`, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -10, width: 120, height: 120, borderRadius: '50%', background: 'rgba(200,75,17,0.15)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -20, left: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(249,115,22,0.1)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', top: 0, bottom: 0, width: 50, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)', animation: 'scanLine 3s ease-in-out infinite', pointerEvents: 'none' }}/>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg,${C.primary},${C.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px rgba(200,75,17,0.4)`, flexShrink: 0 }}>
            <MS name="link" size={22} style={{ color: 'white' }}/>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', fontFamily: "'DM Serif Display',serif" }}>
              Your Seller Profile Link
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginTop: 2 }}>
              Share with buyers to showcase all your listings
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s ease-in-out infinite' }}/>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', letterSpacing: '0.08em' }}>ACTIVE</span>
          </div>
        </div>
      </div>

      {/* URL Display + Edit */}
      <div style={{ padding: '20px 24px' }}>
        {/* URL Preview Box */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            Your Profile URL
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: C.surfaceDim, border: `2px solid ${copied ? C.success : C.primaryBorder}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.3s', boxShadow: copied ? `0 0 0 3px ${C.successBg}` : 'none' }}>
            <div style={{ padding: '12px 14px', borderRight: `1px solid ${C.borderLight}`, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <MS name="language" size={16} style={{ color: C.textFaint }}/>
            </div>
            <span style={{ flex: 1, padding: '12px 12px', fontSize: 13, fontWeight: 700, color: C.textMid, fontFamily: "'Manrope',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
              <span style={{ color: C.textFaint, fontWeight: 500 }}>{BASE_URL}</span>
              <span style={{ color: C.primary }}>{slug}</span>
            </span>
            <button
              onClick={handleCopy}
              style={{ padding: '10px 16px', background: copied ? C.success : C.primary, color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.25s', flexShrink: 0, minWidth: 90, justifyContent: 'center' }}
              onMouseEnter={e => { if (!copied) e.currentTarget.style.background = C.accent; }}
              onMouseLeave={e => { if (!copied) e.currentTarget.style.background = C.primary; }}
            >
              <MS name={copied ? 'check' : 'content_copy'} size={15}/>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Custom Slug Editor */}
        {editing ? (
          <div style={{ marginBottom: 16, background: C.primaryPale, borderRadius: 14, padding: 16, border: `1.5px solid ${C.primaryBorder}` }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              Customize Your URL Handle
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'white', border: `2px solid ${slugError ? C.danger : customSlug ? C.primary : C.cardBorder}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.25s' }}>
              <span style={{ padding: '11px 12px', fontSize: 12, color: C.textFaint, fontWeight: 500, borderRight: `1px solid ${C.borderLight}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                /seller/
              </span>
              <input
                ref={inputRef}
                type="text"
                value={customSlug}
                onChange={handleSlugChange}
                placeholder="your-brand-name"
                maxLength={40}
                style={{ flex: 1, padding: '11px 12px', border: 'none', outline: 'none', fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Manrope',monospace", background: 'transparent', letterSpacing: '-0.01em' }}
              />
              <span style={{ padding: '11px 12px', fontSize: 10, color: C.textFaint, fontWeight: 600, flexShrink: 0 }}>
                {customSlug.length}/40
              </span>
            </div>
            {slugError && (
              <p style={{ fontSize: 11, color: C.danger, fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MS name="error_outline" size={13}/> {slugError}
              </p>
            )}
            {!slugError && customSlug && (
              <p style={{ fontSize: 11, color: C.success, fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MS name="check_circle" size={13}/> Preview: {BASE_URL}{customSlug}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => { setEditing(false); setCustomSlug(slug); setSlugError(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: 'white', fontSize: 12, fontWeight: 700, color: C.textMid, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!!slugError || saving || !customSlug}
                style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: slugError || !customSlug ? '#fca5a5' : `linear-gradient(135deg,${C.primary},${C.accent})`, color: 'white', fontSize: 12, fontWeight: 800, cursor: slugError || !customSlug ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: slugError || !customSlug ? 'none' : `0 4px 14px rgba(200,75,17,0.3)`, transition: 'all 0.2s' }}
              >
                {saving ? <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/> Saving…</> : <><MS name="save" size={14}/> Save URL</>}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 80); }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${C.primaryBorder}`, background: C.primaryPale, color: C.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', marginBottom: 16 }}
            onMouseEnter={e => { e.currentTarget.style.background = C.primaryBg; e.currentTarget.style.boxShadow = `0 4px 14px rgba(200,75,17,0.12)`; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.primaryPale; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <MS name="edit" size={14}/> Customize URL Handle
          </button>
        )}

        {/* Share Buttons */}
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
            Share Your Profile
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* WhatsApp */}
            <button
              onClick={shareViaWhatsApp}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#25D366', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(37,211,102,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(37,211,102,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,211,102,0.3)'; }}
            >
              <WhatsAppIcon size={15}/> WhatsApp
            </button>

            {/* Copy for Instagram */}
            <button
              onClick={shareViaInstagram}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(224,100,90,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(224,100,90,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(224,100,90,0.3)'; }}
            >
              <MS name="photo_camera" size={15}/> Copy for IG
            </button>

            {/* QR Code */}
            <button
              onClick={() => setShowQR(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${showQR ? C.primary : C.primaryBorder}`, background: showQR ? C.primaryBg : 'white', color: showQR ? C.primary : C.textMid, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
              onMouseEnter={e => { if (!showQR) { e.currentTarget.style.background = C.primaryPale; e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; } }}
              onMouseLeave={e => { if (!showQR) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = C.primaryBorder; e.currentTarget.style.color = C.textMid; } }}
            >
              <MS name="qr_code" size={15}/> QR Code
            </button>
          </div>
        </div>

        {/* QR Code Panel */}
        {showQR && (
          <div style={{ marginTop: 16, padding: 20, background: C.primaryPale, borderRadius: 14, border: `1.5px solid ${C.primaryBorder}`, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', animation: 'fadeUp 0.35s cubic-bezier(0.22,1,0.36,1)' }}>
            <div style={{ background: 'white', borderRadius: 12, padding: 10, border: `2px solid ${C.primaryBorder}`, flexShrink: 0, boxShadow: `0 4px 16px rgba(200,75,17,0.10)` }}>
              <img
                src={qrURL}
                alt="Profile QR Code"
                width={120}
                height={120}
                style={{ display: 'block', borderRadius: 6 }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4 }}>Scan to Visit Your Store</p>
              <p style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6, marginBottom: 12 }}>
                Download or screenshot this QR code and share it on flyers, packaging, or your Instagram stories so buyers can find you instantly.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a
                  href={qrURL}
                  download="my-bagsearch-qr.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: `linear-gradient(135deg,${C.primary},${C.accent})`, color: 'white', fontSize: 11, fontWeight: 700, textDecoration: 'none', boxShadow: `0 3px 10px rgba(200,75,17,0.3)`, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                >
                  <MS name="download" size={13}/> Download QR
                </a>
                <button
                  onClick={handleCopyQRText}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: `1.5px solid ${C.primaryBorder}`, background: 'white', color: C.textMid, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                >
                  <MS name={copiedQR ? 'check' : 'content_copy'} size={13}/> {copiedQR ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div style={{ padding: '12px 24px', background: C.surfaceDim, borderTop: `1px solid ${C.borderLight}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <MS name="info" size={14} style={{ color: C.textFaint, flexShrink: 0 }}/>
        <p style={{ fontSize: 11, color: C.textFaint, fontWeight: 500, lineHeight: 1.5 }}>
          Share this link with customers on WhatsApp, Instagram, or anywhere you sell. They'll see all your active listings in one place.
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── AI ASSIST (Gemini) ───────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const GEMINI_API_KEY = "AIzaSyB0_vtq0N7ilNze0dnUDiLBsDkDJ1vRgbo";

const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.0-pro",
];

function useAIAssist() {
  const [loading, setLoading] = useState(false);

  const generate = async ({ prompt, onChunk, onDone, onError }) => {
    setLoading(true);
    let lastError = null;

    for (const model of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 800, temperature: 0.9 },
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          const msg = data?.error?.message || "";
          if (msg.toLowerCase().includes("quota") || res.status === 429 || res.status === 403) {
            lastError = "quota";
            continue;
          }
          throw new Error(msg || `API error ${res.status}`);
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        if (!text) throw new Error("Empty response — please try again.");

        let displayed = "";
        const words = text.split(" ");
        for (let i = 0; i < words.length; i++) {
          displayed += (i === 0 ? "" : " ") + words[i];
          onChunk?.(displayed);
          await new Promise(r => setTimeout(r, 24));
        }
        onDone?.(text);
        setLoading(false);
        return;
      } catch (e) {
        lastError = e.message;
        if (!String(e.message).toLowerCase().includes("quota")) break;
      }
    }

    const msg = lastError === "quota"
      ? "Your Gemini API quota is exhausted. Please upgrade your plan at ai.google.dev or try again tomorrow."
      : lastError || "AI error — please try again.";
    onError?.(msg);
    setLoading(false);
  };

  return { generate, loading };
}

function AIAssistBubble({ visible, onClose, streaming, result, onAccept, onRegenerate, field }) {
  const isError = result && result.startsWith("Error:");
  const isQuota = result && result.toLowerCase().includes("quota");

  const chips = {
    brand_name:  [
      { label:"Bold & Memorable", icon:"bolt"         },
      { label:"Elegant & Luxury",  icon:"diamond"      },
      { label:"Short & Punchy",    icon:"flash_on"     },
      { label:"Lagos-inspired",    icon:"location_on"  },
    ],
    brand_story: [
      { label:"Origin Story",        icon:"auto_stories"  },
      { label:"Craftsmanship",       icon:"handyman"      },
      { label:"Bold & Aspirational", icon:"trending_up"   },
      { label:"Warm & Personal",     icon:"favorite"      },
    ],
  };

  const currentChips = chips[field] || chips.brand_story;

  if (!visible) return null;

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:400, background:"rgba(26,10,0,0.35)", backdropFilter:"blur(3px)", animation:"overlayFade 0.2s ease" }}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:401, width:"min(480px, calc(100vw - 32px))", background:"white", borderRadius:24, boxShadow:`0 32px 80px rgba(200,75,17,0.18), 0 8px 32px rgba(0,0,0,0.12)`, overflow:"hidden", animation:"modalPop 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ background:`linear-gradient(135deg, #2d1200 0%, #1a0a00 100%)`, padding:"20px 22px 18px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-30, right:-20, width:120, height:120, borderRadius:"50%", background:"rgba(200,75,17,0.15)", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", bottom:-20, left:60, width:80, height:80, borderRadius:"50%", background:"rgba(249,115,22,0.1)", pointerEvents:"none" }}/>
          <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:14, background:`linear-gradient(135deg,${C.primary},${C.accent})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 20px rgba(200,75,17,0.5)`, flexShrink:0 }}>
                <SparkleIcon size={20} color="white" animated={streaming}/>
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:900, color:"#fff", letterSpacing:"-0.02em", fontFamily:"'DM Serif Display',serif" }}>AI Brand Assistant</div>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:3 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background: streaming ? C.primaryLight : "#22c55e", animation: streaming ? "pulse 1s ease-in-out infinite" : "none" }}/>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.55)", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" }}>
                    {streaming ? "Generating…" : "Powered by Gemini"}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose}
              style={{ width:32, height:32, borderRadius:10, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.6)", transition:"all 0.2s", flexShrink:0 }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.15)";e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.color="rgba(255,255,255,0.6)";}}>
              <MS name="close" size={17}/>
            </button>
          </div>
          {streaming && (
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:"rgba(255,255,255,0.08)" }}>
              <div style={{ height:"100%", background:`linear-gradient(90deg,${C.primary},${C.primaryLight})`, animation:"progressPulse 1.5s ease-in-out infinite", borderRadius:2 }}/>
            </div>
          )}
        </div>

        <div style={{ padding:"20px 22px" }}>
          {!streaming && !result && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <div style={{ width:1, height:16, background:C.primaryBorder }}/>
                <p style={{ fontSize:10, fontWeight:800, color:C.textMuted, letterSpacing:"0.12em", textTransform:"uppercase" }}>
                  {field === "brand_name" ? "Pick a naming style" : "Pick a story style"}
                </p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
                {currentChips.map((chip, i) => (
                  <button key={i} onClick={() => onRegenerate(chip.label)}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:14, border:`1.5px solid ${C.cardBorder}`, background:C.surface, cursor:"pointer", fontFamily:"'Manrope',sans-serif", transition:"all 0.22s cubic-bezier(0.22,1,0.36,1)", textAlign:"left" }}
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
              {[100, 85, 70].map((w, i) => (
                <div key={i} style={{ height:14, borderRadius:8, background:C.borderLight, marginBottom:10, width:`${w}%`, animation:`skeletonPulse 1.5s ease-in-out ${i*200}ms infinite` }}/>
              ))}
            </div>
          )}

          {result && (
            <div>
              {isError || isQuota ? (
                <div style={{ borderRadius:14, border:`1.5px solid #fecaca`, background:"#fff5f5", padding:"16px 18px" }}>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom: isQuota ? 12 : 0 }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:"#fee2e2", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                      <MS name="error_outline" size={17} style={{ color:C.danger }}/>
                    </div>
                    <div>
                      <p style={{ fontSize:12, fontWeight:800, color:C.danger, marginBottom:4 }}>{isQuota ? "Quota Exceeded" : "Generation Failed"}</p>
                      <p style={{ fontSize:11, color:"#7f1d1d", fontWeight:500, lineHeight:1.6 }}>
                        {isQuota ? "Your Gemini free-tier limit is reached. Upgrade your plan at ai.google.dev to continue using AI features." : result.replace("Error: ", "")}
                      </p>
                    </div>
                  </div>
                  {isQuota && (
                    <a href="https://ai.google.dev/gemini-api/docs/rate-limits" target="_blank" rel="noopener noreferrer"
                      style={{ display:"inline-flex", alignItems:"center", gap:6, marginTop:4, padding:"7px 14px", borderRadius:9, background:C.danger, color:"white", fontSize:11, fontWeight:700, textDecoration:"none", transition:"opacity 0.2s" }}
                      onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
                      onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                      <MS name="open_in_new" size={13}/> Upgrade Plan
                    </a>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <div style={{ width:1, height:16, background:C.primaryBorder }}/>
                    <p style={{ fontSize:10, fontWeight:800, color:C.textMuted, letterSpacing:"0.12em", textTransform:"uppercase" }}>AI Suggestion</p>
                    {!streaming && (
                      <span style={{ marginLeft:"auto", display:"inline-flex", alignItems:"center", gap:4, fontSize:10, fontWeight:700, color:C.success, background:C.successBg, padding:"3px 9px", borderRadius:20 }}>
                        <MS name="check_circle" size={12}/> Ready
                      </span>
                    )}
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
            {!streaming && (
              <button onClick={() => onRegenerate(null)}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 18px", borderRadius:12, border:`1.5px solid ${C.primaryBorder}`, background:"white", color:C.textMid, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Manrope',sans-serif", transition:"all 0.2s" }}
                onMouseEnter={e=>{e.currentTarget.style.background=C.primaryPale;e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.color=C.primary;}}
                onMouseLeave={e=>{e.currentTarget.style.background="white";e.currentTarget.style.borderColor=C.primaryBorder;e.currentTarget.style.color=C.textMid;}}>
                <MS name="refresh" size={15}/> Try Again
              </button>
            )}
            {!streaming && (
              <button onClick={onAccept}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 22px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.primary} 0%,${C.accent} 100%)`, color:"white", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Manrope',sans-serif", boxShadow:`0 6px 18px rgba(200,75,17,0.35)`, transition:"all 0.22s cubic-bezier(0.22,1,0.36,1)", position:"relative", overflow:"hidden" }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 10px 28px rgba(200,75,17,0.45)`;}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`0 6px 18px rgba(200,75,17,0.35)`;}}>
                <div style={{ position:"absolute", top:0, bottom:0, width:40, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)", animation:"scanLine 2s ease-in-out infinite", pointerEvents:"none" }}/>
                <MS name="check" size={15}/> Use This
              </button>
            )}
            {streaming && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:12, background:C.primaryBg, border:`1.5px solid ${C.primaryBorder}` }}>
                <div style={{ width:14, height:14, border:`2px solid ${C.primaryBorder}`, borderTopColor:C.primary, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
                <span style={{ fontSize:12, fontWeight:700, color:C.textMid }}>Writing your copy…</span>
              </div>
            )}
          </div>
        )}

        {(isError || isQuota) && (
          <div style={{ padding:"0 22px 20px", display:"flex", justifyContent:"flex-end" }}>
            <button onClick={onClose}
              style={{ padding:"10px 22px", borderRadius:12, border:`1.5px solid ${C.border}`, background:"white", color:C.textMid, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Manrope',sans-serif" }}>
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── DELETE ACCOUNT MODAL ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function DeleteAccountModal({ visible, onClose, onConfirm, deleting, deleted }) {
  const [confirmText, setConfirmText] = useState('');
  const [shake,       setShake]       = useState(false);
  const isValid = confirmText.trim().toUpperCase() === 'DELETE';

  useEffect(() => { if (!visible) setConfirmText(''); }, [visible]);

  const handleInput = (e) => {
    setConfirmText(e.target.value);
    if (e.target.value.length >= 5 && e.target.value.trim().toUpperCase() !== 'DELETE') {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  if (!visible) return null;

  const warnings = [
    { icon: 'inventory_2', text: <><strong style={{color:'#dc2626',fontWeight:800}}>All your listings will be deleted</strong> — every product, photo, and price permanently removed from BagSearch.</> },
    { icon: 'chat', text: <><strong style={{color:'#dc2626',fontWeight:800}}>Your buyer inquiries and messages</strong> will be erased with no way to recover them.</> },
    { icon: 'storefront', text: <><strong style={{color:'#dc2626',fontWeight:800}}>Your seller profile, brand story, and stats</strong> will be gone forever.</> },
    { icon: 'block', text: <><strong style={{color:'#dc2626',fontWeight:800}}>Your account cannot be restored.</strong> You will need to create a brand-new account to sell on BagSearch again.</>, isX: true },
  ];

  return (
    <>
      <div onClick={!deleting && !deleted ? onClose : undefined} style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(10,0,0,0.65)', backdropFilter:'blur(5px)', animation:'overlayFade 0.25s ease' }}/>
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:601, width:'min(460px, calc(100vw - 32px))', background:'white', borderRadius:24, boxShadow:'0 40px 100px rgba(0,0,0,0.25), 0 8px 24px rgba(220,38,38,0.12)', overflow:'hidden', animation: shake ? 'deleteShakeX 0.5s ease' : 'deleteModalPop 0.4s cubic-bezier(0.34,1.28,0.64,1) both' }}>
        <div style={{ background:'linear-gradient(135deg,#1a0000 0%,#2d0808 100%)', padding:'28px 28px 24px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-40, right:-20, width:150, height:150, borderRadius:'50%', background:'rgba(220,38,38,0.12)', pointerEvents:'none' }}/>
          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ width:54, height:54, borderRadius:16, background:'rgba(220,38,38,0.18)', border:'1.5px solid rgba(220,38,38,0.35)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18, animation:'deleteIconSpin 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' }}>
              <MS name="delete_forever" size={28} style={{ color:'#ef4444' }}/>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'-0.03em', marginBottom:5, fontFamily:"'DM Serif Display',serif" }}>Delete Your Account</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontWeight:500 }}>This action is permanent and cannot be undone</div>
              </div>
              {!deleting && !deleted && (
                <button onClick={onClose}
                  style={{ width:32, height:32, borderRadius:10, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.5)', transition:'all 0.2s', flexShrink:0 }}>
                  <MS name="close" size={17}/>
                </button>
              )}
            </div>
          </div>
        </div>

        {deleted ? (
          <div style={{ padding:'40px 28px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', animation:'fadeUp 0.4s ease' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'#dcfce7', border:'2px solid #86efac', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M4 12l5 5 11-11" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ strokeDasharray:60, strokeDashoffset:60, animation:'deleteCheckDraw 0.6s ease 0.1s forwards' }}/>
              </svg>
            </div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:6 }}>Account Deleted</div>
            <div style={{ fontSize:12, color:C.textMuted, fontWeight:500, lineHeight:1.6, maxWidth:280 }}>Your account and all associated data have been permanently removed. Redirecting you now…</div>
          </div>
        ) : (
          <>
            <div style={{ padding:'22px 28px' }}>
              <div style={{ background:'#fff5f5', border:'1.5px solid #fecaca', borderRadius:14, padding:'14px 16px', marginBottom:20 }}>
                {warnings.map((w, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0', borderBottom: i < warnings.length - 1 ? '1px solid #fee2e2' : 'none', opacity:0, animation:`fadeUp 0.4s ease ${80 + i*80}ms both` }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background: w.isX ? '#dc2626' : '#fecaca', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                      <MS name={w.icon} size={13} style={{ color: w.isX ? 'white' : '#dc2626' }}/>
                    </div>
                    <div style={{ fontSize:12, color:'#7f1d1d', fontWeight:600, lineHeight:1.65 }}>{w.text}</div>
                  </div>
                ))}
              </div>
              <div>
                <label style={{ display:'block', fontSize:10, fontWeight:800, color:C.textMuted, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>
                  Type <span style={{ color:C.danger, fontWeight:900 }}>DELETE</span> to confirm
                </label>
                <input type="text" value={confirmText} onChange={handleInput} placeholder="DELETE" autoComplete="off" disabled={deleting}
                  style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`2px solid ${isValid ? '#dc2626' : C.cardBorder}`, background: isValid ? '#fff5f5' : C.surfaceDim, fontSize:14, fontWeight:700, color:C.text, fontFamily:"'Manrope',monospace", outline:'none', transition:'all 0.25s', boxShadow: isValid ? '0 0 0 4px rgba(220,38,38,0.08)' : 'none', letterSpacing:'0.08em' }}/>
                {confirmText.length > 0 && !isValid && (
                  <p style={{ fontSize:10, color:C.danger, fontWeight:600, marginTop:5, paddingLeft:2, opacity:0, animation:'fadeUp 0.25s ease both' }}>Please type DELETE exactly to proceed</p>
                )}
              </div>
            </div>
            <div style={{ padding:'0 28px 24px', display:'flex', gap:10 }}>
              <button onClick={onClose} disabled={deleting}
                style={{ flex:1, padding:'12px', borderRadius:12, border:`1.5px solid ${C.border}`, background:'white', fontSize:13, fontWeight:700, color:C.textMid, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily:"'Manrope',sans-serif", transition:'all 0.2s', opacity: deleting ? 0.5 : 1 }}>
                Cancel
              </button>
              <button onClick={() => isValid && !deleting && onConfirm()} disabled={!isValid || deleting}
                style={{ flex:2, padding:'12px', borderRadius:12, border:'none', background: isValid && !deleting ? 'linear-gradient(135deg,#dc2626 0%,#b91c1c 100%)' : '#fca5a5', fontSize:13, fontWeight:800, color:'white', cursor: isValid && !deleting ? 'pointer' : 'not-allowed', fontFamily:"'Manrope',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow: isValid && !deleting ? '0 6px 20px rgba(220,38,38,0.35)' : 'none', transition:'all 0.3s cubic-bezier(0.22,1,0.36,1)', position:'relative', overflow:'hidden' }}>
                <MS name={deleting ? 'hourglass_empty' : 'delete_forever'} size={16} style={{ animation: deleting ? 'spin 0.8s linear infinite' : 'none' }}/>
                {deleting ? 'Deleting account…' : 'Permanently Delete'}
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes deleteShakeX { 0%,100%{transform:translate(-50%,-50%)} 15%{transform:translate(calc(-50% - 7px),-50%)} 30%{transform:translate(calc(-50% + 6px),-50%)} 45%{transform:translate(calc(-50% - 4px),-50%)} 60%{transform:translate(calc(-50% + 3px),-50%)} 75%{transform:translate(calc(-50% - 2px),-50%)} }
        @keyframes deleteModalPop { from{opacity:0;transform:translate(-50%,-50%) scale(0.93)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes deleteIconSpin { from{opacity:0;transform:rotate(-90deg) scale(0.5)} to{opacity:1;transform:rotate(0deg) scale(1)} }
        @keyframes deleteCheckDraw { from{stroke-dashoffset:60} to{stroke-dashoffset:0} }
      `}</style>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── EDIT PROFILE COMPONENTS ──────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const FloatInput = memo(function FloatInput({ label, value, onChange, type='text', icon, iconColor, hint, disabled }) {
  const [focused, setFocused] = useState(false);
  const has = value && value.length > 0;
  const handleChange = useCallback((e) => { if (onChange) onChange(e); }, [onChange]);
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", border:`2px solid ${focused?C.primary:has?C.heroDark:C.cardBorder}`, borderRadius:14, background:focused?C.primaryPale:C.surface, transition:"all 0.3s cubic-bezier(0.22,1,0.36,1)", boxShadow:focused?`0 0 0 4px ${C.primaryBg},0 6px 24px rgba(200,75,17,0.1)`:"none", overflow:"hidden" }}>
        {icon && <div style={{ paddingLeft:14, display:"flex", alignItems:"center", transform:focused?"scale(1.15)":"scale(1)", transition:"transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}><MS name={icon} size={16} style={{ color:focused?C.primary:iconColor||C.textFaint }}/></div>}
        <div style={{ flex:1, position:"relative", paddingTop:20, paddingBottom:8, paddingLeft:icon?10:14, paddingRight:14 }}>
          <label style={{ position:"absolute", top:focused||has?5:"50%", transform:focused||has?"none":"translateY(-50%)", fontSize:focused||has?9:13, fontWeight:focused||has?800:500, color:focused?C.primary:C.textFaint, letterSpacing:focused||has?"0.12em":"0", textTransform:focused||has?"uppercase":"none", transition:"all 0.25s cubic-bezier(0.22,1,0.36,1)", pointerEvents:"none", fontFamily:"'Manrope',sans-serif" }}>{label}</label>
          <input type={type} value={value || ''} onChange={handleChange} disabled={disabled} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontSize:13, fontWeight:600, color:C.text, fontFamily:"'Manrope',sans-serif", marginTop:2 }}/>
        </div>
      </div>
      {hint && <p style={{ fontSize:10, color:C.textFaint, fontWeight:500, marginTop:4, paddingLeft:4 }}>{hint}</p>}
    </div>
  );
});

const FloatInputAI = memo(function FloatInputAI({ label, value, onChange, icon, iconColor, hint }) {
  const [focused,   setFocused]   = useState(false);
  const [aiOpen,    setAIOpen]    = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [aiResult,  setAIResult]  = useState("");
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
    await generate({
      prompt: `Generate a short, catchy bag brand name for a Nigerian seller.\nStyle: ${stylePref || "bold and memorable"}.\n${value ? `Current name for reference: "${value}"` : ""}\nRules: 1-3 words max. Premium-sounding. Relevant to handbags/fashion. Return ONLY the brand name — no quotes, no explanation.`,
      onChunk: (t) => setAIResult(t),
      onDone:  (t) => { setAIResult(t.trim()); setStreaming(false); },
      onError: (e) => { setAIResult("Error: " + e); setStreaming(false); },
    });
  }, [generate, value]);
  const handleAccept = useCallback(() => { onChange({ target: { value: aiResult.trim() } }); setAIOpen(false); setAIResult(""); }, [onChange, aiResult]);
  return (
    <div ref={wrapRef} style={{ position:"relative" }}>
      <div style={{ display:"flex", alignItems:"center", border:`2px solid ${focused?C.primary:has?C.heroDark:C.cardBorder}`, borderRadius:14, background:focused?C.primaryPale:C.surface, transition:"all 0.3s cubic-bezier(0.22,1,0.36,1)", boxShadow:focused?`0 0 0 4px ${C.primaryBg},0 6px 24px rgba(200,75,17,0.1)`:"none" }}>
        {icon && <div style={{ paddingLeft:14, display:"flex", alignItems:"center", transform:focused?"scale(1.15)":"scale(1)", transition:"transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}><MS name={icon} size={16} style={{ color:focused?C.primary:iconColor||C.textFaint }}/></div>}
        <div style={{ flex:1, position:"relative", paddingTop:20, paddingBottom:8, paddingLeft:icon?10:14, paddingRight:10 }}>
          <label style={{ position:"absolute", top:focused||has?5:"50%", transform:focused||has?"none":"translateY(-50%)", fontSize:focused||has?9:13, fontWeight:focused||has?800:500, color:focused?C.primary:C.textFaint, letterSpacing:focused||has?"0.12em":"0", textTransform:focused||has?"uppercase":"none", transition:"all 0.25s cubic-bezier(0.22,1,0.36,1)", pointerEvents:"none", fontFamily:"'Manrope',sans-serif" }}>{label}</label>
          <input value={value || ''} onChange={handleChange} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontSize:13, fontWeight:600, color:C.text, fontFamily:"'Manrope',sans-serif", marginTop:2 }}/>
        </div>
        <button onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setAIOpen(v=>!v); if(!aiOpen){setAIResult("");setStreaming(false);} }}
          style={{ marginRight:10, width:32, height:32, borderRadius:10, border:"none", background:aiOpen?`linear-gradient(135deg,${C.primary},${C.accent})`:C.primaryBg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)", boxShadow:aiOpen?`0 4px 14px rgba(200,75,17,0.35)`:"none", transform:aiOpen?"scale(1.1)":"scale(1)", flexShrink:0 }}>
          <SparkleIcon size={15} color={aiOpen?"white":C.primary} animated={streaming}/>
        </button>
      </div>
      {hint && <p style={{ fontSize:10, color:C.textFaint, fontWeight:500, marginTop:4, paddingLeft:4 }}>{hint}</p>}
      <AIAssistBubble visible={aiOpen} field="brand_name" streaming={streaming} result={aiResult} onClose={()=>setAIOpen(false)} onAccept={handleAccept} onRegenerate={handleGenerate}/>
    </div>
  );
});

const BrandStoryBoxAI = memo(function BrandStoryBoxAI({ value, onChange, sellerName, bagCategories }) {
  const [focused,   setFocused]   = useState(false);
  const [aiOpen,    setAIOpen]    = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [aiResult,  setAIResult]  = useState("");
  const { generate } = useAIAssist();
  const wrapRef = useRef(null);
  const max  = 400;
  const pct  = Math.min(((value?.length || 0) / max) * 100, 100);
  const circ = 2 * Math.PI * 13;
  const handleChange = useCallback((e) => { if (onChange) onChange(e.target.value.slice(0, max)); }, [onChange, max]);
  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setAIOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const handleGenerate = useCallback(async (stylePref) => {
    setStreaming(true); setAIResult("");
    const catLabels = (bagCategories || []).map(id => BAG_CATEGORIES.find(c => c.id === id)?.label).filter(Boolean).join(", ");
    await generate({
      prompt: `Write a compelling brand story for a bag seller on BagSearch marketplace.\nSeller: ${sellerName || "a Nigerian bag seller"}\nCategories: ${catLabels || "luxury & designer bags"}\nStyle: ${stylePref || "warm, authentic, and aspirational"}\n${value ? `Existing story to improve: "${value}"` : ""}\nRequirements: 2-4 sentences, max 380 characters, first person, evokes trust and quality, feels human not corporate.\nReturn ONLY the brand story text — no quotes, no label, no explanation.`,
      onChunk: (t) => setAIResult(t),
      onDone:  (t) => { setAIResult(t.trim().slice(0, max)); setStreaming(false); },
      onError: (e) => { setAIResult("Error: " + e); setStreaming(false); },
    });
  }, [generate, sellerName, bagCategories, value, max]);
  const handleAccept = useCallback(() => { onChange(aiResult.trim().slice(0, max)); setAIOpen(false); setAIResult(""); }, [onChange, aiResult, max]);
  return (
    <div ref={wrapRef} style={{ position:"relative" }}>
      <div style={{ border:`2px solid ${focused?C.primary:(value && value.length > 0)?C.heroDark:C.cardBorder}`, borderRadius:16, background:focused?C.primaryPale:C.surface, transition:"all 0.3s cubic-bezier(0.22,1,0.36,1)", boxShadow:focused?`0 0 0 4px ${C.primaryBg},0 8px 32px rgba(200,75,17,0.1)`:"none" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:8, background:focused?C.primary:C.primaryBg, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.3s" }}>
              <MS name="auto_awesome" size={13} style={{ color:focused?"#fff":C.primary }}/>
            </div>
            <span style={{ fontSize:10, fontWeight:800, color:focused?C.primary:C.textFaint, letterSpacing:"0.12em", textTransform:"uppercase", transition:"color 0.3s" }}>Brand Story</span>
          </div>
          <button onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setAIOpen(v=>!v); if(!aiOpen){setAIResult("");setStreaming(false);} }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, border:`1.5px solid ${aiOpen?C.primary:C.primaryBorder}`, background:aiOpen?`linear-gradient(135deg,${C.primary},${C.accent})`:C.primaryPale, color:aiOpen?"white":C.primary, fontSize:10, fontWeight:800, cursor:"pointer", fontFamily:"'Manrope',sans-serif", letterSpacing:"0.06em", transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)", boxShadow:aiOpen?`0 4px 14px rgba(200,75,17,0.3)`:"none" }}>
            <SparkleIcon size={11} color={aiOpen?"white":C.primary} animated={streaming}/>
            {streaming ? "Writing…" : "AI Assist"}
          </button>
        </div>
        <textarea value={value || ''} onChange={handleChange} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} placeholder="Tell buyers about your bag brand — your origin story, what makes your pieces special, the vibe you bring to every collection…" rows={4}
          style={{ width:"100%", border:"none", outline:"none", resize:"none", background:"transparent", padding:"10px 16px 0", fontSize:12, fontWeight:500, color:C.text, lineHeight:1.7, fontFamily:"'Manrope',sans-serif" }}/>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", padding:"4px 12px 10px", gap:7 }}>
          <span style={{ fontSize:10, color:C.textFaint, fontWeight:600 }}>{(value?.length || 0)}/{max}</span>
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
      {selected && <div style={{ position:"absolute", top:7, right:7, width:16, height:16, borderRadius:"50%", background:C.primary, display:"flex", alignItems:"center", justifyContent:"center", animation:"popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}><MS name="check" size={10} style={{ color:"#fff" }}/></div>}
      <span style={{ fontSize:20, lineHeight:1 }}>{cat.emoji}</span>
      <span style={{ fontSize:11, fontWeight:800, color:selected?C.primary:C.text }}>{cat.label}</span>
      <span style={{ fontSize:9, fontWeight:500, color:selected?C.textMid:C.textFaint }}>{cat.desc}</span>
    </button>
  );
}

function SaveToast({ message, type, visible }) {
  return (
    <div style={{ position:"fixed", bottom:32, left:"50%", transform:`translateX(-50%) translateY(${visible?0:80}px)`, opacity:visible?1:0, transition:"all 0.45s cubic-bezier(0.22,1,0.36,1)", zIndex:9999, pointerEvents:"none", display:"flex", alignItems:"center", gap:10, padding:"12px 26px", borderRadius:50, background:type==="success"?`linear-gradient(135deg,${C.success},#15803d)`:`linear-gradient(135deg,${C.danger},#b91c1c)`, color:"#fff", fontSize:13, fontWeight:700, fontFamily:"'Manrope',sans-serif", boxShadow:"0 12px 40px rgba(0,0,0,0.22)" }}>
      <MS name={type==="success"?"check_circle":"error"} size={16} style={{ color:"#fff" }}/>
      {message}
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
  const [form,       setForm]       = useState({ full_name:'', email:'', phone:'', brand_name:'', brand_story:'' });
  const [categories, setCategories] = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [toast,      setToast]      = useState({ visible:false, message:'', type:'success' });
  const [sec1In,     setSec1In]     = useState(false);
  const [sec2In,     setSec2In]     = useState(false);
  const [sec3In,     setSec3In]     = useState(false);
  const [catsIn,     setCatsIn]     = useState(false);

  useEffect(() => {
    if (!panelIn) return;
    setTimeout(()=>setSec1In(true), 80);
    setTimeout(()=>setSec2In(true), 220);
    setTimeout(()=>setSec3In(true), 360);
    setTimeout(()=>setCatsIn(true), 480);
  }, [panelIn]);

  useEffect(() => {
    if (!seller) return;
    setForm({ full_name:seller.name||'', email:seller.email||'', phone:seller.phone||'', brand_name:seller.brand_name||'', brand_story:seller.brand_story||'' });
    setCategories(seller.bag_categories||[]);
  }, [seller]);

  const showToast = useCallback((msg, type='success') => {
    setToast({ visible:true, message:msg, type });
    setTimeout(()=>setToast(t=>({...t,visible:false})), 3000);
  }, []);

  const handleFullName  = useCallback((e) => setForm(prev => ({ ...prev, full_name:  e.target.value })), []);
  const handleEmail     = useCallback((e) => setForm(prev => ({ ...prev, email:      e.target.value })), []);
  const handlePhone     = useCallback((e) => setForm(prev => ({ ...prev, phone:      e.target.value })), []);
  const handleBrandName = useCallback((e) => setForm(prev => ({ ...prev, brand_name: e.target.value })), []);
  const handleBrandStory= useCallback((v) => setForm(prev => ({ ...prev, brand_story: v })), []);
  const toggleCat       = useCallback((id) => setCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]), []);

  const handleSave = useCallback(async () => {
    if (!form.full_name.trim())                           { showToast('Name is required','error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { showToast('Invalid email address','error'); return; }
    if (categories.length===0)                            { showToast('Pick at least one bag category','error'); return; }
    setSaving(true);
    try {
      const baseUpdates = { full_name:form.full_name.trim(), email:form.email.trim(), phone:form.phone.trim() };
      const fullUpdates = { ...baseUpdates, brand_name:form.brand_name.trim(), brand_story:form.brand_story.trim(), bag_categories:categories };
      let updates = fullUpdates;
      let { error } = await supabase.from('users').update(fullUpdates).eq('user_id', userId);
      if (error && isMissingColumnError(error)) {
        const fallback = await supabase.from('users').update(baseUpdates).eq('user_id', userId);
        error = fallback.error; updates = baseUpdates;
      }
      if (error) throw error;
      const { data:{ user:authUser } } = await supabase.auth.getUser();
      const updateData = { data: { full_name: form.full_name } };
      if (authUser && form.email !== authUser.email) updateData.email = form.email;
      const { error: authError } = await supabase.auth.updateUser(updateData);
      if (authError) throw authError;
      setSaved(true);
      showToast('Profile saved successfully! 🎉','success');
      onSaved?.({ ...updates, brand_name:updates.brand_name??'', brand_story:updates.brand_story??'', bag_categories:updates.bag_categories??[] });
      setTimeout(()=>setSaved(false), 2800);
    } catch(e) { showToast(e.message||'Save failed','error'); }
    finally { setSaving(false); }
  }, [form, categories, userId, onSaved, showToast]);

  const SHead = ({ icon, title, subtitle, color=C.primary }) => (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22 }}>
      <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${color}18,${color}35)`, border:`1.5px solid ${color}35`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 14px ${color}18` }}>
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
        {[14,32,50,70].map(p=><div key={p} style={{ position:"absolute", top:0, bottom:0, left:`${p}%`, width:1, background:"rgba(255,255,255,0.1)", pointerEvents:"none" }}/>)}
        <div style={{ position:"absolute", top:0, bottom:0, width:60, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)", animation:"scanLine 3s ease-in-out infinite", pointerEvents:"none" }}/>
        <div style={{ position:"relative", zIndex:2 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"3px 10px", borderRadius:20, background:"rgba(255,255,255,0.28)", backdropFilter:"blur(8px)" }}>
              <MS name="edit" size={11} style={{ color:C.primary }}/>
              <span style={{ fontSize:9, fontWeight:800, color:C.primary, letterSpacing:"0.14em", textTransform:"uppercase" }}>Edit Profile</span>
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"3px 10px", borderRadius:20, background:"rgba(255,255,255,0.28)", backdropFilter:"blur(8px)" }}>
              <SparkleIcon size={10} color={C.textDark}/>
              <span style={{ fontSize:9, fontWeight:800, color:C.textDark, letterSpacing:"0.14em", textTransform:"uppercase" }}>Gemini AI</span>
            </div>
          </div>
          <h3 style={{ fontSize:"clamp(1.3rem,3vw,1.8rem)", fontWeight:900, color:C.textDark, letterSpacing:"-0.04em", fontFamily:"'DM Serif Display',serif", lineHeight:1.1, marginBottom:8 }}>
            Shape How Buyers<br/><em style={{ fontStyle:"italic", color:C.primary }}>See Your Brand.</em>
          </h3>
          <p style={{ fontSize:12, color:C.textMid, fontWeight:500 }}>
            {categories.length>0 ? categories.map(id=>BAG_CATEGORIES.find(c=>c.id===id)?.emoji).join(' ') : 'Pick your categories below ↓'}
            {" · "}<span style={{ opacity:0.7 }}>Tap ✨ for AI suggestions</span>
          </p>
        </div>
      </div>

      <SCard visible={sec1In}>
        <SHead icon="person" title="Personal Info" subtitle="Your identity on BagSearch"/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14 }}>
          <FloatInput label="Full Name" value={form.full_name} onChange={handleFullName} icon="badge"  iconColor={C.primary}/>
          <FloatInput label="Email"     value={form.email}     onChange={handleEmail}    icon="mail"   iconColor={C.accent} type="email"/>
          <FloatInput label="Phone"     value={form.phone}     onChange={handlePhone}    icon="phone"  iconColor={C.success} type="tel" hint="Include country code e.g. +234"/>
        </div>
      </SCard>

      <SCard visible={sec2In}>
        <SHead icon="storefront" title="Brand Identity" subtitle="Make your brand unforgettable — tap ✨ for Gemini AI help" color={C.accent}/>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <FloatInputAI label="Brand Name" value={form.brand_name} onChange={handleBrandName} icon="shopping_bag" iconColor={C.primary} hint="Your store name e.g. Adé Bags Lagos — tap ✨ for AI name ideas"/>
          <BrandStoryBoxAI value={form.brand_story} onChange={handleBrandStory} sellerName={form.brand_name || form.full_name} bagCategories={categories}/>
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
          {BAG_CATEGORIES.map((cat,i)=>(<CatChip key={cat.id} cat={cat} selected={categories.includes(cat.id)} onClick={()=>toggleCat(cat.id)} index={i} visible={catsIn}/>))}
        </div>
        {categories.length===0 && (
          <div style={{ marginTop:14, padding:"10px 14px", borderRadius:10, background:C.primaryBg, border:`1.5px dashed ${C.heroDark}`, display:"flex", alignItems:"center", gap:8 }}>
            <MS name="sell" size={13} style={{ color:C.textFaint }}/>
            <span style={{ fontSize:10, color:C.textMuted, fontWeight:500 }}>Pick at least one category so buyers can discover your listings</span>
          </div>
        )}
      </SCard>

      <div style={{ display:"flex", justifyContent:"flex-end", gap:12, opacity:sec3In?1:0, transition:"opacity 0.5s ease 300ms" }}>
        <button onClick={handleSave} disabled={saving}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 40px", borderRadius:16, border:"none", background:saved?`linear-gradient(135deg,${C.success},#15803d)`:`linear-gradient(135deg,${C.primary} 0%,${C.accent} 50%,${C.primaryLight} 100%)`, color:"#fff", fontSize:14, fontWeight:900, cursor:saving?"default":"pointer", fontFamily:"'DM Serif Display',serif", letterSpacing:"-0.02em", boxShadow:`0 8px 36px rgba(200,75,17,0.4)`, transition:"all 0.4s cubic-bezier(0.22,1,0.36,1)", position:"relative", overflow:"hidden" }}
          onMouseEnter={e=>{if(!saving){e.currentTarget.style.transform="translateY(-4px) scale(1.03)";e.currentTarget.style.boxShadow=`0 16px 50px rgba(200,75,17,0.52)`;}}}
          onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`0 8px 36px rgba(200,75,17,0.4)`;}}>
          <div style={{ position:"absolute", top:0, bottom:0, width:60, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", animation:"scanLine 2s ease-in-out infinite", pointerEvents:"none" }}/>
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

  const [activeListingsCount, setActiveListingsCount] = useState(0);
  const [totalViewsCount,     setTotalViewsCount]     = useState(0);
  const [buyerViews,          setBuyerViews]          = useState([]);
  const [metricsLoading,      setMetricsLoading]      = useState(true);

  const [sidebarIn,   setSidebarIn]   = useState(false);
  const [headerIn,    setHeaderIn]    = useState(false);
  const [headingIn,   setHeadingIn]   = useState(false);
  const [statsIn,     setStatsIn]     = useState(false);
  const [tableIn,     setTableIn]     = useState(false);
  const [bannerIn,    setBannerIn]    = useState(false);
  const [tabIn,       setTabIn]       = useState(false);
  const [editPanelIn, setEditPanelIn] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting,        setDeleting]        = useState(false);
  const [deleted,         setDeleted]         = useState(false);

  useEffect(()=>{
    setTimeout(()=>setSidebarIn(true),  60);
    setTimeout(()=>setHeaderIn(true),  120);
    setTimeout(()=>setHeadingIn(true), 260);
    setTimeout(()=>setStatsIn(true),   380);
    setTimeout(()=>setTableIn(true),   520);
    setTimeout(()=>setBannerIn(true),  660);
    setTimeout(()=>setTabIn(true),     200);
  },[]);

  useEffect(()=>{
    async function loadSeller() {
      try {
        if (!user){ setError('User not authenticated'); setLoading(false); return; }
        let { data, error:e } = await supabase.from('users').select('full_name,email,phone,brand_name,brand_story,bag_categories,profile_slug').eq('user_id',user.id).maybeSingle();
        if (e && isMissingColumnError(e)) {
          const fallback = await supabase.from('users').select('full_name,email,phone').eq('user_id',user.id).maybeSingle();
          data = fallback.data; e = fallback.error;
        }
        if (e) throw e;
        setSeller({ name:data?.full_name||user.user_metadata?.full_name||'Seller', email:data?.email||user.email||'N/A', phone:data?.phone||user.user_metadata?.phone||'N/A', brand_name:data?.brand_name||'', brand_story:data?.brand_story||'', bag_categories:data?.bag_categories||[], profile_slug:data?.profile_slug||'', avatar:null });
      } catch(err){ setError(err.message); }
      finally { setLoading(false); }
    }
    loadSeller();
  },[user]);

  useEffect(()=>{
    async function loadMetrics() {
      try {
        if (!user) return;
        setMetricsLoading(true);
        const byUser = await supabase.from('products').select('*').eq('user_id',user.id).order('created_at',{ ascending:false });
        let rows = byUser.data || [];
        let queryError = byUser.error;
        if (rows.length===0 || (queryError && isMissingColumnError(queryError))) {
          const bySeller = await supabase.from('products').select('*').eq('seller_id',user.id).order('created_at',{ ascending:false });
          if (!bySeller.error){ rows = bySeller.data||[]; queryError = null; }
          else if (!queryError || isMissingColumnError(queryError)) queryError = bySeller.error;
        }
        if (queryError && rows.length===0 && !isMissingColumnError(queryError)) throw queryError;
        const getStatus = (row) => { const n=String(row?.status||'').toLowerCase(); return ['active','pending','inactive'].includes(n)?n:'active'; };
        setActiveListingsCount(rows.filter(p=>getStatus(p)==='active').length);
        const productIds = rows.map(p=>p.id).filter(Boolean);
        if (!productIds.length){ setTotalViewsCount(0); setBuyerViews([]); return; }
        const { data:vd, count:vc, error:ve } = await supabase
          .from('product_views')
          .select(`id,product_id,buyer_id,viewed_at,source,buyer_name,buyer_phone,buyer_email,products:product_id(id,name,images)`,{ count:'exact' })
          .in('product_id',productIds).order('viewed_at',{ ascending:false }).limit(20);
        if (!ve){
          const enrichedViews = await enrichBuyerViewsWithProfiles(vd || []);
          setTotalViewsCount(vc||0);
          setBuyerViews(enrichedViews.map(mapBuyerViewRow));
        } else { console.error('product_views fetch error:', ve.message); setTotalViewsCount(0); setBuyerViews([]); }
      } catch(e){ console.error(e); }
      finally { setMetricsLoading(false); }
    }
    loadMetrics();
  },[user]);

  const handleDeleteAccount = useCallback(async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const userId = session.user.id;
      const { data: products } = await supabase.from('products').select('id').or(`user_id.eq.${userId},seller_id.eq.${userId}`);
      if (products && products.length > 0) {
        const productIds = products.map(p => p.id);
        await deleteFromPinecone(productIds);
        await supabase.from('product_views').delete().in('product_id', productIds);
        await supabase.from('products').delete().in('id', productIds);
      }
      await supabase.from('product_views').delete().eq('buyer_id', userId);
      for (const { table, col } of [
        { table: 'search_history', col: 'user_id' },
        { table: 'saved_items',    col: 'user_id' },
        { table: 'orders',         col: 'user_id' },
      ]) { try { await supabase.from(table).delete().eq(col, userId); } catch (_) {} }
      const { data: fnData, error: fnError } = await supabase.functions.invoke('delete-account', { body: { userId } });
      if (fnError) {
        let msg = fnError.message;
        try { const body = fnError.context ? await fnError.context.json() : null; if (body?.error) msg = body.error; } catch (_) {}
        throw new Error(msg || 'Failed to delete account');
      }
      if (fnData?.error) throw new Error(fnData.error);
      setDeleted(true);
      setTimeout(async () => { await supabase.auth.signOut(); navigate('/'); }, 2200);
    } catch (e) { console.error('Delete account error:', e); setDeleting(false); }
  }, [navigate]);

  const stats = useMemo(()=>[
    { icon:'payments',        label:'Total Revenue',   value:'—',                                             badge:'—', accent:C.primary,   glow:'rgba(200,75,17,0.15)' },
    { icon:'shopping_basket', label:'Active Listings', value:metricsLoading?'…':String(activeListingsCount), badge:'',  accent:'#f97316',    glow:'rgba(249,115,22,0.12)' },
    { icon:'chat',            label:'Inquiries',       value:'—',                                             badge:'',  accent:'#22c55e',    glow:'rgba(34,197,94,0.12)' },
    { icon:'visibility',      label:'Total Views',     value:metricsLoading?'…':String(totalViewsCount),     badge:'',  accent:'#a78bfa',    glow:'rgba(167,139,250,0.12)' },
  ],[metricsLoading,activeListingsCount,totalViewsCount]);

  const switchTab = useCallback((tab) => {
    if (tab===activeTab) return;
    setActiveTab(tab);
    if (tab==='edit'){ setEditPanelIn(false); setTimeout(()=>setEditPanelIn(true),80); }
  }, [activeTab]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:`linear-gradient(180deg,${C.primaryPale} 0%,${C.surfaceDim} 25%,white 100%)` }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:36, height:36, border:`3px solid ${C.borderLight}`, borderTopColor:C.primary, borderRadius:"50%", animation:"spin 0.7s linear infinite", margin:"0 auto 12px" }}/>
        <p style={{ color:C.textMuted, fontSize:14, fontWeight:500 }}>Loading dashboard…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <div style={{ textAlign:"center", maxWidth:360, padding:32 }}>
        <p style={{ color:C.danger, fontWeight:700, marginBottom:16 }}>Error: {error}</p>
        <button onClick={()=>navigate('/products')} style={{ padding:"10px 22px", background:C.primary, color:"white", border:"none", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"'Manrope',sans-serif" }}>Back to Products</button>
      </div>
    </div>
  );

  const initials = seller?.name ? seller.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : 'S';

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:`linear-gradient(180deg,${C.primaryPale} 0%,${C.surfaceDim} 25%,white 100%)`, fontFamily:"'Manrope',sans-serif", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&family=DM+Serif+Display:ital@0;1&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes slideRight   {from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeUp       {from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)}}
        @keyframes rowSlide     {from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes cardSlideUp  {from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)}}
        @keyframes pulse        {0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes eyePing      {0%{transform:scale(1);opacity:0.6}100%{transform:scale(2.2);opacity:0}}
        @keyframes eyeBounce    {0%,100%{transform:translateY(0) scale(1)}45%{transform:translateY(-5px) scale(1.08)}}
        @keyframes spin         {to{transform:rotate(360deg)}}
        @keyframes scanLine     {from{transform:translateX(-100%)}to{transform:translateX(300%)}}
        @keyframes popIn        {from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
        @keyframes overlayFade  {from{opacity:0}to{opacity:1}}
        @keyframes tabSlideIn   {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalPop     {from{opacity:0;transform:translate(-50%,-50%) scale(0.93)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        @keyframes sparklePulse {0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.3);opacity:0.6}}
        @keyframes cursorBlink  {0%,100%{opacity:1}50%{opacity:0}}
        @keyframes progressPulse{0%{width:0%;opacity:1}70%{width:100%;opacity:1}100%{width:100%;opacity:0}}
        @keyframes skeletonPulse{0%,100%{opacity:0.4}50%{opacity:0.9}}
        .sidebar-desktop{display:flex!important}
        .sidebar-mobile-overlay{display:none!important}
        .main-content{margin-left:240px!important}
        .hamburger-btn{display:none!important}
        .inquiry-table{display:block!important}
        .inquiry-cards{display:none!important}
        .header-search{display:flex!important}
        @media(max-width:900px){
          .sidebar-desktop{display:none!important}
          .sidebar-mobile-overlay{display:block!important}
          .main-content{margin-left:0!important}
          .hamburger-btn{display:flex!important}
          .inquiry-table{display:none!important}
          .inquiry-cards{display:block!important}
          .header-search{display:none!important}
        }
        @media(max-width:600px){
          .stats-grid{grid-template-columns:repeat(2,1fr)!important;gap:12px!important}
          .page-padding{padding:20px 16px 64px!important}
          .header-inner{padding:0 16px!important}
        }
        textarea::placeholder{color:${C.textFaint};font-family:'Manrope',sans-serif}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
      `}</style>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="sidebar-desktop" style={{ width:240, background:C.text, borderRight:"1px solid rgba(255,255,255,0.06)", position:"fixed", height:"100%", flexDirection:"column", zIndex:20, opacity:sidebarIn?1:0, transform:sidebarIn?"translateX(0)":"translateX(-100%)", transition:"opacity 0.5s ease,transform 0.5s cubic-bezier(0.22,1,0.36,1)" }}>
        <SidebarContents initials={initials} seller={seller} sidebarIn={sidebarIn} navigate={navigate} activeTab={activeTab} switchTab={switchTab} onDeleteClick={() => setDeleteModalOpen(true)}/>
      </aside>

      {/* ── MOBILE SIDEBAR ── */}
      <div className="sidebar-mobile-overlay">
        {mobileSidebarOpen && <div onClick={()=>setMobileSidebarOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:40, animation:"overlayFade 0.25s ease both" }}/>}
        <aside style={{ width:260, background:C.text, position:"fixed", top:0, left:0, height:"100%", display:"flex", flexDirection:"column", zIndex:50, transform:mobileSidebarOpen?"translateX(0)":"translateX(-100%)", transition:"transform 0.32s cubic-bezier(0.4,0,0.2,1)", boxShadow:"8px 0 32px rgba(0,0,0,0.3)" }}>
          <button onClick={()=>setMobileSidebarOpen(false)} style={{ position:"absolute", top:16, right:16, width:32, height:32, borderRadius:"50%", border:"none", background:"rgba(255,255,255,0.08)", color:C.textMuted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>✕</button>
          <SidebarContents initials={initials} seller={seller} sidebarIn={mobileSidebarOpen} navigate={navigate} activeTab={activeTab} switchTab={(t)=>{switchTab(t);setMobileSidebarOpen(false);}} onNav={()=>setMobileSidebarOpen(false)} onDeleteClick={() => { setMobileSidebarOpen(false); setDeleteModalOpen(true); }}/>
        </aside>
      </div>

      {/* ── MAIN ── */}
      <main className="main-content" style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>

        {/* Header */}
        <header style={{ height:64, background:"rgba(255,255,255,0.92)", backdropFilter:"blur(12px)", borderBottom:`1px solid ${C.borderLight}`, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10, opacity:headerIn?1:0, transform:headerIn?"translateY(0)":"translateY(-100%)", transition:"opacity 0.4s ease,transform 0.4s cubic-bezier(0.22,1,0.36,1)", boxShadow:`0 1px 0 ${C.borderLight},0 4px 20px rgba(200,75,17,0.04)` }}>
          <div className="header-inner" style={{ width:"100%", padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, flex:1 }}>
              <button className="hamburger-btn" onClick={()=>setMobileSidebarOpen(true)} style={{ padding:8, borderRadius:10, border:`1px solid ${C.border}`, background:C.surfaceDim, cursor:"pointer", alignItems:"center", justifyContent:"center", color:C.textMuted, flexShrink:0 }}>
                <svg style={{ width:20, height:20 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
              </button>
              <button onClick={()=>navigate('/products')}
                style={{ padding:8, borderRadius:10, border:`1px solid ${C.border}`, background:C.surfaceDim, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.textMuted, transition:"all 0.2s", flexShrink:0 }}
                onMouseEnter={e=>{e.currentTarget.style.background=C.primaryBg;e.currentTarget.style.color=C.primary;e.currentTarget.style.transform="translateX(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.background=C.surfaceDim;e.currentTarget.style.color=C.textMuted;e.currentTarget.style.transform="none";}}>
                <MS name="arrow_back" size={20}/>
              </button>
              <div className="header-search" style={{ position:"relative", flex:1, maxWidth:480 }}>
                <MS name="search" size={18} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:C.textMuted }}/>
                <input type="text" placeholder="Search orders, inquiries, or products…"
                  style={{ width:"100%", paddingLeft:38, paddingRight:14, paddingTop:9, paddingBottom:9, background:C.surfaceDim, border:"1.5px solid transparent", borderRadius:10, fontSize:13, color:C.text, outline:"none", fontFamily:"inherit", transition:"all 0.2s" }}
                  onFocus={e=>{e.target.style.borderColor=C.primaryBorder;e.target.style.background="white";e.target.style.boxShadow=`0 0 0 3px ${C.primaryBg}`;}}
                  onBlur={e=>{e.target.style.borderColor="transparent";e.target.style.background=C.surfaceDim;e.target.style.boxShadow="none";}}/>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
              <NotificationsDropdown />
              <div style={{ width:1, height:28, background:C.border }}/>
              <button onClick={()=>navigate('/upload-product')}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 16px", borderRadius:10, border:"none", background:C.primary, color:"white", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.2s", fontFamily:"inherit", boxShadow:`0 2px 8px rgba(200,75,17,0.3)`, whiteSpace:"nowrap" }}
                onMouseEnter={e=>{e.currentTarget.style.background=C.accent;e.currentTarget.style.transform="translateY(-1px)";}}
                onMouseLeave={e=>{e.currentTarget.style.background=C.primary;e.currentTarget.style.transform="none";}}>
                <MS name="add" size={17}/> Upload Product
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="page-padding" style={{ padding:"36px 32px 64px", flex:1 }}>

          {/* Page heading + tabs */}
          <div style={{ marginBottom:28, opacity:headingIn?1:0, transform:headingIn?"none":"translateY(16px)", transition:"opacity 0.5s ease,transform 0.5s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:16, marginBottom:20 }}>
              <div>
                <h2 style={{ fontSize:"clamp(1.8rem,3vw,2.4rem)", fontWeight:900, color:C.text, letterSpacing:"-0.04em", lineHeight:1.1, fontFamily:"'DM Serif Display',serif" }}>
                  {activeTab==='edit' ? 'Edit Profile' : activeTab==='share' ? 'Share Profile' : 'Seller Dashboard'}
                </h2>
                <p style={{ color:C.textMuted, fontSize:13, marginTop:6, fontWeight:500 }}>
                  {activeTab==='edit' ? 'Shape how buyers discover and trust your brand.' : activeTab==='share' ? 'Generate and share your seller profile link.' : 'Monitor your performance and handle customer inquiries.'}
                </p>
              </div>
              {/* Tab pills */}
              <div style={{ display:"flex", gap:6, padding:"5px", borderRadius:14, background:C.surfaceDim, border:`1px solid ${C.borderLight}`, opacity:tabIn?1:0, transition:"opacity 0.4s ease", flexWrap:"wrap" }}>
                {[
                  { key:'dashboard', icon:'dashboard',  label:'Dashboard'    },
                  { key:'share',     icon:'share',       label:'Share Profile', pulse:true },
                  { key:'edit',      icon:'edit',        label:'Edit Profile' },
                ].map(t=>(
                  <button key={t.key} onClick={()=>switchTab(t.key)}
                    style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 14px", borderRadius:10, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:activeTab===t.key?800:600, transition:"all 0.25s cubic-bezier(0.22,1,0.36,1)", background:activeTab===t.key?C.primary:"transparent", color:activeTab===t.key?"#fff":C.textMuted, boxShadow:activeTab===t.key?`0 4px 16px rgba(200,75,17,0.3)`:"none", transform:activeTab===t.key?"scale(1.02)":"scale(1)" }}>
                    <MS name={t.icon} size={15} style={{ color:activeTab===t.key?"#fff":C.textMuted }}/>
                    {t.label}
                    {t.pulse && activeTab!==t.key && (
                      <span style={{ width:6, height:6, borderRadius:"50%", background:C.accent, flexShrink:0, animation:"pulse 2s ease-in-out infinite" }}/>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── DASHBOARD TAB ── */}
          {activeTab==='dashboard' && (
            <div style={{ animation:"tabSlideIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
              <div className="stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:18, marginBottom:32, opacity:statsIn?1:0, transform:statsIn?"none":"translateY(20px)", transition:"opacity 0.55s ease,transform 0.55s cubic-bezier(0.22,1,0.36,1)" }}>
                {stats.map((stat,i)=><StatCard key={stat.label} stat={stat} delay={i*70} ready={statsIn}/>)}
              </div>

              <div style={{ opacity:tableIn?1:0, transform:tableIn?"none":"translateY(24px)", transition:"opacity 0.55s ease,transform 0.55s cubic-bezier(0.22,1,0.36,1)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ position:"relative", width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <div style={{ position:"absolute", width:36, height:36, borderRadius:"50%", background:C.primaryBg, animation:tableIn?"eyePing 2s ease-out 0.8s infinite":"none" }}/>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:C.primaryBg, display:"flex", alignItems:"center", justifyContent:"center", animation:tableIn?"eyeBounce 2.4s ease-in-out infinite":"none", position:"relative", zIndex:1 }}>
                        <MS name="visibility" size={17} style={{ color:C.primary }}/>
                      </div>
                    </div>
                    <AnimatedHeading text="Buyers that Viewed Product" sub={`${buyerViews.length} recent views`} ready={tableIn} delay={200}/>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {['Filter','View All'].map(label=>(
                      <button key={label} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"7px 13px", border:`1px solid ${C.border}`, borderRadius:8, background:"white", cursor:"pointer", fontSize:12, fontWeight:700, color:C.textMuted, fontFamily:"'Manrope',sans-serif", transition:"all 0.2s" }}
                        onMouseEnter={e=>{e.currentTarget.style.background=C.surfaceDim;e.currentTarget.style.color=C.text;}}
                        onMouseLeave={e=>{e.currentTarget.style.background="white";e.currentTarget.style.color=C.textMuted;}}>
                        {label==='Filter'&&<MS name="filter_list" size={15}/>} {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="inquiry-table" style={{ background:"white", borderRadius:16, border:`1px solid ${C.borderLight}`, overflow:"hidden", boxShadow:`0 2px 16px rgba(200,75,17,0.04)` }}>
                  <div style={{ display:"grid", gridTemplateColumns:"2.2fr 1.2fr 1.3fr 1fr 1.4fr", padding:"14px 24px", background:C.surfaceDim, borderBottom:`1px solid ${C.borderLight}` }}>
                    {['Bag Detail','Buyer Name','Source','Received','Action'].map((h,i)=>(
                      <div key={h} style={{ fontSize:10, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.1em", textAlign:i===4?"right":"left" }}>{h}</div>
                    ))}
                  </div>
                  {buyerViews.map((row,i)=><InquiryRow key={row.id} row={row} index={i} ready={tableIn}/>)}
                  {buyerViews.length===0 && (
                    <div style={{ padding:"48px 24px", textAlign:"center" }}>
                      <MS name="visibility_off" size={36} style={{ color:C.textFaint, display:"block", margin:"0 auto 10px" }}/>
                      <p style={{ color:C.textMuted, fontSize:13, fontWeight:600 }}>No buyer views yet</p>
                      <p style={{ color:C.textFaint, fontSize:11, marginTop:4 }}>Views will appear here once buyers browse your listings.</p>
                    </div>
                  )}
                </div>

                <div className="inquiry-cards">
                  {buyerViews.map((row,i)=><InquiryCard key={row.id} row={row} index={i} ready={tableIn}/>)}
                </div>
              </div>

              {/* WhatsApp banner */}
              <div style={{ marginTop:24, display:"flex", alignItems:"center", gap:16, padding:"18px 24px", background:"white", border:`1px solid ${C.borderLight}`, borderRadius:16, boxShadow:`0 2px 12px rgba(200,75,17,0.04)`, opacity:bannerIn?1:0, transform:bannerIn?"none":"translateY(16px)", transition:"opacity 0.5s ease,transform 0.5s cubic-bezier(0.22,1,0.36,1)", flexWrap:"wrap" }}>
                <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#22c55e,#16a34a)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", flexShrink:0 }}>
                  <WhatsAppIcon size={22}/>
                </div>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:"#16a34a", marginBottom:3 }}>WhatsApp Business API Active</div>
                  <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.5 }}>
                    You are currently receiving direct inquiries from your product pages. Response time averaged at <strong style={{ color:C.text }}>14 minutes</strong>.
                  </div>
                </div>
                <button
                  onClick={() => switchTab('share')}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:10, border:`1.5px solid ${C.primaryBorder}`, background:C.primaryPale, color:C.primary, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', flexShrink:0 }}
                  onMouseEnter={e=>{e.currentTarget.style.background=C.primaryBg;e.currentTarget.style.boxShadow=`0 4px 14px rgba(200,75,17,0.12)`;}}
                  onMouseLeave={e=>{e.currentTarget.style.background=C.primaryPale;e.currentTarget.style.boxShadow='none';}}>
                  <MS name="share" size={14}/> Share Profile
                </button>
              </div>
            </div>
          )}

          {/* ── SHARE PROFILE TAB ── */}
          {activeTab==='share' && (
            <div style={{ maxWidth:680, animation:"tabSlideIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
              <ProfileURLCard seller={seller} userId={user?.id} ready={true}/>

              {/* Tips card */}
              <div style={{ background:'white', borderRadius:16, border:`1px solid ${C.borderLight}`, padding:'20px 24px', boxShadow:`0 2px 12px rgba(200,75,17,0.04)` }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <div style={{ width:34, height:34, borderRadius:10, background:C.primaryBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <MS name="tips_and_updates" size={17} style={{ color:C.primary }}/>
                  </div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:800, color:C.text }}>Tips to get more buyers</p>
                    <p style={{ fontSize:10, color:C.textMuted, fontWeight:500 }}>Maximise your profile link reach</p>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10 }}>
                  {[
                    { icon:'whatsapp', emoji:'💬', tip:'Add the link to your WhatsApp status so all your contacts see it daily.' },
                    { icon:'link', emoji:'📸', tip:'Put the link in your Instagram bio — buyers tap it straight from your page.' },
                    { icon:'qr_code', emoji:'🎁', tip:'Print the QR code on packaging or price tags for repeat buyers.' },
                    { icon:'share', emoji:'📢', tip:'Share in WhatsApp groups, Twitter/X, and Facebook Marketplace.' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding:'12px 14px', borderRadius:12, background:C.surfaceDim, border:`1px solid ${C.borderLight}` }}>
                      <div style={{ fontSize:20, marginBottom:6 }}>{item.emoji}</div>
                      <p style={{ fontSize:11, color:C.textMid, fontWeight:600, lineHeight:1.5 }}>{item.tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── EDIT PROFILE TAB ── */}
          {activeTab==='edit' && (
            <div style={{ maxWidth:720, animation:"tabSlideIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
              <EditProfilePanel
                seller={seller}
                userId={user?.id}
                panelIn={editPanelIn}
                onSaved={(updates)=>setSeller(prev=>({ ...prev, name:updates.full_name, email:updates.email, phone:updates.phone, brand_name:updates.brand_name, brand_story:updates.brand_story, bag_categories:updates.bag_categories }))}
              />
            </div>
          )}
        </div>
      </main>

      {/* ── DELETE ACCOUNT MODAL ── */}
      <DeleteAccountModal
        visible={deleteModalOpen}
        onClose={() => { if (!deleting && !deleted) { setDeleteModalOpen(false); setDeleted(false); } }}
        onConfirm={handleDeleteAccount}
        deleting={deleting}
        deleted={deleted}
      />
    </div>
  );
}

// ─── Sidebar contents ─────────────────────────────────────────────────────────
function SidebarContents({ initials, seller, sidebarIn, navigate, activeTab, switchTab, onNav, onDeleteClick }) {
  const extNavItems = [
    { icon:'home',        label:'Home',          key:'home'               },
    { icon:'dashboard',   label:'Dashboard',     key:'dashboard'          },
    { icon:'inventory_2', label:'My Listings',   key:'listings'           },
    { icon:'share',       label:'Share Profile', key:'share',  badge:true },
    { icon:'edit',        label:'Edit Profile',  key:'edit',   badge:true },
  ];

  const handleClick = useCallback((item) => {
    if (item.key==='home')                                          navigate('/products');
    if (item.key==='dashboard'||item.key==='edit'||item.key==='share') switchTab?.(item.key);
    if (item.key==='listings')                                      navigate('/seller-listing');
    onNav?.();
  }, [navigate, switchTab, onNav]);

  return (
    <>
      <div style={{ padding:"24px 20px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", width:36, height:36 }}>
            <LogoIcon size={32} />
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:900, color:"#f8fafc", letterSpacing:"-0.02em" }}>BagSearch</div>
            <div style={{ fontSize:10, color:C.textMuted, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" }}>Seller</div>
          </div>
        </div>
      </div>

      <nav style={{ flex:1, padding:"16px 12px", display:"flex", flexDirection:"column", gap:4 }}>
        {extNavItems.map((item,i)=>{
          const isActive = item.key===activeTab;
          return (
            <a key={item.key} href="#" onClick={e=>{e.preventDefault();handleClick(item);}}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, textDecoration:"none", background:isActive?C.primaryBg:"transparent", color:isActive?C.primary:C.textMuted, transition:"all 0.2s", opacity:sidebarIn?1:0, animation:sidebarIn?`slideRight 0.4s cubic-bezier(0.22,1,0.36,1) ${i*60}ms both`:"none" }}
              onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background="rgba(255,255,255,0.05)";}}
              onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background="transparent";}}>
              <MS name={item.icon} size={20}/>
              <span style={{ fontSize:13, fontWeight:isActive?700:600, flex:1 }}>{item.label}</span>
              {item.badge && !isActive && <span style={{ width:6, height:6, borderRadius:"50%", background:C.accent, animation:"pulse 2s ease-in-out infinite" }}/>}
              {isActive && <div style={{ width:6, height:6, borderRadius:"50%", background:C.primary }}/>}
            </a>
          );
        })}
      </nav>

      <div style={{ padding:"16px 14px 20px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"white", flexShrink:0 }}>{initials}</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{seller?.name}</div>
            <div style={{ fontSize:9, fontWeight:800, color:C.primary, letterSpacing:"0.15em", textTransform:"uppercase" }}>Pro Seller</div>
          </div>
        </div>

        <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"10px 12px", display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}><MS name="mail" size={13} style={{ color:C.textMuted }}/><span style={{ fontSize:11, color:C.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{seller?.email}</span></div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}><MS name="phone" size={13} style={{ color:C.textMuted }}/><span style={{ fontSize:11, color:C.textMuted }}>{seller?.phone}</span></div>
        </div>

        <button
          onClick={onDeleteClick}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:10, border:'1.5px solid rgba(220,38,38,0.22)', background:'rgba(220,38,38,0.06)', color:'#ef4444', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Manrope',sans-serif", transition:'all 0.25s cubic-bezier(0.22,1,0.36,1)' }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(220,38,38,0.14)';e.currentTarget.style.borderColor='rgba(220,38,38,0.4)';e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 14px rgba(220,38,38,0.15)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(220,38,38,0.06)';e.currentTarget.style.borderColor='rgba(220,38,38,0.22)';e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';}}>
          <MS name="delete_forever" size={16} style={{ color:'#ef4444' }}/>
          <span style={{ flex:1, textAlign:'left' }}>Delete Account</span>
          <MS name="chevron_right" size={14} style={{ color:'rgba(239,68,68,0.5)' }}/>
        </button>
      </div>
    </>
  );
}
