import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';

// ─── Luxury Page Loader ───────────────────────────────────────────────────────
const PageLoader = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0); // 0=filling, 1=exit

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 5 + 2;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setPhase(1), 500);
        setTimeout(() => onDone(), 1300);
      } else {
        setProgress(Math.min(p, 100));
      }
    }, 35);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#ffffff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 1 ? 0 : 1,
      transform: phase === 1 ? 'scale(1.03)' : 'scale(1)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
      pointerEvents: phase === 1 ? 'none' : 'all',
    }}>
      <style>{`
        @keyframes loaderSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes loaderPulseRing {
          0%,100%{transform:scale(1);opacity:1}
          50%{transform:scale(1.22);opacity:0.4}
        }
        @keyframes loaderBagBounce {
          0%,100%{transform:translateY(0) scale(1)}
          50%{transform:translateY(-7px) scale(1.04)}
        }
        @keyframes loaderDot {
          0%,80%,100%{transform:scale(0.55);opacity:0.25}
          40%{transform:scale(1);opacity:1}
        }
        @keyframes loaderFadeUp {
          from{opacity:0;transform:translateY(12px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes shimmerBar {
          0%{background-position:200% center}
          100%{background-position:-200% center}
        }
        @keyframes loaderGlow {
          0%,100%{box-shadow:0 8px 28px rgba(20,75,184,0.25)}
          50%{box-shadow:0 8px 36px rgba(20,75,184,0.55)}
        }
        @keyframes loaderRingFade {
          0%{transform:scale(0.85);opacity:0.6}
          100%{transform:scale(1.6);opacity:0}
        }
      `}</style>

      {/* Ripple rings */}
      {[0, 1].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: 130, height: 130,
          borderRadius: '50%',
          border: '1.5px solid rgba(20,75,184,0.2)',
          animation: `loaderRingFade 2.2s ease-out ${i * 1.1}s infinite`,
        }} />
      ))}

      {/* Soft bg blob */}
      <div style={{
        position: 'absolute',
        width: 280, height: 280,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(20,75,184,0.05) 0%, transparent 70%)',
        animation: 'loaderPulseRing 3s ease-in-out infinite',
      }} />

      {/* Main icon */}
      <div style={{ position: 'relative', width: 92, height: 92, marginBottom: 30 }}>
        <svg width="92" height="92" viewBox="0 0 92 92"
          style={{ position: 'absolute', inset: 0, animation: 'loaderSpin 1.9s linear infinite' }}>
          <circle cx="46" cy="46" r="40" fill="none" stroke="#eef1fb" strokeWidth="2.5" />
          <circle cx="46" cy="46" r="40" fill="none" stroke="#144bb8" strokeWidth="2.5"
            strokeDasharray={`${2 * Math.PI * 40 * progress / 100} ${2 * Math.PI * 40}`}
            strokeLinecap="round"
            style={{ transformOrigin: '46px 46px', transition: 'stroke-dasharray 0.08s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #144bb8 0%, #4f7ef7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'loaderBagBounce 1.7s ease-in-out infinite, loaderGlow 1.7s ease-in-out infinite',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
        </div>
      </div>

      {/* Brand */}
      <div style={{ animation: 'loaderFadeUp 0.55s ease 0.15s both', textAlign: 'center', marginBottom: 5 }}>
        <span style={{
          fontSize: 30, fontWeight: 900, letterSpacing: '-0.03em',
          color: '#111318', fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          Bags<span style={{ color: '#144bb8' }}>.NG</span>
        </span>
      </div>

      {/* Tagline + dots */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7, marginBottom: 38,
        animation: 'loaderFadeUp 0.55s ease 0.3s both',
      }}>
        <span style={{
          fontSize: 11, color: '#8a96b0', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          fontFamily: 'system-ui, sans-serif',
        }}>
          Loading your experience
        </span>
        <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              width: 4, height: 4, borderRadius: '50%',
              background: '#144bb8', display: 'inline-block',
              animation: `loaderDot 1.3s ease-in-out ${i * 0.18}s infinite`,
            }} />
          ))}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ width: 'min(260px, 60vw)', animation: 'loaderFadeUp 0.55s ease 0.45s both' }}>
        <div style={{ height: 3, background: '#eef1fb', borderRadius: 9999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 9999,
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #144bb8, #4f7ef7, #144bb8)',
            backgroundSize: '200% auto',
            animation: 'shimmerBar 1.5s linear infinite',
            transition: 'width 0.08s ease',
            boxShadow: '0 0 10px rgba(20,75,184,0.45)',
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 8,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <span style={{ color: '#c5cad8' }}>BAGS.NG</span>
          <span style={{ color: '#144bb8' }}>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

// ─── Success Toast Component — REDESIGNED ────────────────────────────────────
const SuccessToast = ({ show }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (show) {
      const t = setTimeout(() => setMounted(true), 20);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(-28px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
        @keyframes toastProgressDrain {
          from { width: 100%; }
          to   { width: 0%;   }
        }
        @keyframes toastCheckDraw {
          from { stroke-dashoffset: 36; opacity: 0; }
          to   { stroke-dashoffset: 0;  opacity: 1; }
        }
        @keyframes toastRipple {
          0%   { transform: scale(0.6); opacity: 0.7; }
          100% { transform: scale(2.0); opacity: 0;   }
        }
        @keyframes toastBadgeFade {
          from { opacity: 0; transform: translateX(8px); }
          to   { opacity: 1; transform: translateX(0);   }
        }
        @keyframes toastLineFill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes toastTextIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>

      {/* Full-width top banner — fixed at very top of screen */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        animation: 'toastSlideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        {/* Drain bar — runs for 3 seconds matching the redirect timeout */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.12)', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, #fff, rgba(255,255,255,0.5))',
            animation: 'toastProgressDrain 3s linear forwards',
            transformOrigin: 'left',
          }} />
        </div>

        {/* Banner body */}
        <div style={{
          background: 'linear-gradient(135deg, #0f2f7a 0%, #144bb8 55%, #1a5cd4 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 40px rgba(20,75,184,0.45)',
          padding: '0 24px',
        }}>
          <div style={{
            maxWidth: 1280, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: 68, gap: 20,
          }}>

            {/* Left — icon + message */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Animated check circle */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {/* Ripple rings */}
                {[0, 1].map(i => (
                  <div key={i} style={{
                    position: 'absolute', inset: -6 - i * 6,
                    borderRadius: '50%',
                    border: '1.5px solid rgba(255,255,255,0.25)',
                    animation: `toastRipple 1.8s ease-out ${i * 0.55}s infinite`,
                    pointerEvents: 'none',
                  }} />
                ))}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(4px)',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', zIndex: 1,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <polyline
                      points="4 13 9 18 20 7"
                      stroke="white" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round"
                      style={{
                        strokeDasharray: 36, strokeDashoffset: 36,
                        animation: 'toastCheckDraw 0.45s cubic-bezier(0.22,1,0.36,1) 0.25s forwards',
                      }}
                    />
                  </svg>
                </div>
              </div>

              {/* Text block */}
              <div>
                <p style={{
                  margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff',
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                  animation: 'toastTextIn 0.45s ease 0.15s both',
                }}>
                  Signed in successfully
                </p>
                <p style={{
                  margin: 0, marginTop: 2, fontSize: 12.5, color: 'rgba(255,255,255,0.65)',
                  fontWeight: 500, letterSpacing: '0.01em',
                  animation: 'toastTextIn 0.45s ease 0.22s both',
                }}>
                  Redirecting you to your dashboard in a moment…
                </p>
              </div>
            </div>

            {/* Right — brand + status pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
              animation: 'toastBadgeFade 0.4s ease 0.3s both',
            }}>
              {/* Pulsing dot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ position: 'relative', width: 8, height: 8 }}>
                  <div style={{
                    position: 'absolute', inset: -3, borderRadius: '50%',
                    background: 'rgba(134,239,172,0.35)',
                    animation: 'toastRipple 1.5s ease-out infinite',
                  }} />
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#86efac',
                    boxShadow: '0 0 8px rgba(134,239,172,0.8)',
                    position: 'relative', zIndex: 1,
                  }} />
                </div>
                <span style={{ fontSize: 12, color: '#86efac', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Active
                </span>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />

              {/* Brand */}
              <span style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.45)', letterSpacing: '-0.01em' }}>
                Bags<span style={{ color: 'rgba(255,255,255,0.9)' }}>.NG</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer so content doesn't hide under the banner */}
      <div style={{ height: 71 }} />
    </>
  );
};

// ─── Error Message — REDESIGNED ──────────────────────────────────────────────
const ErrorMessage = ({ message }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [message]);

  if (!message) return null;

  return (
    <>
      <style>{`
        @keyframes errSlideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes errShake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-5px); }
          40%     { transform: translateX(5px); }
          60%     { transform: translateX(-3px); }
          80%     { transform: translateX(3px); }
        }
        @keyframes errGlowPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
          50%     { box-shadow: 0 0 0 4px rgba(239,68,68,0.08); }
        }
        @keyframes errIconSpin {
          0%   { transform: rotate(0deg) scale(0.7); opacity: 0; }
          60%  { transform: rotate(15deg) scale(1.1); opacity: 1; }
          100% { transform: rotate(0deg) scale(1); opacity: 1; }
        }
        @keyframes errLineFill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>

      <div style={{
        borderRadius: 14,
        background: 'linear-gradient(135deg, #1a0808 0%, #1f0c0c 100%)',
        border: '1px solid rgba(239,68,68,0.25)',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(239,68,68,0.12), 0 1px 4px rgba(0,0,0,0.08)',
        animation: visible
          ? 'errSlideIn 0.38s cubic-bezier(0.22,1,0.36,1) both, errGlowPulse 2s ease-in-out 0.4s 2'
          : 'none',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {/* Top accent line — animates in */}
        <div style={{
          height: 2, background: 'rgba(239,68,68,0.15)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #ef4444, #f97316)',
            transformOrigin: 'left',
            animation: visible ? 'errLineFill 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both' : 'none',
          }} />
        </div>

        {/* Body */}
        <div style={{
          padding: '14px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          {/* Icon */}
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: visible ? 'errIconSpin 0.5s cubic-bezier(0.22,1,0.36,1) 0.05s both' : 'none',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#ef4444" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="13" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="12" cy="16.5" r="1.2" fill="#ef4444" />
            </svg>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0, fontSize: 12, fontWeight: 800,
              color: 'rgba(239,68,68,0.7)', letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 3,
            }}>
              Authentication Failed
            </p>
            <p style={{
              margin: 0, fontSize: 13.5, fontWeight: 500,
              color: 'rgba(255,255,255,0.75)', lineHeight: 1.55,
              animation: visible ? 'errSlideIn 0.4s ease 0.18s both' : 'none',
            }}>
              {message}
            </p>
          </div>
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '9px 16px 11px 62px',
          borderTop: '1px solid rgba(239,68,68,0.1)',
          background: 'rgba(239,68,68,0.04)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M12 2a5 5 0 100 10A5 5 0 0012 2zm0 13c-5 0-9 2.5-9 4v1h18v-1c0-1.5-4-4-9-4z"
              fill="rgba(239,68,68,0.5)" />
          </svg>
          <span style={{
            fontSize: 11, color: 'rgba(239,68,68,0.5)',
            fontWeight: 600, letterSpacing: '0.03em',
          }}>
            Double-check your email and password, then try again
          </span>
        </div>
      </div>
    </>
  );
};

// ─── Login Page ───────────────────────────────────────────────────────────────
const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [loading, setLoading] = useState(false);
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
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', profileError);
      }
      const finalRole = profile?.role || role;
      const { error: upsertError } = await supabase.from('users').upsert({
        user_id: userId, email, role: finalRole, updated_at: new Date(),
      }, { onConflict: 'user_id' });
      if (upsertError) console.error('Error saving user role:', upsertError);
      const userWithRole = {
        ...data.user,
        user_metadata: { ...data.user.user_metadata, role: finalRole },
      };
      login(userWithRole);
      setShowSuccess(true);
      setTimeout(() => navigate('/products'), 3000);
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f6f6f8] dark:bg-[#111621] min-h-screen flex flex-col font-sans text-[#111318] dark:text-white">

      {/* ── Page Loader ── */}
      <PageLoader onDone={handleLoaderDone} />

      {/* ── Page Content (fades in after loader) ── */}
      <div style={{
        opacity: pageLoading ? 0 : 1,
        transition: 'opacity 0.5s ease',
        display: 'flex', flexDirection: 'column', minHeight: '100vh',
      }}>
        <SuccessToast show={showSuccess} />

        <style>{`
          .role-track {
            position: relative; display: flex; align-items: center;
            background: #fff; border-radius: 20px; padding: 6px;
            box-shadow: 0 2px 8px rgba(20,75,184,0.08), 0 0 0 1.5px rgba(20,75,184,0.10), inset 0 1px 0 rgba(255,255,255,0.9);
            width: 100%;
          }
          .dark .role-track { background: #1e2535; box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 1.5px rgba(20,75,184,0.2); }
          .role-pill {
            position: absolute; top: 6px; left: 6px;
            width: calc(50% - 6px); height: calc(100% - 12px);
            border-radius: 14px;
            transition: transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
            z-index: 0;
            background: linear-gradient(135deg, #144bb8 0%, #3b72f0 100%);
            box-shadow: 0 6px 20px rgba(20,75,184,0.35), 0 2px 6px rgba(20,75,184,0.2);
          }
          .role-pill.seller { transform: translateX(calc(100%)); }
          .role-pill.buyer  { transform: translateX(0); }
          .pill-shimmer { position: absolute; inset: 0; border-radius: 14px; overflow: hidden; pointer-events: none; }
          @keyframes shimmer {
            0%   { opacity: 0; transform: translateX(-100%) skewX(-15deg); }
            50%  { opacity: 1; }
            100% { opacity: 0; transform: translateX(300%) skewX(-15deg); }
          }
          .pill-shimmer::after {
            content: ''; position: absolute; top: 0; left: 0; width: 40%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
            animation: shimmer 2.4s ease-in-out infinite 0.8s;
          }
          .role-btn {
            flex: 1; position: relative; z-index: 1; border: none; background: transparent;
            border-radius: 14px; padding: 13px 8px; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            font-family: inherit; font-size: 13.5px; font-weight: 700; letter-spacing: 0.01em;
            transition: color 0.25s ease;
          }
          .role-btn.active   { color: #fff; }
          .role-btn.inactive { color: #8a96b0; }
          .role-btn.inactive:hover { color: #144bb8; }
          .role-icon {
            width: 24px; height: 24px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
            transition: background 0.25s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .role-btn.active .role-icon   { background: rgba(255,255,255,0.22); transform: scale(1.15); }
          .role-btn.inactive .role-icon { background: #f0f4ff; }
          .dark .role-btn.inactive .role-icon { background: rgba(20,75,184,0.15); }
          .role-dot {
            width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.75);
            position: absolute; bottom: 9px; left: 50%;
            transform: translateX(-50%) scale(0);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s;
          }
          .role-btn.active .role-dot { transform: translateX(-50%) scale(1); }
          .role-status-label {
            font-size: 11.5px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase;
            padding: 5px 14px; border-radius: 999px;
            background: rgba(20,75,184,0.08); color: #144bb8;
            display: inline-block; transition: all 0.3s ease;
          }
          .dark .role-status-label { background: rgba(20,75,184,0.2); color: #7baaf7; }
        `}</style>

        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#f0f2f4] dark:border-gray-800 px-6 md:px-10 py-3 bg-white dark:bg-[#111621] z-10">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 text-[#144bb8]">
              <svg fill="currentColor" viewBox="0 0 48 48">
                <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold">Bags.NG</h2>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium">
            <a href="#" className="hover:text-[#144bb8]">Shop</a>
            <a href="#" className="hover:text-[#144bb8]">Collections</a>
          </div>
          <button className="bg-[#144bb8] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-opacity-90">
            WhatsApp Support
          </button>
        </header>

        <main className="flex-grow flex">
          <div className="flex w-full">
            {/* Left Side */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#144bb8]/10">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop')` }}
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative z-10 flex flex-col justify-end p-20 text-white w-full">
                <h1 className="text-5xl font-black leading-tight mb-4">Elevate Your Everyday.</h1>
                <p className="text-xl font-medium opacity-90 max-w-md">Discover our exclusive collection of premium bags.</p>
              </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 md:p-20 bg-white dark:bg-[#111621]">
              <div className="w-full max-w-[440px] space-y-8">
                <div>
                  <h2 className="text-4xl font-black tracking-tight">Welcome Back</h2>
                  <p className="text-[#636f88] dark:text-gray-400 mt-2">Enter your details to access your account.</p>
                </div>

                {/* ── REDESIGNED ERROR MESSAGE ── */}
                {errorMsg && <ErrorMessage message={errorMsg} />}

                {/* Role Toggle */}
                <div>
                  <p style={{
                    marginBottom: 12, fontSize: 12, fontWeight: 700,
                    color: '#8a96b0', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'inherit',
                  }}>I am a…</p>
                  <div className="role-track">
                    <div className={`role-pill ${role}`}>
                      <div className="pill-shimmer" />
                    </div>
                    <button type="button" className={`role-btn ${role === 'buyer' ? 'active' : 'inactive'}`} onClick={() => setRole('buyer')}>
                      <span className="role-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke={role === 'buyer' ? '#fff' : '#144bb8'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                          stroke={role === 'seller' ? '#fff' : '#144bb8'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                  <div style={{ marginTop: 12 }}>
                    <span className="role-status-label">
                      {role === 'buyer' ? '🛍 Shopping mode' : '🏪 Store mode'}
                    </span>
                  </div>
                </div>

                {/* Login Form */}
                <form className="space-y-5" onSubmit={handleLogin}>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Email Address</label>
                    <input
                      className="w-full rounded-lg border border-[#dcdfe5] dark:border-gray-700 bg-white dark:bg-gray-800 p-4 focus:ring-2 focus:ring-[#144bb8]/20 outline-none transition-all"
                      type="email" placeholder="Enter your email"
                      value={email} onChange={(e) => setEmail(e.target.value)} required
                    />
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <label className="block text-sm font-semibold mb-2">Password</label>
                      <span onClick={() => navigate('/forgot-password')} className="text-[#144bb8] text-xs font-bold hover:underline cursor-pointer">
                        Forgot Password?
                      </span>
                    </div>
                    <input
                      className="w-full rounded-lg border border-[#dcdfe5] dark:border-gray-700 bg-white dark:bg-gray-800 p-4 focus:ring-2 focus:ring-[#144bb8]/20 outline-none transition-all"
                      type="password" placeholder="Enter your password"
                      value={password} onChange={(e) => setPassword(e.target.value)} required
                    />
                  </div>
                  <button
                    type="submit" disabled={loading}
                    className="w-full rounded-lg h-14 bg-[#144bb8] text-white text-base font-bold hover:bg-opacity-90 transition-all shadow-md shadow-[#144bb8]/20"
                  >
                    {loading ? 'Verifying...' : 'Sign In'}
                  </button>
                </form>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-[#111621] px-4 text-[#636f88]">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-3 h-12 border border-[#dcdfe5] dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-sm font-semibold">Google</span>
                  </button>
                  <button className="flex items-center justify-center gap-3 h-12 border border-[#dcdfe5] dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-sm font-semibold">Facebook</span>
                  </button>
                </div>

                <p className="text-center text-sm text-[#636f88] pt-4">
                  Don't have an account?{' '}
                  <span onClick={() => navigate('/register')} className="text-[#144bb8] font-bold hover:underline cursor-pointer">
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