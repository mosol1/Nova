import { createContext } from 'react';
import { type User, type UserInfoResponse } from '../lib/auth';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmPassword: string) => Promise<void>;
  registerWithDiscord: (
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
  ) => Promise<void>;
  logout: () => Promise<void>;
  loginWithDiscord: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshAuth: () => Promise<void>; // Add refreshAuth method
  getUserInfo: () => Promise<UserInfoResponse>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined); 