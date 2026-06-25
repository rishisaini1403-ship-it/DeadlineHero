import { Response } from 'express';
import Deadline from '../models/Deadline.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { notificationService } from '../services/notification.service';

export const createDeadline = async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create deadline',
    });
  }
};

export const getDeadlines = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = { user: req.user._id };

    if (status) filter.status = status;

    const deadlines = await Deadline.find(filter)
      .sort({ dueDate: 1 })
      .populate('relatedTasks');

    res.status(200).json({
      success: true,
      count: deadlines.length,
      data: deadlines,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch deadlines',
    });
  }
};

export const updateDeadline = async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update deadline',
    });
  }
};

export const deleteDeadline = async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete deadline',
    });
  }
};
