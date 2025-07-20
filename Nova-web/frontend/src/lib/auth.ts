// lib/auth.ts - Enhanced authentication utilities with Discord OAuth
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For sending cookies
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove invalid token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      // Clear cookies
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  _id: string;
  email: string;
  discord_id?: string;
  user_data?: {
    id: string;
    username: string;
    global_name: string;
    avatar: string;
    discriminator: string;
    locale: string;
    join_date: string;
    elite_email?: string;
  };
  status: 'Free' | 'Pro' | 'Exclusive';
  preferences: {
    theme: string;
    notifications: boolean;
    auto_updates: boolean;
    telemetry: boolean;
    language: string;
  };
  subscription?: {
    type: string;
    start_date: string;
    end_date: string;
    auto_renew: boolean;
  };
  created_at: string;
  last_login: string;
  email_verified: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
}

export interface DiscordOAuthResponse {
  success: boolean;
  auth_url?: string;
  discord_data?: {
    id: string;
    username: string;
    global_name: string;
    avatar: string;
    discriminator: string;
    locale: string;
    join_date: string;
  };
  requires_registration?: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  discord_id: string;
  user_data: {
    id: string;
    username: string;
    global_name: string;
    avatar: string;
    discriminator: string;
    locale: string;
    join_date: string;
  };
}

export interface UserInfoResponse {
  success: boolean;
  display_name: string;
  image: string;
  join_date: string;
  email: string;
  discord: string;
  locale: string;
  is_mod: boolean;
  status: string;
  preferences: {
    theme: string;
    notifications: boolean;
    auto_updates: boolean;
    telemetry: boolean;
    language: string;
  };
}

// Authentication API calls
export const authAPI = {
  // Login with email and password
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Login failed');
    }
  },

  // Register new user
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register', credentials);
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Registration failed');
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      // Clear cookies
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch {
      return null;
    }
  },

  // Get user info with profile picture
  getUserInfo: async (): Promise<UserInfoResponse> => {
    try {
      const response = await api.get('/auth/user_info');
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to get user info');
    }
  },

  // Refresh token
  refreshToken: async (): Promise<string | null> => {
    try {
      const response = await api.post('/auth/refresh');
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        return response.data.token;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Start Discord OAuth flow
  startDiscordOAuth: async (state?: string): Promise<DiscordOAuthResponse> => {
    try {
      const response = await api.post('/auth/discord', { state });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to start Discord OAuth');
    }
  },

  // Handle Discord OAuth callback
  handleDiscordCallback: async (code: string, state?: string): Promise<DiscordOAuthResponse> => {
    try {
      const response = await api.post('/auth/discord/callback', { code, state });
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Discord authentication failed');
    }
  },

  // Send password reset email
  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to send reset email');
    }
  },

  // Reset password
  resetPassword: async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to reset password');
    }
  },

  // Verify email
  verifyEmail: async (token: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post('/auth/verify-email', { token });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Email verification failed');
    }
  },

  // Resend verification email
  resendVerification: async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to resend verification email');
    }
  }
};

// Utility functions
export const getStoredUser = (): User | null => {
  try {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const isAuthenticated = (): boolean => {
  return !!(getStoredToken() && getStoredUser());
};

export const clearAuth = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  // Clear cookies
  document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

// Helper function to get user data from cookies
export const getCookieUserData = (): User | null => {
  try {
    const cookies = document.cookie.split(';');
    const userDataCookie = cookies.find(cookie => cookie.trim().startsWith('user_data='));
    
    if (userDataCookie) {
      const userData = userDataCookie.split('=')[1];
      return JSON.parse(decodeURIComponent(userData));
    }
    
    return null;
  } catch {
    return null;
  }
};

// Helper function to get auth token from cookies
export const getCookieAuthToken = (): string | null => {
  try {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
    
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
    
    return null;
  } catch {
    return null;
  }
};

// Enhanced authentication check that includes cookies
export const isAuthenticatedEnhanced = (): boolean => {
  // Check localStorage first
  const localToken = getStoredToken();
  const localUser = getStoredUser();
  
  // Check cookies as fallback (important for OAuth redirects)
  const cookieToken = getCookieAuthToken();
  const cookieUser = getCookieUserData();
  
  return !!(
    (localToken && localUser) || 
    (cookieToken && cookieUser)
  );
};

export default api; 