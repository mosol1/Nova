import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Catalog from './pages/Catalog';
import Settings from './pages/Settings';
import { NovaProduct, UserInfo } from './types';
import { novaAPI, type Product as APIProduct, type AuthStatus } from './services/api';

function App() {
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [products, setProducts] = useState<NovaProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    initializeNovaHub();
    
    // TODO: Add deep link authentication listener
  }, []);

  // TODO: Add authentication callback handler

  const initializeNovaHub = async () => {
    try {
      setLoading(true);
      console.log("Initializing Nova Hub connection...");
      await refreshData();
    } catch (error) {
      console.error("Failed to initialize Nova Hub:", error);
      // Set default offline state
      setCurrentUser({
        id: "",
        username: "Guest",
        email: "",
        isAuthenticated: false,
        avatar: null
      });
      setProducts([
        {
          id: "demo-product-1",
          name: "Demo Product",
          displayName: "Demo Product",
          description: "This is a demo product for testing the interface",
          version: "1.0.0",
          status: "Stopped",
          isInstalled: true,
          category: "Tools"
        },
        {
          id: "demo-product-2",
          name: "Another Demo",
          displayName: "Another Demo",
          description: "Another demo product in running state",
          version: "2.1.0",
          status: "Running",
          isInstalled: true,
          category: "Productivity"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      console.log("Refreshing data from Nova Hub API...");
      
      const isAvailable = await novaAPI.isBackendAvailable();
      if (!isAvailable) {
        console.warn("Nova Hub backend is not available. Using demo data.");
        // Set demo data when backend is not available
        setCurrentUser({
          id: "demo-user",
          username: "Demo User",
          email: "demo@example.com",
          isAuthenticated: false,
          avatar: null
        });
        setProducts([
          {
            id: "demo-product-1",
            name: "Demo Product",
            displayName: "Demo Product",
            description: "This is a demo product for testing the interface",
            version: "1.0.0",
            status: "Stopped",
            isInstalled: true,
            category: "Tools"
          },
          {
            id: "demo-product-2",
            name: "Another Demo",
            displayName: "Another Demo",
            description: "Another demo product in running state",
            version: "2.1.0",
            status: "Running",
            isInstalled: true,
            category: "Productivity"
          }
        ]);
        return;
      }

      // Get authentication status
      const authResponse = await novaAPI.getAuthStatus();
      if (authResponse.success && authResponse.data) {
        const authData = authResponse.data as AuthStatus;
        setCurrentUser({
          id: authData.user?.id || "",
          username: authData.user?.username || "Guest",
          email: authData.user?.email || "",
          isAuthenticated: authData.isAuthenticated,
          avatar: authData.user?.avatarUrl || null,
          avatarUrl: authData.user?.avatarUrl || undefined,
          displayName: authData.user?.displayName || authData.user?.globalName || authData.user?.username || "Guest",
          globalName: authData.user?.globalName || "",
          discordId: authData.user?.discordId || "",
          image: authData.user?.image || undefined, // Base64 profile picture
          createdAt: authData.user?.createdAt || undefined
        });
      }

      // Get products data
      const productsResponse = await novaAPI.getAllProducts();
      if (productsResponse.success && productsResponse.data) {
        const apiProducts = productsResponse.data.products;
        
        const uiProducts: NovaProduct[] = apiProducts.map((product: APIProduct) => ({
          id: product.id,
          name: product.name,
          displayName: product.name,
          description: product.description,
          version: product.version,
          status: product.isRunning ? "Running" as const : "Stopped" as const,
          isInstalled: product.isInstalled,
          icon: `/icons/${product.id}.png`,
          category: product.category || "Other"
        }));

        setProducts(uiProducts);
        console.log(`Loaded ${uiProducts.length} products from API`);
      }

    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  const handleSignIn = async () => {
    try {
      setAuthLoading(true);
      console.log("Initiating sign-in via API...");
      
      const response = await novaAPI.signIn();
      
      if (response.success && response.data?.state) {
        console.log("Sign-in initiated successfully:", response.data?.message);
        console.log("Authentication state:", response.data.state);
        
        // Show user that the browser should have opened
        console.log("Browser should have opened for authentication. Please complete the sign-in process.");
        
        // Start polling for this specific authentication state
        startAuthPolling(response.data.state);
        
      } else {
        console.error("Sign-in failed:", response.error);
        
        // Show error to user
        alert(`Sign-in failed: ${response.error}`);
        
        // Fallback to demo mode for development
        if (process.env.NODE_ENV === 'development') {
          console.log("Using demo sign-in for development");
          setCurrentUser({
            id: "demo-user",
            username: "Demo User",
            email: "demo@example.com",
            isAuthenticated: true,
            avatar: null
          });
        }
      }
    } catch (error) {
      console.error("Failed to initiate sign-in:", error);
      alert(`Sign-in error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const startAuthPolling = (state: string) => {
    console.log("Starting authentication polling for state:", state);
    
    const checkPendingAuth = async () => {
      try {
        const response = await novaAPI.checkPendingAuth(state);
        if (response.success && response.data?.message === "Authentication completed") {
          console.log("Authentication completed successfully!");
            
            // Stop polling
            clearInterval(pollInterval);
            setAuthLoading(false);
            
          // Refresh all data to get updated auth status
            await refreshData();
        }
      } catch (error) {
        console.error("Error checking pending authentication:", error);
      }
    };

    // Poll every 2 seconds for authentication changes
    const pollInterval = setInterval(checkPendingAuth, 2000);
    
    // Stop polling after 5 minutes (timeout)
    setTimeout(() => {
      clearInterval(pollInterval);
      setAuthLoading(false);
      console.log("Authentication polling timed out");
    }, 5 * 60 * 1000); // 5 minutes
  };

  const handleSignOut = async () => {
    try {
      setAuthLoading(true);
      console.log("Signing out via API...");
      
      const response = await novaAPI.signOut();
      
      if (response.success) {
        console.log("Signed out successfully:", response.data?.message);
        
        // Update user state
        setCurrentUser({
          id: "",
          username: "Guest",
          email: "",
          isAuthenticated: false,
          avatar: null
        });
        
        // Refresh data
        await refreshData();
        
        // You might want to show a success notification here
        console.log("Sign-out completed successfully!");
        
      } else {
        console.error("Sign-out failed:", response.error);
        
        // Even if the API call fails, we can still clear the local state
        setCurrentUser({
          id: "",
          username: "Guest",
          email: "",
          isAuthenticated: false,
          avatar: null
        });
        
        // You might want to show a warning notification here
        console.warn("Local sign-out completed, but server sign-out may have failed");
      }
    } catch (error) {
      console.error("Failed to sign out:", error);
      
      // Clear local state anyway
      setCurrentUser({
        id: "",
        username: "Guest",
        email: "",
        isAuthenticated: false,
        avatar: null
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLaunchProduct = async (productId: string) => {
    try {
      console.log(`Launching product ${productId} via API...`);
      const response = await novaAPI.launchProduct(productId);
      
      if (response.success) {
        console.log("Product launched:", response.data?.message);
        
        // Refresh data to get updated product status
        await refreshData();
        
        // You might want to show a success notification here
        
      } else {
        console.error("Launch failed:", response.error);
        
        // Show error to user
        alert(`Failed to launch product: ${response.error}`);
        
        // Fallback to demo mode for development
        if (process.env.NODE_ENV === 'development') {
          console.log("Using demo launch for development");
          setProducts(prev => prev.map(p => 
            p.id === productId 
              ? { ...p, status: p.status === 'Running' ? 'Stopped' : 'Running' }
              : p
          ));
        }
      }
    } catch (error) {
      console.error("Failed to launch product:", error);
      alert(`Launch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gradient-purple font-medium">Loading Nova Hub...</div>
          <div className="text-sm text-muted mt-2">Initializing system...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-primary">
      <Sidebar 
        activeView={activeView}
        onViewChange={handleViewChange}
        isCollapsed={sidebarCollapsed}
        products={products}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onRefresh={refreshData}
          currentUser={currentUser}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          authLoading={authLoading}
        />
        
        <main className="flex-1 overflow-hidden bg-primary">
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  products={products}
                  currentUser={currentUser}
                  onLaunchProduct={handleLaunchProduct}
                />
              } 
            />
            <Route 
              path="/products" 
              element={
                <Products 
                  products={products}
                  onLaunchProduct={handleLaunchProduct}
                  onRefresh={refreshData}
                />
              } 
            />
            <Route 
              path="/catalog" 
              element={
                <Catalog 
                  currentUser={currentUser}
                  onSignIn={handleSignIn}
                />
              } 
            />
            <Route 
              path="/settings" 
              element={
                <Settings 
                  currentUser={currentUser}
                  onRefresh={refreshData}
                />
              } 
            />
          </Routes>
        </main>
      </div>
      
      {/* Loading overlay for authentication */}
      {authLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {currentUser?.isAuthenticated ? 'Signing out...' : 'Signing in...'}
              </h3>
              <p className="text-sm text-gray-600">
                {currentUser?.isAuthenticated 
                  ? 'Please wait while we sign you out...' 
                  : 'Please complete the sign-in process in your browser...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;