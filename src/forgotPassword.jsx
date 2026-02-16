import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState('phone'); // 'phone' or 'email'
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: identifier,
        });
        if (otpError) throw otpError;
        navigate('/reset-password', { state: { phone: identifier, method: 'phone' } });
      } else {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(identifier, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        alert('Password reset link sent to your email!');
      }
    } catch (error) {
      console.error('Error sending reset link:', error);
      let msg = error.message;
      if (msg.includes('unverified') && msg.includes('Twilio')) {
        msg = 'Twilio Trial Error: The phone number must be verified in the Twilio console before it can receive SMS. Alternatively, try using your Email Address.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
      {/* Top Navigation */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f4] dark:border-b-gray-800 px-10 py-3 bg-white dark:bg-background-dark z-10">
        <div className="flex items-center gap-4 text-[#111318] dark:text-white">
          <div className="size-6 text-primary">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"></path>
            </svg>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">Luxury Bags</h2>
        </div>
      </header>

      <main className="flex-grow flex items-stretch">
        {/* Split Screen Layout */}
        <div className="flex w-full min-h-[calc(100vh-64px)]">
          {/* Left Side: Hero Image (Desktop Only) */}
          <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCDrTnx3xjjyiSFoP6pViVizG7z69zhwpgYTDpX2b4dYXFPB800-1aTAZd12S6XyCNpgQiF_g6XTv2KsF3os6JK95hKYmslMz_gT_WRcYqac-r_eDjBJIM05V3Mug-zP8GDIGrbURd3A_hyYFlftNgOlocKWpSYS44uddxWS779tSaX7cQqsBYL0tlZ1drvc1_VMh1OYGQqwpTlNUTKqUEKLufixek-qhFhXx_j3fgkaaEEALpSf307iRUFz67FEwV6vCSX2nf007g")',
              }}
              aria-label="Premium minimalist leather handbag on a stone pedestal"
            />
            <div className="absolute inset-0 bg-black/5" />
            
            {/* Logo Overlay */}
            <div className="absolute top-10 left-10 flex items-center gap-2 text-white drop-shadow-md">
              <div className="size-8">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
                </svg>
              </div>
              <h1 className="text-xl font-bold tracking-widest uppercase">Luxe</h1>
            </div>
          </div>

          {/* Right Side: Forgot Password Form */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 bg-white dark:bg-background-dark">
            <div className="w-full max-w-[420px] space-y-10">
              {/* Back Link */}
              <div>
                <Link 
                  className="group flex items-center gap-2 text-sm font-medium text-[#636f88] transition-colors hover:text-primary dark:text-gray-400 dark:hover:text-primary" 
                  to="/login"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Back to login
                </Link>
              </div>

              {/* Header & Instructions */}
              <div className="space-y-4">
                <h2 className="text-4xl font-black leading-tight tracking-tight text-[#111318] dark:text-white">
                  Forgot Password
                </h2>
                <p className="text-base font-normal leading-relaxed text-[#636f88] dark:text-gray-400">
                  {method === 'phone' 
                    ? "Enter your phone number and we'll send you a link via SMS to reset your password."
                    : "Enter your email address and we'll send you a link to reset your password."}
                </p>
              </div>

              {/* Method Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => { setMethod('phone'); setIdentifier(''); setError(''); }}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${method === 'phone' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Phone Number
                </button>
                <button
                  type="button"
                  onClick={() => { setMethod('email'); setIdentifier(''); setError(''); }}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${method === 'email' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Email Address
                </button>
              </div>

              {/* Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <label 
                    className="text-sm font-semibold tracking-wide uppercase text-[#111318] dark:text-gray-200" 
                    htmlFor="identifier"
                  >
                    {method === 'phone' ? 'Phone Number' : 'Email Address'}
                  </label>
                  <input
                    className="block w-full rounded-lg border border-[#dcdfe5] bg-white px-4 py-4 text-base text-[#111318] transition-all placeholder:text-[#636f88] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-[#1c222d] dark:text-white dark:placeholder:text-gray-500"
                    id="identifier"
                    name="identifier"
                    placeholder={method === 'phone' ? '+1 (555) 000-0000' : 'name@example.com'}
                    type={method === 'phone' ? 'tel' : 'email'}
                    value={identifier}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button 
                  className="flex w-full items-center justify-center rounded-lg bg-primary px-6 py-4 text-base font-bold tracking-wide text-white transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              {/* Help Link Footer */}
              <div className="pt-8 text-center border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm text-[#636f88] dark:text-gray-400">
                  Need help? 
                  <a 
                    className="font-semibold text-primary underline underline-offset-4 transition-colors hover:text-primary/80" 
                    href="#"
                  >
                    Contact Concierge
                  </a>
                </p>
              </div>
            </div>

            {/* Bottom Footer (Mobile Only Visual) */}
            <div className="mt-auto pt-10 lg:hidden">
              <div className="flex items-center gap-2 text-primary opacity-50">
                <div className="size-5">
                  <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
                  </svg>
                </div>
                <span className="text-xs font-bold tracking-widest uppercase">Luxe</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
