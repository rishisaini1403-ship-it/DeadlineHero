import React from "react";
import { useNavigate } from "react-router-dom";
import { NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { FiSun, FiMoon, FiLogOut } from "react-icons/fi";
import AIChatWidget from "./AIChatWidget";
import Navbar from "./Navbar";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully! 👋');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-3 rounded-lg transition ${
      isActive
        ? "text-white"
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
    }`;

  const activeLinkClass = {
    background: `linear-gradient(135deg, var(--accent-color), var(--accent-color-dark))`,
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg p-5">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            DeadlineHero
          </h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
          </button>
        </div>

        <nav className="space-y-2">
          <NavLink to="/dashboard" className={linkClass} style={({ isActive }) => isActive ? activeLinkClass : {}}>
            📊 Dashboard
          </NavLink>

          <NavLink to="/tasks" className={linkClass} style={({ isActive }) => isActive ? activeLinkClass : {}}>
            ✅ Tasks
          </NavLink>

          <NavLink to="/calendar" className={linkClass} style={({ isActive }) => isActive ? activeLinkClass : {}}>
            📅 Calendar
          </NavLink>

          <NavLink to="/analytics" className={linkClass} style={({ isActive }) => isActive ? activeLinkClass : {}}>
            📈 Analytics
          </NavLink>

          <div className="my-3 border-t border-gray-200 dark:border-gray-700"></div>
          <p className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">AI Features</p>

          <NavLink to="/ai-assistant" className={linkClass} style={({ isActive }) => isActive ? activeLinkClass : {}}>
            🤖 AI Assistant
          </NavLink>

          <NavLink to="/focus-mode" className={linkClass} style={({ isActive }) => isActive ? activeLinkClass : {}}>
            🎯 Focus Mode
          </NavLink>

          <NavLink to="/study-group" className={linkClass} style={({ isActive }) => isActive ? activeLinkClass : {}}>
            👥 Study Group
          </NavLink>

          <div className="my-3 border-t border-gray-200 dark:border-gray-700"></div>

          <NavLink to="/settings" className={linkClass} style={({ isActive }) => isActive ? activeLinkClass : {}}>
            ⚙️ Settings
          </NavLink>

          {/* Logout Button */}
          <div className="my-3 border-t border-gray-200 dark:border-gray-700"></div>
          
          <motion.button
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border-2 border-red-200 dark:border-red-800"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </motion.button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <Navbar />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  );
};

export default Layout;