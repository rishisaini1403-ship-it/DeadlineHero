import { create } from 'zustand';
import { taskService } from '../services/task.service';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await taskService.getTasks();
      set({ tasks, loading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch tasks', loading: false });
    }
  },

  createTask: async (input) => {
    const task = await taskService.createTask(input);
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: async (id, data) => {
    const updated = await taskService.updateTask(id, data);
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === id ? updated : t)),
    }));
    return updated;
  },

  deleteTask: async (id) => {
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
