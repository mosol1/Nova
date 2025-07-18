import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Check, X, User } from 'lucide-react';
import { authAPI } from '../lib/auth';
import SpiralAnimation from '../components/ui/SpiralAnimation';

interface DiscordData {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  global_name?: string;
  email?: string;
  verified?: boolean;
  profile_picture?: string;
}

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnectingDiscord, setIsConnectingDiscord] = useState(false);
  const [isDiscordConnected, setIsDiscordConnected] = useState(false);
  const [discordData, setDiscordData] = useState<DiscordData | null>(null);
  const [hasRestoredData, setHasRestoredData] = useState(false);
  
  const { registerWithDiscord } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Restore form data on component mount (in case of page refresh)
  useEffect(() => {
    if (!hasRestoredData) {
      const savedFormData = localStorage.getItem('signup_form_data');
      if (savedFormData) {
        try {
          const parsedFormData = JSON.parse(savedFormData);
          setFormData(parsedFormData);
        } catch (error) {
          console.error('Failed to restore form data on mount:', error);
          localStorage.removeItem('signup_form_data');
        }
      }
      setHasRestoredData(true);
    }
  }, [hasRestoredData]);

  // Handle Discord OAuth callback
  const handleDiscordCallback = useCallback(async (code: string, state: string | null) => {
    try {
      setIsConnectingDiscord(true);
      setError('');
      
      const response = await authAPI.handleDiscordCallback(code, state || undefined);
      
      if (response.success) {
        if (response.requires_registration && response.discord_data) {
          // Store Discord data for registration
          setDiscordData(response.discord_data);
          setIsDiscordConnected(true);
          
          // Restore saved form data after Discord authentication
          const savedFormData = localStorage.getItem('signup_form_data');
          if (savedFormData) {
            try {
              const parsedFormData = JSON.parse(savedFormData);
              setFormData(parsedFormData);
              // Clear saved data
              localStorage.removeItem('signup_form_data');
            } catch (error) {
              console.error('Failed to restore form data:', error);
            }
          }
          
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (response.user && response.token) {
          // User already exists, redirect to dashboard
          navigate('/dashboard');
        }
      } else {
        setError(response.error || 'Discord authentication failed');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Discord authentication failed';
      setError(errorMessage);
    } finally {
      setIsConnectingDiscord(false);
    }
  }, [navigate]);

    // Check for Discord OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const discordDataParam = urlParams.get('discord_data');
    
    if (code) {
      handleDiscordCallback(code, state);
    } else if (discordDataParam) {
      // Handle Discord data from backend redirect
      try {
        const parsedDiscordData = JSON.parse(decodeURIComponent(discordDataParam));
        setDiscordData(parsedDiscordData);
        setIsDiscordConnected(true);
        
        // Restore saved form data after Discord authentication
        const savedFormData = localStorage.getItem('signup_form_data');
        if (savedFormData) {
          try {
            const parsedFormData = JSON.parse(savedFormData);
            setFormData(parsedFormData);
            // Clear saved data
            localStorage.removeItem('signup_form_data');
          } catch (error) {
            console.error('Failed to restore form data:', error);
          }
        }
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Failed to parse Discord data from URL:', error);
        setError('Failed to process Discord authentication data');
      }
    }
  }, [location, handleDiscordCallback]);

  // Password validation
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    return {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumbers,
      isValid: minLength && hasUppercase && hasLowercase && hasNumbers
    };
  };

  const passwordValidation = validatePassword(formData.password);

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

    // Validation
    if (!passwordValidation.isValid) {
      setError('Password does not meet requirements');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!isDiscordConnected || !discordData) {
      setError('Please connect your Discord account first');
      setIsLoading(false);
      return;
    }

    try {
      await registerWithDiscord(
        formData.email, 
        formData.password, 
        formData.confirmPassword,
        discordData.id,
        {
          id: discordData.id,
          username: discordData.username,
          global_name: discordData.global_name || discordData.username,
          avatar: discordData.avatar,
          discriminator: discordData.discriminator,
          locale: 'en-US',
          join_date: new Date().toLocaleDateString()
        }
      );
      navigate('/dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordConnect = async () => {
    try {
      setIsConnectingDiscord(true);
      setError('');
      
      // Save current form data to localStorage before redirect
      localStorage.setItem('signup_form_data', JSON.stringify(formData));
      
      const response = await authAPI.startDiscordOAuth();
      
      if (response.success && response.auth_url) {
        // Redirect to Discord OAuth
        window.location.href = response.auth_url;
      } else {
        setError(response.error || 'Failed to connect Discord');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect Discord';
      setError(errorMessage);
    } finally {
      setIsConnectingDiscord(false);
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
            <h1 className="text-3xl font-bold text-gradient mb-2">Create Account</h1>
            <p className="text-gray-400">Join Nova and optimize your system</p>
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

          {/* Signup Form */}
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
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-2 space-y-1 text-xs">
                  <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-400' : 'text-red-400'}`}>
                    {passwordValidation.minLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasUppercase ? 'text-green-400' : 'text-red-400'}`}>
                    {passwordValidation.hasUppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>One uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasLowercase ? 'text-green-400' : 'text-red-400'}`}>
                    {passwordValidation.hasLowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>One lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasNumbers ? 'text-green-400' : 'text-red-400'}`}>
                    {passwordValidation.hasNumbers ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>One number</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Confirm Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-white placeholder-gray-400"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>

            {/* Discord Connection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <label className="block text-sm font-medium text-gray-300">
                Discord Account
              </label>
              
              {isDiscordConnected && discordData ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
                  <div className="relative">
                    {discordData.avatar ? (
                      <img
                        src={`https://cdn.discordapp.com/avatars/${discordData.id}/${discordData.avatar}.png?size=256`}
                        alt={`${discordData.username}'s avatar`}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          // Fallback to default Discord avatar if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center ${discordData.avatar ? 'hidden' : ''}`}>
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-green-400 font-medium flex items-center gap-2">
                      <span>Discord Connected</span>
                    </p>
                    <p className="text-green-300 text-sm">{discordData.username}{discordData.discriminator && discordData.discriminator !== '0' ? `#${discordData.discriminator}` : ''}</p>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={handleDiscordConnect}
                  disabled={isConnectingDiscord}
                  className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  {isConnectingDiscord ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.211.375-.445.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                      <span>Connect Discord Account</span>
                    </>
                  )}
                </Button>
              )}
            </motion.div>

            {/* Sign Up Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                type="submit"
                disabled={isLoading || !formData.email || !passwordValidation.isValid || formData.password !== formData.confirmPassword || !isDiscordConnected}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Sign In Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-6"
          >
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                Sign in here
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup; 