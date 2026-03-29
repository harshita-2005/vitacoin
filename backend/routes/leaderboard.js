const express = require('express');
const router = express.Router();
const User = require('../models/User');
const TaskCompletion = require('../models/TaskCompletion');
const Game = require('../models/Game');
const { protect } = require('../middleware/auth');

// @desc    Get overall leaderboard
// @route   GET /api/leaderboard
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { sortBy = 'coins', limit = 50, page = 1 } = req.query;
    
    const sortOptions = {
      coins: { coinBalance: -1 },
      experience: { experiencePoints: -1 },
      tasks: { gamesPlayedTotal: -1 },
      badges: { totalBadges: -1 }
    };

    const sortField = sortOptions[sortBy] || sortOptions.coins;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // User model uses experiencePoints (not experience); badges are on user.badges[];
    // games played = sum of gameProgress[*].timesPlayed
    const users = await User.aggregate([
      {
        $addFields: {
          gamesPlayedTotal: {
            $reduce: {
              input: { $objectToArray: { $ifNull: ['$gameProgress', {}] } },
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.v.timesPlayed', 0] }] }
            }
          },
          totalBadges: { $size: { $ifNull: ['$badges', []] } },
          experiencePoints: { $ifNull: ['$experiencePoints', 0] }
        }
      },
      {
        $sort: sortField
      },
      {
        $skip: skip
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          username: 1,
          coinBalance: 1,
          experiencePoints: 1,
          gamesPlayedTotal: 1,
          totalBadges: 1,
          profilePicture: 1,
          userLevel: 1
        }
      }
    ]);

    // Get total count for pagination
    const totalUsers = await User.countDocuments();

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalUsers / parseInt(limit)),
        hasNext: skip + users.length < totalUsers,
        hasPrev: parseInt(page) > 1
      },
      sortBy
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({
      error: 'Server error fetching leaderboard',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get daily leaderboard
// @route   GET /api/leaderboard/daily
// @access  Private
router.get('/daily', protect, async (req, res) => {
  try {
    const { date, sortBy = 'coins' } = req.query;
    
    // Parse date or use today
    let targetDate;
    if (date) {
      targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
    } else {
      targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);
    }

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const sortOptions = {
      coins: { dailyCoins: -1 },
      tasks: { dailyTasks: -1 },
      experience: { dailyExperience: -1 }
    };

    const sortField = sortOptions[sortBy] || sortOptions.coins;

    // Get daily task completions
    const dailyStats = await TaskCompletion.aggregate([
      {
        $match: {
          completedAt: {
            $gte: targetDate,
            $lt: nextDay
          }
        }
      },
      {
        $group: {
          _id: '$userId',
          dailyCoins: { $sum: '$reward.coins' },
          dailyTasks: { $sum: 1 },
          dailyExperience: { $sum: '$reward.experience' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $addFields: {
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          username: '$user.username',
          avatar: '$user.avatar'
        }
      },
      {
        $sort: sortField
      },
      {
        $limit: 50
      }
    ]);

    res.json({
      date: targetDate.toISOString().split('T')[0],
      stats: dailyStats,
      sortBy
    });
  } catch (error) {
    console.error('Daily leaderboard fetch error:', error);
    res.status(500).json({
      error: 'Server error fetching daily leaderboard',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get weekly leaderboard
// @route   GET /api/leaderboard/weekly
// @access  Private
router.get('/weekly', protect, async (req, res) => {
  try {
    const { week, sortBy = 'coins' } = req.query;
    
    // Parse week or use current week
    let startOfWeek;
    if (week) {
      const [year, weekNum] = week.split('-W');
      startOfWeek = new Date(year, 0, 1 + (weekNum - 1) * 7);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    } else {
      startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    }
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const sortOptions = {
      coins: { weeklyCoins: -1 },
      tasks: { weeklyTasks: -1 },
      experience: { weeklyExperience: -1 }
    };

    const sortField = sortOptions[sortBy] || sortOptions.coins;

    // Get weekly task completions
    const weeklyStats = await TaskCompletion.aggregate([
      {
        $match: {
          completedAt: {
            $gte: startOfWeek,
            $lt: endOfWeek
          }
        }
      },
      {
        $group: {
          _id: '$userId',
          weeklyCoins: { $sum: '$reward.coins' },
          weeklyTasks: { $sum: 1 },
          weeklyExperience: { $sum: '$reward.experience' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $addFields: {
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          username: '$user.username',
          avatar: '$user.avatar'
        }
      },
      {
        $sort: sortField
      },
      {
        $limit: 50
      }
    ]);

    res.json({
      week: `${startOfWeek.getFullYear()}-W${Math.ceil((startOfWeek.getDate() + startOfWeek.getDay()) / 7)}`,
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: new Date(endOfWeek.getTime() - 1).toISOString().split('T')[0],
      stats: weeklyStats,
      sortBy
    });
  } catch (error) {
    console.error('Weekly leaderboard fetch error:', error);
    res.status(500).json({
      error: 'Server error fetching weekly leaderboard',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get monthly leaderboard
// @route   GET /api/leaderboard/monthly
// @access  Private
router.get('/monthly', protect, async (req, res) => {
  try {
    const { month, sortBy = 'coins' } = req.query;
    
    // Parse month or use current month
    let startOfMonth;
    if (month) {
      const [year, monthNum] = month.split('-');
      startOfMonth = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    } else {
      startOfMonth = new Date();
      startOfMonth.setDate(1);
    }
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

    const sortOptions = {
      coins: { monthlyCoins: -1 },
      tasks: { monthlyTasks: -1 },
      experience: { monthlyExperience: -1 }
    };

    const sortField = sortOptions[sortBy] || sortOptions.coins;

    // Get monthly task completions
    const monthlyStats = await TaskCompletion.aggregate([
      {
        $match: {
          completedAt: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        }
      },
      {
        $group: {
          _id: '$userId',
          monthlyCoins: { $sum: '$reward.coins' },
          monthlyTasks: { $sum: 1 },
          monthlyExperience: { $sum: '$reward.experience' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $addFields: {
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          username: '$user.username',
          avatar: '$user.avatar'
        }
      },
      {
        $sort: sortField
      },
      {
        $limit: 50
      }
    ]);

    res.json({
      month: `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}`,
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      stats: monthlyStats,
      sortBy
    });
  } catch (error) {
    console.error('Monthly leaderboard fetch error:', error);
    res.status(500).json({
      error: 'Server error fetching monthly leaderboard',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get game-specific leaderboard
// @route   GET /api/leaderboard/game/:gameId
// @access  Private
router.get('/game/:gameId', protect, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { sortBy = 'score', limit = 50 } = req.query;

    // Verify game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const sortOptions = {
      score: { bestScore: -1 },
      plays: { totalPlays: -1 },
      wins: { totalWins: -1 }
    };

    const sortField = sortOptions[sortBy] || sortOptions.score;

    // Get game statistics from users
    const gameStats = await User.aggregate([
      {
        $lookup: {
          from: 'games',
          localField: '_id',
          foreignField: 'userId',
          as: 'gameStats'
        }
      },
      {
        $unwind: '$gameStats'
      },
      {
        $match: {
          'gameStats.gameId': gameId
        }
      },
      {
        $addFields: {
          bestScore: '$gameStats.bestScore',
          totalPlays: '$gameStats.totalPlays',
          totalWins: '$gameStats.totalWins',
          averageScore: '$gameStats.averageScore'
        }
      },
      {
        $sort: sortField
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          username: 1,
          avatar: 1,
          bestScore: 1,
          totalPlays: 1,
          totalWins: 1,
          averageScore: 1
        }
      }
    ]);

    res.json({
      game: {
        id: game._id,
        name: game.name,
        category: game.category
      },
      stats: gameStats,
      sortBy
    });
  } catch (error) {
    console.error('Game leaderboard fetch error:', error);
    res.status(500).json({
      error: 'Server error fetching game leaderboard',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get user's ranking and statistics
// @route   GET /api/leaderboard/user/:userId
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = 'overall' } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let userStats;
    let ranking;

    if (period === 'daily') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dailyCompletions = await TaskCompletion.find({
        userId,
        completedAt: { $gte: today, $lt: tomorrow }
      });

      userStats = {
        coins: dailyCompletions.reduce((sum, c) => sum + (c.reward.coins || 0), 0),
        tasks: dailyCompletions.length,
        experience: dailyCompletions.reduce((sum, c) => sum + (c.reward.experience || 0), 0)
      };

      // Get daily ranking
      const dailyRanking = await TaskCompletion.aggregate([
        {
          $match: {
            completedAt: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: '$userId',
            dailyCoins: { $sum: '$reward.coins' }
          }
        },
        {
          $sort: { dailyCoins: -1 }
        }
      ]);

      ranking = dailyRanking.findIndex(entry => entry._id.toString() === userId) + 1;
    } else {
      // Overall stats
      const completions = await TaskCompletion.find({ userId });
      userStats = {
        coins: user.coinBalance,
        tasks: completions.length,
        experience: user.experience || 0,
        badges: completions.filter(c => c.reward.badgeId).length
      };

      // Get overall ranking
      const overallRanking = await User.aggregate([
        {
          $lookup: {
            from: 'taskcompletions',
            localField: '_id',
            foreignField: 'userId',
            as: 'completions'
          }
        },
        {
          $addFields: {
            totalTasks: { $size: '$completions' }
          }
        },
        {
          $sort: { coinBalance: -1 }
        }
      ]);

      ranking = overallRanking.findIndex(entry => entry._id.toString() === userId) + 1;
    }

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        avatar: user.avatar
      },
      stats: userStats,
      ranking,
      period
    });
  } catch (error) {
    console.error('User ranking fetch error:', error);
    res.status(500).json({
      error: 'Server error fetching user ranking',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
