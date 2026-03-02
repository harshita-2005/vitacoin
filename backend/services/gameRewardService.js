const User = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * Game Reward Service
 * Handles secure backend validation and reward calculation
 * Prevents frontend manipulation of coin rewards
 */

// Reward multipliers based on difficulty
const DIFFICULTY_REWARDS = {
  easy: { coins: 5, xp: 10, minScore: 30 },
  medium: { coins: 10, xp: 20, minScore: 50 },
  hard: { coins: 20, xp: 30, minScore: 70 }
};

// Attempt limits per difficulty per day
const DAILY_ATTEMPT_LIMITS = {
  easy: -1, // Unlimited
  medium: 5,
  hard: 2
};

// Minimum scores to unlock next level
const UNLOCK_REQUIREMENTS = {
  easy: { minScore: 60 }, // 60% to unlock Medium
  // Align hard unlock with UI (Medium min 50% shown in LevelSelector)
  medium: { minScore: 50 } // 50% to unlock Hard
};

class GameRewardService {
  /**
   * Validate game play attempt
   * @param {Object} user - User object
   * @param {String} gameSlug - Game identifier
   * @param {String} difficulty - Difficulty level (easy, medium, hard)
   * @returns {Object} Validation result
   */
  static async validateAttempt(user, gameSlug, difficulty) {
    const errors = [];

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      errors.push('Invalid difficulty level');
      return { valid: false, errors };
    }

    // Check if level is unlocked
    // Ensure gameProgress is a Map instance
    if (!user.gameProgress || !(user.gameProgress instanceof Map)) {
      user.gameProgress = new Map();
    }
    const gameProgress = user.gameProgress.get(gameSlug) || { level: 0, unlocked: true };
    const difficultyLevel = { easy: 0, medium: 1, hard: 2 }[difficulty];

    if (difficultyLevel > gameProgress.level && !gameProgress.unlocked) {
      errors.push(`Level ${difficulty} is locked. Complete ${difficultyLevel === 1 ? 'Easy' : 'Medium'} first.`);
      return { valid: false, errors };
    }

    // Check daily attempt limits
    // Ensure dailyAttempts is a Map instance
    if (!user.dailyAttempts || !(user.dailyAttempts instanceof Map)) {
      user.dailyAttempts = new Map();
    }
    const attemptsKey = `${gameSlug}_${difficulty}`;
    const dailyAttempts = user.dailyAttempts.get(attemptsKey) || 0;
    const attemptLimit = DAILY_ATTEMPT_LIMITS[difficulty];

    if (attemptLimit !== -1 && dailyAttempts >= attemptLimit) {
      errors.push(`Daily attempt limit reached for ${difficulty} level (${attemptLimit} attempts/day)`);
      return { valid: false, errors };
    }

    return {
      valid: true,
      remainingAttempts: attemptLimit === -1 ? -1 : attemptLimit - dailyAttempts
    };
  }

  /**
   * Consume an attempt when a game is started
   * (used so that opening/quitting still counts as an attempt)
   */
  static async consumeAttempt(user, gameSlug, difficulty) {
    // First validate that another attempt is allowed
    const validation = await this.validateAttempt(user, gameSlug, difficulty);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    // Ensure dailyAttempts is a Map instance
    if (!user.dailyAttempts || !(user.dailyAttempts instanceof Map)) {
      user.dailyAttempts = new Map();
    }

    const attemptsKey = `${gameSlug}_${difficulty}`;
    const currentAttempts = user.dailyAttempts.get(attemptsKey) || 0;
    const newAttempts = currentAttempts + 1;
    user.dailyAttempts.set(attemptsKey, newAttempts);

    await user.save();

    const attemptLimit = DAILY_ATTEMPT_LIMITS[difficulty];
    const remainingAttempts = attemptLimit === -1 ? -1 : attemptLimit - newAttempts;

    return {
      success: true,
      remainingAttempts
    };
  }

  /**
   * Calculate rewards based on score and difficulty
   * @param {Number} score - Game score (0-100)
   * @param {String} difficulty - Difficulty level
   * @param {Number} time - Time taken in seconds
   * @param {Number} correctAnswers - Number of correct answers (default: 0)
   * @returns {Object} Reward calculation
   */
  static calculateRewards(score, difficulty, time = 0, correctAnswers = 0) {
    const baseReward = DIFFICULTY_REWARDS[difficulty];
    
    if (!baseReward) {
      return { coins: 0, xp: 0, reason: 'Invalid difficulty' };
    }

    // MANDATORY: No reward if no correct answers
    if (correctAnswers === 0 || score === 0) {
      return { 
        coins: 0, 
        xp: 0, 
        reason: 'Try again! Reach the minimum score to earn rewards.' 
      };
    }

    // MANDATORY: Check minimum score threshold
    if (score < baseReward.minScore) {
      return { 
        coins: 0, 
        xp: 0, 
        reason: 'Try again! Reach the minimum score to earn rewards.' 
      };
    }

    // Base rewards (only awarded if above minimum threshold)
    let coins = baseReward.coins;
    let xp = baseReward.xp;

    // Score-based multiplier (proportional to score)
    const scoreMultiplier = score / 100;
    coins = Math.floor(coins * scoreMultiplier);
    xp = Math.floor(xp * scoreMultiplier);

    // Perfect score bonus (100%)
    if (score >= 100) {
      coins += Math.floor(baseReward.coins * 0.5); // 50% bonus
      xp += Math.floor(baseReward.xp * 0.5);
    }

    // Time bonus (faster = more bonus, only for medium/hard)
    if (difficulty !== 'easy' && time > 0) {
      const timeBonus = Math.max(0, Math.floor((300 - time) / 30)); // 1 coin per 30 seconds saved
      coins += timeBonus;
    }

    return {
      coins: Math.max(0, coins),
      xp: Math.max(0, xp),
      baseCoins: baseReward.coins,
      baseXp: baseReward.xp,
      reason: null // Success - no reason needed
    };
  }

  /**
   * Process game completion and award rewards
   * @param {Object} user - User object
   * @param {String} gameSlug - Game identifier
   * @param {String} difficulty - Difficulty level
   * @param {Number} score - Game score
   * @param {Number} time - Time taken
   * @param {Number} accuracy - Accuracy percentage
   * @returns {Object} Result with rewards and unlock status
   */
  static async processGameCompletion(user, gameSlug, difficulty, score, time, accuracy, correctAnswers = 0) {
    try {
      // Calculate rewards (with correctAnswers validation)
      const rewards = this.calculateRewards(score, difficulty, time, correctAnswers);

      // Update game progress
      // Ensure gameProgress is a Map instance
      if (!user.gameProgress || !(user.gameProgress instanceof Map)) {
        user.gameProgress = new Map();
      }

      const gameProgress = user.gameProgress.get(gameSlug) || {
        level: 0,
        unlocked: true,
        bestScore: 0,
        scores: { easy: 0, medium: 0, hard: 0 },
        timesPlayed: 0
      };

      // Initialize scores if not present
      if (!gameProgress.scores) {
        gameProgress.scores = { easy: 0, medium: 0, hard: 0 };
      }

      // Update best score for this difficulty
      if (score > (gameProgress.scores[difficulty] || 0)) {
        gameProgress.scores[difficulty] = score;
      }

      // Update overall best score (highest across all difficulties)
      const overallBest = Math.max(
        gameProgress.scores.easy || 0,
        gameProgress.scores.medium || 0,
        gameProgress.scores.hard || 0
      );
      if (overallBest > gameProgress.bestScore) {
        gameProgress.bestScore = overallBest;
      }

      gameProgress.timesPlayed += 1;

      // Check for level unlock based on difficulty-specific scores
      let levelUnlocked = false;
      const difficultyLevel = { easy: 0, medium: 1, hard: 2 }[difficulty];
      const nextLevel = difficultyLevel + 1;

      if (nextLevel <= 2) {
        const requirement = nextLevel === 1 
          ? UNLOCK_REQUIREMENTS.easy 
          : UNLOCK_REQUIREMENTS.medium;

        // Check if current difficulty score meets requirement for next level
        if (score >= requirement.minScore) {
          // Also check if we need to update the level
          if (nextLevel > gameProgress.level) {
            gameProgress.level = nextLevel;
            gameProgress.unlocked = true;
            levelUnlocked = true;
          }
        }
      }

      user.gameProgress.set(gameSlug, gameProgress);

      // Only update coins/XP if rewards were earned
      if (rewards.coins > 0 || rewards.xp > 0) {
        // Capture balance BEFORE adding coins
        const balanceBefore = user.coinBalance;

        // Award coins and XP
        user.coinBalance += rewards.coins;
        user.totalEarned += rewards.coins;
        user.experiencePoints = (user.experiencePoints || 0) + rewards.xp;

        // Calculate user level based on XP (100 XP per level)
        const newLevel = Math.floor(user.experiencePoints / 100) + 1;
        if (newLevel > user.userLevel) {
          user.userLevel = newLevel;
        }

        // Save user with all updates
        await user.save();

        // Create transaction record with correct balance values
        const transaction = new Transaction({
          user: user._id,
          type: 'earn',
          amount: rewards.coins,
          description: `Game completion: ${gameSlug} (${difficulty})`,
          category: 'game_completion',
          balanceBefore: balanceBefore,
          balanceAfter: user.coinBalance,
          metadata: {
            gameSlug,
            difficulty,
            score,
            time,
            accuracy,
            correctAnswers,
            xpEarned: rewards.xp,
            levelUnlocked
          }
        });

        await transaction.save();
      } else {
        // No rewards earned - still save progress but don't update coins
        await user.save();
      }

      // Get updated attempt count (attempt is consumed when game starts)
      if (!user.dailyAttempts || !(user.dailyAttempts instanceof Map)) {
        user.dailyAttempts = new Map();
      }
      const attemptsKey = `${gameSlug}_${difficulty}`;
      const updatedAttempts = user.dailyAttempts.get(attemptsKey) || 0;
      const attemptLimit = DAILY_ATTEMPT_LIMITS[difficulty];
      const remainingAttempts = attemptLimit === -1 ? -1 : attemptLimit - updatedAttempts;

      return {
        success: true,
        coinsAwarded: rewards.coins,
        xpAwarded: rewards.xp,
        levelUnlocked,
        newLevel: user.userLevel,
        newBalance: user.coinBalance,
        remainingAttempts,
        message: rewards.coins > 0 
          ? `Congratulations! You earned ${rewards.coins} coins and ${rewards.xp} XP!`
          : (rewards.reason || 'No rewards earned. Try again!')
      };
    } catch (error) {
      console.error('Game reward processing error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to process game completion']
      };
    }
  }

  /**
   * Get user's game progress
   * @param {Object} user - User object
   * @param {String} gameSlug - Game identifier
   * @returns {Object} Game progress information
   */
  static getUserGameProgress(user, gameSlug) {
    // Ensure Maps are initialized
    if (!user.gameProgress || !(user.gameProgress instanceof Map)) {
      user.gameProgress = new Map();
    }
    if (!user.dailyAttempts || !(user.dailyAttempts instanceof Map)) {
      user.dailyAttempts = new Map();
    }

    const progress = user.gameProgress.get(gameSlug) || {
      level: 0,
      unlocked: true,
      bestScore: 0,
      scores: { easy: 0, medium: 0, hard: 0 },
      timesPlayed: 0
    };

    // Ensure scores object exists
    if (!progress.scores) {
      progress.scores = { easy: 0, medium: 0, hard: 0 };
    }

    const attempts = {};
    ['easy', 'medium', 'hard'].forEach(difficulty => {
      const attemptsKey = `${gameSlug}_${difficulty}`;
      const dailyAttempts = user.dailyAttempts.get(attemptsKey) || 0;
      const limit = DAILY_ATTEMPT_LIMITS[difficulty];
      attempts[difficulty] = {
        used: dailyAttempts,
        limit: limit,
        remaining: limit === -1 ? -1 : limit - dailyAttempts
      };
    });

    return {
      progress,
      attempts,
      experiencePoints: user.experiencePoints || 0,
      userLevel: user.userLevel || 1
    };
  }

  /**
   * Reset daily attempts (called by cron job)
   * @returns {Promise} Reset result
   */
  static async resetDailyAttempts() {
    try {
      const users = await User.find({});
      let resetCount = 0;

      for (const user of users) {
        if (user.dailyAttempts && user.dailyAttempts.size > 0) {
          user.dailyAttempts.clear();
          await user.save();
          resetCount++;
        }
      }

      return {
        success: true,
        usersReset: resetCount,
        message: `Daily attempts reset for ${resetCount} users`
      };
    } catch (error) {
      console.error('Daily attempts reset error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = GameRewardService;

