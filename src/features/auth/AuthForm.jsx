import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAppContext } from '../../context/AppContext';
import authService from '../../services/authService';

export const AuthForm = ({ isLogin }) => {
  const { setScreen, login, isLoading: contextIsLoading, authError } = useAppContext();

  // Form Views: 'FORM' | 'SIGNUP_OTP' | 'FORGOT_EMAIL' | 'FORGOT_OTP'
  const [view, setView] = useState('FORM');
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const isLoading = contextIsLoading || localIsLoading;

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    otp_code: '',
    new_password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccessMsg('');
  };

  // ─── LOGIN / SIGNUP INITIATOR ──────────────────────────────────────────
  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!isLogin && !formData.full_name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!formData.password.trim()) {
      setError('Please enter your password');
      return;
    }
    if (!isLogin && !agreedToTerms) {
      setError('Please agree to the Terms & Conditions');
      return;
    }

    if (isLogin) {
      // Standard Login
      try {
        await login({ email: formData.email, password: formData.password });
      } catch (err) {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } else {
      // Start Signup OTP Flow
      setLocalIsLoading(true);
      try {
        await authService.requestSignupOtp({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name
        });
        setSuccessMsg(`Verification code sent to ${formData.email}`);
        setView('SIGNUP_OTP');
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to send verification code');
      } finally {
        setLocalIsLoading(false);
      }
    }
  };

  // ─── SIGNUP OTP VERIFICATION ───────────────────────────────────────────
  const handleVerifySignupOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.otp_code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLocalIsLoading(true);
    try {
      const response = await authService.verifySignupOtp({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        otp_code: formData.otp_code
      });
      // Force a full reload to let AppContext initialize properly with the new token
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Invalid verification code');
      setLocalIsLoading(false);
    }
  };

  // ─── FORGOT PASSWORD FLOW ──────────────────────────────────────────────
  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLocalIsLoading(true);
    try {
      await authService.forgotPassword(formData.email);
      setSuccessMsg('Reset code sent! Check your email.');
      setView('FORGOT_OTP');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to send reset code');
    } finally {
      setLocalIsLoading(false);
    }
  };

  const handleForgotPasswordReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.otp_code.trim() || !formData.new_password.trim()) {
      setError('Please enter the code and a new password');
      return;
    }

    setLocalIsLoading(true);
    try {
      await authService.resetPassword({
        email: formData.email,
        otp_code: formData.otp_code,
        new_password: formData.new_password
      });
      setSuccessMsg('Password reset successfully! You can now log in.');
      // Reset state and go back to login form
      setFormData(prev => ({ ...prev, password: '', new_password: '', otp_code: '' }));
      setView('FORM');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to reset password');
    } finally {
      setLocalIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await authService.getGoogleLoginUrl();
      window.location.href = response.url;
    } catch {
      setError('Google Sign In failed. Please try again.');
    }
  };

  // Back button handler based on current view
  const handleBack = () => {
    if (view === 'FORM') setScreen('WELCOME');
    else if (view === 'SIGNUP_OTP') setView('FORM');
    else if (view === 'FORGOT_EMAIL') setView('FORM');
    else if (view === 'FORGOT_OTP') setView('FORGOT_EMAIL');
  };

  // ─── RENDERERS ──────────────────────────────────────────────────────────

  const renderSignupOtp = () => (
    <form onSubmit={handleVerifySignupOtp} className="space-y-4 flex-grow">
      <p className="text-sm text-slate-600 mb-4">
        We've sent a 6-digit code to <strong>{formData.email}</strong>. Please enter it below to verify your account.
      </p>
      <input
        className="w-full p-4 bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base font-mono tracking-widest text-center"
        type="text"
        name="otp_code"
        value={formData.otp_code}
        onChange={handleInputChange}
        placeholder="------"
        maxLength={6}
        required
      />
      <Button primary type="submit" disabled={isLoading} className="w-full mt-6">
        {isLoading ? 'Verifying...' : 'Verify & Create Account'}
      </Button>
    </form>
  );

  const renderForgotEmail = () => (
    <form onSubmit={handleForgotPasswordRequest} className="space-y-4 flex-grow">
      <p className="text-sm text-slate-600 mb-4">
        Enter your email address and we'll send you a code to reset your password.
      </p>
      <input
        className="w-full p-4 bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
        placeholder="Registered Email"
        required
      />
      <Button primary type="submit" disabled={isLoading} className="w-full mt-6">
        {isLoading ? 'Sending...' : 'Send Reset Code'}
      </Button>

      {error.toLowerCase().includes('google') && (
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full mt-2 py-3 border border-slate-300 rounded-lg bg-white text-slate-700 font-semibold shadow-sm hover:bg-slate-100 active:scale-[0.98] transition-all"
        >
          Continue with Google
        </button>
      )}
    </form>
  );

  const renderForgotOtp = () => (
    <form onSubmit={handleForgotPasswordReset} className="space-y-4 flex-grow">
      <p className="text-sm text-slate-600 mb-4">
        Enter the 6-digit code sent to <strong>{formData.email}</strong> and your new password.
      </p>
      <input
        className="w-full p-4 bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base font-mono tracking-widest text-center"
        type="text"
        name="otp_code"
        value={formData.otp_code}
        onChange={handleInputChange}
        placeholder="Enter 6-digit code"
        maxLength={6}
        required
      />
      
      <div className="relative mt-4">
        <input
          className="w-full p-4 bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
          type={showPassword ? "text" : "password"}
          name="new_password"
          value={formData.new_password}
          onChange={handleInputChange}
          placeholder="New Password (min 8 chars)"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5 text-slate-400 cursor-pointer" />
          ) : (
            <Eye className="w-5 h-5 text-slate-400 cursor-pointer" />
          )}
        </button>
      </div>

      <Button primary type="submit" disabled={isLoading} className="w-full mt-6">
        {isLoading ? 'Resetting...' : 'Reset Password'}
      </Button>
    </form>
  );

  const renderMainForm = () => (
    <div className="flex flex-col h-full">
      <form onSubmit={handleAuth} className="space-y-4 flex-grow overflow-y-auto">
        {!isLogin && (
          <input
            className="w-full p-4 bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            placeholder="Your Full Name"
            required
          />
        )}
        <input
          className="w-full p-4 bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Email"
          required
        />
        <div className="relative">
          <input
            className="w-full p-4 bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Your Password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5 text-slate-400 cursor-pointer" />
            ) : (
              <Eye className="w-5 h-5 text-slate-400 cursor-pointer" />
            )}
          </button>
        </div>
        
        {isLogin && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                setError('');
                setSuccessMsg('');
                setView('FORGOT_EMAIL');
              }}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        )}

        {isLogin && (
          <div className="pt-1 text-right">
            <a
              href="/admin"
              className="text-sm font-medium text-teal-700 hover:text-teal-900 transition-colors"
            >
              University Admin Login
            </a>
          </div>
        )}

        {!isLogin && (
          <div className="flex items-center text-sm pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 mr-2 focus:ring-indigo-500"
            />
            <label htmlFor="terms" className="text-slate-600">
              I agree to the <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold underline text-indigo-600">Terms & Conditions</a>
            </label>
          </div>
        )}
      </form>

      <div className="mt-8 w-full space-y-3 pb-4">
        <Button primary onClick={handleAuth} disabled={isLoading}>
          {isLoading ? 'Please wait...' : (isLogin ? 'Come On In!' : 'Create Account')}
        </Button>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-300"></span>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-50 text-slate-500">or continue with</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center w-full py-3 border border-slate-300 rounded-lg bg-white text-slate-700 font-semibold shadow-sm hover:bg-slate-100 active:scale-[0.98] transition-all"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg> Google
          </button>
          <button className="flex items-center justify-center w-full py-3 border border-slate-300 rounded-lg bg-white text-slate-700 font-semibold shadow-sm hover:bg-slate-100 active:scale-[0.98] transition-all">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.42 17.447c-.246.438-.658.68-1.1.68-.442 0-.853-.242-1.1-.68L11.527 15H8.72l-1.69 2.447c-.246.438-.657.68-1.1.68-.442 0-.853-.242-1.1-.68-.247-.437-.247-1.02 0-1.458l3.11-4.88-3.11-4.88c-.247-.437-.247-1.02 0-1.458.247-.437.658-.68 1.1-.68.442 0 .853-.242 1.1.68L8.72 9h2.807l1.693-2.447c.247-.437.658-.68 1.1-.68.442 0 .853-.242 1.1.68.247.437.247-1.02 0-1.458l-3.11 4.88 3.11 4.88c.247.438.247 1.02 0 1.458z" />
            </svg> Apple
          </button>
        </div>
        <p className="pt-4 text-sm text-center text-slate-600">
          {isLogin ? "Need to join?" : "Already a member?"}{' '}
          <button
            onClick={() => {
              setScreen(isLogin ? 'SIGNUP' : 'LOGIN');
              setView('FORM');
              setError('');
              setSuccessMsg('');
            }}
            className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full p-6 bg-slate-50">
      <div className="flex items-center mb-6">
        <button onClick={handleBack} className="p-2 rounded-full hover:bg-slate-200" disabled={isLoading}>
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
      </div>

      <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
        {view === 'FORM' && (isLogin ? 'Hello Again!' : 'Create your profile.')}
        {view === 'SIGNUP_OTP' && 'Verify Email'}
        {view === 'FORGOT_EMAIL' && 'Reset Password'}
        {view === 'FORGOT_OTP' && 'Set New Password'}
      </h1>
      <p className="text-slate-500 mb-6">
        {view === 'FORM' && (isLogin ? 'Welcome back, we missed you.' : 'Join to start connecting with the community.')}
        {view === 'SIGNUP_OTP' && 'Just one more step to register.'}
        {(view === 'FORGOT_EMAIL' || view === 'FORGOT_OTP') && 'Get back into your account securely.'}
      </p>

      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMsg}
        </div>
      )}

      {(error || authError) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error || authError}
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {view === 'FORM' && renderMainForm()}
        {view === 'SIGNUP_OTP' && renderSignupOtp()}
        {view === 'FORGOT_EMAIL' && renderForgotEmail()}
        {view === 'FORGOT_OTP' && renderForgotOtp()}
      </div>
    </div>
  );
};
