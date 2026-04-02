// src/Reg.jsx
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext.jsx';
import { supabase, ensureSupabaseReady } from './services/api';
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
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 6 + 3;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setFadeOut(true), 300);
        setTimeout(() => onDone(), 800);
      } else {
        setProgress(Math.min(p, 100));
      }
    }, 30);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: C.surface,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.45s ease',
      pointerEvents: fadeOut ? 'none' : 'all',
    }}>
      {/* Brand */}
      <span style={{
        fontSize: 26,
        fontWeight: 900,
        letterSpacing: '-0.03em',
        color: C.text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        marginBottom: 28,
      }}>
        Bag<span style={{ color: C.primary }}>Search</span>
      </span>

      {/* Progress bar */}
      <div style={{
        width: 200,
        height: 2,
        background: C.borderLight,
        borderRadius: 9999,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: C.primary,
          borderRadius: 9999,
          transition: 'width 0.06s ease',
        }} />
      </div>
    </div>
  );
};

// ─── SIMPLE SLIDE-IN SUCCESS TOAST ────────────────────────────────────────────
const SuccessToast = ({ show, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // small delay so CSS transition fires
      const t1 = setTimeout(() => setVisible(true), 30);
      const t2 = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onClose && onClose(), 400);
      }, 4500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setVisible(false);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(-110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes toastSlideOut {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(-110%); opacity: 0; }
        }
        .success-toast-card {
          animation: toastSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .success-toast-card.hiding {
          animation: toastSlideOut 0.35s ease forwards;
        }
      `}</style>

      <div
        className={`success-toast-card${!visible ? ' hiding' : ''}`}
        style={{
          position: 'fixed',
          bottom: 24,
          left: 20,
          zIndex: 9999,
          background: C.surface,
          border: `1.5px solid ${C.primaryBorder}`,
          borderLeft: `4px solid ${C.primary}`,
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 8px 28px rgba(26,10,0,0.12)',
          maxWidth: 'min(320px, calc(100vw - 40px))',
          width: '100%',
        }}
      >
        {/* Check icon */}
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: C.primaryBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14,
            fontWeight: 700,
            color: C.text,
            margin: 0,
            lineHeight: 1.3,
          }}>
            Account created!
          </p>
          <p style={{
            fontSize: 12,
            color: C.textMuted,
            margin: '2px 0 0',
            lineHeight: 1.4,
          }}>
            Redirecting to login…
          </p>
        </div>

        {/* Close */}
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => onClose && onClose(), 400);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: C.textMuted,
            cursor: 'pointer',
            padding: 2,
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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

      const normalizedRole = (sanitizeInput(formData.role) || 'buyer').toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: sanitizeInput(formData.email),
        password: sanitizeInput(formData.password),
        options: {
          data: { 
            full_name: sanitizeInput(formData.fullName), 
            role: normalizedRole, 
            phone: sanitizeInput(formData.phone) 
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!data?.user) throw new Error('Registration successful, but no user data returned. Check your email for confirmation.');

      const { error: insertError } = await supabase.from('users').upsert([{
        user_id: data.user.id,
        full_name: sanitizeInput(formData.fullName),
        email: sanitizeInput(formData.email),
        phone: sanitizeInput(formData.phone),
        role: normalizedRole,
      }], { onConflict: 'user_id' });

      if (insertError) throw insertError;

      setShowSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      const secureError = SecureErrorHandler.handleError(error, 'registration');
      setErrorMessage(secureError.message);
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
    <>
      <PageLoader onDone={handleLoaderDone} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        * { box-sizing: border-box; }

        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        /* ── Role Toggle ── */
        .role-track {
          position: relative;
          display: flex;
          align-items: center;
          background: ${C.surface};
          border-radius: 20px;
          padding: 6px;
          box-shadow: 0 2px 8px ${C.primary}15, 0 0 0 1.5px ${C.primary}20, inset 0 1px 0 rgba(255,255,255,0.9);
          width: 100%;
        }
        .role-pill {
          position: absolute;
          top: 6px;
          left: 6px;
          width: calc(50% - 6px);
          height: calc(100% - 12px);
          border-radius: 14px;
          z-index: 0;
          background: linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%);
          box-shadow: 0 6px 20px ${C.primary}60, 0 2px 6px ${C.primary}30;
          transition: transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
        }
        .role-pill.buyer  { transform: translateX(0); }
        .role-pill.seller { transform: translateX(100%); }
        .pill-shimmer {
          position: absolute;
          inset: 0;
          border-radius: 14px;
          overflow: hidden;
          pointer-events: none;
        }
        .pill-shimmer::after {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
          animation: pillShimmer 2.4s ease-in-out infinite 0.8s;
        }
        @keyframes pillShimmer {
          0%   { left: -40%; }
          100% { left: 140%; }
        }
        .role-btn {
          flex: 1;
          position: relative;
          z-index: 1;
          border: none;
          background: transparent;
          border-radius: 14px;
          padding: 13px 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: 0.01em;
          transition: color 0.25s ease;
        }
        .role-btn.active   { color: #fff; }
        .role-btn.inactive { color: ${C.textMuted}; }
        .role-btn.inactive:hover { color: ${C.primary}; }
        .role-icon-wrap {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.25s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .role-btn.active .role-icon-wrap {
          background: rgba(255,255,255,0.22);
          transform: scale(1.15);
        }
        .role-btn.inactive .role-icon-wrap {
          background: ${C.primaryBg};
        }
        .role-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(255,255,255,0.75);
          position: absolute;
          bottom: 9px;
          left: 50%;
          transform: translateX(-50%) scale(0);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s;
        }
        .role-btn.active .role-dot { transform: translateX(-50%) scale(1); }
        .role-status-label {
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 999px;
          background: ${C.primary}15;
          color: ${C.primary};
          display: inline-block;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        /* ── Input focus ── */
        .reg-input {
          width: 100%;
          border-radius: 8px;
          border: 1px solid ${C.border};
          background: ${C.surface};
          padding: 16px;
          height: 56px;
          font-size: 14px;
          color: ${C.text};
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .reg-input:focus {
          border-color: ${C.primary};
          box-shadow: 0 0 0 3px ${C.primary}18;
        }

        /* ── Left hero panel — hide on mobile ── */
        .hero-panel {
          display: none;
        }
        @media (min-width: 1024px) {
          .hero-panel {
            display: flex;
            width: 50%;
          }
          .form-panel {
            width: 50%;
          }
        }

        /* ── Nav links hide on mobile ── */
        .nav-links {
          display: none;
        }
        @media (min-width: 768px) {
          .nav-links {
            display: flex;
            gap: 32px;
          }
        }

        /* ── Footer shows on mobile only ── */
        .mobile-footer {
          display: block;
        }
        @media (min-width: 1024px) {
          .mobile-footer {
            display: none;
          }
        }

        /* ── Form padding on small screens ── */
        .form-panel {
          padding: 24px 16px;
        }
        @media (min-width: 480px) {
          .form-panel {
            padding: 32px 24px;
          }
        }
        @media (min-width: 640px) {
          .form-panel {
            padding: 32px 32px;
          }
        }
      `}</style>

      <div style={{
        background: C.surfaceDim,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Manrope, sans-serif',
        opacity: pageLoading ? 0 : 1,
        transition: 'opacity 0.5s ease'
      }}>

        {/* HEADER */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${C.border}`,
          padding: '12px 20px',
          background: C.surface,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LogoIcon size={22} />
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0 }}>
              Bag<span style={{ color: C.primary }}>Search</span>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div className="nav-links">
              {['Shop', 'Visual Search', 'Help'].map(label => (
                <a key={label} href="#" style={{ color: C.text, fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = C.primary}
                   onMouseLeave={e => e.currentTarget.style.color = C.text}>
                  {label}
                </a>
              ))}
            </div>
            <button
              onClick={() => navigate('/login?force=true')}
              style={{
                background: C.primary,
                color: C.textLight,
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.2s',
                boxShadow: `0 2px 8px ${C.primary}40`,
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.accent}
              onMouseLeave={e => e.currentTarget.style.background = C.primary}>
              Login
            </button>
          </div>
        </header>

        {/* MAIN */}
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left Hero */}
          <div className="hero-panel" style={{
            position: 'relative',
            background: C.primary,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.3,
              backgroundImage: "url('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop')",
              backgroundSize: 'cover', backgroundPosition: 'center'
            }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${C.primary}E6, transparent)` }} />
            <div style={{ position: 'relative', zIndex: 10, padding: '0 48px', color: C.textLight, maxWidth: 600 }}>
              <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 24 }}>
                Step into the future of luxury.
              </h1>
              <p style={{ fontSize: 18, fontWeight: 500, opacity: 0.9, marginBottom: 32, lineHeight: 1.6 }}>
                Join 50,000+ fashion enthusiasts discovering perfect matches with our advanced Visual Search AI.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { icon: 'photo_camera', label: 'Search by uploading a photo' },
                  { icon: 'chat_bubble',  label: 'Real-time WhatsApp tracking' },
                  { icon: 'verified',     label: 'Early access to limited drops' },
                ].map(({ icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: '50%', fontFamily: "'Material Symbols Outlined'" }}>{icon}</span>
                    <span style={{ fontWeight: 500 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div className="form-panel" style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            background: C.surface,
            overflowY: 'auto',
          }}>
            <div style={{ maxWidth: 480, width: '100%', display: 'flex', flexDirection: 'column', gap: 22, padding: '32px 0 40px' }}>

              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, color: C.text, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  Create your account
                </h2>
                <p style={{ color: C.textMuted, fontSize: 15, fontWeight: 400, margin: 0 }}>
                  Ready to explore or start selling with BagSearch?
                </p>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: `1px solid ${C.danger}40`,
                  background: C.dangerBg,
                }}>
                  <div style={{
                    flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                    background: '#FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="material-symbols-outlined" style={{ color: C.danger, fontSize: 14, fontVariationSettings: "'FILL' 1" }}>error</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#991B1B', margin: '0 0 4px' }}>Registration failed</p>
                    <p style={{ fontSize: 12, color: '#B91C1C', lineHeight: 1.5, margin: 0 }}>{errorMessage}</p>
                  </div>
                  <button onClick={() => setErrorMessage('')} style={{ flexShrink: 0, background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 2 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                  </button>
                </div>
              )}

              {/* Role Toggle */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ color: C.text, fontSize: 14, fontWeight: 600, margin: 0 }}>How do you want to join?</p>
                <div className="role-track">
                  <div className={`role-pill ${formData.role}`}>
                    <div className="pill-shimmer" />
                  </div>
                  {['buyer', 'seller'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`role-btn ${formData.role === r ? 'active' : 'inactive'}`}
                      onClick={() => handleRoleChange(r)}
                    >
                      <span className="role-icon-wrap">
                        {r === 'buyer' ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke={formData.role === 'buyer' ? '#fff' : C.primary}
                            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 01-8 0" />
                          </svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke={formData.role === 'seller' ? '#fff' : C.primary}
                            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                            <path d="M9 11l3-3 3 3" />
                          </svg>
                        )}
                      </span>
                      Join as {r.charAt(0).toUpperCase() + r.slice(1)}
                      <span className="role-dot" />
                    </button>
                  ))}
                </div>
                <div>
                  <span className="role-status-label">
                    {formData.role === 'buyer' ? '🛍 Shopping mode' : '🏪 Store mode'}
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Full Name */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>Full Name</span>
                  <input
                    className="reg-input"
                    placeholder="Enter your full name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                  {errors.fullName && <span style={{ color: C.danger, fontSize: 12 }}>{errors.fullName}</span>}
                </label>

                {/* Email */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>Email Address</span>
                  <input
                    className="reg-input"
                    placeholder="name@example.com"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && <span style={{ color: C.danger, fontSize: 12 }}>{errors.email}</span>}
                </label>

                {/* Phone */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>Phone Number</span>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', background: C.primaryBg, borderRadius: 4,
                      color: C.primary, fontSize: 10, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>chat</span>
                      WhatsApp
                    </span>
                  </div>
                  <input
                    className="reg-input"
                    placeholder="+1 (555) 000-0000"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  <span style={{ fontSize: 12, color: C.textMuted }}>
                    We'll send order updates via WhatsApp.
                  </span>
                  {errors.phone && <span style={{ color: C.danger, fontSize: 12 }}>{errors.phone}</span>}
                </label>

                {/* Password */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>Password</span>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="reg-input"
                      style={{ paddingRight: 48 }}
                      placeholder="Create a strong password"
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
                      onMouseEnter={e => e.currentTarget.style.color = C.primary}
                      onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
                      <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {errors.password && <span style={{ color: C.danger, fontSize: 12 }}>{errors.password}</span>}
                </label>

                {/* Terms */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <input
                    id="terms"
                    type="checkbox"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleChange}
                    required
                    style={{ marginTop: 2, width: 18, height: 18, accentColor: C.primary, cursor: 'pointer', flexShrink: 0 }}
                  />
                  <label htmlFor="terms" style={{ fontSize: 14, color: C.text, lineHeight: 1.5, cursor: 'pointer' }}>
                    I agree to the{' '}
                    <a href="#" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}
                       onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                       onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}
                       onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                       onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>Privacy Policy</a>.
                  </label>
                </div>
                {errors.terms && <span style={{ color: C.danger, fontSize: 12 }}>{errors.terms}</span>}

                {/* Submit */}
                <button
                  disabled={loading}
                  type="submit"
                  style={{
                    width: '100%', height: 54,
                    background: C.primary,
                    color: C.textLight,
                    fontSize: 15, fontWeight: 700,
                    border: 'none', borderRadius: 8,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s, transform 0.15s',
                    boxShadow: `0 4px 14px ${C.primary}50`,
                    opacity: loading ? 0.7 : 1,
                    marginTop: 4,
                  }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
                  onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = C.primary; e.currentTarget.style.transform = 'none'; }}}>
                  {loading ? 'Creating Account…' : 'Create Account'}
                </button>
              </form>

              {/* Divider */}
              <div style={{ position: 'relative', padding: '4px 0' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '100%', borderTop: `1px solid ${C.border}` }} />
                </div>
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                  <span style={{ background: C.surface, padding: '0 16px', color: C.textMuted, fontSize: 12, textTransform: 'uppercase' }}>
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google */}
              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  height: 48,
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  background: 'transparent', color: C.text,
                  fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s', opacity: loading ? 0.7 : 1,
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => !loading && (e.currentTarget.style.background = C.primaryBg)}
                onMouseLeave={e => !loading && (e.currentTarget.style.background = 'transparent')}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Login link */}
              <p style={{ textAlign: 'center', color: C.textMuted, fontSize: 14, fontWeight: 500, margin: 0 }}>
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
        </main>

        {/* Mobile footer */}
        <footer className="mobile-footer" style={{
          padding: '16px 24px',
          borderTop: `1px solid ${C.border}`,
          background: C.surface,
          textAlign: 'center',
        }}>
          <p style={{ color: C.textMuted, fontSize: 12, margin: 0 }}>© 2024 BagSearch. All rights reserved.</p>
        </footer>

        {/* Simple Success Toast */}
        <SuccessToast show={showSuccess} onClose={() => setShowSuccess(false)} />
      </div>
    </>
  );
};

export default Reg;
