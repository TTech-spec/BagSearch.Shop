// src/Reg.jsx
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from './context/AuthContext.jsx';
import { supabase, ensureSupabaseReady } from './services/api';
import { upsertUserProfile } from './services/userProfileService';
import AuthDesktopShell, { RevealItem, AuthField, AuthCheck, PasswordToggle, GoogleMark } from './components/auth/AuthDesktopShell.jsx';
import regDesktopImage from './assets/images/onboarding/From Klickpin.com- 117867715236230969-pin-id-117867715236230969.jpg';
import { sanitizeInput, validateRequired, validateEmail } from './utils/securityUtils';
import { authLimiter } from './utils/rateLimiter';
import { SecureErrorHandler } from './utils/errorHandler';
import { useSEO } from './hooks/useSEO';
import VideoLoader from './components/VideoLoader.jsx';

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
const PageLoader = ({ onDone }) => <VideoLoader duration={1200} onDone={onDone} />;
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
  useSEO({ title: 'Create Account | BagSearch', noindex: true });
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
    businessName: '',
    dateOfBirth: '',
    terms: false,
  });

  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Desktop splits the name into two fields and asks for password confirmation;
  // both still feed the same formData.fullName / formData.password as mobile.
  const [nameParts, setNameParts] = useState({ first: '', last: '' });
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleNamePart = (part, value) => {
    const next = { ...nameParts, [part]: sanitizeInput(value) };
    setNameParts(next);
    setFormData(f => ({ ...f, fullName: `${next.first} ${next.last}`.trim() }));
  };

  // ─── MOBILE MULTI-STEP FLOW ─────────────────────────────────────────────
  // Desktop stays a single page; mobile splits into: 0 Role, 1 Details, 2 Password.
  const MOBILE_STEP_COUNT = 3;
  const [mobileStep, setMobileStep] = useState(0);
  const [stepDirection, setStepDirection] = useState(1);

  const goToStep = (nextStep, direction) => {
    setStepDirection(direction);
    setMobileStep(nextStep);
  };

  const validateDetailsStep = () => {
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
    if (formData.role === 'seller' && !formData.phone) {
      newErrors.phone = 'Phone is required for sellers';
    }
    if (formData.role === 'seller' && !formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required for sellers';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMobileNext = () => {
    if (mobileStep === 0) {
      goToStep(1, 1);
      return;
    }
    if (mobileStep === 1) {
      if (validateDetailsStep()) goToStep(2, 1);
      return;
    }
  };

  const handleMobileBack = () => {
    if (mobileStep > 0) goToStep(mobileStep - 1, -1);
  };

  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction > 0 ? -60 : 60, opacity: 0 }),
  };

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

    if (formData.role === 'seller' && !formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required for sellers';
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
        brandName: normalizedRole === 'seller' ? sanitizeInput(formData.businessName) : undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
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

  const handleDesktopSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== confirmPassword) {
      validateForm();
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }
    handleSubmit(e);
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const normalizedRole = (formData.role || 'buyer').toLowerCase();
      sessionStorage.setItem('oauth_mode', 'register');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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

          /* ── DESKTOP layout — shown at ≥ 1024 px ───────────────────── */
          .desktop-view { display: none; }

          @media (min-width: 1024px) {
            .mobile-view  { display: none !important; }
            .desktop-view { display: flex; flex-direction: column; min-height: 100dvh; }
          }

          /* ── MOBILE layout — shown below 1024 px ───────────────────── */
          .mobile-view {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background: ${C.surfaceDim};
            font-family: 'Poppins', system-ui, sans-serif;
          }
          .mobile-view button, .mobile-view input { font-family: inherit; }

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

          /* Mobile date input (Date of Birth) */
          .m-date {
            width:100%;display:block;
            border-radius:14px;
            border:1.5px solid ${C.border};
            background:${C.surfaceDim};
            padding:14px 16px;
            font-size:15px;
            color:${C.text};
            outline:none;
            transition:border-color 0.2s,box-shadow 0.2s,background 0.2s;
            font-family:inherit;
            appearance:none;
            -webkit-appearance:none;
            position:relative;
          }
          .m-date:focus {
            border-color:${C.primary};
            box-shadow:0 0 0 3px ${C.primary}18;
            background:${C.surface};
          }
          .m-date:not(:valid) { color:${C.textFaint}; }
          .m-date::-webkit-datetime-edit { color:inherit; }
          .m-date::-webkit-datetime-edit-fields-wrapper { padding:0; }
          .m-date::-webkit-inner-spin-button { display:none; }
          .m-date::-webkit-calendar-picker-indicator {
            cursor:pointer;
            padding:6px;
            margin-left:8px;
            border-radius:8px;
            opacity:1;
            filter:invert(41%) sepia(53%) saturate(1553%) hue-rotate(337deg) brightness(90%) contrast(89%);
            transition:background 0.2s;
          }
          .m-date::-webkit-calendar-picker-indicator:hover {
            background:${C.primaryBg};
          }

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

          /* ── Mobile step progress ──────────────────────────────────── */
          .step-track {
            height:4px;width:100%;background:${C.border};
            border-radius:2px;overflow:hidden;
          }
          .step-fill {
            height:100%;background:${C.primary};border-radius:2px;
          }
          .step-back-btn {
            all:unset;cursor:pointer;width:32px;height:32px;
            display:flex;align-items:center;justify-content:center;
            border-radius:50%;color:${C.text};
            -webkit-tap-highlight-color:transparent;
          }

          /* ── Role selection cards (step 0) ─────────────────────────── */
          .role-card {
            box-sizing:border-box;cursor:pointer;text-decoration:none;
            display:flex;align-items:center;gap:16px;padding:20px;
            border-radius:16px;border:2px solid ${C.border};
            background:${C.surface};
            transition:border-color 0.2s,background 0.2s,transform 0.15s;
            -webkit-tap-highlight-color:transparent;touch-action:manipulation;
            width:100%;font-family:inherit;text-align:left;
          }
          .role-card.selected {
            border-color:${C.primary};
            background:${C.primary};
          }
          .role-card-icon {
            width:44px;height:44px;border-radius:12px;flex-shrink:0;
            display:flex;align-items:center;justify-content:center;
            background:${C.primaryBg};transition:background 0.2s;
          }
          .role-card.selected .role-card-icon { background:rgba(255,255,255,0.18); }
          .role-card-title { font-size:16px;font-weight:700;color:${C.text}; }
          .role-card.selected .role-card-title { color:#fff; }
          .role-card-sub { font-size:13px;color:${C.textMuted}; }
          .role-card.selected .role-card-sub { color:rgba(255,255,255,0.7); }
        `}</style>

        {/* ════════════════════════════════════════════════════════════════
            DESKTOP  (≥ 1024 px) — split photo / form panel
        ════════════════════════════════════════════════════════════════ */}
        <div className="desktop-view">
          <AuthDesktopShell
            image={regDesktopImage}
            imagePosition="58% 22%"
            tone="#8E5E66"
            headline="Find your next bag."
            blurb="Shop verified sellers, search by photo, and save the pieces you love. Selling? Open a storefront in minutes."
            footer="bagsearch.shop"
          >
            <RevealItem>
              <h2 className="ads-title">Welcome to BagSearch.</h2>
              <p className="ads-sub">Let's help you get started.</p>
            </RevealItem>

            <RevealItem>
              <p className="ads-switch">
                Already have an account?{' '}
                <button type="button" className="ads-link" onClick={() => navigate('/login?force=true')}>
                  Log in
                </button>
              </p>
            </RevealItem>

            <RevealItem>
              <div className="ads-seg" role="group" aria-label="Account type">
                {[['buyer', 'I want to buy'], ['seller', 'I want to sell']].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={formData.role === value}
                    onClick={() => handleRoleChange(value)}
                  >
                    {formData.role === value && (
                      <motion.span
                        layoutId="ads-role-pill"
                        className="ads-seg-pill"
                        style={{ zIndex: -1 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    {label}
                  </button>
                ))}
              </div>
            </RevealItem>

            {errorMessage && (
              <div role="alert" className="ads-alert">{errorMessage}</div>
            )}

            <form onSubmit={handleDesktopSubmit} noValidate>
              <RevealItem className="ads-grid">
                <AuthField
                  id="d-first"
                  label="First Name"
                  value={nameParts.first}
                  onChange={e => handleNamePart('first', e.target.value)}
                  autoComplete="given-name"
                  error={errors.fullName}
                />
                <AuthField
                  id="d-last"
                  label="Last Name"
                  value={nameParts.last}
                  onChange={e => handleNamePart('last', e.target.value)}
                  autoComplete="family-name"
                />
                <AuthField
                  id="d-phone"
                  label={formData.role === 'seller' ? 'Phone (WhatsApp)' : 'Phone'}
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  error={errors.phone}
                />
                <AuthField
                  id="d-email"
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  error={errors.email}
                />

                <AnimatePresence initial={false}>
                  {formData.role === 'seller' && (
                    <motion.div
                      key="seller-fields"
                      className="span-2"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}
                    >
                      <AuthField
                        id="d-business"
                        label="Business Name"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        autoComplete="organization"
                        error={errors.businessName}
                        hint="Shown to buyers on your storefront."
                      />
                      <AuthField
                        id="d-dob"
                        label="Date of Birth (optional)"
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <AuthField
                  id="d-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  error={errors.password}
                  trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword(v => !v)} />}
                />
                <AuthField
                  id="d-confirm"
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  error={errors.confirmPassword}
                />
              </RevealItem>

              <RevealItem style={{ marginTop: 26 }}>
                <AuthCheck
                  id="d-terms"
                  checked={formData.terms}
                  onChange={e => setFormData(f => ({ ...f, terms: e.target.checked }))}
                  error={errors.terms}
                >
                  I agree to the{' '}
                  <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                </AuthCheck>
              </RevealItem>

              <RevealItem className="ads-actions">
                <button type="submit" className="ads-btn" disabled={loading}>
                  {loading ? 'Creating account…' : 'Sign Up'}
                </button>
                <button type="button" className="ads-ghost" onClick={handleGoogleAuth} disabled={loading}>
                  <GoogleMark />
                  Continue with Google
                </button>
              </RevealItem>
            </form>
          </AuthDesktopShell>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            MOBILE  (< 1024 px) — animated 3-step flow (Role → Details → Password)
        ════════════════════════════════════════════════════════════════ */}
        <div className="mobile-view" style={{ background: C.surface }}>

          {/* Logo */}
          <div style={{ padding: '20px 24px 0' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>
              Bag<span style={{ color: C.primary }}>Search</span>
            </div>
          </div>

          <div className="bottom-sheet" style={{ margin: 0, borderRadius: 0, flex: 1, padding: '20px 24px 44px' }}>

            {/* Step nav: back arrow + progress bar (steps 1 and 2) */}
            {mobileStep > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <motion.button
                  type="button"
                  className="step-back-btn"
                  onClick={handleMobileBack}
                  whileTap={{ scale: 0.88 }}
                  aria-label="Back"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </motion.button>
                <div style={{ flex: 1 }}>
                  <div className="step-track">
                    <motion.div
                      className="step-fill"
                      animate={{ width: `${(mobileStep / (MOBILE_STEP_COUNT - 1)) * 100}%` }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: C.textMuted, whiteSpace: 'nowrap' }}>
                  {mobileStep + 1} of {MOBILE_STEP_COUNT}
                </span>
              </div>
            )}

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

            <div style={{ overflow: 'hidden' }}>
              <AnimatePresence mode="wait" custom={stepDirection} initial={false}>

                {/* ── STEP 0: Role ─────────────────────────────────────── */}
                {mobileStep === 0 && (
                  <motion.div
                    key="step-role"
                    custom={stepDirection}
                    variants={slideVariants}
                    initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <div style={{ marginBottom: 32 }}>
                      <h2 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: 0, letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.25 }}>
                        Welcome to BagSearch
                      </h2>
                      <p style={{ color: C.textMuted, margin: 0, fontSize: 15, lineHeight: 1.5 }}>
                        Let's set up your account. Are you here to buy or sell?
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                      <motion.button
                        type="button"
                        className={`role-card${formData.role === 'buyer' ? ' selected' : ''}`}
                        onClick={() => handleRoleChange('buyer')}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="role-card-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                            stroke={formData.role === 'buyer' ? '#fff' : C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
                          </svg>
                        </span>
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span className="role-card-title">I want to buy</span>
                          <span className="role-card-sub">Browse and shop authentic bags</span>
                        </span>
                      </motion.button>

                      <motion.button
                        type="button"
                        className={`role-card${formData.role === 'seller' ? ' selected' : ''}`}
                        onClick={() => handleRoleChange('seller')}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="role-card-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                            stroke={formData.role === 'seller' ? '#fff' : C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                          </svg>
                        </span>
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span className="role-card-title">I want to sell</span>
                          <span className="role-card-sub">List your bags, free of charge</span>
                        </span>
                      </motion.button>
                    </div>

                    <motion.button
                      type="button"
                      className="m-submit fr"
                      onClick={handleMobileNext}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    >
                      Continue
                    </motion.button>

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
                  </motion.div>
                )}

                {/* ── STEP 1: Details ──────────────────────────────────── */}
                {mobileStep === 1 && (
                  <motion.div
                    key="step-details"
                    custom={stepDirection}
                    variants={slideVariants}
                    initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <div style={{ marginBottom: 20 }}>
                      <h2 style={{ fontSize: 22, fontWeight: 900, color: C.text, margin: 0, letterSpacing: '-0.02em', marginBottom: 6 }}>
                        Let's start with your details
                      </h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

                      <AnimatePresence initial={false}>
                        {formData.role === 'seller' && (
                          <motion.div
                            key="seller-fields"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 2 }}>
                              <div>
                                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: C.text, marginBottom: 6 }}>Business Name</label>
                                <input
                                  className="m-input fr"
                                  placeholder="e.g. Chioma's Bag Boutique"
                                  name="businessName"
                                  value={formData.businessName}
                                  onChange={handleChange}
                                  required={formData.role === 'seller'}
                                />
                                {errors.businessName && <span style={{ color: C.danger, fontSize: 12, marginTop: 4, display: 'block' }}>{errors.businessName}</span>}
                                <span style={{ fontSize: 11, color: C.textMuted, marginTop: 4, display: 'block' }}>Shown to buyers on your storefront instead of your name.</span>
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: C.text, marginBottom: 6 }}>Date of Birth <span style={{ color: C.textMuted, fontWeight: 500 }}>(optional)</span></label>
                                <div style={{ position: 'relative' }}>
                                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                    <rect x="3" y="4" width="18" height="18" rx="3" />
                                    <path d="M16 2v4M8 2v4M3 10h18" />
                                  </svg>
                                  <input
                                    className="m-date fr"
                                    type="date"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    max={new Date().toISOString().split('T')[0]}
                                    style={{ paddingLeft: 42 }}
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <motion.button
                      type="button"
                      className="m-submit fr"
                      onClick={handleMobileNext}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                      style={{ marginTop: 20 }}
                    >
                      Continue
                    </motion.button>
                  </motion.div>
                )}

                {/* ── STEP 2: Password + Terms + Submit ───────────────────── */}
                {mobileStep === 2 && (
                  <motion.div
                    key="step-password"
                    custom={stepDirection}
                    variants={slideVariants}
                    initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <div style={{ marginBottom: 20 }}>
                      <h2 style={{ fontSize: 22, fontWeight: 900, color: C.text, margin: 0, letterSpacing: '-0.02em', marginBottom: 6 }}>
                        Secure your account
                      </h2>
                      <p style={{ color: C.textMuted, margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                        Almost done — set a password to finish.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
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
                      {errors.terms && <span style={{ color: C.danger, fontSize: 12 }}>{errors.terms}</span>}

                      <motion.button
                        type="submit"
                        className="m-submit fr"
                        disabled={loading}
                        whileHover={loading ? {} : { y: -2 }}
                        whileTap={loading ? {} : { scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                        style={{ marginTop: 6 }}
                      >
                        {loading ? 'Verifying…' : 'Create Account'}
                      </motion.button>
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

                    <motion.button
                      className="m-social fr"
                      onClick={handleGoogleAuth}
                      disabled={loading}
                      type="button"
                      whileHover={loading ? {} : { y: -1 }}
                      whileTap={loading ? {} : { scale: 0.97 }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </motion.button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Reg;
