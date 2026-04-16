// src/Reg.jsx
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext.jsx';
import { supabase, ensureSupabaseReady } from './services/api';
import { upsertUserProfile } from './services/userProfileService';
import LogoIcon from './components/Logo.jsx';
import { sanitizeInput, validateRequired, validateEmail } from './utils/securityUtils';
import { authLimiter } from './utils/rateLimiter';
import { SecureErrorHandler } from './utils/errorHandler';

// ─── WARM COLOR PALETTE (BagSearch Theme) ───────────────────────────────────────
const C = {
  primary:      '#C94B2C',
  primaryLight: '#E8856A',
  primaryBg:    '#F9DDD0',
  primaryPale:  '#FFF5F2',
  primaryBorder:'#F0C8BB',
  accent:       '#B33A1E',
  success:      '#C94B2C',
  successBg:    '#F9DDD0',
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

// ─── SIMPLE MINIMAL PAGE LOADER ───────────────────────────────────────────────
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
          <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0, marginBottom: 2 }}>Account Created</p>
          <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>Redirecting to login…</p>
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

const Reg = () => {
  const navigate = useNavigate();
  const { login, setLoading, loading } = useContext(AuthContext);
  const [pageLoading, setPageLoading] = useState(true);
  const handleLoaderDone = useCallback(() => setPageLoading(false), []);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'buyer',
    terms: false,
  });

  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Sanitize input to prevent XSS
    const sanitizedValue = type === 'checkbox' ? checked : sanitizeInput(value);
    setFormData({ ...formData, [name]: sanitizedValue });
  };

  const handleRoleChange = (role) => {
    const sanitizedRole = sanitizeInput(role);
    setFormData({ ...formData, role: (sanitizedRole || 'buyer').toLowerCase() });
  };

  const validateForm = () => {
    const newErrors = {};
    
    try {
      validateRequired(sanitizeInput(formData.fullName), 'Full name');
    } catch (error) {
      newErrors.fullName = error.message;
    }
    
    try {
      const sanitizedEmail = sanitizeInput(formData.email);
      validateRequired(sanitizedEmail, 'Email');
      validateEmail(sanitizedEmail);
    } catch (error) {
      newErrors.email = error.message;
    }
    
    try {
      validateRequired(sanitizeInput(formData.password), 'Password');
    } catch (error) {
      newErrors.password = error.message;
    }
    
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.role === 'seller' && !formData.phone) {
      newErrors.phone = 'Phone is required for sellers';
    }
    
    if (!formData.terms) {
      newErrors.terms = 'You must agree to the terms';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !validateForm()) return;

    try {
      setLoading(true);
      setErrorMessage('');
      ensureSupabaseReady();

      // Rate limiting check
      const identifier = sanitizeInput(formData.email).trim().toLowerCase();
      if (!authLimiter.isAllowed(identifier)) {
        const secureError = SecureErrorHandler.handleError(new Error('Too many registration attempts. Please try again later.'), 'registration');
        setErrorMessage(secureError.message);
        setLoading(false);
        return;
      }

      const sanitizedFullName = sanitizeInput(formData.fullName);
      const sanitizedEmail = sanitizeInput(formData.email);
      const sanitizedPhone = sanitizeInput(formData.phone);
      const normalizedRole = (sanitizeInput(formData.role) || 'buyer').toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: sanitizeInput(formData.password),
        options: {
          data: { 
            full_name: sanitizedFullName,
            role: normalizedRole, 
            phone: sanitizedPhone
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!data?.user) throw new Error('Registration successful, but no user data returned. Check your email for confirmation.');

      const { error: insertError } = await upsertUserProfile({
        userId: data.user.id,
        fullName: sanitizedFullName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        role: normalizedRole,
      });

      // Don't block registration if profile upsert fails —
      // the DB trigger handle_new_user already creates the row
      if (insertError) {
        console.warn('Profile upsert failed (non-fatal):', insertError.message);
      }

      setShowSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      // If email already exists, redirect to login instead of showing a raw error
      const msg = error?.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered') || error?.status === 422) {
        setErrorMessage('An account with this email already exists. Redirecting to login…');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const secureError = SecureErrorHandler.handleError(error, 'registration');
        setErrorMessage(secureError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const normalizedRole = (formData.role || 'buyer').toLowerCase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/products`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
          data: { role: normalizedRole }
        },
      });
      if (error) throw error;
    } catch (error) {
      setErrorMessage(error.message);
      setLoading(false);
    }
  };

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

            .reg-input {
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
            .reg-input:focus {
              border-color:${C.primary};
              box-shadow:0 0 0 2px ${C.primary}20;
            }
            .reg-input::placeholder { color:${C.textFaint}; }

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
            .form-inner { width:100%;max-width:440px; }
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

          /* Focus ring */
          .fr:focus-visible { outline:2px solid ${C.primary};outline-offset:2px; }
        `}</style>

        {/* ════════════════════════════════════════════════════════════════
            DESKTOP  (≥ 1024 px) — matching login.jsx layout
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
            <button
              onClick={() => navigate('/login?force=true')}
              style={{
                background: C.primary, color: C.textLight, border: 'none',
                borderRadius: 8, padding: '8px 16px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'background 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.accent}
              onMouseLeave={e => e.currentTarget.style.background = C.primary}>
              Login
            </button>
          </header>

          <main style={{ flex: 1, display: 'flex' }}>
            <div style={{ display: 'flex', width: '100%' }}>

              {/* Image panel */}
              <div className="image-panel">
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: "url('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop')",
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
                    Step into the future of luxury.
                  </h1>
                  <p style={{ fontSize: 20, fontWeight: 500, opacity: 0.9, maxWidth: 400 }}>
                    Join 50,000+ fashion enthusiasts discovering perfect matches with our advanced Visual Search AI.
                  </p>
                </div>
              </div>

              {/* Form panel */}
              <div className="form-panel">
                <div className="form-inner">

                  <div style={{ marginBottom: 28 }}>
                    <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', color: C.text, margin: 0, marginBottom: 6 }}>
                      Create Account
                    </h2>
                    <p style={{ color: C.textMuted, margin: 0, fontSize: 16, lineHeight: 1.5 }}>
                      Ready to explore or start selling with BagSearch?
                    </p>
                  </div>

                  {/* Error Banner */}
                  {errorMessage && (
                    <div style={{
                      padding: '12px 16px', background: C.dangerBg, border: `1px solid ${C.danger}40`,
                      color: C.danger, borderRadius: 10, fontSize: 14, marginBottom: 20, lineHeight: 1.5,
                    }}>
                      {errorMessage}
                    </div>
                  )}

                  {/* Role Toggle */}
                  <div style={{ marginBottom: 24 }}>
                    <p style={{ marginBottom: 10, fontSize: 12, fontWeight: 700, color: C.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      I want to…
                    </p>
                    <div className="role-track">
                      <div className={`role-pill ${formData.role}`}><div className="pill-shimmer" /></div>
                      <button type="button" className={`role-btn ${formData.role === 'buyer' ? 'active' : 'inactive'}`} onClick={() => handleRoleChange('buyer')}>
                        <span className="role-icon">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke={formData.role === 'buyer' ? '#fff' : C.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <path d="M16 10a4 4 0 01-8 0"/>
                          </svg>
                        </span>
                        Buy Bags
                        <span className="role-dot" />
                      </button>
                      <button type="button" className={`role-btn ${formData.role === 'seller' ? 'active' : 'inactive'}`} onClick={() => handleRoleChange('seller')}>
                        <span className="role-icon">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke={formData.role === 'seller' ? '#fff' : C.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                            <line x1="8" y1="21" x2="16" y2="21"/>
                            <line x1="12" y1="17" x2="12" y2="21"/>
                            <path d="M9 11l3-3 3 3"/>
                          </svg>
                        </span>
                        Start Selling
                        <span className="role-dot" />
                      </button>
                    </div>
                  </div>

                  {/* Registration Form */}
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>Full Name</label>
                        <input
                          className="reg-input fr"
                          placeholder="John Doe"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                        />
                        {errors.fullName && <span style={{ color: C.danger, fontSize: 12, marginTop: 4, display: 'block' }}>{errors.fullName}</span>}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>Phone Number</label>
                        <input
                          className="reg-input fr"
                          placeholder="+1 (555) 000-0000"
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                        {errors.phone && <span style={{ color: C.danger, fontSize: 12, marginTop: 4, display: 'block' }}>{errors.phone}</span>}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>Email Address</label>
                      <input
                        className="reg-input fr"
                        placeholder="name@example.com"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      {errors.email && <span style={{ color: C.danger, fontSize: 12, marginTop: 4, display: 'block' }}>{errors.email}</span>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="reg-input fr"
                          style={{ paddingRight: 48 }}
                          placeholder="••••••••"
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                            background: 'transparent', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 4,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                      {errors.password && <span style={{ color: C.danger, fontSize: 12, marginTop: 4, display: 'block' }}>{errors.password}</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <input
                        id="terms-desktop"
                        type="checkbox"
                        name="terms"
                        checked={formData.terms}
                        onChange={handleChange}
                        required
                        style={{ marginTop: 3, width: 16, height: 16, accentColor: C.primary, cursor: 'pointer' }}
                      />
                      <label htmlFor="terms-desktop" style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5, cursor: 'pointer' }}>
                        I agree to the <a href="#" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}>Terms of Service</a> and <a href="#" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>.
                      </label>
                    </div>
                    {errors.terms && <span style={{ color: C.danger, fontSize: 12 }}>{errors.terms}</span>}

                    <button type="submit" className="submit-btn fr" disabled={loading} style={{ marginTop: 8 }}>
                      {loading ? 'Creating Account…' : 'Create Account'}
                    </button>
                  </form>

                  <div style={{ position: 'relative', margin: '24px 0' }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: '100%', borderTop: `1px solid ${C.border}` }} />
                    </div>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                      <span style={{ background: C.surface, padding: '0 12px', color: C.textMuted, fontSize: 12, textTransform: 'uppercase' }}>Or</span>
                    </div>
                  </div>

                  <button className="social-btn fr" onClick={handleGoogleAuth} disabled={loading} type="button">
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <p style={{ textAlign: 'center', color: C.textMuted, fontSize: 15, marginTop: 24 }}>
                    Already have an account?{' '}
                    <span
                      onClick={() => navigate('/login?force=true')}
                      style={{ color: C.primary, fontWeight: 700, cursor: 'pointer', marginLeft: 2 }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                      Login
                    </span>
                  </p>

                </div>
              </div>

            </div>
          </main>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            MOBILE  (< 1024 px) — matching login.jsx layout
        ════════════════════════════════════════════════════════════════ */}
        <div className="mobile-view">

          {/* Hero Banner (matches login structure) */}
          <div style={{
            position: 'relative', height: '24vh', minHeight: 180, overflow: 'hidden',
            background: C.primary, display: 'flex', alignItems: 'flex-end', padding: '24px 22px 50px',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: "url('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop')",
              backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.4,
            }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${C.primary} 15%, transparent 80%)` }} />
            <div style={{ position: 'relative', zIndex: 5 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Join BagSearch</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: '4px 0 0', fontWeight: 500 }}>Step into the future of luxury.</p>
            </div>
          </div>

          <div className="bottom-sheet">
            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: C.text, margin: 0, letterSpacing: '-0.02em', marginBottom: 6 }}>
                Create Account
              </h2>
              <p style={{ color: C.textMuted, margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                Enter your details to get started.
              </p>
            </div>

            {/* Error */}
            {errorMessage && (
              <div role="alert" style={{
                padding: '10px 14px',
                background: C.primaryBg, border: `1px solid ${C.primary}`,
                color: C.primary, borderRadius: 10, fontSize: 14, marginBottom: 16, lineHeight: 1.5,
              }}>
                {errorMessage}
              </div>
            )}

            {/* Role toggle */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ marginBottom: 8, fontSize: 11.5, fontWeight: 700, color: C.textMuted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                I am a…
              </p>
              <div className="role-track">
                <div className={`role-pill ${formData.role}`}><div className="pill-shimmer" /></div>
                <button type="button" className={`role-btn ${formData.role === 'buyer' ? 'active' : 'inactive'}`} onClick={() => handleRoleChange('buyer')}>
                  <span className="role-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke={formData.role === 'buyer' ? '#fff' : C.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                  </span>
                  Buyer
                  <span className="role-dot" />
                </button>
                <button type="button" className={`role-btn ${formData.role === 'seller' ? 'active' : 'inactive'}`} onClick={() => handleRoleChange('seller')}>
                  <span className="role-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke={formData.role === 'seller' ? '#fff' : C.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
            </div>

            {/* Mobile Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>

              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: C.text, marginBottom: 6 }}>Full Name</label>
                <input
                  className="m-input fr"
                  placeholder="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
                {errors.fullName && <span style={{ color: C.danger, fontSize: 12, marginTop: 4, display: 'block' }}>{errors.fullName}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: C.text, marginBottom: 6 }}>Email</label>
                <input
                  className="m-input fr"
                  type="email"
                  placeholder="example@email.com"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && <span style={{ color: C.danger, fontSize: 12, marginTop: 4, display: 'block' }}>{errors.email}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: C.text, marginBottom: 6 }}>Phone (WhatsApp)</label>
                <input
                  className="m-input fr"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
                {errors.phone && <span style={{ color: C.danger, fontSize: 12, marginTop: 4, display: 'block' }}>{errors.phone}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: C.text, marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="m-input fr"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={{ paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 4, WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {errors.password && <span style={{ color: C.danger, fontSize: 12, marginTop: 4, display: 'block' }}>{errors.password}</span>}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
                <div
                  role="checkbox"
                  aria-checked={formData.terms}
                  tabIndex={0}
                  onClick={() => setFormData(f => ({ ...f, terms: !f.terms }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
                >
                  <div className={`m-check fr${formData.terms ? ' checked' : ''}`}>
                    {formData.terms && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                        stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: C.textMid, fontWeight: 500, lineHeight: 1.4 }}>
                  I agree to the <a href="#" style={{ color: C.primary, fontWeight: 700 }}>Terms</a> and <a href="#" style={{ color: C.primary, fontWeight: 700 }}>Privacy</a>.
                </span>
              </div>

              <button type="submit" className="m-submit fr" disabled={loading} style={{ marginTop: 6 }}>
                {loading ? 'Verifying…' : 'Create Account'}
              </button>
            </form>

            <div style={{ position: 'relative', padding: '18px 0' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%', borderTop: `1px solid ${C.border}` }} />
              </div>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <span style={{ background: C.surface, padding: '0 14px', color: C.textMuted, fontSize: 12, textTransform: 'uppercase' }}>
                  Or
                </span>
              </div>
            </div>

            <button className="m-social fr" onClick={handleGoogleAuth} disabled={loading} type="button">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>

            <p style={{ textAlign: 'center', fontSize: 14, color: C.textMuted, margin: '18px 0 0' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login?force=true')}
                className="fr"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.primary, fontWeight: 700, fontSize: 14,
                  padding: 0, fontFamily: 'inherit',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Login
              </button>
            </p>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Reg;
