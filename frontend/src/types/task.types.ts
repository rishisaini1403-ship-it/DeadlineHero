export interface Task {
  _id: string;
  user: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'archived';
  category: string;
  estimatedHours: number;
  actualHours: number;
  dueDate: string;
  tags: string[];
  aiRecommended: boolean;
  aiPriorityScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Deadline {
  _id: string;
  user: string;
  title: string;
  description: string;
  dueDate: string;
  reminderSent: boolean;
  reminderTime?: string;
  status: 'upcoming' | 'missed' | 'completed';
  relatedTasks: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  estimatedHours?: number;
  dueDate: string;
  tags?: string[];
}

export interface CreateDeadlineInput {
  title: string;
  description?: string;
  dueDate: string;
  relatedTasks?: string[];
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  category?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface AnalyticsData {
  overview: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completionRate: number;
    recentCompletions: number;
    upcomingDeadlines: number;
    avgCompletionTime: number;
  };
  tasksByPriority: Array<{
    priority: string;
    count: number;
  }>;
  tasksByCategory: Array<{
    category: string;
    count: number;
  }>;
}

export interface WeeklyProgress {
  date: string;
  completed: number;
  created: number;
}
