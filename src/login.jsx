import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';
import AuthDesktopShell, { RevealItem, AuthField, AuthCheck, PasswordToggle, GoogleMark } from './components/auth/AuthDesktopShell.jsx';
import { sanitizeInput, validateRequired, validateEmail } from './utils/securityUtils';
import { authLimiter } from './utils/rateLimiter';
import { SecureErrorHandler } from './utils/errorHandler';
import { upsertUserProfile } from './services/userProfileService';
import { useSEO } from './hooks/useSEO';
import VideoLoader from './components/VideoLoader.jsx';
import loginBgImage from './assets/images/onboarding/From Klickpin.com- 51 Face Mask Ideas for Entertaining-pin-id-1092052609666393734.jpg';
import loginDesktopImage from './assets/images/onboarding/From Klickpin.com- Modern dessert table inspiration that are perfect for beginners who still want an impressive result for your next Pinterest sav.jpg';
import { announceLoginSuccess } from './components/auth/loginSuccessEvent';

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

// ─── PAGE LOADER ─────────────────────────────────────────────────────────────
const PageLoader = ({ onDone }) => <VideoLoader duration={1200} onDone={onDone} />;
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
  const [role]                          = useState('buyer');
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
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

      // Shown by <LoginSuccess/> in App, which also handles the redirect —
      // this page unmounts as soon as LoginRoute sees the new session.
      announceLoginSuccess({ role: finalRole, user: data.user });
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
            DESKTOP  (≥ 1024 px) — split photo / form panel
        ════════════════════════════════════════════════════════════════ */}
        <div className="desktop-view">
          <AuthDesktopShell
            image={loginDesktopImage}
            imagePosition="62% 30%"
            tone="#8A5A36"
            headline="Carry what matters."
            blurb="Sign in to pick up your saved bags, track orders and message sellers directly on WhatsApp."
            footer="bagsearch.shop"
          >
            <RevealItem>
              <h2 className="ads-title">Welcome back.</h2>
              <p className="ads-sub">Log in to continue where you left off.</p>
            </RevealItem>

            <RevealItem>
              <p className="ads-switch">
                New to BagSearch?{' '}
                <button type="button" className="ads-link" onClick={() => navigate('/register')}>
                  Create an account
                </button>
              </p>
            </RevealItem>

            {errorMsg && (
              <RevealItem>
                <div role="alert" className="ads-alert">{errorMsg}</div>
              </RevealItem>
            )}

            <form onSubmit={handleLogin} noValidate>
              <RevealItem className="ads-grid">
                <AuthField
                  id="d-email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <AuthField
                  id="d-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword(v => !v)} />}
                />
              </RevealItem>

              <RevealItem style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 26 }}>
                <AuthCheck id="d-remember" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}>
                  Keep me signed in on this device
                </AuthCheck>
                <button type="button" className="ads-link" style={{ fontSize: 12 }} onClick={() => navigate('/forgot-password')}>
                  Forgot password?
                </button>
              </RevealItem>

              <RevealItem className="ads-actions">
                <button type="submit" className="ads-btn" disabled={loading}>
                  {loading ? 'Signing in…' : 'Log In'}
                </button>
                <button type="button" className="ads-ghost" onClick={handleGoogleLogin} disabled={loading}>
                  <GoogleMark />
                  Continue with Google
                </button>
              </RevealItem>
            </form>
          </AuthDesktopShell>
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
