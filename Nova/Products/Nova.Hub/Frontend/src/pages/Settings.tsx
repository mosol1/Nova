import React, { useState } from "react";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Download,
  Database,
  Info,
  Save,
  RotateCcw,
  ExternalLink
} from "lucide-react";
import { UserInfo } from "../types";

interface SettingsProps {
  currentUser: UserInfo | null;
  onRefresh: () => void;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, onRefresh }) => {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'en',
    autoStart: true,
    minimizeToTray: true,
    notifications: true,
    updateChannel: 'stable',
    telemetry: true,
    autoUpdate: true,
    maxConcurrentDownloads: 3,
    downloadPath: 'C:\\Users\\Nova\\Downloads',
    cacheSize: '1GB',
    logLevel: 'info'
  });

  const [isDirty, setIsDirty] = useState(false);

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "account", label: "Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "updates", label: "Updates", icon: Download },
    { id: "advanced", label: "Advanced", icon: Database },
    { id: "about", label: "About", icon: Info }
  ];

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    console.log("Saving settings:", settings);
    setIsDirty(false);
  };

  const handleReset = () => {
    setSettings({
      theme: 'dark',
      language: 'en',
      autoStart: true,
      minimizeToTray: true,
      notifications: true,
      updateChannel: 'stable',
      telemetry: true,
      autoUpdate: true,
      maxConcurrentDownloads: 3,
      downloadPath: 'C:\\Users\\Nova\\Downloads',
      cacheSize: '1GB',
      logLevel: 'info'
    });
    setIsDirty(false);
  };

  const SettingRow = ({ 
    label, 
    description, 
    children 
  }: { 
    label: string; 
    description?: string; 
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-glow last:border-b-0">
      <div className="flex-1">
        <h4 className="text-gradient font-medium">{label}</h4>
        {description && <p className="text-sm text-secondary mt-1">{description}</p>}
      </div>
      <div className="ml-4">{children}</div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gradient mb-4">General Settings</h3>
              <div className="glass border border-glow rounded-lg p-4">
                <SettingRow 
                  label="Language" 
                  description="Select your preferred language"
                >
                  <select
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    className="glass border border-glow rounded px-3 py-1 text-sm bg-transparent text-white"
                  >
                    <option value="en" className="bg-black">English</option>
                    <option value="es" className="bg-black">Español</option>
                    <option value="fr" className="bg-black">Français</option>
                    <option value="de" className="bg-black">Deutsch</option>
                  </select>
                </SettingRow>

                <SettingRow 
                  label="Auto-start Nova Hub" 
                  description="Start Nova Hub when Windows starts"
                >
                  <input
                    type="checkbox"
                    checked={settings.autoStart}
                    onChange={(e) => handleSettingChange('autoStart', e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-transparent border-glow rounded focus:ring-purple-500"
                  />
                </SettingRow>

                <SettingRow 
                  label="Minimize to system tray" 
                  description="Keep Nova Hub running in the background"
                >
                  <input
                    type="checkbox"
                    checked={settings.minimizeToTray}
                    onChange={(e) => handleSettingChange('minimizeToTray', e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-transparent border-glow rounded focus:ring-purple-500"
                  />
                </SettingRow>
              </div>
            </div>
          </div>
        );

      case "account":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gradient mb-4">Account Information</h3>
              {currentUser?.isAuthenticated ? (
                <div className="glass border border-glow rounded-lg p-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 glass-purple rounded-full flex items-center justify-center border border-glow">
                      <User className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gradient">{currentUser.displayName || currentUser.globalName || currentUser.username}</h4>
                      <p className="text-secondary">{currentUser.email}</p>
                      <p className="text-sm text-purple-400">
                        {currentUser.subscription?.plan || 'Free'} Plan
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="glass border border-glow px-4 py-2 rounded-lg text-purple-400 hover:glow-purple transition-all">
                      Edit Profile
                    </button>
                    <button className="glass border border-glow px-4 py-2 rounded-lg text-purple-400 hover:glow-purple transition-all">
                      Change Password
                    </button>
                    <button className="glass border border-glow px-4 py-2 rounded-lg text-purple-400 hover:glow-purple transition-all">
                      Manage Subscription
                    </button>
                    <button className="glass border border-red-400 px-4 py-2 rounded-lg text-red-400 hover:glow-purple transition-all">
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass border border-glow rounded-lg text-center py-8">
                  <User className="w-16 h-16 text-secondary mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gradient mb-2">Not signed in</h4>
                  <p className="text-secondary mb-4">
                    Sign in to access your account settings and premium features
                  </p>
                  <button className="glass-purple border border-glow px-4 py-2 rounded-lg text-purple-400 hover:glow-purple transition-all">
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case "about":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gradient mb-4">About Nova Hub</h3>
              <div className="glass border border-glow rounded-lg text-center py-8">
                <div className="w-20 h-20 glass-purple rounded-lg flex items-center justify-center mx-auto mb-4 border border-glow">
                  <SettingsIcon className="w-10 h-10 text-purple-400" />
                </div>
                <h4 className="text-xl font-semibold text-gradient mb-2">Nova Hub</h4>
                <p className="text-secondary mb-4">Version 2.0.0</p>
                <p className="text-sm text-secondary mb-6 max-w-md mx-auto">
                  Central management interface for all Nova products. Built with React, Tauri, and modern web technologies.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto">
                  <button className="flex items-center justify-center space-x-2 glass border border-glow px-3 py-2 rounded-lg text-sm text-purple-400 hover:glow-purple transition-all">
                    <ExternalLink className="w-4 h-4" />
                    <span>Website</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 glass border border-glow px-3 py-2 rounded-lg text-sm text-purple-400 hover:glow-purple transition-all">
                    <ExternalLink className="w-4 h-4" />
                    <span>Support</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 glass border border-glow px-3 py-2 rounded-lg text-sm text-purple-400 hover:glow-purple transition-all">
                    <ExternalLink className="w-4 h-4" />
                    <span>License</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="glass border border-glow rounded-lg p-8 text-center">
            <h3 className="text-lg font-semibold text-gradient mb-2">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings</h3>
            <p className="text-secondary">Settings for {activeTab} will be implemented here.</p>
          </div>
        );
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Settings</h1>
          <p className="text-secondary mt-1">Configure your Nova Hub preferences</p>
        </div>

        {/* Action Buttons */}
        {isDirty && (
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleReset}
              className="flex items-center space-x-2 glass border border-glow px-4 py-2 rounded-lg text-secondary hover:text-purple-400 hover:glow-purple transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center space-x-2 glass-purple border border-glow px-4 py-2 rounded-lg text-purple-400 hover:glow-purple transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="glass border border-glow rounded-lg p-4">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'glass-purple text-purple-400 border border-glow'
                      : 'text-secondary hover:glass hover:text-purple-400'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;