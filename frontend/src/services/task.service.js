import api from './api';

export const taskService = {
  async getTasks(filters) {
    const response = await api.get('/tasks', { params: filters });
    return response.data.data || [];
  },

  async getTask(id) {
    const response = await api.get(`/tasks/${id}`);
    return response.data.data;
  },

  async createTask(data) {
    const response = await api.post('/tasks', data);
    return response.data.data;
  },

  async updateTask(id, data) {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data.data;
  },

  async deleteTask(id) {
    await api.delete(`/tasks/${id}`);
  },

  async getRecommendedTasks() {
    const response = await api.get('/tasks/recommended');
    return response.data.data || [];
  },
};

export const deadlineService = {
  async getDeadlines(status) {
    const response = await api.get('/deadlines', { params: { status } });
    return response.data.data || [];
  },

  async createDeadline(data) {
    const response = await api.post('/deadlines', data);
    return response.data.data;
  },

  async updateDeadline(id, data) {
    const response = await api.put(`/deadlines/${id}`, data);
    return response.data.data;
  },

  async deleteDeadline(id) {
    await api.delete(`/deadlines/${id}`);
  },
};

export const analyticsService = {
  async getAnalytics() {
    const response = await api.get('/analytics');
    return response.data.data;
  },

  async getWeeklyProgress() {
    const response = await api.get('/analytics/weekly-progress');
    return response.data.data;
  },

  async getHeatmap(days = 60) {
    const response = await api.get('/analytics/heatmap', { params: { days } });
    return response.data.data || [];
  },
};

export const scheduleService = {
  async generateSchedule() {
    const response = await api.post('/schedule/generate');
    return response.data.data;
  },

  async prioritizeTasks() {
    const response = await api.post('/schedule/prioritize');
    return response.data.data || [];
  },
};
