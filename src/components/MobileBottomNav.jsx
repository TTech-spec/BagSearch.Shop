import { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext.jsx';
import { useIsMobileViewport } from '../hooks/useIsMobileViewport';

// Routes where a bottom nav doesn't make sense (auth flows, onboarding).
const HIDDEN_ON = ['/login', '/register', '/forgot-password', '/reset-password', '/onboarding', '/auth/callback'];

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

/**
 * Floating pill bottom nav, mobile only — Home / Vendors / Reels / [List Bag
 * or New Arrivals] / Cart / Profile. Rendered once in App.jsx (outside <Routes>) so
 * it persists across pages.
 * The third slot is "List Bag" for sellers, or "New Arrivals" for everyone
 * else, since buyers don't have anything to list. Cart and New Arrivals have
 * no page of their own — both reuse Product.jsx's existing location-state
 * pattern (openCart / scrollTo) to trigger behavior on the products page.
 */
export default function MobileBottomNav() {
  const isMobile = useIsMobileViewport(768);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  if (!isMobile) return null;
  if (HIDDEN_ON.some(path => location.pathname.startsWith(path))) return null;

  const isSeller = user?.user_metadata?.role === 'seller';
  const profilePath = isSeller ? '/seller-profile' : '/profile';

  // Buyers don't list products, so swap that slot for a shortcut to New
  // Arrivals instead of showing them a "List Bag" action meant for sellers.
  const secondItem = isSeller
    ? { key: 'list', label: 'List Bag', Icon: IconListBag, active: location.pathname === '/upload-product', onClick: () => navigate('/upload-product') }
    : { key: 'new', label: 'New Arrivals', Icon: IconSparkle, active: false, onClick: () => navigate('/products', { state: { scrollTo: 'new-arrivals' } }) };

  const items = [
    {
      key: 'home', label: 'Home', Icon: IconHome,
      active: location.pathname === '/' || location.pathname === '/products',
      onClick: () => navigate('/products'),
    },
    {
      key: 'vendors', label: 'Vendors', Icon: IconStore,
      active: location.pathname === '/vendors' || location.pathname.startsWith('/vendor/') || location.pathname.startsWith('/seller/'),
      onClick: () => navigate('/vendors'),
    },
    {
      key: 'reels', label: 'Reels', Icon: IconReels,
      active: location.pathname === '/reels',
      onClick: () => navigate('/reels'),
    },
    secondItem,
    {
      key: 'cart', label: 'Cart', Icon: IconCart,
      active: location.pathname === '/cart',
      onClick: () => navigate('/cart'),
    },
    {
      key: 'profile', label: 'Profile', Icon: IconUser,
      active: location.pathname === '/profile' || location.pathname === '/seller-profile',
      onClick: () => navigate(profilePath),
    },
  ];

  return (
    <nav
      aria-label="Primary"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50,
        display: 'flex', justifyContent: 'center',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
        pointerEvents: 'none',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: '#ffffff', borderRadius: 999, padding: '7px 9px',
        boxShadow: '0 12px 32px rgba(200,75,17,0.14), 0 2px 10px rgba(0,0,0,0.06)',
        border: '1.5px solid #f7ece4',
        pointerEvents: 'auto',
      }}>
        {items.map(item => (
          <button
            key={item.key}
            onClick={item.onClick}
            aria-label={item.label}
            aria-current={item.active ? 'page' : undefined}
            style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'transparent',
            }}
          >
            {item.active && (
              // Shared layoutId — framer-motion animates this circle sliding
              // from its old button to this one instead of just popping in.
              <motion.div
                layoutId="bottomNavActiveBg"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(135deg,#c84b11,#f97316)', boxShadow: '0 6px 16px rgba(200,75,17,0.4)' }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1, display: 'flex' }}>
              <item.Icon size={21} color={item.active ? '#ffffff' : '#5c3317'} />
            </span>
            {item.isNew && !item.active && (
              <span style={{ position: 'absolute', top: 6, right: 8, width: 8, height: 8, borderRadius: '50%', background: '#16a34a', border: '2px solid white', zIndex: 1 }} />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
