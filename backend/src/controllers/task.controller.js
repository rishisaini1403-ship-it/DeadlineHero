const Task = require('../models/Task.model');
const { aiService } = require('../services/ai.service');
const { gamificationService } = require('../services/gamification.service');
const User = require('../models/User.model');
const createTask = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create task',
    });
  }
};
const getTasks = async (req, res) => {
  try {
    const { status, priority, category, sortBy = 'dueDate', order = 'asc' } = req.query;

    const filter = { user: req.user._id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const tasks = await Task.find(filter).sort(sort);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch tasks',
    });
  }
};
const getTask = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch task',
    });
  }
};
const updateTask = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update task',
    });
  }
};
const deleteTask = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete task',
    });
  }
};
const getRecommendedTasks = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch recommended tasks',
    });
  }
};

module.exports = { createTask, getTasks, getTask, updateTask, deleteTask, getRecommendedTasks };
