import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';

// ─── WARM COLOR PALETTE (BagSearch Theme) ───────────────────────────────────────
const C = {
  primary:      '#C94B2C',      // Burnt orange
  primaryLight: '#E8856A',       // Lighter orange
  primaryBg:    '#F9DDD0',       // Peach
  primaryPale:  '#FFF5F2',       // Very light peach
  primaryBorder:'#F0C8BB',       // Peach border
  accent:       '#B33A1E',       // Darker orange
  success:      '#C94B2C',       // Use orange for success
  successBg:    '#F9DDD0',       // Peach background
  successLight: '#FCE8E0',       // Very light orange
  danger:       '#DC2626',
  dangerBg:     '#FEF2F2',
  surface:      '#FFFFFF',
  surfaceDim:   '#FDF8F5',       // Very light peach (main background)
  border:       '#F0D9CC',
  borderLight:  '#F7ECE4',
  text:         '#1A0A00',       // Dark brown (primary text)
  textMid:      '#7A4030',       // Medium brown (secondary text)
  textMuted:    '#B07060',       // Muted orange-brown (tertiary text)
  textLight:    '#FFFFFF',       // White text
  textFaint:    '#E8C4B5',       // Very light peach-brown
};

// ─── LUXURY PAGE LOADER (Warm Theme) ──────────────────────────────────────────
const PageLoader = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

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
      background: C.primaryBg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 1 ? 0 : 1,
      transform: phase === 1 ? 'scale(1.03)' : 'scale(1)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
      pointerEvents: phase === 1 ? 'none' : 'all',
    }}>
      <style>{`
        @keyframes loaderSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes loaderPulseRing {
          0%,100%{transform:scale(1);opacity:0.5}
          50%{transform:scale(1.22);opacity:0.8}
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
          0%,100%{box-shadow:0 8px 28px rgba(201,75,44,0.25)}
          50%{box-shadow:0 8px 36px rgba(201,75,44,0.55)}
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
          border: `1.5px solid ${C.primary}20`,
          animation: `loaderRingFade 2.2s ease-out ${i * 1.1}s infinite`,
        }} />
      ))}

      {/* Soft bg blob */}
      <div style={{
        position: 'absolute',
        width: 280, height: 280,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${C.primary}15 0%, transparent 70%)`,
        animation: 'loaderPulseRing 3s ease-in-out infinite',
      }} />

      {/* Main icon */}
      <div style={{ position: 'relative', width: 92, height: 92, marginBottom: 30 }}>
        {/* Spinning arc */}
        <svg width="92" height="92" viewBox="0 0 92 92"
          style={{ position: 'absolute', inset: 0, animation: 'loaderSpin 1.9s linear infinite' }}>
          <circle cx="46" cy="46" r="40" fill="none" stroke={`${C.primary}20`} strokeWidth="2.5" />
          <circle cx="46" cy="46" r="40" fill="none" stroke={C.primary} strokeWidth="2.5"
            strokeDasharray={`${2 * Math.PI * 40 * progress / 100} ${2 * Math.PI * 40}`}
            strokeLinecap="round"
            style={{ transformOrigin: '46px 46px', transition: 'stroke-dasharray 0.08s ease' }}
          />
        </svg>

        {/* Inner circle with bag icon */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'loaderBagBounce 1.7s ease-in-out infinite, loaderGlow 1.7s ease-in-out infinite',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke={C.textLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          Bag<span style={{ color: C.primary }}>Search</span>
        </span>
      </div>

      {/* Tagline + dots */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7, marginBottom: 38,
        animation: 'loaderFadeUp 0.55s ease 0.3s both',
      }}>
        <span style={{
          fontSize: 11, color: C.textMuted, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          fontFamily: 'system-ui, sans-serif',
        }}>
          Loading BagSearch experience
        </span>
        <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              width: 4, height: 4, borderRadius: '50%',
              background: C.primary, display: 'inline-block',
              animation: `loaderDot 1.3s ease-in-out ${i * 0.18}s infinite`,
            }} />
          ))}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ width: 'min(260px, 60vw)', animation: 'loaderFadeUp 0.55s ease 0.45s both' }}>
        <div style={{ height: 3, background: `${C.primary}15`, borderRadius: 9999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 9999,
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight}, ${C.primary})`,
            backgroundSize: '200% auto',
            animation: 'shimmerBar 1.5s linear infinite',
            transition: 'width 0.08s ease',
            boxShadow: `0 0 10px ${C.primary}80`,
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 8,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <span style={{ color: C.textMuted }}>BagSearch</span>
          <span style={{ color: C.primary }}>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

// ─── REDESIGNED SUCCESS MESSAGE - CREATIVE & ANIMATED ─────────────────────────
const SuccessToast = ({ show, onClose }) => {
  const [confetti, setConfetti] = useState([]);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    if (show) {
      setShowCheck(true);
      // Create confetti particles
      const particles = [];
      for (let i = 0; i < 30; i++) {
        particles.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 0.5,
          size: Math.random() * 8 + 4,
          color: i % 3 === 0 ? C.primary : i % 3 === 1 ? C.primaryBg : C.primaryLight,
          rotation: Math.random() * 360,
        });
      }
      setConfetti(particles);
      
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        setShowCheck(false);
        if (onClose) onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes slideUpScale {
          0% { opacity: 0; transform: translateY(60px) scale(0.8); }
          40% { opacity: 1; transform: translateY(-10px) scale(1.02); }
          70% { transform: translateY(5px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateY(300px) rotate(720deg); opacity: 0; }
        }
        @keyframes checkDraw {
          0% { stroke-dashoffset: 50; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes glowPulse {
          0%, 100% { filter: drop-shadow(0 0 15px ${C.primary}80); transform: scale(1); }
          50% { filter: drop-shadow(0 0 30px ${C.primary}); transform: scale(1.02); }
        }
        @keyframes floatBag {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(-5deg); }
          75% { transform: translateY(8px) rotate(5deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          80% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Confetti */}
      {confetti.map(particle => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.left}%`,
            top: '-50px',
            width: particle.size,
            height: particle.size,
            background: particle.color,
            borderRadius: particle.size < 6 ? '50%' : '2px',
            transform: `rotate(${particle.rotation}deg)`,
            animation: `confettiFall 2.5s ease-out ${particle.delay}s forwards`,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Main Toast Card */}
      <div style={{
        background: C.surface,
        borderRadius: 32,
        padding: '40px 48px',
        maxWidth: 480,
        width: '90%',
        boxShadow: `0 40px 80px rgba(26,10,0,0.25), 0 10px 30px ${C.primary}30`,
        animation: 'slideUpScale 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        position: 'relative',
        overflow: 'hidden',
        border: `2px solid ${C.primary}25`,
        pointerEvents: 'all',
      }}>
        {/* Decorative top bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight}, ${C.primaryBg}, ${C.primary})`,
          backgroundSize: '300% 100%',
          animation: 'shimmer 3s linear infinite',
        }} />

        {/* Floating bag icons in background */}
        {[1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              position: 'absolute',
              opacity: 0.03,
              fontSize: 80,
              right: i === 1 ? -20 : i === 2 ? 40 : 100,
              bottom: i === 1 ? -20 : i === 2 ? 60 : -10,
              transform: `rotate(${i * 15}deg)`,
              animation: `floatBag ${3 + i}s ease-in-out infinite`,
              color: C.primary,
            }}
          >
            👝
          </div>
        ))}

        {/* Success Icon with Check Animation */}
        <div style={{
          width: 100,
          height: 100,
          margin: '0 auto 28px',
          position: 'relative',
          animation: 'bounceIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}>
          {/* Outer ring */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.primaryBg}, ${C.primaryLight})`,
            animation: 'glowPulse 2s ease-in-out infinite',
          }} />
          
          {/* Inner circle */}
          <div style={{
            position: 'absolute',
            inset: 8,
            borderRadius: '50%',
            background: C.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Checkmark */}
            <svg width="50" height="40" viewBox="0 0 50 40" style={{ marginTop: 5 }}>
              <path
                d="M5 20 L20 35 L45 5"
                stroke={C.primary}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                style={{
                  strokeDasharray: 50,
                  strokeDashoffset: showCheck ? 0 : 50,
                  transition: `stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s`,
                }}
              />
            </svg>
          </div>
        </div>

        {/* Welcome Message */}
        <h2 style={{
          fontSize: 32,
          fontWeight: 900,
          color: C.text,
          textAlign: 'center',
          marginBottom: 8,
          fontFamily: "'Cormorant Garamond', serif",
          letterSpacing: '-0.02em',
        }}>
          Welcome Back! 🎉
        </h2>

        <p style={{
          fontSize: 16,
          color: C.textMid,
          textAlign: 'center',
          marginBottom: 32,
          lineHeight: 1.6,
        }}>
          You've successfully signed in to your account.
        </p>

        {/* User Info Preview */}
        <div style={{
          background: C.primaryBg,
          borderRadius: 20,
          padding: 20,
          marginBottom: 28,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 100,
            height: 100,
            background: `radial-gradient(circle, ${C.primary}15 0%, transparent 70%)`,
            borderRadius: '50%',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.textLight,
              fontSize: 20,
              fontWeight: 'bold',
            }}>
              👤
            </div>
            <div>
              <p style={{ fontSize: 14, color: C.textMid, marginBottom: 2 }}>Signed in as</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Premium Member</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
            fontSize: 12,
            color: C.textMuted,
            fontWeight: 600,
          }}>
            <span>Redirecting to dashboard</span>
            <span style={{ color: C.primary }}>3s</span>
          </div>
          <div style={{
            height: 6,
            background: `${C.primary}15`,
            borderRadius: 9999,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: '100%',
              background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`,
              animation: 'progressShrink 3s linear forwards',
            }} />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => window.location.href = '/products'}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
              border: 'none',
              borderRadius: 16,
              color: C.textLight,
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: `0 8px 20px ${C.primary}50`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 12px 30px ${C.primary}70`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 8px 20px ${C.primary}50`;
            }}
          >
            Go to Shop Now
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '16px',
              background: 'transparent',
              border: `2px solid ${C.primary}30`,
              borderRadius: 16,
              color: C.primary,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = C.primaryBg;
              e.currentTarget.style.borderColor = C.primary;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = `${C.primary}30`;
            }}
          >
            Stay Here
          </button>
        </div>

        {/* Brand Signature */}
        <div style={{
          textAlign: 'center',
          marginTop: 20,
          fontSize: 11,
          color: C.textMuted,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}>
          Bag<span style={{ color: C.primary, fontWeight: 800 }}>Search</span> • Luxury Redefined
        </div>
      </div>

      <style>{`
        @keyframes progressShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// ─── Login Page with Warm Theme ───────────────────────────────────────────────
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
      
      if (profile && profile.role && profile.role !== role) {
        await supabase.auth.signOut();
        throw new Error(`Invalid details. Please toggle to the role you registered for (${profile.role === 'seller' ? 'Seller' : 'Buyer'}) to login.`);
      }

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
      // Navigation happens after success message animation
      setTimeout(() => navigate('/products'), 3500);
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      background: C.surfaceDim,  // #FDF8F5 very light peach
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      fontFamily: 'sans-serif', 
      color: C.text  // Dark brown for maximum visibility
    }}>

      {/* ── Page Loader ── */}
      <PageLoader onDone={handleLoaderDone} />

      {/* ── Page Content (fades in after loader) ── */}
      <div style={{
        opacity: pageLoading ? 0 : 1,
        transition: 'opacity 0.5s ease',
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
      }}>
        <SuccessToast show={showSuccess} onClose={() => setShowSuccess(false)} />

        <style>{`
          .role-track {
            position: relative; display: flex; align-items: center;
            background: #FFFFFF; border-radius: 20px; padding: 6px;
            box-shadow: 0 2px 8px rgba(201,75,44,0.08), 0 0 0 1.5px rgba(201,75,44,0.15), inset 0 1px 0 rgba(255,255,255,0.9);
            width: 100%;
          }
          .dark .role-track { background: #2A1A10; box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 1.5px rgba(201,75,44,0.3); }
          .role-pill {
            position: absolute; top: 6px; left: 6px;
            width: calc(50% - 6px); height: calc(100% - 12px);
            border-radius: 14px;
            transition: transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
            z-index: 0;
            background: linear-gradient(135deg, #C94B2C 0%, #E8856A 100%);
            box-shadow: 0 6px 20px rgba(201,75,44,0.35), 0 2px 6px rgba(201,75,44,0.2);
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
          .role-btn.inactive { color: #B07060; }
          .role-btn.inactive:hover { color: #C94B2C; }
          .role-icon {
            width: 24px; height: 24px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
            transition: background 0.25s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .role-btn.active .role-icon   { background: rgba(255,255,255,0.22); transform: scale(1.15); }
          .role-btn.inactive .role-icon { background: #F9DDD0; }
          .dark .role-btn.inactive .role-icon { background: rgba(201,75,44,0.25); }
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
            background: rgba(201,75,44,0.08); color: #C94B2C;
            display: inline-block; transition: all 0.3s ease;
          }
          .dark .role-status-label { background: rgba(201,75,44,0.2); color: #E8856A; }

          /* Responsive styles */
          @media (max-width: 768px) {
            .login-container { padding: 16px !important; }
            .login-header { padding-left: 16px !important; padding-right: 16px !important; }
          }
          @media (max-width: 480px) {
            .login-form-container { padding: 24px 16px !important; }
            .login-title { font-size: 32px !important; }
          }
        `}</style>

        {/* Header - White background for contrast */}
        <header className="login-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${C.border}`,
          padding: '12px 24px',
          background: C.surface,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 24, height: 24, color: C.primary }}>
              <svg fill="currentColor" viewBox="0 0 48 48">
                <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" />
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
              Bag<span style={{ color: C.primary }}>Search</span>
            </h2>
          </div>
          <div style={{ display: 'none', gap: 24, '@media (min-width: 768px)': { display: 'flex' } }}>
            <a href="#" style={{ color: C.text, fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
               onMouseEnter={e => e.currentTarget.style.color = C.primary}
               onMouseLeave={e => e.currentTarget.style.color = C.text}>
              Shop
            </a>
            <a href="#" style={{ color: C.text, fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
               onMouseEnter={e => e.currentTarget.style.color = C.primary}
               onMouseLeave={e => e.currentTarget.style.color = C.text}>
              Collections
            </a>
          </div>
          <button style={{
            background: C.primary,
            color: C.textLight,
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: `0 2px 8px ${C.primary}40`
          }}
            onMouseEnter={e => e.currentTarget.style.background = C.accent}
            onMouseLeave={e => e.currentTarget.style.background = C.primary}>
            WhatsApp Support
          </button>
        </header>

        <main style={{ flex: 1, display: 'flex' }}>
          <div style={{ display: 'flex', width: '100%' }}>
            {/* Left Side - Warm Theme */}
            <div style={{ 
              display: 'none', 
              '@media (min-width: 1024px)': { display: 'flex' },
              width: '50%',
              position: 'relative',
              overflow: 'hidden',
              background: C.primaryBg
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'transform 0.7s',
                opacity: 0.8
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(to right, ${C.primary}80, transparent)`
              }} />
              <div style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: 80,
                color: C.textLight,
                width: '100%'
              }}>
                <h1 style={{
                  fontSize: 48,
                  fontWeight: 900,
                  lineHeight: 1.2,
                  marginBottom: 16,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}>
                  Elevate Your Everyday.
                </h1>
                <p style={{
                  fontSize: 20,
                  fontWeight: 500,
                  opacity: 0.9,
                  maxWidth: 400
                }}>
                  Discover our exclusive collection of premium bags.
                </p>
              </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="login-form-container" style={{
              width: '100%',
              '@media (min-width: 1024px)': { width: '50%' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 32,
              background: C.surface
            }}>
              <div style={{ width: '100%', maxWidth: 440 }}>
                <div style={{ marginBottom: 32 }}>
                  <h2 className="login-title" style={{
                    fontSize: 36,
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    color: C.text,
                    marginBottom: 8
                  }}>
                    Welcome Back
                  </h2>
                  <p style={{
                    color: C.textMuted,
                    marginTop: 8
                  }}>
                    Enter your details to access your account.
                  </p>
                </div>

                {errorMsg && (
                  <div style={{
                    padding: 12,
                    background: C.primaryBg,
                    border: `1px solid ${C.primary}`,
                    color: C.primary,
                    borderRadius: 8,
                    fontSize: 14,
                    marginBottom: 20
                  }}>
                    {errorMsg}
                  </div>
                )}

                {/* Role Toggle */}
                <div style={{ marginBottom: 24 }}>
                  <p style={{
                    marginBottom: 12,
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.textMuted,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase'
                  }}>
                    I am a…
                  </p>
                  <div className="role-track">
                    <div className={`role-pill ${role}`}>
                      <div className="pill-shimmer" />
                    </div>
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
                  <div style={{ marginTop: 12 }}>
                    <span className="role-status-label">
                      {role === 'buyer' ? '🛍 Shopping mode' : '🏪 Store mode'}
                    </span>
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 600,
                      color: C.text,
                      marginBottom: 8
                    }}>
                      Email Address
                    </label>
                    <input
                      style={{
                        width: '100%',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        padding: 16,
                        fontSize: 14,
                        color: C.text,
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      type="email" 
                      placeholder="Enter your email"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required
                      onFocus={e => {
                        e.currentTarget.style.borderColor = C.primary;
                        e.currentTarget.style.boxShadow = `0 0 0 2px ${C.primary}20`;
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: C.text
                      }}>
                        Password
                      </label>
                      <span 
                        onClick={() => navigate('/forgot-password')} 
                        style={{
                          color: C.primary,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                        Forgot Password?
                      </span>
                    </div>
                    <input
                      style={{
                        width: '100%',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        padding: 16,
                        fontSize: 14,
                        color: C.text,
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      type="password" 
                      placeholder="Enter your password"
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required
                      onFocus={e => {
                        e.currentTarget.style.borderColor = C.primary;
                        e.currentTarget.style.boxShadow = `0 0 0 2px ${C.primary}20`;
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <button
                    type="submit" 
                    disabled={loading}
                    style={{
                      width: '100%',
                      height: 56,
                      background: C.primary,
                      color: C.textLight,
                      fontSize: 16,
                      fontWeight: 700,
                      border: 'none',
                      borderRadius: 8,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: `0 4px 12px ${C.primary}40`,
                      opacity: loading ? 0.7 : 1
                    }}
                    onMouseEnter={e => {
                      if (!loading) {
                        e.currentTarget.style.background = C.accent;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!loading) {
                        e.currentTarget.style.background = C.primary;
                        e.currentTarget.style.transform = 'none';
                      }
                    }}>
                    {loading ? 'Verifying...' : 'Sign In'}
                  </button>
                </form>

                <div style={{ position: 'relative', padding: '24px 0' }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '100%',
                      borderTop: `1px solid ${C.border}`
                    }} />
                  </div>
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    textTransform: 'uppercase'
                  }}>
                    <span style={{
                      background: C.surface,
                      padding: '0 16px',
                      color: C.textMuted,
                      fontSize: 12
                    }}>
                      Or continue with
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                  marginBottom: 16
                }}>
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    height: 48,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    background: 'transparent',
                    color: C.text,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = C.primaryBg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span>Google</span>
                  </button>
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    height: 48,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    background: 'transparent',
                    color: C.text,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = C.primaryBg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span>Facebook</span>
                  </button>
                </div>

                <p style={{
                  textAlign: 'center',
                  fontSize: 14,
                  color: C.textMuted,
                  paddingTop: 8
                }}>
                  Don't have an account?{' '}
                  <span 
                    onClick={() => navigate('/register')} 
                    style={{
                      color: C.primary,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
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
