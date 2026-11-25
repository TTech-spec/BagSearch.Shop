import { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext.jsx';
import { useIsMobileViewport } from '../hooks/useIsMobileViewport';

// Routes where a bottom nav doesn't make sense (auth flows, onboarding).
const HIDDEN_ON = ['/login', '/register', '/forgot-password', '/reset-password', '/onboarding', '/auth/callback', '/admin'];

function IconHome({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

function IconListBag({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 8 8 4h8l1.5 4" />
      <path d="M4.8 8h14.4l-1 11a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8z" />
      <line x1="12" y1="11.5" x2="12" y2="16.5" />
      <line x1="9.5" y1="14" x2="14.5" y2="14" />
    </svg>
  );
}

function IconSparkle({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

function IconFactory({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V10l5 3V10l5 3V10l5 3V4h3v17z" />
      <path d="M7 17h2M12 17h2M17 17h1" />
    </svg>
  );
}

function IconReels({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="4" />
      <path d="M2 8h20M7 3 7 8M17 3 17 8" />
      <polygon points="10.5 12 15 14.5 10.5 17" fill={color} stroke="none" />
    </svg>
  );
}

function IconStore({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 9 5 4h14l1.5 5" />
      <path d="M3.5 9a2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.8 0 2.8 2.8 0 0 0 5.6 0" />
      <path d="M5 11.5V20h14v-8.5" />
      <path d="M10 20v-4.5h4V20" />
    </svg>
  );
}

function IconCart({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1.4" fill={color} stroke="none" />
      <circle cx="18" cy="20" r="1.4" fill={color} stroke="none" />
      <path d="M2.5 3h2.4l2.13 11.39A2 2 0 0 0 9 16h8.4a2 2 0 0 0 1.95-1.55L21 6H6" />
    </svg>
  );
}

function IconUser({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20.5a8 8 0 0 1 16 0" />
    </svg>
  );
}

function IconFlame({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .2 2 1.2 3 2.5 3-1-3 0-6 0-8Z" />
    </svg>
  );
}

const PILL = { open: 'min(340px, 72dvh)', closed: 64 };
const spring = { type: 'spring', stiffness: 360, damping: 34 };

/**
 * Mobile bottom nav — "Nav C": a warm cream floating pill with four tabs (the active
 * one shows its name) and a "More" button that grows the pill upward into a
 * menu of the other destinations. Rendered once in App.jsx outside <Routes>.
 * The role-specific action (List Bag / Post Bag / New Arrivals) leads the menu.
 */
export default function MobileBottomNav() {
  const isMobile = useIsMobileViewport(768);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  // Remember which page the menu was opened on, so it closes on navigation.
  const [openOn, setOpenOn] = useState(null);
  const open = openOn === location.pathname;
  const setOpen = (v) => setOpenOn(v ? location.pathname : null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpenOn(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!isMobile) return null;
  if (HIDDEN_ON.some(path => location.pathname.startsWith(path))) return null;

  const path = location.pathname;
  const role = user?.user_metadata?.role;
  const profilePath = role === 'seller' ? '/seller-profile' : '/profile';
  const go = (to, state) => { setOpen(false); navigate(to, state ? { state } : undefined); };

  const roleItem = role === 'factory'
    ? { key: 'post', label: 'Post a bag', Icon: IconListBag, to: '/factory/post' }
    : role === 'seller'
    ? { key: 'list', label: 'List a bag', Icon: IconListBag, to: '/upload-product' }
    : { key: 'new', label: 'New arrivals', Icon: IconSparkle, to: '/products', state: { scrollTo: 'new-arrivals' } };

  const tabs = [
    { key: 'home', label: 'Home', Icon: IconHome, active: path === '/' || path === '/products', to: '/products' },
    { key: 'vendors', label: 'Vendors', Icon: IconStore, active: path === '/vendors' || path.startsWith('/vendor/') || path.startsWith('/seller/'), to: '/vendors' },
    { key: 'cart', label: 'Cart', Icon: IconCart, active: path === '/cart', to: '/cart' },
    { key: 'profile', label: 'Profile', Icon: IconUser, active: path === '/profile' || path === '/seller-profile', to: profilePath },
  ];
  const more = [
    roleItem,
    { key: 'factory', label: 'Factory Direct', Icon: IconFactory, to: '/factory' },
    { key: 'deals', label: 'Hot deals', Icon: IconFlame, to: '/hot-deals' },
    { key: 'reels', label: 'Reels', Icon: IconReels, to: '/reels', badge: 'Soon' },
  ];

  return (
    <>
      <AnimatePresence>
        {open && (
          <Motion.div key="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)} aria-hidden="true"
            style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(28,20,16,.35)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }} />
        )}
      </AnimatePresence>

      <nav aria-label="Primary" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, display: 'flex', justifyContent: 'center', padding: '0 16px max(16px, env(safe-area-inset-bottom))', pointerEvents: 'none' }}>
        <Motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1, height: open ? PILL.open : PILL.closed, borderRadius: open ? 28 : 999 }}
          transition={spring}
          style={{ pointerEvents: 'auto', width: '100%', maxWidth: 420, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: '#F2EAE1', border: '1px solid #E7DCD1', boxSizing: 'border-box', boxShadow: '0 10px 26px rgba(28,20,16,.12)', fontFamily: "'Manrope',system-ui,sans-serif" }}
        >
          <AnimatePresence>
            {open && (
              <Motion.ul id="bottom-nav-more" key="menu"
                initial="hidden" animate="show" exit="hidden"
                variants={{ hidden: { transition: { staggerChildren: 0.02, staggerDirection: -1 } }, show: { transition: { staggerChildren: 0.045, delayChildren: 0.1 } } }}
                style={{ listStyle: 'none', margin: 0, padding: '18px 12px 4px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
                <Motion.li variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#75625A', padding: '0 8px 6px' }}>More</Motion.li>
                {more.map(m => (
                  <Motion.li key={m.key} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: spring } }}>
                    <Motion.button whileTap={{ scale: 0.97 }} whileHover={{ x: 3 }} onClick={() => go(m.to, m.state)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 50, padding: '0 8px', border: 0, borderRadius: 14, background: path === m.to && !m.state ? 'rgba(255,255,255,.7)' : 'transparent', color: '#1C1410', font: "700 15px 'Manrope',sans-serif", cursor: 'pointer', textAlign: 'left' }}>
                      <Motion.span variants={{ hidden: { scale: 0.5, rotate: -12 }, show: { scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 420, damping: 16 } } }} style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: '#fff' }}><m.Icon size={18} color="#B4410E" /></Motion.span>
                      {m.label}
                      {m.badge && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: '#fff', color: '#B4410E' }}>{m.badge}</span>}
                    </Motion.button>
                  </Motion.li>
                ))}
              </Motion.ul>
            )}
          </AnimatePresence>

          <div style={{ flex: 'none', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, padding: '0 8px' }}>
            {tabs.map(t => {
              const on = t.active && !open;
              return (
                <Motion.button key={t.key} layout transition={spring} whileTap={{ scale: 0.92 }} whileHover={{ y: -2 }}
                  onClick={() => go(t.to)} aria-label={t.label} aria-current={t.active ? 'page' : undefined}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, height: 46, padding: on ? '0 16px' : '0 12px', border: 0, borderRadius: 999, background: 'transparent', cursor: 'pointer', color: on ? '#B4410E' : '#54443A' }}>
                  {on && <Motion.span layoutId="navActive" transition={spring} style={{ position: 'absolute', inset: 0, borderRadius: 999, background: '#fff', boxShadow: '0 4px 12px rgba(28,20,16,.10)' }} />}
                  <Motion.span key={on ? 'on' : 'off'} initial={on ? { scale: 0.6, rotate: -14 } : false} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 480, damping: 14 }} style={{ position: 'relative', display: 'flex' }}><t.Icon size={20} color="currentColor" /></Motion.span>
                  <AnimatePresence initial={false}>
                    {on && (
                      <Motion.span key="label" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.22 }}
                        style={{ position: 'relative', overflow: 'hidden', whiteSpace: 'nowrap', font: "800 13px 'Manrope',sans-serif" }}>{t.label}</Motion.span>
                    )}
                  </AnimatePresence>
                </Motion.button>
              );
            })}
            <Motion.button whileTap={{ scale: 0.9 }} onClick={() => setOpen(!open)}
              aria-label={open ? 'Close menu' : 'More'} aria-expanded={open} aria-controls="bottom-nav-more"
              animate={{ backgroundColor: open ? '#FFFFFF' : 'rgba(255,255,255,0)', rotate: open ? 90 : 0 }} transition={spring}
              style={{ width: 46, height: 46, flex: 'none', display: 'grid', placeItems: 'center', borderRadius: 999, border: '1px solid #D9CBBB', color: '#1C1410', cursor: 'pointer' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {open ? <path d="M6 6l12 12M18 6 6 18" /> : <><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></>}
              </svg>
            </Motion.button>
          </div>
        </Motion.div>
      </nav>
    </>
  );
}
