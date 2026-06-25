import api from './api';
import { ApiResponse } from '@/types/api.types';
import { Task, Deadline, CreateTaskInput, CreateDeadlineInput, TaskFilters, AnalyticsData, WeeklyProgress } from '@/types/task.types';

export const taskService = {
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const response = await api.get<ApiResponse<Task[]>>('/tasks', { params: filters });
    return response.data.data || [];
  },

  async getTask(id: string): Promise<Task> {
    const response = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data.data!;
  },

  async createTask(data: CreateTaskInput): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>('/tasks', data);
    return response.data.data!;
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const response = await api.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    return response.data.data!;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  async getRecommendedTasks(): Promise<Task[]> {
    const response = await api.get<ApiResponse<Task[]>>('/tasks/recommended');
    return response.data.data || [];
  },
};

export const deadlineService = {
  async getDeadlines(status?: string): Promise<Deadline[]> {
    const response = await api.get<ApiResponse<Deadline[]>>('/deadlines', { params: { status } });
    return response.data.data || [];
  },

  async createDeadline(data: CreateDeadlineInput): Promise<Deadline> {
    const response = await api.post<ApiResponse<Deadline>>('/deadlines', data);
    return response.data.data!;
  },

  async updateDeadline(id: string, data: Partial<Deadline>): Promise<Deadline> {
    const response = await api.put<ApiResponse<Deadline>>(`/deadlines/${id}`, data);
    return response.data.data!;
  },

  async deleteDeadline(id: string): Promise<void> {
    await api.delete(`/deadlines/${id}`);
  },
};

export const analyticsService = {
  async getAnalytics(): Promise<AnalyticsData> {
    const response = await api.get<ApiResponse<AnalyticsData>>('/analytics');
    return response.data.data!;
  },

  async getWeeklyProgress(): Promise<WeeklyProgress[]> {
    const response = await api.get<ApiResponse<WeeklyProgress[]>>('/analytics/weekly');
    return response.data.data || [];
  },
};

export const scheduleService = {
  async generateSchedule(): Promise<any> {
    const response = await api.post<ApiResponse<any>>('/schedule/generate');
    return response.data.data!;
  },

  async prioritizeTasks(): Promise<Task[]> {
    const response = await api.post<ApiResponse<Task[]>>('/schedule/prioritize');
    return response.data.data || [];
  },
};
