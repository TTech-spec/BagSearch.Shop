// src/Reg.jsx
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext.jsx';
import { supabase, ensureSupabaseReady } from './services/api';

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

// ─── LUXURY PAGE LOADER (Warm Theme) ─────────────────────────────────────────
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
        @keyframes loaderPulseRing { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.22);opacity:0.8} }
        @keyframes loaderBagBounce { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-7px) scale(1.04)} }
        @keyframes loaderDot { 0%,80%,100%{transform:scale(0.55);opacity:0.25} 40%{transform:scale(1);opacity:1} }
        @keyframes loaderFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmerBar { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes loaderGlow { 0%,100%{box-shadow:0 8px 28px rgba(201,75,44,0.25)} 50%{box-shadow:0 8px 36px rgba(232,133,106,0.55)} }
        @keyframes loaderRingFade { 0%{transform:scale(0.85);opacity:0.6} 100%{transform:scale(1.6);opacity:0} }
      `}</style>
      
      {/* Ripple rings */}
      {[0,1].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: 130, height: 130,
          borderRadius: '50%',
          border: `1.5px solid ${C.primary}20`,
          animation: `loaderRingFade 2.2s ease-out ${i * 1.1}s infinite`
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
        <svg width="92" height="92" viewBox="0 0 92 92"
          style={{ position: 'absolute', inset: 0, animation: 'loaderSpin 1.9s linear infinite' }}>
          <circle cx="46" cy="46" r="40" fill="none" stroke={C.primaryBg} strokeWidth="2.5" />
          <circle cx="46" cy="46" r="40" fill="none" stroke={C.primary} strokeWidth="2.5"
            strokeDasharray={`${2 * Math.PI * 40 * progress / 100} ${2 * Math.PI * 40}`}
            strokeLinecap="round"
            style={{ transformOrigin: '46px 46px', transition: 'stroke-dasharray 0.08s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%)`,
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
          {[0,1,2].map(i => (
            <span key={i} style={{
              width: 4, height: 4, borderRadius: '50%',
              background: C.primary, display: 'inline-block',
              animation: `loaderDot 1.3s ease-in-out ${i * 0.18}s infinite`
            }} />
          ))}
        </span>
      </div>
      
      {/* Progress bar */}
      <div style={{ width: 'min(260px, 60vw)', animation: 'loaderFadeUp 0.55s ease 0.45s both' }}>
        <div style={{ height: 3, background: C.primaryBg, borderRadius: 9999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 9999,
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight}, ${C.primary})`,
            backgroundSize: '200% auto',
            animation: 'shimmerBar 1.5s linear infinite',
            transition: 'width 0.08s ease',
            boxShadow: `0 0 10px ${C.primary}75`,
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 8,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <span style={{ color: C.textFaint }}>BagSearch</span>
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
        boxShadow: '0 40px 80px rgba(26,10,0,0.25), 0 10px 30px rgba(201,75,44,0.2)',
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
          Welcome to BagSearch! 🎉
        </h2>

        <p style={{
          fontSize: 16,
          color: C.textMid,
          textAlign: 'center',
          marginBottom: 32,
          lineHeight: 1.6,
        }}>
          Your account has been created successfully.
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
              color: 'white',
              fontSize: 20,
              fontWeight: 'bold',
            }}>
              👤
            </div>
            <div>
              <p style={{ fontSize: 14, color: C.textMid, marginBottom: 2 }}>Joined as</p>
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
            <span>Redirecting to login</span>
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
            onClick={() => window.location.href = '/login?force=true'}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
              border: 'none',
              borderRadius: 16,
              color: 'white',
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
            Go to Login
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
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleRoleChange = (role) => {
    setFormData({ ...formData, role: (role || 'buyer').toLowerCase() });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.role === 'seller' && !formData.phone) newErrors.phone = 'Phone is required for sellers';
    if (!formData.terms) newErrors.terms = 'You must agree to the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrorMessage('');
      ensureSupabaseReady();

      const normalizedRole = (formData.role || 'buyer').toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName, role: normalizedRole, phone: formData.phone },
        },
      });

      if (signUpError) throw signUpError;
      if (!data?.user) throw new Error('Registration successful, but no user data returned. Check your email for confirmation.');

      const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
        data: { full_name: formData.fullName, role: normalizedRole, phone: formData.phone },
      });

      if (updateError) console.error('Failed to update user metadata:', updateError);
      else if (updatedUser) console.log('User metadata updated successfully, role:', updatedUser.user_metadata?.role);

      const { error: insertError } = await supabase.from('users').insert([{
        user_id: data.user.id,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: normalizedRole,
      }]);

      if (insertError) throw new Error(`Profile creation failed: ${insertError.message}`);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      login(currentUser || data.user);
      setShowSuccess(true);
      setTimeout(() => navigate('/login?force=true'), 3500);

    } catch (error) {
      console.error('Registration Flow Error:', error);
      setErrorMessage(error.message || 'An unexpected error occurred during registration.');
    } finally {
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
        
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        
        /* ── Role Toggle Styles (Warm Theme) ── */
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
        .dark .role-track {
          background: #2A1A10;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 1.5px ${C.primary}40;
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
        .dark .role-btn.inactive .role-icon-wrap {
          background: ${C.primary}30;
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
        .dark .role-status-label {
          background: ${C.primary}30;
          color: ${C.primaryLight};
        }

        /* Responsive styles */
        @media (max-width: 768px) {
          .register-header { padding-left: 16px !important; padding-right: 16px !important; }
          .register-form-container { padding: 24px 16px !important; }
        }
        @media (max-width: 480px) {
          .register-title { font-size: 32px !important; }
        }
      `}</style>
      
      <div style={{ 
        background: C.surfaceDim,  // #FDF8F5 very light peach
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Manrope, sans-serif',
        opacity: pageLoading ? 0 : 1,
        transition: 'opacity 0.5s ease'
      }}>

        {/* HEADER - White background for contrast */}
        <header style={{
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
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_6_535)">
                  <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd" />
                </g>
                <defs>
                  <clipPath id="clip0_6_535"><rect fill="white" height="48" width="48" /></clipPath>
                </defs>
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
              Bag<span style={{ color: C.primary }}>Search</span>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <div style={{ display: 'none', '@media (min-width: 768px)': { display: 'flex', gap: 32 } }}>
              <a href="#" style={{ color: C.text, fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                 onMouseEnter={e => e.currentTarget.style.color = C.primary}
                 onMouseLeave={e => e.currentTarget.style.color = C.text}>
                Shop
              </a>
              <a href="#" style={{ color: C.text, fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                 onMouseEnter={e => e.currentTarget.style.color = C.primary}
                 onMouseLeave={e => e.currentTarget.style.color = C.text}>
                Visual Search
              </a>
              <a href="#" style={{ color: C.text, fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                 onMouseEnter={e => e.currentTarget.style.color = C.primary}
                 onMouseLeave={e => e.currentTarget.style.color = C.text}>
                Help
              </a>
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
                transition: 'all 0.2s',
                boxShadow: `0 2px 8px ${C.primary}40`
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.accent}
              onMouseLeave={e => e.currentTarget.style.background = C.primary}>
              Login
            </button>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left Side - Hero (Warm Theme) */}
          <div style={{ 
            display: 'none', 
            '@media (min-width: 1024px)': { display: 'flex' },
            width: '50%',
            position: 'relative',
            background: C.primary,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.3,
                backgroundImage: "url('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(to top, ${C.primary}E6, transparent)`
            }} />
            <div style={{
              position: 'relative',
              zIndex: 10,
              padding: '0 48px',
              color: C.textLight,
              maxWidth: 600
            }}>
              <h1 style={{
                fontSize: 48,
                fontWeight: 900,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                marginBottom: 24
              }}>
                Step into the future of luxury.
              </h1>
              <p style={{
                fontSize: 18,
                fontWeight: 500,
                opacity: 0.9,
                marginBottom: 32,
                lineHeight: 1.6
              }}>
                Join 50,000+ fashion enthusiasts discovering perfect matches with our advanced Visual Search AI.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: 8,
                    borderRadius: '50%',
                    fontFamily: "'Material Symbols Outlined'"
                  }}>photo_camera</span>
                  <span style={{ fontWeight: 500 }}>Search by uploading a photo</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: 8,
                    borderRadius: '50%',
                    fontFamily: "'Material Symbols Outlined'"
                  }}>chat_bubble</span>
                  <span style={{ fontWeight: 500 }}>Real-time WhatsApp tracking</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: 8,
                    borderRadius: '50%',
                    fontFamily: "'Material Symbols Outlined'"
                  }}>verified</span>
                  <span style={{ fontWeight: 500 }}>Early access to limited drops</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="register-form-container" style={{
            width: '100%',
            '@media (min-width: 1024px)': { width: '50%' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            background: C.surface,
            overflowY: 'auto'
          }}>
            <div style={{ maxWidth: 480, width: '100%', display: 'flex', flexDirection: 'column', gap: 24, padding: '32px 0' }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h2 className="register-title" style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: C.text,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em'
                }}>
                  Create your account
                </h2>
                <p style={{
                  color: C.textMuted,
                  fontSize: 16,
                  fontWeight: 400
                }}>
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
                  background: C.dangerBg
                }}>
                  <div style={{
                    flexShrink: 0,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#FECACA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span className="material-symbols-outlined" style={{ color: C.danger, fontSize: 14, fontVariationSettings: "'FILL' 1" }}>error</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#991B1B', marginBottom: 4 }}>Registration failed</p>
                    <p style={{ fontSize: 12, color: '#B91C1C', lineHeight: 1.5 }}>{errorMessage}</p>
                  </div>
                  <button 
                    onClick={() => setErrorMessage('')}
                    style={{
                      flexShrink: 0,
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      padding: 2
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = C.danger}
                    onMouseLeave={e => e.currentTarget.style.color = '#EF4444'}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                  </button>
                </div>
              )}

              {/* ── Beautiful Role Toggle (Warm Theme) ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{
                  color: C.text,
                  fontSize: 14,
                  fontWeight: 600
                }}>
                  How do you want to join?
                </p>

                <div className="role-track">
                  {/* Sliding pill */}
                  <div className={`role-pill ${formData.role}`}>
                    <div className="pill-shimmer" />
                  </div>

                  {/* Buyer */}
                  <button
                    type="button"
                    className={`role-btn ${formData.role === 'buyer' ? 'active' : 'inactive'}`}
                    onClick={() => handleRoleChange('buyer')}
                  >
                    <span className="role-icon-wrap">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke={formData.role === 'buyer' ? '#fff' : C.primary}
                        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 01-8 0" />
                      </svg>
                    </span>
                    Join as Buyer
                    <span className="role-dot" />
                  </button>

                  {/* Seller */}
                  <button
                    type="button"
                    className={`role-btn ${formData.role === 'seller' ? 'active' : 'inactive'}`}
                    onClick={() => handleRoleChange('seller')}
                  >
                    <span className="role-icon-wrap">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke={formData.role === 'seller' ? '#fff' : C.primary}
                        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                        <path d="M9 11l3-3 3 3" />
                      </svg>
                    </span>
                    Join as Seller
                    <span className="role-dot" />
                  </button>
                </div>

                {/* Status badge */}
                <div>
                  <span className="role-status-label">
                    {formData.role === 'buyer' ? '🛍 Shopping mode' : '🏪 Store mode'}
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Full Name */}
                <label style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <p style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Full Name</p>
                  <input
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      padding: 16,
                      height: 56,
                      fontSize: 14,
                      color: C.text,
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    placeholder="Enter your full name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
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
                  {errors.fullName && <p style={{ color: C.danger, fontSize: 12, marginTop: 4 }}>{errors.fullName}</p>}
                </label>

                {/* Email */}
                <label style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <p style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Email Address</p>
                  <input
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      padding: 16,
                      height: 56,
                      fontSize: 14,
                      color: C.text,
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    placeholder="name@example.com"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
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
                  {errors.email && <p style={{ color: C.danger, fontSize: 12, marginTop: 4 }}>{errors.email}</p>}
                </label>

                {/* Phone */}
                <label style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <p style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>Phone Number</p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      background: C.primaryBg,
                      borderRadius: 4,
                      color: C.primary,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>chat</span>
                      WhatsApp Sync
                    </div>
                  </div>
                  <input
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      padding: 16,
                      height: 56,
                      fontSize: 14,
                      color: C.text,
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    id="phone-field"
                    placeholder="+1 (555) 000-0000"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = C.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${C.primary}20`;
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                    We'll send order updates and inventory notifications via WhatsApp.
                  </p>
                  {errors.phone && <p style={{ color: C.danger, fontSize: 12, marginTop: 4 }}>{errors.phone}</p>}
                </label>

                {/* Password */}
                <label style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <p style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Password</p>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{
                        width: '100%',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        padding: 16,
                        height: 56,
                        fontSize: 14,
                        color: C.text,
                        outline: 'none',
                        transition: 'all 0.2s',
                        paddingRight: 48
                      }}
                      placeholder="Create a strong password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
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
                    <button
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: C.textMuted,
                        cursor: 'pointer',
                        padding: 4
                      }}
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseEnter={e => e.currentTarget.style.color = C.primary}
                      onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
                      <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {errors.password && <p style={{ color: C.danger, fontSize: 12, marginTop: 4 }}>{errors.password}</p>}
                </label>

                {/* Terms */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 8 }}>
                  <input
                    style={{
                      marginTop: 2,
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      border: `1px solid ${C.border}`,
                      accentColor: C.primary,
                      cursor: 'pointer'
                    }}
                    id="terms"
                    type="checkbox"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleChange}
                    required
                  />
                  <label style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }} htmlFor="terms">
                    I agree to the <a href="#" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>Terms of Service</a> and <a href="#" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>Privacy Policy</a>.
                  </label>
                </div>
                {errors.terms && <p style={{ color: C.danger, fontSize: 12 }}>{errors.terms}</p>}

                {/* Submit */}
                <button
                  disabled={loading}
                  style={{
                    marginTop: 8,
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
                    boxShadow: `0 4px 12px ${C.primary}50`,
                    opacity: loading ? 0.7 : 1
                  }}
                  type="submit"
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
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div style={{ textAlign: 'center', paddingTop: 8 }}>
                <p style={{ color: C.textMuted, fontSize: 14, fontWeight: 500 }}>
                  Already have an account?{' '}
                  <span 
                    onClick={() => navigate('/login?force=true')} 
                    style={{
                      color: C.primary,
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginLeft: 4
                    }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                    Login
                  </span>
                </p>
              </div>

            </div>
          </div>
        </main>

        {/* Mobile Footer */}
        <footer style={{
          display: 'block',
          '@media (min-width: 1024px)': { display: 'none' },
          padding: 24,
          borderTop: `1px solid ${C.border}`,
          background: C.surface,
          textAlign: 'center'
        }}>
          <p style={{ color: C.textMuted, fontSize: 12 }}>© 2024 BagSearch. All rights reserved.</p>
        </footer>

        {/* Success Modal */}
        <SuccessToast show={showSuccess} onClose={() => setShowSuccess(false)} />
      </div>
    </>
  );
};

export default Reg;

