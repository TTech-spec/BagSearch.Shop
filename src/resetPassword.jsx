import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone;
  const method = location.state?.method || 'phone';

  const [formData, setFormData] = useState({
    verificationCode: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmailReset, setIsEmailReset] = useState(false);

  React.useEffect(() => {
    const checkSession = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const { data } = await supabase.auth.getSession();
      if (data.session) setIsEmailReset(true);
    };
    checkSession();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'verificationCode') {
      const filtered = value.replace(/\D/g, '').slice(0, 6);
      setFormData({ ...formData, [name]: filtered });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError('');
  };

  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, label: '' };
    if (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*]/.test(password)
    ) return { level: 4, label: 'Very Strong' };
    if (password.length >= 6 && /[A-Za-z]/.test(password) && /[0-9]/.test(password))
      return { level: 3, label: 'Strong' };
    if (password.length >= 6) return { level: 2, label: 'Medium' };
    if (password.length >= 4) return { level: 1, label: 'Weak' };
    return { level: 0, label: '' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const strengthColor = (level) => {
    if (level <= 1) return '#DC2626';
    if (level === 2) return '#D97706';
    if (level === 3) return '#16A34A';
    return C.primary;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isEmailReset) {
      if (!phone) {
        setError('Phone number is missing. Please go back to the forgot password page.');
        return;
      }
      if (formData.verificationCode.length !== 6) {
        setError('Please enter the 6-digit verification code');
        return;
      }
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      if (!isEmailReset) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          phone,
          token: formData.verificationCode,
          type: 'sms',
        });
        if (verifyError) throw verifyError;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });
      if (updateError) throw updateError;

      await supabase.auth.signOut();
      alert('Password reset successfully! Please login with your new password.');
      navigate('/login?force=true', { replace: true });
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Failed to reset password: ' + err.message);
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
          vertical-align: middle;
        }

        .rp-input {
          width: 100%;
          border-radius: 8px;
          border: 1px solid ${C.border};
          background: ${C.surface};
          padding: 0 48px 0 16px;
          height: 54px;
          font-size: 14px;
          color: ${C.text};
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'Manrope', sans-serif;
        }
        .rp-input:focus {
          border-color: ${C.primary};
          box-shadow: 0 0 0 3px ${C.primary}18;
        }
        .rp-input::placeholder { color: ${C.textMuted}; }

        .rp-input-code {
          width: 100%;
          border-radius: 8px;
          border: 1px solid ${C.border};
          background: ${C.surface};
          padding: 0 16px;
          height: 54px;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.35em;
          color: ${C.text};
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'Manrope', sans-serif;
          text-align: center;
        }
        .rp-input-code:focus {
          border-color: ${C.primary};
          box-shadow: 0 0 0 3px ${C.primary}18;
        }
        .rp-input-code::placeholder {
          color: ${C.textMuted};
          font-size: 14px;
          letter-spacing: 0.04em;
          font-weight: 400;
        }

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
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          cursor: pointer;
          color: ${C.textMuted};
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.2s;
        }
        .eye-btn:hover { color: ${C.primary}; }

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

        .resend-btn {
          background: transparent;
          border: none;
          color: ${C.primary};
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          padding: 0;
          margin-left: 4px;
          font-family: 'Manrope', sans-serif;
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.2s;
        }
        .resend-btn:hover { color: ${C.accent}; }
        .resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Hero panel — desktop only */
        .rp-hero { display: none; }
        @media (min-width: 1024px) {
          .rp-hero { display: flex; width: 50%; }
          .rp-form-panel { width: 50%; }
        }

        /* Form padding responsive */
        .rp-form-inner { padding: 40px 20px; }
        @media (min-width: 480px) { .rp-form-inner { padding: 48px 32px; } }
        @media (min-width: 768px) { .rp-form-inner { padding: 64px 48px; } }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rp-card { animation: fadeSlideUp 0.4s ease both; }
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
            <div style={{ width: 22, height: 22, color: C.primary, flexShrink: 0 }}>
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#bsclip2)">
                  <path clipRule="evenodd"
                    d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z"
                    fill="currentColor" fillRule="evenodd" />
                </g>
                <defs>
                  <clipPath id="bsclip2"><rect fill="white" height="48" width="48" /></clipPath>
                </defs>
              </svg>
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: C.text, margin: 0 }}>
              Bag<span style={{ color: C.primary }}>Search</span>
            </h2>
          </div>

          <button
            onClick={() => navigate('/login?force=true')}
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

          {/* ── Left Hero ── */}
          <div className="rp-hero" style={{
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
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>

              <h1 style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.025em', marginBottom: 20 }}>
                Crafted for elegance, secured for you.
              </h1>
              <p style={{ fontSize: 16, fontWeight: 500, opacity: 0.88, lineHeight: 1.65, marginBottom: 40 }}>
                You're almost back in. Set a strong new password and return to your luxury shopping experience.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: 'verified_user', text: 'Bank-level security encryption' },
                  { icon: 'lock_reset',    text: 'Secure password update process' },
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

          {/* ── Right Form Panel ── */}
          <div className="rp-form-panel" style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: C.surface,
            overflowY: 'auto',
          }}>
            <div className="rp-form-inner rp-card" style={{ maxWidth: 460, width: '100%' }}>

              {/* Back link */}
              <Link to="/login?force=true" className="back-link" style={{ marginBottom: 32, display: 'inline-flex' }}>
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
                  Reset Password
                </h2>
                <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.6, margin: 0 }}>
                  {isEmailReset
                    ? 'Please enter your new password below to secure your account.'
                    : 'Enter the verification code sent to your phone and choose a new password.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

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

                {/* Verification Code — phone only */}
                {!isEmailReset && (
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 700, color: C.text,
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                    }}>
                      Verification Code
                    </span>
                    <input
                      className="rp-input-code"
                      maxLength={6}
                      placeholder="6-digit code"
                      type="text"
                      inputMode="numeric"
                      name="verificationCode"
                      value={formData.verificationCode}
                      onChange={handleChange}
                      required
                    />
                    <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>
                      Enter the 6-digit code sent to your mobile phone.
                      <button
                        type="button"
                        className="resend-btn"
                        disabled={!phone || isLoading}
                        onClick={async () => {
                          if (!phone) return;
                          try {
                            const { error } = await supabase.auth.signInWithOtp({ phone });
                            if (error) throw error;
                            alert('Code resent successfully!');
                          } catch (err) {
                            alert('Failed to resend code: ' + err.message);
                          }
                        }}>
                        Resend Code
                      </button>
                    </p>
                  </label>
                )}

                {/* New Password */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: C.text,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>
                    New Password
                  </span>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="rp-input"
                      placeholder="••••••••"
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowNewPassword(v => !v)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                        {showNewPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Strength bar */}
                  {formData.newPassword && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      {[1, 2, 3, 4].map(level => (
                        <div key={level} style={{
                          flex: 1, height: 4, borderRadius: 99,
                          background: level <= passwordStrength.level
                            ? strengthColor(passwordStrength.level)
                            : C.border,
                          transition: 'background 0.3s',
                        }} />
                      ))}
                      {passwordStrength.label && (
                        <span style={{
                          fontSize: 10, fontWeight: 800,
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                          color: strengthColor(passwordStrength.level),
                          whiteSpace: 'nowrap',
                        }}>
                          {passwordStrength.label}
                        </span>
                      )}
                    </div>
                  )}
                </label>

                {/* Confirm Password */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: C.text,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>
                    Confirm New Password
                  </span>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="rp-input"
                      placeholder="••••••••"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowConfirmPassword(v => !v)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Match indicator */}
                  {formData.confirmPassword && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      {formData.newPassword === formData.confirmPassword ? (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>Passwords match</span>
                        </>
                      ) : (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke={C.danger} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          <span style={{ fontSize: 12, color: C.danger, fontWeight: 600 }}>Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </label>

                {/* Submit */}
                <button
                  className="submit-btn"
                  type="submit"
                  disabled={isLoading}
                  style={{ marginTop: 4 }}>
                  {isLoading ? 'Updating…' : 'Update Password'}
                </button>
              </form>

              {/* Divider + Security badge */}
              <div style={{
                marginTop: 36,
                paddingTop: 24,
                borderTop: `1px solid ${C.borderLight}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                color: C.textMuted,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, opacity: 0.6 }}>
                  verified_user
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  opacity: 0.6,
                }}>
                  Bank-level Security
                </span>
              </div>

            </div>
          </div>
        </main>

      </div>
    </>
  );
};

export default ResetPassword;