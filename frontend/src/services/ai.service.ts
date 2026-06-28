import api from './api';

// ==================== Type Definitions ====================

export interface RiskPrediction {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendation: string;
}

export interface ScheduleItem {
  taskId: string;
  title: string;
  scheduledDate: Date;
  estimatedHours: number;
  priority: string;
  reason: string;
  timeSlot?: string;
}

export interface Subtask {
  title: string;
  description: string;
  estimatedHours: number;
  order: number;
}

export interface TaskBreakdown {
  subtasks: Subtask[];
  totalEstimatedHours: number;
  suggestedOrder: string;
}

export interface NextAction {
  taskId: string;
  title: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: string;
}

export interface BurnoutReport {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  workloadScore: number;
  deadlinePressure: number;
  recommendations: string[];
  suggestedBreak: string;
}

export interface DeadlineSimulation {
  originalRisk: number;
  newRisk: number;
  impactOnOtherTasks: string[];
  workloadChange: number;
  recommendation: string;
}

export interface WeeklyReport {
  completedTasks: number;
  missedTasks: number;
  streak: number;
  productivityChange: number;
  achievements: string[];
  insights: string;
  nextWeekFocus: string;
}

export interface EmergencyPlan {
  prioritizedTasks: Array<{
    taskId: string;
    title: string;
    priority: number;
    timeAllocation: string;
    reason: string;
  }>;
  studyPlan: string[];
  criticalWarning: string;
}

export interface ChatResponse {
  message: string;
  context: any;
}

// ==================== AI Service API Methods ====================

const aiService = {
  // Calculate deadline risk
  async calculateRisk(taskId: string): Promise<RiskPrediction> {
    const response = await api.post('/ai/risk-predictor', { taskId });
    return response.data.data;
  },

  // Generate daily plan
  async generateDailyPlan(availableHours: number = 8): Promise<ScheduleItem[]> {
    const response = await api.post('/ai/daily-plan', { availableHours });
    return response.data.data;
  },

  // Break down task into subtasks
  async breakdownTask(taskId: string): Promise<{ breakdown: TaskBreakdown; task: any }> {
    const response = await api.post('/ai/breakdown-task', { taskId });
    return response.data.data;
  },

  // Get next action recommendation
  async getNextAction(): Promise<NextAction> {
    const response = await api.get('/ai/next-action');
    return response.data.data;
  },

  // Check burnout risk
  async checkBurnout(): Promise<BurnoutReport> {
    const response = await api.get('/ai/burnout-check');
    return response.data.data;
  },

  // Simulate deadline change
  async simulateDeadlineChange(taskId: string, newDate: string): Promise<DeadlineSimulation> {
    const response = await api.post('/ai/deadline-simulator', { taskId, newDate });
    return response.data.data;
  },

  // Generate weekly report
  async generateWeeklyReport(): Promise<WeeklyReport> {
    const response = await api.get('/ai/weekly-report');
    return response.data.data;
  },

  // Activate emergency mode
  async activateEmergencyMode(): Promise<EmergencyPlan> {
    const response = await api.post('/ai/emergency-mode', {});
    return response.data.data;
  },

  // Chat with AI assistant
  async chatWithAI(message: string): Promise<ChatResponse> {
    const response = await api.post('/ai/chat', { message });
    return response.data.data;
  },
};

export default aiService;
