const User = require('../models/User.model');
const BADGES = [
  { id: 'first-task', name: 'First Steps', description: 'Create your first task', icon: '🎯', requirement: 1, type: 'tasks' },
  { id: 'ten-tasks', name: 'Getting Started', description: 'Complete 10 tasks', icon: '✅', requirement: 10, type: 'tasks' },
  { id: 'fifty-tasks', name: 'Task Master', description: 'Complete 50 tasks', icon: '🏆', requirement: 50, type: 'tasks' },
  { id: 'hundred-tasks', name: 'Legend', description: 'Complete 100 tasks', icon: '👑', requirement: 100, type: 'tasks' },
  { id: 'points-100', name: 'Rising Star', description: 'Earn 100 points', icon: '⭐', requirement: 100, type: 'points' },
  { id: 'points-500', name: 'Superstar', description: 'Earn 500 points', icon: '🌟', requirement: 500, type: 'points' },
  { id: 'points-1000', name: 'Champion', description: 'Earn 1000 points', icon: '💎', requirement: 1000, type: 'points' },
  { id: 'streak-3', name: '3-Day Streak', description: 'Stay active for 3 days', icon: '🔥', requirement: 3, type: 'streak' },
  { id: 'streak-7', name: 'Week Warrior', description: 'Stay active for 7 days', icon: '⚡', requirement: 7, type: 'streak' },
  { id: 'streak-30', name: 'Monthly Master', description: 'Stay active for 30 days', icon: '🎖️', requirement: 30, type: 'streak' },
];

class GamificationService {
  // Add points to user
  async addPoints(userId, points) {
    const user = await User.findById(userId);
    if (!user) return;

    user.points += points;

    // Level up calculation (level = floor(points / 100) + 1)
    const newLevel = Math.floor(user.points / 100) + 1;
    if (newLevel > user.level) {
      user.level = newLevel;
      console.log(`🎉 User ${user.name} leveled up to ${newLevel}!`);
    }

    await user.save();
    await this.checkBadges(userId);
  }

  // Update user streak
  async updateStreak(userId) {
    const user = await User.findById(userId);
    if (!user) return { streak: 0, isNew: false, bestStreak: 0 };

    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const now = new Date();
    const lastActive = new Date(user.lastActiveDate);

    const lastDateStr = fmt(lastActive);
    const nowStr = fmt(now);

    let isNewStreak = false;

    if (lastDateStr === nowStr) {
      // Same day - only set to 1 if streak is 0 (first task ever)
      if (user.streak === 0) {
        user.streak = 1;
        isNewStreak = true;
      }
    } else {
      // New day
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = fmt(yesterday);

      if (lastDateStr === yesterdayStr) {
        // Consecutive day - increment
        user.streak += 1;
      } else {
        // Gap of at least one full day - reset to 1
        user.streak = 1;
      }
      isNewStreak = true;
    }

    if (user.streak > user.bestStreak) {
      user.bestStreak = user.streak;
    }

    user.lastActiveDate = now;
    await user.save();

    await this.checkBadges(userId);

    return { streak: user.streak, isNew: isNewStreak, bestStreak: user.bestStreak };
  }

  // Check and award badges
  async checkBadges(userId) {
    const user = await User.findById(userId);
    if (!user) return;

    const newBadges = [];

    for (const badge of BADGES) {
      if (user.badges.includes(badge.id)) continue;

      let shouldAward = false;

      switch (badge.type) {
        case 'points':
          shouldAward = user.points >= badge.requirement;
          break;
        case 'tasks':
          // This would need task count, simplified here
          shouldAward = false;
          break;
        case 'streak':
          shouldAward = user.streak >= badge.requirement;
          break;
      }

      if (shouldAward) {
        user.badges.push(badge.id);
        newBadges.push(badge.name);
      }
    }

    if (newBadges.length > 0) {
      await user.save();
      console.log(`🏆 User ${user.name} earned badges: ${newBadges.join(', ')}`);
    }
  }

  // Get all available badges
  getAllBadges() {
    return BADGES;
  }

  // Get user gamification stats
  async getUserStats(userId) {
    const user = await User.findById(userId).select('points level streak bestStreak badges');
    if (!user) return null;

    const earnedBadges = BADGES.filter((badge) => user.badges.includes(badge.id));
    const availableBadges = BADGES.filter((badge) => !user.badges.includes(badge.id));

    return {
      points: user.points,
      level: user.level,
      streak: user.streak,
      bestStreak: user.bestStreak,
      earnedBadges,
      availableBadges,
      nextLevel: (user.level + 1) * 100,
      progressToNextLevel: user.points % 100,
    };
  }
}
const gamificationService = new GamificationService();

module.exports = { gamificationService };
