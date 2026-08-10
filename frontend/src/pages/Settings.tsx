import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiUser, FiBell, FiHelpCircle, FiZap, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';

type TabType = 'profile' | 'appearance' | 'notifications' | 'productivity' | 'help';

const Settings: React.FC = () => {
  const { theme, toggleTheme, accentColor, setAccentColor } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'appearance', label: 'Appearance', icon: FiSettings },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'productivity', label: 'Productivity', icon: FiZap },
    { id: 'help', label: 'Help & Support', icon: FiHelpCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">⚙️ Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Customize your DeadlineHero experience</p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ x: 5 }}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl mb-2 transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
                  
                  {/* Avatar */}
                  <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <button className="btn-primary">Change Avatar</button>
                      <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF. Max 2MB</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.name || ''}
                        className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        defaultValue={user?.email || ''}
                        className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        placeholder="Leave blank to keep current"
                        className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>

                    <button
                      onClick={() => toast.success('Profile updated!')}
                      className="btn-primary"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance</h2>

                  {/* Theme Toggle */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={() => theme !== 'light' && toggleTheme()}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          theme === 'light'
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="text-3xl mb-2">☀️</div>
                        <p className="text-sm font-medium">Light</p>
                      </button>
                      <button
                        onClick={() => theme !== 'dark' && toggleTheme()}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          theme === 'dark'
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="text-3xl mb-2">🌙</div>
                        <p className="text-sm font-medium">Dark</p>
                      </button>
                      <button className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 opacity-50 cursor-not-allowed">
                        <div className="text-3xl mb-2">💻</div>
                        <p className="text-sm font-medium">System</p>
                      </button>
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Accent Color</h3>
                    <div className="flex space-x-3">
                      {[
                        { name: 'blue', class: 'bg-blue-600', hover: 'ring-blue-300' },
                        { name: 'purple', class: 'bg-purple-600', hover: 'ring-purple-300' },
                        { name: 'green', class: 'bg-green-600', hover: 'ring-green-300' },
                        { name: 'red', class: 'bg-red-600', hover: 'ring-red-300' },
                        { name: 'orange', class: 'bg-orange-600', hover: 'ring-orange-300' },
                      ].map((color) => (
                        <button
                          key={color.name}
                          onClick={() => {
                            setAccentColor(color.name as any);
                            toast.success(`Accent color changed to ${color.name}! 🎨`);
                          }}
                          className={`w-12 h-12 ${color.class} rounded-full hover:scale-110 transition-all ${
                            accentColor === color.name 
                              ? `ring-4 ring-offset-2 ${color.hover} dark:ring-offset-gray-700` 
                              : ''
                          }`}
                          title={`${color.name.charAt(0).toUpperCase() + color.name.slice(1)} theme`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                      Selected: <span className="font-semibold capitalize">{accentColor}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>

                  {[
                    { label: 'Email Reminders', desc: 'Get reminded about upcoming deadlines', defaultChecked: true },
                    { label: 'Push Notifications', desc: 'Browser notifications for urgent tasks', defaultChecked: true },
                    { label: 'Weekly Report', desc: 'Receive AI-powered weekly summary', defaultChecked: false },
                    { label: 'Study Group Updates', desc: 'Notifications from your study groups', defaultChecked: true },
                  ].map((setting, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{setting.label}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{setting.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={setting.defaultChecked} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* Productivity Settings */}
              {activeTab === 'productivity' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Productivity</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Daily Task Goal
                      </label>
                      <input
                        type="number"
                        defaultValue={5}
                        min={1}
                        max={20}
                        className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Default Study Session (minutes)
                      </label>
                      <input
                        type="number"
                        defaultValue={25}
                        min={5}
                        max={120}
                        step={5}
                        className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Default Break Time (minutes)
                      </label>
                      <input
                        type="number"
                        defaultValue={5}
                        min={1}
                        max={30}
                        className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>

                    <button
                      onClick={() => toast.success('Productivity settings saved!')}
                      className="btn-primary"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}

              {/* Help & Support */}
              {activeTab === 'help' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Help & Support</h2>

                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">📧 Contact Support</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-400">support@deadlinehero.com</p>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">📚 Documentation</h3>
                      <p className="text-sm text-green-700 dark:text-green-400">Learn how to use all features</p>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">❓ FAQ</h3>
                      <div className="space-y-2 mt-3">
                        {[
                          { q: 'How do I use AI features?', a: 'Navigate to AI Assistant and explore the different tabs' },
                          { q: 'Can I export my data?', a: 'Yes! Use the export feature in Calendar or Tasks' },
                          { q: 'How does Focus Mode work?', a: 'It uses the Pomodoro technique: 25 min work, 5 min break' },
                        ].map((faq, idx) => (
                          <details key={idx} className="group">
                            <summary className="cursor-pointer font-medium text-purple-700 dark:text-purple-400">
                              {faq.q}
                            </summary>
                            <p className="text-sm text-purple-600 dark:text-purple-500 mt-2 pl-4">
                              {faq.a}
                            </p>
                          </details>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;