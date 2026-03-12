const express = require('express');
const Badge = require('../models/Badge');
const User = require('../models/User');
const { protect, adminOrModerator } = require('../middleware/auth');
const router = express.Router();

// @desc    Get all available badges
// @route   GET /api/badges
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { category, rarity, limit = 50 } = req.query;

    let query = { isActive: true, isHidden: false };
    
    if (category) query.category = category;
    if (rarity) query.rarity = rarity;

    const badges = await Badge.find(query)
      .sort({ category: 1, rarity: 1, name: 1 })
      .limit(parseInt(limit));

    res.json(badges);
  } catch (error) {
    console.error('Badges fetch error:', error);
    res.status(500).json({ 
      error: 'Server error fetching badges',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get user badges
// @route   GET /api/badges/user
// @access  Private
router.get('/user', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('badges', 'name icon description rarity category requirements rewards');

    res.json({
      badges: user.badges,
      badgeCount: user.badgeCount,
      totalBadges: await Badge.countDocuments({ isActive: true, isHidden: false })
    });
  } catch (error) {
    console.error('User badges fetch error:', error);
    res.status(500).json({ 
      error: 'Server error fetching user badges',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get badge categories (must be before /:id)
// @route   GET /api/badges/categories
// @access  Private
router.get('/categories', protect, async (req, res) => {
  try {
    const categories = [
      { value: 'achievement', label: 'Achievement' },
      { value: 'milestone', label: 'Milestone' },
      { value: 'streak', label: 'Streak' },
      { value: 'special', label: 'Special' },
      { value: 'event', label: 'Event' },
      { value: 'admin', label: 'Admin' }
    ];
    res.json(categories);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Server error fetching categories', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// @desc    Get badge rarities (must be before /:id)
// @route   GET /api/badges/rarities
// @access  Private
router.get('/rarities', protect, async (req, res) => {
  try {
    const rarities = [
      { value: 'common', label: 'Common', color: '#6c757d' },
      { value: 'uncommon', label: 'Uncommon', color: '#28a745' },
      { value: 'rare', label: 'Rare', color: '#007bff' },
      { value: 'epic', label: 'Epic', color: '#6f42c1' },
      { value: 'legendary', label: 'Legendary', color: '#fd7e14' }
    ];
    res.json(rarities);
  } catch (error) {
    console.error('Rarities fetch error:', error);
    res.status(500).json({ error: 'Server error fetching rarities', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// @desc    Get user badge progress (must be before /:id)
// @route   GET /api/badges/progress
// @access  Private
router.get('/progress', protect, async (req, res) => {
  try {
    const BadgeService = require('../services/badgeService');
    const progress = await BadgeService.getUserBadgeProgress(req.user._id);
    if (!progress) return res.status(404).json({ error: 'User not found' });
    res.json({ progress });
  } catch (error) {
    console.error('Badge progress fetch error:', error);
    res.status(500).json({ error: 'Server error fetching badge progress', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// @desc    Get recommended badges for user (must be before /:id)
// @route   GET /api/badges/recommended
// @access  Private
router.get('/recommended', protect, async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized', recommended: [] });
    const BadgeService = require('../services/badgeService');
    const recommended = await BadgeService.getRecommendedBadges(userId);
    res.json({ recommended: Array.isArray(recommended) ? recommended : [] });
  } catch (error) {
    console.error('Recommended badges fetch error:', error);
    res.status(200).json({ recommended: [] });
  }
});

// @desc    Get badge by ID
// @route   GET /api/badges/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);
    
    if (!badge) {
      return res.status(404).json({ error: 'Badge not found' });
    }

    // Check if user has this badge
    const user = await User.findById(req.user._id);
    const hasBadge = user.badges.includes(badge._id);

    res.json({
      badge,
      hasBadge,
      canEarn: badge.canUserEarn(user)
    });
  } catch (error) {
    console.error('Badge fetch error:', error);
    res.status(500).json({ 
      error: 'Server error fetching badge',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Award badge to user (Admin/Moderator only)
// @route   POST /api/badges/:id/award
// @access  Private (Admin/Moderator)
router.post('/:id/award', protect, adminOrModerator, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const badge = await Badge.findById(req.params.id);
    if (!badge) {
      return res.status(404).json({ error: 'Badge not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!badge.canUserEarn(user)) {
      return res.status(400).json({ error: 'User cannot earn this badge' });
    }

    const updatedUser = await badge.awardToUser(userId);

    res.json({
      message: `Badge "${badge.name}" awarded to ${user.username}`,
      user: updatedUser,
      badge: badge
    });
  } catch (error) {
    console.error('Badge award error:', error);
    res.status(500).json({ 
      error: 'Server error awarding badge',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Create badge (Admin only)
// @route   POST /api/badges
// @access  Private (Admin)
router.post('/', protect, adminOrModerator, async (req, res) => {
  try {
    const {
      name,
      description,
      icon,
      category,
      rarity,
      requirements,
      rewards,
      isHidden,
      unlockDate,
      expiryDate,
      maxEarners,
      tags
    } = req.body;

    if (!name || !description || !icon) {
      return res.status(400).json({ 
        error: 'Name, description, and icon are required' 
      });
    }

    const badge = await Badge.create({
      name,
      description,
      icon,
      category: category || 'achievement',
      rarity: rarity || 'common',
      requirements: requirements || {},
      rewards: rewards || {},
      isHidden: isHidden || false,
      unlockDate: unlockDate || null,
      expiryDate: expiryDate || null,
      maxEarners: maxEarners || null,
      tags: tags || [],
      metadata: {
        createdBy: req.user._id,
        version: '1.0'
      }
    });

    res.status(201).json({
      badge,
      message: 'Badge created successfully'
    });
  } catch (error) {
    console.error('Badge creation error:', error);
    res.status(500).json({ 
      error: 'Server error creating badge',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update badge (Admin only)
// @route   PUT /api/badges/:id
// @access  Private (Admin)
router.put('/:id', protect, adminOrModerator, async (req, res) => {
  try {
    const {
      name,
      description,
      icon,
      category,
      rarity,
      requirements,
      rewards,
      isActive,
      isHidden,
      unlockDate,
      expiryDate,
      maxEarners,
      tags
    } = req.body;

    const badge = await Badge.findById(req.params.id);
    if (!badge) {
      return res.status(404).json({ error: 'Badge not found' });
    }

    // Update fields
    if (name) badge.name = name;
    if (description) badge.description = description;
    if (icon) badge.icon = icon;
    if (category) badge.category = category;
    if (rarity) badge.rarity = rarity;
    if (requirements) badge.requirements = { ...badge.requirements, ...requirements };
    if (rewards) badge.rewards = { ...badge.rewards, ...rewards };
    if (isActive !== undefined) badge.isActive = isActive;
    if (isHidden !== undefined) badge.isHidden = isHidden;
    if (unlockDate !== undefined) badge.unlockDate = unlockDate;
    if (expiryDate !== undefined) badge.expiryDate = expiryDate;
    if (maxEarners !== undefined) badge.maxEarners = maxEarners;
    if (tags) badge.tags = tags;

    const updatedBadge = await badge.save();

    res.json({
      badge: updatedBadge,
      message: 'Badge updated successfully'
    });
  } catch (error) {
    console.error('Badge update error:', error);
    res.status(500).json({ 
      error: 'Server error updating badge',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Delete badge (Admin only)
// @route   DELETE /api/badges/:id
// @access  Private (Admin)
router.delete('/:id', protect, adminOrModerator, async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);
    if (!badge) {
      return res.status(404).json({ error: 'Badge not found' });
    }

    // Check if badge has been awarded to users
    const usersWithBadge = await User.countDocuments({ badges: badge._id });
    if (usersWithBadge > 0) {
      return res.status(400).json({ 
        error: `Cannot delete badge. It has been awarded to ${usersWithBadge} users.` 
      });
    }

    await Badge.findByIdAndDelete(req.params.id);

    res.json({ message: 'Badge deleted successfully' });
  } catch (error) {
    console.error('Badge deletion error:', error);
    res.status(500).json({ 
      error: 'Server error deleting badge',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Check and award badges for user
// @route   POST /api/badges/check
// @access  Private
router.post('/check', protect, async (req, res) => {
  try {
    const BadgeService = require('../services/badgeService');
    await BadgeService.checkAllBadges(req.user._id);
    
    res.json({ 
      message: 'Badge check completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Badge check error:', error);
    res.status(500).json({ 
      error: 'Server error checking badges',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
