import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from './context/AuthContext.jsx';
import { supabase } from './services/api';

const Login = () => {
  const navigate = useNavigate();
  const { login, setLoading } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Fetch user's last name from your Supabase public profile table
      // Adjust table/column names as needed (e.g., profiles with column last_name)
      let lastName = undefined;
      try {
        const userId = data.user?.id;
        if (userId) {
          const { data: profileRow, error: profileError } = await supabase
            .from('profiles')
            .select('last_name')
            .eq('id', userId)
            .single();
          if (profileError) {
            console.warn('Profile fetch warning:', profileError.message);
          } else {
            lastName = profileRow?.last_name || undefined;
          }
        }
      } catch (e2) {
        console.warn('Could not fetch profile last name:', e2?.message || e2);
      }

      // Store enriched user in context so UI (navbar) can show last name
      const enrichedUser = { ...data.user, last_name: lastName };
      login(enrichedUser);
      alert('Login successful!');
      navigate('/home');
    } catch (error) {
      console.error('Login error:', error);
      let errorMsg = error.message;
      if (errorMsg === 'Failed to fetch') {
        errorMsg = 'Could not connect to Supabase. Please check your internet connection and Supabase URL in .env.';
      } else if (errorMsg.includes('Invalid login credentials') || errorMsg.includes('invalid_credentials')) {
        errorMsg = 'Incorrect email or password. Please try again.';
      } else if (import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY.startsWith('sb_publishable_')) {
        errorMsg = 'CRITICAL: Your Supabase API Key is invalid (looks like a Stripe key). Please update your .env file.';
      }
      alert(`Login failed: ${errorMsg}`);
    } finally {
      setLoading(false);
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
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">AninriLuxe</h2>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-9">
            <a className="text-[#111318] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Shop</a>
            <a className="text-[#111318] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Collections</a>
            <a className="text-[#111318] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Visual Search</a>
          </div>
          <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-all">
            <span className="material-symbols-outlined mr-2 text-lg">chat</span>
            <span className="truncate">WhatsApp Support</span>
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-stretch">
        {/* Split Screen Layout */}
        <div className="flex w-full min-h-[calc(100vh-64px)]">
          {/* Left Side: Hero Image (Desktop Only) */}
          <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary/10">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBSZyKuY_WyT4eTm_3e7MmWsh51tL-GFR0Lz2LiVsYj2WFJzW03kbao_VnGsYH-X3dMR2TpGRpyy2hLhPkKQ4Wvux-6wXxfcwkFcCFLadrAbabHoFXtCspuR_X0KnOFuP8JvzX4iTUk9-NSCjwfXPMdHVf8wpmHEmbXkTYAWxYFB6MTKjMErCrR1zxT8X8xklvh36KEBsNFgdpVNjlmpaJOtZOvgVad7CUixvJqNtxnUR1NnNQqKZHp_KfRY1XRGJ6lgACPC8d0DiI")',
              }}
              aria-label="Luxury leather handbag on a marble pedestal"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10 flex flex-col justify-end p-20 text-white w-full">
              <h1 className="text-5xl font-black leading-tight tracking-tight mb-4 drop-shadow-lg">
                Elevate Your Everyday.
              </h1>
              <p className="text-xl font-medium opacity-90 max-w-md drop-shadow-md">
                Discover our exclusive collection of premium bags crafted for the modern individual.
              </p>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 bg-white dark:bg-background-dark">
            <div className="w-full max-w-[440px] space-y-8">
              {/* Form Header */}
              <div className="space-y-2">
                <h2 className="text-[#111318] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                  Welcome Back
                </h2>
                <p className="text-[#636f88] dark:text-gray-400 text-base font-normal">
                  Enter your details to access your account.
                </p>
              </div>

              {/* Login Form */}
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="block text-[#111318] dark:text-gray-200 text-sm font-semibold leading-normal mb-2">
                    Email Address
                  </label>
                  <input
                    className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-[#111318] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#dcdfe5] dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary h-14 placeholder:text-[#636f88] p-[15px] text-base font-normal transition-all"
                    placeholder="Enter your email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[#111318] dark:text-gray-200 text-sm font-semibold leading-normal mb-2">
                      Password
                    </label>
                    <Link className="text-[#111318] dark:text-gray-200 text-xs font-bold hover:underline mb-2" to="/forgot-password">
                      Forgot Password?
                    </Link>
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-[#111318] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#dcdfe5] dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary h-14 placeholder:text-[#636f88] p-[15px] text-base font-normal transition-all"
                    placeholder="Enter your password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button
                  className="w-full flex items-center justify-center rounded-lg h-14 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                  type="submit"
                >
                  Sign In
                </button>
              </form>

              {/* Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-background-dark px-4 text-[#636f88] font-medium">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-3 h-12 border border-[#dcdfe5] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" type="button">
                  <img
                    alt="Google logo"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAT2cEFmGxJ5PiPRCoCro2AN8tNEPZwf36reO6bjv8IS_9Rx6ZhmzNzdW5b_IKMKWey9PNnzYBBLmptO44IS4EQvfo9sAQpwq7BVQokj386uEJSzfYhKA_S0xgxT6iYzbmlzWLC9TeupW-IXPdj49vaB_1eISwc_x_oXprKOzzbjRkpGFJ-FSl2lnPifkjgSCNDk0kVFB8gmFUwTr4K0xdceMEwyc89btQek9N4orqLU1Sk8upnWxAkhL4WTuftRpNL8TkNM9LihmI"
                  />
                  <span className="text-sm font-semibold text-[#111318] dark:text-white">Google</span>
                </button>

                <button className="flex items-center justify-center gap-3 h-12 border border-[#dcdfe5] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" type="button">
                  <img
                    alt="Facebook logo"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD334zWtz4Fh6MvWdr-WqFLi9WV6xkx-CnPtTFj1gLFKkjEyAAHNc7_y5pUNs0tQm_Hk2o0LpHuBPqFDZgNX7lJretAn79bMv41Hcr_rx0scIgJh6ZcICENCZ9fNOhCgEiAQoAYpasyj0DlyfjKZKaUBAWyUZnbjTgO6IkNPW5qizEIfV3QW5aY9jQ48kgHL7kY7nYodoEVIIO7uZHKN1oTITrOf5LV530dqf_IWZjZrFS2BQMPpSbeqaAJPjcEDUaGVvXGNEOZi1Y"
                  />
                  <span className="text-sm font-semibold text-[#111318] dark:text-white">Facebook</span>
                </button>
              </div>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-[#636f88] dark:text-gray-400 pt-4">
                Don't have an account?{' '}
                <Link className="text-primary font-bold hover:underline" to="/register">
                  Create an account
                </Link>
              </p>
            </div>

            {/* Footer Context */}
            <div className="mt-auto pt-10 flex gap-4 text-xs text-[#636f88] opacity-60">
              <span>© 2024 Luxury Bags Inc.</span>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
