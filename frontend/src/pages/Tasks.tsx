import React, { useEffect, useState } from "react";
import { taskService } from "../services/task.service";
import { Task } from "../types/task.types";
import TaskCard from "../components/TaskCard";
import aiService from "../services/ai.service";
import toast from "react-hot-toast";

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [category, setCategory] = useState("General");
  const [estimatedHours, setEstimatedHours] = useState(1);

  // Filter states
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dueDate');

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filterPriority, filterStatus, sortBy]);

  const fetchTasks = async () => {
    try {
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === filterPriority);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    setFilteredTasks(filtered);
  };

  const handleCreateTask = async () => {
    if (!title || !dueDate) {
      toast.error("Please enter title and due date.");
      return;
    }

    try {
      await taskService.createTask({
        title,
        dueDate,
        description,
        priority,
        category,
        estimatedHours,
        tags: [],
      });

      setTitle("");
      setDueDate("");
      setDescription("");
      setPriority('medium');
      setCategory("General");
      setEstimatedHours(1);

      fetchTasks();
      toast.success("Task created successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create task.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await taskService.deleteTask(id);
      fetchTasks();
      toast.success("Task deleted!");
    } catch (err) {
      toast.error("Failed to delete task.");
    }
  };

    const handleComplete = async (id: string) => {
    try {
      await taskService.updateTask(id, {
        status: "completed",
      });

      fetchTasks();
      toast.success("Task completed! 🎉");
    } catch (err) {
      toast.error("Failed to update task.");
    }
  };

  const handleBreakdown = async (taskId: string) => {
    try {
      await aiService.breakdownTask(taskId);
      toast.success('Task broken down! Check AI Assistant for details.');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to breakdown task');
    }
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityEmoji = (p: string) => {
    switch(p) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">✅ Tasks</h1>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Total: {tasks.length}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Completed: {tasks.filter(t => t.status === 'completed').length}
            </span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              Pending: {tasks.filter(t => t.status !== 'completed').length}
            </span>
          </div>
        </div>

        {/* Create Task Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">➕ Create New Task</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                className="input-field"
                placeholder="e.g., Complete DBMS Project"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="datetime-local"
                className="input-field"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="input-field"
                placeholder="Add details about this task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="input-field"
              >
                <option value="low">🟢 Low - Can wait</option>
                <option value="medium">🟡 Medium - Normal priority</option>
                <option value="high">🟠 High - Important</option>
                <option value="urgent">🔴 Urgent - Critical deadline</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                className="input-field"
                placeholder="e.g., Assignment, Project, Exam"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                className="input-field"
                min="0.5"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <button
            onClick={handleCreateTask}
            className="btn-primary mt-4 w-full"
          >
            🚀 Create Task
          </button>
        </div>

        {/* Filters & Sorting */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Priority
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="input-field"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field"
              >
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterPriority('all');
                  setFilterStatus('all');
                  setSortBy('dueDate');
                }}
                className="btn-secondary w-full"
              >
                🔄 Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow-md text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No tasks found
              </h3>
              <p className="text-gray-500">
                {tasks.length === 0 
                  ? "Create your first task to get started!" 
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task._id} className="relative">
                <TaskCard
                  task={task}
                  onDelete={handleDelete}
                  onComplete={handleComplete}
                />
                
                {/* Priority Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(task.priority)}`}>
                    {getPriorityEmoji(task.priority)} {task.priority.toUpperCase()}
                  </span>
                </div>

                {/* AI Breakdown Button */}
                {task.status !== 'completed' && !task.isAIBrokenDown && task.estimatedHours >= 3 && (
                  <button
                    onClick={() => handleBreakdown(task._id)}
                    className="absolute top-4 right-32 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-full text-xs font-medium transition-colors"
                  >
                    🔨 AI Breakdown
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default Tasks;