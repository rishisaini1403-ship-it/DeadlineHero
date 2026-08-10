import React, { useEffect, useState } from "react";
import { useTaskStore } from "../store/taskStore";
import { Task } from "../types/task.types";
import TaskCard from "../components/TaskCard";
import aiService from "../services/ai.service";
import toast from "react-hot-toast";

const Tasks: React.FC = () => {
  const { tasks, loading, fetchTasks, createTask, updateTask, deleteTask } = useTaskStore();

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [category, setCategory] = useState("General");
  const [estimatedHours, setEstimatedHours] = useState<number>(1);

  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDate");

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const pendingTasks = tasks
    .filter((t) => t.status !== "completed")
    .filter((t) => filterPriority === "all" || t.priority === filterPriority)
    .sort((a, b) => {
      if (sortBy === "dueDate") return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sortBy === "priority") {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      }
      return a.title.localeCompare(b.title);
    });

  const completedTasks = tasks
    .filter((t) => t.status === "completed")
    .filter((t) => filterPriority === "all" || t.priority === filterPriority)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

  const handleCreateTask = async () => {
    if (!title || !dueDate) {
      toast.error("Please enter title and due date.");
      return;
    }
    try {
      await createTask({
        title,
        dueDate: new Date(dueDate).toISOString(),
        description,
        priority,
        category,
        estimatedHours,
        tags: [],
      });
      setTitle("");
      setDueDate("");
      setDescription("");
      setPriority("medium");
      setCategory("General");
      setEstimatedHours(1);
      toast.success("Task created successfully!");
    } catch (err) {
      toast.error("Failed to create task.");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await updateTask(id, { status: "completed" });
      toast.success("Task completed! 🎉");
    } catch (err) {
      toast.error("Failed to update task.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      toast.success("Task deleted!");
    } catch (err) {
      toast.error("Failed to delete task.");
    }
  };

  const handleUpdate = async (id: string, data: Partial<Task>) => {
    try {
      await updateTask(id, data);
      toast.success("Task updated!");
    } catch (err) {
      toast.error("Failed to update task.");
    }
  };

  const handleBreakdown = async (taskId: string) => {
    try {
      await aiService.breakdownTask(taskId);
      toast.success("Task broken down! Check AI Assistant for details.");
    } catch (error) {
      toast.error("Failed to breakdown task");
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
              Completed: {tasks.filter((t) => t.status === "completed").length}
            </span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              Pending: {tasks.filter((t) => t.status !== "completed").length}
            </span>
          </div>
        </div>

        {/* Create Task Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">➕ Create New Task</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
              <input className="input-field" placeholder="e.g., Complete DBMS Project" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input type="datetime-local" className="input-field" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input-field" placeholder="Add details about this task..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="input-field">
                <option value="low">🟢 Low - Can wait</option>
                <option value="medium">🟡 Medium - Normal priority</option>
                <option value="high">🟠 High - Important</option>
                <option value="urgent">🔴 Urgent - Critical deadline</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input className="input-field" placeholder="e.g., Assignment, Project, Exam" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
              <input type="number" className="input-field" min="0.5" step="0.5" value={estimatedHours === 0 ? "" : estimatedHours} onChange={(e) => { const v = e.target.value; setEstimatedHours(v === "" ? 0 : parseFloat(v) || 0); }} />
            </div>
          </div>
          <button onClick={handleCreateTask} className="btn-primary mt-4 w-full">🚀 Create Task</button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Priority</label>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="input-field">
                <option value="all">All Priorities</option>
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Pending By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field">
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => { setFilterPriority("all"); setSortBy("dueDate"); }} className="btn-secondary w-full">🔄 Reset Filters</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Tasks Column */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                Pending Tasks ({pendingTasks.length})
              </h2>
              <div className="space-y-4">
                {pendingTasks.length === 0 ? (
                  <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="text-4xl mb-3">🎉</div>
                    <p className="text-gray-500">No pending tasks!</p>
                  </div>
                ) : (
                  pendingTasks.map((task) => (
                    <div key={task._id}>
                      <TaskCard task={task} onDelete={handleDelete} onComplete={handleComplete} onUpdate={handleUpdate} />
                      {task.status !== "completed" && !task.isAIBrokenDown && Number(task.estimatedHours ?? 0) >= 3 && (
                        <button onClick={() => handleBreakdown(task._id)} className="mt-1 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-full text-xs font-medium transition-colors">
                          🔨 AI Breakdown
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Completed Tasks Column */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                Completed Tasks ({completedTasks.length})
              </h2>
              <div className="space-y-4">
                {completedTasks.length === 0 ? (
                  <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="text-4xl mb-3">📝</div>
                    <p className="text-gray-500">No completed tasks yet. Start working!</p>
                  </div>
                ) : (
                  completedTasks.map((task) => (
                    <div key={task._id} className="opacity-80">
                      <TaskCard task={task} onDelete={handleDelete} onComplete={handleComplete} onUpdate={handleUpdate} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
