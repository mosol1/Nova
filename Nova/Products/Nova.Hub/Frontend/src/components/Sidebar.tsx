import React, { useState } from 'react';
import { 
  Home, 
  Package, 
  Store, 
  Settings, 
  Users, 
  BarChart3,
  Terminal,
  HelpCircle,
  Zap,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isCollapsed: boolean;
  products: any[];
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  path: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  isCollapsed, 
  products 
}) => {
  const runningProducts = products.filter(p => p.status === 'Running');

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      path: '/'
    },
    {
      id: 'products',
      label: 'My Products',
      icon: <Package className="w-5 h-5" />,
      badge: products.length,
      path: '/products'
    },
    {
      id: 'catalog',
      label: 'Product Catalog',
      icon: <Store className="w-5 h-5" />,
      path: '/catalog'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      path: '/analytics'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: <Users className="w-5 h-5" />,
      path: '/users'
    },
    {
      id: 'terminal',
      label: 'Terminal',
      icon: <Terminal className="w-5 h-5" />,
      path: '/terminal'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      path: '/settings'
    },
  ];

  const handleItemClick = (item: MenuItem) => {
    onViewChange(item.id);
  };

  return (
    <aside className={`glass-ultra border-r border-accent transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 grid-pattern-subtle opacity-30 pointer-events-none"></div>
      
      {/* Sidebar Header */}
      <div className="p-4 border-b border-accent">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl glass-light flex items-center justify-center glow-purple-soft">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gradient-purple">Control Panel</h2>
              <p className="text-xs text-muted">System Management</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 overflow-y-auto no-scrollbar">
        <div className="space-y-2">
          {menuItems.map(item => {
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-purple-400/10 border-l-4 border-purple-500 text-purple-300 glow-purple-soft'
                    : 'text-secondary hover:text-primary hover:bg-glass-light hover:transform hover:translate-x-1'
                }`}
              >
                <div className={`transition-all duration-300 ${
                  isActive ? 'text-purple-400' : 'text-muted group-hover:text-purple-300'
                }`}>
                  {item.icon}
                </div>
                
                {!isCollapsed && (
                  <>
                    <span className={`font-medium transition-all duration-300 ${
                      isActive ? 'text-gradient-purple' : ''
                    }`}>
                      {item.label}
                    </span>
                    
                    <div className="flex-1"></div>
                    
                    {item.badge && item.badge > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-2 text-xs font-bold bg-purple-500 text-white rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    )}
                    
                    <ChevronRight className="w-4 h-4 text-muted group-hover:text-purple-300 transition-colors" />
                  </>
                )}
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-l-full"></div>
                )}
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-purple-500/5 to-transparent"></div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="p-4 border-t border-accent">
          <h3 className="text-sm font-semibold text-purple-300 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center space-x-3 p-2 rounded-lg glass-light hover:glow-purple-soft transition-all duration-300 group">
              <Package className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">Install Product</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-2 rounded-lg glass-light hover:glow-purple-soft transition-all duration-300 group">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">System Check</span>
            </button>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="p-4 border-t border-accent">
        <button className={`w-full flex items-center space-x-3 p-3 rounded-xl glass-light hover:glow-purple-soft transition-all duration-300 group ${
          isCollapsed ? 'justify-center' : ''
        }`}>
          <HelpCircle className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
          {!isCollapsed && (
            <>
              <span className="text-sm font-medium">Help & Support</span>
              <div className="flex-1"></div>
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-purple-500 text-white rounded-full">?</span>
            </>
          )}
        </button>
      </div>

      {/* Status Indicator */}
      <div className="p-4">
        <div className="flex items-center justify-center space-x-2 p-2 glass-light rounded-lg">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          {!isCollapsed && (
            <span className="text-xs text-muted">
              System Online • {runningProducts.length} Running
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;