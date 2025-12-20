import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAppContext } from '../../context/AppContext';

export const AuthForm = ({ isLogin }) => {
  const { setScreen, login, signup, isLoading, authError } = useAppContext();
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error on input change
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
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

    try {
      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await signup({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
        });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full p-6 bg-slate-50">
      <div className="flex items-center mb-6">
        <button onClick={() => setScreen('WELCOME')} className="p-2 rounded-full hover:bg-slate-200">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
      </div>
      
      <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
        {isLogin ? 'Hello Again!' : 'Create your profile.'}
      </h1>
      <p className="text-slate-500 mb-8">
        {isLogin ? 'Welcome back, we missed you.' : 'Join to start connecting with the community.'}
      </p>
      
      {(error || authError) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error || authError}
        </div>
      )}
      
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

      <div className="mt-8 w-full space-y-3">
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
          <button className="flex items-center justify-center w-full py-3 border border-slate-300 rounded-lg bg-white text-slate-700 font-semibold shadow-sm hover:bg-slate-100 active:scale-[0.98] transition-all">
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png" alt="Google" className="w-5 h-5 mr-2" /> Google
          </button>
          <button className="flex items-center justify-center w-full py-3 border border-slate-300 rounded-lg bg-white text-slate-700 font-semibold shadow-sm hover:bg-slate-100 active:scale-[0.98] transition-all">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.42 17.447c-.246.438-.658.68-1.1.68-.442 0-.853-.242-1.1-.68L11.527 15H8.72l-1.69 2.447c-.246.438-.657.68-1.1.68-.442 0-.853-.242-1.1-.68-.247-.437-.247-1.02 0-1.458l3.11-4.88-3.11-4.88c-.247-.437-.247-1.02 0-1.458.247-.437.658-.68 1.1-.68.442 0 .853-.242 1.1.68L8.72 9h2.807l1.693-2.447c.247-.437.658-.68 1.1-.68.442 0 .853-.242 1.1.68.247.437.247-1.02 0-1.458l-3.11 4.88 3.11 4.88c.247.438.247 1.02 0 1.458z"/>
            </svg> Apple
          </button>
        </div>
        <p className="pt-4 text-sm text-center text-slate-600">
          {isLogin ? "Need to join?" : "Already a member?"}{' '}
          <button 
            onClick={() => setScreen(isLogin ? 'SIGNUP' : 'LOGIN')} 
            className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};
