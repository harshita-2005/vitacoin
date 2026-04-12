const express = require('express');
const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const UserChallenge = require('../models/UserChallenge');
const User = require('../models/User'); // Add this import
const Game = require('../models/Game');
const { protect, adminOrModerator } = require('../middleware/auth');
const router = express.Router();

// @desc    Get all active challenges
// @route   GET /api/challenges
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { type, status, limit = 20 } = req.query;
    let query = { isActive: true };
    
    if (type) query.type = type;

    const challenges = await Challenge.find(query)
      .populate('gameId', 'name thumbnail category')
      .populate('rewards.badgeId', 'name icon')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Get user's progress for each challenge
    const userProgress = await UserChallenge.find({
      user: req.user._id,
      challenge: { $in: challenges.map(c => c._id) }
    });

    const challengesWithProgress = challenges.map(challenge => {
      const progress = userProgress.find(p => p.challenge.toString() === challenge._id.toString());
      return {
        ...challenge.toObject(),
        userProgress: progress || null
      };
    });

    res.json(challengesWithProgress);
  } catch (error) {
    console.error('Challenges fetch error:', error);
    res.status(500).json({ 
      error: 'Server error fetching challenges',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get active challenges for users
// @route   GET /api/challenges/active
// @access  Private
router.get('/active', protect, async (req, res) => {
  try {
    const challenges = await Challenge.find({ isActive: true })
      .populate('gameId', 'name thumbnail category')
      .populate('rewards.badgeId', 'name icon')
      .sort({ createdAt: -1 });

    res.json(challenges);
  } catch (error) {
    console.error('Active challenges fetch error:', error);
    res.status(500).json({ 
      error: 'Server error fetching active challenges',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get challenge by ID
// @route   GET /api/challenges/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('gameId', 'name thumbnail category description')
      .populate('rewards.badgeId', 'name icon description');

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Get user's progress
    const userProgress = await UserChallenge.findOne({
      user: req.user._id,
      challenge: challenge._id
    });

    // Get leaderboard
    const leaderboard = await UserChallenge.getChallengeLeaderboard(challenge._id, 10);

    res.json({
      challenge,
      userProgress,
      leaderboard
    });
  } catch (error) {
    console.error('Challenge fetch error:', error);
    res.status(500).json({ 
      error: 'Server error fetching challenge',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Create challenge (Admin only)
// @route   POST /api/challenges
// @access  Private (Admin)
router.post('/', protect, adminOrModerator, async (req, res) => {
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
      thumbnail,
      color,
      tags
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ 
        error: 'Title and description are required' 
      });
    }

    const challenge = await Challenge.create({
      title,
      description,
      gameId,
      type,
      requirements,
      rewards,
      startDate,
      endDate,
      thumbnail,
      color,
      tags,
      createdBy: req.user._id
    });

    res.status(201).json({
      challenge,
      message: 'Challenge created successfully'
    });
  } catch (error) {
    console.error('Challenge creation error:', error);
    res.status(500).json({ 
      error: 'Server error creating challenge',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update challenge (Admin only)
// @route   PUT /api/challenges/:id
// @access  Private (Admin)
router.put('/:id', protect, adminOrModerator, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Update allowed fields
    const allowedFields = [
      'title', 'description', 'gameId', 'type', 'requirements',
      'rewards', 'startDate', 'endDate', 'isActive', 'isFeatured',
      'thumbnail', 'color', 'tags'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        challenge[field] = req.body[field];
      }
    });

    const updatedChallenge = await challenge.save();

    res.json({
      challenge: updatedChallenge,
      message: 'Challenge updated successfully'
    });
  } catch (error) {
    console.error('Challenge update error:', error);
    res.status(500).json({ 
      error: 'Server error updating challenge',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Delete challenge (Admin only)
// @route   DELETE /api/challenges/:id
// @access  Private (Admin)
router.delete('/:id', protect, adminOrModerator, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Soft delete
    challenge.isActive = false;
    await challenge.save();

    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Challenge deletion error:', error);
    res.status(500).json({ 
      error: 'Server error deleting challenge',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get user's challenges
// @route   GET /api/challenges/user/progress
// @access  Private
router.get('/user/progress', protect, async (req, res) => {
  try {
    const { status, limit = 20 } = req.query;
    let query = { user: req.user._id };
    
    if (status) query.status = status;

    const userChallenges = await UserChallenge.find(query)
      .populate('challenge')
      .populate('challenge.gameId', 'name thumbnail category')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(userChallenges);
  } catch (error) {
    console.error('User challenges fetch error:', error);
    res.status(500).json({ 
      error: 'Server error fetching user challenges',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Start challenge
// @route   POST /api/challenges/:id/start
// @access  Private
router.post('/:id/start', protect, async (req, res) => {
  try {
    const { userId } = req.body;
    
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge || !challenge.isActive) {
      return res.status(404).json({ 
        success: false, 
        message: 'Challenge not found or inactive' 
      });
    }

    // Check if user already has an active challenge
    const existingUserChallenge = await UserChallenge.findOne({
      user: userId,
      challenge: challenge._id,
      status: 'active'
    });

    if (existingUserChallenge) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have an active challenge' 
      });
    }

    // Create or update user challenge record
    await UserChallenge.findOneAndUpdate(
      {
        user: userId,
        challenge: challenge._id
      },
      {
        status: 'active',
        startTime: new Date(),
        attempts: 1
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Challenge started successfully',
      challenge: {
        id: challenge._id,
        title: challenge.title,
        timeLimit: challenge.requirements?.timeLimit || 300
      }
    });
  } catch (error) {
    console.error('Error starting challenge:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to start challenge' 
    });
  }
});

// @desc    Complete challenge
// @route   POST /api/challenges/:id/complete
// @access  Private
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const { score, time, accuracy } = req.body;
    
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge || !challenge.isActive) {
      return res.status(404).json({ error: 'Challenge not found or inactive' });
    }

    // Get user's challenge progress
    const userChallenge = await UserChallenge.findOne({
      user: req.user._id,
      challenge: challenge._id
    });

    if (!userChallenge || userChallenge.status !== 'active') {
      return res.status(400).json({ error: 'Challenge not started or already completed' });
    }

    // Calculate time elapsed since challenge start
    const timeElapsed = Math.floor((Date.now() - userChallenge.startTime.getTime()) / 1000);
    
    // Check if challenge was completed within time limit
    const timeLimit = challenge.requirements?.timeLimit || 300; // Default 5 minutes
    const isTimeValid = timeElapsed <= timeLimit;
    
    // Check if score meets requirements
    const minScore = challenge.requirements?.minScore || 0;
    const isScoreValid = score >= minScore;
    
    // Determine if challenge is successfully completed
    const isSuccessful = isTimeValid && isScoreValid;
    
    // Update user challenge
    const updatedUserChallenge = await UserChallenge.findByIdAndUpdate(
      userChallenge._id,
      {
        status: isSuccessful ? 'completed' : 'failed',
        attempts: userChallenge.attempts + 1,
        bestScore: Math.max(userChallenge.bestScore, score),
        bestTime: isSuccessful ? timeElapsed : userChallenge.bestTime,
        completionDate: isSuccessful ? new Date() : null,
        lastAttemptAt: new Date(),
        'gameSessions.$[].score': score,
        'gameSessions.$[].time': timeElapsed,
        'gameSessions.$[].accuracy': accuracy,
        'gameSessions.$[].date': new Date()
      },
      { new: true }
    );

    // If successful, award rewards
    let rewards = { coinsEarned: 0, experienceEarned: 0 };
    let newBalance;
    let newExperiencePoints;
    let userLevelAfter;

    if (isSuccessful) {
      // Award challenge rewards
      rewards.coinsEarned = challenge.rewards.coins || 0;
      rewards.experienceEarned = challenge.rewards.experience || 0;

      // Update user's coin balance and experience (same field as games / leaderboard)
      const user = await User.findById(req.user._id);
      user.coinBalance += rewards.coinsEarned;
      user.experiencePoints = (user.experiencePoints || 0) + rewards.experienceEarned;
      const newLevel = Math.floor(user.experiencePoints / 100) + 1;
      if (newLevel > (user.userLevel || 1)) user.userLevel = newLevel;
      await user.save();

      newBalance = user.coinBalance;
      newExperiencePoints = user.experiencePoints;
      userLevelAfter = user.userLevel;

      // Update user challenge with rewards
      updatedUserChallenge.rewards = rewards;
      await updatedUserChallenge.save();
    }

    res.json({
      success: isSuccessful,
      userChallenge: updatedUserChallenge,
      timeElapsed,
      timeLimit,
      isTimeValid,
      isScoreValid,
      rewards: {
        ...rewards,
        coins: rewards.coinsEarned,
        experience: rewards.experienceEarned
      },
      ...(isSuccessful
        ? { newBalance, newExperiencePoints, userLevel: userLevelAfter }
        : {}),
      message: isSuccessful
        ? `Challenge completed successfully! Earned ${rewards.coinsEarned} coins and ${rewards.experienceEarned} XP`
        : `Challenge failed. Time: ${timeElapsed}s/${timeLimit}s, Score: ${score}/${minScore}`
    });

  } catch (error) {
    console.error('Challenge completion error:', error);
    res.status(500).json({ 
      error: 'Server error completing challenge',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get challenge statistics
// @route   GET /api/challenges/:id/stats
// @access  Private
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Get challenge statistics
    const stats = await UserChallenge.aggregate([
      { $match: { challenge: challenge._id } },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: 1 },
          completedParticipants: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          averageScore: { $avg: '$bestScore' },
          maxScore: { $max: '$bestScore' },
          averageTime: { $avg: '$bestTime' }
        }
      }
    ]);

    const challengeStats = stats[0] || {
      totalParticipants: 0,
      completedParticipants: 0,
      averageScore: 0,
      maxScore: 0,
      averageTime: 0
    };

    res.json({
      challenge,
      stats: challengeStats
    });
  } catch (error) {
    console.error('Challenge stats error:', error);
    res.status(500).json({ 
      error: 'Server error fetching challenge statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
