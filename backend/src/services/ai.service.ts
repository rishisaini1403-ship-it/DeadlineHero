import OpenAI from 'openai';

// Initialize OpenAI client (only if API key is available)
const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here'
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const DEMO_MODE = process.env.AI_DEMO_MODE === 'true' || !openai;

// ==================== Type Definitions ====================

interface TaskData {
  _id?: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
  title?: string;
  description?: string;
  status?: string;
  actualHours?: number;
}

interface ScheduleItem {
  taskId: string;
  title: string;
  scheduledDate: Date;
  estimatedHours: number;
  priority: string;
  reason: string;
  timeSlot?: string;
}

interface Recommendation {
  type: string;
  message: string;
  priority: 'info' | 'warning' | 'critical';
}

interface RiskPrediction {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendation: string;
}

interface Subtask {
  title: string;
  description: string;
  estimatedHours: number;
  order: number;
}

interface TaskBreakdown {
  subtasks: Subtask[];
  totalEstimatedHours: number;
  suggestedOrder: string;
}

interface NextAction {
  taskId: string;
  title: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: string;
}

interface BurnoutReport {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  workloadScore: number;
  deadlinePressure: number;
  recommendations: string[];
  suggestedBreak: string;
}

interface DeadlineSimulation {
  originalRisk: number;
  newRisk: number;
  impactOnOtherTasks: string[];
  workloadChange: number;
  recommendation: string;
}

interface WeeklyReport {
  completedTasks: number;
  missedTasks: number;
  streak: number;
  productivityChange: number;
  achievements: string[];
  insights: string;
  nextWeekFocus: string;
}

interface EmergencyPlan {
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

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ==================== AI Service Class ====================

class AIService {
  // ========== Core AI Methods ==========

  // Calculate deadline risk score
  async calculateDeadlineRisk(task: TaskData, userHistory?: any[]): Promise<RiskPrediction> {
    if (DEMO_MODE) {
      return this.mockRiskPrediction(task);
    }

    try {
      const prompt = `Analyze the risk of missing this deadline:
Task: ${task.title}
Due Date: ${task.dueDate}
Priority: ${task.priority}
Estimated Hours: ${task.estimatedHours}

Provide a risk score (0-100), risk level (low/medium/high/critical), key factors, and a recommendation.
Return JSON format only.`;

      const response = await openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return this.mockRiskPrediction(task);
    }
  }

  // Generate smart daily plan
  async generateDailyPlan(tasks: TaskData[], availableHours: number = 8): Promise<ScheduleItem[]> {
    if (DEMO_MODE) {
      return this.mockDailyPlan(tasks, availableHours);
    }

    try {
      const prompt = `Create an optimal daily schedule for these tasks:
Available Hours: ${availableHours}
Tasks: ${JSON.stringify(tasks.map(t => ({ title: t.title, hours: t.estimatedHours, priority: t.priority, due: t.dueDate })))}

Return a time-blocked schedule in JSON format.`;

      const response = await openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      return JSON.parse(response.choices[0].message.content || '[]');
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return this.mockDailyPlan(tasks, availableHours);
    }
  }

  // Break down task into subtasks
  async breakDownTask(title: string, description: string, estimatedHours: number): Promise<TaskBreakdown> {
    if (DEMO_MODE) {
      return this.mockTaskBreakdown(title, description, estimatedHours);
    }

    try {
      const prompt = `Break down this task into manageable subtasks:
Task: ${title}
Description: ${description}
Total Estimated Hours: ${estimatedHours}

Return JSON with subtasks array, each having title, description, estimatedHours, and order.`;

      const response = await openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return this.mockTaskBreakdown(title, description, estimatedHours);
    }
  }

  // Recommend next action
  async recommendNextAction(tasks: TaskData[], currentTime?: Date): Promise<NextAction> {
    if (DEMO_MODE) {
      return this.mockNextAction(tasks);
    }

    try {
      const prompt = `Based on these pending tasks, what should the user work on NEXT?
Current Time: ${currentTime || new Date()}
Tasks: ${JSON.stringify(tasks.map(t => ({ title: t.title, due: t.dueDate, priority: t.priority, hours: t.estimatedHours })))}

Return JSON with taskId, title, reason, urgency, and estimatedImpact.`;

      const response = await openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return this.mockNextAction(tasks);
    }
  }

  // Detect burnout risk
  async detectBurnout(tasks: TaskData[], deadlines: any[], userStats?: any): Promise<BurnoutReport> {
    if (DEMO_MODE) {
      return this.mockBurnoutDetection(tasks, deadlines);
    }

    try {
      const prompt = `Analyze burnout risk based on:
Total Tasks: ${tasks.length}
Upcoming Deadlines (7 days): ${deadlines.length}
Tasks: ${JSON.stringify(tasks.map(t => ({ title: t.title, due: t.dueDate, hours: t.estimatedHours })))}

Return JSON with riskLevel, workloadScore, deadlinePressure, recommendations array, and suggestedBreak.`;

      const response = await openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return this.mockBurnoutDetection(tasks, deadlines);
    }
  }

  // Simulate deadline change impact
  async simulateDeadlineChange(
    task: TaskData,
    newDate: Date,
    allTasks: TaskData[]
  ): Promise<DeadlineSimulation> {
    if (DEMO_MODE) {
      return this.mockDeadlineSimulation(task, newDate, allTasks);
    }

    try {
      const prompt = `If this deadline is postponed, what's the impact?
Task: ${task.title}
Current Due: ${task.dueDate}
New Due: ${newDate}
Other Tasks: ${allTasks.length} tasks

Return JSON with originalRisk, newRisk, impactOnOtherTasks array, workloadChange percentage, and recommendation.`;

      const response = await openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return this.mockDeadlineSimulation(task, newDate, allTasks);
    }
  }

  // Generate weekly report
  async generateWeeklyReport(stats: any): Promise<WeeklyReport> {
    if (DEMO_MODE) {
      return this.mockWeeklyReport(stats);
    }

    try {
      const prompt = `Generate a weekly productivity report:
${JSON.stringify(stats)}

Return JSON with completedTasks, missedTasks, streak, productivityChange, achievements array, insights, and nextWeekFocus.`;

      const response = await openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return this.mockWeeklyReport(stats);
    }
  }

  // Activate emergency mode
  async activateEmergencyMode(tasks: TaskData[], deadlines: any[]): Promise<EmergencyPlan> {
    if (DEMO_MODE) {
      return this.mockEmergencyMode(tasks, deadlines);
    }

    try {
      const prompt = `EMERGENCY MODE: User has critical deadlines approaching.
Tasks: ${JSON.stringify(tasks.map(t => ({ title: t.title, due: t.dueDate, priority: t.priority, hours: t.estimatedHours })))}

Return JSON with prioritizedTasks array, studyPlan array, and criticalWarning.`;

      const response = await openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return this.mockEmergencyMode(tasks, deadlines);
    }
  }

  // Generate chat response
  async generateChatResponse(message: string, context: any): Promise<string> {
    if (DEMO_MODE) {
      return this.mockChatResponse(message, context);
    }

    try {
      const prompt = `You are DeadlineHero AI Assistant, helping students manage their deadlines.
User Message: ${message}
Context: ${JSON.stringify(context)}

Provide a helpful, actionable response.`;

      const response = await openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      return response.choices[0].message.content || 'I apologize, I could not process your request.';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return this.mockChatResponse(message, context);
    }
  }

  // ========== Legacy Methods (Enhanced) ==========

  // Calculate priority score (0-100) based on multiple factors
  calculatePriorityScore(taskData: TaskData): number {
    const now = new Date();
    const dueDate = new Date(taskData.dueDate);
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Factor 1: Time urgency (0-40 points)
    let timeScore = 0;
    if (hoursUntilDue <= 24) {
      timeScore = 40;
    } else if (hoursUntilDue <= 48) {
      timeScore = 35;
    } else if (hoursUntilDue <= 72) {
      timeScore = 30;
    } else if (hoursUntilDue <= 168) {
      timeScore = 20;
    } else {
      timeScore = Math.max(0, 40 - (hoursUntilDue / 168) * 40);
    }

    // Factor 2: Priority level (0-30 points)
    const priorityScores = {
      low: 5,
      medium: 15,
      high: 25,
      urgent: 30,
    };
    const priorityScore = priorityScores[taskData.priority] || 15;

    // Factor 3: Effort required (0-20 points)
    let effortScore = 0;
    if (taskData.estimatedHours <= 1) {
      effortScore = 5;
    } else if (taskData.estimatedHours <= 3) {
      effortScore = 10;
    } else if (taskData.estimatedHours <= 6) {
      effortScore = 15;
    } else {
      effortScore = 20;
    }

    // Factor 4: Workload balance (0-10 points)
    const workloadScore = 5;

    const totalScore = timeScore + priorityScore + effortScore + workloadScore;
    return Math.min(100, Math.round(totalScore));
  }

  // Generate optimal study schedule
  generateOptimalSchedule(tasks: any[]): ScheduleItem[] {
    const now = new Date();
    const schedule: ScheduleItem[] = [];
    let currentDate = new Date(now);

    const sortedTasks = [...tasks].sort((a, b) => {
      const scoreA = this.calculatePriorityScore({
        dueDate: a.dueDate,
        priority: a.priority,
        estimatedHours: a.estimatedHours,
      });
      const scoreB = this.calculatePriorityScore({
        dueDate: b.dueDate,
        priority: b.priority,
        estimatedHours: b.estimatedHours,
      });
      return scoreB - scoreA;
    });

    sortedTasks.forEach((task) => {
      const hoursNeeded = task.estimatedHours || 2;
      const hoursPerDay = Math.min(4, hoursNeeded);
      let remainingHours = hoursNeeded;

      while (remainingHours > 0) {
        const hoursToSchedule = Math.min(hoursPerDay, remainingHours);
        
        schedule.push({
          taskId: task._id,
          title: task.title,
          scheduledDate: new Date(currentDate),
          estimatedHours: hoursToSchedule,
          priority: task.priority,
          reason: this.generateScheduleReason(task, hoursToSchedule),
        });

        remainingHours -= hoursToSchedule;
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return schedule;
  }

  private generateScheduleReason(task: any, hours: number): string {
    const now = new Date();
    const hoursUntilDue = (new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue <= 24) {
      return 'URGENT: Due within 24 hours';
    } else if (hoursUntilDue <= 48) {
      return 'High priority: Due soon';
    } else if (task.priority === 'urgent' || task.priority === 'high') {
      return `Important task requiring ${hours} hours of focused work`;
    } else if (hours >= 4) {
      return 'Large task - broken into manageable sessions';
    } else {
      return 'Recommended work session';
    }
  }

  // Generate productivity recommendations
  getProductivityRecommendations(tasks: any[]): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const now = new Date();

    const overdueTasks = tasks.filter(
      (task) => new Date(task.dueDate) < now && task.status !== 'completed'
    );
    if (overdueTasks.length > 0) {
      recommendations.push({
        type: 'overdue',
        message: `You have ${overdueTasks.length} overdue task(s). Prioritize these immediately!`,
        priority: 'critical',
      });
    }

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const dueToday = tasks.filter(
      (task) => new Date(task.dueDate) <= todayEnd && task.status !== 'completed'
    );
    if (dueToday.length > 0) {
      recommendations.push({
        type: 'due-today',
        message: `${dueToday.length} task(s) due today. Stay focused!`,
        priority: 'warning',
      });
    }

    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const dueThisWeek = tasks.filter(
      (task) => {
        const dueDate = new Date(task.dueDate);
        return dueDate > todayEnd && dueDate <= weekEnd && task.status !== 'completed';
      }
    );
    if (dueThisWeek.length > 3) {
      recommendations.push({
        type: 'heavy-week',
        message: `You have ${dueThisWeek.length} tasks due this week. Plan your time wisely!`,
        priority: 'warning',
      });
    }

    const largeTasks = tasks.filter(
      (task) => task.estimatedHours >= 6 && task.status !== 'completed'
    );
    if (largeTasks.length > 0) {
      recommendations.push({
        type: 'break-down',
        message: 'Consider breaking down large tasks into smaller, manageable chunks.',
        priority: 'info',
      });
    }

    if (tasks.length > 10) {
      recommendations.push({
        type: 'workload',
        message: 'You have many pending tasks. Focus on completing a few before starting new ones.',
        priority: 'info',
      });
    }

    return recommendations;
  }

  // ========== Mock Data for Demo Mode ==========

  private mockRiskPrediction(task: TaskData): RiskPrediction {
    const now = new Date();
    const hoursUntilDue = (new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let riskScore = 0;
    const factors: string[] = [];

    if (hoursUntilDue < 24) {
      riskScore = 85;
      factors.push('Less than 24 hours until deadline');
    } else if (hoursUntilDue < 48) {
      riskScore = 65;
      factors.push('Deadline within 2 days');
    } else if (hoursUntilDue < 72) {
      riskScore = 45;
      factors.push('Deadline within 3 days');
    } else {
      riskScore = 25;
      factors.push('Sufficient time remaining');
    }

    if (task.estimatedHours > 10) {
      riskScore += 15;
      factors.push('Large task requiring significant time');
    }

    if (task.priority === 'urgent' || task.priority === 'high') {
      riskScore += 10;
      factors.push('High priority task');
    }

    riskScore = Math.min(100, riskScore);

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (riskScore > 75) riskLevel = 'critical';
    else if (riskScore > 50) riskLevel = 'high';
    else if (riskScore > 25) riskLevel = 'medium';

    return {
      riskScore,
      riskLevel,
      factors,
      recommendation: riskScore > 50 
        ? 'Start working on this task immediately. Consider breaking it into smaller chunks.'
        : 'You have time, but don\'t procrastinate. Start planning your approach.',
    };
  }

  private mockDailyPlan(tasks: TaskData[], availableHours: number): ScheduleItem[] {
    const sorted = [...tasks].sort((a, b) => {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }).slice(0, 5);

    const schedule: ScheduleItem[] = [];
    let currentHour = 9; // Start at 9 AM

    sorted.forEach((task) => {
      const hours = Math.min(task.estimatedHours, 3);
      schedule.push({
        taskId: task._id || '',
        title: task.title || 'Untitled Task',
        scheduledDate: new Date(),
        estimatedHours: hours,
        priority: task.priority,
        timeSlot: `${currentHour}:00 - ${currentHour + hours}:00`,
        reason: hours > 2 ? 'Deep work session' : 'Focused work block',
      });
      currentHour += hours + 1; // 1 hour break
    });

    return schedule;
  }

  private mockTaskBreakdown(title: string, description: string, estimatedHours: number): TaskBreakdown {
    const subtasks: Subtask[] = [
      { title: 'Research & Planning', description: 'Gather requirements and plan approach', estimatedHours: Math.round(estimatedHours * 0.2), order: 1 },
      { title: 'Design & Architecture', description: 'Create design and structure', estimatedHours: Math.round(estimatedHours * 0.2), order: 2 },
      { title: 'Core Implementation', description: 'Build the main functionality', estimatedHours: Math.round(estimatedHours * 0.3), order: 3 },
      { title: 'Testing & Debugging', description: 'Test thoroughly and fix issues', estimatedHours: Math.round(estimatedHours * 0.2), order: 4 },
      { title: 'Documentation & Polish', description: 'Write docs and finalize', estimatedHours: Math.round(estimatedHours * 0.1), order: 5 },
    ];

    return {
      subtasks,
      totalEstimatedHours: estimatedHours,
      suggestedOrder: 'sequential',
    };
  }

  private mockNextAction(tasks: TaskData[]): NextAction {
    const now = new Date();
    const urgent = tasks
      .filter(t => t.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

    if (!urgent) {
      return {
        taskId: '',
        title: 'No pending tasks',
        reason: 'All caught up! Great job!',
        urgency: 'low',
        estimatedImpact: 'N/A',
      };
    }

    const hoursUntilDue = (new Date(urgent.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60);

    return {
      taskId: urgent._id || '',
      title: urgent.title || 'Untitled Task',
      reason: hoursUntilDue < 24 
        ? 'Due in less than 24 hours - this is your top priority!'
        : `Due in ${Math.round(hoursUntilDue / 24)} days - start now to avoid last-minute stress`,
      urgency: hoursUntilDue < 24 ? 'critical' : hoursUntilDue < 48 ? 'high' : 'medium',
      estimatedImpact: `Completing this will reduce your stress and free up time for other tasks`,
    };
  }

  private mockBurnoutDetection(tasks: TaskData[], deadlines: any[]): BurnoutReport {
    const weekDeadlines = deadlines.filter(d => {
      const daysUntil = (new Date(d.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntil <= 7;
    });

    const workloadScore = Math.min(100, (tasks.length * 5) + (weekDeadlines.length * 10));
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (workloadScore > 80) riskLevel = 'critical';
    else if (workloadScore > 60) riskLevel = 'high';
    else if (workloadScore > 40) riskLevel = 'medium';

    const recommendations: string[] = [];
    if (weekDeadlines.length > 5) {
      recommendations.push('You have too many deadlines this week. Prioritize ruthlessly.');
    }
    if (tasks.length > 10) {
      recommendations.push('Focus on completing existing tasks before taking on new ones.');
    }
    recommendations.push('Take regular breaks - use the Pomodoro technique (25 min work, 5 min break)');
    recommendations.push('Get at least 7-8 hours of sleep - it improves productivity');

    return {
      riskLevel,
      workloadScore,
      deadlinePressure: weekDeadlines.length,
      recommendations,
      suggestedBreak: 'Take a 30-minute break tonight. Go for a walk, meditate, or do something you enjoy.',
    };
  }

  private mockDeadlineSimulation(task: TaskData, newDate: Date, allTasks: TaskData[]): DeadlineSimulation {
    const originalDays = (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    const newDays = (newDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    const delay = newDays - originalDays;

    const originalRisk = Math.min(100, Math.max(0, 50 - originalDays * 5));
    const newRisk = Math.min(100, Math.max(0, 50 - newDays * 5));

    const impactOnOtherTasks: string[] = [];
    if (delay > 2) {
      impactOnOtherTasks.push('Other deadlines may become higher priority');
      impactOnOtherTasks.push(`Workload increases by ${Math.round(delay * 10)}%`);
    }

    return {
      originalRisk,
      newRisk,
      impactOnOtherTasks,
      workloadChange: Math.round(delay * 10),
      recommendation: delay > 3 
        ? 'Warning: Significant delay may create a bottleneck. Only postpone if absolutely necessary.'
        : 'Small delay is manageable. Use the extra time wisely.',
    };
  }

  private mockWeeklyReport(stats: any): WeeklyReport {
    return {
      completedTasks: stats.completedTasks || 8,
      missedTasks: stats.missedTasks || 1,
      streak: stats.streak || 5,
      productivityChange: 18,
      achievements: [
        '🔥 Maintained a 5-day streak!',
        '✅ Completed 8 tasks this week',
        '📈 Productivity increased by 18%',
      ],
      insights: 'You performed well this week! Your consistency is paying off. Focus on reducing missed deadlines next week.',
      nextWeekFocus: 'Aim to complete 10+ tasks and maintain your streak. Consider using Focus Mode for deep work sessions.',
    };
  }

  private mockEmergencyMode(tasks: TaskData[], deadlines: any[]): EmergencyPlan {
    const sorted = [...tasks]
      .filter(t => t.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    return {
      prioritizedTasks: sorted.map((task, index) => ({
        taskId: task._id || '',
        title: task.title || `Task ${index + 1}`,
        priority: index + 1,
        timeAllocation: `${Math.max(1, Math.round(task.estimatedHours))} hours`,
        reason: index === 0 ? 'Most urgent - due soonest' : `Priority #${index + 1}`,
      })),
      studyPlan: [
        '1. Eliminate all distractions (phone, social media)',
        '2. Use Pomodoro technique: 25 min work, 5 min break',
        '3. Focus ONLY on the task at hand',
        '4. Skip perfection - aim for completion',
        '5. Take care of basics: eat, hydrate, sleep',
      ],
      criticalWarning: '🚨 EMERGENCY MODE ACTIVATED: Focus on survival, not perfection. Complete what you can, then reassess.',
    };
  }

  private mockChatResponse(message: string, context: any): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('schedule') || lowerMessage.includes('plan')) {
      return 'I recommend using the Smart Daily Planner feature! It will automatically create an optimal schedule based on your pending tasks and available time. Would you like me to generate one for you?';
    }

    if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelm') || lowerMessage.includes('burnout')) {
      return 'It sounds like you might be experiencing high workload pressure. I suggest: 1) Try the Burnout Detector to assess your risk, 2) Use Emergency Mode if deadlines are critical, 3) Remember to take breaks - your health comes first!';
    }

    if (lowerMessage.includes('break') || lowerMessage.includes('split') || lowerMessage.includes('divide')) {
      return 'Great idea! Use the AI Task Breakdown feature on any task. Just click the "Break Down" button, and I\'ll split it into manageable subtasks with estimated time for each.';
    }

    if (lowerMessage.includes('what should i do') || lowerMessage.includes('where to start') || lowerMessage.includes('next')) {
      return 'Click the "What Should I Do Next?" button on your Dashboard! I\'ll analyze all your tasks and recommend the most important one to work on right now, based on deadlines, priority, and your current workload.';
    }

    if (lowerMessage.includes('risk') || lowerMessage.includes('miss') || lowerMessage.includes('deadline')) {
      return 'I can predict your risk of missing any deadline! Each task shows a risk score. Green = safe, Yellow = caution, Red = critical. Check your Tasks page or ask me about a specific task.';
    }

    return 'I\'m here to help you manage your deadlines! You can ask me about: scheduling tasks, breaking down large projects, managing stress, prioritizing work, or predicting deadline risks. What would you like help with?';
  }
}

export const aiService = new AIService();
 