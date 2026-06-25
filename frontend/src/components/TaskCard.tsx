import React from "react";
import { Task } from "../types/task.types";

interface Props {
  task: Task;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}

const TaskCard: React.FC<Props> = ({
  task,
  onDelete,
  onComplete,
}) => {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold text-lg">
        {task.title}
      </h3>

      <p>{task.description}</p>

      <p className="text-sm text-gray-500">
        Priority: {task.priority}
      </p>

      <p className="text-sm text-gray-500">
        Status: {task.status}
      </p>

      <div className="flex gap-3 mt-4">
        {task.status !== "completed" && (
          <button
            onClick={() => onComplete(task._id)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Complete
          </button>
        )}

        <button
          onClick={() => onDelete(task._id)}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TaskCard;