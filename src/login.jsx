import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';

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

// ─── SIMPLE PAGE LOADER ──────────────────────────────────────────────────────
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
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{
        width: 36, height: 36,
        borderRadius: '50%',
        border: `3px solid ${C.primaryBg}`,
        borderTopColor: C.primary,
        animation: 'spin 0.75s linear infinite',
      }} />
    </div>
  );
};

// ─── SUCCESS CARD ─────────────────────────────────────────────────────────────
// Desktop: slides in from the left
// Mobile : slides up from the bottom (centered)
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
      // Double-rAF ensures the element is painted before the transition fires
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
    position: 'fixed',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: C.surface,
    border: `1.5px solid ${C.primaryBorder}`,
    borderRadius: 14,
    padding: '14px 18px',
    boxShadow: '0 8px 30px rgba(26,10,0,0.14)',
    boxSizing: 'border-box',
  };

  const mobileCard = {
    ...sharedCard,
    bottom: 20,
    left: '50%',
    width: 'calc(100vw - 32px)',
    maxWidth: 360,
    // CSS transition (not animation) so we can JS-toggle mounted
    transform: mounted ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(140%)',
    opacity: mounted ? 1 : 0,
    transition: mounted
      ? 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease'
      : 'transform 0.35s ease, opacity 0.3s ease',
  };

  const desktopCard = {
    ...sharedCard,
    bottom: 28,
    left: 28,
    minWidth: 260,
    maxWidth: 320,
    animation: mounted
      ? 'successSlideIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards'
      : 'successSlideOut 0.35s ease forwards',
  };

  return (
    <>
      <style>{`
        @keyframes successSlideIn {
          from { transform: translateX(-120%); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes successSlideOut {
          from { transform: translateX(0);     opacity: 1; }
          to   { transform: translateX(-120%); opacity: 0; }
        }
      `}</style>
      <div style={isMobile ? mobileCard : desktopCard}>
        {/* Check icon */}
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

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0, marginBottom: 2 }}>
            Login Successful
          </p>
          <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>
            Redirecting you now…
          </p>
        </div>

        {/* Close */}
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

// ─── Login Page ───────────────────────────────────────────────────────────────
const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('buyer');
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const handleLoaderDone = useCallback(() => setPageLoading(false), []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const userId = data.user.id;
      const { data: profile, error: profileError } = await supabase
        .from('users').select('role').eq('user_id', userId).single();

      if (profile && profile.role && profile.role !== role) {
        await supabase.auth.signOut();
        throw new Error(`Invalid details. Please toggle to the role you registered for (${profile.role === 'seller' ? 'Seller' : 'Buyer'}) to login.`);
      }

      if (profileError && profileError.code !== 'PGRST116' && profileError.name !== 'AbortError') {
        console.error('Error fetching user profile:', JSON.stringify(profileError, null, 2));
      }
      const finalRole = profile?.role || role;
      const { error: upsertError } = await supabase.from('users').upsert({
        user_id: userId, email, role: finalRole, updated_at: new Date(),
      }, { onConflict: 'user_id' });
      if (upsertError && upsertError.name !== 'AbortError') console.error('Error saving user role:', JSON.stringify(upsertError, null, 2));

      setShowSuccess(true);
      setTimeout(() => navigate('/products'), 3500);
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/products`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
          data: { role },
        },
      });
      if (error) throw error;
    } catch (error) {
      setErrorMsg(error.message);
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

        <style>{`
          *, *::before, *::after { box-sizing: border-box; }

          /* ─ Role toggle ─ */
          .role-track {
            position: relative; display: flex; align-items: center;
            background: #fff; border-radius: 20px; padding: 6px;
            box-shadow: 0 2px 8px rgba(201,75,44,0.08),
                        0 0 0 1.5px rgba(201,75,44,0.15),
                        inset 0 1px 0 rgba(255,255,255,0.9);
            width: 100%;
          }
          .role-pill {
            position: absolute; top: 6px; left: 6px;
            width: calc(50% - 6px); height: calc(100% - 12px);
            border-radius: 14px; z-index: 0;
            background: linear-gradient(135deg,#C94B2C 0%,#E8856A 100%);
            box-shadow: 0 6px 20px rgba(201,75,44,0.35), 0 2px 6px rgba(201,75,44,0.2);
            transition: transform 0.42s cubic-bezier(0.34,1.56,0.64,1);
          }
          .role-pill.seller { transform: translateX(100%); }
          .role-pill.buyer  { transform: translateX(0); }
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
            transition:background 0.25s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
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

          /* ─ Inputs ─ */
          .login-input {
            width:100%;display:block;
            border-radius:8px;
            border:1px solid ${C.border};
            background:${C.surface};
            padding:14px 16px;
            font-size:16px; /* prevents iOS auto-zoom */
            color:${C.text};
            outline:none;
            transition:border-color 0.2s, box-shadow 0.2s;
            font-family:inherit;
          }
          .login-input:focus {
            border-color:${C.primary};
            box-shadow:0 0 0 2px ${C.primary}20;
          }
          .login-input::placeholder { color:${C.textFaint}; }

          /* ─ Submit button ─ */
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

          /* ─ Social buttons ─ */
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

          /* ─ Layout ─ */
          .image-panel { display:none; }
          @media(min-width:1024px){
            .image-panel { display:flex;width:50%;position:relative;overflow:hidden;background:${C.primaryBg}; }
          }

          .form-panel {
            width:100%;
            display:flex;flex-direction:column;
            justify-content:center;align-items:center;
            padding:32px 20px 48px;
            background:${C.surface};
          }
          @media(min-width:1024px){
            .form-panel { width:50%;padding:48px; }
          }

          .form-inner { width:100%;max-width:400px; }

          .login-title { font-size:28px; }
          @media(min-width:400px){ .login-title { font-size:34px; } }
          @media(min-width:1024px){ .login-title { font-size:36px; } }

          .social-grid {
            display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;
          }
          @media(max-width:340px){
            .social-grid { grid-template-columns:1fr; }
          }

          .header-nav { display:none; }
          @media(min-width:768px){ .header-nav { display:flex;gap:24px; } }
        `}</style>

        {/* ── Header ── */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${C.border}`,
          padding: '12px 20px',
          background: C.surface, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, color: C.primary, flexShrink: 0 }}>
              <svg fill="currentColor" viewBox="0 0 48 48">
                <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" />
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
              Bag<span style={{ color: C.primary }}>Search</span>
            </h2>
          </div>

          <nav className="header-nav">
            {['Shop','Collections'].map(label => (
              <a key={label} href="#" style={{ color: C.text, fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
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

            {/* ── Image panel (desktop) ── */}
            <div className="image-panel">
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop')`,
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

            {/* ── Form panel ── */}
            <div className="form-panel">
              <div className="form-inner">

                {/* Heading */}
                <div style={{ marginBottom: 28 }}>
                  <h2 className="login-title" style={{ fontWeight: 900, letterSpacing: '-0.02em', color: C.text, margin: 0, marginBottom: 6 }}>
                    Welcome Back
                  </h2>
                  <p style={{ color: C.textMuted, margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                    Enter your details to access your account.
                  </p>
                </div>

                {/* Error */}
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
                          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 01-8 0" />
                        </svg>
                      </span>
                      Buyer
                      <span className="role-dot" />
                    </button>
                    <button type="button" className={`role-btn ${role === 'seller' ? 'active' : 'inactive'}`} onClick={() => setRole('seller')}>
                      <span className="role-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke={role === 'seller' ? '#fff' : C.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                          <path d="M9 11l3-3 3 3" />
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

                {/* Form */}
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

                {/* Social */}
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
                  <button className="social-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </button>
                </div>

                {/* Sign up */}
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
      </div>
    </div>
  );
};

export default LoginPage;