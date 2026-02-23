import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';

// ─── Global Styles + Media Queries ───────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Keyframes ── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-40px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(40px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes textSlideUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ringPulse {
      0%   { box-shadow: 0 0 0 0 rgba(20,75,184,0.35); }
      70%  { box-shadow: 0 0 0 8px rgba(20,75,184,0); }
      100% { box-shadow: 0 0 0 0 rgba(20,75,184,0); }
    }
    @keyframes shimmer {
      from { background-position: -200% center; }
      to   { background-position: 200% center; }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%  { transform: translateX(-8px); }
      40%  { transform: translateX(8px); }
      60%  { transform: translateX(-5px); }
      80%  { transform: translateX(5px); }
    }
    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateX(60px) scale(0.95); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes progressShrink {
      from { width: 100%; }
      to   { width: 0%; }
    }
    @keyframes popIn {
      0%   { transform: scale(0); opacity: 0; }
      60%  { transform: scale(1.2); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes badgeFloat {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-6px); }
    }

    /* ── Utility animation classes ── */
    .anim-fade-up     { animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both; }
    .anim-fade-in     { animation: fadeIn 0.5s ease both; }
    .anim-slide-left  { animation: slideInLeft 0.65s cubic-bezier(0.22,1,0.36,1) both; }
    .anim-slide-right { animation: slideInRight 0.65s cubic-bezier(0.22,1,0.36,1) both; }

    .d0 { animation-delay: 0ms; }
    .d1 { animation-delay: 80ms; }
    .d2 { animation-delay: 160ms; }
    .d3 { animation-delay: 240ms; }
    .d4 { animation-delay: 320ms; }
    .d5 { animation-delay: 400ms; }
    .d6 { animation-delay: 480ms; }
    .d7 { animation-delay: 560ms; }
    .d8 { animation-delay: 640ms; }

    /* ══════════════════════════════════════
       PAGE ROOT
    ══════════════════════════════════════ */
    .page-root {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f5f7fd;
      font-family: 'DM Sans', sans-serif;
      color: #111318;
    }

    /* ══════════════════════════════════════
       HEADER
    ══════════════════════════════════════ */
    .site-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 32px;
      background: white;
      border-bottom: 1px solid #eef0f6;
      box-shadow: 0 1px 12px rgba(20,75,184,0.06);
      z-index: 10;
      flex-shrink: 0;
      gap: 16px;
    }
    .header-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .header-logo-text {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: -0.02em;
      font-family: 'Playfair Display', serif;
    }
    .header-nav {
      display: flex;
      gap: 28px;
      font-size: 14px;
      font-weight: 500;
    }
    .header-nav a {
      color: #636f88;
      text-decoration: none;
      transition: color 0.2s;
    }
    .header-nav a:hover { color: #144bb8; }
    .header-support-btn {
      background: linear-gradient(135deg, #144bb8, #2e68e6);
      color: white;
      padding: 9px 18px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(20,75,184,0.25);
      transition: transform 0.15s, box-shadow 0.2s;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .header-support-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(20,75,184,0.35);
    }

    /* Mobile header */
    @media (max-width: 640px) {
      .site-header { padding: 12px 16px; }
      .header-nav  { display: none; }
      .header-support-btn { padding: 8px 12px; font-size: 12px; }
    }

    /* ══════════════════════════════════════
       MAIN SPLIT LAYOUT
    ══════════════════════════════════════ */
    .main-split {
      flex: 1;
      display: flex;
      min-height: 0;
    }

    /* ══════════════════════════════════════
       LEFT IMAGE PANEL
    ══════════════════════════════════════ */
    .image-panel {
      flex: 0 0 50%;
      position: relative;
      overflow: hidden;
      /* Hidden on mobile & tablet, shown on desktop */
      display: none;
    }
    @media (min-width: 1024px) {
      .image-panel { display: block; }
    }

    .image-panel-base {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #0d3a99, #1a52cc);
    }
    .image-panel-photo {
      position: absolute;
      inset: 0;
      background-image: url('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop');
      background-size: cover;
      background-position: center;
      transition: transform 8s ease-in-out;
    }
    .image-panel-photo:hover { transform: scale(1.04); }
    .image-panel-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(10,25,70,0.88) 0%, rgba(10,25,70,0.18) 60%, transparent 100%);
      z-index: 1;
    }
    .image-panel-badge {
      position: absolute;
      top: 32px;
      right: 32px;
      z-index: 3;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 12px;
      padding: 10px 18px;
      color: white;
      font-weight: 700;
      font-size: 13px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      animation: badgeFloat 3s ease-in-out infinite;
    }
    .image-panel-content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 3;
      padding: 0 48px 52px;
    }
    .panel-eyebrow {
      color: rgba(255,255,255,0.6);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 12px;
      animation: textSlideUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s both;
    }
    .panel-title {
      font-family: 'Playfair Display', serif;
      font-size: clamp(30px, 3vw, 50px);
      font-weight: 900;
      color: white;
      line-height: 1.1;
      margin-bottom: 16px;
      letter-spacing: -0.02em;
      animation: textSlideUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.35s both;
    }
    .panel-desc {
      color: rgba(255,255,255,0.75);
      font-size: 15px;
      line-height: 1.6;
      max-width: 340px;
      animation: textSlideUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.4s both;
    }
    .panel-stats {
      display: flex;
      gap: 28px;
      margin-top: 32px;
      animation: textSlideUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.5s both;
    }
    .stat-num {
      font-size: 22px;
      font-weight: 800;
      color: white;
      font-family: 'Playfair Display', serif;
    }
    .stat-label {
      font-size: 11px;
      color: rgba(255,255,255,0.5);
      margin-top: 2px;
    }

    /* ══════════════════════════════════════
       FORM PANEL
    ══════════════════════════════════════ */
    .form-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      /* Generous padding on desktop, tighter on mobile */
      padding: 48px 40px;
      background: white;
      overflow-y: auto;
      min-width: 0;
    }
    @media (max-width: 768px) {
      .form-panel { padding: 40px 24px; }
    }
    @media (max-width: 480px) {
      .form-panel { padding: 32px 16px; }
    }

    .form-inner {
      width: 100%;
      max-width: 420px;
    }

    /* ── Heading ── */
    .form-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f0f4ff;
      border-radius: 999px;
      padding: 5px 14px;
      margin-bottom: 14px;
    }
    .form-eyebrow-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #144bb8;
    }
    .form-eyebrow-text {
      font-size: 12px;
      font-weight: 700;
      color: #144bb8;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .form-title {
      font-family: 'Playfair Display', serif;
      font-size: clamp(28px, 5vw, 40px);
      font-weight: 900;
      margin-bottom: 8px;
      letter-spacing: -0.025em;
      line-height: 1.1;
    }
    .form-subtitle {
      color: #636f88;
      font-size: 15px;
    }

    /* ── Error ── */
    .error-banner {
      padding: 12px 16px;
      background: #fff5f5;
      border: 1.5px solid #feb2b2;
      border-radius: 10px;
      color: #c53030;
      font-size: 14px;
      margin-bottom: 20px;
      animation: shake 0.4s ease;
    }

    /* ── Role toggle ── */
    .role-toggle {
      padding: 4px;
      background: #f0f2f6;
      border-radius: 14px;
      display: flex;
      margin-bottom: 28px;
    }
    .role-btn {
      flex: 1;
      padding: 11px 8px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      border: none;
      transition: background 0.25s, color 0.25s, box-shadow 0.25s, transform 0.15s;
      white-space: nowrap;
    }
    .role-btn:active { transform: scale(0.97); }
    @media (max-width: 380px) {
      .role-btn { font-size: 12px; padding: 10px 4px; }
    }

    /* ── Inputs ── */
    .field-group { margin-bottom: 18px; }
    .field-label {
      display: block;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #374151;
    }
    .field-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .login-input {
      width: 100%;
      border-radius: 12px;
      border: 1.5px solid #dcdfe5;
      background: #fafbff;
      padding: 14px 16px;
      font-size: 15px;
      font-family: 'DM Sans', sans-serif;
      color: #111318;
      outline: none;
      transition: border-color 0.25s, background 0.25s, transform 0.15s;
    }
    .login-input:focus {
      border-color: #144bb8;
      background: #fff;
      transform: translateY(-1px);
      animation: ringPulse 0.5s ease;
    }
    .login-input::placeholder { color: #b0b8cc; }
    .login-input.error-field  { animation: shake 0.4s ease; border-color: #e53e3e; }

    /* On very small screens, slightly reduce input padding */
    @media (max-width: 380px) {
      .login-input { padding: 12px 14px; font-size: 14px; }
    }

    /* ── Forgot link ── */
    .link-hover {
      color: #144bb8;
      font-weight: 700;
      cursor: pointer;
      font-size: 12px;
      background-image: linear-gradient(#144bb8, #144bb8);
      background-size: 0% 2px;
      background-position: 0 100%;
      background-repeat: no-repeat;
      transition: background-size 0.3s ease;
    }
    .link-hover:hover { background-size: 100% 2px; }

    /* ── Submit button ── */
    .submit-btn {
      width: 100%;
      height: 54px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      border: none;
      cursor: pointer;
      color: white;
      overflow: hidden;
      transition: transform 0.15s, box-shadow 0.25s, opacity 0.2s;
      background: linear-gradient(135deg, #144bb8 0%, #2e68e6 50%, #144bb8 100%);
      background-size: 200% auto;
      margin-top: 8px;
    }
    .submit-btn:not(:disabled):hover {
      animation: shimmer 1.5s linear infinite;
      box-shadow: 0 8px 28px rgba(20,75,184,0.35);
      transform: translateY(-1px);
    }
    .submit-btn:not(:disabled):active { transform: scale(0.98); }
    .submit-btn:disabled { opacity: 0.75; cursor: not-allowed; }

    /* ── Divider ── */
    .divider {
      position: relative;
      margin: 28px 0;
      text-align: center;
    }
    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0; right: 0;
      height: 1px;
      background: #e8ebf2;
    }
    .divider-text {
      position: relative;
      background: white;
      padding: 0 14px;
      font-size: 12px;
      font-weight: 600;
      color: #9aa3b5;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    /* ── Social buttons ── */
    .social-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .social-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 48px;
      border: 1.5px solid #e2e6f0;
      border-radius: 12px;
      background: white;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #111318;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s, background 0.2s;
    }
    .social-btn:hover {
      border-color: #144bb8;
      box-shadow: 0 4px 14px rgba(20,75,184,0.12);
      transform: translateY(-2px);
      background: #fafbff;
    }
    .social-btn:active { transform: scale(0.97); }

    /* ── Register link ── */
    .register-text {
      text-align: center;
      font-size: 14px;
      color: #636f88;
      margin-top: 28px;
    }

    /* ── Spinner ── */
    .spinner {
      display: inline-block;
      width: 16px; height: 16px;
      border: 2.5px solid rgba(255,255,255,0.35);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      vertical-align: middle;
      margin-right: 8px;
    }

    /* ══════════════════════════════════════
       SUCCESS TOAST
    ══════════════════════════════════════ */
    .toast-wrap {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      animation: toastSlideIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards;
      /* Prevent overflow on small screens */
      max-width: calc(100vw - 40px);
    }
    .toast-card {
      width: 320px;
      max-width: 100%;
      background: white;
      border-radius: 16px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.13), 0 4px 16px rgba(20,75,184,0.08);
      overflow: hidden;
      border: 1px solid rgba(20,75,184,0.08);
    }
    .toast-progress { height: 3px; background: #f0f4ff; }
    .toast-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #144bb8, #4f7ef7);
      animation: progressShrink 3s linear forwards;
    }
    .toast-body {
      padding: 16px 18px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .toast-icon {
      width: 42px; height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #144bb8, #4f7ef7);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 6px 20px rgba(20,75,184,0.3);
      animation: popIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both;
    }
    .toast-badge {
      flex-shrink: 0;
      background: #f0f4ff;
      border-radius: 8px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 700;
      color: #144bb8;
    }
    .toast-footer {
      background: linear-gradient(90deg, #f0f4ff, #e8eeff);
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .toast-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #144bb8;
      opacity: 0.6;
      flex-shrink: 0;
    }

    /* Shrink toast on very small phones */
    @media (max-width: 400px) {
      .toast-wrap { top: 12px; right: 12px; left: 12px; }
      .toast-card { width: 100%; }
    }
  `}</style>
);

// ─── Success Toast ────────────────────────────────────────────────────────────
const SuccessToast = ({ show }) => {
  if (!show) return null;
  return (
    <div className="toast-wrap">
      <div className="toast-card">
        <div className="toast-progress"><div className="toast-progress-bar" /></div>
        <div className="toast-body">
          <div className="toast-icon">
            <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
              <path d="M4 10.5L8.5 15L16 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111318', marginBottom: 3, fontFamily: 'DM Sans,sans-serif' }}>Welcome back! 🎉</p>
            <p style={{ fontSize: 13, color: '#636f88', lineHeight: 1.5, fontFamily: 'DM Sans,sans-serif' }}>You've successfully signed in.</p>
          </div>
          <div className="toast-badge">Bags.NG</div>
        </div>
        <div className="toast-footer">
          <div className="toast-dot" />
          <p style={{ fontSize: 12, color: '#144bb8', fontWeight: 600, fontFamily: 'DM Sans,sans-serif' }}>Redirecting to your dashboard…</p>
        </div>
      </div>
    </div>
  );
};

// ─── Login Page ───────────────────────────────────────────────────────────────
const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [role, setRole]           = useState('buyer');
  const [loading, setLoading]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorShake, setErrorShake]   = useState(false);

  const triggerShake = () => {
    setErrorShake(true);
    setTimeout(() => setErrorShake(false), 500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      await supabase.from('users').upsert(
        { id: data.user.id, email, role, updated_at: new Date() },
        { onConflict: 'id' }
      );

      login(data.user);
      setShowSuccess(true);
      setTimeout(() => navigate('/products'), 3000);
    } catch (err) {
      setErrorMsg(err.message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-root">
      <GlobalStyles />
      <SuccessToast show={showSuccess} />

      {/* ── Header ── */}
      <header className="site-header anim-fade-in d0">
        <div className="header-logo">
          <svg width="26" height="26" fill="#144bb8" viewBox="0 0 48 48">
            <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"/>
          </svg>
          <span className="header-logo-text">Bags.NG</span>
        </div>

        <nav className="header-nav">
          <a href="#">Shop</a>
          <a href="#">Collections</a>
        </nav>

        <button className="header-support-btn">WhatsApp Support</button>
      </header>

      {/* ── Main ── */}
      <main className="main-split">

        {/* ── Left image panel — hidden below 1024px via CSS ── */}
        <div className="image-panel anim-slide-left d1">
          <div className="image-panel-base" />
          <div className="image-panel-photo" />
          <div className="image-panel-overlay" />
          <div className="image-panel-badge">✦ New Collection 2025</div>
          <div className="image-panel-content">
            <p className="panel-eyebrow">Premium Accessories</p>
            <h1 className="panel-title">Elevate Your<br />Everyday.</h1>
            <p className="panel-desc">Discover our exclusive collection of premium bags crafted for those who appreciate quality.</p>
            <div className="panel-stats">
              {[['500+', 'Styles'], ['50K+', 'Customers'], ['4.9★', 'Rating']].map(([num, label]) => (
                <div key={label}>
                  <div className="stat-num">{num}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="form-panel anim-slide-right d2">
          <div className="form-inner">

            {/* Heading */}
            <div className="anim-fade-up d3" style={{ marginBottom: 28 }}>
              <div className="form-eyebrow">
                <span className="form-eyebrow-dot" />
                <span className="form-eyebrow-text">Sign In</span>
              </div>
              <h2 className="form-title">Welcome<br />Back</h2>
              <p className="form-subtitle">Enter your details to access your account.</p>
            </div>

            {/* Error */}
            {errorMsg && <div className="error-banner">{errorMsg}</div>}

            {/* Role toggle */}
            <div className="role-toggle anim-fade-up d4">
              {['buyer', 'seller'].map(r => (
                <button
                  key={r}
                  type="button"
                  className="role-btn"
                  onClick={() => setRole(r)}
                  style={{
                    background: role === r ? 'white' : 'transparent',
                    color:      role === r ? '#144bb8' : '#636f88',
                    boxShadow:  role === r ? '0 2px 8px rgba(20,75,184,0.12)' : 'none',
                  }}
                >
                  {r === 'buyer' ? '🛍 I am a Buyer' : '🏪 I am a Seller'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleLogin}>
              {/* Email */}
              <div className="field-group anim-fade-up d5">
                <label className="field-label">Email Address</label>
                <input
                  className={`login-input${errorShake ? ' error-field' : ''}`}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="field-group anim-fade-up d6">
                <div className="field-row">
                  <label className="field-label" style={{ marginBottom: 0 }}>Password</label>
                  <span className="link-hover" onClick={() => navigate('/forgot-password')}>Forgot Password?</span>
                </div>
                <input
                  className={`login-input${errorShake ? ' error-field' : ''}`}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Submit */}
              <div className="anim-fade-up d7">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? <><span className="spinner" />Verifying…</> : 'Sign In →'}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="divider anim-fade-up d7">
              <span className="divider-text">Or continue with</span>
            </div>

            {/* Social */}
            <div className="social-grid anim-fade-up d8">
              <button className="social-btn">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
                </svg>
                Google
              </button>
              <button className="social-btn">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#1877F2" d="M18 9a9 9 0 1 0-10.406 8.892v-6.29H5.309V9h2.285V7.017c0-2.256 1.344-3.503 3.4-3.503.984 0 2.015.175 2.015.175v2.215h-1.135c-1.119 0-1.467.694-1.467 1.406V9h2.496l-.399 2.602H10.407v6.29A9.002 9.002 0 0 0 18 9Z"/>
                </svg>
                Facebook
              </button>
            </div>

            {/* Register */}
            <p className="register-text anim-fade-up d8">
              Don't have an account?{' '}
              <span className="link-hover" style={{ fontSize: 14 }} onClick={() => navigate('/register')}>
                Create an account
              </span>
            </p>

          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;