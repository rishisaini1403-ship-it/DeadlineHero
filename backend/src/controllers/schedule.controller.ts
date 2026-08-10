import { Response } from 'express';
import Task from '../models/Task.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { aiService } from '../services/ai.service';

export const generateSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pendingTasks = await Task.find({
      user: req.user._id,
      status: { $in: ['pending', 'in-progress'] },
    }).sort({ dueDate: 1 });

    if (pendingTasks.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No pending tasks to schedule',
        data: { schedule: [], recommendations: [] },
      });
      return;
    }

    const schedule = aiService.generateOptimalSchedule(pendingTasks);
    const recommendations = aiService.getProductivityRecommendations(pendingTasks);

    res.status(200).json({
      success: true,
      data: {
        schedule,
        recommendations,
        totalTasks: pendingTasks.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate schedule',
    });
  }
};

export const prioritizeTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      status: { $in: ['pending', 'in-progress'] },
    });

    const prioritizedTasks = tasks.map((task) => {
      const priorityScore = aiService.calculatePriorityScore({
        dueDate: task.dueDate,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
      });

      return {
        ...task.toObject(),
        aiPriorityScore: priorityScore,
      };
    });

    prioritizedTasks.sort((a, b) => b.aiPriorityScore - a.aiPriorityScore);

    // Update tasks with new AI scores
    await Promise.all(
      prioritizedTasks.map((task) =>
        Task.findByIdAndUpdate(task._id, { aiPriorityScore: task.aiPriorityScore })
      )
    );

    res.status(200).json({
      success: true,
      count: prioritizedTasks.length,
      data: prioritizedTasks,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to prioritize tasks',
    });
  }
};
