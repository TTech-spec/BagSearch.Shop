// src/components/auth/AuthPromptModal.jsx
// "Welcome to BagSearch" sign-up prompt for guests. Bottom sheet on phones,
// photo + copy dialog on desktop. variant="gate" is shown when a guest tries
// something that needs an account.
import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useIsMobileViewport } from '../../hooks/useIsMobileViewport';
import shopperImg from '../../assets/images/onboarding/auth-prompt-shopper.jpg';

const A = {
  ink: '#1E1A17',
  muted: '#6F6761',
  yellow: '#F3B41E',
  green: '#7DAF5C',
  peach: '#F8C9A5',
  accent: '#C84B11',
  font: "'Poppins', system-ui, sans-serif",
};

const COPY = {
  welcome: {
    title: 'Welcome to BagSearch',
    body: 'Sign in to save favorites, get exclusive deals, and connect with sellers across Nigeria',
  },
  gate: {
    title: 'Sign in to continue',
    body: 'Create a free account to use photo search, save the bags you love and connect with sellers across Nigeria',
  },
};

const sheet = { type: 'spring', stiffness: 300, damping: 32 };
const rise = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } } };
const list = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } } };

const Heart = ({ size = 13, color = '#C2361F' }) => <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.3 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" /></svg>;
const Tag = ({ size = 13, color = A.yellow }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12l-8 8-9-9V3h8z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>;
const Chat = ({ size = 13, color = 'currentColor' }) => <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z" /></svg>;
const Swap = ({ size = 13, color = 'currentColor' }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3" /></svg>;
const Close = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>;

// The three floating chips pop in one after another, then drift gently
const CHIPS = [
  { key: 'deals', label: 'Member deals', icon: <Tag />, bg: A.ink, fg: '#fff', rotate: 5 },
  { key: 'chat', label: 'Chat sellers', icon: <Chat color="#0F7B53" />, bg: '#E7F7EE', fg: '#0F7B53', rotate: -3 },
  { key: 'negotiate', label: 'Negotiate prices', icon: <Swap color={A.accent} />, bg: '#fff', fg: A.ink, rotate: -6 },
];

function PopChip({ chip, index, style }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0, rotate: chip.rotate - 18 }}
      animate={{ opacity: 1, scale: 1, rotate: chip.rotate }}
      transition={{ type: 'spring', stiffness: 420, damping: 13, delay: 0.35 + index * 0.22 }}
      style={{ position: 'absolute', zIndex: 2, ...style }}
    >
      <motion.span
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.4 + index * 0.4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 + index * 0.3 }}
        style={{ height: 34, padding: '0 12px', borderRadius: 999, background: chip.bg, color: chip.fg, fontSize: 11.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', boxShadow: '0 12px 22px -12px rgba(0,0,0,.45)' }}
      >
        {chip.icon}{chip.label}
      </motion.span>
    </motion.span>
  );
}

const BENEFITS = [
  { key: 'save', text: 'Save bags you love', long: 'Save the bags you love and find them again fast', bg: '#FDEBEC', icon: <Heart size={17} /> },
  { key: 'deals', text: 'Deals for members', long: 'Get deals only members see', bg: '#FFF3D6', icon: <Tag size={17} color="#8A5A00" /> },
  { key: 'chat', text: 'Talk to sellers', long: 'Message sellers directly and agree a price', bg: '#E7F7EE', icon: <Chat size={17} color="#0F7B53" /> },
];

function Actions({ onCreate, onSignIn, wide }) {
  return (
    <>
      <motion.button variants={rise} type="button" onClick={onCreate} whileTap={{ scale: 0.97 }} className="ap-cta"
        style={{ width: wide ? 'auto' : '100%', height: wide ? 52 : 54, padding: wide ? '0 28px' : 0, border: 'none', borderRadius: 999, background: A.ink, color: '#fff', fontFamily: A.font, fontSize: 15, fontWeight: 500, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
        Create Free Account
        <span aria-hidden="true" className="ap-shine" />
      </motion.button>
      <motion.p variants={rise} style={{ margin: wide ? 0 : '14px 0 0', textAlign: wide ? 'left' : 'center', fontSize: 13, color: A.muted }}>
        Already have an account?{' '}
        <button type="button" onClick={onSignIn} className="ap-link">Sign In</button>
      </motion.p>
    </>
  );
}

export default function AuthPromptModal({ open, onClose, navigate, variant = 'welcome' }) {
  const isMobile = useIsMobileViewport(768);
  const copy = COPY[variant] || COPY.welcome;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const create = () => { onClose(); navigate('/register'); };
  const signIn = () => { onClose(); navigate('/login?force=true'); };

  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, fontFamily: A.font, color: A.ink }}>
          <style>{`
            .ap-cta:hover{background:#000}
            .ap-shine{position:absolute;top:0;bottom:0;width:36%;left:-50%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.25),transparent);animation:apShine 3.2s ease-in-out 1.4s infinite}
            @keyframes apShine{0%{left:-50%}45%,100%{left:130%}}
            .ap-link{border:none;background:none;padding:0;font-family:${A.font};font-size:13px;font-weight:600;color:${A.accent};cursor:pointer}
            .ap-link:hover{text-decoration:underline}
            .ap-close:hover{background:#fff}
          `}</style>
          <motion.div onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(17,12,9,.58)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />

          {isMobile ? (
            <motion.div
              role="dialog" aria-modal="true" aria-label={copy.title}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={sheet}
              drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => { if (info.offset.y > 90 || info.velocity.y > 600) onClose(); }}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '94dvh', overflowY: 'auto', background: '#fff', borderRadius: '30px 30px 0 0' }}
            >
              <div style={{ position: 'relative', height: 196, background: A.yellow, overflow: 'hidden' }}>
                <motion.span aria-hidden="true" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...sheet, delay: 0.1 }}
                  style={{ position: 'absolute', left: -40, bottom: -50, width: 170, height: 170, borderRadius: '50%', background: A.green }} />
                <motion.span aria-hidden="true" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...sheet, delay: 0.18 }}
                  style={{ position: 'absolute', right: -30, top: -40, width: 130, height: 130, borderRadius: '50%', background: A.peach }} />
                <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: 10, width: 36, height: 4, marginLeft: -18, borderRadius: 4, background: 'rgba(30,26,23,.25)' }} />
                <motion.img src="/logo.webp" alt="" width="150" height="150"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: [0, -8, 0] }}
                  transition={{ opacity: { duration: 0.4 }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
                  style={{ position: 'absolute', left: '50%', top: 22, width: 150, height: 150, marginLeft: -75, objectFit: 'contain' }} />
                <PopChip chip={CHIPS[0]} index={0} style={{ right: 14, top: 40 }} />
                <PopChip chip={CHIPS[1]} index={1} style={{ left: 16, top: 70 }} />
                <PopChip chip={CHIPS[2]} index={2} style={{ right: 24, bottom: 20 }} />
                <button type="button" onClick={onClose} aria-label="Close" className="ap-close"
                  style={{ position: 'absolute', left: 14, top: 14, zIndex: 3, width: 36, height: 36, border: 'none', borderRadius: '50%', background: 'rgba(255,255,255,.85)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: A.ink }}>
                  <Close />
                </button>
              </div>

              <motion.div variants={list} initial="hidden" animate="show" style={{ padding: '22px 22px calc(26px + env(safe-area-inset-bottom))' }}>
                <motion.h2 variants={rise} style={{ margin: 0, fontSize: 25, fontWeight: 600, letterSpacing: '-0.02em' }}>{copy.title}</motion.h2>
                <motion.p variants={rise} style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.6, color: A.muted }}>{copy.body}</motion.p>
                <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                  {BENEFITS.map((b, i) => (
                    <motion.div key={b.key}
                      initial={{ opacity: 0, scale: 0.6, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 16, delay: 0.3 + i * 0.12 }}
                      style={{ padding: '12px 10px', borderRadius: 16, background: b.bg, textAlign: 'center' }}>
                      {b.icon}
                      <p style={{ margin: '4px 0 0', fontSize: 11, lineHeight: 1.3 }}>{b.text}</p>
                    </motion.div>
                  ))}
                </div>
                <div style={{ marginTop: 20 }}>
                  <Actions onCreate={create} onSignIn={signIn} />
                </div>
                <motion.button variants={rise} type="button" onClick={onClose}
                  style={{ display: 'block', margin: '8px auto 0', height: 40, padding: '0 16px', border: 'none', background: 'none', fontFamily: A.font, fontSize: 12.5, color: '#8A827C', cursor: 'pointer' }}>
                  Maybe later
                </motion.button>
              </motion.div>
            </motion.div>
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, pointerEvents: 'none' }}>
              <motion.div
                role="dialog" aria-modal="true" aria-label={copy.title}
                initial={{ opacity: 0, y: 28, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.97 }} transition={sheet}
                style={{ pointerEvents: 'auto', position: 'relative', width: 'min(840px, 100%)', minHeight: 480, maxHeight: '92vh', overflow: 'hidden', background: '#fff', borderRadius: 32, display: 'grid', gridTemplateColumns: 'minmax(0, 380px) minmax(0, 1fr)' }}
              >
                {/* Photo side */}
                <div style={{ position: 'relative', background: A.yellow, overflow: 'hidden' }}>
                  <motion.img src={shopperImg} alt="Shopper carrying colourful bags"
                    initial={{ scale: 1.12, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '42% 20%' }} />
                  <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(243,180,30,0) 55%, rgba(30,26,23,.35) 100%)' }} />
                  <PopChip chip={CHIPS[0]} index={0} style={{ right: 18, top: 28 }} />
                  <PopChip chip={CHIPS[1]} index={1} style={{ left: 18, top: '42%' }} />
                  <PopChip chip={CHIPS[2]} index={2} style={{ right: 22, top: '62%' }} />
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 20, delay: 1.1 }}
                    style={{ position: 'absolute', left: 20, right: 20, bottom: 20, padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,.92)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2F6B3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
                    Payments are held until you confirm delivery
                  </motion.div>
                </div>

                {/* Copy side */}
                <motion.div variants={list} initial="hidden" animate="show" style={{ position: 'relative', padding: '48px 48px 40px', display: 'flex', flexDirection: 'column' }}>
                  <button type="button" onClick={onClose} aria-label="Close"
                    style={{ position: 'absolute', right: 20, top: 20, width: 40, height: 40, border: 'none', borderRadius: 12, background: '#F4F1EF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: A.ink }}>
                    <Close />
                  </button>
                  <motion.p variants={rise} style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: A.accent }}>Join free</motion.p>
                  <motion.h2 variants={rise} style={{ margin: '8px 0 0', fontSize: 32, lineHeight: 1.12, fontWeight: 600, letterSpacing: '-0.02em' }}>{copy.title}</motion.h2>
                  <motion.p variants={rise} style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.6, color: A.muted, maxWidth: 380 }}>{copy.body}</motion.p>
                  <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {BENEFITS.map((b, i) => (
                      <motion.div key={b.key}
                        initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.35 + i * 0.12 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13.5 }}>
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.4 + i * 0.12 }}
                          style={{ width: 36, height: 36, borderRadius: 12, background: b.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{b.icon}</motion.span>
                        {b.long}
                      </motion.div>
                    ))}
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: 28, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <Actions onCreate={create} onSignIn={signIn} wide />
                  </div>
                </motion.div>
              </motion.div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
