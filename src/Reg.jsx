// src/Reg.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext.jsx';
import { supabase, ensureSupabaseReady } from './services/api';

const Reg = () => {
  const navigate = useNavigate();
  const { login, setLoading, loading } = useContext(AuthContext);
  
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
      setTimeout(() => navigate('/login?force=true'), 3000);

    } catch (error) {
      console.error('Registration Flow Error:', error);
      setErrorMessage(error.message || 'An unexpected error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.85); }
          60%  { transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes checkDraw {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pillShimmer {
          0%   { opacity: 0; transform: translateX(-100%) skewX(-15deg); }
          50%  { opacity: 1; }
          100% { opacity: 0; transform: translateX(300%) skewX(-15deg); }
        }

        .error-toast { animation: slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
        .success-modal-inner { animation: popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
        .check-svg path { stroke-dasharray: 60; animation: checkDraw 0.5s 0.3s ease forwards; stroke-dashoffset: 60; }
        .shimmer-text {
          background: linear-gradient(90deg, #fff 30%, rgba(255,255,255,0.4) 50%, #fff 70%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 2s linear infinite;
        }

        /* ── Role Toggle Styles ── */
        .role-track {
          position: relative;
          display: flex;
          align-items: center;
          background: #fff;
          border-radius: 20px;
          padding: 6px;
          box-shadow:
            0 2px 8px rgba(20,75,184,0.08),
            0 0 0 1.5px rgba(20,75,184,0.10),
            inset 0 1px 0 rgba(255,255,255,0.9);
          width: 100%;
        }
        .dark .role-track {
          background: #1e2535;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 1.5px rgba(20,75,184,0.25);
        }
        .role-pill {
          position: absolute;
          top: 6px;
          left: 6px;
          width: calc(50% - 6px);
          height: calc(100% - 12px);
          border-radius: 14px;
          z-index: 0;
          background: linear-gradient(135deg, #144bb8 0%, #3b72f0 100%);
          box-shadow: 0 6px 20px rgba(20,75,184,0.35), 0 2px 6px rgba(20,75,184,0.2);
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
        .role-btn.inactive { color: #8a96b0; }
        .role-btn.inactive:hover { color: #144bb8; }
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
          background: #f0f4ff;
        }
        .dark .role-btn.inactive .role-icon-wrap {
          background: rgba(20,75,184,0.15);
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
          background: rgba(20,75,184,0.08);
          color: #144bb8;
          display: inline-block;
          transition: all 0.3s ease;
          font-family: inherit;
        }
        .dark .role-status-label {
          background: rgba(20,75,184,0.2);
          color: #7baaf7;
        }
      `}</style>
      
      <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col">

        {/* HEADER */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-10 py-3 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-4 text-[#111318] dark:text-white">
            <div className="size-6 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_6_535)">
                  <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd" />
                </g>
                <defs>
                  <clipPath id="clip0_6_535"><rect fill="white" height="48" width="48" /></clipPath>
                </defs>
              </svg>
            </div>
            <h2 className="text-[#111318] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">BagStore</h2>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <div className="hidden md:flex items-center gap-9">
              <a className="text-[#111318] dark:text-slate-300 text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Shop</a>
              <a className="text-[#111318] dark:text-slate-300 text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Visual Search</a>
              <a className="text-[#111318] dark:text-slate-300 text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Help</a>
            </div>
            <button onClick={() => navigate('/login?force=true')} className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-all">
              <span className="truncate">Login</span>
            </button>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex overflow-hidden">

          {/* Left Side - Hero */}
          <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0 opacity-40 bg-cover bg-center"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBNwd6TRoB6JE1M09Iil_24jkG6PbaxKrxtC3U7owNjTialNvnDM11cueRpDlYpHjKvFvcJhly0H4c9KCe2g7g3FA-9knZHgiEgeBS0xhkPD-kxQ6egqIKYD9s0N2w4yk0S3-zdqLOJBGzkuH74SF6JW4W0NsQT2wS3OP7BZNeL16G6K8IJPy4uiliIMP0i6AM_VX9WtikZO5z_umCc7cmz4S7sa57qedZCh_w7vGONtQNfFOAFbqJI9e3fOVEIt2e99XxyeYirIbo')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
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
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-background-dark overflow-y-auto">
            <div className="max-w-[480px] w-full flex flex-col gap-6 py-8">

              <div className="flex flex-col gap-2">
                <h2 className="text-[#111318] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Create your account</h2>
                <p className="text-[#616f89] dark:text-slate-400 text-base font-normal leading-normal">Ready to explore or start selling with BagStore?</p>
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

              {/* ── Beautiful Role Toggle ── */}
              <div className="flex flex-col gap-3">
                <p className="text-[#111318] dark:text-slate-200 text-sm font-semibold leading-normal">How do you want to join?</p>

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
                        stroke={formData.role === 'buyer' ? '#fff' : '#144bb8'}
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
                        stroke={formData.role === 'seller' ? '#fff' : '#144bb8'}
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
                  <p className="text-[#111318] dark:text-slate-200 text-sm font-semibold leading-normal pb-2">Full Name</p>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111318] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbdfe6] dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary h-14 placeholder:text-[#616f89] p-[15px] text-base font-normal transition-all"
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
                  <p className="text-[#111318] dark:text-slate-200 text-sm font-semibold leading-normal pb-2">Email Address</p>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111318] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbdfe6] dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary h-14 placeholder:text-[#616f89] p-[15px] text-base font-normal transition-all"
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
                    <p className="text-[#111318] dark:text-slate-200 text-sm font-semibold leading-normal" id="phone-label">Phone Number</p>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[12px]">chat</span>
                      WhatsApp Sync
                    </div>
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111318] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbdfe6] dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary h-14 placeholder:text-[#616f89] p-[15px] text-base font-normal transition-all"
                    id="phone-field"
                    placeholder="+1 (555) 000-0000"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-slate-500 mt-1">We'll send order updates and inventory notifications via WhatsApp.</p>
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </label>

                {/* Password */}
                <label className="flex flex-col w-full">
                  <p className="text-[#111318] dark:text-slate-200 text-sm font-semibold leading-normal pb-2">Password</p>
                  <div className="relative group">
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111318] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbdfe6] dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary h-14 placeholder:text-[#616f89] p-[15px] text-base font-normal transition-all"
                      placeholder="Create a strong password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                    id="terms"
                    type="checkbox"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleChange}
                    required
                  />
                  <label className="text-sm text-slate-600 dark:text-slate-400 leading-tight" htmlFor="terms">
                    I agree to the <a className="text-primary font-semibold hover:underline" href="#">Terms of Service</a> and <a className="text-primary font-semibold hover:underline" href="#">Privacy Policy</a>.
                  </label>
                </div>
                {errors.terms && <p className="text-red-500 text-sm">{errors.terms}</p>}

                {/* Submit */}
                <button
                  disabled={loading}
                  className={`mt-2 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 hover:shadow-lg transition-all active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  type="submit"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-[#616f89] dark:text-slate-400 text-sm font-medium">
                  Already have an account?{' '}
                  <span onClick={() => navigate('/login?force=true')} className="text-primary font-bold hover:underline cursor-pointer ml-1">
                    Login
                  </span>
                </p>
              </div>

            </div>
          </div>
        </main>

        {/* Mobile Footer */}
        <footer className="lg:hidden p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
          <p className="text-slate-400 text-xs">© 2024 BagStore. All rights reserved.</p>
        </footer>

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="success-modal-inner bg-white dark:bg-slate-900 rounded-3xl p-10 flex flex-col items-center gap-5 max-w-sm w-full mx-4 shadow-2xl border border-slate-100 dark:border-slate-800">
              <div className="relative size-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-50 dark:bg-emerald-950/50" />
                <div className="absolute inset-0 rounded-full border-2 border-emerald-200 dark:border-emerald-800/50" />
                <svg className="check-svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M12 24L20 32L36 16" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">You're in!</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Account created successfully.<br />Taking you to login…
                </p>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: '100%', transition: 'width 3s linear' }} />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                Redirecting in 3 seconds
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default Reg;