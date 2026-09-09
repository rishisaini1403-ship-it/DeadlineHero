const Deadline = require('../models/Deadline.model');
const { notificationService } = require('../services/notification.service');
const createDeadline = async (req, res) => {
  try {
    const deadlineData = {
      ...req.body,
      user: req.user._id,
    };

    const deadline = await Deadline.create(deadlineData);

    // Schedule email reminder
    await notificationService.scheduleReminder(deadline);

    res.status(201).json({
      success: true,
      message: 'Deadline created successfully',
      data: deadline,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create deadline',
    });
  }
};
const getDeadlines = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };

    if (status) filter.status = status;

    const deadlines = await Deadline.find(filter)
      .sort({ dueDate: 1 })
      .populate('relatedTasks');

    res.status(200).json({
      success: true,
      count: deadlines.length,
      data: deadlines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch deadlines',
    });
  }
};
const updateDeadline = async (req, res) => {
  try {
    const deadline = await Deadline.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deadline) {
      res.status(404).json({
        success: false,
        message: 'Deadline not found',
      });
      return;
    }

    Object.assign(deadline, req.body);
    await deadline.save();

    res.status(200).json({
      success: true,
      message: 'Deadline updated successfully',
      data: deadline,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update deadline',
    });
  }
};
const deleteDeadline = async (req, res) => {
  try {
    const deadline = await Deadline.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deadline) {
      res.status(404).json({
        success: false,
        message: 'Deadline not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Deadline deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete deadline',
    });
  }
};

module.exports = { createDeadline, getDeadlines, updateDeadline, deleteDeadline };
