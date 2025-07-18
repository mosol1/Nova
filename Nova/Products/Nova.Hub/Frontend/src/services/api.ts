// services/api.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  version: string;
  isRunning: boolean;
  isInstalled: boolean;
  category?: string;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    displayName?: string;
    globalName?: string;
    discordId?: string;
    image?: string; // Base64 profile picture
    createdAt?: string;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class NovaAPI {
  private baseUrl: string;
  private isBackendAvailableCache: boolean | null = null;
  private lastAvailabilityCheck: number = 0;
  private readonly AVAILABILITY_CACHE_DURATION = 5000; // 5 seconds

  constructor() {
    // Default to localhost, but this could be configurable
    this.baseUrl = 'http://localhost:5001';
    console.log(`Nova API initialized with base URL: ${this.baseUrl}`);
  }

  /**
   * Check if the Nova Hub backend is available
   */
  async isBackendAvailable(): Promise<boolean> {
    const now = Date.now();
    
    // Use cached result if it's recent
    if (this.isBackendAvailableCache !== null && 
        (now - this.lastAvailabilityCheck) < this.AVAILABILITY_CACHE_DURATION) {
      console.log(`Using cached availability result: ${this.isBackendAvailableCache}`);
      return this.isBackendAvailableCache;
    }

    try {
      console.log(`Checking backend availability at: ${this.baseUrl}/health`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      this.isBackendAvailableCache = response.ok;
      this.lastAvailabilityCheck = now;
      
      console.log(`Backend availability check result: ${response.ok} (status: ${response.status})`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Backend health response:', data);
      }
      
      return response.ok;
    } catch (error) {
      console.warn('Backend availability check failed:', error);
      this.isBackendAvailableCache = false;
      this.lastAvailabilityCheck = now;
      return false;
    }
  }

  /**
   * Make a request to the Nova Hub API
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const isAvailable = await this.isBackendAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Nova Hub backend is not available'
        };
      }

      const url = `${this.baseUrl}${endpoint}`;
      console.log(`Making API request: ${options.method || 'GET'} ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`API response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error response:`, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      console.log(`API success response:`, data);
      
      return {
        success: true,
        data: data,
        message: data.message
      };
    } catch (error) {
      console.error('API request failed:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Test connection to the backend
   */
  async testConnection(): Promise<APIResponse<any>> {
    console.log('Testing connection to Nova Hub backend...');
    return this.makeRequest('/api/test');
  }

  /**
   * Get authentication status
   */
  async getAuthStatus(): Promise<APIResponse<AuthStatus>> {
    return this.makeRequest<AuthStatus>('/api/auth/status');
  }

  /**
   * Initiate sign-in flow
   * This will trigger the backend to open the browser for authentication
   */
  async signIn(): Promise<APIResponse<{ message: string; state?: string }>> {
    console.log('Initiating sign-in request to backend...');
    
    const response = await this.makeRequest<{ message: string }>('/api/auth/signin', {
      method: 'POST',
    });

    if (response.success) {
      console.log('Sign-in request sent successfully:', response.data?.message);
    } else {
      console.error('Sign-in request failed:', response.error);
    }

    return response;
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<APIResponse<{ message: string }>> {
    console.log('Initiating sign-out request...');
    
    const response = await this.makeRequest<{ message: string }>('/api/auth/signout', {
      method: 'POST',
    });

    if (response.success) {
      console.log('Sign-out successful:', response.data?.message);
    } else {
      console.error('Sign-out failed:', response.error);
    }

    return response;
  }

  /**
   * Get all products
   */
  async getAllProducts(): Promise<APIResponse<{ products: Product[] }>> {
    return this.makeRequest<{ products: Product[] }>('/api/products');
  }

  /**
   * Launch a specific product
   */
  async launchProduct(productId: string): Promise<APIResponse<{ message: string }>> {
    console.log(`Launching product: ${productId}`);
    
    const response = await this.makeRequest<{ message: string }>(`/api/products/${productId}/launch`, {
      method: 'POST',
    });

    if (response.success) {
      console.log(`Product ${productId} launched successfully:`, response.data?.message);
    } else {
      console.error(`Failed to launch product ${productId}:`, response.error);
    }

    return response;
  }

  /**
   * Stop a specific product
   */
  async stopProduct(productId: string): Promise<APIResponse<{ message: string }>> {
    console.log(`Stopping product: ${productId}`);
    
    const response = await this.makeRequest<{ message: string }>(`/api/products/${productId}/stop`, {
      method: 'POST',
    });

    if (response.success) {
      console.log(`Product ${productId} stopped successfully:`, response.data?.message);
    } else {
      console.error(`Failed to stop product ${productId}:`, response.error);
    }

    return response;
  }

  /**
   * Get product details
   */
  async getProduct(productId: string): Promise<APIResponse<Product>> {
    return this.makeRequest<Product>(`/api/products/${productId}`);
  }

  /**
   * Refresh all data (products and auth status)
   */
  async refreshAll(): Promise<APIResponse<{ products: Product[]; authStatus: AuthStatus }>> {
    return this.makeRequest<{ products: Product[]; authStatus: AuthStatus }>('/api/refresh');
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<APIResponse<{ 
    isRunning: boolean; 
    version: string; 
    uptime: number;
    productsCount: number;
  }>> {
    return this.makeRequest('/api/system/status');
  }

  /**
   * Clear the backend availability cache (force recheck)
   */
  clearAvailabilityCache(): void {
    this.isBackendAvailableCache = null;
    this.lastAvailabilityCheck = 0;
    console.log('Backend availability cache cleared');
  }

  /**
   * Handle authentication callback from deep link
   */
  async handleAuthCallback(data: { state: string; token: string; user: any }): Promise<APIResponse<{ message: string }>> {
    console.log('Sending auth callback to backend:', data);
    
    const response = await this.makeRequest<{ message: string }>('/api/auth/callback', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success) {
      console.log('Auth callback processed successfully:', response.data?.message);
    } else {
      console.error('Auth callback failed:', response.error);
    }

    return response;
  }

  /**
   * Check for pending authentication (polling)
   */
  async checkPendingAuth(state: string): Promise<APIResponse<{ message: string }>> {
    console.log('Checking for pending authentication:', state);
    
    const response = await this.makeRequest<{ message: string }>(`/api/auth/check/${state}`, {
      method: 'GET',
    });

    if (response.success) {
      console.log('Pending auth check result:', response.data?.message);
    }

    return response;
  }
}

// Create and export a singleton instance
export const novaAPI = new NovaAPI();
export default novaAPI;