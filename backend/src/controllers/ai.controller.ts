import { Response } from 'express';
import Task from '../models/Task.model';
import Deadline from '../models/Deadline.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { aiService, buildUpcomingDeadlineContext } from '../services/ai.service';

// Risk Predictor
export const calculateRisk = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.body;
    
    const task = await Task.findOne({
      _id: taskId,
      user: req.user._id,
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    console.log("Task found:", task);
    const riskPrediction = await aiService.calculateDeadlineRisk({
      _id: task._id,
      dueDate: task.dueDate,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
      title: task.title,
      description: task.description,
      status: task.status,
    });

    // Update task with risk data
    task.riskScore = riskPrediction.riskScore;
    task.riskFactors = riskPrediction.factors;
    await task.save();

    res.status(200).json({
      success: true,
      data: riskPrediction,
    });
  } catch (error: any) {
  console.error("========== RISK ERROR ==========");
  console.error(error);
  console.error(error.stack);

  res.status(500).json({
    success: false,
    message: error.message || 'Failed to calculate risk',
  });
  }
};

// Daily Planner
export const generateDailyPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { availableHours } = req.body;
    
    const tasks = await Task.find({
      user: req.user._id,
      status: { $in: ['pending', 'in-progress'] },
    });

    const dailyPlan = await aiService.generateDailyPlan(
      tasks.map(t => ({
        _id: t._id,
        dueDate: t.dueDate,
        priority: t.priority,
        estimatedHours: t.estimatedHours,
        title: t.title,
      })),
      availableHours || 8
    );

    res.status(200).json({
      success: true,
      data: dailyPlan,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate daily plan',
    });
  }
};

// Task Breakdown
export const breakdownTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.body;
    
    const task = await Task.findOne({
      _id: taskId,
      user: req.user._id,
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    console.log("Task found:", task);
    const breakdown = await aiService.breakDownTask(
      task.title,
      task.description,
      task.estimatedHours
    );

    // Update task with subtasks
    task.subtasks = breakdown.subtasks.map((st, index) => ({
      title: st.title,
      description: st.description,
      completed: false,
      order: st.order || index + 1,
    }));
    task.isAIBrokenDown = true;
    await task.save();

    res.status(200).json({
      success: true,
      data: {
        breakdown,
        task,
      },
    });
  } catch (error: any) {
  console.error("========== BREAKDOWN ERROR ==========");
  console.error(error);
  console.error(error.stack);

  res.status(500).json({
    success: false,
    message: error.message || 'Failed to breakdown task',
  });
}
};
// Next Action Recommendation
export const getNextAction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      status: { $in: ['pending', 'in-progress'] },
    });

    const nextAction = await aiService.recommendNextAction(
      tasks.map(t => ({
        _id: t._id,
        dueDate: t.dueDate,
        priority: t.priority,
        estimatedHours: t.estimatedHours,
        title: t.title,
        status: t.status,
      }))
    );

    res.status(200).json({
      success: true,
      data: nextAction,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get next action',
    });
  }
};

// Burnout Detection
export const checkBurnout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      status: { $ne: 'completed' },
    });

    const deadlineDocs = await Deadline.find({
      user: req.user._id,
      status: 'upcoming',
    });

    const { items: deadlineItems } = buildUpcomingDeadlineContext(
      new Date(),
      tasks,
      deadlineDocs,
      50
    );

    const burnoutReport = await aiService.detectBurnout(
      tasks.map(t => ({
        _id: t._id,
        dueDate: t.dueDate,
        priority: t.priority,
        estimatedHours: t.estimatedHours,
        title: t.title,
      })),
      deadlineItems
    );

    res.status(200).json({
      success: true,
      data: burnoutReport,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check burnout',
    });
  }
};

// Deadline Simulator
export const simulateDeadlineChange = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId, newDate } = req.body;
    
    const task = await Task.findOne({
      _id: taskId,
      user: req.user._id,
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    const allTasks = await Task.find({
      user: req.user._id,
      status: { $ne: 'completed' },
      _id: { $ne: taskId },
    });

    const simulation = await aiService.simulateDeadlineChange(
      {
        _id: task._id,
        dueDate: task.dueDate,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        title: task.title,
      },
      new Date(newDate),
      allTasks.map(t => ({
        _id: t._id,
        dueDate: t.dueDate,
        priority: t.priority,
        estimatedHours: t.estimatedHours,
        title: t.title,
      }))
    );

    res.status(200).json({
      success: true,
      data: simulation,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to simulate deadline change',
    });
  }
};

// Weekly Report
export const generateWeeklyReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const completedTasks = await Task.countDocuments({
      user: userId,
      status: 'completed',
      updatedAt: { $gte: sevenDaysAgo },
    });

    const missedTasks = await Task.countDocuments({
      user: userId,
      dueDate: { $lt: now },
      status: { $ne: 'completed' },
    });

    const stats = {
      completedTasks,
      missedTasks,
      streak: req.user.streak || 0,
    };

    const weeklyReport = await aiService.generateWeeklyReport(stats);

    res.status(200).json({
      success: true,
      data: weeklyReport,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate weekly report',
    });
  }
};

// Emergency Mode
export const activateEmergencyMode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      status: { $ne: 'completed' },
    }).sort({ dueDate: 1 });

    const deadlineDocs = await Deadline.find({
      user: req.user._id,
      status: 'upcoming',
    });

    const { items: deadlineItems } = buildUpcomingDeadlineContext(
      new Date(),
      tasks,
      deadlineDocs,
      8
    );

    const emergencyPlan = await aiService.activateEmergencyMode(
      tasks.map(t => ({
        _id: t._id,
        dueDate: t.dueDate,
        priority: t.priority,
        estimatedHours: t.estimatedHours,
        title: t.title,
      })),
      deadlineItems
    );

    res.status(200).json({
      success: true,
      data: emergencyPlan,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to activate emergency mode',
    });
  }
};

// AI Chat Assistant
export const chatWithAI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 2000) : '';

    if (!message) {
      res.status(400).json({
        success: false,
        message: 'Message is required',
      });
      return;
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const windowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Build a rich, real-data context so the chatbot can answer concretely.
    // Note: the deadline context uses a DEDICATED uncapped window query on
    // Task.dueDate (primary source) — the limit(15) pending-task list below is
    // only for the pending-task context and is never used to compute counts.
    const [tasks, windowTasks, deadlineDocs, weeklyCompleted, weeklyMissed] = await Promise.all([
      Task.find({
        user: req.user._id,
        status: { $ne: 'completed' },
      })
        .sort({ dueDate: 1 })
        .limit(15),
      Task.find({
        user: req.user._id,
        status: { $ne: 'completed' },
        dueDate: { $gte: now, $lte: windowEnd },
      })
        .select('_id title dueDate status')
        .lean(),
      Deadline.find({
        user: req.user._id,
        status: 'upcoming',
      })
        .select('_id title dueDate status relatedTasks')
        .lean(),
      Task.countDocuments({
        user: req.user._id,
        status: 'completed',
        updatedAt: { $gte: sevenDaysAgo },
      }),
      Task.countDocuments({
        user: req.user._id,
        dueDate: { $lt: now },
        status: { $ne: 'completed' },
      }),
    ]);

    const { items: deadlineItems, total: upcomingTotal } = buildUpcomingDeadlineContext(
      now,
      windowTasks,
      deadlineDocs,
      8
    );

    const context = {
      tasks: tasks.map(t => ({
        _id: t._id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours,
        status: t.status,
      })),
      deadlines: deadlineItems.map(i => ({
        title: i.title,
        dueDate: i.dueDate,
        status: i.status,
      })),
      user: {
        streak: req.user.streak || 0,
        level: req.user.level || 1,
        points: req.user.points || 0,
      },
      weekly: {
        completed: weeklyCompleted,
        missed: weeklyMissed,
      },
    };

    const response = await aiService.processChatMessage(message, context);

    res.status(200).json({
      success: true,
      data: {
        message: response,
        context: {
          pendingTasks: tasks.length,
          upcomingDeadlines: upcomingTotal,
          userStreak: req.user.streak || 0,
          userLevel: req.user.level || 1,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process chat message',
    });
  }
};
