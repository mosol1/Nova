import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Menu, X, Zap, Download, Users, Shield, User, LogOut, Settings, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    display_name?: string;
    image?: string;
    status?: string;
    discord?: string;
  } | null>(null);
  const { isAuthenticated, logout, getUserInfo } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  //const navigate = useNavigate();

  // Fetch user info when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      getUserInfo().then(setUserInfo).catch(console.error);
    }
  }, [isAuthenticated, getUserInfo]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Products', href: '#products', icon: Zap },
    { name: 'Downloads', href: '#downloads', icon: Download },
    { name: 'Community', href: '#community', icon: Users },
    { name: 'Security', href: '#security', icon: Shield },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled 
          ? 'glass border-b border-purple-500/20 glow-purple' 
          : 'bg-transparent'
      )}
    >
      {/* Circuit Pattern Overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid-pattern h-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3 group"
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center glow-purple group-hover:glow-purple-strong transition-all duration-300">
                <img
                  src="/favicon.png"
                  alt="Nova Logo"
                  className="w-8 h-8"
                />
              </div>
              {/* Rotating Ring */}
              <div
                className="absolute inset-0 border-2 border-purple-500/30 rounded-lg animate-spin"
                style={{ animationDuration: '8s' }}
              />
            </div>
            <span className="text-2xl font-bold text-gradient-cyber">
              Nova
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className="relative text-gray-400 hover:text-white px-3 py-2 text-sm font-medium transition-all duration-300 flex items-center space-x-2 group"
                  whileHover={{ scale: 1.05 }}
                >
                  <item.icon className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
                  <span>{item.name}</span>
                  
                  {/* Hover Underline */}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-purple-700 group-hover:w-full transition-all duration-300" />
                  
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-purple-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                {/* User Profile Button */}
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-purple-500/10 transition-all duration-300 group"
                >
                  {/* Profile Picture */}
                  <div className="relative">
                    {userInfo?.image ? (
                      <img
                        src={`data:image/png;base64,${userInfo.image}`}
                        alt="Profile"
                        className="w-8 h-8 rounded-full border-2 border-purple-500/30 group-hover:border-purple-500/60 transition-colors"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center border-2 border-purple-500/30 group-hover:border-purple-500/60 transition-colors">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {/* Status Indicator */}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                  </div>
                  
                  {/* User Info */}
                  <div className="text-left">
                    <div className="text-sm font-medium text-white">
                      {userInfo?.display_name || 'User'}
                    </div>
                    <div className="text-xs text-purple-400">
                      {userInfo?.status || 'Free'}
                    </div>
                  </div>
                  
                  {/* Dropdown Arrow */}
                  <ChevronDown className={cn(
                    "w-4 h-4 text-gray-400 transition-transform duration-200",
                    showUserMenu && "rotate-180"
                  )} />
                </button>

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-64 glass border border-purple-500/20 rounded-lg shadow-xl overflow-hidden z-50"
                    >
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-purple-500/20">
                        <div className="flex items-center space-x-3">
                          {userInfo?.image ? (
                            <img
                              src={`data:image/png;base64,${userInfo.image}`}
                              alt="Profile"
                              className="w-10 h-10 rounded-full border-2 border-purple-500/30"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center border-2 border-purple-500/30">
                              <User className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-white">
                              {userInfo?.display_name || 'User'}
                            </div>
                            <div className="text-sm text-gray-400">
                              @{userInfo?.discord || 'discord_user'}
                            </div>
                            <div className="text-xs text-purple-400">
                              {userInfo?.status || 'Free'} Plan
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link 
                          to="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-purple-500/10 transition-all duration-200"
                        >
                          <User className="w-4 h-4" />
                          <span>Dashboard</span>
                        </Link>
                        
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            // TODO: Add settings navigation
                          }}
                          className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-purple-500/10 transition-all duration-200 w-full text-left"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>
                        
                        <hr className="my-2 border-purple-500/20" />
                        
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                          }}
                          className="flex items-center space-x-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="relative group">
                    <span className="relative z-10">Sign In</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-purple-800/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="purple" size="sm" className="relative overflow-hidden group">
                    <span className="relative z-10">Get Started</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="relative group"
            >
              <div className="absolute inset-0 bg-purple-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {isOpen ? <X className="w-5 h-5 relative z-10" /> : <Menu className="w-5 h-5 relative z-10" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden glass border-t border-purple-500/20"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item, index) => (
              <motion.a
                key={item.name}
                href={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-gray-400 hover:text-white flex items-center space-x-3 px-3 py-2 text-base font-medium transition-all duration-300 rounded-lg hover:bg-purple-500/10"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </motion.a>
            ))}
            <div className="pt-4 pb-3 border-t border-purple-500/20">
              <div className="flex flex-col space-y-3 px-3">
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => logout()}
                      className="w-full justify-start"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button variant="purple" size="sm" className="w-full justify-start">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;