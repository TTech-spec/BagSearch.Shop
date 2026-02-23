import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';

// ─── Success Toast Component ─────────────────────────────────────────────────
const SuccessToast = ({ show }) => {
  if (!show) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        animation: 'slideInFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <style>{`
        @keyframes slideInFade {
          from { opacity: 0; transform: translateX(60px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)   scale(1);    }
        }
        @keyframes progressShrink {
          from { width: 100%; }
          to   { width: 0%;   }
        }
        @keyframes popIn {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div style={{
        width: 340,
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(20,75,184,0.08)',
        overflow: 'hidden',
        border: '1px solid rgba(20,75,184,0.08)',
      }}>
        {/* Top progress bar */}
        <div style={{ height: 3, background: '#f0f4ff', position: 'relative' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #144bb8, #4f7ef7)',
            borderRadius: 9999,
            animation: 'progressShrink 3s linear forwards',
          }} />
        </div>

        <div style={{ padding: '20px 20px 20px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {/* Animated checkmark circle */}
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #144bb8, #4f7ef7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            animation: 'popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
            boxShadow: '0 6px 20px rgba(20,75,184,0.3)',
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 10.5L8.5 15L16 7"
                stroke="white" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Text content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 15, fontWeight: 700, color: '#111318',
              margin: 0, marginBottom: 3,
              fontFamily: 'inherit',
            }}>
              Welcome back! 🎉
            </p>
            <p style={{
              fontSize: 13, color: '#636f88',
              margin: 0, lineHeight: 1.5,
              fontFamily: 'inherit',
            }}>
              You've successfully signed in to your account.
            </p>
          </div>

          {/* Bags.NG badge */}
          <div style={{
            flexShrink: 0,
            background: '#f0f4ff',
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: 11,
            fontWeight: 700,
            color: '#144bb8',
            letterSpacing: '0.03em',
            fontFamily: 'inherit',
          }}>
            Bags.NG
          </div>
        </div>

        {/* Bottom strip */}
        <div style={{
          background: 'linear-gradient(90deg, #f0f4ff, #e8eeff)',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#144bb8', opacity: 0.6,
          }} />
          <p style={{
            fontSize: 12, color: '#144bb8', fontWeight: 600,
            margin: 0, fontFamily: 'inherit',
          }}>
            Redirecting you to your dashboard…
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Login Page ──────────────────────────────────────────────────────────────
const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  // 1. State for Form Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer'); // 'buyer' or 'seller'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // 2. Handle Login Logic
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevents page reload
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;
      
      const userId = data.user.id;

      // Save or update user role in the users table
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: email,
          role: role,
          updated_at: new Date(),
        }, {
          onConflict: 'id'
        });

      if (upsertError) {
        console.error('Error saving user role:', upsertError);
      }

      // Update AuthContext with user data
      login(data.user);
      
      // Show custom success toast, then redirect after 3s
      setShowSuccess(true);
setTimeout(() => {
        navigate('/products');
      }, 3000);
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f6f6f8] dark:bg-[#111621] min-h-screen flex flex-col font-sans text-[#111318] dark:text-white">
      {/* Success Toast */}
      <SuccessToast show={showSuccess} />

      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#f0f2f4] dark:border-gray-800 px-6 md:px-10 py-3 bg-white dark:bg-[#111621] z-10">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 text-[#144bb8]">
            <svg fill="currentColor" viewBox="0 0 48 48"><path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"></path></svg>
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
          {/* Left Side: Image Decor */}
          <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#144bb8]/10">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105" 
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop')` }}
            ></div>
            <div className="absolute inset-0 bg-black/30"></div>
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

              {/* Error Message Display */}
              {errorMsg && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {errorMsg}
                </div>
              )}

              {/* Role Toggle */}
              <div className="p-1 bg-[#f0f2f4] dark:bg-gray-800 rounded-xl flex items-center">
                <button 
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${role === 'buyer' ? 'bg-white dark:bg-gray-700 text-[#144bb8] shadow-sm' : 'text-[#636f88]'}`}
                >
                  I am a Buyer
                </button>
                <button 
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${role === 'seller' ? 'bg-white dark:bg-gray-700 text-[#144bb8] shadow-sm' : 'text-[#636f88]'}`}
                >
                  I am a Seller
                </button>
              </div>

              {/* Login Form */}
              <form className="space-y-5" onSubmit={handleLogin}>
                <div>
                  <label className="block text-sm font-semibold mb-2">Email Address</label>
                  <input 
                    className="w-full rounded-lg border border-[#dcdfe5] dark:border-gray-700 bg-white dark:bg-gray-800 p-4 focus:ring-2 focus:ring-[#144bb8]/20 outline-none transition-all"
                    type="email" 
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="block text-sm font-semibold mb-2">Password</label>
<span onClick={() => navigate('/forgot-password')} className="text-[#144bb8] text-xs font-bold hover:underline cursor-pointer">Forgot Password?</span>
                  </div>
                  <input 
                    className="w-full rounded-lg border border-[#dcdfe5] dark:border-gray-700 bg-white dark:bg-gray-800 p-4 focus:ring-2 focus:ring-[#144bb8]/20 outline-none transition-all"
                    type="password" 
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg h-14 bg-[#144bb8] text-white text-base font-bold hover:bg-opacity-90 transition-all shadow-md shadow-[#144bb8]/20"
                >
                  {loading ? 'Verifying...' : 'Sign In'}
                </button>
              </form>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
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
Don't have an account? <span onClick={() => navigate('/register')} className="text-[#144bb8] font-bold hover:underline cursor-pointer">Create an account</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;