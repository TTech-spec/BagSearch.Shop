// src/components/WelcomeCard.jsx
// "Hi, welcome back {name}" card that slides down from the top once per visit
// (browser session) for signed-in users. Same card on every screen size.
import React, { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const SHOWN_KEY = 'bs_welcome_card_shown';
const SHOW_AFTER_MS = 900;
const VISIBLE_MS = 4500;
const HIDDEN_ON = ['/login', '/register', '/forgot-password', '/reset-password', '/onboarding', '/auth/callback'];

const W = {
  ink: '#1E1A17',
  muted: '#6F6761',
  pill: '#F4F1EF',
  yellow: '#F3B41E',
  green: '#7DAF5C',
  accent: '#C84B11',
  font: "'Poppins', system-ui, sans-serif",
};

const alreadyShown = () => {
  try { return sessionStorage.getItem(SHOWN_KEY) === '1'; } catch { return false; }
};
const markShown = () => {
  try { sessionStorage.setItem(SHOWN_KEY, '1'); } catch { /* storage blocked */ }
};

const greetingFor = date => {
  const h = date.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const Sparkle = ({ size, color, style, delay }) => (
  <motion.svg
    width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
    animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4], rotate: [0, 25, 0] }}
    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay }}
    style={{ position: 'absolute', ...style }}
  >
    <path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7z" fill={color} />
  </motion.svg>
);

export default function WelcomeCard() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  // Worked out once, when the card opens: time-of-day greeting and whether the account is brand new
  const [moment, setMoment] = useState({ greeting: '', isNew: false });

  const hiddenRoute = HIDDEN_ON.some(p => location.pathname.startsWith(p));

  // Slide in once per visit, shortly after a signed-in user lands in the app
  useEffect(() => {
    if (!user || hiddenRoute || alreadyShown()) return undefined;
    const t = setTimeout(() => {
      markShown();
      const now = new Date();
      const isNew = !!user.created_at && now.getTime() - new Date(user.created_at).getTime() < 24 * 60 * 60 * 1000;
      setMoment({ greeting: greetingFor(now), isNew });
      setOpen(true);
    }, SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [user, hiddenRoute]);

  // Tuck away after a few seconds unless the user is interacting with it
  useEffect(() => {
    if (!open || paused) return undefined;
    const t = setTimeout(() => setOpen(false), VISIBLE_MS);
    return () => clearTimeout(t);
  }, [open, paused]);

  if (!user) return null;

  const meta = user.user_metadata || {};
  const fullName = meta.full_name || meta.name || '';
  const firstName = (fullName.trim().split(/\s+/)[0]) || (user.email || '').split('@')[0] || 'there';
  const initials = (fullName || firstName).trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || 'B';
  const { isNew } = moment;
  const avatar = meta.avatar_url || meta.picture || '';

  return (
    <AnimatePresence>
      {open && !hiddenRoute && (
        <div style={{ position: 'fixed', left: 0, right: 0, top: 0, zIndex: 1300, display: 'flex', justifyContent: 'center', padding: 'calc(12px + env(safe-area-inset-top)) 12px 0', pointerEvents: 'none' }}>
          <motion.div
            role="status" aria-live="polite"
            initial={{ y: -140, opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
            animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ y: -120, opacity: 0, scale: 0.96, filter: 'blur(4px)', transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: 'spring', stiffness: 240, damping: 22, mass: 0.9 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0.6, bottom: 0.1 }}
            onDragStart={() => setPaused(true)}
            onDragEnd={(_, info) => { if (info.offset.y < -30 || info.velocity.y < -300) setOpen(false); else setPaused(false); }}
            onHoverStart={() => setPaused(true)}
            onHoverEnd={() => setPaused(false)}
            style={{
              pointerEvents: 'auto', touchAction: 'none', width: 'min(460px, 100%)',
              background: '#fff', borderRadius: 22, overflow: 'hidden', fontFamily: W.font, color: W.ink,
              boxShadow: '0 24px 50px -18px rgba(30,26,23,.45), 0 0 0 1px rgba(30,26,23,.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 14px 14px 16px' }}>
              <div style={{ position: 'relative', width: 50, height: 50, flexShrink: 0 }}>
                <motion.span aria-hidden="true"
                  animate={{ scale: [1, 1.45], opacity: [0.6, 0] }}
                  transition={{ duration: 1.8, repeat: 2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                  style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${W.yellow}` }} />
                <motion.div
                  initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.15 }}
                  style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: W.yellow, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 600 }}>
                  {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                </motion.div>
                <Sparkle size={14} color={W.accent} delay={0.5} style={{ right: -6, top: -4 }} />
                <Sparkle size={10} color={W.green} delay={1.2} style={{ left: -4, bottom: 0 }} />
              </div>

              <motion.div
                initial="hidden" animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
                style={{ flex: 1, minWidth: 0 }}
              >
                <motion.p variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }} style={{ margin: 0, fontSize: 12, color: W.muted }}>
                  {moment.greeting}
                </motion.p>
                <motion.p variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                  style={{ margin: '1px 0 0', fontSize: 'clamp(16px, 4.4vw, 18px)', fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isNew ? 'Hi, welcome' : 'Hi, welcome back'} <span style={{ color: W.accent }}>{firstName}</span>{' '}
                  <motion.span aria-hidden="true" style={{ display: 'inline-block', transformOrigin: '70% 80%' }}
                    animate={{ rotate: [0, 16, -8, 16, -4, 0] }} transition={{ duration: 1.4, delay: 0.7, ease: 'easeInOut' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={W.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: -3 }}>
                      <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" /><path d="M11 11.5V4a1.5 1.5 0 0 1 3 0v8" /><path d="M14 11.5V5.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.5 7S5 18.5 4.5 16l-1-3a1.5 1.5 0 0 1 2.7-1.2L8 14" />
                    </svg>
                  </motion.span>
                </motion.p>
                <motion.p variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }} style={{ margin: '2px 0 0', fontSize: 12, color: W.muted }}>
                  {isNew ? 'Your account is ready. Let’s find your bag.' : 'Good to see you again. Let’s find your next bag.'}
                </motion.p>
              </motion.div>

              <motion.button type="button" onClick={() => setOpen(false)} aria-label="Dismiss welcome message" whileTap={{ scale: 0.9 }}
                style={{ alignSelf: 'flex-start', width: 32, height: 32, border: 'none', borderRadius: 10, background: W.pill, color: W.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </motion.button>
            </div>

            {/* Time left before it tucks away (pauses while hovered or held) */}
            <div aria-hidden="true" style={{ height: 3, background: W.pill }}>
              <motion.div
                key={String(paused)}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: paused ? 1 : 0 }}
                transition={{ duration: paused ? 0.2 : VISIBLE_MS / 1000, ease: 'linear' }}
                style={{ height: '100%', background: W.accent, transformOrigin: 'left center' }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
