import cron from 'node-cron';
import Deadline from '../models/Deadline.model';
import User from '../models/User.model';
import { sendDeadlineReminder } from './email.service';

class NotificationService {
  // Schedule reminder emails for a deadline
  async scheduleReminder(deadline: any): Promise<void> {
    const user = await User.findById(deadline.user);
    if (!user || !user.preferences.emailNotifications) {
      return;
    }

    const dueDate = new Date(deadline.dueDate);
    const reminderHours = user.preferences.reminderTime || 24;

    // Schedule 24-hour reminder (or user preference)
    const reminder24h = new Date(dueDate.getTime() - reminderHours * 60 * 60 * 1000);
    if (reminder24h > new Date()) {
      this.scheduleSingleReminder(reminder24h, deadline, user._id.toString());
    }

    // Schedule 1-hour reminder
    const reminder1h = new Date(dueDate.getTime() - 60 * 60 * 1000);
    if (reminder1h > new Date()) {
      this.scheduleSingleReminder(reminder1h, deadline, user._id.toString(), true);
    }
  }

  // Schedule a single reminder
  private scheduleSingleReminder(
    reminderTime: Date,
    deadline: any,
    userId: string,
    isUrgent = false
  ): void {
    const delay = reminderTime.getTime() - Date.now();

    setTimeout(async () => {
      try {
        const sent = await sendDeadlineReminder(userId, deadline.title, deadline.dueDate);
        
        if (sent) {
          await Deadline.findByIdAndUpdate(deadline._id, {
            reminderSent: true,
            reminderTime: new Date(),
          });
        }
      } catch (error) {
        console.error('Failed to send scheduled reminder:', error);
      }
    }, delay);
  }

  // Check for missed deadlines every hour
  startMissedDeadlineChecker(): void {
    cron.schedule('0 * * * *', async () => {
      try {
        const missedDeadlines = await Deadline.updateMany(
          {
            status: 'upcoming',
            dueDate: { $lt: new Date() },
          },
          { status: 'missed' }
        );

        if (missedDeadlines.modifiedCount > 0) {
          console.log(`📌 Updated ${missedDeadlines.modifiedCount} missed deadlines`);
        }
      } catch (error) {
        console.error('Failed to check missed deadlines:', error);
      }
    });

    console.log('✅ Missed deadline checker started');
  }

  // Check for upcoming deadlines every 30 minutes
  startUpcomingDeadlineChecker(): void {
    cron.schedule('*/30 * * * *', async () => {
      try {
        const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
        
        const upcomingDeadlines = await Deadline.find({
          status: 'upcoming',
          dueDate: { $lte: oneHourFromNow, $gt: new Date() },
          reminderSent: false,
        }).populate('user');

        for (const deadline of upcomingDeadlines) {
          const userId = (deadline.user as any)._id || deadline.user;
          await sendDeadlineReminder(userId.toString(), deadline.title, deadline.dueDate);
          
          await Deadline.findByIdAndUpdate(deadline._id, {
            reminderSent: true,
            reminderTime: new Date(),
          });
        }
      } catch (error) {
        console.error('Failed to check upcoming deadlines:', error);
      }
    });

    console.log('✅ Upcoming deadline checker started');
  }

  // Start all notification services
  start(): void {
    this.startMissedDeadlineChecker();
    this.startUpcomingDeadlineChecker();
    console.log('🔔 Notification service started');
  }
}

export const notificationService = new NotificationService();
