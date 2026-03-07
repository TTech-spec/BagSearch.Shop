import { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';

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

function mapBuyerViewRow(row) {
  const productName = row.product_name || row.products?.name || row.product?.name || 'Product';
  const productSku  = row.product_sku  || row.products?.sku  || row.product?.sku  || row.sku || '—';
  const img =
    row.product_image ||
    (Array.isArray(row.products?.images) ? row.products.images[0] : null) ||
    (Array.isArray(row.product?.images) ? row.product.images[0] : null) ||
    row.products?.image || row.product?.image ||
    'https://via.placeholder.com/96';
  const buyerName =
    row.buyer_name || row.users?.full_name || row.buyer?.full_name ||
    row.buyer_full_name || row.buyer_email || row.users?.email || 'Buyer';
  return {
    id: row.id, bag: productName, sku: productSku, img,
    buyer: buyerName, source: row.source || row.view_source || 'direct',
    time: formatRelativeTime(row.viewed_at || row.created_at), replied: false,
  };
}

function isMissingColumnError(err) {
  const msg = String(err?.message || '').toLowerCase();
  const code = String(err?.code || '').toUpperCase();
  return (
    code === '42703' ||
    code === 'PGRST204' ||
    (msg.includes('column') && msg.includes('does not exist')) ||
    (msg.includes('could not find') && msg.includes('column') && msg.includes('schema cache'))
  );
}

const navItems = [
  { icon: 'dashboard',    label: 'Dashboard',   active: true  },
  { icon: 'inventory_2',  label: 'My Listings', active: false },
  { icon: 'receipt_long', label: 'Orders',      active: false },
];

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

// ─── Nav item ─────────────────────────────────────────────────────────────────
function NavItem({ item, delay, ready, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <a href="#" onClick={e=>{e.preventDefault();onClick?.();}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, textDecoration:"none", background:item.active?C.primaryBg:hov?"rgba(255,255,255,0.05)":"transparent", color:item.active?C.primary:hov?C.textMuted:C.textMuted, transition:"all 0.2s", transform:hov&&!item.active?"translateX(3px)":"none", opacity:ready?1:0, animation:ready?`slideRight 0.4s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`:"none" }}>
      <MS name={item.icon} size={20}/>
      <span style={{ fontSize:13, fontWeight:item.active?700:600 }}>{item.label}</span>
      {item.active && <div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:C.primary }}/>}
    </a>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
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
        ) : (
          <a href={`https://wa.me/2348147061837?text=Hi%2C%20following%20up%20on%20${encodeURIComponent(row.bag)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, background:C.primary, color:"white", fontSize:12, fontWeight:700, textDecoration:"none", transition:"all 0.2s", boxShadow:`0 2px 8px rgba(200,75,17,0.3)` }}
            onMouseEnter={e=>{e.currentTarget.style.background=C.accent;e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.primary;e.currentTarget.style.transform="none";}}>
            <MS name="chat" size={15}/> Chat on WhatsApp
          </a>
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
        ) : (
          <a href={`https://wa.me/2348147061837?text=Hi%2C%20following%20up%20on%20${encodeURIComponent(row.bag)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, background:C.primary, color:"white", fontSize:12, fontWeight:700, textDecoration:"none", transition:"all 0.2s" }}
            onMouseEnter={e=>e.currentTarget.style.background=C.accent}
            onMouseLeave={e=>e.currentTarget.style.background=C.primary}>
            <MS name="chat" size={15}/> Chat on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Animated section heading ─────────────────────────────────────────────────
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
// ─── EDIT PROFILE PANEL (new) ─────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// Float-label input
function FloatInput({ label, value, onChange, type='text', icon, iconColor, hint, disabled }) {
  const [focused, setFocused] = useState(false);
  const has = value && value.length > 0;
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", border:`2px solid ${focused?C.primary:has?C.heroDark:C.cardBorder}`, borderRadius:14, background:focused?C.primaryPale:C.surface, transition:"all 0.3s cubic-bezier(0.22,1,0.36,1)", boxShadow:focused?`0 0 0 4px ${C.primaryBg},0 6px 24px rgba(200,75,17,0.1)`:"none", overflow:"hidden" }}>
        {icon && (
          <div style={{ paddingLeft:14, display:"flex", alignItems:"center", transform:focused?"scale(1.15)":"scale(1)", transition:"transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <MS name={icon} size={16} style={{ color:focused?C.primary:iconColor||C.textFaint }}/>
          </div>
        )}
        <div style={{ flex:1, position:"relative", paddingTop:20, paddingBottom:8, paddingLeft:icon?10:14, paddingRight:14 }}>
          <label style={{ position:"absolute", top:focused||has?5:"50%", transform:focused||has?"none":"translateY(-50%)", fontSize:focused||has?9:13, fontWeight:focused||has?800:500, color:focused?C.primary:C.textFaint, letterSpacing:focused||has?"0.12em":"0", textTransform:focused||has?"uppercase":"none", transition:"all 0.25s cubic-bezier(0.22,1,0.36,1)", pointerEvents:"none", fontFamily:"'Manrope',sans-serif" }}>
            {label}
          </label>
          <input type={type} value={value} onChange={onChange} disabled={disabled}
            onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
            style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontSize:13, fontWeight:600, color:C.text, fontFamily:"'Manrope',sans-serif", marginTop:2 }}/>
        </div>
      </div>
      {hint && <p style={{ fontSize:10, color:C.textFaint, fontWeight:500, marginTop:4, paddingLeft:4 }}>{hint}</p>}
    </div>
  );
}

// Brand story textarea
function BrandStoryBox({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  const max = 400;
  const pct = Math.min((value.length/max)*100,100);
  const circ = 2*Math.PI*13;
  return (
    <div style={{ border:`2px solid ${focused?C.primary:value.length>0?C.heroDark:C.cardBorder}`, borderRadius:16, background:focused?C.primaryPale:C.surface, transition:"all 0.3s cubic-bezier(0.22,1,0.36,1)", boxShadow:focused?`0 0 0 4px ${C.primaryBg},0 8px 32px rgba(200,75,17,0.1)`:"none" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 16px 0" }}>
        <div style={{ width:26, height:26, borderRadius:8, background:focused?C.primary:C.primaryBg, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.3s" }}>
          <MS name="auto_awesome" size={13} style={{ color:focused?"#fff":C.primary }}/>
        </div>
        <span style={{ fontSize:10, fontWeight:800, color:focused?C.primary:C.textFaint, letterSpacing:"0.12em", textTransform:"uppercase", transition:"color 0.3s" }}>Brand Story</span>
      </div>
      <textarea value={value} onChange={e=>onChange(e.target.value.slice(0,max))}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        placeholder="Tell buyers about your bag brand — your origin story, what makes your pieces special, the vibe you bring to every collection…"
        rows={4}
        style={{ width:"100%", border:"none", outline:"none", resize:"none", background:"transparent", padding:"10px 16px 0", fontSize:12, fontWeight:500, color:C.text, lineHeight:1.7, fontFamily:"'Manrope',sans-serif" }}/>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", padding:"4px 12px 10px", gap:7 }}>
        <span style={{ fontSize:10, color:C.textFaint, fontWeight:600 }}>{value.length}/{max}</span>
        <svg width="30" height="30" viewBox="0 0 30 30" style={{ transform:"rotate(-90deg)" }}>
          <circle cx="15" cy="15" r="13" fill="none" stroke={C.borderLight} strokeWidth="2.5"/>
          <circle cx="15" cy="15" r="13" fill="none" stroke={pct>=100?C.danger:pct>75?C.accent:C.primary} strokeWidth="2.5" strokeDasharray={circ} strokeDashoffset={circ-(circ*pct)/100} strokeLinecap="round" style={{ transition:"stroke-dashoffset 0.4s ease,stroke 0.3s" }}/>
        </svg>
      </div>
    </div>
  );
}

// Category chip
function CatChip({ cat, selected, onClick, index, visible }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:3, padding:"12px 14px", borderRadius:14, textAlign:"left", cursor:"pointer", border:`2px solid ${selected?C.primary:hov?C.heroDark:C.cardBorder}`, background:selected?`linear-gradient(135deg,${C.primaryBg},${C.hero}88)`:hov?C.primaryPale:C.surface, boxShadow:selected?`0 5px 20px rgba(200,75,17,0.2),inset 0 1px 0 rgba(255,255,255,0.5)`:"none", transform:selected?"scale(1.04)":hov?"translateY(-2px)":"scale(1)", opacity:visible?1:0, transition:`opacity 0.4s ease ${100+index*45}ms,transform 0.35s cubic-bezier(0.34,1.56,0.64,1),border-color 0.2s,background 0.2s,box-shadow 0.25s`, position:"relative", overflow:"hidden", fontFamily:"'Manrope',sans-serif" }}>
      {selected && (
        <div style={{ position:"absolute", top:7, right:7, width:16, height:16, borderRadius:"50%", background:C.primary, display:"flex", alignItems:"center", justifyContent:"center", animation:"popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <MS name="check" size={10} style={{ color:"#fff" }}/>
        </div>
      )}
      <span style={{ fontSize:20, lineHeight:1 }}>{cat.emoji}</span>
      <span style={{ fontSize:11, fontWeight:800, color:selected?C.primary:C.text }}>{cat.label}</span>
      <span style={{ fontSize:9,  fontWeight:500, color:selected?C.textMid:C.textFaint }}>{cat.desc}</span>
    </button>
  );
}

// Inline save toast
function SaveToast({ message, type, visible }) {
  return (
    <div style={{ position:"fixed", bottom:32, left:"50%", transform:`translateX(-50%) translateY(${visible?0:80}px)`, opacity:visible?1:0, transition:"all 0.45s cubic-bezier(0.22,1,0.36,1)", zIndex:9999, pointerEvents:"none", display:"flex", alignItems:"center", gap:10, padding:"12px 26px", borderRadius:50, background:type==="success"?`linear-gradient(135deg,${C.success},#15803d)`:`linear-gradient(135deg,${C.danger},#b91c1c)`, color:"#fff", fontSize:13, fontWeight:700, fontFamily:"'Manrope',sans-serif", boxShadow:"0 12px 40px rgba(0,0,0,0.22)" }}>
      <MS name={type==="success"?"check_circle":"error"} size={16} style={{ color:"#fff" }}/>
      {message}
    </div>
  );
}

// ─── The Edit Profile Panel ───────────────────────────────────────────────────
function EditProfilePanel({ seller, userId, onSaved, panelIn }) {
  const [form, setForm] = useState({ full_name:'', email:'', phone:'', brand_name:'', brand_story:'' });
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

  const showToast = (msg, type='success') => {
    setToast({ visible:true, message:msg, type });
    setTimeout(()=>setToast(t=>({...t,visible:false})),3000);
  };

  const f = (field) => (e) => setForm(prev=>({...prev,[field]:typeof e==='string'?e:e.target.value}));
  const toggleCat = (id) => setCategories(prev=>prev.includes(id)?prev.filter(c=>c!==id):[...prev,id]);

  const handleSave = async () => {
    if (!form.full_name.trim()) { showToast('Name is required','error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { showToast('Invalid email address','error'); return; }
    if (categories.length===0) { showToast('Pick at least one bag category','error'); return; }
    setSaving(true);
    try {
      const baseUpdates = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      };
      const fullUpdates = {
        ...baseUpdates,
        brand_name: form.brand_name.trim(),
        brand_story: form.brand_story.trim(),
        bag_categories: categories,
      };

      let updates = fullUpdates;
      let { error } = await supabase.from('users').update(fullUpdates).eq('user_id', userId);
      if (error && isMissingColumnError(error)) {
        const fallback = await supabase.from('users').update(baseUpdates).eq('user_id', userId);
        error = fallback.error;
        updates = baseUpdates;
      }
      if (error) throw error;
      const { data:{ user:authUser } } = await supabase.auth.getUser();
      if (authUser && form.email !== authUser.email) await supabase.auth.updateUser({ email:form.email });
      await supabase.auth.updateUser({ data:{ full_name:form.full_name } });
      setSaved(true);
      showToast('Profile saved successfully! 🎉','success');
      onSaved?.({
        ...updates,
        brand_name: updates.brand_name ?? '',
        brand_story: updates.brand_story ?? '',
        bag_categories: updates.bag_categories ?? [],
      });
      setTimeout(()=>setSaved(false),2800);
    } catch(e) { showToast(e.message||'Save failed','error'); }
    finally { setSaving(false); }
  };

  // Section card wrapper
  const SCard = ({ children, visible, delay=0, extra={} }) => (
    <div style={{ background:"rgba(255,255,255,0.95)", backdropFilter:"blur(12px)", border:`1.5px solid ${C.cardBorder}`, borderRadius:20, padding:"28px", marginBottom:16, boxShadow:`0 6px 32px rgba(200,75,17,0.06)`, opacity:visible?1:0, transform:visible?"none":"translateY(24px)", transition:`opacity 0.55s ease ${delay}ms,transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms`, ...extra }}>
      {children}
    </div>
  );

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
      {/* Animated peach banner at top of edit section */}
      <div style={{ borderRadius:20, overflow:"hidden", marginBottom:16, background:`linear-gradient(135deg,${C.hero} 0%,${C.heroDark} 55%,#f0a882 100%)`, padding:"28px 32px", boxShadow:`0 10px 48px rgba(200,75,17,0.14)`, position:"relative", opacity:panelIn?1:0, transform:panelIn?"translateY(0)":"translateY(20px)", transition:"opacity 0.6s ease,transform 0.6s cubic-bezier(0.22,1,0.36,1)" }}>
        {/* BG lines */}
        {[14,32,50,70].map(p=><div key={p} style={{ position:"absolute", top:0, bottom:0, left:`${p}%`, width:1, background:"rgba(255,255,255,0.1)", pointerEvents:"none" }}/>)}
        <div style={{ position:"absolute", top:-40, right:120, width:200, height:200, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.12)", pointerEvents:"none" }}/>
        {/* scan shimmer */}
        <div style={{ position:"absolute", top:0, bottom:0, width:60, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)", animation:"scanLine 3s ease-in-out infinite", pointerEvents:"none" }}/>

        <div style={{ position:"relative", zIndex:2 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"3px 10px", borderRadius:20, background:"rgba(255,255,255,0.28)", backdropFilter:"blur(8px)", marginBottom:10 }}>
            <MS name="edit" size={11} style={{ color:C.primary }}/>
            <span style={{ fontSize:9, fontWeight:800, color:C.primary, letterSpacing:"0.14em", textTransform:"uppercase" }}>Edit Profile</span>
          </div>
          <h3 style={{ fontSize:"clamp(1.3rem,3vw,1.8rem)", fontWeight:900, color:C.textDark, letterSpacing:"-0.04em", fontFamily:"'DM Serif Display',serif", lineHeight:1.1, marginBottom:8 }}>
            Shape How Buyers<br/><em style={{ fontStyle:"italic", color:C.primary }}>See Your Brand.</em>
          </h3>
          <p style={{ fontSize:12, color:C.textMid, fontWeight:500 }}>
            {categories.length>0
              ? categories.map(id=>BAG_CATEGORIES.find(c=>c.id===id)?.emoji).join(' ')
              : 'Pick your categories below ↓'}
          </p>
        </div>
      </div>

      {/* Section 1 — Identity */}
      <SCard visible={sec1In}>
        <SHead icon="person" title="Personal Info" subtitle="Your identity on Criibb"/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14 }}>
          <FloatInput label="Full Name"    value={form.full_name} onChange={f('full_name')} icon="badge"       iconColor={C.primary}/>
          <FloatInput label="Email"        value={form.email}     onChange={f('email')}     icon="mail"        iconColor={C.accent}  type="email"/>
          <FloatInput label="Phone"        value={form.phone}     onChange={f('phone')}     icon="phone"       iconColor={C.success} type="tel" hint="Include country code e.g. +234"/>
        </div>
      </SCard>

      {/* Section 2 — Brand */}
      <SCard visible={sec2In}>
        <SHead icon="storefront" title="Brand Identity" subtitle="Make your brand unforgettable" color={C.accent}/>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <FloatInput label="Brand Name" value={form.brand_name} onChange={f('brand_name')} icon="shopping_bag" iconColor={C.primary} hint="Your store name e.g. Adé Bags Lagos"/>
          <BrandStoryBox value={form.brand_story} onChange={f('brand_story')}/>
        </div>
      </SCard>

      {/* Section 3 — Categories */}
      <SCard visible={sec3In}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:22, flexWrap:"wrap", gap:8 }}>
          <SHead icon="sell" title="Bag Categories" subtitle="Select all that apply" color={C.primaryLight}/>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
            {categories.length>0 && <span style={{ fontSize:10, fontWeight:800, padding:"4px 11px", borderRadius:20, background:C.primaryBg, color:C.primary, border:`1px solid ${C.primaryBorder}` }}>{categories.length} selected</span>}
            {categories.length>0 && <button onClick={()=>setCategories([])} style={{ fontSize:10, fontWeight:600, color:C.textMuted, background:"none", border:"none", cursor:"pointer", textDecoration:"underline", fontFamily:"inherit" }}>Clear</button>}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10 }}>
          {BAG_CATEGORIES.map((cat,i)=>(
            <CatChip key={cat.id} cat={cat} selected={categories.includes(cat.id)} onClick={()=>toggleCat(cat.id)} index={i} visible={catsIn}/>
          ))}
        </div>
        {categories.length===0 && (
          <div style={{ marginTop:14, padding:"10px 14px", borderRadius:10, background:C.primaryBg, border:`1.5px dashed ${C.heroDark}`, display:"flex", alignItems:"center", gap:8 }}>
            <MS name="sell" size={13} style={{ color:C.textFaint }}/> 
            <span style={{ fontSize:10, color:C.textMuted, fontWeight:500 }}>Pick at least one category so buyers can discover your listings</span>
          </div>
        )}
      </SCard>

      {/* Save button */}
      <div style={{ display:"flex", justifyContent:"flex-end", gap:12, opacity:sec3In?1:0, transition:"opacity 0.5s ease 300ms" }}>
        <button onClick={handleSave} disabled={saving}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 40px", borderRadius:16, border:"none", background:saved?`linear-gradient(135deg,${C.success},#15803d)`:`linear-gradient(135deg,${C.primary} 0%,${C.accent} 50%,${C.primaryLight} 100%)`, color:"#fff", fontSize:14, fontWeight:900, cursor:saving?"default":"pointer", fontFamily:"'DM Serif Display',serif", letterSpacing:"-0.02em", boxShadow:`0 8px 36px rgba(200,75,17,0.4)`, transition:"all 0.4s cubic-bezier(0.22,1,0.36,1)", position:"relative", overflow:"hidden" }}
          onMouseEnter={e=>{if(!saving){e.currentTarget.style.transform="translateY(-4px) scale(1.03)";e.currentTarget.style.boxShadow=`0 16px 50px rgba(200,75,17,0.52)`;} }}
          onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`0 8px 36px rgba(200,75,17,0.4)`;} }>
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

  const [seller,             setSeller]             = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);
  const [mobileSidebarOpen,  setMobileSidebarOpen]  = useState(false);
  const [activeTab,          setActiveTab]          = useState('dashboard'); // 'dashboard' | 'edit'

  const [activeListingsCount, setActiveListingsCount] = useState(0);
  const [totalViewsCount,     setTotalViewsCount]     = useState(0);
  const [buyerViews,          setBuyerViews]          = useState([]);
  const [metricsLoading,      setMetricsLoading]      = useState(true);

  const [sidebarIn,  setSidebarIn]  = useState(false);
  const [headerIn,   setHeaderIn]   = useState(false);
  const [headingIn,  setHeadingIn]  = useState(false);
  const [statsIn,    setStatsIn]    = useState(false);
  const [tableIn,    setTableIn]    = useState(false);
  const [bannerIn,   setBannerIn]   = useState(false);
  const [tabIn,      setTabIn]      = useState(false);
  const [editPanelIn,setEditPanelIn]= useState(false);

  useEffect(()=>{
    setTimeout(()=>setSidebarIn(true),  60);
    setTimeout(()=>setHeaderIn(true),   120);
    setTimeout(()=>setHeadingIn(true),  260);
    setTimeout(()=>setStatsIn(true),    380);
    setTimeout(()=>setTableIn(true),    520);
    setTimeout(()=>setBannerIn(true),   660);
    setTimeout(()=>setTabIn(true),      200);
  },[]);

  useEffect(()=>{
    async function loadSeller() {
      try {
        if (!user){ setError('User not authenticated'); setLoading(false); return; }
        let { data, error:e } = await supabase.from('users').select('full_name,email,phone,brand_name,brand_story,bag_categories').eq('user_id',user.id).maybeSingle();
        if (e && isMissingColumnError(e)) {
          const fallback = await supabase.from('users').select('full_name,email,phone').eq('user_id',user.id).maybeSingle();
          data = fallback.data;
          e = fallback.error;
        }
        if (e) throw e;
        setSeller({ name:data?.full_name||user.user_metadata?.full_name||'Seller', email:data?.email||user.email||'N/A', phone:data?.phone||user.user_metadata?.phone||'N/A', brand_name:data?.brand_name||'', brand_story:data?.brand_story||'', bag_categories:data?.bag_categories||[], avatar:null });
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
        const { count:lc } = await supabase.from('products').select('id',{count:'exact',head:true}).eq('seller_id',user.id);
        setActiveListingsCount(lc||0);
        const { data:vd, count:vc, error:ve } = await supabase.from('product_views').select(`id,viewed_at,source,products:product_id(id,name,sku,images),users:buyer_id(full_name,email)`,{count:'exact'}).eq('products.seller_id',user.id).order('viewed_at',{ascending:false}).limit(20);
        if (!ve){ setTotalViewsCount(vc||0); setBuyerViews((vd||[]).map(mapBuyerViewRow)); }
        else {
          const { data:pv } = await supabase.from('products').select('views_count').eq('seller_id',user.id);
          if (pv) setTotalViewsCount(pv.reduce((a,p)=>a+(Number(p.views_count)||0),0));
        }
      } catch(e){ console.error(e); }
      finally { setMetricsLoading(false); }
    }
    loadMetrics();
  },[user]);

  const stats = useMemo(()=>[
    { icon:'payments',        label:'Total Revenue',     value:'—',                                              badge:'—',  accent:C.primary,     glow:'rgba(200,75,17,0.15)' },
    { icon:'shopping_basket', label:'Active Listings',   value:metricsLoading?'…':String(activeListingsCount),  badge:'',   accent:'#f97316',      glow:'rgba(249,115,22,0.12)' },
    { icon:'chat',            label:'Inquiries',         value:'—',                                              badge:'',   accent:'#22c55e',      glow:'rgba(34,197,94,0.12)' },
    { icon:'visibility',      label:'Total Views',       value:metricsLoading?'…':String(totalViewsCount),      badge:'',   accent:'#a78bfa',      glow:'rgba(167,139,250,0.12)' },
  ],[metricsLoading,activeListingsCount,totalViewsCount]);

  // Switch tab with animation
  const switchTab = (tab) => {
    if (tab===activeTab) return;
    setActiveTab(tab);
    if (tab==='edit'){
      setEditPanelIn(false);
      setTimeout(()=>setEditPanelIn(true),80);
    }
  };

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

        @keyframes slideRight  {from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeUp      {from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)}}
        @keyframes rowSlide    {from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes cardSlideUp {from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)}}
        @keyframes pulse       {0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes eyePing     {0%{transform:scale(1);opacity:0.6}100%{transform:scale(2.2);opacity:0}}
        @keyframes eyeBounce   {0%,100%{transform:translateY(0) scale(1)}45%{transform:translateY(-5px) scale(1.08)}}
        @keyframes spin        {to{transform:rotate(360deg)}}
        @keyframes scanLine    {from{transform:translateX(-100%)}to{transform:translateX(300%)}}
        @keyframes popIn       {from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
        @keyframes overlayFade {from{opacity:0}to{opacity:1}}
        @keyframes tabSlideIn  {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes floatOrb    {0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes shimmerBar  {0%{background-position:-400px 0}100%{background-position:400px 0}}

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
        <SidebarContents initials={initials} seller={seller} sidebarIn={sidebarIn} navigate={navigate} activeTab={activeTab} switchTab={switchTab}/>
      </aside>

      {/* ── MOBILE SIDEBAR ── */}
      <div className="sidebar-mobile-overlay">
        {mobileSidebarOpen && <div onClick={()=>setMobileSidebarOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:40, animation:"overlayFade 0.25s ease both" }}/>}
        <aside style={{ width:260, background:C.text, position:"fixed", top:0, left:0, height:"100%", display:"flex", flexDirection:"column", zIndex:50, transform:mobileSidebarOpen?"translateX(0)":"translateX(-100%)", transition:"transform 0.32s cubic-bezier(0.4,0,0.2,1)", boxShadow:"8px 0 32px rgba(0,0,0,0.3)" }}>
          <button onClick={()=>setMobileSidebarOpen(false)} style={{ position:"absolute", top:16, right:16, width:32, height:32, borderRadius:"50%", border:"none", background:"rgba(255,255,255,0.08)", color:C.textMuted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>✕</button>
          <SidebarContents initials={initials} seller={seller} sidebarIn={mobileSidebarOpen} navigate={navigate} activeTab={activeTab} switchTab={(t)=>{switchTab(t);setMobileSidebarOpen(false);}} onNav={()=>setMobileSidebarOpen(false)}/>
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
              <button style={{ position:"relative", padding:8, borderRadius:10, border:"none", background:"transparent", cursor:"pointer", color:C.textMuted, transition:"all 0.2s" }}
                onMouseEnter={e=>e.currentTarget.style.background=C.surfaceDim}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <MS name="notifications" size={22}/>
                <span style={{ position:"absolute", top:7, right:7, width:8, height:8, background:C.danger, borderRadius:"50%", border:"2px solid white", animation:"pulse 2s ease-in-out infinite" }}/>
              </button>
              <div style={{ width:1, height:28, background:C.border }}/>
              <button onClick={()=>navigate('/upload-product')}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 16px", borderRadius:10, border:"none", background:C.primary, color:"white", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.2s", fontFamily:"inherit", boxShadow:`0 2px 8px rgba(200,75,17,0.3)`, whiteSpace:"nowrap" }}
                onMouseEnter={e=>{e.currentTarget.style.background=C.accent;e.currentTarget.style.transform="translateY(-1px)";}}
                onMouseLeave={e=>{e.currentTarget.style.background=C.primary;e.currentTarget.style.transform="none";}}>
                <MS name="add" size={17}/> New Listing
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="page-padding" style={{ padding:"36px 32px 64px", flex:1 }}>

          {/* Page heading + tab switcher */}
          <div style={{ marginBottom:28, opacity:headingIn?1:0, transform:headingIn?"none":"translateY(16px)", transition:"opacity 0.5s ease,transform 0.5s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:16, marginBottom:20 }}>
              <div>
                <h2 style={{ fontSize:"clamp(1.8rem,3vw,2.4rem)", fontWeight:900, color:C.text, letterSpacing:"-0.04em", lineHeight:1.1, fontFamily:"'DM Serif Display',serif" }}>
                  {activeTab==='edit' ? 'Edit Profile' : 'Seller Dashboard'}
                </h2>
                <p style={{ color:C.textMuted, fontSize:13, marginTop:6, fontWeight:500 }}>
                  {activeTab==='edit' ? 'Shape how buyers discover and trust your brand.' : 'Monitor your performance and handle customer inquiries.'}
                </p>
              </div>

              {/* Tab pills */}
              <div style={{ display:"flex", gap:8, padding:"5px", borderRadius:14, background:C.surfaceDim, border:`1px solid ${C.borderLight}`, opacity:tabIn?1:0, transition:"opacity 0.4s ease" }}>
                {[
                  { key:'dashboard', icon:'dashboard',  label:'Dashboard'     },
                  { key:'edit',      icon:'edit',        label:'Edit Profile'  },
                ].map(t=>(
                  <button key={t.key} onClick={()=>switchTab(t.key)}
                    style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 16px", borderRadius:10, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:activeTab===t.key?800:600, transition:"all 0.25s cubic-bezier(0.22,1,0.36,1)", background:activeTab===t.key?C.primary:"transparent", color:activeTab===t.key?"#fff":C.textMuted, boxShadow:activeTab===t.key?`0 4px 16px rgba(200,75,17,0.3)`:"none", transform:activeTab===t.key?"scale(1.02)":"scale(1)" }}>
                    <MS name={t.icon} size={15} style={{ color:activeTab===t.key?"#fff":C.textMuted }}/>
                    {t.label}
                    {t.key==='edit' && activeTab!=='edit' && (
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
              {/* Stats */}
              <div className="stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:18, marginBottom:32, opacity:statsIn?1:0, transform:statsIn?"none":"translateY(20px)", transition:"opacity 0.55s ease,transform 0.55s cubic-bezier(0.22,1,0.36,1)" }}>
                {stats.map((stat,i)=><StatCard key={stat.label} stat={stat} delay={i*70} ready={statsIn}/>)}
              </div>

              {/* Buyer views */}
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
    </div>
  );
}

// ─── Sidebar contents ─────────────────────────────────────────────────────────
function SidebarContents({ initials, seller, sidebarIn, navigate, activeTab, switchTab, onNav }) {
  const extNavItems = [
    { icon:'dashboard',    label:'Dashboard',    key:'dashboard' },
    { icon:'inventory_2',  label:'My Listings',  key:'listings'  },
    { icon:'edit',         label:'Edit Profile', key:'edit',  badge:true },
  ];

  const handleClick = (item) => {
    if (item.key==='dashboard' || item.key==='edit') { switchTab?.(item.key==='listings'?'dashboard':item.key); }
    if (item.key==='listings') navigate('/seller-listing');
    onNav?.();
  };

  return (
    <>
      <div style={{ padding:"24px 20px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <MS name="shopping_bag" size={18} style={{ color:"white" }}/>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:900, color:"#f8fafc", letterSpacing:"-0.02em" }}>LuxeBag</div>
            <div style={{ fontSize:10, color:C.textMuted, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" }}>Seller</div>
          </div>
        </div>
      </div>

      <nav style={{ flex:1, padding:"16px 12px", display:"flex", flexDirection:"column", gap:4 }}>
        {extNavItems.map((item,i)=>{
          const isActive = item.key===activeTab || (item.key==='dashboard' && activeTab==='dashboard');
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
        <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"10px 12px", display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}><MS name="mail" size={13} style={{ color:C.textMuted }}/><span style={{ fontSize:11, color:C.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{seller?.email}</span></div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}><MS name="phone" size={13} style={{ color:C.textMuted }}/><span style={{ fontSize:11, color:C.textMuted }}>{seller?.phone}</span></div>
        </div>
      </div>
    </>
  );
}
