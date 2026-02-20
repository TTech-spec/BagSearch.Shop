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
      ensureSupabaseReady();

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
        console.error('Database profile creation failed:', insertError);
        throw new Error(`Profile creation failed: ${insertError.message}`);
      }

      login(data.user);
      setShowSuccess(true);
      
      setTimeout(() => {
        navigate('/login?force=true');
      }, 3000);

    } catch (error) {
      console.error('Registration Flow Error:', error);
      alert(error.message || 'An unexpected error occurred during registration.');
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
        
        #role-seller:checked ~ form #phone-field {
          border-color: #135bec;
          background-color: rgba(19, 91, 236, 0.03);
        }
        
        #role-seller:checked ~ form #phone-label::after {
          content: " *Required for Sellers";
          color: #ef4444;
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>
      
      <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col">
        {/* HEADER */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-10 py-3 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-4 text-[#111318] dark:text-white">
            <div className="size-6 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_6_535)">
                  <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                </g>
                <defs>
                  <clipPath id="clip0_6_535"><rect fill="white" height="48" width="48"></rect></clipPath>
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
          {/* Left Side - Hero Section */}
          <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
            <div 
              className="absolute inset-0 opacity-40 bg-cover bg-center" 
              data-alt="Luxury leather bag in a minimalist studio setting"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBNwd6TRoB6JE1M09Iil_24jkG6PbaxKrxtC3U7owNjTialNvnDM11cueRpDlYpHjKvFvcJhly0H4c9KCe2g7g3FA-9knZHgiEgeBS0xhkPD-kxQ6egqIKYD9s0N2w4yk0S3-zdqLOJBGzkuH74SF6JW4W0NsQT2wS3OP7BZNeL16G6K8IJPy4uiliIMP0i6AM_VX9WtikZO5z_umCc7cmz4S7sa57qedZCh_w7vGONtQNfFOAFbqJI9e3fOVEIt2e99XxyeYirIbo')" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent"></div>
            <div className="relative z-10 px-12 text-white max-w-xl">
              <h1 className="text-5xl font-black leading-tight tracking-[-0.033em] mb-6">
                Step into the future of luxury.
              </h1>
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

              {/* Role Selection */}
              <div className="flex flex-col gap-3">
                <p className="text-[#111318] dark:text-slate-200 text-sm font-semibold leading-normal">How do you want to join?</p>
                <div className="grid grid-cols-2 gap-4">
                  <label className="cursor-pointer group">
                    <input 
                      checked={formData.role === 'buyer'} 
                      onChange={() => handleRoleChange('buyer')} 
                      className="hidden peer" 
                      type="radio" 
                      name="role" 
                      value="buyer"
                      id="role-buyer"
                    />
                    <div className="flex flex-col items-center justify-center p-4 border-2 border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 transition-all peer-checked:border-primary peer-checked:bg-primary/5 hover:border-slate-200 dark:hover:border-slate-700">
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors mb-2 peer-checked:text-primary">shopping_bag</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 peer-checked:text-primary">Join as Buyer</span>
                    </div>
                  </label>
                  <label className="cursor-pointer group">
                    <input 
                      checked={formData.role === 'seller'} 
                      onChange={() => handleRoleChange('seller')} 
                      className="hidden peer" 
                      type="radio" 
                      name="role" 
                      value="seller"
                      id="role-seller"
                    />
                    <div className="flex flex-col items-center justify-center p-4 border-2 border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 transition-all peer-checked:border-primary peer-checked:bg-primary/5 hover:border-slate-200 dark:hover:border-slate-700">
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors mb-2 peer-checked:text-primary">storefront</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 peer-checked:text-primary">Join as Seller</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Hidden radio inputs for styling */}
              <input checked={formData.role === 'buyer'} className="hidden" id="role-buyer-toggle" name="role-toggle" type="radio"/>
              <input checked={formData.role === 'seller'} className="hidden" id="role-seller-toggle" name="role-toggle" type="radio"/>

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
                  <div className="relative">
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111318] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbdfe6] dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary h-14 placeholder:text-[#616f89] p-[15px] text-base font-normal transition-all"
                      id="phone-field"
                      placeholder="+1 (555) 000-0000"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
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
                      type={showPassword ? "text" : "password"}
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

                {/* Submit Button */}
                <button 
                  disabled={loading}
                  className={`mt-2 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 hover:shadow-lg transition-all active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`} 
                  type="submit"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-[#616f89] dark:text-slate-400 text-sm font-medium lg:text-[#616f89] lg:dark:text-slate-400 text-white">
                  Already have an account? 
                  <span onClick={() => navigate('/login?force=true')} className="text-primary font-bold hover:underline cursor-pointer ml-1">Login</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4 shadow-2xl">
              <div className="size-24 bg-green-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-green-500 text-6xl">check_circle</span>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Welcome!</h3>
                <p className="text-slate-500">Redirecting you to login...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Reg;
