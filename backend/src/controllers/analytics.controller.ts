import { Response } from 'express';
import Task from '../models/Task.model';
import Deadline from '../models/Deadline.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;

    // Task statistics
    const totalTasks = await Task.countDocuments({ user: userId });
    const completedTasks = await Task.countDocuments({ user: userId, status: 'completed' });
    const pendingTasks = await Task.countDocuments({ user: userId, status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ user: userId, status: 'in-progress' });

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Task by priority
    const tasksByPriority = await Task.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Task by category
    const tasksByCategory = await Task.aggregate([
      { $match: { user: userId, status: 'completed' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCompletions = await Task.countDocuments({
      user: userId,
      status: 'completed',
      updatedAt: { $gte: sevenDaysAgo },
    });

    // Upcoming deadlines
    const upcomingDeadlines = await Deadline.countDocuments({
      user: userId,
      status: 'upcoming',
      dueDate: { $gte: new Date() },
    });

    // Average completion time
    const completedTasksWithTime = await Task.find({
      user: userId,
      status: 'completed',
      updatedAt: { $gte: sevenDaysAgo },
    });

    let avgCompletionTime = 0;
    if (completedTasksWithTime.length > 0) {
      const totalTime = completedTasksWithTime.reduce((sum, task) => {
        const timeDiff = task.updatedAt.getTime() - task.createdAt.getTime();
        return sum + timeDiff;
      }, 0);
      avgCompletionTime = totalTime / completedTasksWithTime.length / (1000 * 60 * 60); // hours
    }

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalTasks,
          completedTasks,
          pendingTasks,
          inProgressTasks,
          completionRate: Math.round(completionRate * 100) / 100,
          recentCompletions,
          upcomingDeadlines,
          avgCompletionTime: Math.round(avgCompletionTime * 100) / 100,
        },
        tasksByPriority: tasksByPriority.map((item) => ({
          priority: item._id,
          count: item.count,
        })),
        tasksByCategory: tasksByCategory.map((item) => ({
          category: item._id,
          count: item.count,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch analytics',
    });
  }
};

export const getWeeklyProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    const weeks = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const completed = await Task.countDocuments({
        user: userId,
        status: 'completed',
        updatedAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const created = await Task.countDocuments({
        user: userId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      weeks.push({
        date: startOfDay.toISOString().split('T')[0],
        completed,
        created,
      });
    }

    res.status(200).json({
      success: true,
      data: weeks,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch weekly progress',
    });
  }
};
