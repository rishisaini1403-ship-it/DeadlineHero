import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

interface Stats {
  totalTasks: number;
  completed: number;
  pending: number;
  streak: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    completed: 0,
    pending: 0,
    streak: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get("/tasks");

      console.log("TASK RESPONSE:", response.data);

      const tasks = response.data.data || [];

      const completed = tasks.filter(
        (task: any) =>
          task.completed === true ||
          task.status === "completed"
      ).length;

      setStats({
        totalTasks: tasks.length,
        completed,
        pending: tasks.length - completed,
        streak: user?.streak || 0,
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-6xl"
        >
          🤖
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Animated Robot */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name || 'Hero'}! 👋
              </h1>
              <p className="text-xl text-gray-600">
                Let's conquer your deadlines today! 🚀
              </p>
            </div>
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-8xl"
            >
              🤖
            </motion.div>
          </div>
        </motion.div>

        {/* Animated Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Tasks - Clickable */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            onClick={() => navigate('/tasks')}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200 relative overflow-hidden cursor-pointer hover:border-blue-400 transition-all"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-4 -right-4 text-6xl opacity-20"
            >
              📝
            </motion.div>
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">
                Total Tasks
              </h3>
              <p className="text-5xl font-bold text-blue-600">
                {stats.totalTasks}
              </p>
              <p className="text-sm text-gray-500 mt-2">Click to view all →</p>
            </div>
          </motion.div>

          {/* Completed - Clickable */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, rotate: -2 }}
            onClick={() => navigate('/tasks?status=completed')}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200 relative overflow-hidden cursor-pointer hover:border-green-400 transition-all"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -top-4 -right-4 text-6xl opacity-20"
            >
              ✅
            </motion.div>
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">
                Completed
              </h3>
              <p className="text-5xl font-bold text-green-600">
                {stats.completed}
              </p>
              <p className="text-sm text-gray-500 mt-2">View completed tasks →</p>
            </div>
          </motion.div>

          {/* Pending - Clickable */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            onClick={() => navigate('/tasks?status=pending')}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-yellow-200 relative overflow-hidden cursor-pointer hover:border-yellow-400 transition-all"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-4 -right-4 text-6xl opacity-20"
            >
              ⏳
            </motion.div>
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">
                Pending
              </h3>
              <p className="text-5xl font-bold text-yellow-600">
                {stats.pending}
              </p>
              <p className="text-sm text-gray-500 mt-2">View pending tasks →</p>
            </div>
          </motion.div>

          {/* Streak - Clickable */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, rotate: -2 }}
            onClick={() => navigate('/analytics')}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200 relative overflow-hidden cursor-pointer hover:border-orange-400 transition-all"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, 15, -15, 0]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -top-4 -right-4 text-6xl opacity-20"
            >
              🔥
            </motion.div>
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">
                Streak
              </h3>
              <p className="text-5xl font-bold text-orange-600">
                {stats.streak}
              </p>
              <p className="text-sm text-gray-500 mt-2">View analytics →</p>
            </div>
          </motion.div>
        </div>

        {/* Motivational Section with Animations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => {
            fetchDashboard();
            toast.success('Dashboard refreshed! 🔄');
          }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all"
        >
          {/* Floating animated elements */}
          <motion.div
            animate={{ x: [0, 100, 0], y: [0, -20, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-4 left-10 text-4xl opacity-30"
          >
            ⭐
          </motion.div>
          <motion.div
            animate={{ x: [0, -80, 0], y: [0, 20, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute bottom-4 right-20 text-4xl opacity-30"
          >
            🎯
          </motion.div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute top-10 right-10 text-6xl opacity-20"
          >
            ⚡
          </motion.div>

          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">
              {stats.completed === 0 
                ? "Ready to start your productivity journey? 🚀"
                : stats.completed < 5 
                ? "Great start! Keep the momentum going! 🔥"
                : stats.completed < 10
                ? "You're on fire! Amazing progress! ⚡"
                : "Incredible! You're a productivity machine! 🤖"}
            </h2>
            <p className="text-lg opacity-90">
              {stats.pending > 0 
                ? `You have ${stats.pending} tasks waiting. Let's crush them one by one!`
                : "All tasks completed! You're a legend! 🎉"}
            </p>
            
            {/* Progress Bar */}
            {stats.totalTasks > 0 && (
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{Math.round((stats.completed / stats.totalTasks) * 100)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.completed / stats.totalTasks) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="bg-gradient-to-r from-yellow-400 to-green-400 h-4 rounded-full relative"
                  >
                    <motion.div
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 text-xl"
                    >
                      🏃
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions with Animated Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.button
            whileHover={{ scale: 1.05, rotate: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/tasks')}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200 hover:border-purple-400 transition-all text-left"
          >
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Add New Task</h3>
            <p className="text-sm text-gray-600">Create a task to get started</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/focus-mode')}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200 hover:border-blue-400 transition-all text-left"
          >
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Focus Mode</h3>
            <p className="text-sm text-gray-600">Start a Pomodoro session</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, rotate: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/ai-assistant')}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200 hover:border-green-400 transition-all text-left"
          >
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI Assistant</h3>
            <p className="text-sm text-gray-600">Get smart recommendations</p>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;