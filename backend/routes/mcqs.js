/**
 * CS Fundamentals MCQ completion API.
 * Awards coins and creates a transaction when user answers correctly.
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const MIN_REWARD = 1;
const MAX_REWARD = 100;

// @route   GET /api/mcqs/user/completed
// @desc    Get current user's completed MCQ IDs
// @access  Private
router.get('/user/completed', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('completedMcqs').lean();
    const completed = (user?.completedMcqs || []).map(m => m.mcqId);
    res.json({ completed });
  } catch (error) {
    console.error('MCQs completed fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch completed MCQs' });
  }
});

// @route   POST /api/mcqs/complete
// @desc    Mark an MCQ as completed and award coins
// @access  Private
router.post('/complete', protect, async (req, res) => {
  try {
    const { mcqId, reward: requestedReward, subject } = req.body;
    if (!mcqId || typeof mcqId !== 'string') {
      return res.status(400).json({ error: 'mcqId is required' });
    }

    const reward = Math.min(MAX_REWARD, Math.max(MIN_REWARD, parseInt(requestedReward, 10) || 10));

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const completed = user.completedMcqs || [];
    if (completed.some(m => m.mcqId === mcqId)) {
      return res.status(400).json({
        error: 'MCQ already completed',
        alreadyCompleted: true
      });
    }

    const balanceBefore = user.coinBalance || 0;
    user.completedMcqs.push({ mcqId, completedAt: new Date() });
    user.coinBalance = balanceBefore + reward;
    user.totalEarned = (user.totalEarned || 0) + reward;
    await user.save();

    const subjectLabel = subject || 'CS Fundamentals';
    const description = `CS Fundamentals (${subjectLabel}) – correct answer`;

    await Transaction.create({
      user: user._id,
      type: 'earn',
      amount: reward,
      balanceBefore,
      balanceAfter: user.coinBalance,
      description,
      category: 'task_completion',
      metadata: { mcqId, subject: subjectLabel }
    });

    res.json({
      success: true,
      mcqId,
      coinsAwarded: reward,
      newBalance: user.coinBalance,
      message: `Correct! +${reward} coins awarded.`
    });
  } catch (error) {
    console.error('MCQ complete error:', error);
    res.status(500).json({ error: 'Failed to complete MCQ' });
  }
});

// @route   POST /api/mcqs/complete-batch
// @desc    Mark multiple MCQs as completed and create a single transaction (batched session)
// @access  Private
router.post('/complete-batch', protect, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required and must not be empty' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const completed = user.completedMcqs || [];
    const seen = new Set();
    let totalCoins = 0;
    const toAdd = [];

    for (const it of items) {
      const mcqId = it.mcqId && typeof it.mcqId === 'string' ? it.mcqId : null;
      if (!mcqId || seen.has(mcqId)) continue;
      if (completed.some(m => m.mcqId === mcqId)) continue;
      seen.add(mcqId);
      const reward = Math.min(MAX_REWARD, Math.max(MIN_REWARD, parseInt(it.reward, 10) || 10));
      totalCoins += reward;
      toAdd.push({ mcqId, completedAt: new Date() });
    }

    if (toAdd.length === 0) {
      return res.json({
        success: true,
        coinsAwarded: 0,
        newBalance: user.coinBalance,
        completed: [],
        message: 'No new MCQs to award.'
      });
    }

    const balanceBefore = user.coinBalance || 0;
    user.completedMcqs.push(...toAdd);
    user.coinBalance = balanceBefore + totalCoins;
    user.totalEarned = (user.totalEarned || 0) + totalCoins;
    await user.save();

    const addedIds = new Set(toAdd.map(a => a.mcqId));
    const subjects = [...new Set(items.filter(it => addedIds.has(it.mcqId) && it.subject).map(it => it.subject))].filter(Boolean).sort();
    const subjectLabel = subjects.length ? ` (${subjects.join(', ')})` : '';
    const description = `CS Fundamentals – ${toAdd.length} correct${subjectLabel}`.slice(0, 200);
    await Transaction.create({
      user: user._id,
      type: 'earn',
      amount: totalCoins,
      balanceBefore,
      balanceAfter: user.coinBalance,
      description,
      category: 'task_completion',
      metadata: { mcqCount: toAdd.length, mcqIds: toAdd.map(a => a.mcqId), mcqSubjects: subjects }
    });

    const completedIds = toAdd.map(a => a.mcqId);
    res.json({
      success: true,
      coinsAwarded: totalCoins,
      newBalance: user.coinBalance,
      completed: completedIds,
      message: `CS Fundamentals – ${toAdd.length} correct, +${totalCoins} coins.`
    });
  } catch (error) {
    console.error('MCQ complete-batch error:', error);
    res.status(500).json({ error: 'Failed to complete MCQ batch' });
  }
});

module.exports = router;
