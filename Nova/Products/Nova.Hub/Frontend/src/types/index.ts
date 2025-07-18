// User-related types
export interface UserInfo {
  id: string;
  username: string;
  email: string;
  isAuthenticated: boolean;
  avatar?: string | null;
  displayName?: string;
  avatarUrl?: string;
  
  // Discord-specific properties
  discordId?: string;
  globalName?: string;
  image?: string; // Base64 profile picture
  createdAt?: string;
  
  // Subscription info
  subscription?: {
    plan: string;
    status?: string;
  };
}

// Product-related types
export interface NovaProduct {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  status: 'Running' | 'Stopped' | 'Installing' | 'Error';
  isInstalled: boolean;
  isRunning?: boolean;
  icon?: string;
  category: string;
  tags?: string[];
  executablePath?: string;
  installPath?: string;
}

// System tray types
export interface TrayStatus {
  running_products: number;
  updates_available: number;
  system_health: 'Optimal' | 'Warning' | 'Critical';
}

// API response types
export interface ApiError {
  error: string;
  details?: string;
}

// Navigation types
export type ViewType = 'dashboard' | 'products' | 'catalog' | 'settings'; 