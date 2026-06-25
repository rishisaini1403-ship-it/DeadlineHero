interface TaskData {
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
}

interface ScheduleItem {
  taskId: string;
  title: string;
  scheduledDate: Date;
  estimatedHours: number;
  priority: string;
  reason: string;
}

interface Recommendation {
  type: string;
  message: string;
  priority: 'info' | 'warning' | 'critical';
}

class AIService {
  // Calculate priority score (0-100) based on multiple factors
  calculatePriorityScore(taskData: TaskData): number {
    const now = new Date();
    const dueDate = new Date(taskData.dueDate);
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Factor 1: Time urgency (0-40 points)
    let timeScore = 0;
    if (hoursUntilDue <= 24) {
      timeScore = 40; // Due within 24 hours
    } else if (hoursUntilDue <= 48) {
      timeScore = 35; // Due within 2 days
    } else if (hoursUntilDue <= 72) {
      timeScore = 30; // Due within 3 days
    } else if (hoursUntilDue <= 168) {
      timeScore = 20; // Due within a week
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
    // Larger tasks should start earlier
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
    // This would need access to other tasks, simplified here
    const workloadScore = 5;

    const totalScore = timeScore + priorityScore + effortScore + workloadScore;
    return Math.min(100, Math.round(totalScore));
  }

  // Generate optimal study schedule
  generateOptimalSchedule(tasks: any[]): ScheduleItem[] {
    const now = new Date();
    const schedule: ScheduleItem[] = [];
    let currentDate = new Date(now);

    // Sort tasks by AI priority score
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

    // Distribute tasks across available days
    sortedTasks.forEach((task) => {
      const hoursNeeded = task.estimatedHours || 2;
      const hoursPerDay = Math.min(4, hoursNeeded); // Max 4 hours per task per day
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

  // Generate explanation for why a task is scheduled
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

    // Check for overdue tasks
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

    // Check for tasks due today
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

    // Check for tasks due this week
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

    // Suggest breaking down large tasks
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

    // Encourage balanced workload
    if (tasks.length > 10) {
      recommendations.push({
        type: 'workload',
        message: 'You have many pending tasks. Focus on completing a few before starting new ones.',
        priority: 'info',
      });
    }

    return recommendations;
  }
}

export const aiService = new AIService();
