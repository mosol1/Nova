import React, { useState } from 'react';
import { Search, Menu, Bell, RefreshCw, User, Settings, LogOut, Loader2 } from 'lucide-react';
import Button from './ui/Button';

interface HeaderProps {
  onToggleSidebar: () => void;
  onRefresh: () => void;
  currentUser: any;
  onSignIn: () => void;
  onSignOut: () => void;
  authLoading?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar, 
  onRefresh, 
  currentUser, 
  onSignIn, 
  onSignOut,
  authLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignIn = () => {
    if (!authLoading) {
      onSignIn();
    }
  };

  const handleSignOut = () => {
    if (!authLoading) {
      onSignOut();
    }
  };

  return (
    <header className="glass-ultra border-b border-accent sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            icon={Menu}
            onClick={onToggleSidebar}
            className="p-2 text-purple-300 hover:text-purple-200 hover:glow-purple-soft"
          />

          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg glass-light flex items-center justify-center glow-purple-soft">
              <span className="text-xl font-bold text-gradient-purple">N</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient-purple">Nova Hub</h1>
              <p className="text-xs text-muted">Central Command</p>
            </div>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search products, services, or commands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 glass-input rounded-lg focus:outline-none focus:glow-focus text-white placeholder-muted"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            icon={Bell}
            className="p-2 text-purple-300 hover:text-purple-200 hover:glow-purple-soft"
          />
          
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={onRefresh}
            disabled={authLoading}
            className="p-2 text-purple-300 hover:text-purple-200 hover:glow-purple-soft disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {currentUser?.isAuthenticated ? (
            <div className="flex items-center space-x-2">
              {/* User Info Display */}
              <div className="glass-light px-3 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  {currentUser.image ? (
                    <img 
                      src={`data:image/png;base64,${currentUser.image}`}
                      alt={currentUser.displayName || currentUser.globalName || currentUser.username}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (currentUser.avatarUrl || currentUser.avatar) ? (
                    <img 
                      src={currentUser.avatarUrl || currentUser.avatar} 
                      alt={currentUser.displayName || currentUser.globalName || currentUser.username}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {(currentUser.displayName || currentUser.globalName || currentUser.username)?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <span className="text-sm font-medium text-white">{currentUser.displayName || currentUser.globalName || currentUser.username}</span>
                    {currentUser.email && (
                      <p className="text-xs text-muted">{currentUser.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sign Out Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={authLoading}
                className="p-2 text-purple-300 hover:text-red-400 hover:glow-red-soft disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sign Out"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSignIn}
              disabled={authLoading}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Loading Overlay for Authentication */}
      {authLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-10">
          <div className="glass-light px-4 py-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span className="text-sm text-white">
                {currentUser?.isAuthenticated ? 'Signing out...' : 'Please complete sign-in in your browser...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Animated Background Pattern */}
      <div className="absolute inset-0 dot-pattern-subtle opacity-50 pointer-events-none"></div>
    </header>
  );
};

export default Header;