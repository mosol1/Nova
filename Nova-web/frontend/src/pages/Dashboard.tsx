import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { User, LogOut, Settings, Shield, Zap, HardDrive, Activity, Mail, Calendar, Globe, Star, Loader2, ExternalLink, X } from 'lucide-react';
import { type UserInfoResponse } from '../lib/auth';

const Dashboard = () => {
  const { user, logout, getUserInfo } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNovaHubPrompt, setShowNovaHubPrompt] = useState(false);
  const [novaHubData, setNovaHubData] = useState<{state: string, token: string, userId: string} | null>(null);

  // Check for Nova Hub authentication parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const novaAuth = urlParams.get('nova_auth');
    const token = urlParams.get('token');
    const userId = urlParams.get('userId');

    if (novaAuth && token && userId) {
      setNovaHubData({ state: novaAuth, token, userId });
      setShowNovaHubPrompt(true);
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle Nova Hub protocol redirect
  const handleNovaHubRedirect = () => {
    if (novaHubData) {
      const callbackUrl = `nova://auth/callback?state=${novaHubData.state}&token=${novaHubData.token}&userId=${novaHubData.userId}`;
      console.log('🚀 Opening Nova Hub with:', callbackUrl);
      
      try {
        window.location.href = callbackUrl;
        setShowNovaHubPrompt(false);
      } catch (error) {
        console.error('Failed to open Nova Hub:', error);
        alert('Failed to open Nova Hub. Please ensure Nova Hub is installed.');
      }
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setIsLoading(true);
        const info = await getUserInfo();
        setUserInfo(info);
      } catch (error: any) {
        setError(error.message || 'Failed to load user info');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch user info if we have a user
    if (user) {
      fetchUserInfo();
    } else {
      setIsLoading(false);
    }
  }, [getUserInfo, user]);

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Error: {error}</div>
          <Button onClick={() => window.location.reload()} className="bg-purple-600 hover:bg-purple-700">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nova Hub Protocol Handler Prompt */}
      {showNovaHubPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-purple-500/20 glow-card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Return to Nova Hub</h3>
              </div>
              <Button
                onClick={() => setShowNovaHubPrompt(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-gray-300 mb-6">
              Your authentication was successful! Would you like to return to Nova Hub with your login credentials?
            </p>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleNovaHubRedirect}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Nova Hub
              </Button>
              <Button
                onClick={() => setShowNovaHubPrompt(false)}
                variant="outline"
                className="flex-1"
              >
                Stay Here
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center glow-purple">
                <img
                  src="/favicon.png"
                  alt="Nova Logo"
                  className="w-6 h-6"
                />
              </div>
              <span className="text-xl font-bold text-gradient">Nova Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {userInfo?.image && (
                  <img
                    src={`data:image/png;base64,${userInfo.image}`}
                    alt="Profile Picture"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-300">
                  {userInfo?.display_name || user?.email}
                </span>
              </div>
              
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 glow-card"
            >
              <div className="text-center">
                <div className="mb-4">
                  {userInfo?.image ? (
                    <img
                      src={`data:image/png;base64,${userInfo.image}`}
                      alt="Profile Picture"
                      className="w-24 h-24 rounded-full mx-auto ring-4 ring-purple-500/20"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center mx-auto">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">
                  {userInfo?.display_name || 'User'}
                </h2>
                
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Shield className="w-4 h-4 mr-1" />
                  {userInfo?.status || 'Free'}
                </div>
                
                {userInfo?.is_mod && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 ml-2">
                    <Star className="w-4 h-4 mr-1" />
                    Moderator
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Account Information */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 glow-card"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Account Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-white">{userInfo?.email || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Discord</p>
                      <p className="text-white">{userInfo?.discord || 'Not connected'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Member Since</p>
                      <p className="text-white">{userInfo?.join_date || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Locale</p>
                      <p className="text-white">{userInfo?.locale || 'Not set'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <p className="text-white">{userInfo?.status || 'Free'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Theme</p>
                      <p className="text-white">{userInfo?.preferences?.theme || 'Dark'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 glow-card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">Downloads</h4>
              <HardDrive className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-gray-400 text-sm mb-4">Manage your downloads and files</p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              View Downloads
            </Button>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 glow-card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">Performance</h4>
              <Activity className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-gray-400 text-sm mb-4">Monitor system performance</p>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              View Stats
            </Button>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 glow-card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">Settings</h4>
              <Settings className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-gray-400 text-sm mb-4">Customize your preferences</p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Open Settings
            </Button>
          </div>
        </motion.div>

        {/* Preferences Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 glow-card"
        >
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Preferences
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="text-white font-medium">Notifications</h4>
              <p className="text-sm text-gray-400">
                {userInfo?.preferences?.notifications ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <HardDrive className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="text-white font-medium">Auto Updates</h4>
              <p className="text-sm text-gray-400">
                {userInfo?.preferences?.auto_updates ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="text-white font-medium">Telemetry</h4>
              <p className="text-sm text-gray-400">
                {userInfo?.preferences?.telemetry ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6 text-yellow-400" />
              </div>
              <h4 className="text-white font-medium">Language</h4>
              <p className="text-sm text-gray-400">
                {userInfo?.preferences?.language?.toUpperCase() || 'EN'}
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard; 