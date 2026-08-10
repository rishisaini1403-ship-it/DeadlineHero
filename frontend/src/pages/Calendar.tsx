import React, { useState, useEffect } from "react";
import { useTaskStore } from "../store/taskStore";
import { Task } from "../types/task.types";

const Calendar: React.FC = () => {
  const { tasks, fetchTasks } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
    return days;
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getStatusColor = (task: Task) => {
    return task.status === "completed" ? "bg-green-400" : "bg-yellow-400";
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowEventModal(true);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">📅 Calendar</h1>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-sm"><span className="w-3 h-3 bg-yellow-400 rounded"></span> Pending</span>
            <span className="flex items-center gap-1 text-sm"><span className="w-3 h-3 bg-green-400 rounded"></span> Completed</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => navigateMonth(-1)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">← Previous</button>
            <h2 className="text-2xl font-bold text-gray-900">{getMonthName(currentDate)}</h2>
            <button onClick={() => navigateMonth(1)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Next →</button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700 py-2">{day}</div>
            ))}
            {days.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} className="h-32 bg-gray-50 rounded-lg"></div>;
              const dayTasks = getTasksForDate(date);
              const isCurrentDay = isToday(date);
              const hasCompleted = dayTasks.some((t) => t.status === "completed");
              const hasPending = dayTasks.some((t) => t.status !== "completed");

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`h-32 bg-white border-2 rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${
                    isCurrentDay ? "border-blue-500 bg-blue-50" : hasCompleted && !hasPending ? "border-green-300 bg-green-50" : hasPending ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-bold ${isCurrentDay ? "text-blue-600" : "text-gray-700"}`}>{date.getDate()}</span>
                    {dayTasks.length > 0 && <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{dayTasks.length}</span>}
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div key={task._id} className={`text-xs px-2 py-1 rounded text-white truncate ${getStatusColor(task)}`}>
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && <div className="text-xs text-gray-500 pl-2">+{dayTasks.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">📋 All Tasks by Date</h2>
          <div className="space-y-3">
            {tasks
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .slice(0, 10)
              .map((task) => {
                const daysUntil = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={task._id} className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${task.status === "completed" ? "bg-green-50 border-green-500" : "bg-gray-50 border-yellow-500"}`}>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{task.title}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(task.dueDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        {task.status === "completed" && " ✅ Completed"}
                      </p>
                    </div>
                    {task.status !== "completed" && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${daysUntil <= 1 ? "bg-red-600" : daysUntil <= 3 ? "bg-orange-600" : daysUntil <= 7 ? "bg-yellow-600" : "bg-green-600"}`}>
                        {daysUntil <= 0 ? "OVERDUE" : `${daysUntil}d left`}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Selected Date Modal */}
        {showEventModal && selectedDate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </h3>
                <button onClick={() => setShowEventModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
              </div>
              <div className="space-y-3">
                {getTasksForDate(selectedDate).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No tasks on this date</p>
                ) : (
                  getTasksForDate(selectedDate).map((task) => (
                    <div key={task._id} className={`p-3 rounded-lg ${task.status === "completed" ? "bg-green-50" : "bg-yellow-50"}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold">{task.title}</h4>
                          <p className="text-sm text-gray-600">{task.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{task.status === "completed" ? "✅ Completed" : "⏳ Pending"}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => setShowEventModal(false)} className="btn-primary w-full mt-4">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
