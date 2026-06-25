import React, { useEffect, useState } from "react";
import { taskService } from "../services/task.service";
import { Task } from "../types/task.types";
import TaskCard from "../components/TaskCard";
import toast from "react-hot-toast";

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async () => {
    if (!title || !dueDate) {
      alert("Please enter title and due date.");
      return;
    }

    try {
      await taskService.createTask({
        title,
        dueDate,
        description: "",
        priority: "medium",
        category: "General",
        estimatedHours: 1,
        tags: [],
      });

      setTitle("");
      setDueDate("");

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
      toast.success("Task completed!");
    } catch (err) {
      toast.error("Failed to update task.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Tasks</h1>

      {/* Create Task Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Create New Task
        </h2>

        <div className="flex flex-col gap-4">
          <input
            className="border p-3 rounded"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            type="datetime-local"
            className="border p-3 rounded"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <button
            onClick={handleCreateTask}
            className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
          >
            Add Task
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <p>No tasks found.</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onDelete={handleDelete}
              onComplete={handleComplete}
            />
          ))
        )}
      </div>
    </div>
  );
};
export default Tasks;