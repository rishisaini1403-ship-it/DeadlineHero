import api from './api';

const aiService = {
  async calculateRisk(taskId) {
    const response = await api.post('/ai/risk-predictor', { taskId });
    return response.data.data;
  },

  async generateDailyPlan(availableHours = 8) {
    const response = await api.post('/ai/daily-plan', { availableHours });
    return response.data.data;
  },

  async breakdownTask(taskId) {
    const response = await api.post('/ai/breakdown-task', { taskId });
    return response.data.data;
  },

  async getNextAction() {
    const response = await api.get('/ai/next-action');
    return response.data.data;
  },

  async checkBurnout() {
    const response = await api.get('/ai/burnout-check');
    return response.data.data;
  },

  async simulateDeadlineChange(taskId, newDate) {
    const response = await api.post('/ai/deadline-simulator', { taskId, newDate });
    return response.data.data;
  },

  async generateWeeklyReport() {
    const response = await api.get('/ai/weekly-report');
    return response.data.data;
  },

  async activateEmergencyMode() {
    const response = await api.post('/ai/emergency-mode', {});
    return response.data.data;
  },

  async chatWithAI(message) {
    const response = await api.post('/ai/chat', { message });
    return response.data.data;
  },
};

export default aiService;
