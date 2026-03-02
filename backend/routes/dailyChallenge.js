const express = require('express');
const { protect } = require('../middleware/auth');
const GameRewardService = require('../services/gameRewardService');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const router = express.Router();

/**
 * @route   GET /api/daily-challenge/status
 * @desc    Get daily challenge status for user
 * @access  Private
 */
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const today = new Date().toDateString();
    const challengeKey = `daily_${today}`;
    const challengeData = user.dailyChallengeCompleted?.get(challengeKey);

    const isCompleted = challengeData?.completed || false;
    const completedAt = challengeData?.completedAt || null;
    const score = challengeData?.score || 0;

    // Check if it's a new day (reset if needed)
    const needsReset = completedAt && new Date(completedAt).toDateString() !== today;

    res.json({
      success: true,
      isCompleted: isCompleted && !needsReset,
      completedAt: needsReset ? null : completedAt,
      score: needsReset ? 0 : score,
      canPlay: !isCompleted || needsReset,
      today: today
    });
  } catch (error) {
    console.error('Daily challenge status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching daily challenge status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/daily-challenge/complete
 * @desc    Complete daily challenge
 * @access  Private
 */
router.post('/complete', protect, async (req, res) => {
  try {
    const { game, score, time, accuracy } = req.body;

    if (!game || score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: game, score'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const today = new Date().toDateString();
    const challengeKey = `daily_${today}`;
    const challengeData = user.dailyChallengeCompleted?.get(challengeKey);

    // Check if already completed today
    if (challengeData?.completed && new Date(challengeData.completedAt).toDateString() === today) {
      return res.status(400).json({
        success: false,
        error: 'Daily challenge already completed today. Try again tomorrow!'
      });
    }

    // Daily challenge uses medium difficulty rewards
    const rewards = GameRewardService.calculateRewards(score, 'medium', time);
    
    // Daily challenge bonus (fixed 15 coins max)
    const dailyReward = Math.min(15, rewards.coins);
    const dailyXp = Math.min(25, rewards.xp);

    // Award rewards
    await user.addCoins(dailyReward, 'Daily Challenge');
    user.experiencePoints = (user.experiencePoints || 0) + dailyXp;

    // Update user level
    const newLevel = Math.floor(user.experiencePoints / 100) + 1;
    if (newLevel > user.userLevel) {
      user.userLevel = newLevel;
    }

    // Mark daily challenge as completed
    if (!user.dailyChallengeCompleted) {
      user.dailyChallengeCompleted = new Map();
    }
    user.dailyChallengeCompleted.set(challengeKey, {
      completed: true,
      completedAt: new Date(),
      score: score
    });

    await user.save();

    // Create transaction
    const transaction = new Transaction({
      user: user._id,
      type: 'earn',
      amount: dailyReward,
      description: 'Daily Challenge Completion',
      category: 'daily_challenge',
      balanceBefore: user.coinBalance - dailyReward,
      balanceAfter: user.coinBalance,
      metadata: {
        game,
        score,
        time: time || 0,
        accuracy: accuracy || 0,
        xpEarned: dailyXp,
        challengeType: 'daily'
      }
    });

    await transaction.save();

    res.json({
      success: true,
      coinsAwarded: dailyReward,
      xpAwarded: dailyXp,
      newBalance: user.coinBalance,
      newLevel: user.userLevel,
      message: `Daily challenge completed! You earned ${dailyReward} coins and ${dailyXp} XP!`
    });
  } catch (error) {
    console.error('Daily challenge completion error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error processing daily challenge',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/daily-challenge/reset
 * @desc    Reset daily challenge (admin/cron job)
 * @access  Private (Admin)
 */
router.get('/reset', protect, async (req, res) => {
  try {
    // Only allow admin or cron job (check via secret token)
    if (req.user.role !== 'admin' && req.query.token !== process.env.CRON_SECRET) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const users = await User.find({});
    let resetCount = 0;

    for (const user of users) {
      if (user.dailyChallengeCompleted && user.dailyChallengeCompleted.size > 0) {
        // Clear old challenges (older than today)
        const today = new Date().toDateString();
        const entriesToKeep = new Map();
        
        user.dailyChallengeCompleted.forEach((value, key) => {
          if (value.completedAt && new Date(value.completedAt).toDateString() === today) {
            entriesToKeep.set(key, value);
          }
        });

        user.dailyChallengeCompleted = entriesToKeep;
        await user.save();
        resetCount++;
      }
    }

    res.json({
      success: true,
      usersReset: resetCount,
      message: `Daily challenges reset for ${resetCount} users`
    });
  } catch (error) {
    console.error('Daily challenge reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error resetting daily challenges',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

