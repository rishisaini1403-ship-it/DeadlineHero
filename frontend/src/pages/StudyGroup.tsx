import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTaskStore } from '../store/taskStore';
import { studyGroupService, Invitation, ConnectionsData } from '../services/studyGroup.service';
import { calculateCurrentStreak, calculateBestStreak, calculateWeeklyConsistency } from '../utils/stats';
import toast from 'react-hot-toast';

const StudyGroup: React.FC = () => {
  const { user } = useAuth();
  const { tasks, fetchTasks } = useTaskStore();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
  const [sentInvites, setSentInvites] = useState<Invitation[]>([]);
  const [connections, setConnections] = useState<ConnectionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invite' | 'notifications'>('dashboard');

  const loadData = useCallback(async () => {
    try {
      const [invites, sent, conn] = await Promise.all([
        studyGroupService.getMyInvitations(),
        studyGroupService.getSentInvitations(),
        studyGroupService.getConnections(),
      ]);
      setPendingInvites(invites);
      setSentInvites(sent);
      setConnections(conn);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); fetchTasks(); }, [loadData, fetchTasks]);

  const localStreak = useMemo(() => calculateCurrentStreak(tasks), [tasks]);
  const localBestStreak = useMemo(() => calculateBestStreak(tasks), [tasks]);
  const localConsistency = useMemo(() => calculateWeeklyConsistency(tasks), [tasks]);

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter an email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { toast.error('Please enter a valid email address'); return; }
    setSending(true);
    try {
      const lookup = await studyGroupService.lookupUser(email);
      if (!lookup.exists) {
        toast.error('No DeadlineHero account found with this Gmail address.');
        setSending(false);
        return;
      }
      await studyGroupService.sendInvitation(email);
      toast.success(`Invitation sent to ${email}!`);
      setEmail('');
      const sent = await studyGroupService.getSentInvitations();
      setSentInvites(sent);
    } catch (e: any) {
      toast.error(e.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleRespond = async (id: string, action: 'accept' | 'reject') => {
    try {
      await studyGroupService.respondToInvitation(id, action);
      toast.success(action === 'accept' ? 'Invitation accepted! You are now connected.' : 'Invitation rejected.');
      const [invites, conn] = await Promise.all([
        studyGroupService.getMyInvitations(),
        studyGroupService.getConnections(),
      ]);
      setPendingInvites(invites);
      setConnections(conn);
    } catch (e: any) {
      toast.error(e.message || 'Failed to respond');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const members = connections?.members || [];
  const meApi = members.find(m => m.userId === user?.id);
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const overdueTasks = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const completedThisWeek = tasks.filter(t => t.status === 'completed' && new Date(t.updatedAt || t.createdAt) >= weekAgo).length;
  const createdThisWeek = tasks.filter(t => new Date(t.createdAt) >= weekAgo).length;
  const productivityScore = createdThisWeek > 0 ? Math.round((completedThisWeek / createdThisWeek) * 100) : 0;

  const me = meApi ? {
    ...meApi,
    streak: localStreak,
    bestStreak: localBestStreak,
    consistencyDays: localConsistency,
    completionRate,
    productivityScore,
    totalTasks,
    completedTasks,
    overdueTasks,
  } : undefined;

  const others = members.filter(m => m.userId !== user?.id);
  const highlights = connections?.highlights;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">👥 Study Group</h1>
            <p className="text-gray-600">Collaborate and compare productivity with your study buddies</p>
          </div>
          {pendingInvites.length > 0 && (
            <button onClick={() => setActiveTab('notifications')} className="relative px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              🔔 Notifications
              <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold">{pendingInvites.length}</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {(['dashboard', 'invite', 'notifications'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
              {tab === 'dashboard' ? '📊 Dashboard' : tab === 'invite' ? '✉️ Invite' : `🔔 Notifications${pendingInvites.length > 0 ? ` (${pendingInvites.length})` : ''}`}
            </button>
          ))}
        </div>

        {/* Invite Tab */}
        {activeTab === 'invite' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">📧 Invite Friends</h2>
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Friend's Gmail Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="friend@gmail.com"
                  />
                </div>
                <button type="submit" disabled={sending} className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {sending ? 'Sending...' : 'Send Invitation'}
                </button>
              </form>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold mb-2">How it works:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  <li>Enter your friend's Gmail address</li>
                  <li>If they have an account, they receive an invitation</li>
                  <li>Once accepted, compare productivity stats</li>
                  <li>Track who's the most productive member</li>
                </ul>
              </div>
            </div>

            {/* Sent Invitations */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">📤 Sent Invitations</h2>
              {sentInvites.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No invitations sent yet</p>
                  <p className="text-sm mt-1">Invite friends to get started!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {sentInvites.map(inv => (
                    <div key={inv._id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <span>✉️</span>
                        <span className="text-gray-700">{inv.receiverEmail}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        inv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        inv.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">🔔 Notifications</h2>
            {pendingInvites.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">🎉</p>
                <p>No pending invitations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInvites.map(inv => (
                  <div key={inv._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          You received a Study Group invitation from <span className="text-blue-600 font-bold">{inv.senderId?.name || 'Unknown'}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">{inv.senderId?.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRespond(inv._id, 'accept')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">Accept</button>
                        <button onClick={() => handleRespond(inv._id, 'reject')} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {others.length > 0 && (
              <div className="mt-8">
                <h3 className="font-bold text-gray-700 mb-3">✅ Connected Members</h3>
                <div className="flex flex-wrap gap-2">
                  {others.map(m => (
                    <span key={m.userId} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <span>👤</span> {m.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Highlights */}
            {highlights && others.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg shadow-md p-4 text-white">
                  <p className="text-xs opacity-90 mb-1">🏆 Most Productive</p>
                  <p className="text-lg font-bold truncate">{highlights.mostProductiveMember.name}</p>
                  <p className="text-xs opacity-80">{highlights.mostProductiveMember.value} tasks completed</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md p-4 text-white">
                  <p className="text-xs opacity-90 mb-1">🔥 Best Streak</p>
                  <p className="text-lg font-bold truncate">{highlights.bestStreakHolder.name}</p>
                  <p className="text-xs opacity-80">{highlights.bestStreakHolder.value} day streak</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-md p-4 text-white">
                  <p className="text-xs opacity-90 mb-1">📊 Highest Rate</p>
                  <p className="text-lg font-bold truncate">{highlights.highestCompletionRate.name}</p>
                  <p className="text-xs opacity-80">{highlights.highestCompletionRate.value}% completion</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md p-4 text-white">
                  <p className="text-xs opacity-90 mb-1">⭐ Weekly Winner</p>
                  <p className="text-lg font-bold truncate">{highlights.weeklyWinner.name}</p>
                  <p className="text-xs opacity-80">{highlights.weeklyWinner.value}% this week</p>
                </div>
              </div>
            )}

            {/* Members */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Stats */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <h2 className="text-lg font-bold mb-4">👤 You ({me?.name})</h2>
                {me && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{me.completedTasks}</p>
                      <p className="text-xs text-gray-500">Tasks Completed</p>
                    </div>
                    <div className="bg-purple-50 rounded p-3 text-center">
                      <p className="text-2xl font-bold text-purple-600">{me.streak}d</p>
                      <p className="text-xs text-gray-500">Current Streak</p>
                    </div>
                    <div className="bg-green-50 rounded p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{me.completionRate}%</p>
                      <p className="text-xs text-gray-500">Completion Rate</p>
                    </div>
                    <div className="bg-orange-50 rounded p-3 text-center">
                      <p className="text-2xl font-bold text-orange-600">{me.consistencyDays}/7</p>
                      <p className="text-xs text-gray-500">Consistency</p>
                    </div>
                    <div className="bg-teal-50 rounded p-3 text-center">
                      <p className="text-2xl font-bold text-teal-600">{me.productivityScore}%</p>
                      <p className="text-xs text-gray-500">Productivity Score</p>
                    </div>
                    <div className="bg-red-50 rounded p-3 text-center">
                      <p className="text-2xl font-bold text-red-600">{me.overdueTasks}</p>
                      <p className="text-xs text-gray-500">Overdue Tasks</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Connected Members */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <h2 className="text-lg font-bold mb-4">👥 Study Group Members ({others.length})</h2>
                {others.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No connected members yet</p>
                    <p className="text-sm mt-1">Invite friends and accept their invitations!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[360px] overflow-y-auto">
                    {others.map(m => (
                      <div key={m.userId} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-gray-900">{m.name}</h3>
                          <span className="text-xs text-gray-500">{m.email}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <p className="font-bold text-gray-800">{m.completedTasks}</p>
                            <p className="text-gray-500">Done</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{m.streak}d</p>
                            <p className="text-gray-500">Streak</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{m.completionRate}%</p>
                            <p className="text-gray-500">Rate</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{m.productivityScore}%</p>
                            <p className="text-gray-500">Weekly</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{m.consistencyDays}/7</p>
                            <p className="text-gray-500">Consist.</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{m.overdueTasks}</p>
                            <p className="text-gray-500">Overdue</p>
                          </div>
                        </div>
                        {/* Comparison vs Me */}
                        {me && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                              <span className="font-medium">vs you:</span>
                              {m.completedTasks > me.completedTasks && <span className="text-green-600">+{m.completedTasks - me.completedTasks} tasks</span>}
                              {m.completedTasks < me.completedTasks && <span className="text-red-600">{m.completedTasks - me.completedTasks} tasks</span>}
                              {m.completedTasks === me.completedTasks && <span className="text-gray-400">same tasks</span>}
                              <span className="mx-1">·</span>
                              {m.streak > me.streak && <span className="text-green-600">+{m.streak - me.streak}d streak</span>}
                              {m.streak < me.streak && <span className="text-red-600">{m.streak - me.streak}d streak</span>}
                              {m.streak === me.streak && <span className="text-gray-400">same streak</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Leaderboard Section */}
            {members.length > 1 && (
              <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">🏆 Productivity Leaderboard</h2>
                <div className="space-y-3">
                  {[...members].sort((a, b) => b.productivityScore - a.productivityScore).map((m, idx) => {
                    const rankColors = ['border-yellow-400 bg-yellow-50', 'border-gray-300 bg-gray-50', 'border-orange-300 bg-orange-50', 'border-gray-200'];
                    const rankBg = ['bg-yellow-500', 'bg-gray-500', 'bg-orange-500', 'bg-blue-500'];
                    return (
                      <div key={m.userId} className={`border-2 rounded-lg p-4 ${rankColors[idx] || 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${rankBg[idx] || 'bg-blue-500'}`}>
                              #{idx + 1}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{m.name} {m.userId === user?.id && '⭐'}</p>
                              <p className="text-xs text-gray-500">{m.completedTasks} tasks completed · 🔥 {m.streak}d streak</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-blue-600">{m.productivityScore}%</p>
                            <p className="text-xs text-gray-500">Weekly score</p>
                          </div>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${m.productivityScore}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {others.length === 0 && (
              <div className="mt-6 bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-5xl mb-4">👥</p>
                <h2 className="text-xl font-bold text-gray-700 mb-2">No Study Group Members Yet</h2>
                <p className="text-gray-500 mb-4">Invite friends to join your study group and start comparing productivity!</p>
                <button onClick={() => setActiveTab('invite')} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Invite Friends
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudyGroup;
