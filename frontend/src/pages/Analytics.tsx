import React, { useEffect, useState, useMemo } from "react";
import { useTaskStore } from "../store/taskStore";
import { analyticsService } from "../services/task.service";
import { HeatmapData } from "../types/task.types";
import { calculateCurrentStreak, calculateBestStreak, calculateMostProductiveDay } from "../utils/stats";

const getHeatmapColor = (count: number) => {
  if (count === 0) return "bg-gray-200 dark:bg-gray-700";
  if (count === 1) return "bg-green-200 dark:bg-green-800";
  if (count <= 3) return "bg-green-400 dark:bg-green-600";
  return "bg-green-600 dark:bg-green-400";
};

/**
 * Generate heatmap weeks from heatmapDays ago to today.
 * Uses millisecond-based computation (immune to month-boundary bugs).
 * Returns weeks: {date: string; count: number}[][] [ [Sun{date,count}, Mon{date,count}, ...], ... ].
 * GitHub-style heatmap: Sunday-start; confirmed by UI dayLabels ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].
 */
function generateHeatmapWeeks(heatmapDays: number) {
  const today = new Date(); 
  today.setHours(0, 0, 0, 0);
  const start = new Date(today.getTime() - (heatmapDays - 1) * 86400000);
  const startSunday = new Date(start.getTime() - start.getDay() * 86400000);
  const nextSundayMs = today.getTime() + ((7 - today.getDay()) % 7) * 86400000;
  const nextSunday = new Date(nextSundayMs);
  const weeks: {date: string; count: number}[][] = [];
  const weekMs = 7 * 86400000;
  let curSunday = new Date(startSunday);
  while (curSunday < nextSunday) {
    const week: {date: string; count: number}[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({ date: fmt(new Date(curSunday.getTime() + i * 86400000)), count: 0 });
    }
    weeks.push(week);
    curSunday = new Date(curSunday.getTime() + weekMs);
  }
  return { weeks, start, today };
}
const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const Analytics: React.FC = () => {
  const { tasks, fetchTasks } = useTaskStore();
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [heatmapDays, setHeatmapDays] = useState(30);
  const [weeklySummary, setWeeklySummary] = useState<{
    created: number; completed: number; rate: number; consistency: number; overdue: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    if (tasks.length > 0 || loading) loadWeekly();
  }, [tasks]);

  useEffect(() => { loadHeatmap(); }, [heatmapDays]);

  const loadWeekly = async () => {
    try {
      const week = await analyticsService.getWeeklyProgress();
      const s = week.summary;
      setWeeklySummary({ created: s.totalCreated, completed: s.totalCompleted, rate: s.completionRate, consistency: s.consistencyDays, overdue: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== "completed").length });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadHeatmap = async () => {
    try { setHeatmapData(await analyticsService.getHeatmap(heatmapDays)); }
    catch (e) { console.error(e); }
  };

  const completed = useMemo(() => tasks.filter(t => t.status === "completed"), [tasks]);
  const pending = useMemo(() => tasks.filter(t => t.status !== "completed"), [tasks]);
  const total = tasks.length;
  const rate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const completedThisWeek = completed.filter(t => new Date(t.updatedAt || t.createdAt) >= weekAgo).length;
  const createdThisWeek = tasks.filter(t => new Date(t.createdAt) >= weekAgo).length;

  const currentStreak = useMemo(() => calculateCurrentStreak(tasks), [tasks]);
  const bestStreak = useMemo(() => calculateBestStreak(tasks), [tasks]);

  const priorityBreakdown = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {};
    tasks.forEach(t => {
      if (!map[t.priority]) map[t.priority] = { total: 0, completed: 0 };
      map[t.priority].total++;
      if (t.status === "completed") map[t.priority].completed++;
    });
    return Object.entries(map).map(([p, d]) => ({ priority: p, ...d, pct: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0 }));
  }, [tasks]);

  const report = useMemo(() => {
    const overdue = tasks.filter(t => new Date(t.dueDate) < now && t.status !== "completed").length;
    const a: string[] = [];
    if (completed.length >= 15) a.push("Completed 15+ tasks overall");
    else if (completed.length >= 10) a.push("Completed 10+ tasks overall");
    else if (completed.length >= 5) a.push("Completed 5+ tasks overall");
    if (completed.filter(t => t.priority === "high" || t.priority === "urgent").length >= 3) a.push("Completed all High Priority tasks");
    const i: string[] = [];
    if (completedThisWeek > 0) i.push(`${completedThisWeek} tasks completed this week`);
    if (overdue > 0) i.push(`${overdue} tasks overdue — consider reprioritizing`);
    else i.push("No overdue tasks — great time management!");
    const dayCounts: Record<number, number> = {};
    completed.forEach(t => { const d = new Date(t.updatedAt || t.createdAt).getDay(); dayCounts[d] = (dayCounts[d] || 0) + 1; });
    const bestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    if (bestDay) i.push(`Most productive: ${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][parseInt(bestDay[0])]}`);
    const f: string[] = [];
    if (overdue > 0) f.push("Complete overdue tasks first");
    f.push("Maintain consistency to build your streak");
    if (pending.some(t => t.priority === "high" || t.priority === "urgent")) f.push("Finish high priority tasks");
    return { achievements: a, insights: i, nextFocus: f };
  }, [tasks, completed, pending, completedThisWeek]);

  if (loading && tasks.length === 0) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">📈 Analytics</h1>

        {/* Row 1: Top Overview — Total, Completed, Pending, Rate (appear ONLY here) */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total Tasks", value: total, color: "text-blue-600", bg: "bg-blue-50", icon: "📝" },
            { label: "Completed", value: completed.length, color: "text-green-600", bg: "bg-green-50", icon: "✅" },
            { label: "Pending", value: pending.length, color: "text-yellow-600", bg: "bg-yellow-50", icon: "⏳" },
            { label: "Completion Rate", value: `${rate}%`, color: "text-purple-600", bg: "bg-purple-50", icon: "📊" },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: Weekly Progress + Task Breakdown (side by side) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-400">
            <h2 className="text-sm font-bold text-gray-900 mb-3">📅 Weekly Progress</h2>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: "Created", value: weeklySummary?.created ?? 0, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Completed", value: weeklySummary?.completed ?? 0, color: "text-green-600", bg: "bg-green-50" },
                { label: "Completion", value: `${weeklySummary?.rate ?? 0}%`, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Consistency", value: `${weeklySummary?.consistency ?? 0}/7`, color: "text-orange-600", bg: "bg-orange-50" },
                { label: "Overdue", value: weeklySummary?.overdue ?? 0, color: "text-red-600", bg: "bg-red-50" },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded p-2 text-center`}>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-400">
            <h2 className="text-sm font-bold text-gray-900 mb-3">🎯 Tasks by Priority</h2>
            <div className="space-y-2">
              {priorityBreakdown.map(item => {
                const colors: Record<string, string> = { urgent: "bg-red-500", high: "bg-orange-500", medium: "bg-yellow-500", low: "bg-green-500" };
                return (
                  <div key={item.priority}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-medium capitalize">{item.priority}</span>
                      <span className="text-gray-500">{item.completed}/{item.total}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${colors[item.priority]} h-2 rounded-full transition-all`} style={{ width: `${item.pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {priorityBreakdown.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No tasks yet</p>}
            </div>
          </div>
        </div>

        {/* Row 3: AI Weekly Report (text-only) + Streak & Productivity (side by side) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-400">
            <h2 className="text-sm font-bold text-gray-900 mb-2">🤖 AI Weekly Report</h2>
            <div className="space-y-2 text-[11px]">
              <div>
                <p className="font-semibold mb-0.5">🏆 Achievements</p>
                <ul className="list-disc list-inside text-gray-600">{report.achievements.length > 0 ? report.achievements.map((a, i) => <li key={i}>{a}</li>) : <li className="text-gray-400">Complete tasks to earn achievements</li>}</ul>
              </div>
              <div>
                <p className="font-semibold mb-0.5">💡 AI Insights</p>
                <ul className="list-disc list-inside text-gray-600">{report.insights.map((i, idx) => <li key={idx}>{i}</li>)}</ul>
              </div>
              <div>
                <p className="font-semibold mb-0.5">🎯 Next Week Focus</p>
                <ul className="list-disc list-inside text-gray-600">{report.nextFocus.map((f, idx) => <li key={idx}>{f}</li>)}</ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-400">
            <h2 className="text-sm font-bold text-gray-900 mb-3">🔥 Streak & Productivity</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 text-center">
                <p className="text-4xl font-bold text-orange-600">{currentStreak}</p>
                <p className="text-xs text-gray-500">Current Streak</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 text-center">
                <p className="text-4xl font-bold text-purple-600">{bestStreak}</p>
                <p className="text-xs text-gray-500">Best Streak</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{createdThisWeek > 0 ? Math.round((completedThisWeek / createdThisWeek) * 100) : 0}%</p>
                <p className="text-xs text-gray-500">Productivity Score</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${createdThisWeek > 0 ? Math.round((completedThisWeek / createdThisWeek) * 100) : 0}%` }}></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{weeklySummary?.consistency ?? 0}/7</p>
                <p className="text-xs text-gray-500">Weekly Consistency</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Productivity Heatmap — graph + stats side by side */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-900">🔥 Productivity Heatmap</h2>
            <div className="flex gap-1">
              {[30, 60, 90].map(d => (
                <button key={d} onClick={() => setHeatmapDays(d)} className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${heatmapDays === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{d} Days</button>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              {(() => {
                if (heatmapData.length === 0 || heatmapData.reduce((s, d) => s + d.count, 0) === 0) {
                  return <div className="flex items-center justify-center py-6 text-center"><div><p className="text-sm text-gray-400 mb-1">No productivity data for this period.</p><p className="text-xs text-gray-300">Complete your first task to start building your graph.</p></div></div>;
                }
                const { weeks } = generateHeatmapWeeks(heatmapDays);
                heatmapData.forEach(d => {
                  weeks.forEach(week => {
                    week.forEach(day => {
                      if (day.date === d.date) day.count = d.count;
});
                });
              });
              console.log(JSON.stringify(weeks, null, 2));
              const monthLabels: { label: string; col: number }[] = [];
                const parseDate = (s: string) => { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
                weeks.forEach((w, i) => {
                  const fd = parseDate(w[0].date);
                  const m = fd.toLocaleString('default', { month: 'short' });
                  if (i === 0 || fd.getMonth() !== parseDate(weeks[i - 1][3].date).getMonth()) monthLabels.push({ label: m, col: i });
                });
                const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                return (
                  <div className="overflow-x-auto">
                    <div className="inline-flex flex-col gap-[2px]" style={{ minWidth: weeks.length * 14 }}>
                      <div className="flex" style={{ marginLeft: 32, gap: 0 }}>
                        {weeks.map((_, ci) => {
                          const ml = monthLabels.find(m => m.col === ci);
                          return <div key={ci} className="text-[9px] text-gray-500 font-medium" style={{ width: 14, height: 14, lineHeight: "14px" }}>{ml ? ml.label : ""}</div>;
                        })}
                      </div>
{Array.from({length: 7}, (_, i) => (
                          <div key={i} className="flex items-center gap-[2px]">
                            <span className="text-[9px] text-gray-500 w-7 text-right pr-1">{dayNames[i]}</span>
                            {weeks.map((week, ci) => (
                              <div key={`${ci}-{i}`} className={`${getHeatmapColor(week[i].count)} cursor-pointer transition-transform hover:scale-150`} style={{ width: 10, height: 10, borderRadius: 2, minWidth: 10 }}
                                title={`${parseDate(week[i].date).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}\n${week[i].count} task${week[i].count !== 1 ? "s" : ""} completed`}
                              ></div>
                            ))}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <div className="flex items-center justify-end mt-2 gap-1">
                <span className="text-[9px] text-gray-400">Less</span>
                <div className="w-[10px] h-[10px] bg-gray-200 rounded-[2px]"></div>
                <div className="w-[10px] h-[10px] bg-green-200 rounded-[2px]"></div>
                <div className="w-[10px] h-[10px] bg-green-400 rounded-[2px]"></div>
                <div className="w-[10px] h-[10px] bg-green-600 rounded-[2px]"></div>
                <span className="text-[9px] text-gray-400">More</span>
              </div>
            </div>
            <div className="w-36 flex-shrink-0 border-l border-gray-100 pl-4">
              <p className="text-[10px] font-semibold text-gray-700 mb-2">📊 Stats</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[9px] text-gray-500">Tasks Completed</p>
                  <p className="text-sm font-bold text-gray-800">{heatmapData.reduce((s, d) => s + d.count, 0)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500">Productive Days</p>
                  <p className="text-sm font-bold text-gray-800">{heatmapData.filter(d => d.count > 0).length}/{heatmapDays}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500">Completion Rate</p>
                  <p className="text-sm font-bold text-gray-800">{(() => {
                    const rangeStart = new Date(now.getTime() - heatmapDays * 24 * 60 * 60 * 1000);
                    const totalInRange = tasks.filter(t => new Date(t.createdAt) >= rangeStart).length;
                    const completedInRange = completed.filter(t => new Date(t.updatedAt || t.createdAt) >= rangeStart).length;
                    return totalInRange > 0 ? Math.round((completedInRange / totalInRange) * 100) + '%' : '0%';
                  })()}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500">Most Productive Day</p>
                  <p className="text-sm font-bold text-gray-800">{(() => {
                    const best = calculateMostProductiveDay(tasks);
                    if (!best) return "N/A";
                    const d = new Date(best.date + 'T00:00:00');
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  })()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 5: Risk Overview + Active Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-400">
            <h2 className="text-sm font-bold text-gray-900 mb-3">⚠️ Risk Overview</h2>
            {(() => {
              const n = new Date();
              const critical = tasks.filter(t => t.status !== "completed" && new Date(t.dueDate) < n);
              const warning = tasks.filter(t => t.status !== "completed" && new Date(t.dueDate) >= n && new Date(t.dueDate).getTime() - n.getTime() < 3 * 24 * 60 * 60 * 1000);
              const good = tasks.filter(t => t.status !== "completed" && new Date(t.dueDate).getTime() - n.getTime() >= 3 * 24 * 60 * 60 * 1000);
              return (
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-red-50 rounded p-3 text-center"><p className="text-2xl font-bold text-red-600">{critical.length}</p><p className="text-[10px] text-gray-500">Overdue Tasks</p></div>
                  <div className="bg-orange-50 rounded p-3 text-center"><p className="text-2xl font-bold text-orange-600">{warning.length}</p><p className="text-[10px] text-gray-500">Due Soon (within 3 days)</p></div>
                  <div className="bg-green-50 rounded p-3 text-center"><p className="text-2xl font-bold text-green-600">{good.length}</p><p className="text-[10px] text-gray-500">On Track Tasks</p></div>
                </div>
              );
            })()}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-400">
            <h2 className="text-sm font-bold text-gray-900 mb-3">📋 Active Deadlines</h2>
            <div className="max-h-[180px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-gray-500 border-b"><th className="text-left py-1 pr-2">Task</th><th className="text-left py-1 pr-2">Due</th><th className="text-left py-1 pr-2">Priority</th><th className="text-left py-1">Status</th></tr></thead>
                <tbody>
                  {tasks.filter(t => t.status !== "completed").sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 8).map(task => {
                    const d = new Date(task.dueDate);
                    const dl = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const pc: Record<string, string> = { urgent: "bg-red-100 text-red-700", high: "bg-orange-100 text-orange-700", medium: "bg-yellow-100 text-yellow-700", low: "bg-green-100 text-green-700" };
                    const sc: Record<string, string> = { completed: "bg-blue-100 text-blue-700", pending: "bg-gray-100 text-gray-700", overdue: "bg-red-100 text-red-700" };
                    const isOverdue = task.status !== "completed" && new Date(task.dueDate) < new Date();
                    const statusLabel = isOverdue ? "overdue" : task.status;
                    return (
                      <tr key={task._id} className="border-b border-gray-50">
                        <td className="py-1.5 pr-2 font-medium truncate max-w-[120px]">{task.title}</td>
                        <td className="py-1.5 pr-2 text-gray-500">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} {dl <= 1 && <span className="text-red-500 font-bold">!</span>}</td>
                        <td className="py-1.5 pr-2"><span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${pc[task.priority]}`}>{task.priority}</span></td>
                        <td className="py-1.5"><span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${sc[statusLabel]}`}>{statusLabel}</span></td>
                      </tr>
                    );
                  })}
                  {tasks.filter(t => t.status !== "completed").length === 0 && <tr><td colSpan={4} className="text-center py-4 text-gray-400">No active tasks</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
