import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { authAPI } from '../lib/auth';
import SpiralAnimation from '../components/ui/SpiralAnimation';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscordLogin, setIsDiscordLogin] = useState(false);

  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle Nova Hub protocol authentication
  const handleNovaHubAuth = useCallback(async (user: any) => {
    const urlParams = new URLSearchParams(location.search);
    const returnUrl = urlParams.get('return');
    
    if (returnUrl && returnUrl.startsWith('nova://')) {
      
      try {
        // Show protocol handler prompt
        const userConfirmed = confirm(
          'Nova Hub is requesting to authenticate you. Do you want to continue?'
        );
        
                 if (userConfirmed) {
           // Parse the nova:// URL to extract state
           const novaUrl = new URL(decodeURIComponent(returnUrl));
           const state = novaUrl.searchParams.get('state');
           
           if (state) {
             // Store pending authentication data for Nova Hub to poll
             const authData = {
               state,
               token: user.token,
               user: {
                 id: user._id || user.id,
                 username: user.user_data?.username || user.email?.split('@')[0] || 'User',
                 email: user.email,
                 avatar: user.user_data?.avatar || null
               }
             };
             
             try {
               // Send to backend
               const response = await fetch('/api/auth/pending', {
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json',
                 },
                 body: JSON.stringify(authData),
               });
               
               if (response.ok) {
                 alert('Authentication successful! Please check your Nova Hub application.');
                 // Redirect to dashboard after successful Nova Hub authentication
                 navigate('/dashboard');
               } else {
                 throw new Error('Failed to store authentication data');
               }
             } catch (error) {
               console.error('Error storing authentication:', error);
               setError('Failed to complete Nova Hub authentication');
             }
           }
        } else {
          // User declined, just navigate to dashboard
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error handling Nova Hub authentication:', error);
        setError('Failed to complete Nova Hub authentication');
        navigate('/dashboard');
          }
    } else {
      // Regular login, navigate to dashboard
      navigate('/dashboard');
    }
  }, [location, navigate]);

  // Handle Discord OAuth callback
  const handleDiscordCallback = useCallback(async (code: string, state: string | null) => {
    try {
      setIsDiscordLogin(true);
      setError('');
      
      const response = await authAPI.handleDiscordCallback(code, state || undefined);
      
      if (response.success) {
        if (response.user && response.token) {
          // User exists and is logged in - check for Nova Hub auth
          const userWithToken = {
            ...response.user,
            token: response.token
          };
          await handleNovaHubAuth(userWithToken);
        } else if (response.requires_registration) {
          // User needs to register, redirect to signup
          navigate('/signup');
        }
      } else {
        setError(response.error || 'Discord authentication failed');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Discord authentication failed';
      setError(errorMessage);
    } finally {
      setIsDiscordLogin(false);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [navigate]);

  // Check for Discord OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code) {
      handleDiscordCallback(code, state);
    }
  }, [location, handleDiscordCallback]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      
      // After successful login, get user info for Nova Hub auth
      const userInfo = await authAPI.getCurrentUser();
      if (userInfo) {
        // Create user object with token for Nova Hub auth
        const userWithToken = {
          ...userInfo,
          token: localStorage.getItem('auth_token') || ''
        };
        await handleNovaHubAuth(userWithToken);
      } else {
        // Fallback if we can't get user info
      navigate('/dashboard');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    try {
      setIsDiscordLogin(true);
      setError('');
      
      // Check if this is a Nova Hub authentication request
      const urlParams = new URLSearchParams(location.search);
      const returnUrl = urlParams.get('return');
      let state = undefined;
      
      if (returnUrl && returnUrl.startsWith('nova://')) {
        // Extract state from Nova Hub return URL
        const novaUrl = new URL(decodeURIComponent(returnUrl));
        state = novaUrl.searchParams.get('state');
      }
      
      const response = await authAPI.startDiscordOAuth(state || undefined);
      
      if (response.success && response.auth_url) {
        // Redirect to Discord OAuth
        window.location.href = response.auth_url;
      } else {
        setError(response.error || 'Failed to start Discord OAuth');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Discord login failed';
      setError(errorMessage);
    } finally {
      setIsDiscordLogin(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Spiral Animation Background */}
      <SpiralAnimation />
      
      {/* Background Effects */}
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8 border-glow"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-4 glow-purple"
            >
              <img
                src="/favicon.png"
                alt="Nova Logo"
                className="w-10 h-10"
              />
            </motion.div>
            <h1 className="text-3xl font-bold text-gradient mb-2">
              {new URLSearchParams(location.search).get('return')?.startsWith('nova://') ? 'Nova Hub Authentication' : 'Welcome Back'}
            </h1>
            <p className="text-gray-400">
              {new URLSearchParams(location.search).get('return')?.startsWith('nova://') 
                ? 'Sign in to authenticate with Nova Hub' 
                : 'Sign in to your Nova account'
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-center space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-white placeholder-gray-400"
                  placeholder="Enter your email"
                />
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-white placeholder-gray-400"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Login Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="my-6 flex items-center"
          >
            <div className="flex-1 border-t border-white/10"></div>
            <span className="px-4 text-gray-400 text-sm">or continue with</span>
            <div className="flex-1 border-t border-white/10"></div>
          </motion.div>

          {/* Discord Login */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              type="button"
              onClick={handleDiscordLogin}
              disabled={isDiscordLogin}
              className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
            >
              {isDiscordLogin ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in with Discord...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.211.375-.445.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span>Sign in with Discord</span>
                </>
              )}
            </Button>
          </motion.div>

          {/* Sign Up Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-6"
          >
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                Sign up here
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login; 