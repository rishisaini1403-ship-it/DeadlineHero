import { Response } from 'express';
import Invitation from '../models/Invitation.model';
import User from '../models/User.model';
import Task from '../models/Task.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculateCurrentStreak, calculateBestStreak } from '../utils/stats';

export const lookupUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.query;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }
    const user = await User.findOne({ email: (email as string).toLowerCase() });
    res.status(200).json({ success: true, data: { exists: !!user, name: user?.name || null } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lookup failed' });
  }
};

export const sendInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const receiver = await User.findOne({ email: email.toLowerCase() });
    if (!receiver) {
      res.status(404).json({ success: false, message: 'No DeadlineHero account found with this Gmail address.' });
      return;
    }

    if (receiver._id.toString() === req.user._id.toString()) {
      res.status(400).json({ success: false, message: 'You cannot send an invitation to yourself.' });
      return;
    }

    const existing = await Invitation.findOne({
      senderId: req.user._id,
      receiverEmail: email.toLowerCase(),
      status: 'pending',
    });
    if (existing) {
      res.status(400).json({ success: false, message: 'A pending invitation already exists for this email.' });
      return;
    }

    const invitation = await Invitation.create({
      senderId: req.user._id,
      receiverEmail: email.toLowerCase(),
      receiverId: receiver._id,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully!',
      data: invitation,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to send invitation' });
  }
};

export const getMyInvitations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invitations = await Invitation.find({
      receiverId: req.user._id,
      status: 'pending',
    }).populate('senderId', 'name email');

    res.status(200).json({ success: true, data: invitations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch invitations' });
  }
};

export const getSentInvitations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invitations = await Invitation.find({
      senderId: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: invitations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch sent invitations' });
  }
};

export const respondToInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!action || !['accept', 'reject'].includes(action)) {
      res.status(400).json({ success: false, message: 'Action must be "accept" or "reject"' });
      return;
    }

    const invitation = await Invitation.findById(id);
    if (!invitation) {
      res.status(404).json({ success: false, message: 'Invitation not found' });
      return;
    }

    if (invitation.receiverId?.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'This invitation is not for you' });
      return;
    }

    if (invitation.status !== 'pending') {
      res.status(400).json({ success: false, message: 'This invitation has already been responded to' });
      return;
    }

    invitation.status = action === 'accept' ? 'accepted' : 'rejected';
    await invitation.save();

    const msg = action === 'accept' ? 'Invitation accepted! You are now connected.' : 'Invitation rejected.';
    res.status(200).json({ success: true, message: msg, data: invitation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to respond to invitation' });
  }
};

export const getConnections = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;

    const acceptedInvitations = await Invitation.find({
      status: 'accepted',
      $or: [
        { senderId: userId },
        { receiverId: userId },
      ],
    });

    const connectedUserIds: string[] = [];
    acceptedInvitations.forEach(inv => {
      const otherId = inv.senderId.toString() === userId.toString()
        ? inv.receiverId?.toString()
        : inv.senderId.toString();
      if (otherId && otherId !== userId.toString()) {
        connectedUserIds.push(otherId);
      }
    });

    const connectedUsers = await User.find({
      _id: { $in: connectedUserIds },
    }).select('name email');

    const buildMemberStats = async (uid: any, uname: string, uemail: string) => {
      const totalTasks = await Task.countDocuments({ user: uid });
      const completedTasks = await Task.countDocuments({ user: uid, status: 'completed' });
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const completedThisWeek = await Task.countDocuments({
        user: uid,
        status: 'completed',
        updatedAt: { $gte: weekAgo },
      });
      const createdThisWeek = await Task.countDocuments({
        user: uid,
        createdAt: { $gte: weekAgo },
      });
      const productivityScore = createdThisWeek > 0 ? Math.round((completedThisWeek / createdThisWeek) * 100) : 0;

      let consistencyDays = 0;
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const start = new Date(date.setHours(0, 0, 0, 0));
        const end = new Date(date.setHours(23, 59, 59, 999));
        const dayCompleted = await Task.countDocuments({
          user: uid,
          status: 'completed',
          updatedAt: { $gte: start, $lte: end },
        });
        if (dayCompleted > 0) consistencyDays++;
      }

      const overdueTasks = await Task.countDocuments({
        user: uid,
        dueDate: { $lt: now },
        status: { $ne: 'completed' },
      });

      const userTasks = await Task.find({ user: uid, status: 'completed' }).select('updatedAt createdAt status').lean();
      const streak = calculateCurrentStreak(userTasks);
      const bestStreak = calculateBestStreak(userTasks);

      return {
        userId: uid,
        name: uname,
        email: uemail,
        streak,
        bestStreak,
        totalTasks,
        completedTasks,
        completionRate,
        productivityScore,
        consistencyDays,
        overdueTasks,
      };
    };

    const userStatsPromises = connectedUsers.map(u => buildMemberStats(u._id, u.name, u.email));
    const myStats = await buildMemberStats(userId, req.user.name, req.user.email);

    const allStats = await Promise.all(userStatsPromises);
    allStats.push(myStats);

    const bestProductive = [...allStats].sort((a, b) => b.completedTasks - a.completedTasks)[0];
    const bestStreakHolder = [...allStats].sort((a, b) => b.streak - a.streak)[0];
    const highestRate = [...allStats].sort((a, b) => b.completionRate - a.completionRate)[0];
    const weeklyWinner = [...allStats].sort((a, b) => b.productivityScore - a.productivityScore)[0];

    res.status(200).json({
      success: true,
      data: {
        members: allStats,
        highlights: {
          mostProductiveMember: { name: bestProductive.name, value: bestProductive.completedTasks },
          bestStreakHolder: { name: bestStreakHolder.name, value: bestStreakHolder.streak },
          highestCompletionRate: { name: highestRate.name, value: highestRate.completionRate },
          weeklyWinner: { name: weeklyWinner.name, value: weeklyWinner.productivityScore },
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch connections' });
  }
};
