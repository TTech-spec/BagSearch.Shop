// src/components/tour/WelcomeTour.jsx
// First-visit tour of the products page: a welcome card, then a spotlight that
// slides between real elements (marked with data-tour / known selectors) with a
// short tip for each. Runs once per device (localStorage) and can be skipped.
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { tourAlreadyDone, markTourDone as markDone } from './tourState';

const T = {
  ink: '#1E1A17',
  muted: '#6F6761',
  yellow: '#F3B41E',
  green: '#7DAF5C',
  peach: '#F8C9A5',
  accent: '#C84B11',
  font: "'Poppins', system-ui, sans-serif",
};
const spring = { type: 'spring', stiffness: 260, damping: 30 };
const PAD = 8;

const STEPS_MOBILE = [
  { id: 'search', target: '[data-tour="search"]', radius: 20, eyebrow: 'Search', title: 'Search any bag', body: 'Type a brand, colour or style. Tap ₦ to set a budget and we only show bags you can afford.' },
  { id: 'photo', target: '[data-tour="photo"]', radius: 999, eyebrow: 'Photo search', title: 'Saw a bag you love? Snap it', body: 'Upload a photo from your gallery or camera and we show the closest matches from real sellers.' },
  { id: 'card', target: '.ds-card', radius: 26, eyebrow: 'Buy safely', title: 'Buy now or chat first', body: 'Pay securely and your money is held until you confirm delivery. Or message the seller on WhatsApp.' },
  { id: 'nav', target: 'nav[aria-label="Primary"] > div', radius: 999, eyebrow: 'Get around', title: 'Sellers, Reels and your cart', body: 'Browse verified vendors, watch bag Reels and check your cart from the bar at the bottom.' },
];
const STEPS_DESKTOP = [
  { id: 'search', target: '[data-tour="search"]', radius: 16, eyebrow: 'Search', title: 'Search any bag', body: 'Type a brand, colour or style. Use ₦ to set a budget and we only show bags you can afford.' },
  { id: 'photo', target: '[data-tour="photo"]', radius: 999, eyebrow: 'Photo search', title: 'Saw a bag you love? Snap it', body: 'Drop in a photo or screenshot and we show the closest matches from real sellers.' },
  { id: 'card', target: '.ds-card', radius: 28, eyebrow: 'Buy safely', title: 'Buy now or chat first', body: 'Pay securely and your money is held until you confirm delivery. Or message the seller on WhatsApp.' },
  { id: 'menu', target: '[data-tour="menu"]', radius: 16, eyebrow: 'Get around', title: 'Everything else is in the menu', body: 'Sellers, Reels, hot deals and more live here. Your cart is always at the top right.' },
];

const visibleRect = el => {
  const r = el?.getBoundingClientRect();
  return r && r.width > 0 && r.height > 0 ? r : null;
};

export default function WelcomeTour({ ready, isMobile, onFinish }) {
  const [phase, setPhase] = useState('idle'); // idle | welcome | steps | done
  const [steps, setSteps] = useState([]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [vw, setVw] = useState(() => window.innerWidth);
  const [vh, setVh] = useState(() => window.innerHeight);

  // Start once the page has content to point at
  useEffect(() => {
    if (!ready || phase !== 'idle' || tourAlreadyDone()) return undefined;
    const t = setTimeout(() => setPhase('welcome'), 1200);
    return () => clearTimeout(t);
  }, [ready, phase]);

  const finish = useCallback(() => {
    markDone();
    setPhase('done');
    setTimeout(() => { setPhase('idle'); onFinish?.(); }, 1900);
  }, [onFinish]);

  const begin = () => {
    const available = (isMobile ? STEPS_MOBILE : STEPS_DESKTOP).filter(s => document.querySelector(s.target));
    if (!available.length) { finish(); return; }
    setSteps(available);
    setIndex(0);
    setPhase('steps');
  };

  const step = phase === 'steps' ? steps[index] : null;

  // Bring the current target into view, then track it
  useLayoutEffect(() => {
    if (!step) return undefined;
    const el = document.querySelector(step.target);
    if (!el) return undefined;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setRect(visibleRect(el));
        setVw(window.innerWidth);
        setVh(window.innerHeight);
      });
    };
    const settle = setTimeout(measure, 420);
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      clearTimeout(settle);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, [step]);

  const next = useCallback(() => {
    if (index < steps.length - 1) setIndex(i => i + 1);
    else finish();
  }, [index, steps.length, finish]);
  const back = () => (index > 0 ? setIndex(i => i - 1) : setPhase('welcome'));

  // Keyboard: Esc skips, arrows move
  useEffect(() => {
    if (phase !== 'welcome' && phase !== 'steps') return undefined;
    const onKey = e => {
      if (e.key === 'Escape') finish();
      if (phase === 'steps' && e.key === 'ArrowRight') next();
      if (phase === 'steps' && e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, next, finish]);

  // Coach card placement: below the target if it fits, otherwise above
  const cardW = isMobile ? vw - 32 : 360;
  const cardH = 214;
  let cardTop = 0, cardLeft = 16;
  if (rect) {
    const below = rect.bottom + PAD + 16;
    cardTop = below + cardH < vh - 12 ? below : Math.max(12, rect.top - PAD - 16 - cardH);
    cardLeft = isMobile ? 16 : Math.min(Math.max(16, rect.left + rect.width / 2 - cardW / 2), vw - cardW - 16);
  }

  return (
    <AnimatePresence>
      {phase === 'welcome' && (
        <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(17,12,9,.64)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 12 : 24, fontFamily: T.font, color: T.ink }}>
          <motion.div role="dialog" aria-label="Welcome to BagSearch"
            initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0 }} transition={spring}
            style={{ width: isMobile ? '100%' : 440, background: '#fff', borderRadius: 28, overflow: 'hidden' }}>
            <div style={{ position: 'relative', height: 170, background: T.yellow, overflow: 'hidden' }}>
              <motion.span aria-hidden="true" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.15 }}
                style={{ position: 'absolute', left: -30, bottom: -40, width: 140, height: 140, borderRadius: '50%', background: T.green }} />
              <motion.span aria-hidden="true" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.22 }}
                style={{ position: 'absolute', right: -20, top: -30, width: 110, height: 110, borderRadius: '50%', background: T.peach }} />
              <motion.img src="/logo.webp" alt="" width="136" height="136"
                initial={{ y: 30, opacity: 0 }} animate={{ y: [0, -6, 0], opacity: 1 }}
                transition={{ y: { duration: 3, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.4 } }}
                style={{ position: 'absolute', left: '50%', top: 18, width: 136, height: 136, marginLeft: -68, objectFit: 'contain' }} />
            </div>
            <div style={{ padding: '22px 22px 20px' }}>
              <p style={{ margin: 0, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.accent }}>Welcome</p>
              <h2 style={{ margin: '6px 0 0', fontSize: 24, lineHeight: 1.2, fontWeight: 600, letterSpacing: '-0.02em' }}>Find the bag you want, from sellers you can trust</h2>
              <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.6, color: T.muted }}>Take a 30-second tour of how BagSearch works.</p>
              <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={begin} autoFocus
                  style={{ flex: 1, height: 48, border: 'none', borderRadius: 999, background: T.ink, color: '#fff', fontFamily: T.font, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Show me around</motion.button>
                <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={finish}
                  style={{ height: 48, padding: '0 18px', border: 'none', borderRadius: 999, background: '#F4F1EF', color: T.ink, fontFamily: T.font, fontSize: 13, cursor: 'pointer' }}>Skip</motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {phase === 'steps' && step && (
        <motion.div key="steps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 1200, fontFamily: T.font, color: T.ink }}>
          {/* Click-catcher so the page underneath can't be used mid-tour */}
          <div style={{ position: 'absolute', inset: 0 }} />
          {rect && (
            <motion.div
              aria-hidden="true"
              initial={false}
              animate={{ x: rect.left - PAD, y: rect.top - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2, borderRadius: step.radius }}
              transition={spring}
              style={{ position: 'absolute', left: 0, top: 0, boxShadow: '0 0 0 9999px rgba(17,12,9,.64)', pointerEvents: 'none' }}
            >
              <motion.span
                animate={{ scale: [1, 1.06], opacity: [0.7, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', border: '2px solid #fff' }}
              />
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            {rect && (
              <motion.div
                key={step.id}
                role="dialog" aria-label={step.title}
                initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}
                transition={spring}
                style={{ position: 'absolute', top: cardTop, left: cardLeft, width: cardW, boxSizing: 'border-box', background: '#fff', borderRadius: 22, padding: '18px 18px 16px', boxShadow: '0 24px 50px -20px rgba(0,0,0,.5)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.accent }}>{step.eyebrow}</span>
                  <span style={{ fontSize: 11, color: '#8A827C' }}>{index + 1} of {steps.length}</span>
                </div>
                <h3 style={{ margin: '6px 0 0', fontSize: 19, lineHeight: 1.25, fontWeight: 600, letterSpacing: '-0.01em' }}>{step.title}</h3>
                <p style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.6, color: T.muted }}>{step.body}</p>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 5, marginRight: 'auto' }} aria-hidden="true">
                    {steps.map((s, i) => (
                      <motion.span key={s.id} animate={{ width: i === index ? 18 : 6, backgroundColor: i === index ? T.ink : '#E1DAD5' }} transition={spring}
                        style={{ height: 6, borderRadius: 6 }} />
                    ))}
                  </div>
                  <button type="button" onClick={finish} style={{ height: 40, padding: '0 10px', border: 'none', background: 'none', color: T.muted, fontFamily: T.font, fontSize: 12.5, cursor: 'pointer' }}>Skip</button>
                  <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={back} aria-label="Back"
                    style={{ width: 40, height: 40, border: 'none', borderRadius: '50%', background: '#F4F1EF', color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
                  </motion.button>
                  <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={next} autoFocus
                    style={{ height: 40, padding: '0 18px', border: 'none', borderRadius: 999, background: T.ink, color: '#fff', fontFamily: T.font, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    {index === steps.length - 1 ? 'Start shopping' : 'Next'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {phase === 'done' && (
        <motion.div key="done" role="status"
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={spring}
          style={{ position: 'fixed', top: 18, left: '50%', x: '-50%', zIndex: 1200, height: 44, padding: '0 18px', borderRadius: 999, background: T.ink, color: '#fff', fontFamily: T.font, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', boxShadow: '0 14px 30px -12px rgba(0,0,0,.45)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
          You are all set. Happy shopping.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
