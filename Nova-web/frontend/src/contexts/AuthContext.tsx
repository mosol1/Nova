import React, { useState, useEffect, type ReactNode } from 'react';
import { type User, authAPI, getStoredUser, getStoredToken, clearAuth, getCookieUserData, getCookieAuthToken, isAuthenticatedEnhanced } from '../lib/auth';
import { AuthContext, type AuthContextType } from './AuthContextType';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Enhanced auth refresh - better handles OAuth redirects
  const refreshAuth = async () => {
    try {
      // Check both localStorage and cookies
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();
      const cookieToken = getCookieAuthToken();
      const cookieUser = getCookieUserData();

      // Priority: localStorage first, then cookies (OAuth redirects)
      if (storedToken && storedUser) {
        // Use localStorage data
        setToken(storedToken);
        setUser(storedUser);
        
        // Verify token is still valid
        try {
          const currentUser = await authAPI.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            localStorage.setItem('user_data', JSON.stringify(currentUser));
          } else {
            clearAuth();
            setUser(null);
            setToken(null);
          }
        } catch (error) {
          console.error('❌ AuthContext: Token verification failed:', error);
          clearAuth();
          setUser(null);
          setToken(null);
        }
      } else if (cookieToken && cookieUser) {
        // Cookie-based auth (OAuth redirect) - sync to localStorage immediately
        console.log('✅ Auth restored from cookies after OAuth redirect');
        setToken(cookieToken);
        setUser(cookieUser);
        
        // Immediately sync to localStorage for future page loads
        localStorage.setItem('auth_token', cookieToken);
        localStorage.setItem('user_data', JSON.stringify(cookieUser));
        
        console.log('✅ Auth synced from cookies to localStorage');
      } else {
        // No valid auth found
        console.log('❌ No valid authentication found');
        clearAuth();
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('❌ AuthContext: Auth refresh error:', error);
      clearAuth();
      setUser(null);
      setToken(null);
    }
  };

  // Initialize auth state from localStorage and cookies
  useEffect(() => {
    const initAuth = async () => {
      await refreshAuth();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Register function - updated to handle new parameters
  const register = async (email: string, password: string, confirmPassword: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authAPI.register({ 
        email, 
        password, 
        confirmPassword,
        discord_id: '', // This will be set by the signup page
        user_data: {
          id: '',
          username: '',
          global_name: '',
          avatar: '',
          discriminator: '',
          locale: '',
          join_date: ''
        } // This will be set by the signup page
      });
      
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Register with Discord data function
  const registerWithDiscord = async (
    email: string, 
    password: string, 
    confirmPassword: string, 
    discord_id: string, 
    user_data: {
      id: string;
      username: string;
      global_name: string;
      avatar: string;
      discriminator: string;
      locale: string;
      join_date: string;
    }
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authAPI.register({ 
        email, 
        password, 
        confirmPassword,
        discord_id,
        user_data
      });
      
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  };

  // Discord login function
  const loginWithDiscord = async (): Promise<void> => {
    try {
      const response = await authAPI.startDiscordOAuth();
      if (response.success && response.auth_url) {
        window.location.href = response.auth_url;
      } else {
        throw new Error(response.error || 'Failed to start Discord OAuth');
      }
    } catch (error) {
      console.error('Discord login error:', error);
      throw error;
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem('user_data', JSON.stringify(currentUser));
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  // Get user info with profile picture
  const getUserInfo = async () => {
    try {
      return await authAPI.getUserInfo();
    } catch (error) {
      console.error('Get user info error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!(user && token),
    isLoading,
    login,
    register,
    registerWithDiscord,
    logout,
    loginWithDiscord,
    refreshUser,
    getUserInfo,
    refreshAuth, // Add refreshAuth to the context value
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 