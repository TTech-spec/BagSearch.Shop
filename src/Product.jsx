import { useState, useRef, useContext, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { supabase } from './services/api';
import { visualSearch } from './services/visualSearch';
import { buildWhatsAppUrl, normalizeWhatsAppNumber } from './utils/whatsapp';
import LogoIcon from './components/Logo.jsx';
import UnderDevelopmentBanner from './UnderDevelopmentBanner';
import shoppingBagImg from './images/shopping-bag.png';

const BAG_COLOR_MAP = {
  black:'#1A1A1A',white:'#F5F5F0',beige:'#D4B896',camel:'#C19A6B',tan:'#A67C52',
  brown:'#6B3F2A',burgundy:'#722F37',red:'#CC2200',pink:'#E8A0A0',blush:'#F2C4B8',
  orange:'#E8762B',yellow:'#E8C84A',olive:'#808000',green:'#2D6A3F',mint:'#98D8C8',
  teal:'#2A7A7A',navy:'#1A2E5A',blue:'#2255CC',cobalt:'#0047AB',purple:'#6A2D8F',
  lavender:'#B8A0D8',grey:'#888888',silver:'#C0C0C0',gold:'#CFB53B',
  multicolor: 'linear-gradient(135deg,#C94B2C,#E8856A,#F9DDD0,#2255CC,#2D6A3F)',
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
  whatsapp:     '#25d366',
  whatsappDark: '#128c7e',
  whatsappBg:   '#dcfce7',
};

// ─── DUMMY ADS DATA ───────────────────────────────────────────────────────────
const DUMMY_ADS = [
  {
    id: 'ad1',
    type: 'banner',
    sponsor: 'LuxLeather NG',
    headline: 'Premium Italian Leather Bags',
    sub: 'Up to 40% off this weekend only · Free delivery nationwide',
    cta: 'Shop Now',
    badge: 'Sponsored',
    emoji: '🛍️',
    accent: '#c84b11',
    bg: 'linear-gradient(135deg,#fdf4ee 0%,#fde8d8 100%)',
    border: '#f9c4a0',
    link: '#',
  },
  {
    id: 'ad2',
    type: 'inline',
    sponsor: 'Zuri Collection',
    headline: 'New Season Arrivals',
    sub: 'Ankara-inspired designs, globally crafted',
    cta: 'Explore',
    badge: 'Ad',
    emoji: '✨',
    accent: '#be185d',
    bg: '#fdf2f8',
    border: '#fbcfe8',
    link: '#',
  },
  {
    id: 'ad3',
    type: 'inline',
    sponsor: 'BagCare Pro',
    headline: 'Protect Your Investment',
    sub: 'Leather care kits, dust bags & storage boxes',
    cta: 'See Products',
    badge: 'Ad',
    emoji: '🧴',
    accent: '#0f6e56',
    bg: '#e1f5ee',
    border: '#9fe1cb',
    link: '#',
  },
  {
    id: 'ad4',
    type: 'sidebar',
    sponsor: 'FastShip NG',
    headline: 'Same-Day Delivery in Lagos',
    sub: 'Order before 2 PM — get it tonight',
    cta: 'Learn More',
    badge: 'Sponsored',
    emoji: '🚚',
    accent: '#1d4ed8',
    bg: '#eff6ff',
    border: '#bfdbfe',
    link: '#',
  },
];

// ─── AD BANNER (top-of-results, dismissible) ──────────────────────────────────
function AdBanner({ ad, onDismiss }) {
  const [hov, setHov] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        marginBottom: 20,
        background: ad.bg,
        border: `1.5px solid ${hov ? ad.accent : ad.border}`,
        borderRadius: 16,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.25s, box-shadow 0.25s',
        boxShadow: hov ? `0 8px 24px ${ad.accent}18` : 'none',
        animation: 'fadeIn 0.4s ease both',
      }}
    >
      <div style={{ width: 46, height: 46, borderRadius: 12, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, border: `1px solid ${ad.border}` }}>
        {ad.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: ad.accent, background: 'white', border: `1px solid ${ad.border}`, padding: '2px 7px', borderRadius: 20 }}>{ad.badge}</span>
          <span style={{ fontSize: 10, color: '#999', fontWeight: 500 }}>{ad.sponsor}</span>
        </div>
        <p style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.headline}</p>
        <p style={{ fontSize: 11, color: C.textMuted, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.sub}</p>
      </div>
      <a href={ad.link} onClick={e => e.preventDefault()} style={{ padding: '8px 16px', borderRadius: 10, background: ad.accent, color: 'white', fontSize: 12, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0, transition: 'opacity 0.2s', display: 'inline-block' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        {ad.cta}
      </a>
      <button onClick={() => { setDismissed(true); onDismiss && onDismiss(ad.id); }}
        style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#bbb', lineHeight: 1, padding: 3, borderRadius: '50%', transition: 'color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.color = C.text}
        onMouseLeave={e => e.currentTarget.style.color = '#bbb'}>
        ✕
      </button>
    </div>
  );
}

// ─── INLINE AD CARD (appears between product rows) ────────────────────────────
function InlineAdCard({ ad }) {
  const [hov, setHov] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        gridColumn: '1 / -1',
        background: ad.bg,
        border: `1.5px solid ${hov ? ad.accent : ad.border}`,
        borderRadius: 16,
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
        transition: 'all 0.25s',
        boxShadow: hov ? `0 8px 28px ${ad.accent}14` : 'none',
        animation: 'fadeIn 0.4s ease both',
        cursor: 'default',
      }}
    >
      <div style={{ width: 54, height: 54, borderRadius: 14, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, boxShadow: `0 4px 12px ${ad.accent}18`, border: `1px solid ${ad.border}` }}>
        {ad.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: ad.accent, background: 'white', border: `1px solid ${ad.border}`, padding: '2px 8px', borderRadius: 20 }}>{ad.badge}</span>
          <span style={{ fontSize: 11, color: '#aaa', fontWeight: 600 }}>{ad.sponsor}</span>
        </div>
        <h4 style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 3, letterSpacing: '-0.02em' }}>{ad.headline}</h4>
        <p style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>{ad.sub}</p>
      </div>
      <a href={ad.link} onClick={e => e.preventDefault()}
        style={{ padding: '10px 20px', borderRadius: 12, background: ad.accent, color: 'white', fontSize: 13, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0, transition: 'opacity 0.2s', letterSpacing: '-0.01em' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        {ad.cta} →
      </a>
      <button onClick={() => setDismissed(true)}
        style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#ccc', padding: 3, transition: 'color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#666'}
        onMouseLeave={e => e.currentTarget.style.color = '#ccc'}>
        ✕
      </button>
    </div>
  );
}

// ─── PRODUCT GRID WITH ADS INJECTED ──────────────────────────────────────────
function ProductGridWithAds({ products, navigate, onAddToCart, isAuthed, onRequireAuth, resultsKey }) {
  const inlineAds = DUMMY_ADS.filter(a => a.type === 'inline');
  const adInsertPositions = [8, 20]; // insert after row 2 (8 items) and row 5

  const nodes = [];
  let adIndex = 0;
  products.forEach((p, i) => {
    nodes.push(
      <ProductCard key={`${p.id}-${resultsKey}`} product={p} index={i} navigate={navigate} onAddToCart={onAddToCart} isAuthed={isAuthed} onRequireAuth={onRequireAuth} />
    );
    if (adInsertPositions.includes(i + 1) && adIndex < inlineAds.length) {
      nodes.push(<InlineAdCard key={`inline-ad-${adIndex}`} ad={inlineAds[adIndex]} />);
      adIndex++;
    }
  });

  return (
    <div key={resultsKey} className="product-grid">
      {nodes}
    </div>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function SiteFooter({ navigate, user, handleLogout }) {
  const year = new Date().getFullYear();
  const [hovLink, setHovLink] = useState(null);

  const col = (links) => links.map(({ label, href, action }) => (
    <li key={label}>
      <button
        onClick={() => { if (action) action(); else navigate(href || '/'); }}
        onMouseEnter={() => setHovLink(label)}
        onMouseLeave={() => setHovLink(null)}
        style={{ background: 'none', border: 'none', padding: '3px 0', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: hovLink === label ? C.primary : C.textMuted, transition: 'color 0.2s', textAlign: 'left', display: 'block' }}
      >{label}</button>
    </li>
  ));

  return (
    <footer style={{ background: '#1a0a00', color: 'rgba(255,255,255,0.75)', marginTop: 0 }}>
      {/* CTA strip */}
      <div style={{ background: `linear-gradient(135deg,#c84b11,#f97316)`, padding: '36px 20px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: 6 }}>
              Join BagSearch Today
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>
              Discover, save, and shop the best bags across Nigeria
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {!user && (
              <>
                <button onClick={() => navigate('/register')}
                  style={{ padding: '12px 26px', background: 'white', color: C.primary, borderRadius: 12, border: 'none', fontWeight: 900, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', letterSpacing: '-0.01em' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'; }}>
                  Create Free Account
                </button>
                <button onClick={() => navigate('/login')}
                  style={{ padding: '12px 26px', background: 'rgba(255,255,255,0.18)', color: 'white', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.5)', fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(8px)', letterSpacing: '-0.01em' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'none'; }}>
                  Sign In
                </button>
              </>
            )}
            {user && (
              <button onClick={() => navigate('/profile')}
                style={{ padding: '12px 26px', background: 'white', color: C.primary, borderRadius: 12, border: 'none', fontWeight: 900, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: C.primaryBg, border: `2px solid ${C.primaryBorder}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: C.primary }}>
                  {(user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
                My Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main footer body */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '52px 20px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '40px 32px' }}>
        {/* Brand col */}
        <div style={{ gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14, cursor: 'pointer' }}>
            <div style={{ color: C.primaryLight }}><LogoIcon size={32} /></div>
            <span style={{ fontWeight: 900, fontSize: 18, color: 'white', letterSpacing: '-0.03em' }}>Bag<span style={{ color: C.primaryLight }}>Search</span></span>
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.75, color: 'rgba(255,255,255,0.5)', fontWeight: 500, maxWidth: 210 }}>
            Nigeria's favourite marketplace for bags. Connect buyers with trusted sellers across the country.
          </p>
          <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
            {['📘', '📸', '🐦', '💬'].map((icon, i) => (
              <button key={i} style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.2)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Shop col */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>Shop</p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {col([
              { label: 'All Bags', href: '/products' },
              { label: 'Tote Bags', href: '/products' },
              { label: 'Clutches', href: '/products' },
              { label: 'Crossbody Bags', href: '/products' },
              { label: 'Backpacks', href: '/products' },
              { label: 'Evening Bags', href: '/products' },
            ])}
          </ul>
        </div>

        {/* Sellers col */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>Sellers</p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {col([
              { label: 'Start Selling', href: '/register' },
              { label: 'Seller Dashboard', href: '/seller-profile' },
              { label: 'Vendor Directory', href: '/products' },
              { label: 'Pricing & Fees', href: '/' },
              { label: 'Seller Guidelines', href: '/' },
            ])}
          </ul>
        </div>

        {/* Account col */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>Account</p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {user
              ? col([
                { label: 'My Profile', href: '/profile' },
                { label: 'My Orders', href: '/profile' },
                { label: 'Wishlist', href: '/profile' },
                { label: 'Settings', href: '/profile' },
                { label: 'Sign Out', action: handleLogout },
              ])
              : col([
                { label: 'Create Account', href: '/register' },
                { label: 'Sign In', href: '/login' },
                { label: 'Forgot Password', href: '/login' },
              ])
            }
          </ul>
          {/* Profile quick-card */}
          {user ? (
            <div style={{ marginTop: 18, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: 'white', flexShrink: 0 }}>
                {(user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.user_metadata?.full_name || 'My Account'}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => navigate('/register')}
                style={{ padding: '9px 14px', background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`, color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer', transition: 'opacity 0.2s', textAlign: 'center' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                👤 Create Account
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                🔑 Login
              </button>
            </div>
          )}
        </div>

        {/* Help col */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>Help</p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {col([
              { label: 'FAQ', href: '/' },
              { label: 'Contact Us', href: '/' },
              { label: 'Delivery Info', href: '/' },
              { label: 'Returns Policy', href: '/' },
              { label: 'Privacy Policy', href: '/' },
              { label: 'Terms of Service', href: '/' },
            ])}
          </ul>
          <div style={{ marginTop: 18, background: 'rgba(37,211,102,0.1)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(37,211,102,0.2)' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#4ade80', marginBottom: 3 }}>💬 WhatsApp Support</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Mon–Sat · 8AM – 8PM</p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '18px 20px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
            © {year} BagSearch Nigeria. All rights reserved.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>Made with 🧡 in Nigeria</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {['🌍 EN', '₦ NGN'].map(t => (
                <span key={t} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

const PageLoader = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  useEffect(() => {
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 6 + 3;
      if (p >= 100) {
        p = 100; clearInterval(iv); setProgress(100);
        setTimeout(() => setFadeOut(true), 250);
        setTimeout(() => onDone(), 700);
      } else setProgress(Math.min(p, 100));
    }, 28);
    return () => clearInterval(iv);
  }, [onDone]);
  return (
    <div style={{ position:'fixed',inset:0,zIndex:99999,background:C.surface,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:fadeOut?0:1,transition:'opacity 0.4s ease',pointerEvents:fadeOut?'none':'all' }}>
      <span style={{ fontSize:26,fontWeight:900,letterSpacing:'-0.03em',color:C.text,fontFamily:'system-ui,-apple-system,sans-serif',marginBottom:24 }}>
        Bag<span style={{ color:C.primary }}>Search</span>
      </span>
      <div style={{ width:180,height:2,background:C.borderLight,borderRadius:9999,overflow:'hidden' }}>
        <div style={{ height:'100%',width:`${progress}%`,background:C.primary,borderRadius:9999,transition:'width 0.06s ease' }} />
      </div>
    </div>
  );
};

function useWordCycle(phrases, intervalMs = 2400) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % phrases.length); setVisible(true); }, 320);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [phrases, intervalMs]);
  return { word: phrases[idx], visible };
}

const NIGERIAN_LOCATIONS = [
  {id:'all',name:'All Nigeria',emoji:'🇳🇬',state:''},{id:'lagos-island',name:'Lagos Island',emoji:'🏙️',state:'Lagos'},
  {id:'lagos-mainland',name:'Lagos Mainland',emoji:'🌆',state:'Lagos'},{id:'victoria-island',name:'Victoria Island',emoji:'💎',state:'Lagos'},
  {id:'lekki',name:'Lekki',emoji:'🌴',state:'Lagos'},{id:'ikeja',name:'Ikeja',emoji:'✈️',state:'Lagos'},
  {id:'abuja',name:'Abuja',emoji:'🏛️',state:'FCT'},{id:'wuse',name:'Wuse',emoji:'🏢',state:'FCT'},
  {id:'kano',name:'Kano',emoji:'🌅',state:'Kano'},{id:'ibadan',name:'Ibadan',emoji:'🌇',state:'Oyo'},
  {id:'port-harcourt',name:'Port Harcourt',emoji:'⚓',state:'Rivers'},{id:'enugu',name:'Enugu',emoji:'⛰️',state:'Enugu'},
  {id:'benin-city',name:'Benin City',emoji:'👑',state:'Edo'},{id:'calabar',name:'Calabar',emoji:'🌿',state:'Cross River'},
  {id:'warri',name:'Warri',emoji:'🛢️',state:'Delta'},{id:'aba',name:'Aba',emoji:'👜',state:'Abia'},
  {id:'onitsha',name:'Onitsha',emoji:'🛒',state:'Anambra'},
];

const CATEGORIES = [
  {id:'all',label:'All Bags',icon:'👜',color:C.primary,bg:C.primaryBg,border:C.primaryBorder},
  {id:'tote',label:'Tote Bags',icon:'🛍️',color:'#b45309',bg:'#fef3c7',border:'#fde68a'},
  {id:'clutch',label:'Clutches',icon:'💼',color:'#9a3412',bg:'#ffedd5',border:'#fed7aa'},
  {id:'crossbody',label:'Crossbody',icon:'👝',color:'#c2410c',bg:'#fff7ed',border:'#fed7aa'},
  {id:'backpack',label:'Backpacks',icon:'🎒',color:'#92400e',bg:'#fffbeb',border:'#fde68a'},
  {id:'satchel',label:'Satchels',icon:'🗂️',color:'#c84b11',bg:'#fde8d8',border:'#f9c4a0'},
  {id:'evening',label:'Evening',icon:'✨',color:'#be185d',bg:'#fdf2f8',border:'#fbcfe8'},
  {id:'mini',label:'Mini Bags',icon:'💛',color:'#a16207',bg:'#fefce8',border:'#fef08a'},
];

const CURRENCY_SYMBOL = '₦';
const FREE_DELIVERY_THRESHOLD = 2000;
const formatCurrency = (value, options = {}) => {
  const normalized = Number(value ?? 0);
  return `${CURRENCY_SYMBOL}${normalized.toLocaleString(undefined, { maximumFractionDigits: 0, ...options })}`;
};

const WaIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const Icon = ({name,size=22}) => <span style={{fontFamily:"'Material Symbols Outlined'",fontWeight:"normal",fontStyle:"normal",fontSize:size,lineHeight:1,display:"inline-block",textTransform:"none",letterSpacing:"normal",wordWrap:"normal",whiteSpace:"nowrap",direction:"ltr"}}>{name}</span>;

function FeedbackBox({ onClose }) {
  const [phase, setPhase] = useState(0);
  const [step, setStep] = useState('rate');
  const [rating, setRating] = useState(0);
  const [hovRating, setHovRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setTimeout(() => setPhase(1), 50);
    setTimeout(() => setPhase(2), 100);
  }, []);

  const handleClose = () => {
    setPhase(3);
    setTimeout(() => onClose(), 450);
  };

  const spawnParticles = () => {
    const emojis = ['🎉','✨','👜','🛍️','💛','🧡'];
    const p = Array.from({length: 12}, (_, i) => ({
      id: i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: 40 + Math.random() * 20,
      angle: (Math.random() - 0.5) * 160,
      dist: 60 + Math.random() * 80,
      delay: Math.random() * 200,
    }));
    setParticles(p);
    setTimeout(() => setParticles([]), 1200);
  };

  const handleRating = (r) => {
    setRating(r);
    setTimeout(() => setStep('comment'), 400);
  };

  const handleSubmit = () => {
    if (!comment.trim() && rating === 0) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setStep('thanks');
      spawnParticles();
    }, 900);
    setTimeout(() => handleClose(), 3200);
  };

  const ratingLabels = ['','Terrible 😤','Bad 😕','Okay 😐','Good 😊','Amazing! 🤩'];
  const ratingColors = ['','#dc2626','#ea580c','#d97706','#16a34a','#c84b11'];
  const visible = phase === 2;

  return (
    <div style={{ position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'0 0 24px',pointerEvents:'none' }}>
      <div onClick={handleClose} style={{ position:'absolute',inset:0,background:'rgba(26,10,0,0.45)',backdropFilter:'blur(6px)',WebkitBackdropFilter:'blur(6px)',opacity:visible?1:0,transition:'opacity 0.4s ease',pointerEvents:'all',cursor:'pointer' }} />
      <div style={{ position:'relative',zIndex:1,width:'min(480px,96vw)',background:'white',borderRadius:28,overflow:'hidden',boxShadow:'0 -4px 0 0 #c84b11, 0 32px 80px rgba(200,75,17,0.22)',pointerEvents:'all',opacity:visible?1:0,transform:visible?'translateY(0) scale(1)':'translateY(40px) scale(0.96)',transition:'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ height:4,background:'linear-gradient(90deg,#c84b11,#f97316,#ea580c,#c84b11)',backgroundSize:'200% 100%',animation:'shimFeedback 2.5s linear infinite' }} />
        {particles.map(p => (
          <div key={p.id} style={{ position:'absolute',top:'30%',left:`${p.x}%`,fontSize:20,zIndex:10,pointerEvents:'none',animation:`particleBurst 1s cubic-bezier(0.22,1,0.36,1) ${p.delay}ms both`,'--angle':`${p.angle}deg`,'--dist':`${p.dist}px` }}>{p.emoji}</div>
        ))}
        <button onClick={handleClose} style={{ position:'absolute',top:16,right:16,width:32,height:32,borderRadius:'50%',border:'none',background:C.primaryBg,color:C.primary,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,transition:'all 0.2s',zIndex:5 }}
          onMouseEnter={e=>{e.currentTarget.style.background=C.primary;e.currentTarget.style.color='white';}}
          onMouseLeave={e=>{e.currentTarget.style.background=C.primaryBg;e.currentTarget.style.color=C.primary;}}>✕</button>
        <div style={{ padding:'28px 28px 32px' }}>
          {step === 'rate' && (
            <div style={{ animation:'feedStep 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
              <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:20 }}>
                <div style={{ width:48,height:48,borderRadius:16,background:'linear-gradient(135deg,#c84b11,#f97316)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,boxShadow:'0 6px 18px rgba(200,75,17,0.35)' }}>💬</div>
                <div>
                  <h3 style={{ fontSize:20,fontWeight:900,color:C.text,letterSpacing:'-0.03em',margin:0,marginBottom:2 }}>Share Your Thoughts</h3>
                  <p style={{ fontSize:13,color:C.textMuted,fontWeight:500,margin:0 }}>How's your BagSearch experience?</p>
                </div>
              </div>
              <div style={{ display:'flex',justifyContent:'center',gap:8,marginBottom:14,padding:'8px 0' }}>
                {[1,2,3,4,5].map(star => (
                  <button key={star} onMouseEnter={() => setHovRating(star)} onMouseLeave={() => setHovRating(0)} onClick={() => handleRating(star)}
                    style={{ background:'none',border:'none',cursor:'pointer',padding:4,transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',transform:(hovRating||rating)>=star?'scale(1.35) rotate(-8deg)':'scale(1)' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill={(hovRating||rating)>=star?'#f97316':'#f0d9cc'} style={{ transition:'fill 0.15s,filter 0.15s',filter:(hovRating||rating)>=star?'drop-shadow(0 2px 6px rgba(249,115,22,0.5))':'none' }}>
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                    </svg>
                  </button>
                ))}
              </div>
              <div style={{ textAlign:'center',height:20,marginBottom:16 }}>
                <span style={{ fontSize:14,fontWeight:800,color:ratingColors[hovRating||rating]||C.textFaint,transition:'all 0.2s',opacity:(hovRating||rating)?1:0.4 }}>
                  {ratingLabels[hovRating||rating]||'Tap a star to rate'}
                </span>
              </div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center' }}>
                {['🛍️ Great selection','🚀 Fast loading','💎 Good quality','📱 Easy to use','💸 Fair prices'].map(chip => (
                  <button key={chip} onClick={() => { setComment(chip.replace(/^[^\s]+\s/,'')); setStep('comment'); }}
                    style={{ fontSize:12,fontWeight:700,padding:'7px 14px',borderRadius:20,border:`1.5px solid ${C.primaryBorder}`,background:C.primaryBg,color:C.primary,cursor:'pointer',transition:'all 0.2s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background=C.primary;e.currentTarget.style.color='white';e.currentTarget.style.transform='translateY(-2px)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background=C.primaryBg;e.currentTarget.style.color=C.primary;e.currentTarget.style.transform='none';}}>
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 'comment' && (
            <div style={{ animation:'feedStep 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:18 }}>
                <button onClick={() => setStep('rate')} style={{ width:32,height:32,borderRadius:10,border:'none',background:C.primaryBg,color:C.primary,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>←</button>
                <div>
                  <h3 style={{ fontSize:18,fontWeight:900,color:C.text,letterSpacing:'-0.02em',margin:0,marginBottom:1 }}>Tell us more</h3>
                  <div style={{ display:'flex',gap:3 }}>
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s<=rating?'#f97316':'#f0d9cc'}><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ position:'relative',marginBottom:16 }}>
                <textarea autoFocus value={comment} onChange={e => setComment(e.target.value)} placeholder="What did you love? What could be better?"
                  style={{ width:'100%',minHeight:110,padding:'14px 16px',borderRadius:16,border:`1.5px solid ${C.border}`,background:C.surfaceDim,fontSize:14,fontFamily:'inherit',fontWeight:500,color:C.text,resize:'none',outline:'none',transition:'border-color 0.2s,box-shadow 0.2s',lineHeight:1.6,boxSizing:'border-box' }}
                  onFocus={e=>{e.target.style.borderColor=C.primary;e.target.style.boxShadow=`0 0 0 3px rgba(200,75,17,0.12)`;}}
                  onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
                <div style={{ position:'absolute',bottom:10,right:12,fontSize:11,color:C.textFaint,fontWeight:600 }}>{comment.length}/300</div>
              </div>
              <button onClick={handleSubmit} disabled={submitting} style={{ width:'100%',padding:'14px 0',borderRadius:14,border:'none',background:submitting?C.primaryBg:'linear-gradient(135deg,#c84b11,#f97316)',color:submitting?C.primary:'white',fontWeight:900,fontSize:15,cursor:submitting?'default':'pointer',transition:'all 0.35s',boxShadow:submitting?'none':'0 6px 20px rgba(200,75,17,0.38)',display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
                {submitting
                  ? <><div style={{ width:18,height:18,borderRadius:'50%',border:'2.5px solid rgba(200,75,17,0.3)',borderTopColor:C.primary,animation:'ldSpin 0.7s linear infinite' }} />Sending…</>
                  : <>Send Feedback ✨</>}
              </button>
            </div>
          )}
          {step === 'thanks' && (
            <div style={{ textAlign:'center',padding:'12px 0',animation:'feedStep 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
              <div style={{ width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,#c84b11,#f97316)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',fontSize:32,boxShadow:'0 8px 28px rgba(200,75,17,0.4)',animation:'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>🎉</div>
              <h3 style={{ fontSize:22,fontWeight:900,color:C.text,letterSpacing:'-0.03em',marginBottom:8 }}>Thank you!</h3>
              <p style={{ fontSize:14,color:C.textMuted,fontWeight:500,lineHeight:1.6,maxWidth:280,margin:'0 auto' }}>Your feedback helps us build a better BagSearch 🧡</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeedbackTrigger({ onClick }) {
  const [hov, setHov] = useState(false);
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const t = setInterval(() => { setPulse(true); setTimeout(() => setPulse(false), 1000); }, 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position:'fixed',bottom:24,right:20,zIndex:800,display:'flex',alignItems:'center',gap:hov?10:0,height:50,paddingLeft:hov?18:14,paddingRight:hov?20:14,borderRadius:25,border:'none',background:'linear-gradient(135deg,#c84b11,#f97316)',color:'white',cursor:'pointer',boxShadow:`0 8px 28px rgba(200,75,17,${hov?0.55:0.38})`,transition:'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',transform:hov?'translateY(-3px) scale(1.04)':'translateY(0) scale(1)',overflow:'hidden',whiteSpace:'nowrap' }}>
      {pulse && <div style={{ position:'absolute',inset:-4,borderRadius:30,border:'2px solid rgba(249,115,22,0.6)',animation:'triggerPulse 1s ease-out both',pointerEvents:'none' }} />}
      <span style={{ fontSize:20,display:'block',transition:'transform 0.3s',transform:hov?'rotate(-10deg) scale(1.2)':'none' }}>💬</span>
      <span style={{ fontSize:13,fontWeight:800,maxWidth:hov?120:0,overflow:'hidden',transition:'max-width 0.35s cubic-bezier(0.22,1,0.36,1)',letterSpacing:'0.01em' }}>Feedback</span>
    </button>
  );
}

function MobileAuthPrompt({ open, onClose, navigate }) {
  const [phase, setPhase] = useState(0);
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    if (open) { 
      setPhase(1); 
      setTimeout(() => setPhase(2), 50);
      // Spawn floating particles
      const emojis = ['👜', '🛍️', '✨', '💎', '🌟'];
      const p = Array.from({length: 8}, (_, i) => ({
        id: i,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: 10 + Math.random() * 80,
        y: 60 + Math.random() * 30,
        size: 16 + Math.random() * 12,
        delay: Math.random() * 800,
        duration: 3000 + Math.random() * 2000,
      }));
      setParticles(p);
      setTimeout(() => setParticles([]), 6000);
    } else { 
      setPhase(3); 
      setTimeout(() => setPhase(0), 400); 
    }
  }, [open]);
  
  if (phase === 0) return null;
  const visible = phase === 2;
  
  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      zIndex: 9999, 
      display: 'flex', 
      alignItems: 'flex-end', 
      justifyContent: 'center',
      pointerEvents: visible ? 'all' : 'none'
    }}>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'rgba(26,10,0,0.65)', 
          backdropFilter: 'blur(8px)', 
          WebkitBackdropFilter: 'blur(8px)',
          opacity: visible ? 1 : 0, 
          transition: 'opacity 0.4s ease',
          cursor: 'pointer'
        }} 
      />
      
      {/* Floating particles */}
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: p.size,
            zIndex: 1,
            pointerEvents: 'none',
            animation: `floatUp ${p.duration}ms ease-out ${p.delay}ms both`,
            opacity: 0
          }}
        >
          {p.emoji}
        </div>
      ))}
      
      {/* Main prompt card */}
      <div style={{ 
        position: 'relative', 
        zIndex: 2, 
        width: '100%', 
        maxWidth: '420px', 
        background: 'linear-gradient(135deg,#ffffff 0%,#fdf8f5 100%)', 
        borderTopLeftRadius: 32, 
        borderTopRightRadius: 32,
        boxShadow: '0 -8px 32px rgba(200,75,17,0.15), 0 16px 64px rgba(26,10,0,0.2)',
        opacity: visible ? 1 : 0, 
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(100%) scale(0.95)', 
        transition: 'opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)',
        overflow: 'hidden'
      }}>
        {/* Gradient top bar */}
        <div style={{ 
          height: 6, 
          background: 'linear-gradient(90deg, #c84b11, #f97316, #ea580c, #c84b11)', 
          backgroundSize: '200% 100%',
          animation: 'shimGradient 3s linear infinite'
        }} />
        
        {/* Close button */}
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: 16, 
            right: 16, 
            width: 36, 
            height: 36, 
            borderRadius: '50%', 
            border: 'none', 
            background: 'rgba(200,75,17,0.08)', 
            color: '#c84b11', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: 16, 
            fontWeight: 800, 
            transition: 'all 0.2s',
            zIndex: 3
          }}
          onMouseEnter={e => { 
            e.currentTarget.style.background = '#c84b11'; 
            e.currentTarget.style.color = 'white'; 
            e.currentTarget.style.transform = 'scale(1.1)'; 
          }}
          onMouseLeave={e => { 
            e.currentTarget.style.background = 'rgba(200,75,17,0.08)'; 
            e.currentTarget.style.color = '#c84b11'; 
            e.currentTarget.style.transform = 'scale(1)'; 
          }}
        >
          ✕
        </button>
        
        {/* Content */}
        <div style={{ padding: '32px 28px 36px', textAlign: 'center' }}>
          {/* Icon with animation */}
          <div style={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg,#c84b11,#f97316)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 24px', 
            fontSize: 36, 
            boxShadow: '0 12px 32px rgba(200,75,17,0.35)',
            animation: visible ? 'bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
            transform: 'scale(0)',
            transitionDelay: visible ? '100ms' : '0ms'
          }}>
            👜
          </div>
          
          {/* Text content */}
          <h2 style={{ 
            fontSize: 24, 
            fontWeight: 900, 
            color: '#1a0a00', 
            letterSpacing: '-0.03em', 
            marginBottom: 8,
            animation: visible ? 'slideInUp 0.5s ease both' : 'none',
            animationDelay: visible ? '200ms' : '0ms',
            opacity: 0,
            transform: 'translateY(20px)'
          }}>
            Welcome to BagSearch
          </h2>
          <p style={{ 
            fontSize: 14, 
            color: '#9a6348', 
            fontWeight: 500, 
            lineHeight: 1.6, 
            marginBottom: 28,
            animation: visible ? 'slideInUp 0.5s ease both' : 'none',
            animationDelay: visible ? '300ms' : '0ms',
            opacity: 0,
            transform: 'translateY(20px)'
          }}>
            Sign in to save favorites, get exclusive deals, and connect with sellers across Nigeria
          </p>
          
          {/* Action buttons */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 12,
            animation: visible ? 'slideInUp 0.5s ease both' : 'none',
            animationDelay: visible ? '400ms' : '0ms',
            opacity: 0,
            transform: 'translateY(20px)'
          }}>
            <button 
              onClick={() => { onClose(); navigate("/register"); }}
              style={{ 
                width: '100%', 
                padding: '16px 0', 
                background: 'linear-gradient(135deg,#c84b11,#f97316)', 
                color: 'white', 
                fontWeight: 900, 
                fontSize: 16, 
                border: 'none', 
                borderRadius: 16, 
                cursor: 'pointer', 
                boxShadow: '0 8px 24px rgba(200,75,17,0.4)', 
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; 
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(200,75,17,0.5)'; 
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.transform = 'translateY(0) scale(1)'; 
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(200,75,17,0.4)'; 
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>Create Free Account</span>
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.2) 50%,transparent 70%)', 
                animation: 'shimmer 2s ease-in-out infinite',
                pointerEvents: 'none'
              }} />
            </button>
            
            <button 
              onClick={() => { onClose(); navigate("/login?force=true"); }}
              style={{ 
                width: '100%', 
                padding: '14px 0', 
                background: 'rgba(200,75,17,0.08)', 
                color: '#c84b11', 
                fontWeight: 800, 
                fontSize: 15, 
                border: '2px solid rgba(200,75,17,0.15)', 
                borderRadius: 16, 
                cursor: 'pointer', 
                transition: 'all 0.3s',
                backdropFilter: 'blur(8px)'
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.background = 'rgba(200,75,17,0.12)'; 
                e.currentTarget.style.borderColor = 'rgba(200,75,17,0.25)'; 
                e.currentTarget.style.transform = 'translateY(-1px)'; 
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.background = 'rgba(200,75,17,0.08)'; 
                e.currentTarget.style.borderColor = 'rgba(200,75,17,0.15)'; 
                e.currentTarget.style.transform = 'translateY(0)'; 
              }}
            >
              Already have an account? Sign In
            </button>
          </div>
          
          {/* Trust indicators */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 16, 
            marginTop: 24,
            animation: visible ? 'slideInUp 0.5s ease both' : 'none',
            animationDelay: visible ? '500ms' : '0ms',
            opacity: 0,
            transform: 'translateY(20px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>🔒</span>
              <span style={{ fontSize: 11, color: '#9a6348', fontWeight: 600 }}>Secure</span>
            </div>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#e0d5cc' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>✓</span>
              <span style={{ fontSize: 11, color: '#9a6348', fontWeight: 600 }}>Free</span>
            </div>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#e0d5cc' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>⚡</span>
              <span style={{ fontSize: 11, color: '#9a6348', fontWeight: 600 }}>Quick</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes shimGradient {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(0) rotate(0deg); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-100px) rotate(15deg); }
        }
      `}</style>
    </div>
  );
}

function AuthGateModal({ open, onClose, navigate }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (open) { setPhase(1); const t = setTimeout(() => setPhase(2), 20); return () => clearTimeout(t); }
    else { setPhase(3); const t = setTimeout(() => setPhase(0), 400); return () => clearTimeout(t); }
  }, [open]);
  if (phase === 0) return null;
  const visible = phase === 2;
  return (
    <div style={{ position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }}>
      <div onClick={onClose} style={{ position:"absolute",inset:0,background:"rgba(26,10,0,0.55)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",opacity:visible?1:0,transition:"opacity 0.35s ease" }} />
      <div style={{ position:"relative",zIndex:1,width:"100%",maxWidth:420,background:"#FFFFFF",border:"1px solid rgba(201,75,44,0.15)",borderRadius:20,overflow:"hidden",boxShadow:"0 32px 80px rgba(26,10,0,0.18)",opacity:visible?1:0,transform:visible?"translateY(0) scale(1)":"translateY(32px) scale(0.95)",transition:"opacity 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
        <div style={{ height:6,background:"linear-gradient(90deg, #C94B2C, #E8856A, #C94B2C)" }} />
        <button onClick={onClose} style={{ position:"absolute",top:16,right:16,width:32,height:32,borderRadius:"50%",border:"1px solid #E8D5CC",background:"#FFF5F2",color:"#999",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s" }}>
          <Icon name="close" size={15} />
        </button>
        <div style={{ padding:"36px 36px 32px",textAlign:"center" }}>
          <div style={{ width:64,height:64,borderRadius:"50%",background:"#F9DDD0",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",color:"#C94B2C" }}><Icon name="lock" size={28} /></div>
          <h2 style={{ fontSize:"1.5rem",fontWeight:800,color:"#1A0A00",letterSpacing:"-0.04em",marginBottom:8 }}>Members Only</h2>
          <p style={{ fontSize:13,color:"#888",lineHeight:1.6,marginBottom:28 }}>Sign in to unlock visual search, wishlists & more.</p>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            <button onClick={() => { onClose(); navigate("/register"); }} style={{ width:"100%",padding:"13px 0",background:"#C94B2C",color:"white",fontWeight:800,fontSize:14,border:"none",borderRadius:10,cursor:"pointer",boxShadow:"0 6px 20px rgba(201,75,44,0.35)",transition:"all 0.25s" }}>Create Free Account</button>
            <button onClick={() => { onClose(); navigate("/login?force=true"); }} style={{ width:"100%",padding:"12px 0",background:"#FFF5F2",color:"#C94B2C",fontWeight:700,fontSize:13,border:"1px solid #F0C8BB",borderRadius:10,cursor:"pointer",transition:"all 0.2s" }}>Already a member? Sign In</button>
          </div>
        </div>
        <div style={{ padding:"12px 36px",borderTop:"1px solid #F5EAE5",display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"#FDFAFA" }}>
          <div style={{ color:"#C94B2C" }}><LogoIcon /></div>
          <span style={{ fontSize:12,fontWeight:800,color:"#1A0A00",letterSpacing:"-0.02em" }}>Bag<span style={{ color:"#C94B2C" }}>Search</span></span>
        </div>
      </div>
    </div>
  );
}

function useScrollReveal(t=0.08){const ref=useRef(null);const[v,setV]=useState(false);useEffect(()=>{const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setV(true);o.disconnect();}},{threshold:t});if(ref.current)o.observe(ref.current);return()=>o.disconnect();},[t]);return[ref,v];}
function AnimatedCount({value}){const[n,setN]=useState(0);const ref=useRef(null);useEffect(()=>{const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){let s=0;const timer=setInterval(()=>{s+=Math.ceil(value/55);if(s>=value){setN(value);clearInterval(timer);}else setN(s);},20);o.disconnect();}},{threshold:0.2});if(ref.current)o.observe(ref.current);return()=>o.disconnect();},[value]);return <span ref={ref}>{n.toLocaleString()}</span>;}
const StarRating=({rating,size=12})=>(<div style={{display:'flex',gap:1}}>{[1,2,3,4,5].map(i=>(<svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i<=Math.floor(rating)?'#f97316':'#f0d9cc'}><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>))}</div>);

function LocationModal({isOpen,onClose,selectedLocation,onSelect}){
  const[search,setSearch]=useState('');
  if(!isOpen)return null;
  const filtered=NIGERIAN_LOCATIONS.filter(l=>l.name.toLowerCase().includes(search.toLowerCase())||l.state.toLowerCase().includes(search.toLowerCase()));
  const grouped=filtered.reduce((a,loc)=>{const k=loc.state||'All';if(!a[k])a[k]=[];a[k].push(loc);return a;},{});
  return(<><div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(26,10,0,0.5)',zIndex:200,backdropFilter:'blur(4px)'}}/>
    <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:201,width:'min(480px,92vw)',maxHeight:'75vh',background:'white',borderRadius:24,overflow:'hidden',boxShadow:`0 32px 80px rgba(200,75,17,0.2)`,display:'flex',flexDirection:'column',animation:'modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both'}}>
      <div style={{padding:'24px 24px 18px',borderBottom:`1px solid ${C.borderLight}`}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div><h3 style={{fontSize:20,fontWeight:900,color:C.text,marginBottom:3}}>📍 Choose Location</h3><p style={{fontSize:12,color:C.textFaint,fontWeight:500}}>Shop from sellers near you</p></div>
          <button onClick={onClose} style={{width:36,height:36,borderRadius:'50%',border:'none',background:C.primaryBg,cursor:'pointer',fontSize:16,color:C.primary}}>✕</button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,background:C.surfaceDim,border:`1.5px solid ${C.border}`,borderRadius:12,padding:'10px 14px'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search city…" autoFocus style={{flex:1,border:'none',background:'transparent',fontSize:13,color:C.text,fontFamily:'inherit',fontWeight:500,outline:'none'}}/>
        </div>
      </div>
      <div style={{overflowY:'auto',flex:1,padding:'12px 16px 20px'}}>
        {Object.entries(grouped).map(([state,locs])=>(<div key={state} style={{marginBottom:8}}>
          {state!=='All'&&<p style={{fontSize:10,fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:C.textFaint,padding:'8px 8px 4px'}}>{state}</p>}
          {locs.map(loc=>{const isSel=selectedLocation.id===loc.id;return(
            <button key={loc.id} onClick={()=>{onSelect(loc);onClose();}} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:12,border:'none',background:isSel?C.primaryBg:'transparent',cursor:'pointer',textAlign:'left',transition:'all 0.18s'}}>
              <span style={{fontSize:18}}>{loc.emoji}</span>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:isSel?800:600,color:isSel?C.primary:C.text}}>{loc.name}</div>{loc.state&&<div style={{fontSize:11,color:C.textFaint,fontWeight:500}}>{loc.state} State</div>}</div>
              {isSel&&<div style={{width:20,height:20,borderRadius:'50%',background:C.primary,display:'flex',alignItems:'center',justifyContent:'center'}}><svg width="10" height="10" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg></div>}
            </button>);})}
        </div>))}
      </div>
    </div></>);
}

function CategoryPill({cat,isActive,onClick,index,count}){
  const[hov,setHov]=useState(false);
  return(<button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{display:'flex',alignItems:'center',gap:7,padding:'9px 16px',borderRadius:100,border:`1.5px solid ${isActive?cat.color:hov?cat.border:C.border}`,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,background:isActive?cat.color:hov?cat.bg:'white',boxShadow:isActive?`0 6px 18px ${cat.color}44`:hov?`0 4px 14px ${cat.color}22`:'0 1px 4px rgba(0,0,0,0.04)',transform:isActive?'translateY(-2px) scale(1.03)':hov?'translateY(-1px)':'none',transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',animation:`catIn 0.45s cubic-bezier(0.22,1,0.36,1) ${index*50}ms both`,position:'relative',overflow:'hidden'}}>
    {isActive&&<div style={{position:'absolute',inset:0,background:'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.2) 50%,transparent 70%)',animation:'shimCat 2s ease-in-out infinite',pointerEvents:'none'}}/>}
    <span style={{fontSize:16,transform:(isActive||hov)?'scale(1.2) rotate(-5deg)':'scale(1)',transition:'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',display:'inline-block'}}>{cat.icon}</span>
    <span style={{fontSize:13,fontWeight:isActive?800:600,color:isActive?'white':hov?cat.color:C.textMid}}>{cat.label}</span>
    {count>0&&<span style={{fontSize:10,fontWeight:800,background:isActive?'rgba(255,255,255,0.25)':cat.bg,color:isActive?'white':cat.color,border:`1px solid ${isActive?'rgba(255,255,255,0.3)':cat.border}`,padding:'1px 6px',borderRadius:20}}>{count}</span>}
  </button>);
}

function ProductCard({product,index,navigate,onAddToCart,isAuthed,onRequireAuth}){
  const[ref,vis]=useScrollReveal();
  const[hov,setHov]=useState(false);
  const[added,setAdded]=useState(false);
  const loc=NIGERIAN_LOCATIONS.find(l=>l.id===product.location);
  const handleCart=(e)=>{e.stopPropagation();setAdded(true);onAddToCart(product);setTimeout(()=>setAdded(false),1800);};

  return(
    <div ref={ref} onClick={()=>navigate(`/products/${product.id}`)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:'white',borderRadius:18,overflow:'hidden',border:`1.5px solid ${hov?C.primaryBorder:C.borderLight}`,cursor:'pointer',position:'relative',opacity:vis?1:0,transform:vis?'translateY(0) scale(1)':'translateY(28px) scale(0.97)',transition:`opacity 0.55s cubic-bezier(0.22,1,0.36,1) ${(index%4)*80}ms,transform 0.55s cubic-bezier(0.22,1,0.36,1) ${(index%4)*80}ms,box-shadow 0.3s,border-color 0.3s`,boxShadow:hov?`0 20px 50px rgba(200,75,17,0.12),0 4px 16px rgba(0,0,0,0.05)`:'0 2px 10px rgba(0,0,0,0.04)'}}>
      <div style={{position:'relative',overflow:'hidden',aspectRatio:'4/3',background:C.primaryBg}}>
        <img src={product.src} alt={product.name} style={{width:'100%',height:'100%',objectFit:'cover',display:'block',transition:'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',transform:hov?'scale(1.07)':'scale(1)'}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 55%,rgba(26,10,0,0.3) 100%)',opacity:hov?1:0,transition:'opacity 0.4s'}}/>
        <div style={{position:'absolute',top:10,left:10,display:'flex',flexDirection:'column',gap:5,alignItems:'flex-start',zIndex:2}}>
          {product.lowStock && <span style={{background:'#dc2626',color:'white',fontSize:9,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',padding:'3px 8px',borderRadius:20,boxShadow:'0 2px 8px rgba(220,38,38,0.4)',animation:'pulseBadge 2s ease-in-out infinite',display:'flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}}><span style={{width:5,height:5,borderRadius:'50%',background:'white',display:'inline-block',flexShrink:0}}/>Low Stock</span>}
          {product.discountLabel && <span style={{background:'linear-gradient(135deg,#c84b11,#f97316)',color:'white',fontSize:9,fontWeight:800,letterSpacing:'0.06em',textTransform:'uppercase',padding:'3px 8px',borderRadius:20,boxShadow:'0 2px 8px rgba(200,75,17,0.4)',whiteSpace:'nowrap'}}>{product.discountLabel}</span>}
        </div>
        {loc && <span style={{position:'absolute',top:10,right:10,zIndex:2,background:'rgba(255,255,255,0.93)',backdropFilter:'blur(8px)',color:C.textMid,fontSize:10,fontWeight:700,padding:'4px 9px',borderRadius:20,display:'flex',alignItems:'center',gap:4,boxShadow:'0 2px 8px rgba(0,0,0,0.08)',whiteSpace:'nowrap',maxWidth:'calc(100% - 100px)',overflow:'hidden',textOverflow:'ellipsis'}}><span style={{flexShrink:0}}>{loc.emoji}</span><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{loc.name}</span></span>}
        <div style={{position:'absolute',bottom:10,left:'50%',transform:hov?'translateX(-50%) translateY(0)':'translateX(-50%) translateY(12px)',opacity:hov?1:0,transition:'all 0.3s cubic-bezier(0.22,1,0.36,1)',background:'rgba(26,10,0,0.75)',backdropFilter:'blur(8px)',color:'white',fontSize:10,fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',padding:'5px 16px',borderRadius:20,whiteSpace:'nowrap',pointerEvents:'none'}}>Quick View</div>
      </div>
      <div style={{padding:'13px 13px 12px'}}>
        <h3 style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:2,lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{product.name}</h3>
        <p style={{fontSize:11,color:C.textFaint,marginBottom:10,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{product.seller}</p>
        <div style={{display:'flex',gap:4,marginBottom:10,alignItems:'center'}}>
          {(product.colors||[]).length > 0
            ? (<>{(product.colors||[]).slice(0,5).map((c,i)=>(<span key={i} style={{width:13,height:13,borderRadius:'50%',background:c.hex||c,border:'2px solid white',outline:`1px solid ${C.border}`,display:'inline-block'}} title={c.id||''}/>))}
            {(product.colors||[]).length > 5 && <span style={{fontSize:9,color:C.textFaint,fontWeight:700}}>+{(product.colors||[]).length-5}</span>}</>)
            : <span style={{fontSize:10,color:C.textFaint,fontWeight:500}}>—</span>}
        </div>
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:10}}>
          <div>
            <p style={{fontSize:9,color:C.textFaint,marginBottom:1,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase'}}>Qty</p>
            <p style={{fontSize:12,fontWeight:700,color:C.textMid}}>{product.quantity != null ? `${product.quantity} units` : '—'}</p>
          </div>
          <div style={{textAlign:'right'}}>
            {product.discountedPrice&&<p style={{fontSize:10,color:C.textFaint,fontWeight:600,textDecoration:'line-through',marginBottom:1}}>{formatCurrency(product.price)}</p>}
            <p style={{fontSize:19,fontWeight:900,color:hov?C.primary:C.accent,letterSpacing:'-0.03em',transition:'color 0.2s',lineHeight:1}}>{formatCurrency(product.discountedPrice||product.price)}</p>
          </div>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'stretch'}}>
          <button onClick={handleCart} style={{flex:1,minWidth:0,padding:'9px 6px',borderRadius:10,border:'none',cursor:'pointer',fontWeight:800,fontSize:11,background:added?'linear-gradient(135deg,#15803d,#16a34a)':'linear-gradient(135deg,#c84b11,#f97316)',color:'white',transition:'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',boxShadow:added?'0 4px 14px rgba(22,163,74,0.4)':'0 4px 12px rgba(200,75,17,0.35)',transform:added?'scale(0.96)':'scale(1)',display:'flex',alignItems:'center',justifyContent:'center',gap:4,whiteSpace:'nowrap',overflow:'hidden'}}>
            {added?<><svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Added!</>:<><svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Add to Cart</span></>}
          </button>
          <a
            href={(() => {
              const number = normalizeWhatsAppNumber(product.whatsapp || '');
              if (!number) return '';
              const productLink = `${window.location.origin}/products/${product.id}`;
              const msg = `Hi, I'm interested in *${product.name}*\nPrice: ${product.discountedPrice ? '₦' + product.discountedPrice.toLocaleString() + ' (discounted)' : '₦' + product.price.toLocaleString()}\nProduct link: ${productLink}`;
              return buildWhatsAppUrl(number, msg);
            })()}
            target="_blank" rel="noopener noreferrer"
            onClick={e=>{
              if(!isAuthed){e.preventDefault();e.stopPropagation();onRequireAuth&&onRequireAuth();return;}
              const number = normalizeWhatsAppNumber(product.whatsapp || '');
              if(!number){e.preventDefault();e.stopPropagation();alert('Seller WhatsApp number is missing for this product.');return;}
              e.stopPropagation();
            }}
            style={{width:36,minWidth:36,height:'auto',borderRadius:10,background:C.successBg,color:C.success,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all 0.25s',textDecoration:'none',flexShrink:0}}
            onMouseEnter={e=>{e.currentTarget.style.background='#22c55e';e.currentTarget.style.color='white';}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.successBg;e.currentTarget.style.color=C.success;}}>
            <WaIcon size={14} color="currentColor" />
          </a>
        </div>
      </div>
    </div>
  );
}

function CompactProductCard({ product, navigate, onAddToCart, isAuthed, onRequireAuth, badge, badgeColor }) {
  const [hov, setHov] = useState(false);
  const [added, setAdded] = useState(false);
  const handleCart = (e) => { e.stopPropagation(); setAdded(true); onAddToCart(product); setTimeout(() => setAdded(false), 1800); };
  return (
    <div onClick={() => navigate(`/products/${product.id}`)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:'white',borderRadius:16,overflow:'hidden',border:`1.5px solid ${hov?C.primaryBorder:C.borderLight}`,cursor:'pointer',transition:'all 0.3s cubic-bezier(0.22,1,0.36,1)',boxShadow:hov?`0 16px 40px rgba(200,75,17,0.13)`:'0 2px 8px rgba(0,0,0,0.04)',transform:hov?'translateY(-4px)':'none',flexShrink:0,width:200 }}>
      <div style={{ position:'relative',overflow:'hidden',height:150,background:C.primaryBg }}>
        <img src={product.src} alt={product.name} style={{ width:'100%',height:'100%',objectFit:'cover',display:'block',transition:'transform 0.5s ease',transform:hov?'scale(1.08)':'scale(1)' }} />
        {badge && <span style={{ position:'absolute',top:8,left:8,background:badgeColor||C.primary,color:'white',fontSize:9,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',padding:'3px 8px',borderRadius:20 }}>{badge}</span>}
      </div>
      <div style={{ padding:'11px 12px' }}>
        <p style={{ fontSize:12,fontWeight:800,color:C.text,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{product.name}</p>
        <p style={{ fontSize:10,color:C.textFaint,marginBottom:6,fontWeight:500 }}>{product.seller}</p>
        <div style={{ display:'flex',gap:4,marginBottom:10,alignItems:'center' }}>
          {product.colors && product.colors.slice(0,3).map((c,i) => (<span key={i} style={{ width:10,height:10,borderRadius:'50%',background:c.hex||c,border:'1px solid white',outline:`0.5px solid ${C.border}`,display:'inline-block' }} title={c.id||''} />))}
          {product.colors && product.colors.length > 3 && <span style={{ fontSize:8,color:C.textFaint,fontWeight:700 }}>+{product.colors.length-3}</span>}
          <span style={{ fontSize:9,color:C.textMuted,fontWeight:700,marginLeft:'auto' }}>{product.quantity} items</span>
        </div>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <span style={{ fontSize:15,fontWeight:900,color:C.primary }}>{formatCurrency(product.price)}</span>
          <button onClick={handleCart} style={{ width:30,height:30,borderRadius:8,border:'none',cursor:'pointer',background:added?'#16a34a':C.primary,color:'white',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.3s',transform:added?'scale(0.9)':'scale(1)' }}>
            {added ? <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              : <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
          </button>
        </div>
      </div>
    </div>
  );
}

function HorizontalSection({ title, subtitle, icon, accentColor, accentBg, products, navigate, onAddToCart, isAuthed, onRequireAuth, badge, badgeColor, onSeeAll }) {
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [ref, vis] = useScrollReveal(0.05);
  const checkScroll = () => { const el=scrollRef.current; if(!el)return; setCanLeft(el.scrollLeft>10); setCanRight(el.scrollLeft<el.scrollWidth-el.clientWidth-10); };
  const scroll = (dir) => { const el=scrollRef.current; if(!el)return; el.scrollBy({left:dir*430,behavior:'smooth'}); };
  return (
    <div ref={ref} style={{ marginBottom:48,opacity:vis?1:0,transform:vis?'translateY(0)':'translateY(32px)',transition:'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18 }}>
        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
          <div style={{ width:40,height:40,borderRadius:12,background:accentBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,border:`1.5px solid ${accentColor}33` }}>{icon}</div>
          <div>
            <h3 style={{ fontSize:18,fontWeight:900,color:C.text,letterSpacing:'-0.03em',marginBottom:1 }}>{title}</h3>
            <p style={{ fontSize:12,color:C.textFaint,fontWeight:500 }}>{subtitle}</p>
          </div>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          {[{dir:-1,can:canLeft},{dir:1,can:canRight}].map(({dir,can})=>(
            <button key={dir} onClick={()=>scroll(dir)} style={{ width:34,height:34,borderRadius:'50%',border:`1.5px solid ${can?accentColor:C.border}`,background:can?accentBg:'white',color:can?accentColor:C.textFaint,cursor:can?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s',opacity:can?1:0.4 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={dir===-1?'M15.75 19.5L8.25 12l7.5-7.5':'M8.25 4.5l7.5 7.5-7.5 7.5'}/></svg>
            </button>
          ))}
          <button onClick={onSeeAll} style={{ fontSize:12,fontWeight:800,color:accentColor,background:accentBg,border:`1.5px solid ${accentColor}33`,padding:'7px 14px',borderRadius:20,cursor:'pointer',transition:'all 0.2s',whiteSpace:'nowrap' }}
            onMouseEnter={e=>{e.currentTarget.style.background=accentColor;e.currentTarget.style.color='white';}}
            onMouseLeave={e=>{e.currentTarget.style.background=accentBg;e.currentTarget.style.color=accentColor;}}>
            See All →
          </button>
        </div>
      </div>
      <div ref={scrollRef} onScroll={checkScroll} style={{ display:'flex',gap:14,overflowX:'auto',paddingBottom:8,paddingTop:4,scrollbarWidth:'none',msOverflowStyle:'none' }} className="hide-scrollbar">
        {products.map((p) => (<CompactProductCard key={p.id} product={p} navigate={navigate} onAddToCart={onAddToCart} isAuthed={isAuthed} onRequireAuth={onRequireAuth} badge={badge} badgeColor={badgeColor} />))}
      </div>
    </div>
  );
}

function HotDealsCarousel({ products, navigate, onAddToCart, isAuthed, onRequireAuth }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [animDir, setAnimDir] = useState('next');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [addedMap, setAddedMap] = useState({});
  const [ref, vis] = useScrollReveal(0.05);
  const [timeLeft, setTimeLeft] = useState({ h:0,m:0,s:0 });
  const autoRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => { const h=()=>setWindowWidth(window.innerWidth); window.addEventListener('resize',h); return()=>window.removeEventListener('resize',h); }, []);
  const isMobile = windowWidth <= 640;
  const isSmall = windowWidth <= 380;

  useEffect(() => {
    const tick = () => {
      const now = new Date(); const midnight = new Date(); midnight.setHours(24,0,0,0);
      const diff = Math.max(0, Math.floor((midnight - now) / 1000));
      setTimeLeft({h:Math.floor(diff/3600),m:Math.floor((diff%3600)/60),s:diff%60});
    };
    tick(); const iv = setInterval(tick, 1000); return () => clearInterval(iv);
  }, []);

  const pad = n => String(n).padStart(2,'0');

  const goTo = useCallback((newIdx, dir = 'next') => {
    if (isAnimating || products.length <= 1) return;
    setAnimDir(dir);
    setIsAnimating(true);
    setTimeout(() => { setActiveIdx(newIdx); setIsAnimating(false); }, 380);
  }, [isAnimating, products.length]);

  const goNext = useCallback(() => goTo((activeIdx + 1) % products.length, 'next'), [activeIdx, products.length, goTo]);
  const goPrev = useCallback(() => goTo((activeIdx - 1 + products.length) % products.length, 'prev'), [activeIdx, products.length, goTo]);

  useEffect(() => {
    if (isPaused || products.length <= 1) return;
    autoRef.current = setInterval(goNext, 5000);
    return () => clearInterval(autoRef.current);
  }, [isPaused, goNext, products.length]);

  const handleCart = (e, product) => {
    e.stopPropagation();
    setAddedMap(m => ({...m, [product.id]: true}));
    onAddToCart(product);
    setTimeout(() => setAddedMap(m => ({...m, [product.id]: false})), 1800);
  };

  if (!products || products.length === 0) return null;
  const product = products[activeIdx];
  const discountPct = product.discountedPrice ? Math.round((1 - product.discountedPrice / product.price) * 100) : 23;
  const added = addedMap[product.id];
  const slideStyle = isAnimating
    ? { opacity: 0, transform: animDir === 'next' ? 'translateX(-24px)' : 'translateX(24px)' }
    : { opacity: 1, transform: 'translateX(0)' };

  return (
    <div ref={ref} style={{ marginBottom:48,opacity:vis?1:0,transform:vis?'translateY(0)':'translateY(32px)',transition:'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:12 }}>
        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
          <div style={{ width:40,height:40,borderRadius:12,background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,border:'1.5px solid #fecaca',animation:'pulseBadge 2s ease-in-out infinite' }}>🔥</div>
          <div>
            <h3 style={{ fontSize:18,fontWeight:900,color:C.text,letterSpacing:'-0.03em',marginBottom:1 }}>Hot Deals</h3>
            <p style={{ fontSize:12,color:C.textFaint,fontWeight:500 }}>{products.length} exclusive limited-time offer{products.length!==1?'s':''}</p>
          </div>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:6 }}>
          <span style={{ fontSize:11,color:C.danger,fontWeight:700 }}>Ends in</span>
          <div style={{ display:'flex',alignItems:'center',gap:4 }}>
            {[timeLeft.h,timeLeft.m,timeLeft.s].map((v,i)=>(
              <div key={i} style={{ display:'flex',alignItems:'center' }}>
                <span style={{ background:C.danger,color:'white',fontWeight:900,fontSize:isSmall?11:13,borderRadius:7,padding:isSmall?'2px 5px':'4px 8px',minWidth:isSmall?24:30,textAlign:'center',letterSpacing:'-0.02em',boxShadow:'0 2px 8px rgba(220,38,38,0.3)',fontVariantNumeric:'tabular-nums' }}>{pad(v)}</span>
                {i<2&&<span style={{ fontSize:14,fontWeight:900,color:C.danger,margin:'0 2px',lineHeight:1 }}>:</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div onMouseEnter={()=>setIsPaused(true)} onMouseLeave={()=>setIsPaused(false)}
        style={{ position:'relative',borderRadius:22,overflow:'hidden',border:`2px solid #fcd4be`,boxShadow:'0 6px 32px rgba(200,75,17,0.1)',background:'linear-gradient(135deg,#fff5f2 0%,#fff 60%)' }}>
        <div style={{ display:'flex',flexDirection:isMobile?'column':'row',transition:'opacity 0.38s ease, transform 0.38s cubic-bezier(0.22,1,0.36,1)',...slideStyle }}>
          <div style={{ width:isMobile?'100%':'42%',minHeight:isMobile?220:300,position:'relative',overflow:'hidden',background:C.primaryBg,flexShrink:0 }} onClick={()=>navigate(`/products/${product.id}`)}>
            <img src={product.src} alt={product.name} style={{ width:'100%',height:isMobile?240:'100%',objectFit:'cover',display:'block',cursor:'pointer',transition:'transform 0.5s ease' }} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.04)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}/>
            <div style={{ position:'absolute',top:14,left:14,background:'#dc2626',color:'white',fontSize:isSmall?9:11,fontWeight:900,padding:isSmall?'2px 8px':'4px 12px',borderRadius:20,letterSpacing:'0.05em',boxShadow:'0 3px 10px rgba(220,38,38,0.4)',animation:'pulseBadge 2s ease-in-out infinite' }}>🔥 HOT DEAL</div>
            {products.length > 1 && <div style={{ position:'absolute',bottom:14,left:14,background:'rgba(26,10,0,0.65)',backdropFilter:'blur(8px)',color:'white',fontSize:11,fontWeight:800,padding:'4px 10px',borderRadius:20 }}>{activeIdx+1} / {products.length}</div>}
          </div>
          <div style={{ flex:1,padding:isMobile?'20px 18px 24px':isSmall?'16px 14px':'28px 32px 28px',display:'flex',flexDirection:'column',justifyContent:'center' }}>
            <p style={{ fontSize:isSmall?9:11,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:C.primary,marginBottom:6 }}>{product.seller}</p>
            <h4 style={{ fontSize:isMobile?'1.15rem':'clamp(1.2rem,2.5vw,1.65rem)',fontWeight:900,color:C.text,letterSpacing:'-0.03em',lineHeight:1.15,marginBottom:8,cursor:'pointer' }} onClick={()=>navigate(`/products/${product.id}`)}>{product.name}</h4>
            <p style={{ fontSize:13,color:C.textMuted,fontWeight:500,lineHeight:1.6,marginBottom:16 }}>{product.sub}</p>
            <div style={{ display:'flex',alignItems:'baseline',gap:10,marginBottom:16,flexWrap:'wrap' }}>
              <span style={{ fontSize:isMobile?24:32,fontWeight:900,color:C.primary,letterSpacing:'-0.04em' }}>{formatCurrency(product.discountedPrice||product.price)}</span>
              {product.discountedPrice && <span style={{ fontSize:isMobile?14:18,color:C.textFaint,textDecoration:'line-through',fontWeight:600 }}>{formatCurrency(product.price)}</span>}
              <span style={{ background:'#fef2f2',color:C.danger,fontSize:isSmall?9:12,fontWeight:800,padding:'3px 10px',borderRadius:20,border:'1px solid #fecaca',whiteSpace:'nowrap' }}>-{discountPct}% OFF</span>
            </div>
            <div style={{ display:'flex',gap:isMobile?8:10,flexDirection:isSmall?'column':'row',alignItems:'stretch' }}>
              <button onClick={e=>handleCart(e,product)} style={{ flex:1,maxWidth:isSmall?'100%':220,padding:isMobile?'11px 0':'13px 0',borderRadius:12,border:'none',cursor:'pointer',fontWeight:800,fontSize:isMobile?12:13,background:added?'linear-gradient(135deg,#15803d,#16a34a)':'linear-gradient(135deg,#c84b11,#f97316)',color:'white',transition:'all 0.35s',boxShadow:added?'0 4px 16px rgba(22,163,74,0.4)':'0 6px 20px rgba(200,75,17,0.4)',display:'flex',alignItems:'center',justifyContent:'center',gap:7 }}>
                {added?<><svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Added!</>:<>🛍️ Grab This Deal</>}
              </button>
            </div>
            <p style={{ marginTop:12,fontSize:isSmall?9:11,color:C.textFaint,fontWeight:600 }}>⚡ Only {product.quantity??'few'} left · Free delivery over ₦{FREE_DELIVERY_THRESHOLD.toLocaleString()}</p>
          </div>
        </div>
        {products.length > 1 && (
          <>
            <button onClick={goPrev} style={{ position:'absolute',left:isMobile?8:14,top:'50%',transform:'translateY(-50%)',width:38,height:38,borderRadius:'50%',border:'none',background:'rgba(255,255,255,0.92)',backdropFilter:'blur(8px)',color:C.primary,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px rgba(0,0,0,0.12)',transition:'all 0.2s',zIndex:5 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
            </button>
            <button onClick={goNext} style={{ position:'absolute',right:isMobile?8:14,top:'50%',transform:'translateY(-50%)',width:38,height:38,borderRadius:'50%',border:'none',background:'rgba(255,255,255,0.92)',backdropFilter:'blur(8px)',color:C.primary,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px rgba(0,0,0,0.12)',transition:'all 0.2s',zIndex:5 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
            </button>
          </>
        )}
      </div>
      {products.length > 1 && (
        <div style={{ marginTop:16,display:'flex',justifyContent:'center',gap:8 }}>
          {products.map((_,i) => (<button key={i} onClick={()=>goTo(i, i>activeIdx?'next':'prev')} style={{ width:i===activeIdx?28:8,height:8,borderRadius:99,border:'none',cursor:'pointer',background:i===activeIdx?C.primary:C.border,transition:'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',padding:0 }}/>))}
        </div>
      )}
    </div>
  );
}

function CartItem({item, onUpdateQty, onRemove, index, isAuthed, onRequireAuth}){
  const[removing,setRemoving]=useState(false);
  const[vis,setVis]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),index*70);return()=>clearTimeout(t);},[index]);
  const handleRemove=()=>{setRemoving(true);setTimeout(()=>onRemove(item.id),420);};
  const waNumber = (item.whatsapp||'').replace(/\D/g,'');
  const waMsg = encodeURIComponent(`Hi! I have *${item.qty}x ${item.name}* in my cart.\nTotal: ₦${(item.price * item.qty).toLocaleString()}\nProduct: ${item.src}`);
  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${waMsg}` : null;

  return(
    <div style={{ display:'flex',gap:13,background:'white',borderRadius:16,padding:14,border:`1.5px solid ${C.borderLight}`,boxShadow:`0 2px 10px rgba(200,75,17,0.05)`,opacity:removing?0:vis?1:0,transform:removing?'translateX(60px) scale(0.9)':vis?'translateX(0) scale(1)':'translateX(-20px) scale(0.97)',transition:'all 0.4s cubic-bezier(0.22,1,0.36,1)',maxHeight:removing?0:200,overflow:'hidden' }}>
      <div style={{position:'relative',flexShrink:0}}>
        <img src={item.src} alt={item.name} style={{width:72,height:72,objectFit:'cover',borderRadius:12,display:'block',border:`1px solid ${C.borderLight}`}}/>
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            onClick={e=>{ if(!isAuthed){e.preventDefault();e.stopPropagation();onRequireAuth&&onRequireAuth();}}}
            style={{ position:'absolute',bottom:-6,left:-6,width:26,height:26,borderRadius:'50%',background:C.whatsapp,display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none',boxShadow:`0 3px 10px rgba(37,211,102,0.5)`,border:'2.5px solid white',transition:'all 0.25s',zIndex:2 }}
            onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.18)';e.currentTarget.style.background=C.whatsappDark;}}
            onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.background=C.whatsapp;}}>
            <WaIcon size={12} color="white" />
          </a>
        )}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <h4 style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</h4>
        <p style={{fontSize:11,color:C.textFaint,fontWeight:500,marginBottom:8}}>{item.seller}</p>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',background:C.surfaceDim,borderRadius:10,border:`1.5px solid ${C.border}`,overflow:'hidden'}}>
            <button onClick={()=>item.qty>1?onUpdateQty(item.id,item.qty-1):handleRemove()} style={{width:30,height:30,border:'none',background:'transparent',cursor:'pointer',fontSize:16,fontWeight:700,color:C.textMid,display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
            <span style={{width:28,textAlign:'center',fontSize:13,fontWeight:800,color:C.text}}>{item.qty}</span>
            <button onClick={()=>onUpdateQty(item.id,item.qty+1)} style={{width:30,height:30,border:'none',background:'transparent',cursor:'pointer',fontSize:16,fontWeight:700,color:C.textMid,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:16,fontWeight:900,color:C.primary}}>{formatCurrency(item.price*item.qty)}</div>
            <button onClick={handleRemove} style={{fontSize:10,color:C.danger,fontWeight:700,background:'none',border:'none',cursor:'pointer',padding:'2px 0'}}>Remove</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartBadge({count,onClick}){
  const[pop,setPop]=useState(false);const prev=useRef(count);
  useEffect(()=>{if(count>prev.current){setPop(true);setTimeout(()=>setPop(false),600);}prev.current=count;},[count]);
  return(
    <button onClick={onClick} style={{position:'relative',padding:'8px 10px',borderRadius:10,border:`1px solid ${C.border}`,background:C.surfaceDim,cursor:'pointer',color:C.textMid,display:'flex',alignItems:'center',gap:6,transition:'all 0.2s'}}
      onMouseEnter={e=>{e.currentTarget.style.background=C.primaryBg;e.currentTarget.style.borderColor=C.primaryBorder;}} onMouseLeave={e=>{e.currentTarget.style.background=C.surfaceDim;e.currentTarget.style.borderColor=C.border;}}>
      <Icon name="shopping_cart" size={20}/>
      {count>0&&<div style={{position:'absolute',top:-6,right:-6,minWidth:20,height:20,background:'linear-gradient(135deg,#c84b11,#f97316)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:'white',border:'2px solid white',boxShadow:'0 2px 8px rgba(200,75,17,0.45)',transform:pop?'scale(1.5)':'scale(1)',transition:'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)'}}>{count}</div>}
    </button>
  );
}

function CartPage({cartItems, onUpdateQty, onRemove, onClose, isAuthed, onRequireAuth}){
  const[chatting,setChatting]=useState(false);
  const[chatted,setChatted]=useState(false);
  const total=cartItems.reduce((a,i)=>a+i.price*i.qty,0);
  const itemCount=cartItems.reduce((a,i)=>a+i.qty,0);
  const delivery=total>=FREE_DELIVERY_THRESHOLD?0:15;
  const tax=total*0.075;
  const grand=total+delivery+tax;

  const handleChatSellers = () => {
    if (!cartItems.length) return;
    if (!isAuthed) { onRequireAuth && onRequireAuth(); return; }
    setChatting(true);
    const bySellerMap = cartItems.reduce((acc, item) => {
      const key = item.seller || 'Seller';
      if (!acc[key]) acc[key] = { whatsapp: item.whatsapp || '', items: [] };
      acc[key].items.push(item);
      return acc;
    }, {});
    Object.entries(bySellerMap).forEach(([sellerName, { whatsapp, items }], idx) => {
      const number = (whatsapp || '').replace(/\D/g, '');
      if (!number) return;
      const itemLines = items.map(i => `• ${i.qty}x *${i.name}* — ₦${(i.price * i.qty).toLocaleString()}`).join('\n');
      const sellerTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      const msg = encodeURIComponent(`Hi ${sellerName}! 👋\n\nI'd like to order:\n\n${itemLines}\n\n*Subtotal: ₦${sellerTotal.toLocaleString()}*\n\nPlease confirm availability. Thank you! 🛍️`);
      setTimeout(() => { window.open(`https://wa.me/${number}?text=${msg}`, '_blank'); }, idx * 600);
    });
    setTimeout(() => { setChatting(false); setChatted(true); }, 1000);
    setTimeout(() => { setChatted(false); onClose(); }, 3400);
  };

  const uniqueSellers = useMemo(() => {
    const map = {};
    cartItems.forEach(i => {
      if (!map[i.seller]) map[i.seller] = { name: i.seller, whatsapp: i.whatsapp, count: 0 };
      map[i.seller].count++;
    });
    return Object.values(map);
  }, [cartItems]);

  return(
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(26,10,0,0.55)',zIndex:300,backdropFilter:'blur(6px)',animation:'fadeIn 0.3s ease both'}}/>
      <div style={{position:'fixed',inset:0,zIndex:301,display:'flex',alignItems:'stretch',justifyContent:'flex-end'}}>
        <div style={{width:'min(520px,100vw)',background:`linear-gradient(180deg,${C.primaryPale} 0%,white 30%)`,display:'flex',flexDirection:'column',animation:'slideInRight 0.45s cubic-bezier(0.34,1.2,0.64,1) both',boxShadow:'-24px 0 80px rgba(200,75,17,0.15)',overflowY:'hidden'}}>
          <div style={{height:4,background:'linear-gradient(90deg,#c84b11,#f97316,#ea580c)',flexShrink:0}}/>
          <div style={{background:C.primaryBg,padding:'26px 26px 22px',borderBottom:`1px solid ${C.primaryBorder}`,flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:itemCount>0?16:0}}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:50,height:50,borderRadius:16,background:'linear-gradient(135deg,#c84b11,#f97316)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 20px rgba(200,75,17,0.4)',fontSize:20}}>🛍️</div>
                <div>
                  <h2 style={{fontSize:21,fontWeight:900,color:C.text,letterSpacing:'-0.03em',marginBottom:2}}>Your Cart</h2>
                  <p style={{fontSize:13,color:C.textMuted,fontWeight:600}}>{itemCount} {itemCount===1?'item':'items'}{itemCount>0?` · ${formatCurrency(total)} subtotal`:''}</p>
                </div>
              </div>
              <button onClick={onClose} style={{width:38,height:38,borderRadius:'50%',border:`1.5px solid ${C.primaryBorder}`,background:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,color:C.primary,transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.background=C.primary;e.currentTarget.style.color='white';}} onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color=C.primary;}}>✕</button>
            </div>
            {total>0&&total<FREE_DELIVERY_THRESHOLD&&<div style={{background:'white',borderRadius:12,padding:'11px 14px',border:`1px solid ${C.primaryBorder}`}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{fontSize:11,color:C.primary,fontWeight:700}}>🚚 Add {formatCurrency(FREE_DELIVERY_THRESHOLD-total)} more for FREE delivery</span></div>
              <div style={{height:7,background:C.primaryBg,borderRadius:99,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min((total/FREE_DELIVERY_THRESHOLD)*100,100)}%`,background:'linear-gradient(90deg,#c84b11,#f97316)',borderRadius:99,transition:'width 0.7s ease'}}/></div>
            </div>}
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'18px 22px'}}>
            {cartItems.length===0?(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',paddingBottom:60,paddingTop:40}}>
                <div style={{fontSize:72,marginBottom:18}}>🛍️</div>
                <h3 style={{fontSize:20,fontWeight:900,color:C.text,marginBottom:8}}>Your cart is empty</h3>
                <p style={{fontSize:13,color:C.textMuted,textAlign:'center',fontWeight:500,lineHeight:1.7,maxWidth:260}}>Discover beautiful bags and add them here</p>
                <button onClick={onClose} style={{marginTop:22,padding:'13px 28px',background:'linear-gradient(135deg,#c84b11,#f97316)',color:'white',borderRadius:14,border:'none',cursor:'pointer',fontWeight:800,fontSize:14}}>Browse Bags</button>
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {cartItems.map((item,i)=>(<CartItem key={item.id} item={item} onUpdateQty={onUpdateQty} onRemove={onRemove} index={i} isAuthed={isAuthed} onRequireAuth={onRequireAuth}/>))}
              </div>
            )}
          </div>
          {cartItems.length>0&&<div style={{padding:'18px 22px 28px',borderTop:`1px solid ${C.borderLight}`,background:'white',flexShrink:0}}>
            <div style={{background:C.surfaceDim,borderRadius:18,padding:'16px 18px',marginBottom:16,border:`1.5px solid ${C.borderLight}`}}>
              <p style={{fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textFaint,marginBottom:11}}>Order Summary</p>
              {[{l:'Subtotal',v:formatCurrency(total)},{l:'Est. Delivery',v:delivery===0?'FREE ✨':formatCurrency(delivery),g:delivery===0},{l:'Tax (7.5%)',v:formatCurrency(tax)}].map(r=>(
                <div key={r.l} style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span style={{fontSize:13,color:C.textMuted,fontWeight:500}}>{r.l}</span><span style={{fontSize:13,fontWeight:700,color:r.g?'#15803d':C.text}}>{r.v}</span></div>
              ))}
              <div style={{height:1,background:C.border,margin:'11px 0'}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:16,fontWeight:900,color:C.text}}>Total</span>
                <span style={{fontSize:26,fontWeight:900,color:C.primary,letterSpacing:'-0.04em'}}>{formatCurrency(grand)}</span>
              </div>
            </div>
            <button onClick={handleChatSellers}
              style={{width:'100%',padding:'16px 0',borderRadius:16,border:'none',cursor:'pointer',background:chatted?'linear-gradient(135deg,#15803d,#16a34a)':chatting?`linear-gradient(135deg,${C.whatsappDark},${C.whatsapp})`:`linear-gradient(135deg,${C.whatsapp},#20c95a)`,color:'white',fontWeight:900,fontSize:15,transition:'all 0.5s',boxShadow:`0 8px 28px rgba(37,211,102,0.4)`,display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
              {chatted?(<><svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Chats Opened! 🎉</>)
                :chatting?(<><div style={{width:18,height:18,borderRadius:'50%',border:'2.5px solid rgba(255,255,255,0.4)',borderTopColor:'white',animation:'ldSpin 0.7s linear infinite'}}/>Opening WhatsApp…</>)
                :(<><WaIcon size={18} color="white"/>Chat Sellers on WhatsApp · {formatCurrency(grand)}</>)}
            </button>
          </div>}
        </div>
      </div>
      <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </>
  );
}

function ResponsiveHeader({ headerVisible, setIsSidebarOpen, navigate, setLocationModalOpen, selectedLocation, handleProfileClick, cartCount, setCartOpen, user, handleLogout, isMobile }) {
  return (
    <header style={{ position:'sticky',top:0,zIndex:50,background:'rgba(255,255,255,0.97)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',borderBottom:`1px solid ${C.borderLight}`,opacity:headerVisible?1:0,transform:headerVisible?'translateY(0)':'translateY(-100%)',transition:'opacity 0.45s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1)',boxShadow:`0 1px 20px rgba(200,75,17,0.07)` }}>
      <div style={{ height:3,background:`linear-gradient(90deg,${C.primary},${C.primaryLight},${C.accent})` }} />
      <div style={{ maxWidth:1280,margin:'0 auto',padding:isMobile?'0 12px':'0 20px',display:'flex',alignItems:'center',justifyContent:'space-between',height:isMobile?56:60,gap:isMobile?8:16 }}>
        <button className="mob-menu" onClick={()=>setIsSidebarOpen(true)} style={{ display:isMobile?'flex':'none',padding:8,borderRadius:10,border:'none',background:'transparent',cursor:'pointer',color:C.textMid,alignItems:'center',justifyContent:'center' }}>
          <svg style={{ width:22,height:22 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
        </button>
        <div style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer',flexShrink:0,color:C.primary }} onClick={()=>navigate('/')}>
          <LogoIcon size={isMobile?'32px':'clamp(34px, 5vw, 50px)'} />
          <span style={{ fontSize:isMobile?16:20,fontWeight:900,color:C.text,letterSpacing:'-0.5px' }}>Bag<span style={{ color:C.primary }}>Search</span></span>
        </div>
        <button onClick={()=>setLocationModalOpen(true)} style={{ flex:1,maxWidth:isMobile?'auto':250,minWidth:isMobile?120:200,display:'flex',alignItems:'center',gap:isMobile?4:8,padding:isMobile?'4px 8px':'7px 13px',borderRadius:12,border:`${isMobile?'1px':'1.5px'} solid ${C.border}`,background:C.surfaceDim,cursor:'pointer',transition:'all 0.25s',overflow:'hidden' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primaryBorder;e.currentTarget.style.background=C.primaryBg;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.surfaceDim;}}>
          <div style={{ position:'relative',flexShrink:0,width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <div style={{ position:'absolute',width:10,height:10,borderRadius:'50%',background:C.primary,opacity:0.28,animation:'locPing 1.8s ease-out infinite' }} />
            <div style={{ width:7,height:7,borderRadius:'50%',background:C.primary,position:'relative',zIndex:1 }} />
          </div>
          <div style={{ flex:1,textAlign:'left',minWidth:0,overflow:'hidden' }}>
            <div style={{ fontSize:isMobile?8:9,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textFaint,lineHeight:1.2 }}>{isMobile?'FROM':'Shopping from'}</div>
            <div style={{ fontSize:isMobile?12:13,fontWeight:800,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{selectedLocation.emoji} {isMobile?selectedLocation.name.split(' ')[0]||selectedLocation.name:selectedLocation.name}</div>
          </div>
          {!isMobile&&<svg style={{ width:13,height:13,color:C.textFaint,flexShrink:0 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>}
        </button>
        <div className="desk-act" style={{ display:isMobile?'none':'flex',alignItems:'center',gap:8 }}>
          <button onClick={handleProfileClick} style={{ padding:'8px 10px',borderRadius:10,border:`1px solid ${C.border}`,background:C.surfaceDim,cursor:'pointer',color:C.textMid,display:'flex',alignItems:'center',transition:'all 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.background=C.primaryBg;e.currentTarget.style.borderColor=C.primaryBorder;}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.surfaceDim;e.currentTarget.style.borderColor=C.border;}}>
            <Icon name="person" size={20} />
          </button>
          <CartBadge count={cartCount} onClick={()=>setCartOpen(true)} />
          {user?(
            <button onClick={handleLogout} style={{ padding:'8px 16px',borderRadius:10,border:'1px solid #fecaca',background:'#fef2f2',cursor:'pointer',color:'#dc2626',fontSize:13,fontWeight:700,transition:'all 0.2s' }}>Logout</button>
          ):(
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={()=>navigate('/login')} style={{ padding:'8px 16px',borderRadius:10,border:`1px solid ${C.border}`,background:C.surfaceDim,cursor:'pointer',color:C.textMid,fontSize:13,fontWeight:700,transition:'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.background=C.primaryBg;e.currentTarget.style.borderColor=C.primaryBorder;}}
                onMouseLeave={e=>{e.currentTarget.style.background=C.surfaceDim;e.currentTarget.style.borderColor=C.border;}}>Login</button>
              <button onClick={()=>navigate('/register')} style={{ padding:'8px 16px',borderRadius:10,border:'none',background:C.primary,cursor:'pointer',color:'white',fontSize:13,fontWeight:700,transition:'all 0.2s',boxShadow:`0 4px 12px rgba(200,75,17,0.2)` }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';}}>Register</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Product(){
  const location=useLocation();const navigate=useNavigate();const{user,logout}=useContext(AuthContext);
  const[pageLoading,setPageLoading]=useState(true);
  const fileInputRef=useRef(null);
  const searchSaveTimer=useRef(null);
  const[allProducts,setAllProducts]=useState([]);const[displayedProducts,setDisplayedProducts]=useState([]);
  const[isFiltered,setIsFiltered]=useState(false);const[searchQuery,setSearchQuery]=useState('');const[uploadedImage,setUploadedImage]=useState(null);
  const[visualSearching,setVisualSearching]=useState(false);
  const[isSidebarOpen,setIsSidebarOpen]=useState(false);const[searchFocused,setSearchFocused]=useState(false);
  const[headerVisible,setHeaderVisible]=useState(false);const[heroVisible,setHeroVisible]=useState(false);const[searchVisible,setSearchVisible]=useState(false);const[catVisible,setCatVisible]=useState(false);const[resultsKey,setResultsKey]=useState(0);
  const[activeCategory,setActiveCategory]=useState('all');const[selectedLocation,setSelectedLocation]=useState(NIGERIAN_LOCATIONS[0]);const[locationModalOpen,setLocationModalOpen]=useState(false);
  const[activeTab,setActiveTab]=useState('products');const[vendorSearch,setVendorSearch]=useState('');const[vendorSearchFocused,setVendorSearchFocused]=useState(false);const[vendors,setVendors]=useState([]);const[filteredVendors,setFilteredVendors]=useState([]);const[selectedVendor,setSelectedVendor]=useState(null);
  const[selectedVendorDetail,setSelectedVendorDetail]=useState(null);
  const[cartItems,setCartItems]=useState([]);const[cartOpen,setCartOpen]=useState(false);const[floatMsg,setFloatMsg]=useState(null);const[authGateOpen,setAuthGateOpen]=useState(false);
  const[windowWidth,setWindowWidth]=useState(typeof window!=='undefined'?window.innerWidth:1200);
  const[feedbackOpen,setFeedbackOpen]=useState(false);
  const[dismissedAds,setDismissedAds]=useState([]);
  const[mobileAuthPromptOpen,setMobileAuthPromptOpen]=useState(false);
  const[hasScrolledPastThreshold,setHasScrolledPastThreshold]=useState(false);

  const cartCount=cartItems.reduce((a,i)=>a+i.qty,0);
  const isMobile=windowWidth<=768;

  const HERO_PHRASES = ['Perfect Bag','Dream Clutch','Ideal Tote','Luxury Satchel','Everyday Crossbody'];
  const{word:heroWord,visible:heroWordVisible}=useWordCycle(HERO_PHRASES,2600);

  useEffect(()=>{ const h=()=>setWindowWidth(window.innerWidth); window.addEventListener('resize',h); return()=>window.removeEventListener('resize',h); },[]);
  useEffect(()=>{setTimeout(()=>setHeaderVisible(true),60);setTimeout(()=>setHeroVisible(true),180);setTimeout(()=>setSearchVisible(true),340);setTimeout(()=>setCatVisible(true),480);},[]);

  // Mobile auth prompt scroll trigger
  useEffect(() => {
    if (!isMobile || user) return; // Don't show for logged-in users or desktop
    
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const threshold = 800; // Show after scrolling 800px
      
      if (scrollY > threshold && !hasScrolledPastThreshold) {
        setHasScrolledPastThreshold(true);
        // Show prompt after a small delay
        setTimeout(() => {
          setMobileAuthPromptOpen(true);
        }, 1500);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, user, hasScrolledPastThreshold]);

  const mapCategory=useCallback((dbCat)=>{
    if(!dbCat)return'all';const c=dbCat.toLowerCase();
    if(c.includes('tote'))return'tote';if(c.includes('clutch'))return'clutch';if(c.includes('crossbody'))return'crossbody';
    if(c.includes('backpack'))return'backpack';if(c.includes('satchel'))return'satchel';if(c.includes('evening'))return'evening';
    if(c.includes('mini'))return'mini';if(c.includes('handbag')||c.includes('shoulder'))return'satchel';return'all';
  },[]);

  const buildVendorsFromProducts=useCallback((products)=>{
    const map=new Map();
    (products||[]).forEach(p=>{
      const sellerId=p.sellerId||p.seller||`seller_${p.id}`;if(!sellerId)return;
      if(!map.has(sellerId)){map.set(sellerId,{id:sellerId,name:p.seller||'Anonymous Seller',avatar:'👜',location:p.location||'all',rating:4.6,reviews:0,views:0,products:0,joined:p.created_at?new Date(p.created_at).toLocaleDateString('en-US',{year:'numeric',month:'short'}):'N/A',specialty:p.category||'Bags',badge:'',description:`Trusted seller of ${p.category||'bags'}`,tags:[p.category||'bags'],colors:p.colors?.slice(0,2)||['#c84b11','#f97316']});}
      const vendor=map.get(sellerId);vendor.products+=1;if(typeof p.views==='number')vendor.views+=p.views;
    });
    return Array.from(map.values());
  },[]);

  const fetchVendors=useCallback(async(products)=>{
    try{
      const{data,error}=await supabase.from('vendors').select('*');
      if(!error&&Array.isArray(data)&&data.length>0){
        const normalized=data.map(v=>({id:v.id||v.seller_id||v.name,name:v.name||'Unnamed Seller',avatar:v.avatar||'👜',location:v.location||'all',rating:v.rating??4.6,reviews:v.reviews??0,views:v.views??0,products:v.products??0,joined:v.joined||'N/A',specialty:v.specialty||'Bags',badge:v.badge||'',description:v.description||'Luxe seller',tags:Array.isArray(v.tags)?v.tags:[v.specialty||'bags'],colors:Array.isArray(v.colors)&&v.colors.length>0?v.colors:['#c84b11','#f97316']}));
        setVendors(normalized);setFilteredVendors(normalized);return normalized;
      }
      const derived=buildVendorsFromProducts(products||[]);setVendors(derived);setFilteredVendors(derived);return derived;
    }catch(err){const derived=buildVendorsFromProducts(products||[]);setVendors(derived);setFilteredVendors(derived);return derived;}
  },[buildVendorsFromProducts]);

  const fetchProducts=useCallback(async(locationId='all')=>{
    try{
      let query=supabase.from('products').select('*');
      if(locationId&&locationId!=='all')query=query.eq('location',locationId);
      let {data,error}=await query.order('created_at',{ascending:false});
      if(error){
        query=supabase.from('products').select('id,name,seller_name,user_id,brand,condition,description,price,location,images,created_at,category,whatsapp,discounted_price,discount_label,quantity,colors');
        if(locationId&&locationId!=='all')query=query.eq('location',locationId);
        const retry=await query.order('created_at',{ascending:false});
        if(retry.error) throw retry.error;
        data=retry.data;
      }
      return(data||[]).map(p=>{
        let rawColors = [];
        if (p.colors) {
          if (Array.isArray(p.colors)) rawColors = p.colors;
          else if (typeof p.colors === 'string') {
            try { rawColors = JSON.parse(p.colors); } catch { rawColors = [p.colors]; }
          }
        }
        const mappedColors = rawColors.length > 0
          ? rawColors.map(c => {
              if (typeof c === 'string') {
                const key = c.toLowerCase().trim();
                const hex = BAG_COLOR_MAP[key];
                return { id: key, hex: hex || '#c84b11' };
              }
              const key = String(c.id || '').toLowerCase().trim();
              return { id: key, hex: c.hex || BAG_COLOR_MAP[key] || '#c84b11' };
            })
          : [];
        const qty = p.quantity != null ? parseInt(p.quantity) : null;
        return {
          id:p.id,name:p.name,seller:p.seller_name||'Anonymous Seller',sellerId:p.seller_id||p.user_id||'db',
          sub:`${p.brand} • ${p.condition}`,price:parseFloat(p.price),quantity:qty,
          lowStock:qty != null && qty > 0 && qty < 5,category:mapCategory(p.category),location:p.location||'all',
          colors:mappedColors,src:p.images?.length>0?p.images[0]:'https://via.placeholder.com/400',
          brand:p.brand||'',condition:p.condition||'',description:p.description||'',
          discountedPrice:p.discounted_price?parseFloat(p.discounted_price):null,
          discountLabel:p.discount_label||null,whatsapp:p.whatsapp||''
        };
      });
    }catch(err){console.error('Failed to load products:', err);return[];}
  },[mapCategory]);

  useEffect(()=>{
    let isMounted=true;
    fetchProducts().then(async combined=>{
      if(!isMounted)return;
      setAllProducts(combined);setDisplayedProducts(combined);
      await fetchVendors(combined);
    }).catch(()=>{ if(!isMounted)return; setAllProducts([]);setDisplayedProducts([]); });
    return()=>{isMounted=false;};
  },[fetchProducts,fetchVendors]);

  const applyFilters=useCallback((q,cat,loc,prods)=>{let r=[...prods];if(q.trim())r=r.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())||(p.sub||'').toLowerCase().includes(q.toLowerCase())||(p.seller||'').toLowerCase().includes(q.toLowerCase()));if(cat!=='all')r=r.filter(p=>p.category===cat);if(loc.id!=='all')r=r.filter(p=>p.location===loc.id);return r;},[]);
  const saveSearch = useCallback((q) => {
    if (!user || !q.trim() || q.trim().length < 2) return;
    clearTimeout(searchSaveTimer.current);
    searchSaveTimer.current = setTimeout(async () => {
      try { await supabase.from('search_history').insert({user_id:user.id,query:q.trim(),type:'text'}); } catch (_) {}
    }, 1500);
  }, [user]);

  const handleSearch=q=>{setSearchQuery(q);setDisplayedProducts(applyFilters(q,activeCategory,selectedLocation,allProducts));setIsFiltered(!!q.trim()||activeCategory!=='all'||selectedLocation.id!=='all');setResultsKey(k=>k+1);saveSearch(q);};
  const handleCategoryChange=id=>{setActiveCategory(id);setDisplayedProducts(applyFilters(searchQuery,id,selectedLocation,allProducts));setIsFiltered(!!searchQuery.trim()||id!=='all'||selectedLocation.id!=='all');setResultsKey(k=>k+1);};
  const handleLocationChange=async loc=>{setSelectedLocation(loc);setIsFiltered(!!searchQuery.trim()||activeCategory!=='all'||loc.id!=='all');setResultsKey(k=>k+1);const combined=await fetchProducts(loc.id);setAllProducts(combined);setDisplayedProducts(applyFilters(searchQuery,activeCategory,loc,combined));};
  const handleClearSearch=async()=>{setIsFiltered(false);setSearchQuery('');setUploadedImage(null);setActiveCategory('all');const defaultLocation=NIGERIAN_LOCATIONS[0];setSelectedLocation(defaultLocation);setSelectedVendor(null);setResultsKey(k=>k+1);const combined=await fetchProducts();setAllProducts(combined);setDisplayedProducts(combined);};
  const handleImageUpload=async e=>{
    const f=e.target.files[0];if(!f)return;
    setUploadedImage(URL.createObjectURL(f));setIsFiltered(true);setVisualSearching(true);setResultsKey(k=>k+1);
    try{
      const results=await visualSearch(f,allProducts);
      if(results.length>0){setDisplayedProducts(results);setFloatMsg({text:`Found ${results.length} similar bags!`,type:'success'});}
      else{setDisplayedProducts([]);setFloatMsg({text:'No similar bags found. Try another image!',type:'info'});}
    }catch(err){setFloatMsg({text:'Visual search temporarily unavailable.',type:'danger'});setDisplayedProducts([]);}
    finally{setVisualSearching(false);e.target.value='';}
  };
  const handleVendorSearch=q=>{setVendorSearch(q);const normalized=q.trim().toLowerCase();if(!normalized){setFilteredVendors(vendors);return;}setFilteredVendors(vendors.filter(v=>v.name.toLowerCase().includes(normalized)||(v.specialty||'').toLowerCase().includes(normalized)||(v.tags||[]).some(t=>t.toLowerCase().includes(normalized))));};
  const handleViewVendorProducts=useCallback((vendor)=>{setSelectedVendorDetail(vendor);setActiveTab('vendorDetail');},[]);
  const handleRequireAuth=useCallback(()=>setAuthGateOpen(true),[]);
  const handleAddToCart=product=>{setCartItems(prev=>{const ex=prev.find(i=>i.id===product.id);if(ex)return prev.map(i=>i.id===product.id?{...i,qty:i.qty+1}:i);return[...prev,{...product,qty:1}];});setFloatMsg({text:`${product.name} added!`,type:'success'});setTimeout(()=>setFloatMsg(null),2200);};
  const handleUpdateQty=(id,qty)=>setCartItems(prev=>prev.map(i=>i.id===id?{...i,qty}:i));
  const handleRemoveFromCart=id=>setCartItems(prev=>prev.filter(i=>i.id!==id));
  const handleProfileClick=()=>{if(!user){setAuthGateOpen(true);return;}navigate(user?.user_metadata?.role==='seller'?'/seller-profile':'/profile');};
  useEffect(()=>{if(location.state?.openCart){setCartOpen(true);navigate('/products',{replace:true,state:{}});}},[location.state,navigate]);
  const handleLogout=async()=>{await logout();navigate('/login',{replace:true});};
  const getCategoryCount=id=>id==='all'?allProducts.length:allProducts.filter(p=>p.category===id).length;
  const categoriesWithCounts=CATEGORIES.map(c=>({...c,count:getCategoryCount(c.id)}));
  const featuredProducts=allProducts.slice(0,8);
  const newArrivals=[...allProducts].reverse().slice(0,8);
  const topDeals=allProducts.filter(p=>p.price<2000).slice(0,8);
  const hotDealProducts = useMemo(() => allProducts.filter(p => p.discountedPrice || p.lowStock).slice(0, 10), [allProducts]);

  // Top banner ad (only one, not dismissed)
  const topBannerAd = DUMMY_ADS.find(a => a.type === 'banner' && !dismissedAds.includes(a.id));

  return(
    <div style={{minHeight:'100vh',background:`linear-gradient(180deg,${C.primaryPale} 0%,${C.surfaceDim} 25%,white 100%)`,fontFamily:"'Manrope',sans-serif",display:'flex',flexDirection:'column'}}>

      <UnderDevelopmentBanner onEnter={() => setPageLoading(false)} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes wordFadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}
        @keyframes pulseBadge{0%,100%{box-shadow:0 2px 8px rgba(220,38,38,0.4)}50%{box-shadow:0 2px 18px rgba(220,38,38,0.7)}}
        @keyframes bounceIn{0%{opacity:0;transform:scale(0.7) translateY(20px)}60%{opacity:1;transform:scale(1.06) translateY(-4px)}100%{transform:scale(1) translateY(0)}}
        @keyframes catIn{from{opacity:0;transform:translateY(14px) scale(0.9)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes shimCat{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}
        @keyframes locPing{0%{transform:scale(1);opacity:1}100%{transform:scale(2.2);opacity:0}}
        @keyframes ldSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes floatUpMsg{0%{opacity:0;transform:translateX(-50%) translateY(20px)}15%{opacity:1;transform:translateX(-50%) translateY(0)}80%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-16px)}}
        @keyframes modalIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.88)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        @keyframes slideInPreview{from{opacity:0;transform:translateY(-10px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes shimFeedback{0%{background-position:0% 50%}100%{background-position:200% 50%}}
        @keyframes feedStep{from{opacity:0;transform:translateY(12px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes popIn{0%{opacity:0;transform:scale(0.5) rotate(-15deg)}60%{transform:scale(1.15) rotate(5deg)}100%{opacity:1;transform:scale(1) rotate(0deg)}}
        @keyframes triggerPulse{0%{transform:scale(1);opacity:1}100%{transform:scale(1.6);opacity:0}}
        @keyframes particleBurst{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(calc(cos(var(--angle)) * var(--dist)),calc(sin(var(--angle)) * var(--dist) * -1)) scale(0)}}
        .hide-scrollbar::-webkit-scrollbar{height:0;width:0;display:none;}
        .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}
        .cat-track::-webkit-scrollbar{height:0;}.cat-track{-ms-overflow-style:none;scrollbar-width:none;}
        .product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px;width:100%;}
        @media(max-width:640px){.product-grid{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}}
        @media(max-width:380px){.product-grid{gap:8px!important;}}
        @media(max-width:720px){.product-grid{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}}
        @media(max-width:768px){.desk-act{display:none!important;}.mob-menu{display:flex!important;}}
        @media(max-width:640px){.hero-banner{padding:24px 20px!important;}.hero-icons{display:none!important;}}
      `}</style>

      {floatMsg&&<div style={{position:'fixed',bottom:32,left:'50%',zIndex:9999,background:floatMsg.type==='danger'?'linear-gradient(135deg,#dc2626,#ef4444)':'linear-gradient(135deg,#c84b11,#f97316)',color:'white',padding:'12px 22px',borderRadius:50,fontSize:13,fontWeight:800,whiteSpace:'nowrap',boxShadow:'0 12px 40px rgba(200,75,17,0.45)',animation:'floatUpMsg 2.2s ease both',pointerEvents:'none',display:'flex',alignItems:'center',gap:8}}>
        {floatMsg.type==='danger'?<Icon name="error" size={16}/>:<svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>}
        {floatMsg.text}
      </div>}

      {cartOpen&&<CartPage cartItems={cartItems} onUpdateQty={handleUpdateQty} onRemove={handleRemoveFromCart} onClose={()=>setCartOpen(false)} isAuthed={!!user} onRequireAuth={handleRequireAuth}/>}
      <AuthGateModal open={authGateOpen} onClose={()=>setAuthGateOpen(false)} navigate={navigate}/>
      <MobileAuthPrompt open={mobileAuthPromptOpen} onClose={()=>setMobileAuthPromptOpen(false)} navigate={navigate}/>
      {feedbackOpen && <FeedbackBox onClose={() => setFeedbackOpen(false)} />}
      {!feedbackOpen && !cartOpen && <FeedbackTrigger onClick={() => setFeedbackOpen(true)} />}

      <ResponsiveHeader headerVisible={headerVisible} setIsSidebarOpen={setIsSidebarOpen} navigate={navigate} setLocationModalOpen={setLocationModalOpen} selectedLocation={selectedLocation} handleProfileClick={handleProfileClick} cartCount={cartCount} setCartOpen={setCartOpen} user={user} handleLogout={handleLogout} isMobile={isMobile}/>

      {/* Sidebar */}
      <div onClick={()=>setIsSidebarOpen(false)} style={{position:'fixed',inset:0,background:'rgba(26,10,0,0.45)',zIndex:60,opacity:isSidebarOpen?1:0,pointerEvents:isSidebarOpen?'all':'none',transition:'opacity 0.3s'}}/>
      <aside style={{position:'fixed',top:0,left:0,height:'100%',width:260,background:'white',zIndex:70,transform:isSidebarOpen?'translateX(0)':'translateX(-100%)',transition:'transform 0.32s cubic-bezier(0.4,0,0.2,1)',boxShadow:`6px 0 32px rgba(200,75,17,0.1)`,display:'flex',flexDirection:'column',padding:'24px 16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
          <div style={{display:'flex',alignItems:'center',gap:8,color:C.primary}}><LogoIcon size={32}/><span style={{fontWeight:900,fontSize:17,color:C.text}}>BagSearch</span></div>
          <button onClick={()=>setIsSidebarOpen(false)} style={{padding:8,borderRadius:9,border:'none',background:C.primaryBg,cursor:'pointer',color:C.primary,fontSize:16}}>✕</button>
        </div>
        {(user?[{label:'Profile',icon:'person',action:()=>{handleProfileClick();setIsSidebarOpen(false);}},{label:'Cart',icon:'shopping_cart',action:()=>{setCartOpen(true);setIsSidebarOpen(false);}},{label:'Feedback',icon:'rate_review',action:()=>{setFeedbackOpen(true);setIsSidebarOpen(false);}},{label:'Logout',icon:'logout',action:()=>{handleLogout();setIsSidebarOpen(false);}}]:[{label:'Login',icon:'login',action:()=>{navigate('/login');setIsSidebarOpen(false);}},{label:'Register',icon:'person_add',action:()=>{navigate('/register');setIsSidebarOpen(false);}},{label:'Cart',icon:'shopping_cart',action:()=>{setCartOpen(true);setIsSidebarOpen(false);}},{label:'Feedback',icon:'rate_review',action:()=>{setFeedbackOpen(true);setIsSidebarOpen(false);}}]).map(({icon,label,action})=>(
          <button key={label} onClick={action} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,border:'none',background:label==='Logout'?'#fef2f2':'transparent',cursor:'pointer',color:label==='Logout'?C.danger:C.text,fontSize:15,fontWeight:600,marginBottom:4,textAlign:'left',transition:'all 0.18s'}}
            onMouseEnter={e=>{e.currentTarget.style.background=label==='Logout'?C.dangerBg:C.primaryBg;e.currentTarget.style.transform='translateX(4px)';e.currentTarget.style.color=label==='Logout'?C.danger:C.primary;}} onMouseLeave={e=>{e.currentTarget.style.background=label==='Logout'?'#fef2f2':'transparent';e.currentTarget.style.transform='none';e.currentTarget.style.color=label==='Logout'?C.danger:C.text;}}>
            <Icon name={icon} size={20}/>{label}
          </button>
        ))}
      </aside>

      <LocationModal isOpen={locationModalOpen} onClose={()=>setLocationModalOpen(false)} selectedLocation={selectedLocation} onSelect={handleLocationChange}/>

      <div style={{flex:1,maxWidth:1280,margin:'0 auto',width:'100%',padding:isMobile?'24px 12px 80px':'36px 20px 80px'}}>

        {/* Hero */}
        <div style={{marginBottom:isMobile?24:30,opacity:heroVisible?1:0,transform:heroVisible?'translateY(0)':'translateY(20px)',transition:'opacity 0.55s ease,transform 0.55s cubic-bezier(0.22,1,0.36,1)'}}>
          <div className="hero-banner" style={{background:C.primaryBg,borderRadius:isMobile?16:24,padding:isMobile?'24px 20px':'34px 38px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:20,border:`1.5px solid ${C.primaryBorder}`,position:'relative',overflow:'hidden',boxShadow:`0 8px 32px rgba(200,75,17,0.1)`}}>
            <div style={{position:'absolute',right:-40,top:-40,width:200,height:200,borderRadius:'50%',background:'rgba(200,75,17,0.07)',filter:'blur(20px)'}}/>
            <div style={{position:'relative',width:isMobile?'100%':'auto'}}>
              <h1 style={{fontSize:isMobile?'clamp(1.4rem,5vw,1.8rem)':'clamp(1.7rem,4vw,2.4rem)',fontWeight:900,color:C.text,letterSpacing:'-0.04em',lineHeight:1.2,marginBottom:10}}>
                Find Your{' '}
                <br style={{display:isMobile?'block':'none'}}/>
                <span style={{color:C.primary,display:'inline-block',minWidth:isMobile?'8ch':'10ch',opacity:heroWordVisible?1:0,transform:heroWordVisible?'translateY(0)':'translateY(5px)',transition:'opacity 0.3s ease, transform 0.3s ease'}}>
                  {heroWord}
                </span>
              </h1>
              <p style={{color:C.textMuted,fontSize:isMobile?13:15,fontWeight:500,lineHeight:1.6,maxWidth:isMobile?'100%':380}}>
                Search bags or browse vendors — discover luxury across Nigeria
              </p>
              {selectedLocation.id!=='all'&&
                <span style={{display:'inline-flex',alignItems:'center',gap:5,marginTop:10,fontSize:isMobile?11:12,fontWeight:700,background:'white',color:C.primary,border:`1px solid ${C.primaryBorder}`,padding:isMobile?'3px 10px':'4px 12px',borderRadius:20,animation:'scaleIn 0.3s ease both'}}>
                  {selectedLocation.emoji} {selectedLocation.name}
                </span>
              }
            </div>
            <div className="hero-icons" style={{display:isMobile?'none':'flex',gap:12,position:'relative'}}>
              <div style={{width:62,height:62,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 4px 16px rgba(200,75,17,0.15)`,border:`2px solid ${C.primaryBorder}`}}>
                <img src={shoppingBagImg} alt="" style={{width:38,height:38,objectFit:'contain'}}/>
              </div>
              {['👝','🛍️'].map((e,i)=>(<div key={i} style={{width:62,height:62,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,boxShadow:`0 4px 16px rgba(200,75,17,0.15)`,border:`2px solid ${C.primaryBorder}`,transform:`translateY(${i%2===0?-8:0}px)`}}>{e}</div>))}
            </div>
          </div>
        </div>

        {/* Tab + Search */}
        <div style={{marginBottom:isMobile?20:26,opacity:searchVisible?1:0,transition:'opacity 0.5s ease'}}>
          <div style={{display:'inline-flex',background:'white',border:`1.5px solid ${C.border}`,borderRadius:isMobile?12:16,padding:5,gap:4,boxShadow:`0 2px 10px rgba(200,75,17,0.07)`,marginBottom:16,width:isMobile?'100%':'auto'}}>
            {[{id:'products',label:'👜 Products',count:allProducts.length},{id:'vendors',label:'🏪 Vendors',count:vendors.length}].map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{flex:isMobile?1:'none',padding:isMobile?'8px 12px':'9px 18px',borderRadius:isMobile?8:11,border:'none',cursor:'pointer',fontWeight:800,fontSize:isMobile?12:13,transition:'all 0.3s cubic-bezier(0.34,1.2,0.64,1)',background:activeTab===tab.id?'linear-gradient(135deg,#c84b11,#f97316)':'transparent',color:activeTab===tab.id?'white':C.textMuted,boxShadow:activeTab===tab.id?'0 4px 16px rgba(200,75,17,0.4)':'none',transform:activeTab===tab.id?'scale(1.02)':'scale(1)',display:'flex',alignItems:'center',justifyContent:'center',gap:isMobile?4:7}}>
                {tab.label}
                <span style={{fontSize:10,fontWeight:800,background:activeTab===tab.id?'rgba(255,255,255,0.25)':C.primaryBg,color:activeTab===tab.id?'white':C.primary,padding:'1px 7px',borderRadius:20,border:activeTab===tab.id?'1px solid rgba(255,255,255,0.3)':`1px solid ${C.primaryBorder}`}}>{tab.count}</span>
              </button>
            ))}
          </div>

          {activeTab==='products'?(
            <div style={{display:'flex',alignItems:'center',background:'white',border:`1.5px solid ${searchFocused?C.primary:C.border}`,borderRadius:isMobile?12:16,padding:isMobile?'10px 12px':'12px 16px',gap:isMobile?8:10,boxShadow:searchFocused?`0 0 0 4px rgba(200,75,17,0.1),0 4px 18px rgba(0,0,0,0.04)`:`0 2px 10px rgba(0,0,0,0.03)`,transition:'all 0.25s'}}>
              <svg style={{width:isMobile?18:20,height:isMobile?18:20,color:searchFocused?C.primary:C.textFaint,flexShrink:0,transition:'color 0.25s'}} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"/></svg>
              <input type="text" placeholder={isMobile?"Search bags...":"Search bags by name, material, or seller…"} value={searchQuery} onChange={e=>handleSearch(e.target.value)} onFocus={()=>setSearchFocused(true)} onBlur={()=>setSearchFocused(false)} style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:isMobile?13:14,color:C.text,fontFamily:'inherit',fontWeight:500}}/>
              {isFiltered&&<button onClick={handleClearSearch} style={{width:isMobile?22:26,height:isMobile?22:26,borderRadius:'50%',border:'none',background:C.primaryBg,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:isMobile?12:13,color:C.primary,flexShrink:0}}>✕</button>}
              <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImageUpload}/>
              <button onClick={()=>fileInputRef.current.click()} style={{width:isMobile?34:38,height:isMobile?34:38,borderRadius:isMobile?8:10,border:'none',background:'linear-gradient(135deg,#c84b11,#f97316)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,transition:'all 0.2s',boxShadow:'0 4px 12px rgba(200,75,17,0.35)'}}>
                <svg style={{width:isMobile?14:16,height:isMobile?14:16}} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/></svg>
              </button>
            </div>
          ):(
            <div style={{display:'flex',alignItems:'center',background:'white',border:`1.5px solid ${vendorSearchFocused?C.primary:C.border}`,borderRadius:isMobile?12:16,padding:isMobile?'10px 12px':'12px 16px',gap:isMobile?8:10,boxShadow:vendorSearchFocused?`0 0 0 4px rgba(200,75,17,0.1),0 4px 18px rgba(0,0,0,0.04)`:`0 2px 10px rgba(0,0,0,0.03)`,transition:'all 0.3s'}}>
              <svg style={{width:isMobile?18:20,height:isMobile?18:20,color:vendorSearchFocused?C.primary:C.textFaint,flexShrink:0}} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"/></svg>
              <input type="text" placeholder={isMobile?"Search vendors...":"Search vendors by name, specialty or tag…"} value={vendorSearch} onChange={e=>handleVendorSearch(e.target.value)} onFocus={()=>setVendorSearchFocused(true)} onBlur={()=>setVendorSearchFocused(false)} style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:isMobile?13:14,color:C.text,fontFamily:'inherit',fontWeight:500}}/>
              {vendorSearch&&<button onClick={()=>handleVendorSearch('')} style={{border:'none',background:'none',cursor:'pointer',fontSize:13,color:C.textFaint}}>✕</button>}
              <div style={{fontSize:isMobile?11:12,fontWeight:700,color:C.primary,background:C.primaryBg,border:`1px solid ${C.primaryBorder}`,padding:isMobile?'4px 10px':'5px 12px',borderRadius:20,whiteSpace:'nowrap'}}>{filteredVendors.length} vendors</div>
            </div>
          )}
          {uploadedImage&&activeTab==='products'&&<div style={{marginTop:12,display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:C.primaryBg,border:`1px solid ${C.primaryBorder}`,borderRadius:12,animation:'slideInPreview 0.35s ease both'}}>
            <img src={uploadedImage} alt="" style={{width:48,height:48,objectFit:'cover',borderRadius:8}}/>
            <div style={{flex:1}}><p style={{fontSize:13,fontWeight:700,color:C.primary}}>Image uploaded</p><p style={{fontSize:11,color:C.textMuted}}>Showing visually similar bags</p></div>
            <button onClick={handleClearSearch} style={{fontSize:12,color:C.primary,fontWeight:700,background:'none',border:'none',cursor:'pointer'}}>Remove</button>
          </div>}
        </div>

        {/* PRODUCTS TAB */}
        {activeTab==='products'&&<>
          <div style={{marginBottom:isMobile?20:26,opacity:catVisible?1:0,transform:catVisible?'translateY(0)':'translateY(18px)',transition:'opacity 0.5s ease,transform 0.5s cubic-bezier(0.22,1,0.36,1)'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}><div style={{width:18,height:2.5,background:`linear-gradient(90deg,${C.primary},${C.primaryLight})`,borderRadius:2}}/><span style={{fontSize:11,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:C.textFaint}}>Browse by Category</span></div>
            <div className="cat-track" style={{display:'flex',gap:9,overflowX:'auto',paddingBottom:6,paddingTop:4}}>
              {categoriesWithCounts.map((cat,i)=>(<CategoryPill key={cat.id} cat={cat} isActive={activeCategory===cat.id} onClick={()=>handleCategoryChange(cat.id)} index={i} count={cat.count}/>))}
            </div>
            <div style={{marginTop:10,height:2,background:C.borderLight,borderRadius:2,overflow:'hidden',position:'relative'}}>
              {(()=>{const idx=CATEGORIES.findIndex(c=>c.id===activeCategory);const cat=CATEGORIES[idx];return <div style={{position:'absolute',left:`${(idx/CATEGORIES.length)*100}%`,width:`${100/CATEGORIES.length}%`,height:'100%',background:cat?.color||C.primary,borderRadius:2,transition:'left 0.4s cubic-bezier(0.34,1.56,0.64,1)'}}/>;})()}
            </div>
          </div>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:isMobile?16:20,flexWrap:'wrap',gap:10,opacity:searchVisible?1:0,transition:'opacity 0.5s ease 0.1s'}}>
            <div><h2 style={{fontSize:isMobile?16:18,fontWeight:800,color:C.text,marginBottom:2,letterSpacing:'-0.02em'}}>{selectedVendor?`${selectedVendor.avatar} ${selectedVendor.name}`:isFiltered?(activeCategory!=='all'?CATEGORIES.find(c=>c.id===activeCategory)?.label:'Search Results'):'All Bags'}</h2><p style={{fontSize:isMobile?11:12,color:C.textFaint,fontWeight:500}}>{displayedProducts.length} {displayedProducts.length===1?'item':'items'} found{selectedLocation.id!=='all'&&` in ${selectedLocation.name}`}</p></div>
            <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
              {activeCategory!=='all'&&(()=>{const cat=CATEGORIES.find(c=>c.id===activeCategory);return <button onClick={()=>handleCategoryChange('all')} style={{background:cat.bg,color:cat.color,border:`1px solid ${cat.border}`,padding:'4px 12px',borderRadius:20,fontSize:isMobile?10:11,fontWeight:700,cursor:'pointer'}}>{cat.icon} {cat.label} ✕</button>;})()}
              {selectedLocation.id!=='all'&&<button onClick={()=>handleLocationChange(NIGERIAN_LOCATIONS[0])} style={{background:C.primaryBg,color:C.primary,border:`1px solid ${C.primaryBorder}`,padding:'4px 12px',borderRadius:20,fontSize:isMobile?10:11,fontWeight:700,cursor:'pointer'}}>{selectedLocation.emoji} {selectedLocation.name} ✕</button>}
              {isFiltered&&<button onClick={handleClearSearch} style={{background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',padding:'4px 12px',borderRadius:20,fontSize:isMobile?10:11,fontWeight:700,cursor:'pointer'}}>Clear All</button>}
            </div>
          </div>

          {/* Top Banner Ad — shown only in unfiltered browsing */}
          {!isFiltered && topBannerAd && (
            <AdBanner ad={topBannerAd} onDismiss={id => setDismissedAds(prev => [...prev, id])} />
          )}

          <div style={{position:'relative',minHeight:visualSearching?'300px':'auto'}}>
            {visualSearching&&(
              <div style={{position:'absolute',inset:0,zIndex:10,background:'rgba(255,255,255,0.7)',backdropFilter:'blur(4px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:20,animation:'fadeIn 0.3s ease both'}}>
                <div style={{width:48,height:48,borderRadius:'50%',border:`3px solid ${C.border}`,borderTopColor:C.primary,animation:'ldSpin 0.8s linear infinite',marginBottom:16}}/>
                <h3 style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:4}}>Searching...</h3>
                <p style={{fontSize:13,color:C.textMuted,fontWeight:500}}>Analyzing your image for matching bags</p>
              </div>
            )}
            {displayedProducts.length>0
              ? <ProductGridWithAds
                  products={displayedProducts}
                  navigate={navigate}
                  onAddToCart={handleAddToCart}
                  isAuthed={!!user}
                  onRequireAuth={()=>setAuthGateOpen(true)}
                  resultsKey={resultsKey}
                />
              :<div style={{textAlign:'center',padding:'80px 20px',animation:'bounceIn 0.6s ease both'}}>
                <div style={{fontSize:56,marginBottom:16}}>🔍</div>
                <h3 style={{fontSize:20,fontWeight:800,color:C.text,marginBottom:8}}>No bags found</h3>
                <p style={{color:C.textMuted,marginBottom:24,fontSize:14}}>Try adjusting your search or browse all bags</p>
                <button onClick={handleClearSearch} style={{padding:'11px 24px',background:'linear-gradient(135deg,#c84b11,#f97316)',color:'white',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14}}>View All Bags</button>
              </div>}
          </div>

          {!isFiltered&&displayedProducts.length>0&&(
            <div style={{marginTop:isMobile?40:60,borderTop:`1px solid ${C.borderLight}`,paddingTop:isMobile?36:52}}>
              {hotDealProducts.length > 0 && (
                <HotDealsCarousel products={hotDealProducts} navigate={navigate} onAddToCart={handleAddToCart} isAuthed={!!user} onRequireAuth={()=>setAuthGateOpen(true)}/>
              )}
              <HorizontalSection title="Featured Picks" subtitle="Handpicked by our style team just for you" icon="⭐" accentColor={C.primary} accentBg={C.primaryBg} products={featuredProducts} navigate={navigate} onAddToCart={handleAddToCart} isAuthed={!!user} onRequireAuth={()=>setAuthGateOpen(true)} badge="Featured" badgeColor={C.primary} onSeeAll={()=>handleCategoryChange('all')}/>
              <HorizontalSection title="New Arrivals" subtitle="Fresh styles added to our collection" icon="✨" accentColor="#be185d" accentBg="#fdf2f8" products={newArrivals} navigate={navigate} onAddToCart={handleAddToCart} isAuthed={!!user} onRequireAuth={()=>setAuthGateOpen(true)} badge="New" badgeColor="#be185d" onSeeAll={()=>handleCategoryChange('all')}/>
              {topDeals.length>0&&<HorizontalSection title="Under ₦2,000" subtitle="Amazing bags that won't break the bank" icon="💸" accentColor="#15803d" accentBg="#dcfce7" products={topDeals} navigate={navigate} onAddToCart={handleAddToCart} isAuthed={!!user} onRequireAuth={()=>setAuthGateOpen(true)} badge="Budget Pick" badgeColor="#15803d" onSeeAll={()=>handleCategoryChange('all')}/>}
              <div style={{borderRadius:isMobile?16:20,background:'linear-gradient(135deg,#1a0a00 0%,#4a1a06 60%,#c84b11 100%)',padding:isMobile?'24px 20px':'32px 36px',display:'flex',flexDirection:isMobile?'column':'row',alignItems:isMobile?'flex-start':'center',justifyContent:'space-between',gap:20,marginBottom:48,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',inset:0,opacity:0.08,backgroundImage:'radial-gradient(circle at 25% 50%,white 1px,transparent 1px)',backgroundSize:'28px 28px'}}/>
                <div style={{position:'relative'}}>
                  <p style={{fontSize:isMobile?10:11,fontWeight:800,letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(255,255,255,0.55)',marginBottom:8}}>Exclusive Offer</p>
                  <h3 style={{fontSize:isMobile?'clamp(1.1rem,4vw,1.4rem)':'clamp(1.3rem,3vw,1.9rem)',fontWeight:900,color:'white',letterSpacing:'-0.03em',lineHeight:1.2,marginBottom:10}}>Sell Your Bags on BagSearch<br/><span style={{color:'#f97316'}}>Reach 10,000+ Buyers</span></h3>
                  <p style={{fontSize:isMobile?12:13,color:'rgba(255,255,255,0.6)',fontWeight:500,maxWidth:isMobile?'100%':360}}>Join Nigeria's fastest-growing bag marketplace. Free to list, zero commission on first 30 days.</p>
                </div>
                <button onClick={()=>navigate('/register')} style={{position:'relative',padding:isMobile?'12px 24px':'14px 28px',background:'linear-gradient(135deg,#f97316,#c84b11)',color:'white',border:'none',borderRadius:isMobile?12:14,fontWeight:900,fontSize:isMobile?13:14,cursor:'pointer',boxShadow:'0 8px 28px rgba(200,75,17,0.5)',transition:'all 0.3s',whiteSpace:'nowrap',width:isMobile?'100%':'auto'}}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='none';}}>
                  Start Selling Free →
                </button>
              </div>
            </div>
          )}
        </>}

        {/* VENDORS TAB */}
        {activeTab==='vendors'&&<div>
          <div style={{marginBottom:22}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><div style={{width:18,height:2.5,background:`linear-gradient(90deg,${C.primary},${C.primaryLight})`,borderRadius:2}}/><span style={{fontSize:11,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:C.textFaint}}>Our Sellers</span></div>
            <h2 style={{fontSize:isMobile?20:22,fontWeight:900,color:C.text,letterSpacing:'-0.03em',marginBottom:4}}>Meet Our Vendors</h2>
            <p style={{fontSize:isMobile?12:13,color:C.textMuted,fontWeight:500}}>Trusted sellers with thousands of happy customers across Nigeria</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:28}}>
            {[{l:'Total Vendors',v:47,i:'🏪',c:C.primary,bg:C.primaryBg,b:C.primaryBorder},{l:'Products',v:1240,i:'👜',c:'#92400e',bg:'#fef3c7',b:'#fde68a'},{l:'Happy Buyers',v:8900,i:'😊',c:'#15803d',bg:'#dcfce7',b:'#a7f3d0'},{l:'Reviews',v:5620,i:'⭐',c:'#c2410c',bg:'#ffedd5',b:'#fed7aa'}].map(s=>(
              <div key={s.l} style={{background:'white',borderRadius:16,padding:'14px 16px',border:`1.5px solid ${s.b}`,display:'flex',alignItems:'center',gap:10,boxShadow:`0 4px 14px ${s.c}12`}}>
                <div style={{width:38,height:38,borderRadius:11,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{s.i}</div>
                <div><div style={{fontSize:18,fontWeight:900,color:s.c,letterSpacing:'-0.02em',lineHeight:1}}><AnimatedCount value={s.v}/></div><div style={{fontSize:10,color:C.textFaint,fontWeight:700,marginTop:2}}>{s.l}</div></div>
              </div>
            ))}
          </div>
          {filteredVendors.length>0
            ?<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:isMobile?16:20}}>{filteredVendors.map((v,i)=>(<VendorCard key={v.id} vendor={v} index={i} onViewProducts={handleViewVendorProducts}/>))}</div>
            :<div style={{textAlign:'center',padding:'80px 20px',animation:'bounceIn 0.6s ease both'}}><div style={{fontSize:56,marginBottom:16}}>🏪</div><h3 style={{fontSize:20,fontWeight:800,color:C.text,marginBottom:8}}>No vendors found</h3><button onClick={()=>handleVendorSearch('')} style={{marginTop:8,padding:'11px 24px',background:'linear-gradient(135deg,#c84b11,#f97316)',color:'white',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14}}>See All Vendors</button></div>}
        </div>}

        {activeTab==='vendorDetail'&&selectedVendorDetail&&<div>
          <VendorDetailView vendor={selectedVendorDetail} onClose={()=>{ setSelectedVendorDetail(null); setActiveTab('vendors'); }} allProducts={allProducts} navigate={navigate} onAddToCart={handleAddToCart} isAuthed={!!user} onRequireAuth={()=>setAuthGateOpen(true)}/>
        </div>}
      </div>

      {/* ─── SITE FOOTER ─── */}
      <SiteFooter navigate={navigate} user={user} handleLogout={handleLogout} />
    </div>
  );
}

// ─── Vendor Card ──────────────────────────────────────────────────────────────
function VendorCard({vendor,index,onViewProducts}){
  const[hov,setHov]=useState(false);const[ref,setRef]=useState(null);const[vis,setVis]=useState(false);
  useEffect(()=>{if(!ref)return;const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setVis(true);o.disconnect();}},{threshold:0.08});o.observe(ref);return()=>o.disconnect();},[ref]);
  const loc=NIGERIAN_LOCATIONS.find(l=>l.id===vendor.location);
  return(
    <div ref={setRef} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:'white',borderRadius:20,overflow:'hidden',position:'relative',border:`1.5px solid ${hov?C.primaryBorder:C.borderLight}`,boxShadow:hov?`0 24px 60px rgba(200,75,17,0.13),0 4px 16px rgba(0,0,0,0.05)`:'0 2px 10px rgba(0,0,0,0.04)',opacity:vis?1:0,transform:vis?'translateY(0) scale(1)':'translateY(28px) scale(0.97)',transition:`opacity 0.55s cubic-bezier(0.22,1,0.36,1) ${(index%3)*100}ms,transform 0.55s cubic-bezier(0.22,1,0.36,1) ${(index%3)*100}ms,box-shadow 0.3s,border-color 0.3s`}}>
      <div style={{height:84,background:`linear-gradient(135deg,${vendor.colors[0]},${vendor.colors[1]})`,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,opacity:0.1,backgroundImage:'radial-gradient(circle at 20% 50%,white 1px,transparent 1px)',backgroundSize:'22px 22px'}}/>
        {vendor.badge==='Top Rated'&&<div style={{position:'absolute',top:12,right:12,background:'rgba(255,255,255,0.22)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.35)',borderRadius:20,padding:'3px 10px',fontSize:10,fontWeight:800,color:'white',letterSpacing:'0.05em'}}>⭐ Top Rated</div>}
      </div>
      <div style={{position:'absolute',top:50,left:18,width:60,height:60,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,boxShadow:'0 4px 14px rgba(0,0,0,0.1)',border:'3px solid white',transition:'transform 0.3s',transform:hov?'scale(1.1)':'scale(1)'}}>{vendor.avatar}</div>
      <div style={{padding:'12px 18px 18px',paddingTop:20}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:6,marginTop:16}}>
          <div>
            <h3 style={{fontSize:16,fontWeight:900,color:C.text,letterSpacing:'-0.02em',marginBottom:2}}>{vendor.name}</h3>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <span style={{fontSize:11}}>{loc?.emoji}</span><span style={{fontSize:11,color:C.textFaint,fontWeight:500}}>{loc?.name}</span>
              <span style={{width:3,height:3,borderRadius:'50%',background:C.border,display:'inline-block'}}/>
              <span style={{fontSize:11,color:C.textFaint,fontWeight:500}}>Since {vendor.joined}</span>
            </div>
          </div>
          <div style={{textAlign:'right',flexShrink:0}}><StarRating rating={vendor.rating} size={11}/><div style={{fontSize:13,fontWeight:900,color:C.primary,marginTop:3}}>{vendor.rating}</div></div>
        </div>
        <p style={{fontSize:12,color:C.textMuted,lineHeight:1.65,marginBottom:13,fontWeight:500,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{vendor.description}</p>
        <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:14}}>
          {vendor.tags.map(tag=>(<span key={tag} style={{fontSize:10,fontWeight:700,background:C.primaryBg,color:C.primary,border:`1px solid ${C.primaryBorder}`,padding:'3px 9px',borderRadius:20}}>{tag}</span>))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:15}}>
          {[{label:'Views',value:vendor.views,icon:'👁️'},{label:'Reviews',value:vendor.reviews,icon:'⭐'},{label:'Products',value:vendor.products,icon:'👜'}].map(s=>(
            <div key={s.label} style={{background:C.surfaceDim,borderRadius:11,padding:'9px 6px',textAlign:'center',border:`1px solid ${C.borderLight}`,transition:'all 0.25s',transform:hov?'translateY(-2px)':'none'}}>
              <div style={{fontSize:14,marginBottom:2}}>{s.icon}</div>
              <div style={{fontSize:13,fontWeight:900,color:C.text,letterSpacing:'-0.02em',lineHeight:1}}><AnimatedCount value={s.value}/></div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.textFaint,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
        <button onClick={()=>onViewProducts(vendor)} style={{width:'100%',padding:'11px 0',borderRadius:12,border:'none',background:hov?`linear-gradient(135deg,${vendor.colors[0]},${vendor.colors[1]})`:'linear-gradient(135deg,#c84b11,#f97316)',color:'white',fontWeight:800,fontSize:13,cursor:'pointer',transition:'all 0.3s',boxShadow:hov?`0 8px 22px ${vendor.colors[0]}55`:'0 4px 12px rgba(200,75,17,0.3)',transform:hov?'translateY(-1px)':'none'}}>
          View Products →
        </button>
      </div>
    </div>
  );
}

// ─── Vendor Detail View ────────────────────────────────────────────────────────
function VendorDetailView({ vendor, onClose, allProducts, navigate, onAddToCart, isAuthed, onRequireAuth }) {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [views, setViews] = useState([]);
  const [totalViewsCount, setTotalViewsCount] = useState(0);
  const [viewsLoading, setViewsLoading] = useState(false);
  const vendorProducts = useMemo(
    () => allProducts.filter(p => p.sellerId === vendor.id || p.seller_id === vendor.id),
    [allProducts, vendor.id]
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const { data: profileData } = await supabase.from('users').select('brand_name, brand_story, bag_categories, avatar_url, full_name, phone').eq('user_id', vendor.id).maybeSingle();
        if (profileData) setProfile(profileData);
        const { data: reviewData } = await supabase.from('seller_reviews').select('id, author_name, rating, text, created_at').eq('seller_id', vendor.id).order('created_at', { ascending: false }).limit(20);
        if (reviewData) setReviews(reviewData);
        
        // Fetch views for vendor's products
        await fetchVendorViews();
      } catch (err) { console.error('Failed to load vendor data:', err); }
      finally { setLoading(false); }
    }
    loadData();
  }, [vendor.id]);

  const fetchVendorViews = async () => {
    if (vendorProducts.length === 0) {
      setTotalViewsCount(0);
      setViews([]);
      return;
    }
    
    try {
      setViewsLoading(true);
      const productIds = vendorProducts.map(p => p.id).filter(Boolean);
      
      const { data: viewsData, count: viewsCount, error: viewsError } = await supabase
        .from('product_views')
        .select(`
          id,
          viewed_at,
          source,
          buyer_name,
          buyer_phone,
          buyer_email,
          products:product_id(id, name, images),
          users:buyer_id(full_name, email, phone)
        `, { count: 'exact' })
        .in('product_id', productIds)
        .order('viewed_at', { ascending: false })
        .limit(20);
      
      if (!viewsError) {
        setTotalViewsCount(viewsCount || 0);
        setViews(viewsData || []);
      } else {
        console.error('Error fetching vendor views:', viewsError);
        setTotalViewsCount(0);
        setViews([]);
      }
    } catch (err) {
      console.error('Failed to fetch vendor views:', err);
      setTotalViewsCount(0);
      setViews([]);
    } finally {
      setViewsLoading(false);
    }
  };

  const authorName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous';

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    setSubmittingReview(true);
    try {
      const { data, error } = await supabase.from('seller_reviews').insert({ seller_id: vendor.id, author_name: authorName, rating: newRating, text: newReviewText.trim() }).select().single();
      if (!error && data) setReviews(prev => [data, ...prev]);
      setNewReviewText(''); setNewRating(5);
    } catch (err) { console.error('Failed to post review:', err); }
    finally { setSubmittingReview(false); }
  };

  const displayName = profile?.brand_name || profile?.full_name || vendor.name;
  const displayAvatar = profile?.avatar_url
    ? <img src={profile.avatar_url} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} alt="Avatar" />
    : <span style={{fontSize:48}}>🏪</span>;
  const displayStory = profile?.brand_story || null;
  const displayCategories = profile?.bag_categories || [];
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;

  return (
    <div style={{ animation:'fadeIn 0.4s ease', paddingBottom:40 }}>
      <button onClick={onClose} style={{ marginBottom:16,background:'none',border:'none',color:'#c84b11',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6,padding:'8px 12px',borderRadius:8,transition:'background 0.2s' }}
        onMouseEnter={e=>e.currentTarget.style.background='#fdf4ee'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
        <Icon name="arrow_back" size={18} /> Back to Vendors
      </button>
      <div style={{ background:'white',borderRadius:24,padding:'32px 40px',border:'1.5px solid #f9c4a0',marginBottom:32,display:'flex',gap:24,alignItems:'flex-start',boxShadow:'0 8px 32px rgba(200,75,17,0.06)',flexWrap:'wrap' }}>
        <div style={{ width:100,height:100,borderRadius:'50%',background:'#fdf4ee',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',boxShadow:'0 4px 16px rgba(0,0,0,0.08)',flexShrink:0 }}>{displayAvatar}</div>
        <div style={{ flex:1, minWidth:200 }}>
          <h2 style={{ fontSize:28,fontWeight:900,color:'#1a0a00',marginBottom:4,letterSpacing:'-0.02em' }}>{displayName}</h2>
          <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:12,flexWrap:'wrap' }}>
            {avgRating && <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:13,fontWeight:800,color:'#f97316',background:'#fff5f2',padding:'4px 10px',borderRadius:20 }}><Icon name="star" size={16}/> {avgRating} ({reviews.length} review{reviews.length!==1?'s':''})</span>}
            <span style={{ fontSize:13,color:'#c84b11',fontWeight:800,background:'#fdf4ee',padding:'4px 10px',borderRadius:20 }}>{vendorProducts.length} Product{vendorProducts.length!==1?'s':''}</span>
            <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:13,fontWeight:800,color:'#3b82f6',background:'#eff6ff',padding:'4px 10px',borderRadius:20 }}>
              <Icon name="visibility" size={16}/> {totalViewsCount} View{totalViewsCount!==1?'s':''}
            </span>
          </div>
          {displayStory ? <p style={{ fontSize:14,color:'#5c3317',lineHeight:1.6,maxWidth:600 }}>{displayStory}</p> : <p style={{ fontSize:13,color:'#c4957a',fontStyle:'italic' }}>No brand story added yet.</p>}
          {displayCategories.length > 0 && <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginTop:12 }}>{displayCategories.map(cat => (<span key={cat} style={{ fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:'#fde8d8',color:'#c84b11',border:'1px solid #f9c4a0' }}>{cat}</span>))}</div>}
        </div>
      </div>
      <h3 style={{ fontSize:20,fontWeight:800,color:'#1a0a00',marginBottom:16 }}>Products from {displayName}</h3>
      <div className="product-grid" style={{ marginBottom:40 }}>
        {vendorProducts.length > 0 ? vendorProducts.map((p,i) => (<ProductCard key={p.id} product={p} index={i} navigate={navigate} onAddToCart={onAddToCart} isAuthed={isAuthed} onRequireAuth={onRequireAuth} />)) : <p style={{ color:'#9a6348' }}>No products available yet.</p>}
      </div>
      
      {/* Recent Views Section */}
      <div style={{ background:'white',borderRadius:24,padding:'32px 40px',border:'1.5px solid #f0d9cc',marginBottom:32 }}>
        <h3 style={{ fontSize:20,fontWeight:800,color:'#1a0a00',marginBottom:24 }}>Recent Product Views</h3>
        {viewsLoading ? (
          <div style={{ textAlign:'center',padding:'40px 0',color:'#9a6348' }}>
            <div style={{ display:'inline-block',width:24,height:24,border:'2px solid #f0d9cc',borderTopColor:'#c84b11',borderRadius:'50%',animation:'ldSpin 0.8s linear infinite',marginBottom:12 }}></div>
            <p style={{ fontSize:13 }}>Loading views...</p>
          </div>
        ) : views.length === 0 ? (
          <p style={{ color:'#9a6348',fontSize:13,textAlign:'center',padding:'24px 0' }}>No product views yet.</p>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
            {views.map(view => {
              const buyerName = view.users?.full_name || view.buyer_name || 'Anonymous Buyer';
              const buyerEmail = view.users?.email || view.buyer_email;
              const buyerPhone = view.users?.phone || view.buyer_phone;
              const productName = view.products?.name || 'Unknown Product';
              const productImage = view.products?.images?.[0];
              
              return (
                <div key={view.id} style={{ 
                  padding:'16px 20px', 
                  background:'#fdf8f5', 
                  borderRadius:16, 
                  border:'1px solid #f0d9cc',
                  display:'flex',
                  gap:16,
                  alignItems:'center'
                }}>
                  {/* Product Image */}
                  {productImage ? (
                    <img 
                      src={productImage} 
                      alt={productName}
                      style={{ 
                        width:60, 
                        height:60, 
                        borderRadius:12, 
                        objectFit:'cover',
                        flexShrink:0
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width:60, 
                      height:60, 
                      borderRadius:12, 
                      background:'#f0d9cc',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      flexShrink:0,
                      fontSize:24
                    }}>👜</div>
                  )}
                  
                  {/* View Details */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                      <span style={{ 
                        fontSize:14, 
                        fontWeight:800, 
                        color:'#1a0a00' 
                      }}>{buyerName}</span>
                      <span style={{ 
                        fontSize:11, 
                        color:'#9a6348', 
                        background:'#f0d9cc', 
                        padding:'2px 8px', 
                        borderRadius:12 
                      }}>{view.source || 'web'}</span>
                    </div>
                    <div style={{ fontSize:13,color:'#5c3317',marginBottom:2 }}>
                      viewed <strong>{productName}</strong>
                    </div>
                    <div style={{ fontSize:12,color:'#9a6348' }}>
                      {new Date(view.viewed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {(buyerEmail || buyerPhone) && (
                      <div style={{ display:'flex',gap:12,marginTop:4 }}>
                        {buyerEmail && (
                          <span style={{ fontSize:11,color:'#9a6348' }}>
                            📧 {buyerEmail}
                          </span>
                        )}
                        {buyerPhone && (
                          <span style={{ fontSize:11,color:'#9a6348' }}>
                            📞 {buyerPhone}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {views.length > 0 && (
              <div style={{ textAlign:'center',padding:'16px 0' }}>
                <span style={{ fontSize:12,color:'#9a6348',fontStyle:'italic' }}>
                  Showing {Math.min(views.length, 20)} of {totalViewsCount} total views
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div style={{ background:'white',borderRadius:24,padding:'32px 40px',border:'1.5px solid #f7ece4' }}>
        <h3 style={{ fontSize:20,fontWeight:800,color:'#1a0a00',marginBottom:24 }}>Reviews & Comments</h3>
        <form onSubmit={handleSubmitReview} style={{ background:'#fdf8f5',padding:24,borderRadius:16,marginBottom:32,border:'1px solid #f0d9cc' }}>
          <h4 style={{ fontSize:15,fontWeight:800,color:'#1a0a00',marginBottom:12 }}>Write a Review</h4>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
            <span style={{ fontSize:13,fontWeight:700,color:'#5c3317' }}>Rating:</span>
            {[1,2,3,4,5].map(star=>(<button key={star} type="button" onClick={()=>setNewRating(star)} style={{ background:'none',border:'none',cursor:'pointer',padding:0 }}><Icon name="star" size={24} style={{ color:star<=newRating?'#f97316':'#f0d9cc' }}/></button>))}
          </div>
          <textarea value={newReviewText} onChange={e=>setNewReviewText(e.target.value)} placeholder="Share your experience with this seller..." style={{ width:'100%',padding:16,borderRadius:12,border:'1.5px solid #f0d9cc',background:'white',minHeight:100,resize:'vertical',fontSize:14,fontFamily:'inherit',marginBottom:16,outline:'none',color:'#1a0a00' }}/>
          <button type="submit" disabled={submittingReview} style={{ padding:'12px 24px',background:'linear-gradient(135deg, #c84b11, #f97316)',color:'white',border:'none',borderRadius:10,fontWeight:800,fontSize:14,cursor:submittingReview?'default':'pointer',opacity:submittingReview?0.7:1 }}>
            {submittingReview ? 'Posting…' : 'Post Review'}
          </button>
        </form>
        <div>
          {reviews.length === 0
            ? <p style={{ color:'#c4957a',fontSize:13,textAlign:'center',padding:'24px 0' }}>No reviews yet. Be the first!</p>
            : reviews.map(r=>(
            <div key={r.id} style={{ padding:'20px 0',borderBottom:'1px solid #f7ece4' }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <div style={{ width:36,height:36,borderRadius:'50%',background:'#fdf4ee',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#c84b11',fontSize:14 }}>{(r.author_name||'A').charAt(0)}</div>
                  <div>
                    <div style={{ fontWeight:800,color:'#1a0a00',fontSize:13 }}>{r.author_name || 'Anonymous'}</div>
                    <div style={{ fontSize:11,color:'#9a6348',fontWeight:600 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : ''}</div>
                  </div>
                </div>
                <div style={{ display:'flex',gap:2 }}>{[1,2,3,4,5].map(star=>(<Icon key={star} name="star" size={14} style={{ color:star<=r.rating?'#f97316':'#f0d9cc' }}/>))}</div>
              </div>
              <p style={{ fontSize:14,color:'#5c3317',lineHeight:1.6,paddingLeft:46 }}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}