import React, { useState } from "react";
import { Task } from "../types/task.types";

interface Props {
  task: Task;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Task>) => void;
}

const priorityColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-800 border-red-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-green-100 text-green-800 border-green-300",
};

const priorityEmojis: Record<string, string> = {
  urgent: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🟢",
};

const TaskCard: React.FC<Props> = ({ task, onDelete, onComplete, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editDueDate, setEditDueDate] = useState(
    task.dueDate ? task.dueDate.slice(0, 16) : ""
  );

  const handleSaveEdit = () => {
    onUpdate(task._id, {
      title: editTitle,
      description: editDescription,
      priority: editPriority as Task["priority"],
      dueDate: editDueDate ? new Date(editDueDate).toISOString() : task.dueDate,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md border-2 border-blue-300">
        <input
          className="input-field mb-2"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Task title"
        />
        <textarea
          className="input-field mb-2"
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Description"
          rows={2}
        />
        <div className="grid grid-cols-2 gap-2 mb-2">
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value as Task["priority"])}
            className="input-field"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <input
            type="datetime-local"
            className="input-field"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSaveEdit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Save
          </button>
          <button onClick={() => setEditing(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "completed";
  const daysUntilDue = Math.ceil(
    (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-gray-900">{task.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${priorityColors[task.priority]}`}>
              {priorityEmojis[task.priority]} {task.priority.toUpperCase()}
            </span>
          </div>
          {task.description && (
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>📅 {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            {task.estimatedHours > 0 && <span>⏱ {task.estimatedHours}h</span>}
            {task.category && <span>📂 {task.category}</span>}
            {isOverdue && <span className="text-red-600 font-bold">OVERDUE</span>}
            {!isOverdue && task.status !== "completed" && daysUntilDue > 0 && (
              <span className={daysUntilDue <= 1 ? "text-red-500 font-bold" : "text-gray-500"}>
                {daysUntilDue === 0 ? "Today" : `${daysUntilDue}d left`}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        {task.status !== "completed" && (
          <button
            onClick={() => onComplete(task._id)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            ✅ Complete
          </button>
        )}
        <button
          onClick={() => {
            setEditTitle(task.title);
            setEditDescription(task.description);
            setEditPriority(task.priority);
            setEditDueDate(task.dueDate ? task.dueDate.slice(0, 16) : "");
            setEditing(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => onDelete(task._id)}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
