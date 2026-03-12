const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const router = express.Router();

// Fixed reward for completing the daily challenge (all 7 tasks)
const DAILY_FIXED_COINS = 5;
const DAILY_FIXED_XP = 10;
// Bonus reward per correct answer (shared across 7 tasks; max when all 7 correct)
const DAILY_BONUS_COINS = 10;
const DAILY_BONUS_XP = 15;

function getChallengeData(user, challengeKey) {
  const raw = user.dailyChallengeCompleted;
  if (!raw) return null;
  if (typeof raw.get === 'function') return raw.get(challengeKey);
  return raw[challengeKey] || null;
}

function setChallengeData(user, challengeKey, value) {
  if (!user.dailyChallengeCompleted || typeof user.dailyChallengeCompleted.set !== 'function') {
    user.dailyChallengeCompleted = new Map();
  }
  user.dailyChallengeCompleted.set(challengeKey, value);
}

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
    const challengeData = getChallengeData(user, challengeKey);

    const isCompleted = challengeData?.completed || false;
    const completedAt = challengeData?.completedAt || null;
    const score = challengeData?.score || 0;
    const correctAnswers = challengeData?.correctAnswers ?? null;
    const coinsAwarded = challengeData?.coinsAwarded ?? null;
    const xpAwarded = challengeData?.xpAwarded ?? null;

    // Check if it's a new day (reset if needed)
    const needsReset = completedAt && new Date(completedAt).toDateString() !== today;

    res.json({
      success: true,
      isCompleted: isCompleted && !needsReset,
      completedAt: needsReset ? null : completedAt,
      score: needsReset ? 0 : score,
      correctAnswers: needsReset ? null : correctAnswers,
      coinsAwarded: needsReset ? null : coinsAwarded,
      xpAwarded: needsReset ? null : xpAwarded,
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
const TOTAL_DAILY_TASKS = 7;

router.post('/complete', protect, async (req, res) => {
  try {
    const { game, score, time, accuracy, correctAnswers } = req.body;

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
    const challengeData = getChallengeData(user, challengeKey);

    // Check if already completed today
    if (challengeData?.completed && new Date(challengeData.completedAt).toDateString() === today) {
      return res.status(400).json({
        success: false,
        error: 'Daily challenge already completed today. Try again tomorrow!'
      });
    }

    const scoreNum = Number(score);
    const timeNum = Number(time) || 0;
    const accuracyNum = Number(accuracy) || 0;
    const correctNum = Math.min(TOTAL_DAILY_TASKS, Math.max(0, parseInt(correctAnswers, 10) || 0));

    // Fixed reward for completion + bonus for correct answers (out of 7)
    const correctScale = correctNum / TOTAL_DAILY_TASKS;
    const dailyReward = DAILY_FIXED_COINS + Math.round(DAILY_BONUS_COINS * correctScale);
    const dailyXp = DAILY_FIXED_XP + Math.round(DAILY_BONUS_XP * correctScale);

    // Award rewards (only add coins if > 0; addCoins throws on 0)
    if (dailyReward > 0) {
      await user.addCoins(dailyReward, 'Daily Challenge');
    }
    user.experiencePoints = (user.experiencePoints || 0) + dailyXp;

    // Update user level
    const newLevel = Math.floor(user.experiencePoints / 100) + 1;
    if (newLevel > user.userLevel) {
      user.userLevel = newLevel;
    }

    setChallengeData(user, challengeKey, {
      completed: true,
      completedAt: new Date(),
      score: scoreNum,
      correctAnswers: correctNum,
      coinsAwarded: dailyReward,
      xpAwarded: dailyXp
    });

    await user.save();

    if (dailyReward > 0) {
      const balanceBefore = user.coinBalance - dailyReward;
      const transaction = new Transaction({
        user: user._id,
        type: 'earn',
        amount: dailyReward,
        description: 'Daily Challenge Completion',
        category: 'daily_challenge',
        balanceBefore,
        balanceAfter: user.coinBalance,
        metadata: {
          game,
          score: scoreNum,
          time: timeNum,
          accuracy: accuracyNum,
          correctAnswers: correctNum,
          xpEarned: dailyXp,
          challengeType: 'daily'
        }
      });
      await transaction.save();
    }

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
      const raw = user.dailyChallengeCompleted;
      const size = raw && (typeof raw.size === 'number' ? raw.size : Object.keys(raw).length);
      if (!raw || size === 0) continue;

      const today = new Date().toDateString();
      const entriesToKeep = new Map();
      const forEach = typeof raw.forEach === 'function' ? raw.forEach.bind(raw) : null;
      if (forEach) {
        forEach((value, key) => {
          if (value && value.completedAt && new Date(value.completedAt).toDateString() === today) {
            entriesToKeep.set(key, value);
          }
        });
      } else {
        Object.entries(raw).forEach(([key, value]) => {
          if (value && value.completedAt && new Date(value.completedAt).toDateString() === today) {
            entriesToKeep.set(key, value);
          }
        });
      }

      user.dailyChallengeCompleted = entriesToKeep;
      await user.save();
      resetCount++;
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

