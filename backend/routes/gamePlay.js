const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const GameRewardService = require('../services/gameRewardService');
const User = require('../models/User');
const Game = require('../models/Game');
const router = express.Router();

/**
 * @route   POST /api/game/start
 * @desc    Consume an attempt when starting a game
 * @access  Private
 */
router.post('/start', protect, async (req, res) => {
  try {
    const { game, difficulty } = req.body;

    if (!game || !difficulty) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: game, difficulty'
      });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid difficulty level. Must be: easy, medium, or hard'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // NOTE: For attempts we use the game slug identifier
    const result = await GameRewardService.consumeAttempt(user, game, difficulty);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({
      success: true,
      remainingAttempts: result.remainingAttempts
    });
  } catch (error) {
    console.error('Game start error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error starting game attempt',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/game/play
 * @desc    Process game completion with backend validation
 * @access  Private
 */
router.post('/play', protect, async (req, res) => {
  try {
    const { game, difficulty, score, time, accuracy, correctAnswers } = req.body;

    // Validation
    if (!game || !difficulty || score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: game, difficulty, score'
      });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid difficulty level. Must be: easy, medium, or hard'
      });
    }

    if (score < 0 || score > 100) {
      return res.status(400).json({
        success: false,
        error: 'Score must be between 0 and 100'
      });
    }

    // Get game by slug or ID
    // Check if 'game' is a valid ObjectId, otherwise search by slug only
    const isObjectId = mongoose.Types.ObjectId.isValid(game) && game.length === 24;
    const gameQuery = isObjectId
      ? { $or: [{ slug: game }, { _id: game }], isActive: true }
      : { slug: game, isActive: true };
    
    const gameDoc = await Game.findOne(gameQuery);

    if (!gameDoc) {
      return res.status(404).json({
        success: false,
        error: 'Game not found or inactive'
      });
    }

    // Get fresh user data
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Process game completion with backend validation
    const result = await GameRewardService.processGameCompletion(
      user,
      gameDoc.slug,
      difficulty,
      score,
      time || 0,
      accuracy || 0,
      correctAnswers || 0
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Update game statistics
    gameDoc.stats.totalPlays += 1;
    gameDoc.stats.averageScore = 
      ((gameDoc.stats.averageScore * (gameDoc.stats.totalPlays - 1)) + score) / 
      gameDoc.stats.totalPlays;
    await gameDoc.save();

    res.json({
      success: true,
      ...result,
      game: {
        name: gameDoc.name,
        slug: gameDoc.slug
      }
    });
  } catch (error) {
    console.error('Game play error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error processing game completion',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/game/progress/:gameSlug
 * @desc    Get user's progress for a specific game
 * @access  Private
 */
router.get('/progress/:gameSlug', protect, async (req, res) => {
  try {
    const { gameSlug } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const progress = GameRewardService.getUserGameProgress(user, gameSlug);

    res.json({
      success: true,
      gameSlug,
      ...progress
    });
  } catch (error) {
    console.error('Get game progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching game progress',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/game/validate/:gameSlug/:difficulty
 * @desc    Validate if user can play at specified difficulty
 * @access  Private
 */
router.get('/validate/:gameSlug/:difficulty', protect, async (req, res) => {
  try {
    const { gameSlug, difficulty } = req.params;

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid difficulty level'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const validation = await GameRewardService.validateAttempt(user, gameSlug, difficulty);

    res.json({
      success: validation.valid,
      ...validation
    });
  } catch (error) {
    console.error('Game validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error validating game attempt',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

