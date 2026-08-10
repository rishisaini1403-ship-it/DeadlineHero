import { create } from 'zustand';
import { Task, CreateTaskInput } from '../types/task.types';
import { taskService } from '../services/task.service';

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getPendingTasks: () => Task[];
  getCompletedTasks: () => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await taskService.getTasks();
      set({ tasks, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch tasks', loading: false });
    }
  },

  createTask: async (input: CreateTaskInput) => {
    const task = await taskService.createTask(input);
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: async (id: string, data: Partial<Task>) => {
    const updated = await taskService.updateTask(id, data);
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === id ? updated : t)),
    }));
    return updated;
  },

  deleteTask: async (id: string) => {
    await taskService.deleteTask(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t._id !== id),
    }));
  },

  getPendingTasks: () => {
    return get().tasks.filter((t) => t.status !== 'completed');
  },

  getCompletedTasks: () => {
    return get().tasks.filter((t) => t.status === 'completed');
  },
}));
