import { Response } from 'express';
import Task from '../models/Task.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { aiService } from '../services/ai.service';
import { gamificationService } from '../services/gamification.service';
import User from '../models/User.model';

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const taskData = {
      ...req.body,
      user: req.user._id,
    };

    // Calculate AI priority score
    const priorityScore = aiService.calculatePriorityScore(taskData);
    taskData.aiPriorityScore = priorityScore;

    const task = await Task.create(taskData);

    // Award points for creating a task
    await gamificationService.addPoints(req.user._id.toString(), 5);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create task',
    });
  }
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, category, sortBy = 'dueDate', order = 'asc' } = req.query;

    const filter: any = { user: req.user._id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const sort: any = {};
    sort[sortBy as string] = order === 'desc' ? -1 : 1;

    const tasks = await Task.find(filter).sort(sort);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch tasks',
    });
  }
};

export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch task',
    });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    // Handle completedAt timestamp
    const newStatus = req.body.status;
    if (newStatus !== undefined && newStatus !== task.status) {
      if (newStatus === 'completed') {
        task.completedAt = new Date();
      } else if (task.status === 'completed') {
        task.completedAt = null;
      }
    }

    // Award points if task is being completed
    if (req.body.status === 'completed' && task.status !== 'completed') {
      await gamificationService.addPoints(req.user._id.toString(), 20);
      await gamificationService.updateStreak(req.user._id.toString());
    }

    Object.assign(task, req.body);
    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update task',
    });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete task',
    });
  }
};

export const getRecommendedTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      status: { $in: ['pending', 'in-progress'] },
    }).sort({ aiPriorityScore: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch recommended tasks',
    });
  }
};
