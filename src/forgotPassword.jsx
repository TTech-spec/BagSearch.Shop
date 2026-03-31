import React, { useState } from 'react';
import LogoIcon from './components/Logo.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './services/api';

// ─── WARM COLOR PALETTE (BagSearch Theme) ────────────────────────────────────
const C = {
  primary:       '#C94B2C',
  primaryLight:  '#E8856A',
  primaryBg:     '#F9DDD0',
  primaryPale:   '#FFF5F2',
  primaryBorder: '#F0C8BB',
  accent:        '#B33A1E',
  danger:        '#DC2626',
  dangerBg:      '#FEF2F2',
  surface:       '#FFFFFF',
  surfaceDim:    '#FDF8F5',
  border:        '#F0D9CC',
  borderLight:   '#F7ECE4',
  text:          '#1A0A00',
  textMid:       '#7A4030',
  textMuted:     '#B07060',
  textLight:     '#FFFFFF',
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState('phone');
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    setIdentifier(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (method === 'phone') {
        const { error: otpError } = await supabase.auth.signInWithOtp({ phone: identifier });
        if (otpError) throw otpError;
        navigate('/reset-password', { state: { phone: identifier, method: 'phone' } });
      } else {
        const RESET_REDIRECT_URL = import.meta.env.VITE_APP_URL || 'https://aninri.luxe';

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(identifier, {
          redirectTo: `${RESET_REDIRECT_URL}/reset-password`,
        });
        if (resetError) throw resetError;
        setSent(true);
      }
    } catch (err) {
      console.error('Error sending reset link:', err);
      let msg = err.message;
      if (msg.includes('unverified') && msg.includes('Twilio')) {
        msg = 'Twilio Trial Error: The phone number must be verified in the Twilio console before it can receive SMS. Try using your email address instead.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        * { box-sizing: border-box; }

        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        .fp-input {
          width: 100%;
          border-radius: 8px;
          border: 1px solid ${C.border};
          background: ${C.surface};
          padding: 0 16px;
          height: 54px;
          font-size: 14px;
          color: ${C.text};
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'Manrope', sans-serif;
        }
        .fp-input:focus {
          border-color: ${C.primary};
          box-shadow: 0 0 0 3px ${C.primary}18;
        }
        .fp-input::placeholder { color: ${C.textMuted}; }

        .method-btn {
          flex: 1;
          padding: 10px 8px;
          font-size: 13px;
          font-weight: 700;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Manrope', sans-serif;
          letter-spacing: 0.01em;
        }
        .method-btn.active {
          background: ${C.surface};
          color: ${C.primary};
          box-shadow: 0 2px 8px rgba(201,75,44,0.15);
        }
        .method-btn.inactive {
          background: transparent;
          color: ${C.textMuted};
        }
        .method-btn.inactive:hover { color: ${C.textMid}; }

        .submit-btn {
          width: 100%;
          height: 54px;
          background: ${C.primary};
          color: ${C.textLight};
          font-size: 15px;
          font-weight: 700;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 14px ${C.primary}50;
          font-family: 'Manrope', sans-serif;
          letter-spacing: 0.01em;
        }
        .submit-btn:hover:not(:disabled) {
          background: ${C.accent};
          transform: translateY(-1px);
          box-shadow: 0 6px 18px ${C.primary}60;
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: ${C.textMuted};
          text-decoration: none;
          transition: color 0.2s;
        }
        .back-link:hover { color: ${C.primary}; }

        /* Hero panel — desktop only */
        .fp-hero {
          display: none;
        }
        @media (min-width: 1024px) {
          .fp-hero {
            display: flex;
            width: 50%;
          }
          .fp-form-panel {
            width: 50%;
          }
        }

        /* Form padding responsive */
        .fp-form-inner {
          padding: 40px 20px;
        }
        @media (min-width: 480px) {
          .fp-form-inner { padding: 48px 32px; }
        }
        @media (min-width: 768px) {
          .fp-form-inner { padding: 64px 48px; }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fp-card { animation: fadeSlideUp 0.4s ease both; }
      `}</style>

      <div style={{
        background: C.surfaceDim,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Manrope', sans-serif",
      }}>

        {/* ── Header ── */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${C.border}`,
          padding: '12px 20px',
          background: C.surface,
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoIcon size={22} />
            <h2 style={{ fontSize: 17, fontWeight: 800, color: C.text, margin: 0 }}>
              Bag<span style={{ color: C.primary }}>Search</span>
            </h2>
          </div>

          <button
            onClick={() => navigate('/login')}
            style={{
              background: C.primary,
              color: C.textLight,
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.2s',
              boxShadow: `0 2px 8px ${C.primary}40`,
              fontFamily: "'Manrope', sans-serif",
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.accent}
            onMouseLeave={e => e.currentTarget.style.background = C.primary}>
            Login
          </button>
        </header>

        {/* ── Main ── */}
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left Hero */}
          <div className="fp-hero" style={{
            position: 'relative',
            background: C.primary,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.35,
              backgroundImage: "url('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop')",
              backgroundSize: 'cover', backgroundPosition: 'center',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(to top, ${C.primary}F0 0%, ${C.primary}80 50%, transparent 100%)`,
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 10, padding: '0 52px', color: C.textLight, maxWidth: 560 }}>
              {/* Icon */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 32,
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              <h1 style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.025em', marginBottom: 20 }}>
                Secure account recovery.
              </h1>
              <p style={{ fontSize: 16, fontWeight: 500, opacity: 0.88, lineHeight: 1.65, marginBottom: 40 }}>
                We'll help you get back into your account quickly and safely. Your luxury shopping experience awaits.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: 'verified_user', text: 'Bank-level security encryption' },
                  { icon: 'speed',         text: 'Reset in under 2 minutes' },
                  { icon: 'support_agent', text: 'Concierge support available 24/7' },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.18)',
                      padding: 8, borderRadius: '50%',
                      fontFamily: "'Material Symbols Outlined'",
                      fontSize: 18, lineHeight: 1,
                    }}>{icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="fp-form-panel" style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: C.surface,
            overflowY: 'auto',
          }}>
            <div className="fp-form-inner fp-card" style={{ maxWidth: 460, width: '100%' }}>

              {/* Back link */}
              <Link to="/login" className="back-link" style={{ marginBottom: 32, display: 'inline-flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                Back to login
              </Link>

              {/* Heading */}
              <div style={{ marginBottom: 28 }}>
                <h2 style={{
                  fontSize: 32, fontWeight: 900, color: C.text,
                  lineHeight: 1.2, letterSpacing: '-0.02em',
                  margin: '0 0 10px',
                }}>
                  Forgot Password
                </h2>
                <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.6, margin: 0 }}>
                  {method === 'phone'
                    ? "Enter your phone number and we'll send an SMS to reset your password."
                    : "Enter your email address and we'll send a reset link."}
                </p>
              </div>

              {/* Method Toggle */}
              <div style={{
                display: 'flex',
                background: C.primaryBg,
                borderRadius: 14,
                padding: 5,
                marginBottom: 28,
                gap: 4,
              }}>
                {[
                  { value: 'phone', label: 'Phone Number' },
                  { value: 'email', label: 'Email Address' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`method-btn ${method === value ? 'active' : 'inactive'}`}
                    onClick={() => { setMethod(value); setIdentifier(''); setError(''); setSent(false); }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Sent state */}
              {sent ? (
                <div style={{
                  padding: '28px 24px',
                  background: C.primaryBg,
                  border: `1.5px solid ${C.primaryBorder}`,
                  borderRadius: 14,
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: C.surface,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: `0 4px 14px ${C.primary}20`,
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                      stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 }}>Check your inbox</p>
                  <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, margin: 0 }}>
                    A reset link has been sent to <strong style={{ color: C.textMid }}>{identifier}</strong>. It may take a minute to arrive.
                  </p>
                  <button
                    onClick={() => { setSent(false); setIdentifier(''); }}
                    style={{
                      marginTop: 20, background: 'transparent', border: `1.5px solid ${C.primaryBorder}`,
                      borderRadius: 8, padding: '9px 20px', color: C.primary,
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = C.surface}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    Try a different email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Error */}
                  {error && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '12px 14px', borderRadius: 10,
                      border: `1px solid ${C.danger}30`,
                      background: C.dangerBg,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke={C.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <p style={{ fontSize: 13, color: '#B91C1C', lineHeight: 1.5, margin: 0 }}>{error}</p>
                    </div>
                  )}

                  {/* Input */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {method === 'phone' ? 'Phone Number' : 'Email Address'}
                    </span>
                    <input
                      className="fp-input"
                      id="identifier"
                      name="identifier"
                      placeholder={method === 'phone' ? '+1 (555) 000-0000' : 'name@example.com'}
                      type={method === 'phone' ? 'tel' : 'email'}
                      value={identifier}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  {/* Submit */}
                  <button
                    className="submit-btn"
                    type="submit"
                    disabled={isLoading}>
                    {isLoading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>
              )}

              {/* Divider + Help */}
              <div style={{
                marginTop: 36,
                paddingTop: 24,
                borderTop: `1px solid ${C.borderLight}`,
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>
                  Need help?{' '}
                  <a href="#" style={{
                    color: C.primary, fontWeight: 700, textDecoration: 'none',
                    borderBottom: `1px solid ${C.primaryBorder}`,
                    paddingBottom: 1, transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.primaryBorder}>
                    Contact Concierge
                  </a>
                </p>
              </div>

            </div>
          </div>
        </main>

      </div>
    </>
  );
};

export default ForgotPassword;
