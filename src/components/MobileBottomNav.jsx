import { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
 * Floating pill bottom nav, mobile only — Home / List Bag / Cart / Profile.
 * Rendered once in App.jsx (outside <Routes>) so it persists across pages.
 * Cart has no page of its own; it reuses the existing openCart navigation
 * state that Product.jsx already listens for.
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

  const items = [
    {
      key: 'home', label: 'Home', Icon: IconHome,
      active: location.pathname === '/' || location.pathname === '/products',
      onClick: () => navigate('/products'),
    },
    {
      key: 'list', label: 'List Bag', Icon: IconListBag,
      active: location.pathname === '/upload-product',
      onClick: () => navigate('/upload-product'),
    },
    {
      key: 'cart', label: 'Cart', Icon: IconCart,
      active: false,
      onClick: () => navigate('/products', { state: { openCart: true } }),
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
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#ffffff', borderRadius: 999, padding: '8px 12px',
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
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: item.active ? 'linear-gradient(135deg,#c84b11,#f97316)' : 'transparent',
              boxShadow: item.active ? '0 6px 16px rgba(200,75,17,0.4)' : 'none',
              transition: 'background 0.25s ease, box-shadow 0.25s ease',
            }}
          >
            <item.Icon size={22} color={item.active ? '#ffffff' : '#5c3317'} />
          </button>
        ))}
      </div>
    </nav>
  );
}
