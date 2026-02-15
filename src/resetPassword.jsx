import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from './services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone;
  const [formData, setFormData] = useState({
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle verification code - only allow digits and max 6 chars
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
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) {
      return { level: 4, label: 'Very Strong' };
    } else if (password.length >= 6 && /[A-Za-z]/.test(password) && /[0-9]/.test(password)) {
      return { level: 3, label: 'Strong' };
    } else if (password.length >= 6) {
      return { level: 2, label: 'Medium' };
    } else if (password.length >= 4) {
      return { level: 1, label: 'Weak' };
    }
    return { level: 0, label: '' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone) {
      setError('Phone number is missing. Please go back to the forgot password page.');
      return;
    }

    // Validate verification code
    if (formData.verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      // 1. Verify OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: phone,
        token: formData.verificationCode,
        type: 'sms',
      });

      if (verifyError) throw verifyError;

      // 2. Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (updateError) throw updateError;
      
      // Show success message and redirect to login
      alert('Password reset successfully! Please login with your new password.');
      navigate('/login');
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Failed to reset password: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row font-display">
      {/* Left Side: Hero Image (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#e5e7eb]">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCLx9Edx7G0jQXGDh9jkdldr9TFD36d7wC7Ip7lK5dHCdF26w5Dp0nKASHakAARs6JXULtdmqJuSjgpYhmMezgKkdrBM9SlKDNXovv8LAOpjGi9Hy83Wl3fubZh4mBG0pvb0aFv_nyQWpdMYebWqfjDMPNZ9lk2AzMev2PTKNZyXSyUmGMO1ymel6f9Ytl08lqUAdT4taxP20GqkBoGnTLLIgWXVvDB07M59u2DUNuUCtdHxmm3ZYUXcO6c-XHHKtFy1Bq8s1uyNuE')`
          }}
        />
        {/* Brand Overlay */}
        <div className="absolute top-10 left-10 flex items-center gap-2 text-white drop-shadow-md">
          <div className="size-8">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">LUXURY BOUTIQUE</h1>
        </div>
        {/* Bottom Text Overlay */}
        <div className="absolute bottom-20 left-10 max-w-md text-white">
          <p className="text-4xl font-semibold leading-tight">Crafted for Elegance, Secured for You.</p>
        </div>
      </div>

      {/* Right Side: Reset Form */}
      <div className="flex w-full flex-col justify-center items-center px-6 py-12 lg:w-1/2 lg:px-20 bg-background-light dark:bg-background-dark">
        <div className="w-full max-w-[440px]">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2 mb-12">
            <div className="size-6 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fillRule="evenodd"></path>
              </svg>
            </div>
            <h2 className="text-lg font-bold tracking-tight">LUXURY BOUTIQUE</h2>
          </div>
          
          <div className="mb-10">
            <h2 className="text-[#111318] dark:text-white text-3xl font-bold leading-tight mb-2">Reset Password</h2>
            <p className="text-[#636f88] dark:text-[#94a3b8] text-base font-normal leading-normal">Enter the verification code and your new password below to secure your account.</p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Verification Code Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[#111318] dark:text-white text-sm font-semibold leading-normal">Verification Code</label>
              <div className="relative flex items-stretch">
                <input 
                  className="form-input flex w-full rounded-lg border-[#dcdfe5] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#111318] dark:text-white h-14 px-4 text-base font-normal tracking-[0.5em] transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  maxLength={6}
                  placeholder="000000"
                  type="text"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleChange}
                  required
                />
              </div>
              <p className="text-xs text-[#636f88] dark:text-[#94a3b8] mt-1">
                Enter the 6-digit code sent to your mobile phone.
                <button 
                  className="text-primary hover:underline font-medium ml-1 disabled:opacity-50" 
                  type="button"
                  onClick={async () => {
                    if (!phone) return;
                    try {
                      const { error } = await supabase.auth.signInWithOtp({ phone });
                      if (error) throw error;
                      alert('Code resent successfully!');
                    } catch (err) {
                      alert('Failed to resend code: ' + err.message);
                    }
                  }}
                  disabled={!phone || isLoading}
                >
                  Resend Code
                </button>
              </p>
            </div>

            {/* New Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[#111318] dark:text-white text-sm font-semibold leading-normal">New Password</label>
              <div className="relative flex items-stretch">
                <input 
                  className="form-input flex w-full rounded-lg border-[#dcdfe5] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#111318] dark:text-white h-14 px-4 pr-12 text-base font-normal transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="••••••••"
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                />
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636f88] hover:text-primary transition-colors"
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  <span className="material-symbols-outlined" data-icon="visibility" data-size="24px">
                    {showNewPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {/* Password Strength Indicator */}
              <div className="mt-1 flex gap-1 items-center">
                {[1, 2, 3, 4].map((level) => (
                  <div 
                    key={level}
                    className={`h-1 w-full rounded-full ${
                      level <= passwordStrength.level 
                        ? level <= 1 
                          ? 'bg-red-500' 
                          : level === 2 
                            ? 'bg-yellow-500' 
                            : level === 3 
                              ? 'bg-green-500' 
                              : 'bg-primary'
                        : 'bg-[#dcdfe5] dark:bg-[#334155]'
                    }`}
                  />
                ))}
                {passwordStrength.label && (
                  <span className={`ml-2 text-[10px] font-bold uppercase tracking-wider ${
                    passwordStrength.level <= 1 
                      ? 'text-red-500' 
                      : passwordStrength.level === 2 
                        ? 'text-yellow-500' 
                        : 'text-primary'
                  }`}>
                    {passwordStrength.label}
                  </span>
                )}
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[#111318] dark:text-white text-sm font-semibold leading-normal">Confirm New Password</label>
              <div className="relative flex items-stretch">
                <input 
                  className="form-input flex w-full rounded-lg border-[#dcdfe5] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#111318] dark:text-white h-14 px-4 pr-12 text-base font-normal transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="••••••••"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636f88] hover:text-primary transition-colors"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="material-symbols-outlined" data-icon="visibility" data-size="24px">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Update Password'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <Link 
              className="text-sm font-medium text-[#636f88] dark:text-[#94a3b8] hover:text-primary dark:hover:text-primary transition-colors flex items-center justify-center gap-2 group" 
              to="/login"
            >
              <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform" data-icon="arrow_back" data-size="18px">arrow_back</span>
              Back to Login
            </Link>
          </div>

          {/* Security Badge */}
          <div className="mt-20 flex justify-center items-center gap-4 text-[#636f88]/50 dark:text-[#94a3b8]/30">
            <span className="material-symbols-outlined" data-icon="verified_user" data-size="24px">verified_user</span>
            <span className="text-xs uppercase tracking-[0.2em] font-medium">Bank-level Security</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
