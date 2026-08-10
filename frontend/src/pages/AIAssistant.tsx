import React, { useEffect, useState } from 'react';
import aiService, { RiskPrediction, ScheduleItem, TaskBreakdown, NextAction, BurnoutReport, EmergencyPlan } from '../services/ai.service';
import { useTaskStore } from '../store/taskStore';
import toast from 'react-hot-toast';

const AIAssistant: React.FC = () => {
  const { tasks, fetchTasks } = useTaskStore();
  const [activeTab, setActiveTab] = useState<'risk' | 'planner' | 'breakdown' | 'next' | 'burnout' | 'emergency'>('risk');
  const [loading, setLoading] = useState(false);

  const [riskResult, setRiskResult] = useState<RiskPrediction | null>(null);
  const [dailyPlan, setDailyPlan] = useState<ScheduleItem[]>([]);
  const [breakdownResult, setBreakdownResult] = useState<TaskBreakdown | null>(null);
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const [burnoutReport, setBurnoutReport] = useState<BurnoutReport | null>(null);
  const [emergencyPlan, setEmergencyPlan] = useState<EmergencyPlan | null>(null);

  const [taskId, setTaskId] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const openTasks = tasks.filter(t => t.status !== 'completed');

  const handleRiskPrediction = async () => {
    if (!taskId) { toast.error('Please select a task'); return; }
    setLoading(true);
    try {
      const result = await aiService.calculateRisk(taskId);
      setRiskResult(result);
      toast.success('Risk prediction calculated!');
    } catch (error) { toast.error('Failed to calculate risk'); }
    finally { setLoading(false); }
  };

  const handleDailyPlan = async () => {
    setLoading(true);
    try {
      const plan = await aiService.generateDailyPlan(8);
      setDailyPlan(plan);
      toast.success('Daily plan generated!');
    } catch (error) { toast.error('Failed to generate daily plan'); }
    finally { setLoading(false); }
  };

  const handleBreakdown = async () => {
    if (!taskId) { toast.error('Please select a task'); return; }
    setLoading(true);
    try {
      const result = await aiService.breakdownTask(taskId);
      setBreakdownResult(result.breakdown);
      toast.success('Task broken down!');
    } catch (error) { toast.error('Failed to breakdown task'); }
    finally { setLoading(false); }
  };

  const handleNextAction = async () => {
    setLoading(true);
    try {
      const action = await aiService.getNextAction();
      setNextAction(action);
      toast.success('Next action recommended!');
    } catch (error) { toast.error('Failed to get next action'); }
    finally { setLoading(false); }
  };

  const handleBurnoutCheck = async () => {
    setLoading(true);
    try {
      const report = await aiService.checkBurnout();
      setBurnoutReport(report);
      toast.success('Burnout analysis complete!');
    } catch (error) { toast.error('Failed to check burnout'); }
    finally { setLoading(false); }
  };

  const handleEmergencyMode = async () => {
    setLoading(true);
    try {
      const plan = await aiService.activateEmergencyMode();
      setEmergencyPlan(plan);
      toast.success('Emergency mode activated!');
    } catch (error) { toast.error('Failed to activate emergency mode'); }
    finally { setLoading(false); }
  };

  const tabs = [
    { id: 'risk', label: 'Risk Predictor', icon: '⚠️' },
    { id: 'planner', label: 'Daily Planner', icon: '📅' },
    { id: 'breakdown', label: 'Task Breakdown', icon: '🔨' },
    { id: 'next', label: 'Next Action', icon: '➡️' },
    { id: 'burnout', label: 'Burnout Check', icon: '😰' },
    { id: 'emergency', label: 'Emergency Mode', icon: '🚨' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🤖 AI Assistant</h1>
        <p className="text-gray-600 mb-8">Powered by AI to help you manage deadlines smarter</p>

        <div className="bg-white rounded-lg shadow-md p-2 mb-6 overflow-x-auto">
          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'risk' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">⚠️ Deadline Risk Predictor</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task</label>
                  <select value={taskId} onChange={(e) => setTaskId(e.target.value)} className="input-field">
                    <option value="">Select a Task</option>
                    {openTasks.map((task) => <option key={task._id} value={task._id}>{task.title}</option>)}
                  </select>
                </div>
                <button onClick={handleRiskPrediction} disabled={loading} className="btn-primary">{loading ? 'Calculating...' : 'Calculate Risk'}</button>
                {riskResult && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">Risk Score</h3>
                      <span className={`px-4 py-2 rounded-full text-white font-bold ${riskResult.riskLevel === 'critical' ? 'bg-red-600' : riskResult.riskLevel === 'high' ? 'bg-orange-600' : riskResult.riskLevel === 'medium' ? 'bg-yellow-600' : 'bg-green-600'}`}>{riskResult.riskScore}% - {riskResult.riskLevel.toUpperCase()}</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 mb-4">{riskResult.factors.map((f, i) => <li key={i} className="text-gray-700">{f}</li>)}</ul>
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-500"><p className="text-sm text-blue-900">{riskResult.recommendation}</p></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'planner' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">📅 Smart Daily Planner</h2>
              <button onClick={handleDailyPlan} disabled={loading} className="btn-primary mb-6">{loading ? 'Generating...' : 'Plan My Day'}</button>
              {dailyPlan.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Your Optimized Schedule:</h3>
                  {dailyPlan.map((item, idx) => (
                    <div key={idx} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500">
                      <div className="flex justify-between items-start">
                        <div><h4 className="font-bold text-lg">{item.title}</h4><p className="text-sm text-gray-600">{item.timeSlot}</p><p className="text-sm text-gray-700 mt-1">{item.reason}</p></div>
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">{item.estimatedHours}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'breakdown' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">🔨 AI Task Breakdown</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task</label>
                  <select value={taskId} onChange={(e) => setTaskId(e.target.value)} className="input-field">
                    <option value="">Select Task</option>
                    {openTasks.map((task) => <option key={task._id} value={task._id}>{task.title}</option>)}
                  </select>
                </div>
                <button onClick={handleBreakdown} disabled={loading} className="btn-primary">{loading ? 'Breaking down...' : 'Break Down Task'}</button>
                {breakdownResult && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Subtasks ({breakdownResult.subtasks.length})</h3>
                    <div className="space-y-3">{breakdownResult.subtasks.map((st, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
                        <div className="flex justify-between items-center">
                          <div><h4 className="font-bold">#{st.order} {st.title}</h4><p className="text-sm text-gray-600">{st.description}</p></div>
                          <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm">~{st.estimatedHours}h</span>
                        </div>
                      </div>
                    ))}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'next' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">➡️ What Should I Do Next?</h2>
              <button onClick={handleNextAction} disabled={loading} className="btn-primary mb-6">{loading ? 'Analyzing...' : 'Get Recommendation'}</button>
              {nextAction && (
                <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-500">
                  <h3 className="text-2xl font-bold mb-2">{nextAction.title}</h3>
                  <p className="text-lg text-gray-700 mb-3">{nextAction.reason}</p>
                  <span className={`px-4 py-2 rounded-full text-white font-bold ${nextAction.urgency === 'critical' ? 'bg-red-600' : nextAction.urgency === 'high' ? 'bg-orange-600' : nextAction.urgency === 'medium' ? 'bg-yellow-600' : 'bg-green-600'}`}>{nextAction.urgency.toUpperCase()}</span>
                  <div className="p-3 bg-white rounded-lg mt-3"><p className="text-sm text-gray-600"><strong>Impact:</strong> {nextAction.estimatedImpact}</p></div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'burnout' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">😰 Burnout Detector</h2>
              <button onClick={handleBurnoutCheck} disabled={loading} className="btn-primary mb-6">{loading ? 'Analyzing...' : 'Check Burnout Risk'}</button>
              {burnoutReport && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">Burnout Risk Level</h3>
                      <span className={`px-4 py-2 rounded-full text-white font-bold ${burnoutReport.riskLevel === 'critical' ? 'bg-red-600' : burnoutReport.riskLevel === 'high' ? 'bg-orange-600' : burnoutReport.riskLevel === 'medium' ? 'bg-yellow-600' : 'bg-green-600'}`}>{burnoutReport.riskLevel.toUpperCase()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white rounded"><p className="text-sm text-gray-600">Workload Score</p><p className="text-2xl font-bold">{burnoutReport.workloadScore}%</p></div>
                      <div className="p-3 bg-white rounded"><p className="text-sm text-gray-600">Deadline Pressure</p><p className="text-2xl font-bold">{burnoutReport.deadlinePressure}</p></div>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg"><h4 className="font-bold mb-2">Recommendations:</h4><ul className="list-disc list-inside space-y-1">{burnoutReport.recommendations.map((r, i) => <li key={i} className="text-gray-700">{r}</li>)}</ul></div>
                  <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500"><p className="text-sm text-yellow-900"><strong>Suggested Break:</strong> {burnoutReport.suggestedBreak}</p></div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'emergency' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">🚨 Emergency Mode</h2>
              <div className="p-4 bg-red-50 border-2 border-red-500 rounded-lg mb-6"><p className="text-red-900 font-medium">⚠️ Use this only when you have critical deadlines approaching.</p></div>
              <button onClick={handleEmergencyMode} disabled={loading} className="btn-primary bg-red-600 hover:bg-red-700">{loading ? 'Activating...' : '🚨 Activate Emergency Mode'}</button>
              {emergencyPlan && (
                <div className="mt-6 space-y-6">
                  <div className="p-4 bg-red-100 border-2 border-red-600 rounded-lg"><p className="text-red-900 font-bold text-lg">{emergencyPlan.criticalWarning}</p></div>
                  <div><h3 className="text-xl font-bold mb-3">Prioritized Tasks:</h3><div className="space-y-3">{emergencyPlan.prioritizedTasks.map((t, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg border-l-4 border-red-500">
                      <div className="flex justify-between items-center">
                        <div><h4 className="font-bold">Priority #{t.priority}: {t.title}</h4><p className="text-sm text-gray-600">{t.reason}</p></div>
                        <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold">{t.timeAllocation}</span>
                      </div>
                    </div>
                  ))}</div></div>
                  <div className="p-4 bg-blue-50 rounded-lg"><h4 className="font-bold mb-2">Study Plan:</h4><ul className="list-disc list-inside space-y-1">{emergencyPlan.studyPlan.map((s, i) => <li key={i} className="text-gray-700">{s}</li>)}</ul></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
