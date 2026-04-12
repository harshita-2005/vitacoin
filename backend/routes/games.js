const express = require('express');
const mongoose = require('mongoose');
const Game = require('../models/Game');
const Challenge = require('../models/Challenge');
const UserChallenge = require('../models/UserChallenge');
const Transaction = require('../models/Transaction');
const { protect, adminOrModerator } = require('../middleware/auth');
const { ensureDefaultGamesIfEmpty } = require('../services/gameBootstrap');
const router = express.Router();

// @desc    Get all games
// @route   GET /api/games
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { category, difficulty, featured, search, limit = 20 } = req.query;
    let query = { isActive: true };
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (featured === 'true') query.isFeatured = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const games = await Game.find(query)
      .sort({ 'stats.totalPlays': -1 })
      .limit(parseInt(limit));

    res.json(games);
  } catch (error) {
    console.error('Games fetch error:', error);
    res.status(500).json({ 
      error: 'Server error fetching games',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get active games for users
// @route   GET /api/games/active
// @access  Private
router.get('/active', protect, async (req, res) => {
  try {
    // Lazy seed if startup bootstrap missed (e.g. DB not ready on first connect)
    await ensureDefaultGamesIfEmpty();

    const games = await Game.find({ isActive: true })
      .sort({ 'stats.totalPlays': -1 });

    res.json(games);
  } catch (error) {
    console.error('Active games fetch error:', error);
    res.status(500).json({ 
      error: 'Server error fetching active games',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get game by ID
// @route   GET /api/games/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Get related challenges
    const challenges = await Challenge.find({ 
      gameId: game._id, 
      isActive: true 
    }).limit(5);

    res.json({
      game,
      challenges
    });
  } catch (error) {
    console.error('Game fetch error:', error);
    res.status(500).json({ 
      error: 'Server error fetching game',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Submit game score
// @route   POST /api/games/:id/score
// @access  Private
router.post('/:id/score', protect, async (req, res) => {
  try {
    const { score, time, accuracy, challengeId } = req.body;
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Calculate rewards
    let coinsEarned = game.rewards.baseCoins;
    let bonusCoins = 0;

    // Perfect score bonus
    if (score >= game.rewards.perfectScoreBonus) {
      bonusCoins += game.rewards.bonusCoins;
    }

    // Time bonus (if applicable)
    if (time && game.gameConfig.timeLimit) {
      const timeBonus = Math.max(0, game.gameConfig.timeLimit - time);
      bonusCoins += Math.floor(timeBonus / 10); // 1 coin per 10 seconds saved
    }

    coinsEarned += bonusCoins;

    // Update game statistics
    game.stats.totalPlays += 1;
    game.stats.averageScore = ((game.stats.averageScore * (game.stats.totalPlays - 1)) + score) / game.stats.totalPlays;
    await game.save();

    // Create transaction
    const transaction = new Transaction({
      user: req.user._id,
      type: 'earn',
      amount: coinsEarned,
      description: `Game completion: ${game.name}`,
      category: 'task_completion',
      balanceBefore: req.user.coinBalance,
      balanceAfter: req.user.coinBalance + coinsEarned,
      metadata: {
        gameId: game._id,
        gameName: game.name,
        score: score,
        time: time,
        accuracy: accuracy,
        challengeId: challengeId
      }
    });

    await transaction.save();
    await req.user.addCoins(coinsEarned, `Game: ${game.name}`);

    // Update challenge progress if challengeId is provided
    let challengeProgress = null;
    if (challengeId) {
      challengeProgress = await UserChallenge.findOneAndUpdate(
        { user: req.user._id, challenge: challengeId },
        {
          $inc: { attempts: 1 },
          $set: { lastAttemptAt: new Date() },
          $push: {
            gameSessions: {
              score: score,
              time: time,
              accuracy: accuracy,
              date: new Date()
            }
          }
        },
        { new: true, upsert: true }
      ).populate('challenge');

      // Update best score
      if (score > challengeProgress.bestScore) {
        challengeProgress.bestScore = score;
        challengeProgress.bestTime = time;
        await challengeProgress.save();
      }

      // Check if challenge is completed
      const challenge = challengeProgress.challenge;
      if (score >= challenge.requirements.minScore && challengeProgress.status !== 'completed') {
        challengeProgress.status = 'completed';
        challengeProgress.completionDate = new Date();
        
        // Award challenge rewards
        const challengeRewards = challenge.rewards.coins || 0;
        if (challengeRewards > 0) {
          const challengeTransaction = new Transaction({
            user: req.user._id,
            type: 'earn',
            amount: challengeRewards,
            description: `Challenge completed: ${challenge.title}`,
            category: 'achievement',
            balanceBefore: req.user.coinBalance + coinsEarned,
            balanceAfter: req.user.coinBalance + coinsEarned + challengeRewards,
            metadata: {
              challengeId: challenge._id,
              challengeTitle: challenge.title,
              gameId: game._id,
              gameName: game.name
            }
          });

          await challengeTransaction.save();
          await req.user.addCoins(challengeRewards, `Challenge: ${challenge.title}`);
          coinsEarned += challengeRewards;
        }

        await challengeProgress.save();
      }
    }

    res.json({
      success: true,
      coinsEarned,
      bonusCoins,
      newBalance: req.user.coinBalance,
      message: `Congratulations! You earned ${coinsEarned} coins!`,
      challengeProgress
    });
  } catch (error) {
    console.error('Game score submission error:', error);
    res.status(500).json({ 
      error: 'Server error submitting score',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Create game (Admin only)
// @route   POST /api/games
// @access  Private (Admin)
router.post('/', protect, adminOrModerator, async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      category,
      difficulty,
      type,
      gameConfig,
      externalUrl,
      rewards,
      thumbnail,
      icon,
      color,
      tags
    } = req.body;

    if (!name || !slug || !description || !category || !type) {
      return res.status(400).json({ 
        error: 'Name, slug, description, category, and type are required' 
      });
    }

    const game = await Game.create({
      name,
      slug,
      description,
      category,
      difficulty,
      type,
      gameConfig,
      externalUrl,
      rewards,
      thumbnail,
      icon,
      color,
      tags,
      developer: req.user.username
    });

    res.status(201).json({
      game,
      message: 'Game created successfully'
    });
  } catch (error) {
    console.error('Game creation error:', error);
    res.status(500).json({ 
      error: 'Server error creating game',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update game (Admin only)
// @route   PUT /api/games/:id
// @access  Private (Admin)
router.put('/:id', protect, adminOrModerator, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update allowed fields
    const allowedFields = [
      'name', 'description', 'category', 'difficulty', 'type',
      'gameConfig', 'externalUrl', 'rewards', 'isActive', 'isFeatured',
      'thumbnail', 'icon', 'color', 'tags'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        game[field] = req.body[field];
      }
    });

    const updatedGame = await game.save();

    res.json({
      game: updatedGame,
      message: 'Game updated successfully'
    });
  } catch (error) {
    console.error('Game update error:', error);
    res.status(500).json({ 
      error: 'Server error updating game',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get game categories
// @route   GET /api/games/categories
// @access  Private
router.get('/categories', protect, async (req, res) => {
  try {
    const categories = [
      { value: 'puzzle', label: 'Puzzle', icon: '🧩' },
      { value: 'action', label: 'Action', icon: '⚡' },
      { value: 'strategy', label: 'Strategy', icon: '🎯' },
      { value: 'quiz', label: 'Quiz', icon: '❓' },
      { value: 'memory', label: 'Memory', icon: '🧠' },
      { value: 'math', label: 'Math', icon: '🔢' },
      { value: 'word', label: 'Word', icon: '📝' },
      { value: 'reaction', label: 'Reaction', icon: '⚡' }
    ];

    res.json(categories);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ 
      error: 'Server error fetching categories',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
