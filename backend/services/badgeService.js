const Badge = require('../models/Badge');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

class BadgeService {
  /**
   * Check and award badges for task completion
   */
  static async checkTaskCompletionBadges(userId, tasksCompleted) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const taskBadges = await Badge.find({
        category: 'achievement',
        'requirements.tasksCompleted': { $lte: tasksCompleted },
        isActive: true,
        isHidden: false
      });

      for (const badge of taskBadges) {
        if (!user.badges.includes(badge._id) && badge.canUserEarn(user)) {
          await this.awardBadgeToUser(badge._id, userId);
        }
      }
    } catch (error) {
      console.error('Error checking task completion badges:', error);
    }
  }

  /**
   * Check and award badges for coin milestones
   */
  static async checkCoinMilestoneBadges(userId, coinBalance) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const coinBadges = await Badge.find({
        category: 'milestone',
        'requirements.coinsRequired': { $lte: coinBalance },
        isActive: true,
        isHidden: false
      });

      for (const badge of coinBadges) {
        if (!user.badges.includes(badge._id) && badge.canUserEarn(user)) {
          await this.awardBadgeToUser(badge._id, userId);
        }
      }
    } catch (error) {
      console.error('Error checking coin milestone badges:', error);
    }
  }

  /**
   * Check and award badges for login streaks
   */
  static async checkLoginStreakBadges(userId, loginStreak) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const streakBadges = await Badge.find({
        category: 'streak',
        'requirements.loginStreak': { $lte: loginStreak },
        isActive: true,
        isHidden: false
      });

      for (const badge of streakBadges) {
        if (!user.badges.includes(badge._id) && badge.canUserEarn(user)) {
          await this.awardBadgeToUser(badge._id, userId);
        }
      }
    } catch (error) {
      console.error('Error checking login streak badges:', error);
    }
  }

  /**
   * Check and award badges for game achievements
   */
  static async checkGameAchievementBadges(userId, gameType, score, time) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      let gameBadges = [];

      // Check for specific game achievements
      if (gameType === 'math-quiz' && score === 100) {
        gameBadges = await Badge.find({
          name: 'Math Wizard',
          isActive: true,
          isHidden: false
        });
      } else if (gameType === 'memory-game' && score === 100) {
        gameBadges = await Badge.find({
          name: 'Memory Master',
          isActive: true,
          isHidden: false
        });
      } else if (gameType === 'puzzle-solver') {
        // Check puzzle completion count
        const puzzleTransactions = await Transaction.countDocuments({
          user: userId,
          category: 'game_completion',
          'metadata.gameType': 'puzzle-solver'
        });

        if (puzzleTransactions >= 50) {
          gameBadges = await Badge.find({
            name: 'Puzzle Master',
            isActive: true,
            isHidden: false
          });
        }
      }

      // Award game badges
      for (const badge of gameBadges) {
        if (!user.badges.includes(badge._id) && badge.canUserEarn(user)) {
          await this.awardBadgeToUser(badge._id, userId);
        }
      }
    } catch (error) {
      console.error('Error checking game achievement badges:', error);
    }
  }

  /**
   * Check and award badges for special conditions
   */
  static async checkSpecialConditionBadges(userId, condition) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const specialBadges = await Badge.find({
        category: 'special',
        'requirements.specialConditions': condition,
        isActive: true,
        isHidden: false
      });

      for (const badge of specialBadges) {
        if (!user.badges.includes(badge._id) && badge.canUserEarn(user)) {
          await this.awardBadgeToUser(badge._id, userId);
        }
      }
    } catch (error) {
      console.error('Error checking special condition badges:', error);
    }
  }

  /**
   * Award a badge to a user
   */
  static async awardBadgeToUser(badgeId, userId) {
    try {
      const badge = await Badge.findById(badgeId);
      if (!badge) return;

      const user = await User.findById(userId);
      if (!user) return;

      // Check if user can earn this badge
      if (!badge.canUserEarn(user)) return;

      // Award the badge
      await badge.awardToUser(userId);

      // Update user's badge count
      await user.save();

      console.log(`🎖️ Badge "${badge.name}" awarded to user ${user.username}`);

      return {
        success: true,
        badge: badge,
        user: user
      };
    } catch (error) {
      console.error('Error awarding badge:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's progress towards badges
   */
  static async getUserBadgeProgress(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      const userBadgeIds = Array.isArray(user.badges) ? user.badges : [];

      const allBadges = await Badge.find({
        isActive: true,
        isHidden: false
      });

      const progress = allBadges.map(badge => {
        const hasBadge = userBadgeIds.some(id => id && id.toString() === badge._id.toString());
        const req = badge.requirements || {};
        let progress = 0;
        let maxProgress = 1;

        if ((req.tasksCompleted || 0) > 0) {
          progress = Math.min(user.tasksCompleted || 0, req.tasksCompleted);
          maxProgress = req.tasksCompleted;
        } else if ((req.coinsRequired || 0) > 0) {
          progress = Math.min(Number(user.coinBalance) || 0, req.coinsRequired);
          maxProgress = req.coinsRequired;
        } else if ((req.loginStreak || 0) > 0) {
          progress = Math.min(user.loginStreak || 0, req.loginStreak);
          maxProgress = req.loginStreak;
        }

        let canEarn = false;
        try {
          canEarn = !hasBadge && typeof badge.canUserEarn === 'function' && badge.canUserEarn(user);
        } catch (_) {
          canEarn = !hasBadge;
        }

        return {
          badge: badge,
          hasBadge: hasBadge,
          progress: progress,
          maxProgress: maxProgress,
          progressPercentage: maxProgress > 0 ? Math.round((progress / maxProgress) * 100) : 0,
          canEarn
        };
      });

      return progress;
    } catch (error) {
      console.error('Error getting user badge progress:', error);
      return null;
    }
  }

  /**
   * Get recommended badges for user
   */
  static async getRecommendedBadges(userId) {
    try {
      const progress = await this.getUserBadgeProgress(userId);
      if (!progress || !Array.isArray(progress)) return [];

      return progress
        .filter(item => item && !item.hasBadge && item.canEarn)
        .sort((a, b) => (b.progressPercentage || 0) - (a.progressPercentage || 0))
        .slice(0, 5)
        .map(item => {
          const badge = item.badge;
          const badgeObj = badge && typeof badge.toObject === 'function'
            ? badge.toObject()
            : (badge && typeof badge === 'object' ? { ...badge } : {});
          return {
            ...badgeObj,
            progress: item.progress,
            maxProgress: item.maxProgress,
            progressPercentage: item.progressPercentage
          };
        });
    } catch (error) {
      console.error('Error getting recommended badges:', error);
      return [];
    }
  }

  /**
   * Check all badges for a user (comprehensive check)
   */
  static async checkAllBadges(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Check task completion badges
      await this.checkTaskCompletionBadges(userId, user.tasksCompleted || 0);

      // Check coin milestone badges
      await this.checkCoinMilestoneBadges(userId, user.coinBalance);

      // Check login streak badges
      await this.checkLoginStreakBadges(userId, user.loginStreak || 0);

      // Check special condition badges
      await this.checkSpecialConditionBadges(userId, 'early_user');

      console.log(`✅ Completed badge check for user ${user.username}`);
    } catch (error) {
      console.error('Error checking all badges:', error);
    }
  }
}

module.exports = BadgeService;
