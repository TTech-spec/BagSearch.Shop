// src/Reg.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext.jsx'; // Ensure this path is correct
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleRoleChange = (role) => {
    setFormData({ ...formData, role });
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
      
      // 1. Check if configuration is loaded
      ensureSupabaseReady();

      // 2. Register user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
            phone: formData.phone
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!data?.user) {
        throw new Error('Registration successful, but no user data returned. Check your email for confirmation.');
      }

      // 3. Insert into 'users' table 
      // Note: Ensure your Supabase RLS policies allow authenticated users to insert their own row
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            user_id: data.user.id,
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
          },
        ]);

      if (insertError) {
        // If the DB insert fails, we might want to log it but not block the user entirely
        console.error('Database profile creation failed:', insertError);
        // Depending on your app logic, you might want to throw here or just warn
        throw new Error(`Profile creation failed: ${insertError.message}`);
      }

      // 4. Success state
      login(data.user);
      setShowSuccess(true);

      // Redirect to login after successful registration
      navigate('/login');

    } catch (error) {
      console.error('Registration Flow Error:', error);
      alert(error.message || 'An unexpected error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-10 py-3 bg-white dark:bg-slate-900 z-10">
        <div className="flex items-center gap-4 text-[#111318] dark:text-white">
          <div className="size-6 text-primary">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
          </div>
          <h2 className="text-[#111318] dark:text-white text-lg font-bold leading-tight">BagStore</h2>
        </div>
        <div className="flex flex-1 justify-end gap-8">
            <button onClick={() => navigate('/login')} className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all">
            Login
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side - Hero Image */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent"></div>
          <div className="relative z-10 px-12 text-white max-w-xl">
            <h1 className="text-5xl font-black leading-tight mb-6">Step into the future of luxury.</h1>
            <p className="text-lg font-medium text-white/90 mb-8">Join 50,000+ fashion enthusiasts discovering perfect matches with our advanced Visual Search AI.</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-background-dark overflow-y-auto">
          <div className="max-w-[480px] w-full flex flex-col gap-6 py-8">
            
            <div className="flex flex-col gap-2">
              <h2 className="text-[#111318] dark:text-white text-4xl font-black">Create your account</h2>
              <p className="text-[#616f89] dark:text-slate-400">Ready to explore or start selling with BagStore?</p>
            </div>

            {/* Role Selection */}
            <div className="flex flex-col gap-3">
              <p className="text-[#111318] dark:text-slate-200 text-sm font-semibold">How do you want to join?</p>
              <div className="grid grid-cols-2 gap-4">
                <label className="cursor-pointer group">
                  <input checked={formData.role === 'buyer'} onChange={() => handleRoleChange('buyer')} className="hidden peer" type="radio" name="role" value="buyer"/>
                  <div className="flex flex-col items-center justify-center p-4 border-2 border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 transition-all peer-checked:border-primary peer-checked:bg-primary/5 hover:border-slate-200">
                    <span className="material-symbols-outlined text-slate-400 mb-2 peer-checked:text-primary">shopping_bag</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 peer-checked:text-primary">Join as Buyer</span>
                  </div>
                </label>
                <label className="cursor-pointer group">
                  <input checked={formData.role === 'seller'} onChange={() => handleRoleChange('seller')} className="hidden peer" type="radio" name="role" value="seller"/>
                  <div className="flex flex-col items-center justify-center p-4 border-2 border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 transition-all peer-checked:border-primary peer-checked:bg-primary/5 hover:border-slate-200">
                    <span className="material-symbols-outlined text-slate-400 mb-2 peer-checked:text-primary">storefront</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 peer-checked:text-primary">Join as Seller</span>
                  </div>
                </label>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {/* Full Name */}
              <label className="flex flex-col w-full">
                <p className="text-[#111318] dark:text-slate-200 text-sm font-semibold pb-2">Full Name</p>
                <input
                  className="form-input flex w-full rounded-lg border border-[#dbdfe6] dark:border-slate-700 bg-white dark:bg-slate-800 h-14 p-[15px] text-base focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  placeholder="Enter your full name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
              </label>

              {/* Email */}
              <label className="flex flex-col w-full">
                <p className="text-[#111318] dark:text-slate-200 text-sm font-semibold pb-2">Email Address</p>
                <input
                  className="form-input flex w-full rounded-lg border border-[#dbdfe6] dark:border-slate-700 bg-white dark:bg-slate-800 h-14 p-[15px] text-base focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  placeholder="name@example.com"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </label>

              {/* Phone */}
              <label className="flex flex-col w-full">
                <p className="text-[#111318] dark:text-slate-200 text-sm font-semibold pb-2">Phone Number</p>
                <input
                  className="form-input flex w-full rounded-lg border border-[#dbdfe6] dark:border-slate-700 bg-white dark:bg-slate-800 h-14 p-[15px] text-base focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  placeholder="+1 (555) 000-0000"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </label>

              {/* Password */}
              <label className="flex flex-col w-full">
                <p className="text-[#111318] dark:text-slate-200 text-sm font-semibold pb-2">Password</p>
                <input
                  className="form-input flex w-full rounded-lg border border-[#dbdfe6] dark:border-slate-700 bg-white dark:bg-slate-800 h-14 p-[15px] text-base focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  placeholder="Create a strong password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                />
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
                />
                <label className="text-sm text-slate-600 dark:text-slate-400" htmlFor="terms">
                  I agree to the Terms of Service and Privacy Policy.
                </label>
              </div>
              {errors.terms && <p className="text-red-500 text-sm">{errors.terms}</p>}

              {/* Submit Button */}
              <button 
                disabled={loading}
                className={`mt-2 flex w-full cursor-pointer items-center justify-center rounded-lg h-14 bg-primary text-white text-base font-bold hover:bg-primary/90 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`} 
                type="submit"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-[#616f89] dark:text-slate-400 text-sm font-medium">
                Already have an account? <span onClick={() => navigate('/login')} className="text-primary font-bold hover:underline cursor-pointer">Login</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="size-24 bg-green-100 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-green-500 text-6xl">check_circle</span>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Welcome!</h3>
              <p className="text-slate-500">Redirecting you home...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reg;