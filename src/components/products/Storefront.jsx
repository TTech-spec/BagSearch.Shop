// src/components/products/Storefront.jsx
// Storefront UI for the products page, shared by desktop and mobile
// (`compact` = phone layout): top bars, hero carousel, search-by-photo button,
// product cards, horizontal shelves, promo banners and search-results states.
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import NotificationsDropdown from '../NotificationsDropdown';
import heroShoppersImg from '../../assets/images/onboarding/From Klickpin.com- 1112459545479163582-pin-id-1112459545479163582.webp';
import heroPhoneImg from '../../assets/images/onboarding/From Klickpin.com- Save this easy pilates flow roundup that make everything look instantly polished with practical inspiration you can use right a.webp';
import heroBagsImg from '../../assets/images/onboarding/From Klickpin.com- 51 Face Mask Ideas for Entertaining-pin-id-1092052609666393734.jpg';

const D = {
  ink:    '#1E1A17',
  muted:  '#6F6761',
  line:   '#E6E0DC',
  pill:   '#F4F1EF',
  accent: '#C84B11',
  price:  '#C2361F',
  was:    '#7A726C',
  blue:   '#2449B8',
  hot:    '#B53F0E',
  green:  '#15803D',
  font:   "'Poppins', system-ui, sans-serif",
};

const LOGO_SRC = '/logo.webp';
const spring = { type: 'spring', stiffness: 100, damping: 20 };
const snappy = { type: 'spring', stiffness: 380, damping: 32 };

const Svg = ({ size = 18, sw = 1.8, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>{children}</svg>
);
const ArrowRight = ({ size = 16 }) => <Svg size={size} sw={2}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
const ArrowLeft = ({ size = 16 }) => <Svg size={size} sw={2}><path d="M19 12H5M11 18l-6-6 6-6" /></Svg>;
const Chevron = () => <Svg size={10} sw={2.5}><path d="M6 9l6 6 6-6" /></Svg>;
const CameraIcon = ({ size = 20 }) => <Svg size={size}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Svg>;
const SearchIcon = ({ size = 16 }) => <Svg size={size} sw={2}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Svg>;
const CloseIcon = ({ size = 13 }) => <Svg size={size} sw={2.2}><path d="M18 6 6 18M6 6l12 12" /></Svg>;
const PinIcon = ({ size = 13 }) => <Svg size={size} sw={2}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></Svg>;
const CartIcon = ({ size = 16 }) => <Svg size={size} sw={1.9}><circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /><path d="M2.5 3h2.4l2.1 11.4A2 2 0 0 0 9 16h8.4a2 2 0 0 0 2-1.6L21 6H6" /></Svg>;
const CheckIcon = ({ size = 14 }) => <Svg size={size} sw={2.4}><polyline points="20 6 9 17 4 12" /></Svg>;
const WhatsAppIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.7 2.6 4.1 3.6 1.5.7 2.1.7 2.9.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" /></svg>
);

// The app's logo (public/logo.webp); the artwork has built-in padding, so it is scaled up a little.
function BrandMark({ size = 34 }) {
  return (
    <span style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img src={LOGO_SRC} alt="" width={size} height={size} style={{ width: size, height: size, objectFit: 'contain', transform: 'scale(1.3)' }} />
    </span>
  );
}

// ─── Desktop top bar ─────────────────────────────────────────────────────────
export function DesktopTopBar({
  visible, user, cartCount, locationName,
  searchValue, searchPlaceholder, onSearch, onClearSearch, showClear,
  budgetActive, onBudget, onMenu, onProfile, onCart, onLocation, onHome, onLogin,
}) {
  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 50, fontFamily: D.font, color: D.ink,
        background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(-100%)',
        transition: 'opacity .45s ease, transform .45s cubic-bezier(.16,1,.3,1)',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto', height: 84, padding: '0 clamp(24px,5vw,72px)', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button type="button" className="ds-pill-btn" onClick={onMenu} data-tour="menu" style={{ height: 46, padding: '0 18px', gap: 10, fontSize: 14, fontWeight: 500 }}>
            <Svg size={18}><path d="M4 7h16M4 12h10M4 17h16" /></Svg>
            Menu
          </button>
          <SearchField
            value={searchValue} placeholder={searchPlaceholder} onChange={onSearch}
            showClear={showClear} onClear={onClearSearch}
            budgetActive={budgetActive} onBudget={onBudget}
            style={{ flex: '0 1 320px', minWidth: 160, height: 46 }}
          />
        </div>

        <button type="button" onClick={onHome} aria-label="BagSearch home" className="ds-brand" style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, color: D.ink, fontFamily: D.font }}>
          <motion.span whileHover={{ rotate: -6, scale: 1.08 }} transition={snappy} style={{ display: 'flex' }}>
            <BrandMark size={38} />
          </motion.span>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Bag<span style={{ color: D.accent }}>Search</span></span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          {user && <NotificationsDropdown />}
          <button type="button" className="ds-icon-btn" aria-label="Your account" onClick={onProfile}>
            <Svg size={19}><circle cx="12" cy="8" r="4" /><path d="M4 20.5a8 8 0 0 1 16 0" /></Svg>
          </button>
          <button type="button" className="ds-icon-btn" aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`} onClick={onCart} style={{ position: 'relative' }}>
            <CartIcon size={19} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={snappy}
                  style={{ position: 'absolute', top: 3, right: 1, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 999, background: D.accent, color: '#fff', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 3px rgba(200,75,17,0.18)' }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button type="button" className="ds-pill-btn" onClick={onLocation} style={{ marginLeft: 8, height: 34, padding: '0 12px', gap: 6, fontSize: 11.5, fontWeight: 500, borderRadius: 10, maxWidth: 170 }}>
            <PinIcon />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{locationName}</span>
            <Chevron />
          </button>
          {!user && (
            <button type="button" onClick={onLogin} className="ds-dark-btn" style={{ marginLeft: 6, height: 34, padding: '0 16px', fontSize: 12, borderRadius: 10 }}>
              Log in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// Search input with optional clear, budget (₦) and camera buttons
function SearchField({ value, placeholder, onChange, showClear, onClear, budgetActive, onBudget, onCamera, style }) {
  return (
    <label className="ds-search" data-tour="search" style={{ padding: '0 6px 0 14px', borderRadius: 14, background: D.pill, display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box', ...style }}>
      <span style={{ color: D.muted, display: 'flex', flexShrink: 0 }}><SearchIcon /></span>
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        enterKeyHint="search"
        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: D.font, fontSize: 13.5, color: D.ink }}
      />
      <AnimatePresence>
        {showClear && (
          <motion.button
            type="button" aria-label="Clear search" onClick={onClear} className="ds-icon-btn"
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={snappy}
            style={{ width: 30, height: 30, borderRadius: 9 }}
          >
            <CloseIcon />
          </motion.button>
        )}
      </AnimatePresence>
      {onBudget && (
        <button
          type="button" onClick={onBudget} title="Set your budget" aria-label="Set your budget" aria-pressed={budgetActive}
          style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 10, border: 'none', cursor: 'pointer', background: budgetActive ? D.ink : '#fff', color: budgetActive ? '#fff' : D.ink, fontFamily: D.font, fontSize: 14, fontWeight: 600, transition: 'background .2s,color .2s' }}
        >
          ₦
        </button>
      )}
      {onCamera && (
        <button type="button" onClick={onCamera} aria-label="Search by photo" title="Search by photo"
          style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 10, border: 'none', cursor: 'pointer', background: D.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CameraIcon size={16} />
        </button>
      )}
    </label>
  );
}

// ─── Mobile top bar ──────────────────────────────────────────────────────────
export function MobileTopBar({
  visible, user, locationName, showSearch,
  searchValue, searchPlaceholder, onSearch, onClearSearch, showClear,
  budgetActive, onBudget, onCamera, onMenu, onLocation, onHome, onLogin,
}) {
  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 50, fontFamily: D.font, color: D.ink,
        background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        padding: '8px 16px 10px',
        opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(-100%)',
        transition: 'opacity .45s ease, transform .45s cubic-bezier(.16,1,.3,1)',
      }}
    >
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" className="ds-pill-btn" aria-label="Menu" onClick={onMenu} style={{ width: 44, height: 44, justifyContent: 'center' }}>
          <Svg size={19} sw={1.9}><path d="M4 7h16M4 12h10M4 17h16" /></Svg>
        </button>
        <button type="button" onClick={onHome} aria-label="BagSearch home" style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: D.font, color: D.ink }}>
          <BrandMark size={30} />
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Bag<span style={{ color: D.accent }}>Search</span></span>
        </button>
        {user
          ? <div style={{ minWidth: 44, display: 'flex', justifyContent: 'flex-end' }}><NotificationsDropdown /></div>
          : <button type="button" onClick={onLogin} className="ds-dark-btn" style={{ height: 36, padding: '0 14px', fontSize: 12, borderRadius: 12 }}>Log in</button>}
      </div>
      {showSearch && (
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <SearchField
            value={searchValue} placeholder={searchPlaceholder} onChange={onSearch}
            showClear={showClear} onClear={onClearSearch}
            budgetActive={budgetActive} onBudget={onBudget} onCamera={onCamera}
            style={{ flex: 1, minWidth: 0, height: 48, borderRadius: 16 }}
          />
          <button type="button" className="ds-pill-btn" onClick={onLocation} aria-label={`Location: ${locationName}`} style={{ height: 48, padding: '0 12px', gap: 5, fontSize: 11.5, fontWeight: 500, borderRadius: 16, maxWidth: 104 }}>
            <PinIcon size={14} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{locationName}</span>
          </button>
        </div>
      )}
    </header>
  );
}

// ─── Hero carousel (desktop + mobile share slides and timing) ────────────────
const SLIDES = [
  { id: 'shop', bg: '#F3B41E', mark: 'bag', img: heroShoppersImg, pos: '70% 30%', mpos: '65% 55%', alt: 'Two shoppers racing a trolley full of bags',
    l1: 'Are you ready to', l2: 'find your bag?', sub: 'Designer bags from verified sellers across Nigeria, delivered to your door.', msub: 'Designer bags from verified sellers across Nigeria.', cta: 'Shop now' },
  { id: 'snap', bg: '#7DAF5C', mark: 'snap', img: heroPhoneImg, pos: '50% 20%', mpos: '50% 30%', alt: 'Woman thinking while holding her phone',
    l1: 'Saw a bag you love?', l2: 'Snap it. Find it.', sub: 'Upload a photo of any bag and we show you the closest matches from real sellers.', msub: 'Upload a photo and we show you the closest matches.', cta: 'Search by photo' },
  { id: 'new', bg: '#BDB8B5', mark: 'new', img: heroBagsImg, pos: '50% 35%', mpos: '50% 45%', alt: 'Model holding nine leather bags',
    l1: 'Fresh this week', l2: 'New arrivals', sub: 'Totes, clutches and top-handles just listed by sellers in Lagos, Abuja and beyond.', msub: 'Totes, clutches and top-handles just listed.', cta: 'See what is new' },
];
const AUTOPLAY_MS = 6000;

function useCarousel(n) {
  const [[index, dir], setSlide] = useState([0, 1]);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((next, direction) => {
    setSlide(([i]) => {
      const target = typeof next === 'function' ? next(i) : next;
      const d = direction ?? (target > i ? 1 : -1);
      return [((target % n) + n) % n, d];
    });
  }, [n]);

  useEffect(() => {
    if (paused) return undefined;
    const t = setTimeout(() => goTo(i => i + 1, 1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, paused, goTo]);

  return { index, dir, paused, setPaused, goTo };
}

const imgVariants = {
  enter: d => ({ x: d > 0 ? 80 : -80, opacity: 0, scale: 1.04 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: d => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
};
const copyVariants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } }, leave: { opacity: 0, y: -10, transition: { duration: 0.2 } } };
const riseVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: spring } };

// Thumbnails with one white ring that slides to the active slide, plus progress dashes
function HeroThumbs({ index, paused, goTo, compact }) {
  const size = compact ? 52 : 66;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: compact ? 'flex-start' : 'center', gap: compact ? 10 : 16 }}>
      <div role="tablist" aria-label="Choose slide" style={{ display: 'flex', gap: compact ? 10 : 12 }}>
        {SLIDES.map((s, i) => {
          const active = i === index;
          return (
            <motion.button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={s.alt}
              onClick={() => goTo(i)}
              animate={{ y: active ? -6 : 0 }}
              whileHover={{ y: active ? -6 : -3 }}
              whileTap={{ scale: 0.95 }}
              transition={snappy}
              style={{ position: 'relative', width: size, height: size, padding: 0, border: 'none', borderRadius: compact ? 13 : 14, background: s.bg, cursor: 'pointer', boxShadow: '0 10px 22px -12px rgba(30,26,23,0.5)' }}
            >
              <img src={s.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: compact ? s.mpos : s.pos, display: 'block', borderRadius: compact ? 13 : 14 }} />
              {active && (
                <motion.span
                  layoutId={compact ? 'ms-hero-thumb-ring' : 'ds-hero-thumb-ring'}
                  transition={snappy}
                  style={{ position: 'absolute', inset: -4, borderRadius: compact ? 16 : 17, border: '3px solid #fff', pointerEvents: 'none' }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: compact ? 5 : 6 }} aria-hidden="true">
        {SLIDES.map((s, i) => (
          <div key={s.id} style={{ position: 'relative', width: compact ? 22 : 30, height: 3, borderRadius: 3, background: compact ? 'rgba(255,255,255,0.45)' : 'rgba(30,26,23,0.18)', overflow: 'hidden' }}>
            {i === index && (
              <motion.div
                key={`${index}-${paused}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: paused ? 0.02 : 1 }}
                transition={{ duration: paused ? 0.2 : AUTOPLAY_MS / 1000, ease: 'linear' }}
                style={{ position: 'absolute', inset: 0, background: compact ? '#fff' : D.ink, transformOrigin: 'left center' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DesktopHero({ onAction }) {
  const n = SLIDES.length;
  const { index, dir, paused, setPaused, goTo } = useCarousel(n);
  const cur = SLIDES[index];
  const prevBg = SLIDES[(index + n - 1) % n].bg;
  const nextBg = SLIDES[(index + 1) % n].bg;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ position: 'relative', height: 'clamp(380px, 32vw, 440px)', marginTop: 6, fontFamily: D.font }}
    >
      <motion.div animate={{ backgroundColor: prevBg }} transition={{ duration: 0.6 }} style={{ position: 'absolute', left: 0, top: 26, bottom: 26, width: 'clamp(20px,3vw,44px)', borderRadius: '0 30px 30px 0' }} />
      <motion.div animate={{ backgroundColor: nextBg }} transition={{ duration: 0.6 }} style={{ position: 'absolute', right: 0, top: 26, bottom: 26, width: 'clamp(20px,3vw,44px)', borderRadius: '30px 0 0 30px' }} />

      <motion.div
        animate={{ backgroundColor: cur.bg }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'absolute', left: 'clamp(24px,5vw,72px)', right: 'clamp(24px,5vw,72px)', top: 0, bottom: 0, borderRadius: 34, overflow: 'hidden' }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={cur.id + '-mark'}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={spring}
            aria-hidden="true"
            style={{ position: 'absolute', right: '30%', top: 20, fontSize: 'clamp(200px,20vw,300px)', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em', color: 'rgba(255,255,255,0.22)', pointerEvents: 'none', userSelect: 'none' }}
          >
            {cur.mark}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={cur.id + '-img'} custom={dir} variants={imgVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ ...spring, opacity: { duration: 0.35 } }}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '56%' }}
          >
            <img src={cur.img} alt={cur.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: cur.pos, display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${cur.bg} 0%, rgba(255,255,255,0) 32%)` }} />
          </motion.div>
        </AnimatePresence>

        <div style={{ position: 'absolute', left: 'clamp(32px,4.5vw,64px)', top: 'clamp(56px,6vw,80px)', width: 'min(520px, 44%)' }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={cur.id + '-copy'} initial="hidden" animate="show" exit="leave" variants={copyVariants}>
              <motion.h1 variants={riseVariants} style={{ margin: 0, fontSize: 'clamp(34px,3.2vw,46px)', lineHeight: 1.12, fontWeight: 300, letterSpacing: '-0.02em', color: D.ink }}>
                {cur.l1}<br /><span style={{ fontWeight: 700 }}>{cur.l2}</span>
              </motion.h1>
              <motion.p variants={riseVariants} style={{ margin: '16px 0 0', fontSize: 15, lineHeight: 1.6, color: 'rgba(30,26,23,0.82)', maxWidth: 380 }}>
                {cur.sub}
              </motion.p>
              <motion.div variants={riseVariants} style={{ marginTop: 30 }}>
                <button type="button" className="ds-dark-btn ds-cta" onClick={() => onAction(cur.id)} style={{ height: 50, padding: '0 26px', fontSize: 14, gap: 10, borderRadius: 999 }}>
                  {cur.cta}
                  <span className="ds-cta-arrow" style={{ display: 'flex' }}><ArrowRight /></span>
                </button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div style={{ position: 'absolute', left: '50%', bottom: 32, transform: 'translateX(-50%)' }}>
          <HeroThumbs index={index} paused={paused} goTo={goTo} />
        </div>
      </motion.div>

      <motion.button type="button" className="ds-arrow" aria-label="Previous slide" onClick={() => goTo(i => i - 1, -1)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} transition={snappy}
        style={{ left: 'calc(clamp(24px,5vw,72px) - 24px)' }}>
        <ArrowLeft size={18} />
      </motion.button>
      <motion.button type="button" className="ds-arrow" aria-label="Next slide" onClick={() => goTo(i => i + 1, 1)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} transition={snappy}
        style={{ right: 'calc(clamp(24px,5vw,72px) - 24px)' }}>
        <ArrowRight size={18} />
      </motion.button>
    </section>
  );
}

export function MobileHero({ onAction }) {
  const n = SLIDES.length;
  const { index, dir, paused, setPaused, goTo } = useCarousel(n);
  const cur = SLIDES[index];
  const prevBg = SLIDES[(index + n - 1) % n].bg;
  const nextBg = SLIDES[(index + 1) % n].bg;

  const onDragEnd = (_, info) => {
    setPaused(false);
    if (info.offset.x < -50 || info.velocity.x < -400) goTo(i => i + 1, 1);
    else if (info.offset.x > 50 || info.velocity.x > 400) goTo(i => i - 1, -1);
  };

  return (
    <section aria-roledescription="carousel" aria-label="Featured" style={{ position: 'relative', height: 452, fontFamily: D.font }}>
      <motion.div animate={{ backgroundColor: prevBg }} transition={{ duration: 0.6 }} style={{ position: 'absolute', left: 0, top: 24, bottom: 24, width: 8, borderRadius: '0 12px 12px 0' }} />
      <motion.div animate={{ backgroundColor: nextBg }} transition={{ duration: 0.6 }} style={{ position: 'absolute', right: 0, top: 24, bottom: 24, width: 8, borderRadius: '12px 0 0 12px' }} />

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.16}
        onDragStart={() => setPaused(true)}
        onDragEnd={onDragEnd}
        animate={{ backgroundColor: cur.bg }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'absolute', left: 16, right: 16, top: 0, bottom: 0, borderRadius: 30, overflow: 'hidden', touchAction: 'pan-y' }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={cur.id + '-mark'}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={spring}
            aria-hidden="true"
            style={{ position: 'absolute', right: -10, top: 120, fontSize: 150, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em', color: 'rgba(255,255,255,0.24)', pointerEvents: 'none', userSelect: 'none' }}
          >
            {cur.mark}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={cur.id + '-img'} custom={dir} variants={imgVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ ...spring, opacity: { duration: 0.35 } }}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', pointerEvents: 'none' }}
          >
            <img src={cur.img} alt={cur.alt} draggable="false" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: cur.mpos, display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${cur.bg} 0%, rgba(255,255,255,0) 38%)` }} />
          </motion.div>
        </AnimatePresence>

        <div style={{ position: 'absolute', left: 22, right: 22, top: 24 }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={cur.id + '-copy'} initial="hidden" animate="show" exit="leave" variants={copyVariants}>
              <motion.h1 variants={riseVariants} style={{ margin: 0, fontSize: 27, lineHeight: 1.14, fontWeight: 300, letterSpacing: '-0.02em', color: D.ink }}>
                {cur.l1}<br /><span style={{ fontWeight: 700 }}>{cur.l2}</span>
              </motion.h1>
              <motion.p variants={riseVariants} style={{ margin: '10px 0 0', fontSize: 12.5, lineHeight: 1.55, color: 'rgba(30,26,23,0.82)', maxWidth: 270 }}>
                {cur.msub}
              </motion.p>
              <motion.div variants={riseVariants} style={{ marginTop: 16 }}>
                <button type="button" className="ds-dark-btn" onClick={() => onAction(cur.id)} style={{ height: 42, padding: '0 20px', fontSize: 13, gap: 8, borderRadius: 999 }}>
                  {cur.cta}
                  <ArrowRight size={15} />
                </button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div style={{ position: 'absolute', left: 18, bottom: 18 }}>
          <HeroThumbs index={index} paused={paused} goTo={goTo} compact />
        </div>
      </motion.div>
    </section>
  );
}

// ─── Search-by-photo floating button (pulsing rings) ─────────────────────────
export const PhotoSearchFab = memo(function PhotoSearchFab({ onClick, compact }) {
  const box = compact ? 112 : 132;
  const place = compact ? { right: 4, bottom: -34 } : { left: 'clamp(-12px, 1vw, 18px)', bottom: -66 };
  return (
    <div style={{ position: 'absolute', ...place, width: box, height: box, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 3 }}>
      {[0, 0.9, 1.8].map(delay => (
        <motion.span
          key={delay}
          aria-hidden="true"
          initial={{ scale: 0.55, opacity: 0.6 }}
          animate={{ scale: 1.7, opacity: 0 }}
          transition={{ duration: 2.7, delay, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(200,75,17,0.16)' }}
        />
      ))}
      <motion.button
        type="button" onClick={onClick} aria-label="Search by photo" title="Search by photo" data-tour="photo"
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} transition={snappy}
        style={{ pointerEvents: 'auto', position: 'relative', width: compact ? 56 : 58, height: compact ? 56 : 58, borderRadius: '50%', border: '4px solid #fff', background: D.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 12px 26px -10px rgba(30,26,23,0.6)' }}
      >
        <CameraIcon />
      </motion.button>
    </div>
  );
});

// ─── Category chips (active pill slides between chips) ───────────────────────
export function CategoryChips({ categories, active, onChange, compact, idPrefix = 'cat' }) {
  return (
    <div
      role="tablist" aria-label="Bag categories" className={compact ? 'ds-hscroll' : undefined}
      style={compact
        ? { display: 'flex', gap: 6, overflowX: 'auto', margin: '0 -16px', padding: '2px 16px 4px', fontFamily: D.font }
        : { display: 'flex', flexWrap: 'wrap', gap: 6, fontFamily: D.font }}
    >
      {categories.map(c => {
        const on = c.id === active;
        return (
          <button
            key={c.id} type="button" role="tab" aria-selected={on} onClick={() => onChange(c.id)} className="ds-chip"
            style={{ position: 'relative', flexShrink: 0, height: 36, padding: '0 16px', borderRadius: 999, border: `1px solid ${on ? 'transparent' : D.line}`, background: '#fff', color: on ? '#fff' : D.ink, fontFamily: D.font, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', transition: 'color .25s' }}
          >
            {on && <motion.span layoutId={`${idPrefix}-pill`} transition={snappy} style={{ position: 'absolute', inset: -1, borderRadius: 999, background: D.ink }} />}
            <span style={{ position: 'relative' }}>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Removable chips for active filters (budget, location) + clear all
export function FilterChips({ chips, onClearAll }) {
  if (!chips.length && !onClearAll) return null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontFamily: D.font }}>
      <AnimatePresence initial={false}>
        {chips.map(ch => (
          <motion.span key={ch.key} className="ds-filter" layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={snappy}>
            <button type="button" onClick={ch.onEdit}>{ch.label}</button>
            <button type="button" aria-label={`Remove ${ch.label}`} onClick={ch.onRemove}><CloseIcon size={10} /></button>
          </motion.span>
        ))}
      </AnimatePresence>
      {onClearAll && <button type="button" className="ds-filter ds-filter-clear" onClick={onClearAll}>Clear all</button>}
    </div>
  );
}

// ─── Product card ────────────────────────────────────────────────────────────
export function PastelProductCard({ product, index, categoryLabel, tags, priceLabel, wasLabel, onOpen, onAddToCart, onBuyNow, onChat, href, compact }) {
  const [added, setAdded] = useState(false);

  const addToCart = e => {
    e.preventDefault(); e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };
  const buyNow = e => { e.preventDefault(); e.stopPropagation(); onBuyNow(product); };

  const tagH = compact ? 20 : 24;
  const r = compact ? 22 : 26;

  return (
    <motion.a
      href={href}
      onClick={e => { e.preventDefault(); if (e.target.closest('button')) return; onOpen(product); }}
      className="ds-card"
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ ...spring, delay: (index % 4) * 0.07 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', textDecoration: 'none', color: D.ink, fontFamily: D.font }}
    >
      <div className="ds-card-frame" style={{ position: 'relative', height: compact ? 190 : 'clamp(230px, 19vw, 262px)', borderRadius: r, overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
        <div className="ds-card-img" style={{ position: 'relative', width: '100%', height: '100%' }}>
          <img src={product.src} alt={product.brand ? `${product.brand} ${product.name}` : product.name} loading="lazy" decoding="async" width="400" height="300"
            onError={e => { if (product.srcRaw && e.currentTarget.src !== product.srcRaw) e.currentTarget.src = product.srcRaw; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>

        {tags.length > 0 && (
          <div style={{ position: 'absolute', left: 0, top: 0, display: 'flex' }}>
            {tags.map((t, i) => (
              <span key={t.label} style={{
                height: tagH, padding: compact ? '0 8px' : '0 12px', display: 'flex', alignItems: 'center',
                fontSize: compact ? 9 : 10, fontWeight: 700, letterSpacing: '0.08em', color: '#fff', background: t.bg,
                borderRadius: tags.length === 1 ? `${r}px 0 ${compact ? 10 : 14}px 0` : i === 0 ? `${r}px 0 0 0` : `0 0 ${compact ? 10 : 14}px 0`,
              }}>{t.label}</span>
            ))}
          </div>
        )}

        {onChat && (
          <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); onChat(product); }} aria-label={`Chat with ${product.seller} on WhatsApp`} title="Chat seller on WhatsApp" className="ds-card-chat"
            style={{ position: 'absolute', right: compact ? 10 : 14, top: compact ? 10 : 14, width: compact ? 30 : 34, height: compact ? 30 : 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#128C7E' }}>
            <WhatsAppIcon size={compact ? 14 : 16} />
          </button>
        )}
      </div>

      <div style={{ padding: compact ? '10px 2px 0' : '16px 4px 0', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: compact ? 13 : 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</h3>
        <p style={{ margin: compact ? '1px 0 0' : '3px 0 0', fontSize: compact ? 10.5 : 12, color: D.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.seller}</p>
        <div style={{ marginTop: compact ? 5 : 8, display: 'flex', alignItems: 'baseline', gap: compact ? 6 : 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: compact ? 13.5 : 15, fontWeight: 600, color: D.price }}>{priceLabel}</span>
          {wasLabel && <span style={{ fontSize: compact ? 11 : 13, color: D.was, textDecoration: 'line-through' }}>{wasLabel}</span>}
        </div>
        <div style={{ marginTop: compact ? 8 : 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ height: compact ? 22 : 24, padding: compact ? '0 10px' : '0 12px', borderRadius: 999, background: '#E3ECFF', color: D.blue, fontSize: compact ? 10 : 10.5, fontWeight: 500, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{categoryLabel}</span>
          <div style={{ display: 'flex', gap: compact ? 4 : 6, flexShrink: 0 }}>
            {(product.colors || []).slice(0, compact ? 3 : 5).map((c, i) => (
              <span key={i} title={c.id || ''} style={{ width: compact ? 9 : 11, height: compact ? 9 : 11, borderRadius: '50%', background: c.hex || c, boxShadow: 'inset 0 0 0 1px rgba(30,26,23,0.12)' }} />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: compact ? 10 : 14, display: 'flex', gap: compact ? 6 : 8 }}>
          <button type="button" onClick={buyNow} className="ds-dark-btn ds-buy" style={{ flex: 1, minWidth: 0, height: compact ? 36 : 42, fontSize: compact ? 12 : 13, borderRadius: compact ? 11 : 12, gap: 6 }}>
            Buy now
            <span className="ds-buy-arrow" style={{ display: 'flex' }}><ArrowRight size={compact ? 13 : 14} /></span>
          </button>
          <motion.button
            type="button" onClick={addToCart}
            aria-label={added ? 'Added to cart' : `Add ${product.name} to cart`}
            whileTap={{ scale: 0.9 }} transition={snappy}
            className="ds-cart-btn"
            style={{ width: compact ? 36 : 42, height: compact ? 36 : 42, flexShrink: 0, borderRadius: compact ? 11 : 12, border: `1.5px solid ${added ? D.green : D.ink}`, background: added ? D.green : '#fff', color: added ? '#fff' : D.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background .25s, border-color .25s, color .25s' }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={added ? 'ok' : 'cart'} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={snappy} style={{ display: 'flex' }}>
                {added ? <CheckIcon size={compact ? 14 : 16} /> : <CartIcon size={compact ? 15 : 17} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.a>
  );
}

// ─── Section header + horizontal shelf ───────────────────────────────────────
export function SectionHeader({ title, subtitle, action, compact }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={spring}
      style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, fontFamily: D.font }}
    >
      <div style={{ minWidth: 0 }}>
        <h2 style={{ margin: 0, fontSize: compact ? 19 : 26, fontWeight: 600, letterSpacing: '-0.02em', color: D.ink }}>{title}</h2>
        {subtitle && <p style={{ margin: compact ? '2px 0 0' : '4px 0 0', fontSize: compact ? 11.5 : 13, color: D.muted }}>{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  );
}

export function Shelf({ id, title, subtitle, items, renderCard, onSeeAll, compact, highlighted }) {
  const track = useRef(null);
  const scroll = dir => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' });
  if (!items.length) return null;
  return (
    <motion.section
      id={id}
      aria-label={title}
      animate={highlighted ? { backgroundColor: ['rgba(200,75,17,0.10)', 'rgba(200,75,17,0)'] } : undefined}
      transition={{ duration: 2.4 }}
      style={{ marginBottom: compact ? 40 : 64, scrollMarginTop: compact ? 132 : 100, borderRadius: 24 }}
    >
      <SectionHeader
        title={title} subtitle={subtitle} compact={compact}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {onSeeAll && <button type="button" className="ds-link" onClick={onSeeAll}>See all <span aria-hidden="true">→</span></button>}
            {!compact && items.length > 4 && <>
              <button type="button" className="ds-shelf-arrow" aria-label={`Scroll ${title} left`} onClick={() => scroll(-1)}><ArrowLeft size={15} /></button>
              <button type="button" className="ds-shelf-arrow" aria-label={`Scroll ${title} right`} onClick={() => scroll(1)}><ArrowRight size={15} /></button>
            </>}
          </div>
        }
      />
      <div
        ref={track}
        className="ds-hscroll"
        style={{
          display: 'flex', gap: compact ? 14 : 24, overflowX: 'auto', scrollSnapType: 'x mandatory',
          margin: compact ? '16px -16px 0' : '24px 0 0', padding: compact ? '4px 16px 10px' : '4px 2px 10px',
        }}
      >
        {items.map((p, i) => (
          <div key={p.id} style={{ flex: `0 0 ${compact ? 210 : 282}px`, scrollSnapAlign: 'start' }}>
            {renderCard(p, i)}
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// ─── Promo banner (hot deals / sell on BagSearch) ────────────────────────────
export function PromoBanner({ eyebrow, title, body, cta, onClick, image, tone, dark, compact }) {
  const ink = dark ? '#fff' : D.ink;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={spring}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: compact ? 26 : 34, background: tone, minHeight: compact ? 210 : 260, marginBottom: compact ? 40 : 64, fontFamily: D.font }}
    >
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: compact ? '46%' : '48%' }}>
        <img src={image} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${tone} 0%, rgba(255,255,255,0) 45%)` }} />
      </div>
      <div style={{ position: 'relative', padding: compact ? '24px 22px' : '44px 56px', maxWidth: compact ? '62%' : 520 }}>
        <p style={{ margin: 0, fontSize: compact ? 10 : 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.65)' : 'rgba(30,26,23,0.7)' }}>{eyebrow}</p>
        <h3 style={{ margin: compact ? '8px 0 0' : '10px 0 0', fontSize: compact ? 20 : 32, lineHeight: 1.15, fontWeight: 600, letterSpacing: '-0.02em', color: ink }}>{title}</h3>
        <p style={{ margin: compact ? '8px 0 0' : '12px 0 0', fontSize: compact ? 12 : 14, lineHeight: 1.6, color: dark ? 'rgba(255,255,255,0.75)' : 'rgba(30,26,23,0.8)' }}>{body}</p>
        <button type="button" onClick={onClick} className={`ds-cta ${dark ? 'ds-light-btn' : 'ds-dark-btn'}`} style={{ marginTop: compact ? 16 : 26, height: compact ? 40 : 48, padding: compact ? '0 18px' : '0 24px', fontSize: compact ? 12.5 : 14, gap: 8, borderRadius: 999 }}>
          {cta}
          <span className="ds-cta-arrow" style={{ display: 'flex' }}><ArrowRight size={compact ? 14 : 16} /></span>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Search results ──────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: 'relevance', label: 'Best match' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
];

export function SortSelect({ value, onChange, compact }) {
  return (
    <label className="ds-sort" style={{ height: compact ? 34 : 38, fontSize: compact ? 11.5 : 12.5 }}>
      <span className="ds-sr">Sort bags</span>
      <select value={value} onChange={e => onChange(e.target.value)} aria-label="Sort bags">
        {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <Chevron />
    </label>
  );
}

export function ResultsHeader({ title, subtitle, image, onRemoveImage, sort, onSort, compact }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring}
      style={{ display: 'flex', alignItems: 'center', gap: compact ? 12 : 18, fontFamily: D.font, flexWrap: compact ? 'wrap' : 'nowrap' }}
    >
      {image && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img src={image} alt="Your photo" style={{ width: compact ? 56 : 72, height: compact ? 56 : 72, objectFit: 'cover', borderRadius: compact ? 16 : 20, display: 'block', boxShadow: '0 10px 22px -12px rgba(30,26,23,0.5)' }} />
          <button type="button" onClick={onRemoveImage} aria-label="Remove photo search" style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: '50%', border: '2px solid #fff', background: D.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon size={10} />
          </button>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: compact ? 10.5 : 11.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: D.accent }}>{image ? 'Photo search' : 'Search results'}</p>
        <h2 style={{ margin: '4px 0 0', fontSize: compact ? 20 : 30, fontWeight: 600, letterSpacing: '-0.02em', color: D.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: compact ? 'normal' : 'nowrap' }}>{title}</h2>
        <p style={{ margin: '4px 0 0', fontSize: compact ? 11.5 : 13, color: D.muted }}>{subtitle}</p>
      </div>
      <div style={{ flexShrink: 0, marginLeft: compact ? 'auto' : 0 }}>
        <SortSelect value={sort} onChange={onSort} compact={compact} />
      </div>
    </motion.div>
  );
}

export function EmptyResults({ title, body, onClear, onPhoto, compact }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring}
      style={{ textAlign: 'center', padding: compact ? '48px 12px' : '80px 20px', fontFamily: D.font }}
    >
      <motion.div
        animate={{ rotate: [0, -6, 6, 0] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.2 }}
        style={{ width: compact ? 72 : 88, height: compact ? 72 : 88, margin: '0 auto', borderRadius: '50%', background: '#FBEDE6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: D.accent }}
      >
        <SearchIcon size={compact ? 28 : 34} />
      </motion.div>
      <h3 style={{ margin: '18px 0 0', fontSize: compact ? 17 : 21, fontWeight: 600, color: D.ink }}>{title}</h3>
      <p style={{ margin: '8px auto 0', maxWidth: 380, fontSize: compact ? 12.5 : 14, lineHeight: 1.6, color: D.muted }}>{body}</p>
      <div style={{ marginTop: 22, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" onClick={onClear} className="ds-dark-btn" style={{ height: 44, padding: '0 22px', fontSize: 13, borderRadius: 999 }}>Clear search</button>
        {onPhoto && (
          <button type="button" onClick={onPhoto} className="ds-outline-btn" style={{ height: 44, padding: '0 20px', fontSize: 13, borderRadius: 999, gap: 8 }}>
            <CameraIcon size={16} /> Search by photo
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function SkeletonGrid({ count = 8, compact }) {
  return (
    <div className={compact ? 'ds-grid-m' : 'ds-grid'} aria-busy="true" aria-label="Loading bags">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="ds-shimmer" style={{ height: compact ? 190 : 'clamp(230px, 19vw, 262px)', borderRadius: compact ? 22 : 26, animationDelay: `${i * 80}ms` }} />
          <div className="ds-shimmer" style={{ marginTop: 14, height: 12, width: '70%', borderRadius: 6, animationDelay: `${i * 80}ms` }} />
          <div className="ds-shimmer" style={{ marginTop: 8, height: 10, width: '45%', borderRadius: 6, animationDelay: `${i * 80}ms` }} />
          <div className="ds-shimmer" style={{ marginTop: 14, height: compact ? 36 : 42, borderRadius: 12, animationDelay: `${i * 80}ms` }} />
        </div>
      ))}
    </div>
  );
}

// Shared class-based styles (hover/active states, grids, shimmer)
export const ShopStyles = () => (
  <style>{`
    .ds-pill-btn{display:inline-flex;align-items:center;border:none;border-radius:14px;background:${D.pill};color:${D.ink};font-family:${D.font};cursor:pointer;transition:background .2s,transform .2s}
    .ds-pill-btn:hover{background:#ECE7E3}
    .ds-pill-btn:active{transform:scale(.97)}
    .ds-icon-btn{width:42px;height:42px;border:none;border-radius:12px;background:transparent;color:${D.ink};display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s}
    .ds-icon-btn:hover{background:${D.pill}}
    .ds-search:focus-within{box-shadow:0 0 0 2px ${D.ink}}
    .ds-search input::-webkit-search-cancel-button{display:none}
    .ds-dark-btn{display:inline-flex;align-items:center;justify-content:center;border:none;background:${D.ink};color:#fff;font-family:${D.font};font-weight:500;cursor:pointer;transition:transform .25s cubic-bezier(.16,1,.3,1),background .2s}
    .ds-dark-btn:hover{background:#000}
    .ds-dark-btn:active{transform:scale(.97)}
    .ds-light-btn{display:inline-flex;align-items:center;justify-content:center;border:none;background:#fff;color:${D.ink};font-family:${D.font};font-weight:500;cursor:pointer;transition:transform .25s cubic-bezier(.16,1,.3,1),background .2s}
    .ds-light-btn:hover{background:#F4F1EF}
    .ds-outline-btn{display:inline-flex;align-items:center;justify-content:center;border:1.5px solid ${D.ink};background:#fff;color:${D.ink};font-family:${D.font};font-weight:500;cursor:pointer;transition:background .2s}
    .ds-outline-btn:hover{background:${D.pill}}
    .ds-cta:hover{transform:translateY(-2px)}
    .ds-cta .ds-cta-arrow,.ds-buy .ds-buy-arrow{transition:transform .3s cubic-bezier(.16,1,.3,1)}
    .ds-cta:hover .ds-cta-arrow,.ds-buy:hover .ds-buy-arrow{transform:translateX(4px)}
    .ds-cart-btn:hover{background:${D.pill}}
    .ds-arrow{position:absolute;top:50%;margin-top:-24px;width:48px;height:48px;border-radius:50%;border:none;background:#fff;color:${D.ink};box-shadow:0 10px 24px -10px rgba(30,26,23,.45);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2}
    .ds-shelf-arrow{width:36px;height:36px;border-radius:50%;border:1px solid ${D.line};background:#fff;color:${D.ink};display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s,transform .2s}
    .ds-shelf-arrow:hover{background:${D.pill}}
    .ds-shelf-arrow:active{transform:scale(.94)}
    .ds-chip:hover{border-color:#CFC7C1}
    .ds-card .ds-card-img{transition:transform .6s cubic-bezier(.16,1,.3,1)}
    .ds-card-frame{transition:box-shadow .5s ease}
    @media (hover:hover){
      .ds-card:hover .ds-card-img{transform:scale(1.05)}
      .ds-card:hover .ds-card-frame{box-shadow:0 22px 40px -22px rgba(30,26,23,.35)}
    }
    .ds-card:active .ds-card-img{transform:scale(.98)}
    .ds-card-chat{transition:transform .25s cubic-bezier(.16,1,.3,1)}
    .ds-card-chat:hover{transform:scale(1.1)}
    .ds-card:focus-visible{outline:2px solid ${D.accent};outline-offset:6px;border-radius:26px}
    .ds-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:40px 24px}
    @media (max-width:1180px){.ds-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media (max-width:920px){.ds-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .ds-grid-m{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px 12px}
    .ds-hscroll{scrollbar-width:none;-ms-overflow-style:none}
    .ds-hscroll::-webkit-scrollbar{display:none}
    .ds-link{border:none;background:none;cursor:pointer;font-family:${D.font};font-size:13px;font-weight:500;color:${D.accent};display:inline-flex;gap:6px;align-items:center;white-space:nowrap;padding:6px 0}
    .ds-link span{transition:transform .3s cubic-bezier(.16,1,.3,1)}
    .ds-link:hover span{transform:translateX(4px)}
    .ds-filter{height:32px;display:inline-flex;align-items:center;border-radius:999px;background:${D.pill};color:${D.ink};font-family:${D.font};font-size:12px;overflow:hidden}
    .ds-filter button{height:100%;border:none;background:none;color:inherit;font:inherit;cursor:pointer;padding:0 6px 0 12px;display:inline-flex;align-items:center}
    .ds-filter button+button{padding:0 12px 0 6px}
    .ds-filter button:hover{background:#ECE7E3}
    .ds-filter-clear{padding:0 14px;border:none;cursor:pointer;background:#FBEDEA;color:${D.price}}
    .ds-filter-clear:hover{background:#F7DDD7}
    .ds-sort{position:relative;display:inline-flex;align-items:center;gap:6px;padding:0 12px 0 14px;border-radius:999px;background:${D.pill};color:${D.ink};font-family:${D.font};font-weight:500;cursor:pointer}
    .ds-sort select{appearance:none;-webkit-appearance:none;border:none;background:transparent;font:inherit;color:inherit;cursor:pointer;outline:none;padding-right:2px}
    .ds-sort:focus-within{box-shadow:0 0 0 2px ${D.ink}}
    .ds-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
    @keyframes dsShimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
    .ds-shimmer{background:linear-gradient(90deg,#F1EDEA 0px,#F9F7F5 120px,#F1EDEA 240px);background-size:800px 100%;animation:dsShimmer 1.4s linear infinite}
  `}</style>
);
