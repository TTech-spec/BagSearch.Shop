// src/Reg.jsx
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext.jsx';
import { supabase, ensureSupabaseReady } from './services/api';

// ─── WARM COLOR PALETTE (Criibb Theme) ───────────────────────────────────────
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
  surfaceDim:   '#FDF8F5',
  border:       '#F0D9CC',
  borderLight:  '#F7ECE4',
  text:         '#1A0A00',       // Dark brown
  textMid:      '#7A4030',       // Medium brown
  textMuted:    '#B07060',       // Muted orange-brown
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
          Bag<span style={{ color: C.primary }}>.NG</span>
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
          Loading your experience
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
          <span style={{ color: C.textFaint }}>BAGS.NG</span>
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
          Welcome to Bag.NG! 🎉
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
            onClick={() => window.location.href = '/login'}
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
          Bag<span style={{ color: C.primary, fontWeight: 800 }}>.NG</span> • Luxury Redefined
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
      setTimeout(() => navigate('/login'), 3500);

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
      
      <div className="bg-[#F5F0EE] dark:bg-[#1A0A00] font-display min-h-screen flex flex-col" style={{ opacity: pageLoading ? 0 : 1, transition: 'opacity 0.5s ease' }}>

        {/* HEADER */}
        <header className="register-header flex items-center justify-between whitespace-nowrap border-b border-solid border-[#F0C8BB] dark:border-[#7A4030] px-6 md:px-10 py-3 bg-white dark:bg-[#2A1A10] z-10">
          <div className="flex items-center gap-4 text-[#1A0A00] dark:text-white">
            <div className="size-6 text-[#C94B2C]">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_6_535)">
                  <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd" />
                </g>
                <defs>
                  <clipPath id="clip0_6_535"><rect fill="white" height="48" width="48" /></clipPath>
                </defs>
              </svg>
            </div>
            <h2 className="text-[#1A0A00] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Bag<span className="text-[#C94B2C]">.NG</span></h2>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <div className="hidden md:flex items-center gap-9">
              <a className="text-[#1A0A00] dark:text-slate-300 text-sm font-medium leading-normal hover:text-[#C94B2C] transition-colors" href="#">Shop</a>
              <a className="text-[#1A0A00] dark:text-slate-300 text-sm font-medium leading-normal hover:text-[#C94B2C] transition-colors" href="#">Visual Search</a>
              <a className="text-[#1A0A00] dark:text-slate-300 text-sm font-medium leading-normal hover:text-[#C94B2C] transition-colors" href="#">Help</a>
            </div>
            <button onClick={() => navigate('/login')} className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#C94B2C] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#B33A1E] transition-all">
              <span className="truncate">Login</span>
            </button>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex overflow-hidden">

          {/* Left Side - Hero (Warm Theme) */}
          <div className="hidden lg:flex lg:w-1/2 relative bg-[#C94B2C] items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0 opacity-30 bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#C94B2C]/90 via-transparent to-transparent" />
            <div className="relative z-10 px-12 text-white max-w-xl">
              <h1 className="text-5xl font-black leading-tight tracking-[-0.033em] mb-6">Step into the future of luxury.</h1>
              <p className="text-lg font-medium text-white/90 mb-8 leading-relaxed">
                Join 50,000+ fashion enthusiasts discovering perfect matches with our advanced Visual Search AI.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined bg-white/20 p-2 rounded-full">photo_camera</span>
                  <span className="font-medium">Search by uploading a photo</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined bg-white/20 p-2 rounded-full">chat_bubble</span>
                  <span className="font-medium">Real-time WhatsApp tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined bg-white/20 p-2 rounded-full">verified</span>
                  <span className="font-medium">Early access to limited drops</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="register-form-container w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-[#1A0A00] overflow-y-auto">
            <div className="max-w-[480px] w-full flex flex-col gap-6 py-8">

              <div className="flex flex-col gap-2">
                <h2 className="register-title text-[#1A0A00] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Create your account</h2>
                <p className="text-[#B07060] dark:text-[#E8856A] text-base font-normal leading-normal">Ready to explore or start selling with Bag.NG?</p>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="error-toast flex items-start gap-3 px-4 py-3.5 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40">
                  <div className="flex-shrink-0 mt-0.5 size-5 rounded-full bg-red-100 dark:bg-red-900/60 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-500 dark:text-red-400" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>error</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-300 leading-snug">Registration failed</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 leading-relaxed">{errorMessage}</p>
                  </div>
                  <button onClick={() => setErrorMessage('')} className="flex-shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-200 transition-colors" type="button">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                  </button>
                </div>
              )}

              {/* ── Beautiful Role Toggle (Warm Theme) ── */}
              <div className="flex flex-col gap-3">
                <p className="text-[#1A0A00] dark:text-slate-200 text-sm font-semibold leading-normal">How do you want to join?</p>

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
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                {/* Full Name */}
                <label className="flex flex-col w-full">
                  <p className="text-[#1A0A00] dark:text-slate-200 text-sm font-semibold leading-normal pb-2">Full Name</p>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#1A0A00] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#C94B2C]/50 border border-[#F0C8BB] dark:border-[#7A4030] bg-white dark:bg-[#2A1A10] focus:border-[#C94B2C] h-14 placeholder:text-[#B07060] p-[15px] text-base font-normal transition-all"
                    placeholder="Enter your full name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </label>

                {/* Email */}
                <label className="flex flex-col w-full">
                  <p className="text-[#1A0A00] dark:text-slate-200 text-sm font-semibold leading-normal pb-2">Email Address</p>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#1A0A00] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#C94B2C]/50 border border-[#F0C8BB] dark:border-[#7A4030] bg-white dark:bg-[#2A1A10] focus:border-[#C94B2C] h-14 placeholder:text-[#B07060] p-[15px] text-base font-normal transition-all"
                    placeholder="name@example.com"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </label>

                {/* Phone */}
                <label className="flex flex-col w-full">
                  <div className="flex items-center gap-2 pb-2">
                    <p className="text-[#1A0A00] dark:text-slate-200 text-sm font-semibold leading-normal" id="phone-label">Phone Number</p>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-[#F9DDD0] dark:bg-[#C94B2C]/30 rounded text-[#C94B2C] dark:text-[#E8856A] text-[10px] font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[12px]">chat</span>
                      WhatsApp Sync
                    </div>
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#1A0A00] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#C94B2C]/50 border border-[#F0C8BB] dark:border-[#7A4030] bg-white dark:bg-[#2A1A10] focus:border-[#C94B2C] h-14 placeholder:text-[#B07060] p-[15px] text-base font-normal transition-all"
                    id="phone-field"
                    placeholder="+1 (555) 000-0000"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-[#B07060] mt-1">We'll send order updates and inventory notifications via WhatsApp.</p>
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </label>

                {/* Password */}
                <label className="flex flex-col w-full">
                  <p className="text-[#1A0A00] dark:text-slate-200 text-sm font-semibold leading-normal pb-2">Password</p>
                  <div className="relative group">
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#1A0A00] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#C94B2C]/50 border border-[#F0C8BB] dark:border-[#7A4030] bg-white dark:bg-[#2A1A10] focus:border-[#C94B2C] h-14 placeholder:text-[#B07060] p-[15px] text-base font-normal transition-all"
                      placeholder="Create a strong password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B07060] hover:text-[#C94B2C] dark:hover:text-slate-200 transition-colors"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </label>

                {/* Terms */}
                <div className="flex items-start gap-3 mt-2">
                  <input
                    className="mt-1 h-5 w-5 rounded border-[#F0C8BB] text-[#C94B2C] focus:ring-[#C94B2C] cursor-pointer"
                    id="terms"
                    type="checkbox"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleChange}
                    required
                  />
                  <label className="text-sm text-[#1A0A00] lg:text-[#B07060] dark:text-slate-400 leading-tight" htmlFor="terms">
                    I agree to the <a className="text-[#C94B2C] font-semibold hover:underline" href="#">Terms of Service</a> and <a className="text-[#C94B2C] font-semibold hover:underline" href="#">Privacy Policy</a>.
                  </label>
                </div>
                {errors.terms && <p className="text-red-500 text-sm">{errors.terms}</p>}

                {/* Submit */}
                <button
                  disabled={loading}
                  className={`mt-2 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 bg-[#C94B2C] text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#B33A1E] hover:shadow-lg transition-all active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  type="submit"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-[#1A0A00] lg:text-[#B07060] lg:dark:text-slate-400 text-sm font-medium">
                  Already have an account?{' '}
                  <span onClick={() => navigate('/login')} className="text-[#1A0A00] lg:text-[#C94B2C] font-bold hover:underline cursor-pointer ml-1">
                    Login
                  </span>
                </p>
              </div>

            </div>
          </div>
        </main>

        {/* Mobile Footer */}
        <footer className="lg:hidden p-6 border-t border-[#F0C8BB] dark:border-[#7A4030] bg-white dark:bg-[#2A1A10] text-center">
          <p className="text-[#B07060] dark:text-[#E8856A] text-xs">© 2024 Bag.NG. All rights reserved.</p>
        </footer>

        {/* Success Modal */}
        <SuccessToast show={showSuccess} onClose={() => setShowSuccess(false)} />
      </div>
    </>
  );
};

export default Reg;