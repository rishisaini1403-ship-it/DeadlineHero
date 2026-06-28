import React from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { FiSun, FiMoon } from "react-icons/fi";
import { motion } from "framer-motion";

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        {/* Left Side - Title */}
        <div className="flex items-center space-x-4">
          <motion.h1
            className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
          >
            DeadlineHero
          </motion.h1>
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">
            AI-Powered Student Productivity
          </span>
        </div>

        {/* Right Side - User Info & Theme Toggle */}
        <div className="flex items-center space-x-4">
          {/* User Greeting */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
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
