import React, {
  useState, useEffect, useCallback, useMemo,
  useRef, useContext,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { supabase } from './services/api';
import { buildWhatsAppUrl, normalizeWhatsAppNumber } from './utils/whatsapp';
import { productPath } from './utils/slugify';
import { useSEO, SITE_URL } from './hooks/useSEO';
import { getOptimizedImageUrl, IMG_SIZES } from './utils/imageUtils';

/* ─── DESIGN TOKENS ─────────────────────────────────────────────────────── */
const T = {
  bg:           '#fdf4ee',
  bgPanel:      '#fde8d8',
  bgCard:       '#ffffff',
  bgCardHov:    '#fff7f2',
  ink:          '#1a0a00',
  inkMid:       '#5c3317',
  inkFaint:     '#9a6348',
  gold:         '#c84b11',
  goldLight:    '#f97316',
  goldDim:      '#fde8d8',
  flame:        '#ea580c',
  flameDim:     '#fff5f2',
  success:      '#16a34a',
  successDim:   '#dcfce7',
  danger:       '#dc2626',
  dangerDim:    '#fef2f2',
  border:       '#f0d9cc',
  borderMid:    '#f9c4a0',
  borderHov:    '#c84b1155',
};

const BAG_COLOR_MAP = {
  black:'#1A1A1A', white:'#F5F5F0', beige:'#D4B896', camel:'#C19A6B', tan:'#A67C52',
  brown:'#6B3F2A', burgundy:'#722F37', red:'#CC2200', pink:'#E8A0A0', blush:'#F2C4B8',
  orange:'#E8762B', yellow:'#E8C84A', olive:'#808000', green:'#2D6A3F', mint:'#98D8C8',
  teal:'#2A7A7A', navy:'#1A2E5A', blue:'#2255CC', cobalt:'#0047AB', purple:'#6A2D8F',
  lavender:'#B8A0D8', grey:'#888888', silver:'#C0C0C0', gold:'#CFB53B',
};

const fmt  = (v) => `₦${Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const pad  = (n) => String(n).padStart(2, '0');
const pct  = (p) => p.discountedPrice ? Math.round((1 - p.discountedPrice / p.price) * 100) : 0;

/* ─── ICONS ─────────────────────────────────────────────────────────────── */
const Ic = {
  Left: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  Right: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Cart: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  X: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Star: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Fire: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5 0-2.49 2.01-4.5 4.5-4.5s4.5 2.01 4.5 4.5c0 2.49-2.01 4.5-4.5 4.5z"/>
    </svg>
  ),
  ArrowUp: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
    </svg>
  ),
  Tag: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
};

const WaIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

/* ─── HOOKS ──────────────────────────────────────────────────────────────── */
function useReveal(threshold = 0.08) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useParallax(speed = 0.04) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handle = (e) => {
      const { clientX, clientY } = e;
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      const dx = (clientX - cx) * speed, dy = (clientY - cy) * speed;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, [speed]);
  return ref;
}

/* ─── SKELETON ───────────────────────────────────────────────────────────── */
function Skeleton({ h = 360, borderRadius = 16 }) {
  return (
    <div style={{ height: h, borderRadius, background: T.bgCard, overflow: 'hidden', position: 'relative', border: `1px solid ${T.border}` }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)`,
        animation: 'shimmer 1.8s ease-in-out infinite',
      }} />
    </div>
  );
}

/* ─── HERO FEATURED CARD (big spotlight) ────────────────────────────────── */
function SpotlightCard({ product: p, onAddToCart, isAdded, isAuthed, onRequireAuth, navigate }) {
  const [hov, setHov] = useState(false);
  const disc = pct(p);
  const isLow = (p.quantity ?? 0) > 0 && (p.quantity ?? 0) < 5;

  const waHref = (() => {
    const num = normalizeWhatsAppNumber(p.whatsapp || '');
    if (!num) return '';
    const link = `${window.location.origin}/products/${p.id}`;
    return buildWhatsAppUrl(num, `Hi! I'm interested in *${p.name}*\n${fmt(p.discountedPrice || p.price)}\n${link}`);
  })();

  return (
    <a
      href={productPath(p.name, p.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={(e) => { e.preventDefault(); navigate(productPath(p.name, p.id)); }}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        position: 'relative',
        borderRadius: 24,
        overflow: 'hidden',
        cursor: 'pointer',
        background: T.bgCard,
        border: `1px solid ${hov ? T.gold + '55' : T.borderMid}`,
        transition: 'border-color 0.4s, box-shadow 0.4s',
        boxShadow: hov
          ? `0 0 60px rgba(200,75,17,0.1), 0 20px 60px rgba(0,0,0,0.1)`
          : '0 4px 20px rgba(0,0,0,0.08)',
      }}
    >
      {/* Image — no dark overlay, no brightness filter */}
      <div style={{ position: 'relative', height: 380, overflow: 'hidden' }}>
        <img
          src={getOptimizedImageUrl(p.src, IMG_SIZES.hero.width, IMG_SIZES.hero.height)}
          alt={p.brand ? `${p.brand} ${p.name} — luxury bag Nigeria` : `${p.name} — luxury bag Nigeria`}
          loading="lazy" decoding="async" width={IMG_SIZES.hero.width} height={IMG_SIZES.hero.height}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transition: 'transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)',
            transform: hov ? 'scale(1.05)' : 'scale(1)',
          }}
          onError={e => { e.target.src = 'https://via.placeholder.com/500x380/fde8d8/c84b11?text=Featured'; }}
        />

        {/* Subtle bottom gradient only for text legibility on badges */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
          background: 'linear-gradient(to top, rgba(255,255,255,0.18), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Top badges */}
        <div style={{ position: 'absolute', top: 18, left: 18, display: 'flex', gap: 8, zIndex: 5 }}>
          {disc > 0 && (
            <span style={{
              background: T.gold, color: '#fff',
              fontSize: 11, fontWeight: 900, padding: '5px 14px',
              borderRadius: 100, letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: '0 2px 8px rgba(200,75,17,0.3)',
            }}>
              <Ic.Tag /> -{disc}% OFF
            </span>
          )}
          {isLow && (
            <span style={{
              background: T.dangerDim, color: T.danger,
              fontSize: 10, fontWeight: 700, padding: '5px 12px',
              borderRadius: 100, border: `1px solid ${T.danger}44`,
              display: 'flex', alignItems: 'center', gap: 5,
              backdropFilter: 'blur(8px)',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.danger, animation: 'blink 1.2s infinite' }} />
              Only {p.quantity} left
            </span>
          )}
        </div>

        {/* View pill on hover */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hov ? 1 : 0, transition: 'opacity 0.35s', zIndex: 6,
          pointerEvents: 'none',
          background: 'rgba(253,244,238,0.25)',
          backdropFilter: hov ? 'blur(2px)' : 'none',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
            border: `1px solid ${T.gold}55`,
            color: T.gold, fontSize: 11, fontWeight: 700, letterSpacing: '0.25em',
            textTransform: 'uppercase', padding: '10px 24px', borderRadius: 100,
            display: 'flex', alignItems: 'center', gap: 8,
            transform: hov ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
            transition: 'transform 0.35s',
            boxShadow: '0 4px 20px rgba(200,75,17,0.15)',
          }}>
            View Product <Ic.ArrowUp />
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '22px 24px 24px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.gold, marginBottom: 6 }}>{p.seller}</p>
        <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 16, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h3>

        {/* Colors */}
        {(p.colors || []).length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, alignItems: 'center' }}>
            {(p.colors || []).slice(0, 7).map((c, i) => (
              <span key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c.hex || T.gold, border: `1.5px solid ${T.borderMid}`, boxShadow: `0 0 0 1px ${T.border}`, display: 'inline-block' }} />
            ))}
            {(p.colors || []).length > 7 && <span style={{ fontSize: 9, color: T.inkFaint, fontWeight: 700 }}>+{p.colors.length - 7}</span>}
          </div>
        )}

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            {p.discountedPrice && (
              <span style={{ fontSize: 12, color: T.inkFaint, textDecoration: 'line-through', display: 'block', marginBottom: 2, fontWeight: 500 }}>{fmt(p.price)}</span>
            )}
            <span style={{ fontSize: 26, fontWeight: 800, color: disc > 0 ? T.gold : T.ink, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {fmt(p.discountedPrice || p.price)}
            </span>
          </div>
          {disc > 0 && (
            <div style={{
              background: T.goldDim, border: `1px solid ${T.gold}33`,
              padding: '6px 14px', borderRadius: 10, textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: T.inkFaint, fontWeight: 500 }}>You save</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.gold }}>{fmt((p.price || 0) - (p.discountedPrice || p.price))}</div>
            </div>
          )}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={e => { e.stopPropagation(); onAddToCart(p); }}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 14, cursor: 'pointer',
              fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
              background: isAdded ? T.successDim : T.gold,
              color: isAdded ? T.success : '#fff',
              border: isAdded ? `1px solid ${T.success}44` : 'none',
              transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              transform: isAdded ? 'scale(0.97)' : 'scale(1)',
              letterSpacing: '0.01em',
            }}
          >
            {isAdded ? <><Ic.Check /> In Cart</> : <><Ic.Cart /> Add to Cart</>}
          </button>

          <a
            href={waHref} target="_blank" rel="noopener noreferrer"
            onClick={e => {
              if (!isAuthed) { e.preventDefault(); e.stopPropagation(); onRequireAuth?.(); return; }
              const num = normalizeWhatsAppNumber(p.whatsapp || '');
              if (!num) { e.preventDefault(); e.stopPropagation(); alert('Seller WhatsApp missing.'); return; }
              e.stopPropagation();
            }}
            style={{
              width: 48, minWidth: 48, height: 48, borderRadius: 14, cursor: 'pointer', textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: T.successDim, color: T.success,
              border: `1px solid ${T.success}33`,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.success; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.successDim; e.currentTarget.style.color = T.success; }}
          >
            <WaIcon size={16} />
          </a>
        </div>
      </div>
    </a>
  );
}

/* ─── GRID CARD ──────────────────────────────────────────────────────────── */
function GridCard({ product: p, navigate, onAddToCart, isAdded, isAuthed, onRequireAuth, index, isMobile }) {
  const [ref, vis] = useReveal(0.07);
  const [hov, setHov] = useState(false);
  const disc = pct(p);
  const isLow = (p.quantity ?? 0) > 0 && (p.quantity ?? 0) < 5;

  // Responsive image height: shorter on mobile so the card isn't too tall
  const imgHeight = isMobile ? 150 : 200;

  const waHref = (() => {
    const num = normalizeWhatsAppNumber(p.whatsapp || '');
    if (!num) return '';
    const link = `${window.location.origin}/products/${p.id}`;
    return buildWhatsAppUrl(num, `Hi! I'm interested in *${p.name}*\n${fmt(p.discountedPrice || p.price)}\n${link}`);
  })();

  return (
    <a
      href={productPath(p.name, p.id)}
      ref={ref}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={(e) => { e.preventDefault(); navigate(productPath(p.name, p.id)); }}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        background: T.bgCard,
        borderRadius: 18,
        border: `1px solid ${hov ? T.gold + '44' : T.border}`,
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: vis ? 1 : 0,
        transform: vis ? (hov ? 'translateY(-6px)' : 'translateY(0)') : 'translateY(28px)',
        transition: `opacity 0.55s ease ${(index % 6) * 70}ms, transform 0.55s ease ${(index % 6) * 70}ms, border-color 0.3s, box-shadow 0.3s`,
        boxShadow: hov
          ? `0 16px 40px rgba(200,75,17,0.1), 0 4px 12px rgba(0,0,0,0.06)`
          : '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Image — clean, no dark filter */}
      <div style={{ position: 'relative', height: imgHeight, overflow: 'hidden', background: T.bgPanel }}>
        <img
          src={getOptimizedImageUrl(p.src, IMG_SIZES.card.width, IMG_SIZES.card.height)}
          alt={p.brand ? `${p.brand} ${p.name} — buy in Nigeria` : `${p.name} — buy in Nigeria`}
          loading="lazy" decoding="async" width={IMG_SIZES.card.width} height={IMG_SIZES.card.height}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transition: 'transform 0.7s ease',
            transform: hov ? 'scale(1.06)' : 'scale(1)',
          }}
          onError={e => { e.target.src = `https://via.placeholder.com/300x${imgHeight}/fde8d8/c84b11?text=${encodeURIComponent(p.name)}`; }}
        />

        {/* Badges only — no gradient darkening */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5, zIndex: 5 }}>
          {disc > 0 && (
            <span style={{
              background: T.gold, color: '#fff',
              fontSize: 9, fontWeight: 900, padding: '3px 9px',
              borderRadius: 100, letterSpacing: '0.06em',
              boxShadow: '0 2px 6px rgba(200,75,17,0.35)',
            }}>-{disc}%</span>
          )}
          {isLow && (
            <span style={{
              background: T.dangerDim, color: T.danger,
              fontSize: 8.5, fontWeight: 700, padding: '3px 9px',
              borderRadius: 100, border: `1px solid ${T.danger}44`,
              display: 'flex', alignItems: 'center', gap: 4,
              backdropFilter: 'blur(6px)',
            }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.danger, animation: 'blink 1.2s infinite' }} />
              Low stock
            </span>
          )}
        </div>

        {/* Hover overlay — light frosted instead of dark */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6,
          opacity: hov ? 1 : 0, transition: 'opacity 0.3s', pointerEvents: 'none',
          background: 'rgba(253,244,238,0.3)',
          backdropFilter: hov ? 'blur(1px)' : 'none',
        }}>
          <span style={{
            background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
            border: `1px solid ${T.gold}55`, color: T.gold,
            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
            padding: '6px 16px', borderRadius: 100,
            boxShadow: '0 2px 12px rgba(200,75,17,0.12)',
          }}>View →</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: isMobile ? '10px 10px 12px' : '14px 14px 14px' }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gold, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.seller}</p>
        <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: isMobile ? 13 : 14, color: T.ink, marginBottom: 6, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h3>

        {/* Price — moved to body (no longer overlaid on image) */}
        <div style={{ marginBottom: 10 }}>
          {p.discountedPrice && <div style={{ fontSize: 9.5, color: T.inkFaint, textDecoration: 'line-through', fontWeight: 500 }}>{fmt(p.price)}</div>}
          <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, color: disc > 0 ? T.gold : T.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>{fmt(p.discountedPrice || p.price)}</div>
        </div>

        {/* Color dots */}
        {(p.colors || []).length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 10, alignItems: 'center' }}>
            {(p.colors || []).slice(0, 5).map((c, i) => (
              <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c.hex || T.gold, border: `1px solid ${T.borderMid}`, display: 'inline-block' }} />
            ))}
            {(p.colors || []).length > 5 && <span style={{ fontSize: 9, color: T.inkFaint, fontWeight: 700 }}>+{p.colors.length - 5}</span>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={e => { e.stopPropagation(); onAddToCart(p); }}
            style={{
              flex: 1, padding: isMobile ? '8px 8px' : '9px 10px', borderRadius: 11, cursor: 'pointer',
              fontWeight: 700, fontSize: 11, fontFamily: 'inherit',
              background: isAdded ? T.successDim : T.goldDim,
              color: isAdded ? T.success : T.gold,
              border: `1px solid ${isAdded ? T.success + '44' : T.gold + '33'}`,
              transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
            onMouseEnter={e => { if (!isAdded) { e.currentTarget.style.background = T.gold; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = T.gold; } }}
            onMouseLeave={e => { if (!isAdded) { e.currentTarget.style.background = T.goldDim; e.currentTarget.style.color = T.gold; e.currentTarget.style.borderColor = T.gold + '33'; } }}
          >
            {isAdded ? <><Ic.Check /> Added</> : <><Ic.Cart /> Grab</>}
          </button>

          <a
            href={waHref} target="_blank" rel="noopener noreferrer"
            onClick={e => {
              if (!isAuthed) { e.preventDefault(); e.stopPropagation(); onRequireAuth?.(); return; }
              const num = normalizeWhatsAppNumber(p.whatsapp || '');
              if (!num) { e.preventDefault(); e.stopPropagation(); alert('Seller WhatsApp missing.'); return; }
              e.stopPropagation();
            }}
            style={{
              width: 36, minWidth: 36, borderRadius: 11, textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: T.successDim, color: T.success,
              border: `1px solid ${T.success}33`, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.success; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.successDim; e.currentTarget.style.color = T.success; }}
          >
            <WaIcon size={13} />
          </a>
        </div>
      </div>
    </a>
  );
}

/* ─── SPECIAL PRODUCTS ROW (horizontal, large) ────────────────────────────── */
function SpecialCard({ product: p, navigate, onAddToCart, isAdded, isAuthed, onRequireAuth, index }) {
  const [hov, setHov] = useState(false);
  const disc = pct(p);
  const isLow = (p.quantity ?? 0) > 0 && (p.quantity ?? 0) < 5;

  const waHref = (() => {
    const num = normalizeWhatsAppNumber(p.whatsapp || '');
    if (!num) return '';
    const link = `${window.location.origin}/products/${p.id}`;
    return buildWhatsAppUrl(num, `Hi! I'm interested in *${p.name}*\n${fmt(p.discountedPrice || p.price)}\n${link}`);
  })();

  return (
    <a
      href={productPath(p.name, p.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={(e) => { e.preventDefault(); navigate(productPath(p.name, p.id)); }}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        flexShrink: 0,
        width: 260,
        borderRadius: 20,
        overflow: 'hidden',
        background: T.bgCard,
        border: `1px solid ${hov ? T.flame + '66' : T.borderMid}`,
        cursor: 'pointer',
        transition: 'border-color 0.3s, box-shadow 0.4s, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hov ? 'translateY(-8px) scale(1.01)' : 'translateY(0) scale(1)',
        boxShadow: hov
          ? `0 0 40px rgba(234,88,12,0.1), 0 20px 50px rgba(0,0,0,0.1)`
          : '0 4px 16px rgba(0,0,0,0.06)',
        animationDelay: `${index * 80}ms`,
        animation: 'cardSlideIn 0.6s cubic-bezier(0.22,1,0.36,1) both',
      }}
    >
      {/* Image — clean, full color */}
      <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
        <img
          src={getOptimizedImageUrl(p.src, IMG_SIZES.card.width, IMG_SIZES.card.height)}
          alt={p.brand ? `${p.brand} ${p.name} — luxury bag` : `${p.name} — luxury bag`}
          loading="lazy" decoding="async" width={IMG_SIZES.card.width} height={IMG_SIZES.card.height}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transition: 'transform 0.8s ease',
            transform: hov ? 'scale(1.08)' : 'scale(1)',
          }}
          onError={e => { e.target.src = 'https://via.placeholder.com/260x240/fde8d8/ea580c?text=Special'; }}
        />

        {/* Top badges */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 5 }}>
          <span style={{
            background: `linear-gradient(135deg, ${T.flame}, #FF8C42)`,
            color: 'white', fontSize: 9.5, fontWeight: 900,
            padding: '4px 12px', borderRadius: 100, letterSpacing: '0.08em',
            display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: '0 2px 8px rgba(234,88,12,0.4)',
          }}>
            ✦ SPECIAL
          </span>
          {disc > 0 && <span style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', color: T.flame, fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 100, border: `1px solid ${T.flame}44` }}>-{disc}% off</span>}
          {isLow && <span style={{ background: T.dangerDim, color: T.danger, fontSize: 8.5, fontWeight: 700, padding: '3px 9px', borderRadius: 100, border: `1px solid ${T.danger}44`, display: 'flex', alignItems: 'center', gap: 4, backdropFilter: 'blur(6px)' }}><span style={{ width: 4, height: 4, borderRadius: '50%', background: T.danger, animation: 'blink 1.2s infinite' }} />Only {p.quantity} left</span>}
        </div>

        {/* Hover overlay — frosted light */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
          padding: 14, zIndex: 5,
          opacity: hov ? 1 : 0, transition: 'opacity 0.3s',
          background: hov ? 'rgba(253,244,238,0.2)' : 'transparent',
          backdropFilter: hov ? 'blur(1px)' : 'none',
          pointerEvents: 'none',
        }}>
          <span style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', color: T.flame, fontSize: 9, fontWeight: 700, padding: '5px 12px', borderRadius: 100, border: `1px solid ${T.flame}44`, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Shop →</span>
        </div>
      </div>

      {/* Body — price moved here for clarity without overlay */}
      <div style={{ padding: '14px 16px 16px' }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.flame, marginBottom: 4 }}>{p.seller}</p>
        <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 15, color: T.ink, marginBottom: 8, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h3>

        {/* Price in body */}
        <div style={{ marginBottom: 14 }}>
          {p.discountedPrice && <div style={{ fontSize: 10, color: T.inkFaint, textDecoration: 'line-through', fontWeight: 500 }}>{fmt(p.price)}</div>}
          <div style={{ fontSize: 22, fontWeight: 800, color: disc > 0 ? T.flame : T.ink, letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(p.discountedPrice || p.price)}</div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={e => { e.stopPropagation(); onAddToCart(p); }}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
              fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
              background: isAdded ? T.successDim : `linear-gradient(135deg, ${T.flame}, #FF8C42)`,
              color: isAdded ? T.success : 'white',
              border: isAdded ? `1px solid ${T.success}44` : 'none',
              transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {isAdded ? <><Ic.Check /> Added</> : <><Ic.Cart /> Add to Cart</>}
          </button>

          <a
            href={waHref} target="_blank" rel="noopener noreferrer"
            onClick={e => {
              if (!isAuthed) { e.preventDefault(); e.stopPropagation(); onRequireAuth?.(); return; }
              const num = normalizeWhatsAppNumber(p.whatsapp || '');
              if (!num) { e.preventDefault(); e.stopPropagation(); alert('Seller WhatsApp missing.'); return; }
              e.stopPropagation();
            }}
            style={{
              width: 40, minWidth: 40, height: 40, borderRadius: 12, textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: T.successDim, color: T.success,
              border: `1px solid ${T.success}33`, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.success; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.successDim; e.currentTarget.style.color = T.success; }}
          >
            <WaIcon size={14} />
          </a>
        </div>
      </div>
    </a>
  );
}

/* ─── HORIZONTAL SCROLL STRIP ────────────────────────────────────────────── */
function HorizScroll({ children, loading, skeletonCount = 4, skeletonH = 380 }) {
  const trackRef   = useRef(null);
  const isDragging = useRef(false);
  const startX     = useRef(0);
  const scrollL    = useRef(0);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };
  const scroll = d => trackRef.current?.scrollBy({ left: d * 300, behavior: 'smooth' });

  const onMouseDown = e => {
    isDragging.current = true;
    startX.current = e.pageX;
    scrollL.current = trackRef.current.scrollLeft;
    trackRef.current.style.cursor = 'grabbing';
  };
  const onMouseMove = e => {
    if (!isDragging.current) return;
    trackRef.current.scrollLeft = scrollL.current - (e.pageX - startX.current) * 1.2;
  };
  const onMouseUp = () => {
    isDragging.current = false;
    if (trackRef.current) trackRef.current.style.cursor = 'grab';
  };

  const ArrowBtn = ({ dir, onClick, style }) => (
    <button
      onClick={onClick}
      style={{
        position: 'absolute', top: '42%', transform: 'translateY(-50%)',
        zIndex: 20, width: 44, height: 44, borderRadius: '50%',
        background: T.bgCard, border: `1px solid ${T.borderMid}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: T.inkMid,
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        transition: 'all 0.2s', ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = T.gold; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = T.gold; }}
      onMouseLeave={e => { e.currentTarget.style.background = T.bgCard; e.currentTarget.style.color = T.inkMid; e.currentTarget.style.borderColor = T.borderMid; }}
    >
      {dir === 'left' ? <Ic.Left /> : <Ic.Right />}
    </button>
  );

  return (
    <div style={{ position: 'relative' }}>
      {canLeft  && <ArrowBtn dir="left"  onClick={() => scroll(-1)} style={{ left: -22 }} />}
      {canRight && <ArrowBtn dir="right" onClick={() => scroll(1)}  style={{ right: -22 }} />}

      <div
        ref={trackRef}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onScroll={updateArrows}
        style={{
          display: 'flex', gap: 16, overflowX: 'auto', overflowY: 'visible',
          paddingBottom: 24, paddingTop: 8,
          scrollbarWidth: 'none', msOverflowStyle: 'none', cursor: 'grab',
        }}
      >
        {loading
          ? Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} style={{ flexShrink: 0, width: 260 }}><Skeleton h={skeletonH} /></div>
            ))
          : children}
      </div>

      {canLeft  && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 24, width: 80, background: `linear-gradient(to right, ${T.bg}, transparent)`, pointerEvents: 'none', zIndex: 10 }} />}
      {canRight && <div style={{ position: 'absolute', right: 0, top: 0, bottom: 24, width: 80, background: `linear-gradient(to left, ${T.bg}, transparent)`, pointerEvents: 'none', zIndex: 10 }} />}
    </div>
  );
}

/* ─── SECTION HEADER ─────────────────────────────────────────────────────── */
function SectionHeader({ label, title, accent = T.gold, right }) {
  const [ref, vis] = useReveal(0.1);
  return (
    <div ref={ref} style={{
      marginBottom: 28,
      opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(16px)',
      transition: 'opacity 0.6s ease, transform 0.6s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>{label}</p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700, color: T.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{title}</h2>
        </div>
        {right && <div>{right}</div>}
      </div>
      <div style={{ height: 1, background: `linear-gradient(to right, ${accent}66, transparent)`, marginTop: 20 }} />
    </div>
  );
}

/* ─── COUNTDOWN DISPLAY ──────────────────────────────────────────────────── */
function CountdownBlock({ h, m, s }) {
  const Block = ({ val, label }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        background: T.bgCard, border: `1px solid ${T.borderMid}`,
        borderRadius: 12, padding: '12px 16px', minWidth: 58,
        fontFamily: "'Playfair Display', serif",
        fontSize: 28, fontWeight: 700, color: T.gold,
        letterSpacing: '-0.04em', lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        boxShadow: `0 0 20px rgba(200,75,17,0.06) inset`,
      }}>{pad(val)}</div>
      <div style={{ fontSize: 8.5, fontWeight: 600, color: T.inkFaint, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 6 }}>{label}</div>
    </div>
  );
  const Sep = () => <div style={{ fontSize: 24, color: T.gold, fontWeight: 700, paddingBottom: 18, opacity: 0.5, animation: 'blink 1s ease infinite' }}>:</div>;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <Block val={h} label="Hours" />
      <Sep />
      <Block val={m} label="Mins" />
      <Sep />
      <Block val={s} label="Secs" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function HotDeals() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [allDeals, setAllDeals]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchQ, setSearchQ]     = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter]   = useState('all');
  const [addedSet, setAddedSet]   = useState(new Set());
  const [timeLeft, setTimeLeft]   = useState({ h: 0, m: 0, s: 0 });
  const [entered, setEntered]     = useState(false);
  const [floatMsg, setFloatMsg]   = useState(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const parallaxRef = useParallax(0.025);

  const isMobile = windowWidth <= 720;

  // SEO: Dynamic meta tags for Hot Deals page
  const seoTitle = 'Hot Deals & Discounted Bags | BagSearch Nigeria';
  const seoDescription = `Limited-time deals on authentic luxury bags. Up to 70% off on designer handbags, totes, clutches & more from verified sellers across Nigeria. Shop hot sales before they sell out!`;
  const seoKeywords = 'hot deals, discounted bags, luxury bags sale, cheap luxury bags Nigeria, flash sale, bag deals, clearance bags, bargain bags,authentic bags on sale';

  useSEO({
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    url: '/hot-deals',
    type: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Hot Deals & Discounted Bags',
      description: seoDescription,
      url: `${SITE_URL}/hot-deals`,
      numberOfItems: filtered.length,
      itemListElement: filtered.slice(0, 20).map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${SITE_URL}${productPath(p.name, p.id)}`,
        item: {
          '@type': 'Product',
          name: p.name,
          description: p.description || 'Authentic luxury bag on sale',
          image: p.src,
          ...(p.brand && { brand: { '@type': 'Brand', name: p.brand } }),
          offers: {
            '@type': 'Offer',
            price: p.discountedPrice || p.price,
            priceCurrency: 'NGN',
            availability: 'https://schema.org/InStock',
            seller: { '@type': 'Person', name: p.seller },
          },
        }
      }))
    }
  });

  useEffect(() => {
    const h = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => { const t = setTimeout(() => setEntered(true), 80); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date(), mid = new Date();
      mid.setHours(24, 0, 0, 0);
      const d = Math.max(0, Math.floor((mid - now) / 1000));
      setTimeLeft({ h: Math.floor(d / 3600), m: Math.floor((d % 3600) / 60), s: d % 60 });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const mapCategory = useCallback(dbCat => {
    if (!dbCat) return 'all';
    const c = dbCat.toLowerCase();
    if (c.includes('tote'))      return 'tote';
    if (c.includes('clutch'))    return 'clutch';
    if (c.includes('crossbody')) return 'crossbody';
    if (c.includes('backpack'))  return 'backpack';
    if (c.includes('satchel'))   return 'satchel';
    if (c.includes('evening'))   return 'evening';
    if (c.includes('mini'))      return 'mini';
    return 'all';
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      let { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) {
        const retry = await supabase.from('products')
          .select('id,name,seller_name,user_id,brand,condition,description,price,location,images,created_at,category,whatsapp,discounted_price,discount_label,quantity,colors')
          .order('created_at', { ascending: false });
        if (retry.error) throw retry.error;
        data = retry.data;
      }
      return (data || []).map(p => {
        let rawColors = [];
        if (Array.isArray(p.colors)) rawColors = p.colors;
        else if (typeof p.colors === 'string') { try { rawColors = JSON.parse(p.colors); } catch { rawColors = [p.colors]; } }
        const colors = rawColors.map(c => {
          if (typeof c === 'string') { const k = c.toLowerCase().trim(); return { id: k, hex: BAG_COLOR_MAP[k] || T.gold }; }
          const k = String(c.id || '').toLowerCase().trim();
          return { id: k, hex: c.hex || BAG_COLOR_MAP[k] || T.gold };
        });
        const qty = p.quantity != null ? parseInt(p.quantity) : null;
        return {
          id: p.id, name: p.name, seller: p.seller_name || 'Anonymous Seller',
          price: parseFloat(p.price), quantity: qty,
          lowStock: qty != null && qty > 0 && qty < 5,
          category: mapCategory(p.category), colors,
          src: p.images?.length > 0 ? p.images[0] : 'https://via.placeholder.com/400',
          brand: p.brand || '', condition: p.condition || '', description: p.description || '',
          discountedPrice: p.discounted_price ? parseFloat(p.discounted_price) : null,
          discountLabel: p.discount_label || null, whatsapp: p.whatsapp || '',
        };
      });
    } catch (err) { console.error(err); return []; }
  }, [mapCategory]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchProducts().then(all => {
      if (!mounted) return;
      const deals = all.filter(p => p.discountedPrice || p.lowStock);
      setAllDeals(deals); setFiltered(deals); setLoading(false);
    }).catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [fetchProducts]);

  const applyFilters = useCallback((q, f, deals) => {
    let r = [...deals];
    if (q.trim()) { const lo = q.toLowerCase(); r = r.filter(p => p.name.toLowerCase().includes(lo) || (p.seller || '').toLowerCase().includes(lo)); }
    if (f === 'discount') r = r.filter(p => p.discountedPrice).sort((a,b) => pct(b) - pct(a));
    else if (f === 'low')    r = r.filter(p => p.lowStock);
    else if (f === '5k')     r = r.filter(p => (p.discountedPrice || p.price) < 5000);
    else if (f === 'special') r = r.filter(p => p.discountedPrice && pct(p) >= 20);
    return r;
  }, []);

  useEffect(() => { setFiltered(applyFilters(searchQ, activeFilter, allDeals)); }, [searchQ, activeFilter, allDeals, applyFilters]);

  const stats = useMemo(() => ({
    total:   allDeals.length,
    avgDisc: allDeals.length ? Math.round(allDeals.reduce((s, p) => s + pct(p), 0) / allDeals.length) : 0,
    lowCnt:  allDeals.filter(p => p.lowStock).length,
    specials: allDeals.filter(p => p.discountedPrice && pct(p) >= 20).length,
  }), [allDeals]);

  const handleAddToCart = p => {
    setAddedSet(prev => new Set([...prev, p.id]));
    setFloatMsg(`${p.name} added!`);
    setTimeout(() => setAddedSet(prev => { const n = new Set(prev); n.delete(p.id); return n; }), 1800);
    setTimeout(() => setFloatMsg(null), 2400);
  };

  const clearSearch = () => { setSearchQ(''); setActiveFilter('all'); };

  const FILTERS = [
    { id: 'all',      label: 'All Deals' },
    { id: 'special',  label: '✦ Specials' },
    { id: 'discount', label: 'Top Discounts' },
    { id: 'low',      label: 'Low Stock' },
    { id: '5k',       label: 'Under ₦5k' },
  ];

  // Section slices
  const spotlightDeal = filtered[0] || null;
  const specialDeals  = filtered.filter(p => p.discountedPrice && pct(p) >= 20).slice(0, 8);
  const hotDeals      = filtered.filter(p => !specialDeals.includes(p)).slice(0, 8);
  const gridDeals     = filtered.slice(8);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Sora', 'DM Sans', sans-serif", overflowX: 'hidden', color: T.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Sora:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes toastIn{0%{opacity:0;transform:translateX(-50%) translateY(20px) scale(0.9)}15%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}80%{opacity:1}100%{opacity:0;transform:translateX(-50%) translateY(-16px)}}
        @keyframes pageIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cardSlideIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes marqueeScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes orb{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.05)}66%{transform:translate(-20px,15px) scale(0.97)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(200,75,17,0.1)}50%{box-shadow:0 0 40px rgba(200,75,17,0.25)}}
        .deals-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;}
        @media(max-width:640px){.deals-grid{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}}
        .filt-pill{
          padding:8px 18px;border-radius:100px;
          border:1px solid ${T.border};background:transparent;
          color:${T.inkMid};font-size:12px;font-weight:600;font-family:inherit;
          cursor:pointer;transition:all 0.2s;white-space:nowrap;letter-spacing:0.02em;
        }
        .filt-pill:hover{border-color:${T.gold}55;color:${T.gold};}
        .filt-pill.active{background:${T.gold};color:#fff;border-color:${T.gold};}
        div::-webkit-scrollbar{display:none}
      `}</style>

      {/* ── AMBIENT ORBS ── */}
      <div ref={parallaxRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '8%', left: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,75,17,0.04) 0%, transparent 70%)', animation: 'orb 14s ease-in-out infinite', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '50%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(234,88,12,0.03) 0%, transparent 70%)', animation: 'orb 18s ease-in-out infinite reverse', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,75,17,0.03) 0%, transparent 70%)', animation: 'orb 22s ease-in-out infinite', filter: 'blur(40px)' }} />
      </div>

      {/* ── TOAST ── */}
      {floatMsg && (
        <div style={{
          position: 'fixed', bottom: 36, left: '50%', zIndex: 9999,
          background: T.bgCard, border: `1px solid ${T.gold}44`,
          backdropFilter: 'blur(20px)',
          color: T.gold, padding: '12px 24px',
          borderRadius: 100, fontSize: 13, fontWeight: 600,
          animation: 'toastIn 2.4s ease both', pointerEvents: 'none',
          display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
        }}>
          <Ic.Check /> {floatMsg}
        </div>
      )}

      {/* ── MARQUEE TICKER ── */}
      <div style={{
        background: T.gold, overflow: 'hidden', whiteSpace: 'nowrap',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{
          display: 'inline-flex', animation: 'marqueeScroll 22s linear infinite',
          padding: '9px 0',
        }}>
          {[...Array(4)].map((_, i) =>
            ['Flash Sale Today Only', '₦ — Deals Up To 70% Off', '✦ Low Stock Alert', '₦ — Direct Seller Contact', '✅ Verified Sellers', '✦ New Deals Daily'].map((t, j) => (
              <span key={`${i}-${j}`} style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase', paddingRight: 40 }}>
                {t}
              </span>
            ))
          )}
        </div>
      </div>

      <div style={{
        maxWidth: 1320, margin: '0 auto', width: '100%',
        padding: isMobile ? '32px 16px 100px' : '56px 48px 120px',
        position: 'relative', zIndex: 1,
        opacity: entered ? 1 : 0,
        transform: entered ? 'none' : 'translateY(20px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}>

        {/* ── TOP NAV ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 56, flexWrap: 'wrap', gap: 16 }}>
          <button
            onClick={() => navigate('/products')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: 100, cursor: 'pointer', color: T.inkMid,
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              padding: '9px 18px', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold + '55'; e.currentTarget.style.color = T.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.inkMid; }}
          >
            <Ic.Left /> All Bags
          </button>

          <CountdownBlock h={timeLeft.h} m={timeLeft.m} s={timeLeft.s} />
        </div>

        {/* ── HERO HEADLINE ── */}
        <div style={{ marginBottom: isMobile ? 52 : 76, maxWidth: 780 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: T.goldDim, border: `1px solid ${T.gold}44`,
            padding: '6px 16px', borderRadius: 100, marginBottom: 24,
            animation: 'fadeUp 0.7s ease 0.1s both',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.gold, animation: 'blink 1.5s ease infinite' }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: T.gold, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Flash Sale · Today Only</span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: isMobile ? 'clamp(2.4rem, 9vw, 3.2rem)' : 'clamp(3.5rem, 6vw, 5.5rem)',
            fontWeight: 700, color: T.ink,
            letterSpacing: '-0.04em', lineHeight: 1.04,
            marginBottom: 20,
            animation: 'fadeUp 0.7s ease 0.2s both',
          }}>
            Hot Deals on<br />
            <em style={{ fontStyle: 'italic', color: T.gold, position: 'relative' }}>
              Luxury Designer Bags
            </em>
          </h1>

          <p style={{
            fontSize: isMobile ? 14 : 16, color: T.inkMid,
            lineHeight: 1.7, maxWidth: 480,
            animation: 'fadeUp 0.7s ease 0.3s both',
          }}>
            Hand-picked discounts & low-stock bags from Nigeria's best sellers.
            <span style={{ color: T.inkFaint }}> Act fast — these won't last.</span>
          </p>
        </div>

        {/* ── STATS ROW ── */}
        {!loading && (
          <div style={{
            display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 2, marginBottom: isMobile ? 52 : 76,
            border: `1px solid ${T.borderMid}`, borderRadius: 20, overflow: 'hidden',
            animation: 'fadeUp 0.7s ease 0.4s both',
          }}>
            {[
              { label: 'Active Deals',  val: stats.total,   accent: T.gold },
              { label: 'Avg. Discount', val: `${stats.avgDisc}%`, accent: T.flame },
              { label: 'Low Stock',     val: stats.lowCnt,  accent: T.danger },
              { label: 'Specials',      val: stats.specials, accent: T.gold },
            ].map((s, i) => (
              <div key={s.label} style={{
                background: T.bgCard, padding: isMobile ? '20px 16px' : '28px 24px',
                textAlign: 'center', borderRight: i < 3 ? `1px solid ${T.border}` : 'none',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.bgCardHov; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.bgCard; }}
              >
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 28 : 36, fontWeight: 700, color: s.accent, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 8 }}>{s.val}</div>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: T.inkFaint, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── SEARCH + FILTERS ── */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 56, flexWrap: 'wrap', alignItems: 'center',
          animation: 'fadeUp 0.7s ease 0.5s both',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: T.bgCard, border: `1px solid ${searchFocused ? T.gold + '66' : T.borderMid}`,
            borderRadius: 100, padding: '11px 20px', flex: '1 1 220px', maxWidth: 360,
            boxShadow: searchFocused ? `0 0 0 4px ${T.goldDim}` : 'none',
            transition: 'all 0.25s',
          }}>
            <span style={{ color: T.inkFaint }}><Ic.Search /></span>
            <input
              type="text" placeholder="Search deals…" value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: T.ink, fontFamily: 'inherit', fontWeight: 500 }}
            />
            {searchQ && (
              <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.inkFaint, display: 'flex', alignItems: 'center' }}><Ic.X /></button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f.id} className={`filt-pill${activeFilter === f.id ? ' active' : ''}`} onClick={() => setActiveFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>

          {!loading && (
            <span style={{ fontSize: 12, color: T.inkFaint, fontWeight: 500, marginLeft: 'auto' }}>
              {filtered.length} deal{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── SPOTLIGHT + SIDEBAR ── */}
        {!loading && spotlightDeal && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '400px 1fr',
            gap: 20, marginBottom: 76,
            animation: 'fadeUp 0.7s ease 0.15s both',
          }}>
            <SpotlightCard
              product={spotlightDeal}
              onAddToCart={handleAddToCart}
              isAdded={addedSet.has(spotlightDeal.id)}
              isAuthed={!!user}
              onRequireAuth={() => {}}
              navigate={navigate}
            />

            {/* Right panel: quick-browse grid of next 4 */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 14 }}>
              {filtered.slice(1, 5).map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => navigate(productPath(p.name, p.id))}
                  style={{
                    background: T.bgCard, borderRadius: 16,
                    border: `1px solid ${T.border}`,
                    overflow: 'hidden', cursor: 'pointer',
                    transition: 'all 0.3s',
                    animation: `fadeUp 0.6s ease ${0.1 + i * 0.1}s both`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold + '44'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(200,75,17,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ position: 'relative', height: isMobile ? 90 : 120, overflow: 'hidden' }}>
                    {/* Clean image, no dark filter */}
                    <img src={p.src} alt={p.name} loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                      onError={e => { e.target.src = 'https://via.placeholder.com/200x120/fde8d8/c84b11?text=Bag'; }} />
                    {pct(p) > 0 && (
                      <span style={{
                        position: 'absolute', top: 8, left: 8,
                        background: T.gold, color: '#fff',
                        fontSize: 9, fontWeight: 900, padding: '3px 9px', borderRadius: 100,
                        boxShadow: '0 2px 6px rgba(200,75,17,0.35)',
                      }}>-{pct(p)}%</span>
                    )}
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <p style={{ fontSize: 9, color: T.gold, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 3 }}>{p.seller}</p>
                    <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h4>
                    <span style={{ fontSize: 15, fontWeight: 800, color: pct(p) > 0 ? T.gold : T.ink }}>{fmt(p.discountedPrice || p.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '400px 1fr', gap: 20, marginBottom: 76 }}>
            <Skeleton h={520} borderRadius={24} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {[0,1,2,3].map(i => <Skeleton key={i} h={220} />)}
            </div>
          </div>
        )}

        {/* ── SPECIAL PRODUCTS ── */}
        <div style={{ marginBottom: 72 }}>
          <SectionHeader
            label="✦ Special Picks"
            title="Specially curated."
            accent={T.flame}
            right={<span style={{ fontSize: 12, color: T.inkFaint, fontWeight: 500 }}>20%+ off</span>}
          />
          <HorizScroll loading={loading} skeletonCount={4} skeletonH={370}>
            {specialDeals.length > 0
              ? specialDeals.map((p, i) => (
                  <SpecialCard key={p.id} product={p} index={i} navigate={navigate}
                    onAddToCart={handleAddToCart} isAdded={addedSet.has(p.id)}
                    isAuthed={!!user} onRequireAuth={() => {}} />
                ))
              : <div style={{ color: T.inkFaint, fontSize: 13, padding: '40px 0' }}>No specials match your current filter.</div>
            }
          </HorizScroll>
        </div>

        {/* ── HOT DEALS ── */}
        <div style={{ marginBottom: 72 }}>
          <SectionHeader
            label="🔥 Hot Deals"
            title="Limited time only."
            accent={T.gold}
          />
          <HorizScroll loading={loading} skeletonCount={5} skeletonH={370}>
            {hotDeals.length > 0
              ? hotDeals.map((p, i) => (
                  <SpecialCard key={p.id} product={p} index={i} navigate={navigate}
                    onAddToCart={handleAddToCart} isAdded={addedSet.has(p.id)}
                    isAuthed={!!user} onRequireAuth={() => {}} />
                ))
              : <div style={{ color: T.inkFaint, fontSize: 13, padding: '40px 0' }}>No deals match your filter.</div>
            }
          </HorizScroll>
        </div>

        {/* ── GRID: MORE DEALS ── */}
        {!loading && gridDeals.length > 0 && (
          <div style={{ marginBottom: 72 }}>
            <SectionHeader label="More deals" title="Every last one." accent={T.gold} />
            <div className="deals-grid">
              {gridDeals.map((p, i) => (
                <GridCard key={p.id} product={p} index={i} navigate={navigate}
                  onAddToCart={handleAddToCart} isAdded={addedSet.has(p.id)}
                  isAuthed={!!user} onRequireAuth={() => {}}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 20px', animation: 'pageIn 0.5s ease both' }}>
            <div style={{ fontSize: 56, marginBottom: 24, animation: 'float 3s ease-in-out infinite' }}>🛍️</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: T.ink, marginBottom: 12 }}>Nothing here yet</h3>
            <p style={{ color: T.inkMid, fontSize: 15, lineHeight: 1.7, maxWidth: 320, margin: '0 auto 32px' }}>
              {allDeals.length === 0 ? 'Deals drop daily — check back soon.' : 'Try clearing your search or filter.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {allDeals.length > 0 && (
                <button onClick={clearSearch} style={{ padding: '12px 28px', background: T.gold, color: '#fff', borderRadius: 100, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>
                  Show all deals
                </button>
              )}
              <button onClick={() => navigate('/products')} style={{ padding: '12px 28px', background: T.bgCard, color: T.ink, borderRadius: 100, border: `1px solid ${T.border}`, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>
                Browse all bags
              </button>
            </div>
          </div>
        )}

        {/* ── FOOTER CTA ── */}
        {!loading && allDeals.length > 0 && (
          <div style={{
            marginTop: 96,
            display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 3, borderRadius: 24, overflow: 'hidden',
            border: `1px solid ${T.borderMid}`,
            animation: 'fadeUp 0.7s ease 0.2s both',
          }}>
            {/* Sell panel */}
            <div style={{
              background: `linear-gradient(135deg, ${T.bgCard} 0%, #fff8f4 100%)`,
              padding: isMobile ? '40px 28px' : '60px 52px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 36,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,75,17,0.06), transparent)', filter: 'blur(30px)' }} />
              <div>
                <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: T.gold, marginBottom: 16, opacity: 0.7 }}>Sell on BagSearch</p>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 26 : 34, fontWeight: 700, lineHeight: 1.2, color: T.ink, marginBottom: 12 }}>
                  Reach 10,000+<br />buyers today.
                </h3>
                <p style={{ color: T.inkFaint, fontSize: 14, lineHeight: 1.7 }}>List your bags free for the first 30 days.</p>
              </div>
              <button
                onClick={() => navigate('/register')}
                style={{
                  alignSelf: 'flex-start', padding: '13px 28px',
                  background: T.gold, color: '#fff',
                  borderRadius: 100, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                  transition: 'all 0.2s', letterSpacing: '0.02em',
                  animation: 'glowPulse 3s ease-in-out infinite',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = T.goldLight; e.currentTarget.style.transform = 'scale(1.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.gold; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                Start selling free →
              </button>
            </div>

            {/* Benefits panel */}
            <div style={{ background: T.bgCard, padding: isMobile ? '40px 28px' : '60px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28 }}>
              {[
                { n: '01', text: 'New deals added every day from verified sellers.', accent: T.gold },
                { n: '02', text: 'Chat sellers directly via WhatsApp to arrange pickup or delivery.', accent: T.flame },
                { n: '03', text: 'Contact any seller directly via WhatsApp — no middleman.', accent: T.success },
              ].map(item => (
                <div key={item.n} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: T.bg, border: `1px solid ${item.accent}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: item.accent, letterSpacing: '0.06em',
                  }}>{item.n}</div>
                  <p style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.7, fontWeight: 400, paddingTop: 8 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}