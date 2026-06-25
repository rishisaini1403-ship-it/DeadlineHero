import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

interface Stats {
  totalTasks: number;
  completed: number;
  pending: number;
  streak: number;
}

const Dashboard: React.FC = () => {
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Tasks */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">
              Total Tasks
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {stats.totalTasks}
            </p>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">
              Completed
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {stats.completed}
            </p>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">
              Pending
            </h3>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.pending}
            </p>
          </div>

          {/* Streak */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">
              Streak
            </h3>
            <p className="text-3xl font-bold text-orange-600">
              🔥 {stats.streak}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;