import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { FiSun, FiMoon } from "react-icons/fi";
import { motion } from "framer-motion";

const Navbar = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const handleAvatarClick = () => {
    navigate('/settings', { state: { tab: 'profile' } });
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        {/* Left Side - Title */}
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={() => navigate('/dashboard')}
            className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity cursor-pointer"
            whileHover={{ scale: 1.05 }}
          >
            DeadlineHero
          </motion.button>
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">
            AI-Powered Student Productivity
          </span>
        </div>

        {/* Right Side - User Info & Theme Toggle */}
        <div className="flex items-center space-x-4">
          {/* User Greeting */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={handleAvatarClick}
              className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-600 to-purple-600 hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer"
              title="Go to Profile Settings"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Welcome, {user?.name || 'User'}!
            </span>
          </div>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <FiMoon size={20} className="text-gray-700 dark:text-gray-300" />
            ) : (
              <FiSun size={20} className="text-gray-700 dark:text-gray-300" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
