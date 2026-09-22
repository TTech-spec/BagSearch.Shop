import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';
import LogoIcon from './components/Logo.jsx';
import { sanitizeInput, validateRequired, validateEmail } from './utils/securityUtils';
import { authLimiter } from './utils/rateLimiter';
import { SecureErrorHandler } from './utils/errorHandler';
import { upsertUserProfile } from './services/userProfileService';
import { useSEO } from './hooks/useSEO';
import loginBgImage from './assets/images/onboarding/From Klickpin.com- 51 Face Mask Ideas for Entertaining-pin-id-1092052609666393734.jpg';

// ─── WARM COLOR PALETTE (BagSearch Theme) ────────────────────────────────────
const C = {
  primary:      '#C94B2C',
  primaryLight: '#E8856A',
  primaryBg:    '#F9DDD0',
  primaryPale:  '#FFF5F2',
  primaryBorder:'#F0C8BB',
  accent:       '#B33A1E',
  success:      '#C94B2C',
  successBg:    '#F9DDD0',
  successLight: '#FCE8E0',
  danger:       '#DC2626',
  dangerBg:     '#FEF2F2',
  surface:      '#FFFFFF',
  surfaceDim:   '#FDF8F5',
  border:       '#F0D9CC',
  borderLight:  '#F7ECE4',
  text:         '#1A0A00',
  textMid:      '#7A4030',
  textMuted:    '#B07060',
  textLight:    '#FFFFFF',
  textFaint:    '#E8C4B5',
};

// Same Unsplash image already used in the original desktop panel
const BANNER_IMAGE =
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop';

// ─── PAGE LOADER ─────────────────────────────────────────────────────────────
const PageLoader = ({ onDone }) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone(), 400);
    }, 1200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: C.surface,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease',
      pointerEvents: visible ? 'all' : 'none',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: `3px solid ${C.primaryBg}`,
        borderTopColor: C.primary,
        animation: 'spin 0.75s linear infinite',
      }} />
    </div>
  );
};

// ─── SUCCESS CARD ─────────────────────────────────────────────────────────────
const SuccessCard = ({ show, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 480);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (show) {
      requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
      const timer = setTimeout(() => {
        setMounted(false);
        setTimeout(() => onClose && onClose(), 400);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setMounted(false);
    }
  }, [show, onClose]);

  if (!show) return null;

  const sharedCard = {
    position: 'fixed', zIndex: 9999,
    display: 'flex', alignItems: 'center', gap: 14,
    background: C.surface,
    border: `1.5px solid ${C.primaryBorder}`,
    borderRadius: 14, padding: '14px 18px',
    boxShadow: '0 8px 30px rgba(26,10,0,0.14)',
    boxSizing: 'border-box',
  };
  const mobileCard = {
    ...sharedCard,
    bottom: 20, left: '50%',
    width: 'calc(100vw - 32px)', maxWidth: 360,
    transform: mounted ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(140%)',
    opacity: mounted ? 1 : 0,
    transition: mounted
      ? 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease'
      : 'transform 0.35s ease, opacity 0.3s ease',
  };
  const desktopCard = {
    ...sharedCard,
    bottom: 28, left: 28, minWidth: 260, maxWidth: 320,
    animation: mounted
      ? 'successSlideIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards'
      : 'successSlideOut 0.35s ease forwards',
  };

  return (
    <>
      <style>{`
        @keyframes successSlideIn { from{transform:translateX(-120%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes successSlideOut { from{transform:translateX(0);opacity:1} to{transform:translateX(-120%);opacity:0} }
      `}</style>
      <div style={isMobile ? mobileCard : desktopCard}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: C.primaryBg, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0, marginBottom: 2 }}>Login Successful</p>
          <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>Redirecting you now…</p>
        </div>
        <button
          onClick={() => { setMounted(false); setTimeout(() => onClose && onClose(), 400); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 6, color: C.textMuted, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </>
  );
};

// ─── EYE ICON ────────────────────────────────────────────────────────────────
const EyeIcon = ({ open }) => open ? (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
const LoginPage = () => {
  useSEO({ title: 'Log In | BagSearch', noindex: true });
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [role, setRole]                 = useState('buyer');
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [showSuccess, setShowSuccess]   = useState(false);
  const [pageLoading, setPageLoading]   = useState(true);

  const handleLoaderDone = useCallback(() => setPageLoading(false), []);

  useEffect(() => {
    const stored = sessionStorage.getItem('auth_error');
    if (stored) {
      setErrorMsg(stored);
      sessionStorage.removeItem('auth_error');
    }
  }, []);

  // ── Auth handlers — 100% unchanged ────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const identifier = email.trim().toLowerCase();
      if (!authLimiter.isAllowed(identifier)) {
        const secureError = SecureErrorHandler.handleError(
          new Error('Too many login attempts. Please try again later.'), 'auth'
        );
        setErrorMsg(secureError.message);
        setLoading(false);
        return;
      }
      const sanitizedEmail = sanitizeInput(email);
      validateRequired(sanitizedEmail, 'Email');
      validateEmail(sanitizedEmail);
      const sanitizedPassword = sanitizeInput(password);
      validateRequired(sanitizedPassword, 'Password');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });
      if (error) throw error;

      const userId = data.user.id;
      const { data: profile, error: profileError } = await supabase
        .from('users').select('role').eq('user_id', userId).single();

      if (profileError && profileError.code !== 'PGRST116' && profileError.name !== 'AbortError') {
        console.error('Error fetching user profile:', JSON.stringify(profileError, null, 2));
      }
      // Trust the account's actual stored role instead of a UI-selected one —
      // the account already knows whether it's a buyer or seller.
      const finalRole = profile?.role || 'buyer';
      const { error: upsertError } = await upsertUserProfile({
        userId,
        email: sanitizedEmail,
        role: finalRole,
      });
      if (upsertError && upsertError.name !== 'AbortError') {
        console.error('Error saving user role:', JSON.stringify(upsertError, null, 2));
      }

      setShowSuccess(true);
      setTimeout(() => navigate('/products'), 3500);
    } catch (error) {
      const secureError = SecureErrorHandler.handleError(error, 'login');
      setErrorMsg(secureError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      if (!authLimiter.isAllowed('google_oauth')) {
        const secureError = SecureErrorHandler.handleError(
          new Error('Too many login attempts. Please try again later.'), 'auth'
        );
        setErrorMsg(secureError.message);
        return;
      }
      sessionStorage.setItem('oauth_mode', 'login');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
          data: { role: sanitizeInput(role) },
        },
      });
      if (error) throw error;
    } catch (error) {
      const secureError = SecureErrorHandler.handleError(error, 'google_oauth');
      setErrorMsg(secureError.message);
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: C.surfaceDim,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif',
      color: C.text,
    }}>
      <PageLoader onDone={handleLoaderDone} />

      <div style={{
        opacity: pageLoading ? 0 : 1,
        transition: 'opacity 0.5s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <SuccessCard show={showSuccess} onClose={() => setShowSuccess(false)} />

        {/* ── ALL STYLES ─────────────────────────────────────────────────── */}
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }

          /* ── Shared: role toggle (same on both layouts) ─────────────── */
          .role-track {
            position:relative;display:flex;align-items:center;
            background:#fff;border-radius:20px;padding:6px;
            box-shadow:0 2px 8px rgba(201,75,44,0.08),
                        0 0 0 1.5px rgba(201,75,44,0.15),
                        inset 0 1px 0 rgba(255,255,255,0.9);
            width:100%;
          }
          .role-pill {
            position:absolute;top:6px;left:6px;
            width:calc(50% - 6px);height:calc(100% - 12px);
            border-radius:14px;z-index:0;
            background:linear-gradient(135deg,#C94B2C 0%,#E8856A 100%);
            box-shadow:0 6px 20px rgba(201,75,44,0.35),0 2px 6px rgba(201,75,44,0.2);
            transition:transform 0.42s cubic-bezier(0.34,1.56,0.64,1);
          }
          .role-pill.seller { transform:translateX(100%); }
          .role-pill.buyer  { transform:translateX(0); }
          .pill-shimmer { position:absolute;inset:0;border-radius:14px;overflow:hidden;pointer-events:none; }
          @keyframes shimmer {
            0%{opacity:0;transform:translateX(-100%) skewX(-15deg)}
            50%{opacity:1}
            100%{opacity:0;transform:translateX(300%) skewX(-15deg)}
          }
          .pill-shimmer::after {
            content:'';position:absolute;top:0;left:0;width:40%;height:100%;
            background:linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent);
            animation:shimmer 2.4s ease-in-out infinite 0.8s;
          }
          .role-btn {
            flex:1;position:relative;z-index:1;border:none;background:transparent;
            border-radius:14px;padding:13px 8px;cursor:pointer;
            display:flex;align-items:center;justify-content:center;gap:8px;
            font-family:inherit;font-size:13.5px;font-weight:700;
            transition:color 0.25s ease;
            -webkit-tap-highlight-color:transparent;touch-action:manipulation;
          }
          .role-btn.active   { color:#fff; }
          .role-btn.inactive { color:#B07060; }
          .role-icon {
            width:24px;height:24px;border-radius:50%;flex-shrink:0;
            display:flex;align-items:center;justify-content:center;
            transition:background 0.25s ease,transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
          }
          .role-btn.active .role-icon   { background:rgba(255,255,255,0.22);transform:scale(1.15); }
          .role-btn.inactive .role-icon { background:#F9DDD0; }
          .role-dot {
            width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.75);
            position:absolute;bottom:9px;left:50%;
            transform:translateX(-50%) scale(0);
            transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1) 0.1s;
          }
          .role-btn.active .role-dot { transform:translateX(-50%) scale(1); }
          .role-status-label {
            font-size:11.5px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;
            padding:5px 14px;border-radius:999px;
            background:rgba(201,75,44,0.08);color:#C94B2C;display:inline-block;
          }

          /* ── DESKTOP layout — shown at ≥ 1024 px ───────────────────── */
          .desktop-view { display: none; }

          @media (min-width: 1024px) {
            .mobile-view  { display: none !important; }
            .desktop-view {
              display: flex; flex-direction: column; min-height: 100vh;
            }

            .image-panel {
              display:flex; width:50%;
              position:relative; overflow:hidden;
              background:${C.primaryBg};
            }

            .login-input {
              width:100%;display:block;
              border-radius:8px;
              border:1px solid ${C.border};
              background:${C.surface};
              padding:14px 16px;
              font-size:16px;
              color:${C.text};
              outline:none;
              transition:border-color 0.2s,box-shadow 0.2s;
              font-family:inherit;
            }
            .login-input:focus {
              border-color:${C.primary};
              box-shadow:0 0 0 2px ${C.primary}20;
            }
            .login-input::placeholder { color:${C.textFaint}; }

            .submit-btn {
              width:100%;height:54px;
              background:${C.primary};color:#fff;
              font-size:16px;font-weight:700;
              border:none;border-radius:8px;
              cursor:pointer;transition:background 0.2s,transform 0.15s;
              box-shadow:0 4px 12px ${C.primary}40;
              font-family:inherit;
              -webkit-tap-highlight-color:transparent;touch-action:manipulation;
            }
            .submit-btn:hover:not(:disabled) { background:${C.accent};transform:translateY(-2px); }
            .submit-btn:active:not(:disabled) { transform:translateY(0); }
            .submit-btn:disabled { opacity:0.65;cursor:not-allowed; }

            .social-btn {
              display:flex;align-items:center;justify-content:center;gap:8px;
              height:48px;border:1px solid ${C.border};border-radius:8px;
              background:transparent;color:${C.text};
              font-size:14px;font-weight:600;cursor:pointer;
              transition:background 0.2s;width:100%;font-family:inherit;
              -webkit-tap-highlight-color:transparent;touch-action:manipulation;
            }
            .social-btn:hover:not(:disabled) { background:${C.primaryBg}; }
            .social-btn:disabled { opacity:0.6;cursor:not-allowed; }

            .header-nav { display:flex;gap:24px; }

            .form-panel {
              width:50%;
              display:flex;flex-direction:column;
              justify-content:center;align-items:center;
              padding:48px;
              background:${C.surface};
            }
            .form-inner { width:100%;max-width:400px; }
            .social-grid { display:flex;justify-content:center;margin-bottom:16px; }
            .social-grid .social-btn { max-width:280px; }
          }

          /* ── MOBILE layout — shown below 1024 px ───────────────────── */
          .mobile-view {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background: ${C.surfaceDim};
          }

          /* Mobile inputs */
          .m-input {
            width:100%;display:block;
            border-radius:14px;
            border:1.5px solid ${C.border};
            background:${C.surfaceDim};
            padding:14px 16px;
            font-size:16px;
            color:${C.text};
            outline:none;
            transition:border-color 0.2s,box-shadow 0.2s,background 0.2s;
            font-family:inherit;
          }
          .m-input:focus {
            border-color:${C.primary};
            box-shadow:0 0 0 3px ${C.primary}18;
            background:${C.surface};
          }
          .m-input::placeholder { color:${C.textFaint}; }

          /* Mobile submit */
          .m-submit {
            width:100%;height:54px;
            background:${C.primary};color:#fff;
            font-size:16px;font-weight:700;
            border:none;border-radius:999px;
            cursor:pointer;
            transition:background 0.2s,transform 0.15s,box-shadow 0.2s;
            box-shadow:0 6px 20px ${C.primary}50;
            font-family:inherit;
            -webkit-tap-highlight-color:transparent;touch-action:manipulation;
          }
          .m-submit:hover:not(:disabled) {
            background:${C.accent};transform:translateY(-2px);
            box-shadow:0 10px 28px ${C.primary}60;
          }
          .m-submit:active:not(:disabled) { transform:translateY(0); }
          .m-submit:disabled { opacity:0.65;cursor:not-allowed; }

          /* Mobile social */
          .m-social {
            display:flex;align-items:center;justify-content:center;gap:9px;
            height:50px;border:1.5px solid ${C.border};border-radius:14px;
            background:transparent;color:${C.text};
            font-size:14px;font-weight:600;cursor:pointer;
            transition:background 0.2s,border-color 0.2s;
            width:100%;font-family:inherit;
            -webkit-tap-highlight-color:transparent;touch-action:manipulation;
          }
          .m-social:hover:not(:disabled) {
            background:${C.primaryBg};border-color:${C.primaryBorder};
          }
          .m-social:disabled { opacity:0.6;cursor:not-allowed; }

          /* Custom checkbox */
          .m-check {
            width:18px;height:18px;border-radius:5px;
            border:1.5px solid ${C.border};
            background:${C.surface};
            display:flex;align-items:center;justify-content:center;
            flex-shrink:0;cursor:pointer;
            transition:background 0.2s,border-color 0.2s;
          }
          .m-check.checked { background:${C.primary};border-color:${C.primary}; }

          /* Bottom sheet */
          .bottom-sheet {
            background:${C.surface};
            border-radius:28px 28px 0 0;
            padding:22px 22px 44px;
            margin-top:-28px;
            position:relative;
            z-index:2;
            flex:1;
          }

          /* ── Photo login layout (mobile) — matches reference: photo on top, sheet below ─ */
          .mobile-view--photo {
            display:flex;
            flex-direction:column;
            min-height:100vh;
            background:${C.surface};
          }
          .photo-panel {
            position:relative;
            flex-shrink:0;
            height:46vh;
            min-height:320px;
            background-size:cover;
            background-position:center 30%;
            display:flex;
            flex-direction:column;
          }
          .photo-panel::after {
            content:'';
            position:absolute;inset:0;
            background:linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.05) 100%);
            pointer-events:none;
          }
          .floating-pill {
            position:absolute;
            top:64px;right:20px;
            z-index:2;
            border:none;cursor:pointer;
            background:rgba(255,255,255,0.92);
            color:${C.text};
            font-size:14.5px;font-weight:700;
            padding:11px 22px;
            border-radius:999px;
            box-shadow:0 4px 16px rgba(0,0,0,0.18);
            font-family:inherit;
            -webkit-tap-highlight-color:transparent;touch-action:manipulation;
            transition:background 0.2s,transform 0.15s;
          }
          .floating-pill:hover { background:#fff;transform:translateY(-1px); }
          .floating-pill:active { transform:translateY(0); }

          .bottom-sheet--photo {
            position:relative;
            z-index:2;
            flex:1;
            margin-top:-24px;
            border-radius:26px 26px 0 0;
            box-shadow:0 -10px 30px rgba(0,0,0,0.1);
          }
          .sheet-close-btn {
            all:unset;
            position:absolute;
            top:18px;right:18px;
            cursor:pointer;
            width:34px;height:34px;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            background:${C.surfaceDim};
            -webkit-tap-highlight-color:transparent;
          }

          /* Dark social button (matches the reference's Google/Apple style, in brand ink) */
          .m-social-dark {
            display:flex;align-items:center;justify-content:center;gap:10px;
            height:52px;border:none;border-radius:999px;
            background:${C.text};color:#fff;
            font-size:15px;font-weight:700;cursor:pointer;
            transition:background 0.2s,transform 0.15s;
            width:100%;font-family:inherit;
            -webkit-tap-highlight-color:transparent;touch-action:manipulation;
          }
          .m-social-dark:hover:not(:disabled) { background:#000;transform:translateY(-1px); }
          .m-social-dark:active:not(:disabled) { transform:translateY(0); }
          .m-social-dark:disabled { opacity:0.6;cursor:not-allowed; }

          /* Focus ring */
          .fr:focus-visible { outline:2px solid ${C.primary};outline-offset:2px; }
        `}</style>

        {/* ════════════════════════════════════════════════════════════════
            DESKTOP  (≥ 1024 px) — original code, pixel-perfect unchanged
        ════════════════════════════════════════════════════════════════ */}
        <div className="desktop-view">

          {/* Header */}
          <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${C.border}`,
            padding: '12px 20px',
            background: C.surface, zIndex: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <LogoIcon size={24} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
                Bag<span style={{ color: C.primary }}>Search</span>
              </h2>
            </div>
            <nav className="header-nav">
              {['Shop', 'Collections'].map(label => (
                <a key={label} href="#"
                  style={{ color: C.text, fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.primary}
                  onMouseLeave={e => e.currentTarget.style.color = C.text}>
                  {label}
                </a>
              ))}
            </nav>
            <button style={{
              background: C.primary, color: C.textLight, border: 'none',
              borderRadius: 8, padding: '8px 12px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              transition: 'background 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
              onMouseEnter={e => e.currentTarget.style.background = C.accent}
              onMouseLeave={e => e.currentTarget.style.background = C.primary}>
              WhatsApp Support
            </button>
          </header>

          <main style={{ flex: 1, display: 'flex' }}>
            <div style={{ display: 'flex', width: '100%' }}>

              {/* Image panel */}
              <div className="image-panel">
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url('${BANNER_IMAGE}')`,
                  backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.8,
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(to right, ${C.primary}80, transparent)`,
                }} />
                <div style={{
                  position: 'relative', zIndex: 10,
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  padding: 80, color: C.textLight, width: '100%',
                }}>
                  <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.2, marginBottom: 16, textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                    Elevate Your Everyday.
                  </h1>
                  <p style={{ fontSize: 20, fontWeight: 500, opacity: 0.9, maxWidth: 400 }}>
                    Discover our exclusive collection of premium bags.
                  </p>
                </div>
              </div>

              {/* Form panel */}
              <div className="form-panel">
                <div className="form-inner">

                  <div style={{ marginBottom: 28 }}>
                    <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', color: C.text, margin: 0, marginBottom: 6 }}>
                      Welcome Back
                    </h2>
                    <p style={{ color: C.textMuted, margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                      Enter your details to access your account.
                    </p>
                  </div>

                  {errorMsg && (
                    <div style={{
                      padding: '10px 14px',
                      background: C.primaryBg, border: `1px solid ${C.primary}`,
                      color: C.primary, borderRadius: 8, fontSize: 14, marginBottom: 20, lineHeight: 1.5,
                    }}>
                      {errorMsg}
                    </div>
                  )}

                  {/* Role Toggle */}
                  <div style={{ marginBottom: 22 }}>
                    <p style={{ marginBottom: 10, fontSize: 12, fontWeight: 700, color: C.textMuted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                      I am a…
                    </p>
                    <div className="role-track">
                      <div className={`role-pill ${role}`}><div className="pill-shimmer" /></div>
                      <button type="button" className={`role-btn ${role === 'buyer' ? 'active' : 'inactive'}`} onClick={() => setRole('buyer')}>
                        <span className="role-icon">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke={role === 'buyer' ? '#fff' : C.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <path d="M16 10a4 4 0 01-8 0"/>
                          </svg>
                        </span>
                        Buyer
                        <span className="role-dot" />
                      </button>
                      <button type="button" className={`role-btn ${role === 'seller' ? 'active' : 'inactive'}`} onClick={() => setRole('seller')}>
                        <span className="role-icon">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke={role === 'seller' ? '#fff' : C.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                            <line x1="8" y1="21" x2="16" y2="21"/>
                            <line x1="12" y1="17" x2="12" y2="21"/>
                            <path d="M9 11l3-3 3 3"/>
                          </svg>
                        </span>
                        Seller
                        <span className="role-dot" />
                      </button>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <span className="role-status-label">
                        {role === 'buyer' ? '🛍 Shopping mode' : '🏪 Store mode'}
                      </span>
                    </div>
                  </div>

                  {/* Desktop Form */}
                  <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 7 }}>
                        Email Address
                      </label>
                      <input
                        className="login-input"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Password</label>
                        <span
                          onClick={() => navigate('/forgot-password')}
                          style={{ color: C.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                          Forgot Password?
                        </span>
                      </div>
                      <input
                        className="login-input"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                    </div>
                    <button type="submit" className="submit-btn" disabled={loading}>
                      {loading ? 'Verifying…' : 'Sign In'}
                    </button>
                  </form>

                  {/* Divider */}
                  <div style={{ position: 'relative', padding: '22px 0' }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: '100%', borderTop: `1px solid ${C.border}` }} />
                    </div>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                      <span style={{ background: C.surface, padding: '0 14px', color: C.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <div className="social-grid">
                    <button className="social-btn" onClick={handleGoogleLogin} disabled={loading}>
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </button>
                  </div>

                  <p style={{ textAlign: 'center', fontSize: 14, color: C.textMuted, margin: 0 }}>
                    Don't have an account?{' '}
                    <span
                      onClick={() => navigate('/register')}
                      style={{ color: C.primary, fontWeight: 700, cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                      Create an account
                    </span>
                  </p>

                </div>
              </div>
            </div>
          </main>
        </div>{/* /desktop-view */}


        {/* ════════════════════════════════════════════════════════════════
            MOBILE  (< 1024 px) — new bottom-sheet design
        ════════════════════════════════════════════════════════════════ */}
        <div className="mobile-view mobile-view--photo">

          {/* Photo — top portion only, like the reference (not full-bleed behind the sheet) */}
          <div className="photo-panel" style={{ backgroundImage: `url(${loginBgImage})` }}>
            {/* Floating "Sign up" pill — mirrors the reference's opposite-action button */}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="floating-pill"
            >
              Sign up
            </button>
          </div>

          {/* Bottom sheet card — covers the lower portion, photo stays visible above it */}
          <div className="bottom-sheet bottom-sheet--photo">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Close"
              className="sheet-close-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Heading */}
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.01em', color: C.primary, margin: '0 0 22px', textAlign: 'center' }}>
              Welcome back
            </h2>

            {/* Error */}
            {errorMsg && (
              <div role="alert" style={{
                padding: '10px 14px',
                background: C.primaryBg, border: `1px solid ${C.primary}`,
                color: C.primary, borderRadius: 10, fontSize: 13.5, marginBottom: 14, lineHeight: 1.5,
              }}>
                {errorMsg}
              </div>
            )}

            {/* Social buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              <button className="m-social-dark fr" onClick={handleGoogleLogin} disabled={loading} type="button">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            </div>

            {/* Divider */}
            <div style={{ position: 'relative', padding: '0 0 18px' }}>
              <div style={{ position: 'absolute', inset: 0, top: '50%', display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%', borderTop: `1px solid ${C.border}` }} />
              </div>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <span style={{ background: C.surface, padding: '0 14px', color: C.textMuted, fontSize: 12.5 }}>
                  or sign in with email
                </span>
              </div>
            </div>

            {/* Mobile Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }} noValidate>

              <div>
                <label htmlFor="m-email" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
                  Email
                </label>
                <input
                  id="m-email"
                  className="m-input fr"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="m-password" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="m-password"
                    className="m-input fr"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    style={{ paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 4, WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2px 0 4px' }}>
                <div
                  role="checkbox"
                  aria-checked={rememberMe}
                  tabIndex={0}
                  onClick={() => setRememberMe(v => !v)}
                  onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && setRememberMe(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
                >
                  <div className={`m-check fr${rememberMe ? ' checked' : ''}`}>
                    {rememberMe && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                        stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: 13, color: C.textMid, fontWeight: 500 }}>Remember me</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="fr"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: C.primary, fontSize: 13, fontWeight: 700,
                    padding: 0, fontFamily: 'inherit',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  Forget password?
                </button>
              </div>

              <button type="submit" className="m-submit fr" disabled={loading}>
                {loading ? 'Verifying…' : 'Sign in with email'}
              </button>
            </form>

          </div>{/* /bottom-sheet */}
        </div>{/* /mobile-view */}

      </div>
    </div>
  );
};

export default LoginPage;
