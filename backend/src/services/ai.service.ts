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
        reason: this.generatePlanReason(task, hours),
      });
      currentHour += hours + 1; // 1 hour break
    });

    return schedule;
  }

  private generatePlanReason(task: TaskData, hours: number): string {
    const now = new Date();
    const hoursUntilDue = (new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60);
    const title = task.title || 'this task';

    if (hoursUntilDue <= 24) {
      return `URGENT: "${title}" is due within 24 hours — complete now!`;
    } else if (hoursUntilDue <= 48) {
      return `"${title}" due soon — allocate ${hours}h to stay on track`;
    } else if (task.priority === 'urgent' || task.priority === 'high') {
      return `High-priority: "${title}" needs ${hours}h of focused work`;
    } else if (hours >= 3) {
      return `Deep work on "${title}" — ${hours}h block for meaningful progress`;
    } else {
      return `Quick session on "${title}" — ${hours}h to move forward`;
    }
  }

  private mockTaskBreakdown(title: string, description: string, estimatedHours: number): TaskBreakdown {
    const lowerTitle = title.toLowerCase();
    const lowerDesc = description.toLowerCase();
    const isCoding = /code|program|develop|build|implement|api|database|backend|frontend|app|website|script/.test(lowerTitle + lowerDesc);
    const isWriting = /write|essay|report|paper|article|blog|document|read/.test(lowerTitle + lowerDesc);
    const isStudying = /study|learn|review|exam|quiz|test|chapter|lecture|note/.test(lowerTitle + lowerDesc);
    const isDesign = /design|ui|ux|figma|prototype|wireframe|mockup/.test(lowerTitle + lowerDesc);
    const isResearch = /research|investigate|analyze|survey|literature|data/.test(lowerTitle + lowerDesc);

    const subtasks: Subtask[] = [];
    let order = 1;

    if (isCoding) {
      subtasks.push(
        { title: 'Requirements & Setup', description: 'Define scope, set up repo/environment', estimatedHours: Math.round(estimatedHours * 0.15), order: order++ },
        { title: 'Core Logic Implementation', description: 'Write the main algorithms and business logic', estimatedHours: Math.round(estimatedHours * 0.4), order: order++ },
        { title: 'Integration & API', description: 'Connect components, build endpoints', estimatedHours: Math.round(estimatedHours * 0.2), order: order++ },
        { title: 'Testing & Debugging', description: 'Write tests, fix bugs, verify edge cases', estimatedHours: Math.round(estimatedHours * 0.15), order: order++ },
        { title: 'Code Review & Deploy', description: 'Final review, documentation, deployment', estimatedHours: Math.round(estimatedHours * 0.1), order: order++ }
      );
    } else if (isWriting) {
      subtasks.push(
        { title: 'Outline & Research', description: 'Create structure, gather sources', estimatedHours: Math.round(estimatedHours * 0.25), order: order++ },
        { title: 'First Draft', description: 'Write the main content without editing', estimatedHours: Math.round(estimatedHours * 0.4), order: order++ },
        { title: 'Revision & Editing', description: 'Improve clarity, flow, and arguments', estimatedHours: Math.round(estimatedHours * 0.2), order: order++ },
        { title: 'Proofreading', description: 'Check grammar, citations, formatting', estimatedHours: Math.round(estimatedHours * 0.1), order: order++ },
        { title: 'Final Polish', description: 'Final review and submission prep', estimatedHours: Math.round(estimatedHours * 0.05), order: order++ }
      );
    } else if (isStudying) {
      subtasks.push(
        { title: 'Gather Materials', description: 'Collect notes, textbooks, resources', estimatedHours: Math.round(estimatedHours * 0.1), order: order++ },
        { title: 'Active Review Sessions', description: 'Spaced repetition, practice problems', estimatedHours: Math.round(estimatedHours * 0.5), order: order++ },
        { title: 'Mock Tests/Quizzes', description: 'Simulate exam conditions, identify gaps', estimatedHours: Math.round(estimatedHours * 0.2), order: order++ },
        { title: 'Weak Area Focus', description: 'Deep dive into problem topics', estimatedHours: Math.round(estimatedHours * 0.15), order: order++ },
        { title: 'Final Review', description: 'Quick recap of key concepts', estimatedHours: Math.round(estimatedHours * 0.05), order: order++ }
      );
    } else if (isDesign) {
      subtasks.push(
        { title: 'Requirements & Inspiration', description: 'Understand brief, collect references', estimatedHours: Math.round(estimatedHours * 0.15), order: order++ },
        { title: 'Wireframes & Concepts', description: 'Low-fidelity layouts and explorations', estimatedHours: Math.round(estimatedHours * 0.25), order: order++ },
        { title: 'High-Fidelity Design', description: 'Detailed mockups, design system', estimatedHours: Math.round(estimatedHours * 0.35), order: order++ },
        { title: 'Prototype & Feedback', description: 'Interactive prototype, stakeholder review', estimatedHours: Math.round(estimatedHours * 0.15), order: order++ },
        { title: 'Handoff Assets', description: 'Export specs, components, documentation', estimatedHours: Math.round(estimatedHours * 0.1), order: order++ }
      );
    } else if (isResearch) {
      subtasks.push(
        { title: 'Define Research Questions', description: 'Clarify scope and objectives', estimatedHours: Math.round(estimatedHours * 0.1), order: order++ },
        { title: 'Literature Search', description: 'Find and collect relevant sources', estimatedHours: Math.round(estimatedHours * 0.3), order: order++ },
        { title: 'Analysis & Synthesis', description: 'Extract insights, compare findings', estimatedHours: Math.round(estimatedHours * 0.35), order: order++ },
        { title: 'Draft Report', description: 'Structure findings and arguments', estimatedHours: Math.round(estimatedHours * 0.15), order: order++ },
        { title: 'Finalize & Cite', description: 'Polish, format references, submit', estimatedHours: Math.round(estimatedHours * 0.1), order: order++ }
      );
    } else {
      // Generic fallback — but still varied based on hours
      const steps = estimatedHours > 6 ? 5 : estimatedHours > 3 ? 4 : 3;
      const baseHours = Math.floor(estimatedHours / steps);
      const remainder = estimatedHours % steps;
      const genericSteps = [
        { title: 'Planning & Preparation', description: 'Break down the task and gather resources' },
        { title: 'Execution Phase 1', description: 'Complete the first major portion' },
        { title: 'Execution Phase 2', description: 'Continue and complete the work' },
        { title: 'Review & Refine', description: 'Check quality and make improvements' },
        { title: 'Finalize & Deliver', description: 'Wrap up and submit/complete' }
      ];
      for (let i = 0; i < steps; i++) {
        subtasks.push({
          title: genericSteps[i].title,
          description: genericSteps[i].description,
          estimatedHours: baseHours + (i < remainder ? 1 : 0),
          order: order++
        });
      }
    }

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
    const completed = stats.completedTasks || 0;
    const missed = stats.missedTasks || 0;
    const streak = stats.streak || 0;
    const total = completed + missed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const productivityChange = Math.round((completed - missed) * 2.5); // rough heuristic

    let insights = '';
    let nextWeekFocus = '';
    const achievements: string[] = [];

    // Dynamic achievements
    if (streak >= 7) achievements.push(`🔥 Amazing ${streak}-day streak!`);
    else if (streak >= 3) achievements.push(`🔥 ${streak}-day streak maintained`);
    if (completed >= 10) achievements.push(`✅ Completed ${completed} tasks this week`);
    else if (completed >= 5) achievements.push(`✅ Completed ${completed} tasks this week`);
    else if (completed > 0) achievements.push(`✅ Finished ${completed} task${completed === 1 ? '' : 's'}`);
    if (missed === 0 && completed > 0) achievements.push('🎯 Zero missed deadlines!');
    if (completionRate >= 90) achievements.push(`📈 ${completionRate}% completion rate`);
    if (streak > (stats.prevStreak || 0)) achievements.push('📈 Streak increased!');

    // Dynamic insights
    if (completed === 0) {
      insights = 'No tasks completed this week. Consider setting smaller, achievable goals to build momentum.';
      nextWeekFocus = 'Start with just 1-2 small tasks daily. Consistency beats intensity.';
    } else if (missed > completed) {
      insights = `You completed ${completed} but missed ${missed} tasks. Overcommitment may be the issue.`;
      nextWeekFocus = 'Prioritize ruthlessly — do fewer things, but finish them. Use the Risk Predictor.';
    } else if (missed > 0) {
      insights = `Good progress with ${completed} done, but ${missed} slipped. Identify what blocked them.`;
      nextWeekFocus = 'Review missed tasks — reschedule or delegate. Aim for zero misses next week.';
    } else if (completionRate >= 90 && completed >= 5) {
      insights = `Excellent week! ${completed} completed, zero missed. Your planning is working.`;
      nextWeekFocus = 'Maintain this rhythm. Try Focus Mode for deep work on complex tasks.';
    } else {
      insights = `Solid week: ${completed} tasks done${missed > 0 ? `, ${missed} missed` : ''}. Consistency is building.`;
      nextWeekFocus = `Aim for ${Math.max(completed + 2, 5)}+ tasks next week. Keep the streak alive!`;
    }

    return {
      completedTasks: completed,
      missedTasks: missed,
      streak,
      productivityChange: Math.max(-50, Math.min(50, productivityChange)),
      achievements,
      insights,
      nextWeekFocus,
    };
  }

  private mockEmergencyMode(tasks: TaskData[], deadlines: any[]): EmergencyPlan {
    const sorted = [...tasks]
      .filter(t => t.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    const prioritizedTasks = sorted.map((task, index) => ({
      taskId: task._id || '',
      title: task.title || `Task ${index + 1}`,
      priority: index + 1,
      timeAllocation: `${Math.max(1, Math.round(task.estimatedHours))} hours`,
      reason: index === 0 ? 'Most urgent - due soonest' : `Priority #${index + 1}`,
    }));

    // Build contextual study plan
    const studyPlan: string[] = [];
    const urgentCount = tasks.filter(t => {
      const h = (new Date(t.dueDate).getTime() - Date.now()) / (1000 * 60 * 60);
      return h <= 48 && t.status !== 'completed';
    }).length;
    const totalHours = tasks
      .filter(t => t.status !== 'completed')
      .reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    studyPlan.push('1. 🚫 Eliminate distractions — phone on Do Not Disturb, close extra tabs');
    studyPlan.push('2. ⏱️ Use Pomodoro: 25 min focus, 5 min break — repeat 4x then 30 min break');

    if (urgentCount > 0) {
      studyPlan.push(`3. 🔴 ${urgentCount} task${urgentCount === 1 ? ' is' : 's are'} due within 48h — do these FIRST, nothing else`);
    } else {
      studyPlan.push('3. 🎯 Pick the single most important task and finish it before moving on');
    }

    if (totalHours > 20) {
      studyPlan.push('4. ⚡ Workload is high — skip perfection, aim for "good enough" on each task');
    } else {
      studyPlan.push('4. 📝 Break each task into 1-2 hour chunks — crossing off builds momentum');
    }

    studyPlan.push('5. 💧 Basics: hydrate, eat protein, 20-min walk, sleep 7h — you cannot skip these');

    return {
      prioritizedTasks,
      studyPlan,
      criticalWarning: '🚨 EMERGENCY MODE ACTIVATED: Focus on survival, not perfection. Complete what you can, then reassess.',
    };
  }

  private mockChatResponse(message: string, context: any): string {
    const lowerMessage = message.toLowerCase();
    const pending = context?.pendingTasks || 0;
    const upcoming = context?.upcomingDeadlines || 0;
    const streak = context?.userStreak || 0;
    const level = context?.userLevel || 1;

    // Context-aware greeting for first-time/empty state
    if (pending === 0 && upcoming === 0) {
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return `Hey! 👋 You're all caught up — no pending tasks or upcoming deadlines. Enjoy the calm! Want help planning ahead or setting up a new project?`;
      }
      return `You're currently task-free! 🎉 No pending work, no looming deadlines. Perfect time to plan a new project or just relax. What would you like to do?`;
    }

    // Schedule/planning — now context-aware
    if (lowerMessage.includes('schedule') || lowerMessage.includes('plan') || lowerMessage.includes('today')) {
      if (pending > 0) {
        return `You have ${pending} pending task${pending === 1 ? '' : 's'} and ${upcoming} upcoming deadline${upcoming === 1 ? '' : 's'}. The Smart Daily Planner can create a time-blocked schedule for your available hours. Want me to generate one?`;
      }
      return 'No pending tasks to schedule! You\'re free to plan something new or take a break.';
    }

    // Stress/burnout — context-aware
    if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelm') || lowerMessage.includes('burnout') || lowerMessage.includes('anxious')) {
      if (upcoming > 5) {
        return `I see ${upcoming} deadlines this week and ${pending} active tasks — that IS a lot. Try: 1) Burnout Detector to quantify risk, 2) Emergency Mode if things are critical, 3) Even 10 min breaks help. Your streak of ${streak} days shows you can handle pressure!`;
      }
      if (pending > 8) {
        return `With ${pending} tasks in progress, it's easy to feel scattered. Consider: 1) Emergency Mode to ruthlessly prioritize, 2) Break down the largest task, 3) Your Level ${level} streak of ${streak} days proves consistency works.`;
      }
      return 'Feeling overwhelmed is normal. Quick wins: 1) Write down everything, 2) Pick ONE thing to finish now, 3) Use Pomodoro (25/5). You\'ve maintained a ' + streak + '-day streak — you\'re more capable than you know!';
    }

    // Break down tasks
    if (lowerMessage.includes('break') || lowerMessage.includes('split') || lowerMessage.includes('divide') || lowerMessage.includes('subtask')) {
      if (pending > 0) {
        return `You have ${pending} task${pending === 1 ? '' : 's'} that could be broken down. The AI Task Breakdown works best on tasks 3+ hours — it creates tailored subtasks (e.g., coding tasks get "Setup → Core Logic → Testing", writing gets "Outline → Draft → Edit"). Which task should I break down?`;
      }
      return 'No tasks to break down right now! Create a task first, then I can help split it into manageable pieces.';
    }

    // Next action / what to do
    if (lowerMessage.includes('what should i do') || lowerMessage.includes('where to start') || lowerMessage.includes('next') || lowerMessage.includes('priority')) {
      if (pending > 0) {
        return `Click "What Should I Do Next?" on your Dashboard — I'll analyze your ${pending} pending task${pending === 1 ? '' : 's'} (${upcoming} deadline${upcoming === 1 ? '' : 's'} this week) and recommend the single most impactful task based on urgency, priority, and your current workload.`;
      }
      return 'Nothing pending! You\'re free to start something new or enjoy the break.';
    }

    // Risk/deadline
    if (lowerMessage.includes('risk') || lowerMessage.includes('miss') || lowerMessage.includes('deadline') || lowerMessage.includes('late')) {
      if (upcoming > 0) {
        return `You have ${upcoming} upcoming deadline${upcoming === 1 ? '' : 's'} and ${pending} active tasks. Each task shows a risk score (Green=safe, Yellow=caution, Red=critical). The Risk Predictor analyzes due date, priority, and effort. Want me to check a specific task?`;
      }
      return 'No upcoming deadlines to worry about! 🎉 All clear on the risk front.';
    }

    // Weekly report
    if (lowerMessage.includes('week') || lowerMessage.includes('report') || lowerMessage.includes('progress') || lowerMessage.includes('how am i')) {
      return `Your weekly report shows: streak ${streak}, level ${level}, ${pending} active tasks, ${upcoming} deadlines this week. The full Weekly Report gives completion rate, achievements, and next week's focus. Want me to generate it?`;
    }

    // Motivational / general
    if (lowerMessage.includes('motivat') || lowerMessage.includes('encourag') || lowerMessage.includes('good job') || lowerMessage.includes('proud')) {
      if (streak >= 7) return `🔥 ${streak}-day streak! That's serious consistency. Level ${level} and climbing. Keep protecting that streak — it's your superpower.`;
      if (streak >= 3) return `Nice! ${streak} days in a row at Level ${level}. Momentum is real — one day at a time.`;
      return `Every expert started as a beginner. Your Level ${level} journey with a ${streak}-day streak is building something real. What's the next small win?`;
    }

    // Default — context-aware
    return `I'm your DeadlineHero AI! Right now you have ${pending} pending task${pending === 1 ? '' : 's'} and ${upcoming} deadline${upcoming === 1 ? '' : 's'} this week (streak: ${streak}, level: ${level}). Ask me about: planning your day, breaking down a task, checking risks, managing overwhelm, or your weekly progress. What helps most right now?`;
  }
}

export const aiService = new AIService();
 