// src/components/auth/LoginSuccess.jsx
// "Welcome back" moment shown right after an email/password login.
// Mounted once in App (not inside the login page) because LoginRoute redirects
// away from /login the instant the session exists, which would unmount it.
// Desktop: centred card over a blurred scrim. Mobile: bottom sheet.
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { useIsMobileViewport } from '../../hooks/useIsMobileViewport';
import { T, FONT_SANS, FONT_SERIF, EASE_OUT } from '../../theme/luxe';
import { LOGIN_SUCCESS_EVENT as EVENT } from './loginSuccessEvent';

const REDIRECT_MS = 3500;

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

function CheckBadge({ size }) {
  const r = size / 2 - 7;
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: [0.6, 1.08, 1], opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.15 }}
      style={{ width: size, height: size, borderRadius: '50%', background: T.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} stroke={T.accent} strokeWidth="3" strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.2 }}
        />
        <motion.path
          d={`M${size * 0.345} ${size * 0.512}l${size * 0.107} ${size * 0.107} ${size * 0.2} -${size * 0.226}`}
          stroke={T.accent} strokeWidth={size > 76 ? 4 : 3.6} strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.75 }}
        />
      </svg>
    </motion.div>
  );
}

const rise = (delay) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: EASE_OUT, delay },
});

export default function LoginSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const isMobile = useIsMobileViewport();
  const [info, setInfo] = useState(null);
  const primaryRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const onSuccess = (e) => setInfo(e.detail);
    window.addEventListener(EVENT, onSuccess);
    return () => window.removeEventListener(EVENT, onSuccess);
  }, []);

  const isSeller = info?.role === 'seller';
  const target = isSeller ? '/seller-profile' : '/products';

  const finish = useCallback((to) => {
    clearTimeout(timerRef.current);
    setInfo(null);
    if (to && location.pathname !== to && !(to === '/products' && location.pathname === '/')) navigate(to);
  }, [location.pathname, navigate]);

  // Auto-continue after the progress bar fills
  useEffect(() => {
    if (!info) return undefined;
    timerRef.current = setTimeout(() => finish(target), REDIRECT_MS);
    return () => clearTimeout(timerRef.current);
  }, [info, target, finish]);

  // Keyboard: focus the main action, Escape continues right away
  useEffect(() => {
    if (!info) return undefined;
    const t = setTimeout(() => primaryRef.current?.focus({ preventScroll: true }), 450);
    const onKey = (e) => { if (e.key === 'Escape') finish(target); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [info, target, finish]);

  const signOut = async () => {
    clearTimeout(timerRef.current);
    setInfo(null);
    await logout();
    navigate('/login');
  };

  const heading = info?.firstName ? `Welcome back, ${info.firstName}` : 'Welcome back';
  const subline = isSeller
    ? (isMobile ? 'Your shop is open. Check new orders on your dashboard.' : 'Your shop is open. Check new orders and messages on your dashboard.')
    : (isMobile ? 'Your saved bags and cart are right where you left them.' : "You're signed in. Your saved bags and cart are right where you left them.");

  const panel = isMobile
    ? {
        initial: { y: '100%' }, animate: { y: 0 },
        exit: { y: '100%', transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } },
        transition: { duration: 0.5, ease: EASE_OUT },
        style: {
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1401,
          background: T.surface, borderRadius: '28px 28px 0 0',
          padding: '12px 24px calc(28px + env(safe-area-inset-bottom))',
          boxShadow: '0 -20px 60px rgba(28,20,16,0.25)',
        },
      }
    : {
        initial: { opacity: 0, y: 18, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.2 } },
        transition: { duration: 0.5, ease: EASE_OUT, delay: 0.05 },
        style: {
          position: 'relative', width: 460, maxWidth: 'calc(100vw - 32px)', boxSizing: 'border-box',
          background: T.surface, borderRadius: 24, padding: '44px 44px 36px',
          boxShadow: '0 30px 80px rgba(28,20,16,0.28)', pointerEvents: 'auto',
        },
      };

  const body = (
    <motion.div
      role="dialog" aria-modal="true" aria-labelledby="login-success-title"
      {...panel}
      style={{ ...panel.style, fontFamily: FONT_SANS, color: T.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
    >
      {isMobile && <div aria-hidden="true" style={{ width: 40, height: 5, borderRadius: 3, background: T.lineStrong, marginBottom: 26 }} />}
      <div style={{ marginBottom: isMobile ? 18 : 22 }}><CheckBadge size={isMobile ? 68 : 84} /></div>
      <motion.div {...rise(0.45)} style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', color: T.accentInk, marginBottom: isMobile ? 8 : 10 }}>SIGNED IN</motion.div>
      <motion.h2 id="login-success-title" {...rise(0.45)} style={{ margin: isMobile ? '0 0 8px' : '0 0 10px', fontFamily: FONT_SERIF, fontWeight: 600, fontSize: isMobile ? 36 : 44, lineHeight: 1.05 }}>
        {heading}
      </motion.h2>
      <motion.p {...rise(0.55)} role="status" style={{ margin: isMobile ? '0 0 24px' : '0 0 28px', fontSize: isMobile ? 15 : 16, lineHeight: 1.55, color: T.ink2, maxWidth: 340 }}>
        {subline}
      </motion.p>
      <motion.div {...rise(0.65)} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <motion.button
          ref={primaryRef} type="button" onClick={() => finish(target)}
          whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
          style={{ height: 54, border: 'none', borderRadius: 14, background: T.accent, color: '#fff', font: `700 16px ${FONT_SANS}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          {isSeller ? 'Open my dashboard' : 'Continue shopping'} <ArrowIcon />
        </motion.button>
        {isSeller && (
          <motion.button
            type="button" onClick={() => finish('/products')} whileTap={{ scale: 0.98 }}
            style={{ height: 52, border: `1.5px solid ${T.lineStrong}`, borderRadius: 14, background: T.surface, color: T.ink, font: `700 15px ${FONT_SANS}`, cursor: 'pointer' }}
          >
            Go to the shop
          </motion.button>
        )}
      </motion.div>
      <motion.div {...rise(0.65)} style={{ width: '100%', marginTop: isMobile ? 22 : 26, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 4, borderRadius: 4, background: T.lineSoft, overflow: 'hidden' }}>
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ duration: REDIRECT_MS / 1000, ease: 'linear' }}
            style={{ height: '100%', background: T.accent, borderRadius: 4, transformOrigin: 'left center' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: T.muted }}>
          <span>{isSeller ? 'Opening your dashboard…' : 'Taking you to the shop…'}</span>
          <button type="button" onClick={signOut} style={{ background: 'none', border: 'none', padding: '4px 0', minHeight: 24, color: T.accentInk, font: `600 13px ${FONT_SANS}`, textDecoration: 'underline', cursor: 'pointer' }}>
            {isMobile ? 'Not you?' : 'Not you? Sign out'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {info && (
          <>
            <motion.div
              key="scrim" aria-hidden="true"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25 } }}
              transition={{ duration: 0.3 }}
              onClick={() => finish(target)}
              style={{ position: 'fixed', inset: 0, zIndex: 1400, background: 'rgba(28,20,16,0.52)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            />
            {isMobile ? (
              <motion.div key="sheet">{body}</motion.div>
            ) : (
              <motion.div key="card" style={{ position: 'fixed', inset: 0, zIndex: 1401, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'none' }}>
                {body}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
