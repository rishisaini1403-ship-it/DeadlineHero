import React, { useState, useEffect } from 'react';
import api from '../services/api';
import aiService from '../services/ai.service';
import { AnalyticsData, WeeklyProgress } from '../types/task.types';
import toast from 'react-hot-toast';

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [heatmapDays, setHeatmapDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
    fetchWeeklyProgress();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics');
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyProgress = async () => {
    try {
      const response = await api.get('/analytics/weekly-progress');
      setWeeklyProgress(response.data.data);
    } catch (error) {
      console.error('Failed to fetch weekly progress:', error);
    }
  };

  const handleGenerateWeeklyReport = async () => {
    setLoading(true);
    try {
      const report = await aiService.generateWeeklyReport();
      setWeeklyReport(report);
      toast.success('Weekly report generated!');
    } catch (error) {
      toast.error('Failed to generate weekly report');
    } finally {
      setLoading(false);
    }
  };

  const getHeatmapColor = (score: number) => {
    if (score === 0) return 'bg-gray-100';
    if (score < 25) return 'bg-red-200';
    if (score < 50) return 'bg-yellow-200';
    if (score < 75) return 'bg-green-200';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">📈 Analytics</h1>
          <button
            onClick={handleGenerateWeeklyReport}
            className="btn-primary"
          >
            📊 Generate AI Weekly Report
          </button>
        </div>

        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Tasks</p>
                  <p className="text-3xl font-bold text-blue-600">{analytics.overview.totalTasks}</p>
                </div>
                <div className="text-4xl">📝</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{analytics.overview.completedTasks}</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                  <p className="text-3xl font-bold text-purple-600">{analytics.overview.completionRate}%</p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Time</p>
                  <p className="text-3xl font-bold text-orange-600">{analytics.overview.avgCompletionTime}h</p>
                </div>
                <div className="text-4xl">⏱️</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📅 Weekly Progress</h2>
          <div className="space-y-3">
            {weeklyProgress.map((day, idx) => {
              const maxTasks = Math.max(...weeklyProgress.map(d => Math.max(d.completed, d.created)));
              const completedWidth = maxTasks > 0 ? (day.completed / maxTasks) * 100 : 0;
              const createdWidth = maxTasks > 0 ? (day.created / maxTasks) * 100 : 0;

              return (
                <div key={idx} className="flex items-center space-x-4">
                  <div className="w-24 text-sm font-medium text-gray-700">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600 w-20">Created:</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${createdWidth}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-600 ml-2">{day.created}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600 w-20">Completed:</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${completedWidth}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-600 ml-2">{day.completed}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {analytics && analytics.tasksByPriority.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">🎯 Tasks by Priority</h2>
            <div className="space-y-3">
              {analytics.tasksByPriority.map((item, idx) => {
                const total = analytics.tasksByPriority.reduce((sum, p) => sum + p.count, 0);
                const percentage = total > 0 ? (item.count / total) * 100 : 0;
                const getPriorityColor = (priority: string) => {
                  switch (priority) {
                    case 'urgent': return 'bg-red-500';
                    case 'high': return 'bg-orange-500';
                    case 'medium': return 'bg-yellow-500';
                    case 'low': return 'bg-green-500';
                    default: return 'bg-gray-500';
                  }
                };

                return (
                  <div key={idx} className="flex items-center space-x-4">
                    <div className="w-24 font-medium capitalize">{item.priority}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-6">
                      <div
                        className={`${getPriorityColor(item.priority)} h-6 rounded-full transition-all flex items-center justify-end pr-2`}
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      >
                        <span className="text-xs text-white font-bold">{item.count}</span>
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm text-gray-600">{percentage.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">🔥 Productivity Heatmap</h2>
            <div className="flex gap-2">
              {[30, 60, 90].map(days => (
                <button
                  key={days}
                  onClick={() => setHeatmapDays(days)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${heatmapDays === days ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {days} days
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 md:grid-cols-10 lg:grid-cols-15 gap-1">
            {Array.from({ length: heatmapDays }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (heatmapDays - 1 - i));
              const score = Math.random() * 100;
              
              return (
                <div
                  key={i}
                  className={`aspect-square ${getHeatmapColor(score)} rounded-sm cursor-pointer transition-transform hover:scale-110`}
                  title={`${date.toLocaleDateString()}: ${score.toFixed(0)}% productive`}
                ></div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-600">Less productive</span>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-gray-100 rounded-sm"></div>
              <div className="w-4 h-4 bg-red-200 rounded-sm"></div>
              <div className="w-4 h-4 bg-yellow-200 rounded-sm"></div>
              <div className="w-4 h-4 bg-green-200 rounded-sm"></div>
              <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
            </div>
            <span className="text-gray-600">More productive</span>
          </div>
        </div>

        {weeklyReport && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6 mb-6 border-2 border-blue-200">
            <h2 className="text-2xl font-bold mb-4">🤖 AI Weekly Report</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">{weeklyReport.completedTasks}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-3xl font-bold text-red-600">{weeklyReport.missedTasks}</p>
                <p className="text-sm text-gray-600">Missed</p>
              </div>
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-3xl font-bold text-orange-600">🔥 {weeklyReport.streak}</p>
                <p className="text-sm text-gray-600">Streak</p>
              </div>
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-600">+{weeklyReport.productivityChange}%</p>
                <p className="text-sm text-gray-600">Productivity</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg">
                <h3 className="font-bold mb-2">🏆 Achievements</h3>
                <ul className="space-y-1">
                  {weeklyReport.achievements.map((achievement: string, idx: number) => (
                    <li key={idx} className="text-gray-700">{achievement}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h3 className="font-bold mb-2">💡 AI Insights</h3>
                <p className="text-gray-700">{weeklyReport.insights}</p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h3 className="font-bold mb-2">🎯 Next Week Focus</h3>
                <p className="text-gray-700">{weeklyReport.nextWeekFocus}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
