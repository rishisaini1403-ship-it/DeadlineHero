import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTaskStore } from "../store/taskStore";
import { calculateCurrentStreak } from "../utils/stats";
import toast from "react-hot-toast";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tasks, fetchTasks } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const totalTasks = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = tasks.filter((t) => t.status !== "completed").length;
  const streak = useMemo(() => calculateCurrentStreak(tasks), [tasks]);
  const pct = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-2">Welcome back, {user?.name || "Hero"}! 👋</h1>
              <p className="text-xl text-gray-600">Let's conquer your deadlines today! 🚀</p>
            </div>
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} style={{ willChange: "transform" }} className="text-8xl">🤖</motion.div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} whileHover={{ scale: 1.05, rotate: 2 }} onClick={() => navigate("/tasks")} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200 relative overflow-hidden cursor-pointer hover:border-blue-400 transition-all">
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} style={{ willChange: "transform" }} className="absolute -top-4 -right-4 text-6xl opacity-20">📝</motion.div>
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Total Tasks</h3>
              <p className="text-5xl font-bold text-blue-600">{totalTasks}</p>
              <p className="text-sm text-gray-500 mt-2">Click to view all →</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} whileHover={{ scale: 1.05, rotate: -2 }} onClick={() => navigate("/tasks")} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200 relative overflow-hidden cursor-pointer hover:border-green-400 transition-all">
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ willChange: "transform" }} className="absolute -top-4 -right-4 text-6xl opacity-20">✅</motion.div>
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Completed</h3>
              <p className="text-5xl font-bold text-green-600">{completed}</p>
              <p className="text-sm text-gray-500 mt-2">View completed tasks →</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} whileHover={{ scale: 1.05, rotate: 2 }} onClick={() => navigate("/tasks")} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-yellow-200 relative overflow-hidden cursor-pointer hover:border-yellow-400 transition-all">
            <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ willChange: "transform" }} className="absolute -top-4 -right-4 text-6xl opacity-20">⏳</motion.div>
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Pending</h3>
              <p className="text-5xl font-bold text-yellow-600">{pending}</p>
              <p className="text-sm text-gray-500 mt-2">View pending tasks →</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} whileHover={{ scale: 1.05, rotate: -2 }} onClick={() => navigate("/analytics")} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200 relative overflow-hidden cursor-pointer hover:border-orange-400 transition-all">
            <motion.div animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} style={{ willChange: "transform" }} className="absolute -top-4 -right-4 text-6xl opacity-20">🔥</motion.div>
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Streak</h3>
              <p className="text-5xl font-bold text-orange-600">{streak}</p>
              <p className="text-sm text-gray-500 mt-2">View analytics →</p>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} onClick={() => { fetchTasks(); toast.success("Dashboard refreshed! 🔄"); }} className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all">
          <motion.div
            animate={{ y: [0, -7, 0], rotate: [0, 6, -6, 0], opacity: [0.15, 0.3, 0.15] }}
            transition={{
              y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 },
              rotate: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
              opacity: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
            }}
            style={{ willChange: "transform" }}
            className="absolute top-4 left-10 text-4xl"
          >⭐</motion.div>
          <motion.div
            animate={{ y: [0, 5, 0], x: [0, 3, 0, -3, 0] }}
            transition={{
              y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
              x: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.3 },
            }}
            style={{ willChange: "transform" }}
            className="absolute bottom-6 right-24 text-4xl"
          >🎯</motion.div>
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, 4, -4, 0], opacity: [0.12, 0.25, 0.12] }}
            transition={{
              y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
              rotate: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 },
              opacity: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
            }}
            style={{ willChange: "transform" }}
            className="absolute top-12 right-12 text-6xl"
          >⚡</motion.div>
          <motion.div
            animate={{ y: [0, -5, 0], rotate: [0, 3, -3, 0] }}
            transition={{
              y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
              rotate: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 },
            }}
            style={{ willChange: "transform" }}
            className="absolute bottom-8 left-16 text-3xl"
          >🚀</motion.div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">
              {completed === 0 ? "Ready to start your productivity journey? 🚀" : completed < 5 ? "Great start! Keep the momentum going! 🔥" : completed < 10 ? "You're on fire! Amazing progress! ⚡" : "Incredible! You're a productivity machine! 🤖"}
            </h2>
            <p className="text-lg opacity-90">{pending > 0 ? `You have ${pending} tasks waiting. Let's crush them one by one!` : "All tasks completed! You're a legend! 🎉"}</p>
            {totalTasks > 0 && (
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-6 relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-green-400 relative"
                    style={{ willChange: "width" }}
                  >
                    <div className="absolute left-full top-1/2" style={{ transform: "translate(-50%, -50%) scaleX(-1)" }}>
                      <motion.span
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="inline-block text-sm leading-none"
                        style={{ willChange: "transform" }}
                      >🏃</motion.span>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.button whileHover={{ scale: 1.05, rotate: -2 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/tasks")} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200 hover:border-purple-400 transition-all text-left">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Add New Task</h3>
            <p className="text-sm text-gray-600">Create a task to get started</p>
          </motion.button>
          <motion.button whileHover={{ scale: 1.05, rotate: 2 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/focus-mode")} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200 hover:border-blue-400 transition-all text-left">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Focus Mode</h3>
            <p className="text-sm text-gray-600">Start a Pomodoro session</p>
          </motion.button>
          <motion.button whileHover={{ scale: 1.05, rotate: -2 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/ai-assistant")} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200 hover:border-green-400 transition-all text-left">
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
