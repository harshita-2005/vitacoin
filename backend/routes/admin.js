const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const Game = require('../models/Game');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');
const { addVerbalFromApi, addCodeBreakerFromApi } = require('../services/datasetService');
const { getDailyChallengeRecipe } = require('../utils/dailyChallengeRecipe');

/** Mirrors backend/routes/dailyChallenge.js reward formula (for admin display). */
const DAILY_FIXED_COINS = 5;
const DAILY_FIXED_XP = 10;
const DAILY_BONUS_COINS = 10;
const DAILY_BONUS_XP = 15;
const DAILY_TASKS = 7;

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

/**
 * Built-in 7-task daily challenge (date-based recipe + fixed server rewards).
 * Not the same as manually created Challenge documents.
 */
router.get('/daily-challenge/overview', async (req, res) => {
  try {
    const recipe = getDailyChallengeRecipe();

    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const d = now.getUTCDate();
    const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0));

    const match = {
      category: 'daily_challenge',
      type: 'earn',
      createdAt: { $gte: start, $lt: end }
    };

    const [totalCompletions, distinctUsers, coinsAgg, topParticipants, correctBreakdown] =
      await Promise.all([
        Transaction.countDocuments(match),
        Transaction.distinct('user', match),
        Transaction.aggregate([
          { $match: match },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Transaction.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$user',
              totalCoins: { $sum: '$amount' },
              completions: { $sum: 1 },
              lastAt: { $max: '$createdAt' }
            }
          },
          { $sort: { totalCoins: -1, lastAt: -1 } },
          { $limit: 20 },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'u'
            }
          },
          { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              userId: '$_id',
              totalCoins: 1,
              completions: 1,
              lastAt: 1,
              name: {
                $trim: {
                  input: {
                    $concat: [{ $ifNull: ['$u.firstName', ''] }, ' ', { $ifNull: ['$u.lastName', ''] }]
                  }
                }
              },
              email: '$u.email'
            }
          }
        ]),
        Transaction.aggregate([
          { $match: match },
          { $group: { _id: '$metadata.correctAnswers', count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ])
      ]);

    res.json({
      success: true,
      dateUtc: recipe.dateIso,
      note:
        'Recipe uses UTC date (same as the app). Player "today" for completion may follow the server timezone in user records; stats below are completions logged today in UTC.',
      recipe: {
        rounds: recipe.rounds,
        totalTasks: recipe.totalTasks,
        seed: recipe.seed
      },
      rewardRules: {
        summary: `${DAILY_FIXED_COINS} base coins + up to ${DAILY_BONUS_COINS} bonus scaled by correct tasks (out of ${DAILY_TASKS}).`,
        baseCoins: DAILY_FIXED_COINS,
        bonusCoinsMax: DAILY_BONUS_COINS,
        baseXp: DAILY_FIXED_XP,
        bonusXpMax: DAILY_BONUS_XP,
        tasks: DAILY_TASKS,
        minCoinsIfCompleted: DAILY_FIXED_COINS,
        maxCoinsIfCompleted: DAILY_FIXED_COINS + DAILY_BONUS_COINS
      },
      stats: {
        completionsLogged: totalCompletions,
        uniqueParticipants: distinctUsers.length,
        totalCoinsPaid: coinsAgg[0]?.total || 0
      },
      correctAnswerBreakdown: correctBreakdown.map((row) => ({
        correctAnswers: row._id == null ? null : row._id,
        completions: row.count
      })),
      topParticipants
    });
  } catch (error) {
    console.error('Daily challenge overview error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/** UTC Monday 00:00 to next Monday 00:00 */
function getUtcIsoWeekRange(ref = new Date()) {
  const y = ref.getUTCFullYear();
  const m = ref.getUTCMonth();
  const d = ref.getUTCDate();
  const day = new Date(Date.UTC(y, m, d)).getUTCDay(); // 0 Sun .. 6 Sat
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const start = new Date(Date.UTC(y, m, d - daysFromMonday, 0, 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

/**
 * Rolling automatic daily-challenge stats for current ISO week (UTC).
 */
router.get('/daily-challenge/weekly-summary', async (req, res) => {
  try {
    const { start, end } = getUtcIsoWeekRange();
    const match = {
      category: 'daily_challenge',
      type: 'earn',
      createdAt: { $gte: start, $lt: end }
    };

    const [totals, byDay, topParticipants] = await Promise.all([
      Promise.all([
        Transaction.countDocuments(match),
        Transaction.distinct('user', match),
        Transaction.aggregate([
          { $match: match },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]).then(([completions, distinctUsers, coinsAgg]) => ({
        completionsLogged: completions,
        uniqueParticipants: distinctUsers.length,
        totalCoinsPaid: coinsAgg[0]?.total || 0
      })),
      Transaction.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
            completions: { $sum: 1 },
            coins: { $sum: '$amount' },
            uniqueUsers: { $addToSet: '$user' }
          }
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: '$_id',
            completions: 1,
            coins: 1,
            uniqueParticipants: { $size: '$uniqueUsers' }
          }
        }
      ]),
      Transaction.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$user',
            totalCoins: { $sum: '$amount' },
            completions: { $sum: 1 }
          }
        },
        { $sort: { totalCoins: -1 } },
        { $limit: 15 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'u'
          }
        },
        { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            totalCoins: 1,
            completions: 1,
            name: {
              $trim: {
                input: {
                  $concat: [{ $ifNull: ['$u.firstName', ''] }, ' ', { $ifNull: ['$u.lastName', ''] }]
                }
              }
            },
            email: '$u.email'
          }
        }
      ])
    ]);

    res.json({
      success: true,
      weekUtcStart: start.toISOString().slice(0, 10),
      weekUtcEndExclusive: end.toISOString().slice(0, 10),
      note: 'Week runs Monday–Sunday UTC. Same automatic 7-task daily challenge; one completion per user per UTC day.',
      stats: totals,
      byDay,
      topParticipants
    });
  } catch (error) {
    console.error('Weekly daily-challenge summary error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
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

// Toggle challenge status — disabled: admin UI is read-only / stats-only for challenges
router.put('/challenges/:id/toggle', (req, res) => {
  return res.status(403).json({
    error: 'Managing challenges from the admin API is disabled. Challenges are automatic; use Admin → Challenges for stats.'
  });
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

// Get user details (admin) — no password; transactions loaded by query (User has no transactions ref)
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('badges', 'name icon description');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const recentTransactions = await Transaction.find({ user: req.params.id })
      .select('amount type description category createdAt balanceAfter')
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    const plain = user.toObject({ flattenMaps: true });
    plain.recentTransactions = recentTransactions;
    res.json(plain);
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

// Create new challenge — disabled (automatic daily challenge only in product)
router.post('/challenges', (req, res) => {
  return res.status(403).json({
    error:
      'Creating challenges from admin is disabled. The 7-task Daily Challenge is generated in code; use Admin → Challenges for daily/weekly stats.'
  });
});

// Create new game — disabled from product UI: games are coded templates; use seed scripts or DB tools if needed
router.post('/games', async (req, res) => {
  return res.status(400).json({
    error:
      'Creating games from the API is disabled. Embedded games are fixed modules; use Admin → Games to edit metadata (coins, timers, question count), or run backend seed scripts to add rows.'
  });
});

// Update challenge — disabled
router.put('/challenges/:id', (req, res) => {
  return res.status(403).json({
    error: 'Updating challenges from admin is disabled. Use Admin → Challenges for automatic daily challenge statistics.'
  });
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

// Delete challenge — disabled
router.delete('/challenges/:id', (req, res) => {
  return res.status(403).json({
    error: 'Deleting challenges from admin is disabled. Legacy DB rows may still appear in apps until removed via database tools.'
  });
});

// Delete game — blocked for embedded templates (would break the app)
router.delete('/games/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    if (game.type === 'embedded') {
      return res.status(400).json({
        error:
          'Embedded games cannot be deleted. Turn the game off with the visibility toggle or edit its metadata instead.'
      });
    }
    await Game.findByIdAndDelete(req.params.id);
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
