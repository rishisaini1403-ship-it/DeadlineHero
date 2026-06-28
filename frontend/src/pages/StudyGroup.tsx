import React, { useState, useEffect } from 'react';
import { taskService } from '../services/task.service';
import { Task } from '../types/task.types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface GroupMember {
  name: string;
  progress: number;
  tasksCompleted: number;
  streak: number;
}

const StudyGroup: React.FC = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userTasks = await taskService.getTasks();
      setTasks(userTasks);
      
      // Calculate real user stats
      const completedTasks = userTasks.filter(t => t.status === 'completed');
      const totalTasks = userTasks.length;
      const progress = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
      
      // Mock group members (in real app, this would come from backend)
      setMembers([
        { 
          name: user?.name || 'You', 
          progress, 
          tasksCompleted: completedTasks.length, 
          streak: 0 // Would come from backend
        },
      ]);
    } catch (error) {
      toast.error('Failed to load study group data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter an email');
      return;
    }
    toast.success(`Invitation sent to ${email}!`);
    setEmail('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const sortedMembers = [...members].sort((a, b) => b.progress - a.progress);
  const totalTasksCompleted = members.reduce((sum, m) => sum + m.tasksCompleted, 0);
  const bestStreak = Math.max(...members.map(m => m.streak), 0);
  const avgProgress = members.length > 0 
    ? Math.round(members.reduce((sum, m) => sum + m.progress, 0) / members.length) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">👥 Study Group</h1>
        <p className="text-gray-600 mb-8">Share deadlines and track progress with your study buddies</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invite Members */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">📧 Invite Friends</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Friend's Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="friend@example.com"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Send Invitation
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold mb-2">How it works:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Invite friends to your study group</li>
                <li>Share deadline progress (anonymized)</li>
                <li>Motivate each other to stay on track</li>
                <li>Compete friendly to boost productivity</li>
              </ul>
            </div>
          </div>

          {/* Group Leaderboard */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">🏆 Progress Leaderboard</h2>
            {members.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No members in your study group yet</p>
                <p className="text-sm text-gray-400 mt-2">Invite friends to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedMembers.map((member, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${
                    idx === 0
                      ? 'border-yellow-400 bg-yellow-50'
                      : idx === 1
                      ? 'border-gray-400 bg-gray-50'
                      : idx === 2
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          idx === 0
                            ? 'bg-yellow-500'
                            : idx === 1
                            ? 'bg-gray-500'
                            : idx === 2
                            ? 'bg-orange-500'
                            : 'bg-blue-500'
                        }`}
                      >
                        #{idx + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {member.name} {member.name === 'You' && '⭐'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {member.tasksCompleted} tasks completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">
                        {member.progress}%
                      </div>
                      <div className="text-sm text-gray-600">
                        🔥 {member.streak} day streak
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          idx === 0
                            ? 'bg-yellow-500'
                            : idx === 1
                            ? 'bg-gray-500'
                            : idx === 2
                            ? 'bg-orange-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${member.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Shared Deadlines */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">📅 Your Active Deadlines</h2>
          {tasks.filter(t => t.status !== 'completed' && t.status !== 'archived').length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No active deadlines</p>
              <p className="text-sm text-gray-400 mt-2">Create tasks to track your progress!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4">Task</th>
                    <th className="text-left py-3 px-4">Due Date</th>
                    <th className="text-left py-3 px-4">Priority</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.filter(t => t.status !== 'completed' && t.status !== 'archived').map((task) => {
                    const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const dueText = daysUntilDue < 0 ? 'Overdue' : daysUntilDue === 0 ? 'Today' : daysUntilDue === 1 ? 'Tomorrow' : `In ${daysUntilDue} days`;
                    
                    return (
                      <tr key={task._id} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium">{task.title}</td>
                        <td className="py-3 px-4">{dueText}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Motivational Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Total Tasks</h3>
            <p className="text-4xl font-bold">{totalTasksCompleted}</p>
            <p className="text-sm opacity-90">Tasks completed</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Best Streak</h3>
            <p className="text-4xl font-bold">🔥 {bestStreak}</p>
            <p className="text-sm opacity-90">Current streak</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-md p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Avg Progress</h3>
            <p className="text-4xl font-bold">{avgProgress}%</p>
            <p className="text-sm opacity-90">Completion rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyGroup;
