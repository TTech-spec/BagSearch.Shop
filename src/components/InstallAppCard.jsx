// src/components/InstallAppCard.jsx
// "Install BagSearch" promo card. Slides in once per visit (sessionStorage),
// can be swiped away on phones, and auto-hides after a while unless hovered.
// iOS has no install prompt, so the card shows the Add to Home Screen steps inline.
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const SEEN_KEY = 'bs_install_card_seen';
const SHOW_DELAY_MS = 2500;
const AUTO_HIDE_MS = 14000;

const K = {
  ink: '#1E1A17',
  muted: '#6F6761',
  yellow: '#F3B41E',
  green: '#7DAF5C',
  accent: '#C84B11',
  font: "'Poppins', system-ui, sans-serif",
};

const spring = { type: 'spring', stiffness: 260, damping: 26 };

const alreadySeen = () => {
  try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
};
const markSeen = () => {
  try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* storage blocked: card may show again */ }
};

const ShareIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M7 8l5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
);
const PlusSquareIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M12 8v8M8 12h8" />
  </svg>
);

/**
 * @param available  the browser can install (or it is iOS) and the app is not installed yet
 * @param isIOS      show Add to Home Screen steps instead of calling onInstall
 * @param onInstall  triggers the native install prompt
 */
export default function InstallAppCard({ available, isIOS, isMobile, onInstall }) {
  const [open, setOpen] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [paused, setPaused] = useState(false);
  const hideTimer = useRef(null);

  // Slide in once per visit, a moment after the page settles
  useEffect(() => {
    if (!available || alreadySeen()) return undefined;
    const t = setTimeout(() => { markSeen(); setOpen(true); }, SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [available]);

  // Auto-hide unless the visitor is interacting with it
  useEffect(() => {
    if (!open || paused || showSteps) return undefined;
    hideTimer.current = setTimeout(() => setOpen(false), AUTO_HIDE_MS);
    return () => clearTimeout(hideTimer.current);
  }, [open, paused, showSteps]);

  const install = async () => {
    if (isIOS) { setShowSteps(true); return; }
    await onInstall();
    setOpen(false);
  };

  const place = isMobile
    ? { left: 12, right: 12, bottom: 'calc(92px + env(safe-area-inset-bottom))' }
    : { left: 24, bottom: 24, width: 392 };

  return (
    <AnimatePresence>
      {/* `available` flips off if the app gets installed from the browser menu */}
      {open && available && (
        <motion.aside
          role="dialog"
          aria-label="Install the BagSearch app"
          initial={isMobile ? { y: 140, opacity: 0 } : { x: -440, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={isMobile ? { y: 160, opacity: 0 } : { x: -440, opacity: 0 }}
          transition={spring}
          drag={isMobile ? 'y' : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.05, bottom: 0.6 }}
          onDragEnd={(_, info) => { if (info.offset.y > 60 || info.velocity.y > 500) setOpen(false); }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          style={{
            position: 'fixed', zIndex: 900, ...place,
            fontFamily: K.font, color: K.ink,
            background: '#FFFFFF', borderRadius: 26, overflow: 'hidden',
            boxShadow: '0 24px 60px -18px rgba(30,26,23,0.45), 0 0 0 1px rgba(30,26,23,0.06)',
            touchAction: isMobile ? 'none' : 'auto',
          }}
        >
          {isMobile && <div aria-hidden="true" style={{ width: 36, height: 4, borderRadius: 4, background: '#E6E0DC', margin: '8px auto 0' }} />}

          <div style={{ display: 'flex', gap: 16, padding: isMobile ? '12px 16px 16px' : '18px 18px 18px' }}>
            {/* Visual: app icon on a tilted phone, on the hero's yellow */}
            <div aria-hidden="true" style={{ position: 'relative', width: 96, flexShrink: 0, borderRadius: 20, background: K.yellow, overflow: 'hidden', minHeight: 124 }}>
              <span style={{ position: 'absolute', right: -18, bottom: -18, width: 70, height: 70, borderRadius: '50%', background: K.green, opacity: 0.9 }} />
              <motion.div
                initial={{ rotate: -14, y: 30 }}
                animate={{ rotate: -8, y: 0 }}
                transition={{ ...spring, delay: 0.15 }}
                style={{ position: 'absolute', left: 18, top: 16, width: 58, height: 104, borderRadius: 14, background: K.ink, padding: 4, boxSizing: 'border-box', boxShadow: '0 12px 20px -10px rgba(30,26,23,0.6)' }}
              >
                <div style={{ width: '100%', height: '100%', borderRadius: 10, background: '#FFF8F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.img
                    src="/logo.webp" alt="" width="40" height="40"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: 40, height: 40, objectFit: 'contain', transform: 'scale(1.3)' }}
                  />
                </div>
              </motion.div>
            </div>

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: K.accent }}>BagSearch app</p>
                <button
                  type="button" onClick={() => setOpen(false)} aria-label="Close"
                  style={{ width: 30, height: 30, margin: '-6px -6px 0 0', border: 'none', borderRadius: 10, background: 'transparent', color: K.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {!showSteps ? (
                  <motion.div key="pitch" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <h3 style={{ margin: '4px 0 0', fontSize: 17, lineHeight: 1.25, fontWeight: 600, letterSpacing: '-0.01em' }}>Shop bags straight from your home screen</h3>
                    <p style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.55, color: K.muted }}>One tap to open, full screen, no app store needed.</p>
                  </motion.div>
                ) : (
                  <motion.ol key="steps" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                    style={{ margin: '6px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, lineHeight: 1.4 }}>
                    {[
                      { n: 1, icon: <ShareIcon />, text: <>Tap <strong>Share</strong> in Safari</> },
                      { n: 2, icon: <PlusSquareIcon />, text: <>Choose <strong>Add to Home Screen</strong></> },
                      { n: 3, icon: null, text: <>Tap <strong>Add</strong>. Done.</> },
                    ].map((s, i) => (
                      <motion.li key={s.n} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.08 * i }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 22, height: 22, borderRadius: 7, background: '#F4F1EF', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{s.text}{s.icon && <span style={{ color: K.accent, display: 'flex' }}>{s.icon}</span>}</span>
                      </motion.li>
                    ))}
                  </motion.ol>
                )}
              </AnimatePresence>

              <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                {!showSteps ? (
                  <>
                    <motion.button
                      type="button" onClick={install} whileTap={{ scale: 0.96 }}
                      className="bs-install-cta"
                      style={{ position: 'relative', overflow: 'hidden', height: 44, padding: '0 20px', border: 'none', borderRadius: 999, background: K.ink, color: '#fff', fontFamily: K.font, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
                      Install app
                      <span aria-hidden="true" className="bs-install-shine" />
                    </motion.button>
                    <button type="button" onClick={() => setOpen(false)} style={{ height: 44, padding: '0 12px', border: 'none', background: 'none', color: K.muted, fontFamily: K.font, fontSize: 12.5, cursor: 'pointer' }}>
                      Not now
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setOpen(false)} style={{ height: 44, padding: '0 20px', border: 'none', borderRadius: 999, background: K.ink, color: '#fff', fontFamily: K.font, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    Got it
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Time left before the card tucks itself away */}
          {!showSteps && (
            <div aria-hidden="true" style={{ height: 3, background: '#F4F1EF' }}>
              <motion.div
                key={String(paused)}
                initial={{ scaleX: paused ? 1 : 1 }}
                animate={{ scaleX: paused ? 1 : 0 }}
                transition={{ duration: paused ? 0 : AUTO_HIDE_MS / 1000, ease: 'linear' }}
                style={{ height: '100%', background: K.accent, transformOrigin: 'left center' }}
              />
            </div>
          )}

          <style>{`
            .bs-install-shine{position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,255,255,0.28),transparent);animation:bsInstallShine 3.2s ease-in-out 1s infinite}
            @keyframes bsInstallShine{0%{left:-60%}45%,100%{left:130%}}
            .bs-install-cta:hover{background:#000}
          `}</style>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
