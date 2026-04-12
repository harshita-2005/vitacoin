/**
 * Interview puzzle completion API.
 * Rewards are defined server-side; puzzle content lives in frontend dataset.
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { addXpAndLevel } = require('../utils/xpUser');

// Valid puzzle IDs and coin rewards (must match frontend interviewPuzzles.js ids)
const PUZZLE_REWARDS = {
  '3-bulbs-and-3-switches': 40,
  '100-prisoners-red-black-hats': 70,
  'monty-hall-problem': 50,
  'camel-and-banana': 60,
  'water-jug-problem': 45,
  'jar-contaminated-pills': 45,
  'gold-rod-7-units': 40,
  'fastest-3-horses': 50,
  '5-pirates-100-gold-coins': 65,
  '8-balls-problem': 45,
  'farmer-goat-wolf-cabbage': 45,
  'mislabeled-jars': 35,
  'heaven-and-hell': 50,
  '2-eggs-100-floors': 65,
  'torch-and-bridge': 60,
  'measuring-45-minutes-wires': 45,
  '10-coins-puzzle': 40,
  '3-ants-and-triangle': 45,
  'chessboard-and-dominos': 50,
  '50-red-50-blue-marbles': 50,
  'poison-and-rat': 60,
  'find-ages-of-daughters': 45,
  'bee-train-distance': 35,
  '3-cuts-8-equal-pieces': 35,
  'elevator-puzzle': 40,
  'ratio-boys-girls-country': 50,
  'maximum-chocolates': 45,
  'snail-and-wall': 30,
  'prisoner-and-policeman': 45,
  'blind-games': 55,
  'strategy-2-player-coin-game': 45,
  'minimum-cuts': 40,
  'hourglasses': 45,
  'four-people-rickety-bridge': 60,
  'circle-of-lights': 55,
  'injection-anesthesia': 45
};

// @route   GET /api/puzzles/user/completed
// @desc    Get current user's completed puzzle IDs
// @access  Private
router.get('/user/completed', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('completedPuzzles').lean();
    const completed = (user?.completedPuzzles || []).map(p => p.puzzleId);
    res.json({ completed });
  } catch (error) {
    console.error('Puzzles completed fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch completed puzzles' });
  }
});

// @route   POST /api/puzzles/complete
// @desc    Mark a puzzle as completed and award coins
// @access  Private
router.post('/complete', protect, async (req, res) => {
  try {
    const { puzzleId } = req.body;
    if (!puzzleId || typeof puzzleId !== 'string') {
      return res.status(400).json({ error: 'puzzleId is required' });
    }

    // Use defined reward or default 40 for any puzzle id from frontend dataset (100 puzzles)
    const reward = PUZZLE_REWARDS[puzzleId] ?? 40;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const completed = user.completedPuzzles || [];
    if (completed.some(p => p.puzzleId === puzzleId)) {
      return res.status(400).json({
        error: 'Puzzle already completed',
        alreadyCompleted: true
      });
    }

    const balanceBefore = user.coinBalance || 0;
    user.completedPuzzles.push({ puzzleId, completedAt: new Date() });
    user.coinBalance = balanceBefore + reward;
    user.totalEarned = (user.totalEarned || 0) + reward;
    const xpAwarded = Math.min(50, Math.max(8, Math.round(reward * 0.4)));
    addXpAndLevel(user, xpAwarded);
    await user.save();

    await Transaction.create({
      user: user._id,
      type: 'earn',
      amount: reward,
      balanceBefore,
      balanceAfter: user.coinBalance,
      description: `Interview puzzle completed: ${puzzleId}`,
      category: 'game_completion',
      metadata: { puzzleId }
    });

    res.json({
      success: true,
      puzzleId,
      coinsAwarded: reward,
      xpAwarded,
      newBalance: user.coinBalance,
      newExperiencePoints: user.experiencePoints,
      userLevel: user.userLevel,
      message: `Puzzle completed! +${reward} coins awarded.`
    });
  } catch (error) {
    console.error('Puzzle complete error:', error);
    res.status(500).json({ error: 'Failed to complete puzzle' });
  }
});

module.exports = router;
