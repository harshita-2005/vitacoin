const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const Game = require('../models/Game');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');
const { addVerbalFromApi, addCodeBreakerFromApi } = require('../services/datasetService');

// Admin middleware - check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Apply auth and admin middleware to all routes
router.use(protect, adminAuth);

// Get admin dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, activeChallenges, activeGames, totalCoins] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Challenge.countDocuments({ isActive: true }),
      Game.countDocuments({ isActive: true }),
      Transaction.aggregate([
        { $match: { type: 'earning' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      totalUsers,
      activeChallenges,
      activeGames,
      totalCoins: totalCoins[0]?.total || 0
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all challenges for admin
router.get('/challenges', async (req, res) => {
  try {
    const challenges = await Challenge.find()
      .populate('gameId', 'name thumbnail category')
      .populate('createdBy', 'firstName lastName username')
      .sort({ createdAt: -1 });

    res.json(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle challenge status
router.put('/challenges/:id/toggle', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    challenge.isActive = !challenge.isActive;
    await challenge.save();

    res.json({ success: true, challenge });
  } catch (error) {
    console.error('Error toggling challenge status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all games for admin
router.get('/games', async (req, res) => {
  try {
    const games = await Game.find()
      .sort({ createdAt: -1 });

    res.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle game status
router.put('/games/:id/toggle', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    game.isActive = !game.isActive;
    await game.save();

    res.json({ success: true, game });
  } catch (error) {
    console.error('Error toggling game status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users for admin
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('badges', 'name icon')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user details
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('badges', 'name icon description')
      .populate({
        path: 'transactions',
        select: 'amount type description createdAt',
        options: { sort: { createdAt: -1 }, limit: 10 }
      });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle user status
router.put('/users/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new challenge
router.post('/challenges', async (req, res) => {
  try {
    const {
      title,
      description,
      gameId,
      type,
      requirements,
      rewards,
      startDate,
      endDate,
      color,
      tags
    } = req.body;

    const challenge = new Challenge({
      title,
      description,
      gameId,
      type,
      requirements,
      rewards,
      startDate,
      endDate,
      color,
      tags,
      createdBy: req.user._id
    });

    await challenge.save();
    res.status(201).json(challenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new game
router.post('/games', async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      category,
      difficulty,
      type,
      gameConfig,
      rewards,
      thumbnail,
      icon,
      color,
      tags
    } = req.body;

    const game = new Game({
      name,
      slug,
      description,
      category,
      difficulty,
      type,
      gameConfig,
      rewards,
      thumbnail,
      icon,
      color,
      tags
    });

    await game.save();
    res.status(201).json(game);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update challenge
router.put('/challenges/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json(challenge);
  } catch (error) {
    console.error('Error updating challenge:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update game
router.put('/games/:id', async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete challenge
router.delete('/challenges/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndDelete(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json({ success: true, message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete game
router.delete('/games/:id', async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({ success: true, message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private/Admin
router.get('/settings', async (req, res) => {
  try {
    // For now, return default settings. In a real app, these would be stored in a database
    const settings = {
      maintenanceMode: false,
      allowRegistrations: true,
      emailNotifications: true,
      taskAutoExpiry: 30,
      challengeAutoExpiry: 7,
      maxTasksPerUser: 50,
      maxChallengesPerUser: 20
    };
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
router.put('/settings', async (req, res) => {
  try {
    const {
      maintenanceMode,
      allowRegistrations,
      emailNotifications,
      taskAutoExpiry,
      challengeAutoExpiry,
      maxTasksPerUser,
      maxChallengesPerUser
    } = req.body;

    // In a real app, you would save these to a database
    // For now, just return the updated settings
    const updatedSettings = {
      maintenanceMode,
      allowRegistrations,
      emailNotifications,
      taskAutoExpiry,
      challengeAutoExpiry,
      maxTasksPerUser,
      maxChallengesPerUser
    };

    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// @desc    Get system statistics
// @route   GET /api/admin/system-stats
// @access  Private/Admin
router.get('/system-stats', async (req, res) => {
  try {
    const Task = require('../models/Task');

    const [totalUsers, totalTasks, totalChallenges, totalTransactions] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      Challenge.countDocuments(),
      Transaction.countDocuments()
    ]);

    res.json({
      totalUsers,
      totalTasks,
      totalChallenges,
      totalTransactions,
      databaseSize: '15.2 MB' // Mock value for now
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
});

// ---------- Dataset (add data from external APIs) ----------

// @desc    Add Verbal IQ words from Datamuse API
// @route   POST /api/admin/dataset/verbal
// @access  Private/Admin
router.post('/dataset/verbal', async (req, res) => {
  try {
    const count = Math.min(parseInt(req.body.count, 10) || 10, 20);
    const { added, total } = await addVerbalFromApi(count);
    res.json({
      success: true,
      added,
      total,
      message: added > 0 ? `Added ${added} new word(s) to Verbal IQ dataset. Total: ${total}.` : 'No new words added (dataset may already include seed words).'
    });
  } catch (error) {
    console.error('Admin dataset verbal error:', error);
    res.status(500).json({ success: false, error: 'Failed to add verbal dataset' });
  }
});

// @desc    Add Code Breaker words from Datamuse API
// @route   POST /api/admin/dataset/codebreaker
// @access  Private/Admin
router.post('/dataset/codebreaker', async (req, res) => {
  try {
    const count = Math.min(parseInt(req.body.count, 10) || 15, 30);
    const { added, total } = await addCodeBreakerFromApi(count);
    res.json({
      success: true,
      added,
      total,
      message: added > 0 ? `Added ${added} new word(s) to Code Breaker dataset. Total: ${total}.` : 'No new words added.'
    });
  } catch (error) {
    console.error('Admin dataset codebreaker error:', error);
    res.status(500).json({ success: false, error: 'Failed to add codebreaker dataset' });
  }
});

module.exports = router;
