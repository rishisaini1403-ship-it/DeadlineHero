import React, { useState, useEffect } from "react";
import { useTaskStore } from "../store/taskStore";

const Calendar = () => {
  const { tasks, fetchTasks } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
    return days;
  };

  const getTasksForDate = (date) => {
    return tasks.filter((task) => {
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getStatusColor = (task) => {
    return task.status === "completed" ? "bg-green-400" : "bg-yellow-400";
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowEventModal(true);
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getMonthName = (date) => {
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📅 Calendar</h1>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-sm dark:text-gray-300"><span className="w-3 h-3 bg-yellow-400 rounded"></span> Pending</span>
            <span className="flex items-center gap-1 text-sm dark:text-gray-300"><span className="w-3 h-3 bg-green-400 rounded"></span> Completed</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => navigateMonth(-1)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors dark:text-gray-200">← Previous</button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{getMonthName(currentDate)}</h2>
            <button onClick={() => navigateMonth(1)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors dark:text-gray-200">Next →</button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700 dark:text-gray-300 py-2">{day}</div>
            ))}
            {days.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} className="h-32 bg-gray-50 dark:bg-gray-700/50 rounded-lg"></div>;
              const dayTasks = getTasksForDate(date);
              const isCurrentDay = isToday(date);
              const hasCompleted = dayTasks.some((t) => t.status === "completed");
              const hasPending = dayTasks.some((t) => t.status !== "completed");

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`h-32 bg-white dark:bg-gray-800 border-2 rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${
                    isCurrentDay ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30" : hasCompleted && !hasPending ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20" : hasPending ? "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20" : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-bold ${isCurrentDay ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>{date.getDate()}</span>
                    {dayTasks.length > 0 && <span className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-full dark:text-gray-200">{dayTasks.length}</span>}
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div key={task._id} className={`text-xs px-2 py-1 rounded text-white truncate ${getStatusColor(task)}`}>
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && <div className="text-xs text-gray-500 dark:text-gray-400 pl-2">+{dayTasks.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 dark:text-white">📋 All Tasks by Date</h2>
          <div className="space-y-3">
            {tasks
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .slice(0, 10)
              .map((task) => {
                const daysUntil = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={task._id} className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${task.status === "completed" ? "bg-green-50 dark:bg-green-900/20 border-green-500" : "bg-gray-50 dark:bg-gray-700/50 border-yellow-500"}`}>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white">{task.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold dark:text-white">
                  {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </h3>
                <button onClick={() => setShowEventModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl">✕</button>
              </div>
              <div className="space-y-3">
                {getTasksForDate(selectedDate).length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No tasks on this date</p>
                ) : (
                  getTasksForDate(selectedDate).map((task) => (
                    <div key={task._id} className={`p-3 rounded-lg ${task.status === "completed" ? "bg-green-50 dark:bg-green-900/20" : "bg-yellow-50 dark:bg-yellow-900/20"}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold dark:text-white">{task.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{task.status === "completed" ? "✅ Completed" : "⏳ Pending"}</p>
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
