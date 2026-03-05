import { useState, useRef, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from './components/ui/badge';
import { AuthContext } from './context/AuthContext';
import { supabase } from './services/api';

// ─── Luxury Page Loader ───────────────────────────────────────────────────────
const PageLoader = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 5 + 2;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setPhase(1), 500);
        setTimeout(() => onDone(), 1300);
      } else {
        setProgress(Math.min(p, 100));
      }
    }, 35);
    return () => clearInterval(interval);
  }, [onDone]);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: phase === 1 ? 0 : 1, transform: phase === 1 ? 'scale(1.03)' : 'scale(1)', transition: 'opacity 0.7s ease, transform 0.7s ease', pointerEvents: phase === 1 ? 'none' : 'all' }}>
      <style>{`
        @keyframes loaderSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes loaderPulseRing { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.22);opacity:0.4} }
        @keyframes loaderBagBounce { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-7px) scale(1.04)} }
        @keyframes loaderDot { 0%,80%,100%{transform:scale(0.55);opacity:0.25} 40%{transform:scale(1);opacity:1} }
        @keyframes loaderFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmerBar { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes loaderGlow { 0%,100%{box-shadow:0 8px 28px rgba(20,75,184,0.25)} 50%{box-shadow:0 8px 36px rgba(20,75,184,0.55)} }
        @keyframes loaderRingFade { 0%{transform:scale(0.85);opacity:0.6} 100%{transform:scale(1.6);opacity:0} }
      `}</style>
      {[0, 1].map(i => (
        <div key={i} style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%', border: '1.5px solid rgba(20,75,184,0.2)', animation: `loaderRingFade 2.2s ease-out ${i * 1.1}s infinite` }} />
      ))}
      <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,75,184,0.05) 0%, transparent 70%)', animation: 'loaderPulseRing 3s ease-in-out infinite' }} />
      <div style={{ position: 'relative', width: 92, height: 92, marginBottom: 30 }}>
        <svg width="92" height="92" viewBox="0 0 92 92" style={{ position: 'absolute', inset: 0, animation: 'loaderSpin 1.9s linear infinite' }}>
          <circle cx="46" cy="46" r="40" fill="none" stroke="#eef1fb" strokeWidth="2.5" />
          <circle cx="46" cy="46" r="40" fill="none" stroke="#144bb8" strokeWidth="2.5" strokeDasharray={`${2 * Math.PI * 40 * progress / 100} ${2 * Math.PI * 40}`} strokeLinecap="round" style={{ transformOrigin: '46px 46px', transition: 'stroke-dasharray 0.08s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #144bb8 0%, #4f7ef7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'loaderBagBounce 1.7s ease-in-out infinite, loaderGlow 1.7s ease-in-out infinite' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
        </div>
      </div>
      <div style={{ animation: 'loaderFadeUp 0.55s ease 0.15s both', textAlign: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.03em', color: '#111318', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          Bags<span style={{ color: '#144bb8' }}>.NG</span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 38, animation: 'loaderFadeUp 0.55s ease 0.3s both' }}>
        <span style={{ fontSize: 11, color: '#8a96b0', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'system-ui, sans-serif' }}>Loading your experience</span>
        <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {[0, 1, 2].map(i => (<span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#144bb8', display: 'inline-block', animation: `loaderDot 1.3s ease-in-out ${i * 0.18}s infinite` }} />))}
        </span>
      </div>
      <div style={{ width: 'min(260px, 60vw)', animation: 'loaderFadeUp 0.55s ease 0.45s both' }}>
        <div style={{ height: 3, background: '#eef1fb', borderRadius: 9999, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 9999, width: `${progress}%`, background: 'linear-gradient(90deg, #144bb8, #4f7ef7, #144bb8)', backgroundSize: '200% auto', animation: 'shimmerBar 1.5s linear infinite', transition: 'width 0.08s ease', boxShadow: '0 0 10px rgba(20,75,184,0.45)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'system-ui, sans-serif' }}>
          <span style={{ color: '#c5cad8' }}>BAGS.NG</span>
          <span style={{ color: '#144bb8' }}>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

// ─── Nigerian Cities / Locations ─────────────────────────────────────────────
const NIGERIAN_LOCATIONS = [
  { id: 'all', name: 'All Nigeria', emoji: '🇳🇬', state: '' },
  { id: 'lagos-island', name: 'Lagos Island', emoji: '🏙️', state: 'Lagos' },
  { id: 'lagos-mainland', name: 'Lagos Mainland', emoji: '🌆', state: 'Lagos' },
  { id: 'victoria-island', name: 'Victoria Island', emoji: '💎', state: 'Lagos' },
  { id: 'lekki', name: 'Lekki', emoji: '🌴', state: 'Lagos' },
  { id: 'ikeja', name: 'Ikeja', emoji: '✈️', state: 'Lagos' },
  { id: 'abuja', name: 'Abuja', emoji: '🏛️', state: 'FCT' },
  { id: 'wuse', name: 'Wuse', emoji: '🏢', state: 'FCT' },
  { id: 'kano', name: 'Kano', emoji: '🌅', state: 'Kano' },
  { id: 'ibadan', name: 'Ibadan', emoji: '🌇', state: 'Oyo' },
  { id: 'port-harcourt', name: 'Port Harcourt', emoji: '⚓', state: 'Rivers' },
  { id: 'enugu', name: 'Enugu', emoji: '⛰️', state: 'Enugu' },
  { id: 'benin-city', name: 'Benin City', emoji: '👑', state: 'Edo' },
  { id: 'calabar', name: 'Calabar', emoji: '🌿', state: 'Cross River' },
  { id: 'warri', name: 'Warri', emoji: '🛢️', state: 'Delta' },
  { id: 'aba', name: 'Aba', emoji: '👜', state: 'Abia' },
  { id: 'onitsha', name: 'Onitsha', emoji: '🛒', state: 'Anambra' },
];

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all', label: 'All Bags', icon: '👜', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', count: 0 },
  { id: 'tote', label: 'Tote Bags', icon: '🛍️', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', count: 0 },
  { id: 'clutch', label: 'Clutches', icon: '💼', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', count: 0 },
  { id: 'crossbody', label: 'Crossbody', icon: '👝', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', count: 0 },
  { id: 'backpack', label: 'Backpacks', icon: '🎒', color: '#d97706', bg: '#fffbeb', border: '#fde68a', count: 0 },
  { id: 'satchel', label: 'Satchels', icon: '🗂️', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', count: 0 },
  { id: 'evening', label: 'Evening', icon: '✨', color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8', count: 0 },
  { id: 'mini', label: 'Mini Bags', icon: '💛', color: '#ca8a04', bg: '#fefce8', border: '#fef08a', count: 0 },
];

const mockProducts = [
  { id: 1, name: "The Midnight Satchel", seller: "Luxury Bags Co.", sub: "Italian Leather • Midnight Blue", price: "$2,450", quantity: 12, lowStock: false, category: 'satchel', location: 'victoria-island', colors: ["#1a1a2e", "#16213e", "#0f3460"], src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbc5dxE3grW8p08E8TtaWN5L8YARMDRthJf6pzKLJE7uj3eaIfhldAvqZBwEJ869mgq48jOcjGej6zLtlrV4spzEjXI3d3TnAtGQYDXhni_ERAbMCU5__dE5BTSySucF66-Tam-NPTm_L4wqZ4ri_euRX9gy3LOCm6Q8qwFgqFbplPdoz-wl2wnadQozRro5HBbjY0oG7WHOAFumWG3QkohBlRJf0LbZVdQs-EXHx9fofCLvfgCPZD96qWxLrXQCkDmEa1lpUdDF8" },
  { id: 2, name: "Ivory Essential Tote", seller: "Eco Style Hub", sub: "Sustainable Vegan Leather • Ivory", price: "$1,800", quantity: 3, lowStock: true, category: 'tote', location: 'lekki', colors: ["#f5f0e8", "#e8ddd0", "#d4c5b0"], src: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2iIgrfiMmBYx39D4_vHqJgAshrgoMIswLRfc2TNvfzLU12RyRG8nYTV1JSaGLpieTiA4SFxSz28wVJu8RVEbJzuVBbJbm6Gj5XK9oEHZunRQAVk_1t0P2NjMKC3plNviwYC5tcEKM-Va_JQwOW6RTDFxwhgZ-7Nrxc3I_zAk8i6QRqKlYvomRE5405JaFLrDywqdjnveGzzlneGcygTz_tQjdyk0NKuib_RBkzl9yaB4TmD9ec64_I1ha5hAbnVobuns0GjFuACo" },
  { id: 3, name: "Azure Mini Crossbody", seller: "Trendy Fashion Hub", sub: "Napa Leather • Azure Blue", price: "$1,250", quantity: 8, lowStock: false, category: 'crossbody', location: 'ikeja', colors: ["#4a90d9", "#357abd", "#2868a8"], src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWO3irJ8GaADXHeVY-yLkBtsMwf3aoWwrPn6wqNY6K3DQq5LRcnFU6uJLYrYogD3twAiyFOntXJo8lQB3TyvMSVyRVC83zW6fHePyMWWYMM7uMNr0NFSVsU5mMhmgLZLRetdBuW-wV7IZDu8YwfunNKPxxcKjQYjjrdIwnPqXIVJzFMkZQjSnuYmsGn-3_UCSVtFpy_q12OcXgiujP6FAg01qNspjZ-dZzUa6E-_Vu12dwOpIL1c7srZV9Y8-FziRBfEBc_BMZ3xk" },
  { id: 4, name: "Onyx Evening Clutch", seller: "Elite Accessories", sub: "Polished Suede • Onyx Black", price: "$3,100", quantity: 2, lowStock: true, category: 'evening', location: 'abuja', colors: ["#1a1a1a", "#333333", "#4d4d4d"], src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4l4XxqEhg8z3Flsf7ZlIUFWrALv7ps665xW56yrgFRslzAdD8YE8CoGD-eHc5CacM6ltr04XU04cFLCpo8kDWGQ_weuz7LJtzNEiwKXnDPmS1dFGrUin6u_w_KTD22tWJNcoIDmUEnnpE16CoUlghbfJ2e8VbxUV9NMUovHe1m0JdZmWvgSoLg7m8tCVCrIoUA2AMfdq2nGHljOnIjvN70QLD3Fj3DB2ZrxBERaq5OsNIfnX3c1t8u90vZG9fObqWGRCJkS7Lu1E" },
  { id: 5, name: "Crimson Structured Bag", seller: "Premium Leather Co.", sub: "Premium Leather • Red", price: "$3,200", quantity: 6, lowStock: false, category: 'clutch', location: 'lagos-island', colors: ["#c0392b", "#e74c3c", "#922b21"], src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzVp1X2BUmdMSacdYElQUo1EI0AX_HNnADAw0PqFaM21IZLnoz6FHGphS31RK7sGzuTWcAkDVJK3MffDwMu8j08stgkWwTOSMv3b22bG7UdLKwQkzxfBWXdCbaYcDRjP2fiM9QzE9eq4RxVtFRxag3qQJ2IGsQveOf1NFHld9r4KFty1XXBbtDWXmK0y3PRdfG7CU6avgFtgyBtBegIo7AgdFiUMuXSmQvxDuP-jxNqqjbzKXoD16k_L5VQOm2xKo5TPfiEegqZd8" },
];

const LogoIcon = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 48 48">
    <path clipRule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="currentColor" fillRule="evenodd" />
  </svg>
);

const Icon = ({ name, size = 22 }) => (
  <span style={{ fontFamily: "'Material Symbols Outlined'", fontWeight: "normal", fontStyle: "normal", fontSize: size, lineHeight: 1, display: "inline-block", textTransform: "none", letterSpacing: "normal", wordWrap: "normal", whiteSpace: "nowrap", direction: "ltr" }}>{name}</span>
);

// ─── Location Picker Modal ────────────────────────────────────────────────────
function LocationModal({ isOpen, onClose, selectedLocation, onSelect }) {
  const [search, setSearch] = useState('');
  const [hoveredId, setHoveredId] = useState(null);

  const filtered = NIGERIAN_LOCATIONS.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.state.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, loc) => {
    const key = loc.state || 'All';
    if (!acc[key]) acc[key] = [];
    acc[key].push(loc);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease both' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 201, width: 'min(480px, 92vw)', maxHeight: '75vh',
        background: 'white', borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.08)',
        display: 'flex', flexDirection: 'column',
        animation: 'modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 3 }}>📍 Choose Location</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Shop from sellers near you</p>
            </div>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.transform = 'rotate(0deg)'; }}>✕</button>
          </div>
          {/* Search within modal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '10px 14px' }}>
            <svg style={{ width: 16, height: 16, color: '#94a3b8', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search city or state…" autoFocus
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', fontWeight: 500, outline: 'none' }} />
            {search && <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#94a3b8' }}>✕</button>}
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px 20px' }}>
          {Object.entries(grouped).map(([state, locs]) => (
            <div key={state} style={{ marginBottom: 8 }}>
              {state !== 'All' && (
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#cbd5e1', padding: '8px 8px 4px' }}>{state}</p>
              )}
              {locs.map((loc, i) => {
                const isSelected = selectedLocation.id === loc.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => { onSelect(loc); onClose(); }}
                    onMouseEnter={() => setHoveredId(loc.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 12px', borderRadius: 12, border: 'none',
                      background: isSelected ? '#eff6ff' : hoveredId === loc.id ? '#f8fafc' : 'transparent',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.18s ease',
                      transform: hoveredId === loc.id && !isSelected ? 'translateX(4px)' : 'none',
                      animation: `locSlideIn 0.3s ease ${i * 35}ms both`,
                    }}
                  >
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{loc.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: isSelected ? 800 : 600, color: isSelected ? '#2563eb' : '#0f172a' }}>{loc.name}</div>
                      {loc.state && <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{loc.state} State</div>}
                    </div>
                    {isSelected && (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes modalIn { from{opacity:0;transform:translate(-50%,-50%) scale(0.88)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes locSlideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
      `}</style>
    </>
  );
}

// ─── Animated Category Pill ───────────────────────────────────────────────────
function CategoryPill({ cat, isActive, onClick, index, productCount }) {
  const [hovered, setHovered] = useState(false);
  const visible = true;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 18px', borderRadius: 100, border: 'none',
        cursor: 'pointer', whiteSpace: 'nowrap', position: 'relative', overflow: 'hidden',
        background: isActive ? cat.color : hovered ? cat.bg : 'white',
        boxShadow: isActive
          ? `0 6px 20px ${cat.color}55, 0 2px 8px ${cat.color}33`
          : hovered ? `0 4px 16px ${cat.color}22` : '0 1px 4px rgba(0,0,0,0.06)',
        border: isActive ? `1.5px solid ${cat.color}` : `1.5px solid ${hovered ? cat.border : '#e9ecef'}`,
        transform: isActive ? 'translateY(-2px) scale(1.03)' : hovered ? 'translateY(-1px)' : 'none',
        transition: 'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        animation: `catSlideIn 0.45s cubic-bezier(0.22,1,0.36,1) ${index * 55}ms both`,
        flexShrink: 0,
      }}
    >
      {/* Active shimmer sweep */}
      {isActive && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)',
          animation: 'catShimmer 2.2s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      <span style={{
        fontSize: 17,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        transform: (isActive || hovered) ? 'scale(1.22) rotate(-5deg)' : 'scale(1)',
        display: 'inline-block',
        filter: isActive ? 'brightness(1.2)' : 'none',
      }}>{cat.icon}</span>

      <span style={{
        fontSize: 13, fontWeight: isActive ? 800 : 600,
        color: isActive ? 'white' : hovered ? cat.color : '#374151',
        transition: 'color 0.2s',
        letterSpacing: '-0.01em',
      }}>{cat.label}</span>

      {/* Count badge */}
      {productCount > 0 && (
        <span style={{
          fontSize: 10, fontWeight: 800,
          background: isActive ? 'rgba(255,255,255,0.25)' : cat.bg,
          color: isActive ? 'white' : cat.color,
          border: `1px solid ${isActive ? 'rgba(255,255,255,0.3)' : cat.border}`,
          padding: '1px 7px', borderRadius: 20, minWidth: 22, textAlign: 'center',
          transition: 'all 0.25s',
        }}>{productCount}</span>
      )}
    </button>
  );
}

/* ── Scroll-reveal hook ── */
function useScrollReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── Product Card ── */
function ProductCard({ product, index, navigate }) {
  const [cardRef, cardVisible] = useScrollReveal(0.08);
  const [hovered, setHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const delay = (index % 4) * 80;
  const loc = NIGERIAN_LOCATIONS.find(l => l.id === product.location);

  return (
    <div
      ref={cardRef}
      onClick={() => navigate(`/products/${product.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white", borderRadius: 18, overflow: "hidden",
        border: "1px solid #f0f0f0", cursor: "pointer", position: "relative",
        opacity: cardVisible ? 1 : 0,
        transform: cardVisible ? "translateY(0) scale(1)" : "translateY(32px) scale(0.97)",
        transition: `opacity 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms, box-shadow 0.3s ease`,
        boxShadow: hovered ? "0 20px 50px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)" : "0 2px 12px rgba(0,0,0,0.05)",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", overflow: "hidden", aspectRatio: "4/3", background: "#f4f4f4" }}>
        <img src={product.src} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)", transform: hovered ? "scale(1.07)" : "scale(1)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)", opacity: hovered ? 1 : 0, transition: "opacity 0.4s ease", pointerEvents: "none" }} />

        {product.lowStock && (
          <span style={{ position: "absolute", top: 12, left: 12, background: "#ef4444", color: "white", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 20, boxShadow: "0 2px 8px rgba(239,68,68,0.4)", animation: "pulseBadge 2s ease-in-out infinite" }}>
            Low Stock
          </span>
        )}

        {/* Location badge */}
        {loc && (
          <span style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", color: "#374151", fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {loc.emoji} {loc.name}
          </span>
        )}

        <div style={{ position: "absolute", bottom: 10, left: "50%", transform: hovered ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(12px)", opacity: hovered ? 1 : 0, transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", color: "white", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", padding: "5px 16px", borderRadius: 20, whiteSpace: "nowrap", pointerEvents: "none" }}>
          Quick View
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 16px 14px" }}>
        <h3 style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", marginBottom: 2, lineHeight: 1.3 }}>{product.name}</h3>
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14, fontWeight: 500 }}>{product.seller}</p>

        <p style={{ fontSize: 11, color: "#cbd5e1", marginBottom: 6, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Colors</p>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {product.colors.map((color, i) => (
            <span key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: color, border: "2px solid white", outline: "1px solid #e2e8f0", display: "inline-block", transition: "transform 0.2s ease", transform: hovered ? "scale(1.15)" : "scale(1)", transitionDelay: `${i * 30}ms` }} />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 10, color: "#cbd5e1", marginBottom: 2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Stock</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>{product.quantity} units</p>
          </div>
          <p style={{ fontSize: 22, fontWeight: 900, color: hovered ? "#1d4ed8" : "#2563eb", letterSpacing: "-0.03em", transition: "color 0.2s" }}>{product.price}</p>
        </div>

        <a
          href={`https://wa.me/2348147061837?text=Hi%2C%20I'm%20interested%20in%20the%20${encodeURIComponent(product.name)}`}
          target="_blank" rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "11px 0", background: btnHovered ? "#16a34a" : "#22c55e", color: "white", fontWeight: 700, fontSize: 13, borderRadius: 10, textDecoration: "none", transition: "background 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease", transform: btnHovered ? "translateY(-1px)" : "translateY(0)", boxShadow: btnHovered ? "0 6px 20px rgba(34,197,94,0.4)" : "0 2px 8px rgba(34,197,94,0.2)" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Contact Seller
        </a>
        <p style={{ textAlign: "center", fontSize: 10, color: "#cbd5e1", marginTop: 6, fontWeight: 500 }}>via WhatsApp</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Product() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [pageLoading, setPageLoading] = useState(true);
  const handleLoaderDone = useCallback(() => setPageLoading(false), []);
  const fileInputRef = useRef(null);

  const [allProducts, setAllProducts] = useState(mockProducts);
  const [displayedProducts, setDisplayedProducts] = useState(mockProducts);
  const [realProducts, setRealProducts] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [resultsKey, setResultsKey] = useState(0);

  // ── NEW: Category & Location state ──
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState(NIGERIAN_LOCATIONS[0]);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [catVisible, setCatVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setHeaderVisible(true), 60);
    setTimeout(() => setHeroVisible(true), 180);
    setTimeout(() => setSearchVisible(true), 340);
    setTimeout(() => setCatVisible(true), 480);
  }, []);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const formatted = data.map(p => ({
          id: p.id, name: p.name, seller: p.seller_name || 'Anonymous Seller',
          sub: `${p.brand} • ${p.condition}`, price: `$${p.price}`,
          quantity: 1, lowStock: false, category: p.category || 'all',
          location: p.location || 'all', colors: [],
          src: p.images?.length > 0 ? p.images[0] : 'https://via.placeholder.com/400'
        }));
        setRealProducts(formatted);
        const combined = [...formatted, ...mockProducts];
        setAllProducts(combined);
        setDisplayedProducts(combined);
      }
    } catch (err) { console.error('Error fetching products:', err); }
  };

  // ── Apply all active filters ──
  const applyFilters = useCallback((query, category, location, products) => {
    let result = [...products];
    if (query.trim()) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.sub || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.seller || '').toLowerCase().includes(query.toLowerCase())
      );
    }
    if (category !== 'all') {
      result = result.filter(p => p.category === category);
    }
    if (location.id !== 'all') {
      result = result.filter(p => p.location === location.id);
    }
    return result;
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const results = applyFilters(query, activeCategory, selectedLocation, allProducts);
    setDisplayedProducts(results);
    setIsFiltered(!!query.trim() || activeCategory !== 'all' || selectedLocation.id !== 'all');
    setResultsKey(k => k + 1);
  };

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    const results = applyFilters(searchQuery, catId, selectedLocation, allProducts);
    setDisplayedProducts(results);
    setIsFiltered(!!searchQuery.trim() || catId !== 'all' || selectedLocation.id !== 'all');
    setResultsKey(k => k + 1);
  };

  const handleLocationChange = (loc) => {
    setSelectedLocation(loc);
    const results = applyFilters(searchQuery, activeCategory, loc, allProducts);
    setDisplayedProducts(results);
    setIsFiltered(!!searchQuery.trim() || activeCategory !== 'all' || loc.id !== 'all');
    setResultsKey(k => k + 1);
  };

  const handleClearSearch = () => {
    setDisplayedProducts(allProducts);
    setIsFiltered(false);
    setSearchQuery('');
    setUploadedImage(null);
    setActiveCategory('all');
    setSelectedLocation(NIGERIAN_LOCATIONS[0]);
    setResultsKey(k => k + 1);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedImage(URL.createObjectURL(file));
    setIsFiltered(true);
    setDisplayedProducts(allProducts);
    setResultsKey(k => k + 1);
    e.target.value = '';
  };

  const handleProfileClick = () => navigate(user?.user_metadata?.role === 'seller' ? '/seller-profile' : '/profile');
  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };

  // compute counts per category
  const getCategoryCount = (catId) => {
    if (catId === 'all') return allProducts.length;
    return allProducts.filter(p => p.category === catId).length;
  };

  const categoriesWithCounts = CATEGORIES.map(c => ({ ...c, count: getCategoryCount(c.id) }));

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Manrope', sans-serif" }}>
      <PageLoader onDone={handleLoaderDone} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes slideDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
        @keyframes pulseBadge { 0%,100%{box-shadow:0 2px 8px rgba(239,68,68,0.4)} 50%{box-shadow:0 2px 18px rgba(239,68,68,0.7)} }
        @keyframes bounceIn { 0%{opacity:0;transform:scale(0.7) translateY(20px)} 60%{opacity:1;transform:scale(1.06) translateY(-4px)} 100%{transform:scale(1) translateY(0)} }
        @keyframes slideInPreview { from{opacity:0;transform:translateY(-10px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes shimmerBar { 0%{background-position:200% center} 100%{background-position:-200% center} }

        /* ── Category animations ── */
        @keyframes catSlideIn { from{opacity:0;transform:translateY(14px) scale(0.9)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes catShimmer { 0%{transform:translateX(-120%)} 100%{transform:translateX(320%)} }
        @keyframes catTrackScroll { 0%{transform:translateX(0)} 50%{transform:translateX(-40px)} 100%{transform:translateX(0)} }

        /* ── Location pulse ── */
        @keyframes locPing { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.2);opacity:0} }

        /* Scrollbar for cat track */
        .cat-track::-webkit-scrollbar { height: 0; }
        .cat-track { -ms-overflow-style: none; scrollbar-width: none; }

        .nav-btn-anim { position: relative; }
        .nav-btn-anim::after { content:''; position:absolute; bottom:0; left:50%; width:0; height:2px; background:#2563eb; transition:width 0.25s ease,left 0.25s ease; border-radius:2px; }
        .nav-btn-anim:hover::after { width:100%; left:0; }

        @media (max-width: 768px) {
          .desktop-actions { display: none !important; }
          .mobile-hamburger { display: flex !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.94)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid #e9ecef",
        opacity: headerVisible ? 1 : 0,
        transform: headerVisible ? "translateY(0)" : "translateY(-100%)",
        transition: "opacity 0.45s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1)",
        boxShadow: "0 1px 24px rgba(0,0,0,0.05)",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, gap: 16 }}>
          <button className="mobile-hamburger" onClick={() => setIsSidebarOpen(true)} style={{ display: "none", padding: 8, borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", color: "#374151" }}>
            <svg style={{ width: 22, height: 22 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#2563eb", cursor: "pointer", flexShrink: 0 }} onClick={() => navigate('/')}>
            <LogoIcon />
            <span style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px" }}>Bag.NG</span>
          </div>

          {/* ── Location Picker Button (center of header) ── */}
          <button
            onClick={() => setLocationModalOpen(true)}
            style={{
              flex: 1, maxWidth: 280, display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 12,
              border: '1.5px solid #e2e8f0', background: '#f8fafc',
              cursor: 'pointer', transition: 'all 0.25s ease', position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.background = '#eff6ff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
          >
            {/* Live ping dot */}
            <div style={{ position: 'relative', flexShrink: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: '#2563eb', opacity: 0.3, animation: 'locPing 1.8s ease-out infinite' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', position: 'relative', zIndex: 1 }} />
            </div>
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8', lineHeight: 1.2 }}>Shopping from</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedLocation.emoji} {selectedLocation.name}
              </div>
            </div>
            <svg style={{ width: 14, height: 14, color: '#94a3b8', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <div className="desktop-actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {[{ icon: "person", label: "Profile", action: handleProfileClick }, { icon: "shopping_cart", label: "Cart", action: () => {} }].map(({ icon, label, action }) => (
              <button key={icon} className="nav-btn-anim" onClick={action} title={label}
                style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", color: "#374151", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.transform = "none"; }}>
                <Icon name={icon} size={20} />
              </button>
            ))}
            <button onClick={handleLogout}
              style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer", color: "#dc2626", fontSize: 13, fontWeight: 700, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.transform = "none"; }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── SIDEBAR OVERLAY ── */}
      <div onClick={() => setIsSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 60, opacity: isSidebarOpen ? 1 : 0, pointerEvents: isSidebarOpen ? "all" : "none", transition: "opacity 0.3s ease" }} />
      <aside style={{ position: "fixed", top: 0, left: 0, height: "100%", width: 260, background: "white", zIndex: 70, transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)", boxShadow: "6px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", padding: "24px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#2563eb" }}><LogoIcon /><span style={{ fontWeight: 900, fontSize: 17, color: "#0f172a" }}>Bag.NG</span></div>
          <button onClick={() => setIsSidebarOpen(false)} style={{ padding: 8, borderRadius: 9, border: "none", background: "#f3f4f6", cursor: "pointer" }}>
            <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#374151"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <button onClick={() => { setLocationModalOpen(true); setIsSidebarOpen(false); }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: '1.5px solid #bfdbfe', background: '#eff6ff', cursor: 'pointer', marginBottom: 16, width: '100%', textAlign: 'left' }}>
          <span style={{ fontSize: 18 }}>{selectedLocation.emoji}</span>
          <div><div style={{ fontSize: 11, color: '#2563eb', fontWeight: 700 }}>Location</div><div style={{ fontSize: 13, color: '#0f172a', fontWeight: 800 }}>{selectedLocation.name}</div></div>
        </button>
        {[{ icon: "person", label: "Profile", action: () => { handleProfileClick(); setIsSidebarOpen(false); } }, { icon: "shopping_cart", label: "Cart", action: () => setIsSidebarOpen(false) }].map(({ icon, label, action }) => (
          <button key={label} onClick={action} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", color: "#0f172a", fontSize: 15, fontWeight: 600, marginBottom: 4, textAlign: "left", transition: "all 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.transform = "translateX(4px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "none"; }}>
            <Icon name={icon} size={20} />{label}
          </button>
        ))}
        <div style={{ height: 1, background: "#f1f5f9", margin: "16px 0" }} />
        <button onClick={() => { handleLogout(); setIsSidebarOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", color: "#dc2626", fontSize: 15, fontWeight: 600, textAlign: "left" }}>
          <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
          Logout
        </button>
      </aside>

      {/* ── LOCATION MODAL ── */}
      <LocationModal isOpen={locationModalOpen} onClose={() => setLocationModalOpen(false)} selectedLocation={selectedLocation} onSelect={handleLocationChange} />

      {/* ── MAIN ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 20px 80px", opacity: pageLoading ? 0 : 1, transition: 'opacity 0.5s ease' }}>

        {/* Hero text */}
        <div style={{ marginBottom: 28, opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1)" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1.1 }}>Find Your Perfect Bag</h1>
            {selectedLocation.id !== 'all' && (
              <span style={{ fontSize: 13, fontWeight: 700, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap', animation: 'scaleIn 0.3s ease both' }}>
                {selectedLocation.emoji} {selectedLocation.name}
              </span>
            )}
          </div>
          <p style={{ color: "#64748b", fontSize: 15, fontWeight: 500 }}>Search by text or upload an image to find similar bags</p>
        </div>

        {/* Search bar */}
        <div style={{ marginBottom: 24, opacity: searchVisible ? 1 : 0, transform: searchVisible ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)" }}>
          <div style={{ display: "flex", alignItems: "center", background: "white", border: `1.5px solid ${searchFocused ? "#2563eb" : "#e2e8f0"}`, borderRadius: 16, padding: "12px 16px", gap: 10, boxShadow: searchFocused ? "0 0 0 4px rgba(37,99,235,0.1), 0 4px 20px rgba(0,0,0,0.06)" : "0 2px 12px rgba(0,0,0,0.05)", transition: "border-color 0.25s ease, box-shadow 0.3s ease" }}>
            <svg style={{ width: 20, height: 20, color: searchFocused ? "#2563eb" : "#94a3b8", flexShrink: 0, transition: "color 0.25s" }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
            </svg>
            <input type="text" placeholder="Search bags by name, material, or seller…" value={searchQuery} onChange={e => handleSearch(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#0f172a", fontFamily: "inherit", fontWeight: 500 }} />
            {isFiltered && (
              <button onClick={handleClearSearch} style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#64748b", flexShrink: 0, transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.transform = "scale(1.1) rotate(90deg)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.transform = "none"; }}>✕</button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
            <button onClick={() => fileInputRef.current.click()} title="Upload image to search"
              style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: "#2563eb", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(37,99,235,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
              <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </button>
          </div>

          {uploadedImage && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, animation: "slideInPreview 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
              <img src={uploadedImage} alt="Uploaded" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: "1.5px solid #93c5fd" }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1e40af", marginBottom: 2 }}>Image uploaded</p>
                <p style={{ fontSize: 11, color: "#3b82f6" }}>Showing visually similar bags</p>
              </div>
              <button onClick={handleClearSearch} style={{ fontSize: 12, color: "#3b82f6", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Remove</button>
            </div>
          )}
        </div>

        {/* ── ANIMATED CATEGORY STRIP ── */}
        <div style={{
          marginBottom: 28,
          opacity: catVisible ? 1 : 0,
          transform: catVisible ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)',
        }}>
          {/* Section label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 20, height: 2.5, background: 'linear-gradient(90deg, #2563eb, #7c3aed)', borderRadius: 2 }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#94a3b8' }}>Browse by Category</span>
          </div>

          {/* Scrollable pill track */}
          <div className="cat-track" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, paddingTop: 4, paddingLeft: 2, paddingRight: 2 }}>
            {categoriesWithCounts.map((cat, i) => (
              <CategoryPill
                key={cat.id}
                cat={cat}
                isActive={activeCategory === cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                index={i}
                productCount={cat.count}
              />
            ))}
          </div>

          {/* Active category indicator bar */}
          <div style={{ marginTop: 12, height: 2, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
            {(() => {
              const idx = CATEGORIES.findIndex(c => c.id === activeCategory);
              const cat = CATEGORIES[idx];
              return (
                <div style={{
                  position: 'absolute', left: `${(idx / CATEGORIES.length) * 100}%`,
                  width: `${100 / CATEGORIES.length}%`,
                  height: '100%', background: cat?.color || '#2563eb',
                  borderRadius: 2,
                  transition: 'left 0.4s cubic-bezier(0.34,1.56,0.64,1), background 0.35s ease',
                  boxShadow: `0 0 8px ${cat?.color || '#2563eb'}88`,
                }} />
              );
            })()}
          </div>
        </div>

        {/* Results bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: 'wrap', gap: 10, opacity: searchVisible ? 1 : 0, transition: "opacity 0.5s ease 0.1s" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 2, letterSpacing: "-0.02em" }}>
              {isFiltered ? (activeCategory !== 'all' ? CATEGORIES.find(c => c.id === activeCategory)?.label : 'Search Results') : 'All Bags'}
            </h2>
            <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
              {displayedProducts.length} {displayedProducts.length === 1 ? 'item' : 'items'} found
              {selectedLocation.id !== 'all' && ` in ${selectedLocation.name}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {activeCategory !== 'all' && (() => {
              const cat = CATEGORIES.find(c => c.id === activeCategory);
              return (
                <button onClick={() => handleCategoryChange('all')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: cat.bg, color: cat.color, border: `1px solid ${cat.border}`, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {cat.icon} {cat.label} <span style={{ opacity: 0.6 }}>✕</span>
                </button>
              );
            })()}
            {selectedLocation.id !== 'all' && (
              <button onClick={() => handleLocationChange(NIGERIAN_LOCATIONS[0])} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                {selectedLocation.emoji} {selectedLocation.name} <span style={{ opacity: 0.6 }}>✕</span>
              </button>
            )}
            {isFiltered && (
              <button onClick={handleClearSearch} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {displayedProducts.length > 0 ? (
          <div key={resultsKey} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {displayedProducts.map((product, index) => (
              <ProductCard key={`${product.id}-${resultsKey}`} product={product} index={index} navigate={navigate} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 20px", animation: "bounceIn 0.6s cubic-bezier(0.22,1,0.36,1) both" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>
              {activeCategory !== 'all' ? CATEGORIES.find(c => c.id === activeCategory)?.icon : selectedLocation.id !== 'all' ? selectedLocation.emoji : '🔍'}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>No bags found</h3>
            <p style={{ color: "#64748b", marginBottom: 24, fontSize: 14 }}>
              {selectedLocation.id !== 'all' ? `No ${activeCategory !== 'all' ? CATEGORIES.find(c => c.id === activeCategory)?.label.toLowerCase() : 'bags'} in ${selectedLocation.name} yet.` : 'Try adjusting your search or browse all bags'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleClearSearch} style={{ padding: "11px 24px", background: "#2563eb", color: "white", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "all 0.25s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "none"; }}>
                View All Bags
              </button>
              {selectedLocation.id !== 'all' && (
                <button onClick={() => setLocationModalOpen(true)} style={{ padding: "11px 24px", background: "white", color: "#2563eb", borderRadius: 12, border: "1.5px solid #bfdbfe", cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "all 0.25s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  📍 Change Location
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}