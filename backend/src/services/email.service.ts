import { getEmailClient } from '../config/email';
import User from '../models/User.model';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (params: EmailParams): Promise<boolean> => {
  const resend = getEmailClient();
  
  if (!resend) {
    console.warn('Email service not configured, skipping send');
    return false;
  }

  try {
    await resend.emails.send({
      from: 'DeadlineHero <onboarding@resend.dev>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    console.log(`✅ Email sent to ${params.to}: ${params.subject}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
};

export const sendDeadlineReminder = async (
  userId: string,
  deadlineTitle: string,
  dueDate: Date
): Promise<boolean> => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.preferences.emailNotifications) {
      return false;
    }

    const hoursUntilDue = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60);
    const subject =
      hoursUntilDue <= 1
        ? `⏰ URGENT: "${deadlineTitle}" is due in 1 hour!`
        : `📅 Reminder: "${deadlineTitle}" is due tomorrow`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">DeadlineHero Reminder</h2>
        <p>Hi ${user.name},</p>
        <p>This is a friendly reminder that your deadline <strong>"${deadlineTitle}"</strong> is ${
      hoursUntilDue <= 1 ? 'due in 1 hour' : 'due tomorrow'
    }.</p>
        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Deadline:</strong> ${new Date(dueDate).toLocaleString()}</p>
        </div>
        <p>Stay focused and crush your goals! 💪</p>
        <p style="color: #6B7280; font-size: 12px;">
          You can manage your notification preferences in your DeadlineHero settings.
        </p>
      </div>
    `;

    return await sendEmail({
      to: user.email,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send deadline reminder:', error);
    return false;
  }
};

export const sendWelcomeEmail = async (userId: string): Promise<boolean> => {
  try {
    const user = await User.findById(userId);
    if (!user) return false;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Welcome to DeadlineHero! 🎉</h1>
        <p>Hi ${user.name},</p>
        <p>We're excited to help you stay on top of your deadlines and boost your productivity!</p>
        <h3>Here's what you can do:</h3>
        <ul>
          <li>✅ Create and manage tasks with AI-powered prioritization</li>
          <li>📅 Set deadlines and get email reminders</li>
          <li>📊 Track your progress with analytics</li>
          <li>📚 Use study templates for common assignments</li>
          <li>🏆 Earn points and badges as you complete tasks</li>
        </ul>
        <p>Ready to get started? Log in and create your first task!</p>
        <p>Best regards,<br/>The DeadlineHero Team</p>
      </div>
    `;

    return await sendEmail({
      to: user.email,
      subject: 'Welcome to DeadlineHero! 🚀',
      html,
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
};
