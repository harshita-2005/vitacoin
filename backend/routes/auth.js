const crypto = require('crypto');
const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect, generateToken, extractToken } = require('../middleware/auth');
const { setAuthCookie, clearAuthCookie } = require('../utils/authCookie');
const { isMailConfigured, sendPasswordResetOtpEmail } = require('../services/emailService');
const router = express.Router();

const PASSWORD_RESET_OTP_LENGTH = 6;
const PASSWORD_RESET_OTP_EXPIRY_MINUTES = parseInt(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES, 10) || 10;
const PASSWORD_RESET_OTP_RESEND_COOLDOWN_SECONDS = parseInt(process.env.PASSWORD_RESET_OTP_RESEND_COOLDOWN_SECONDS, 10) || 60;

function normalizeEmail(rawEmail) {
  return typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
}

function generateNumericOtp(length = PASSWORD_RESET_OTP_LENGTH) {
  let otp = '';
  while (otp.length < length) {
    otp += crypto.randomInt(0, 10).toString();
  }
  return otp.slice(0, length);
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

// @desc    Log out (clear httpOnly auth cookie)
// @route   POST /api/auth/logout
// @access  Public
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out successfully' });
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ 
        error: 'User already exists with this email or username' 
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName
    });

    if (user) {
      const token = generateToken(user._id);
      setAuthCookie(res, token);
      res.status(201).json({
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          coinBalance: user.coinBalance,
          totalEarned: user.totalEarned,
          experiencePoints: user.experiencePoints ?? 0,
          userLevel: user.userLevel ?? 1,
          badgeCount: user.badgeCount,
          role: user.role,
          couponRedemptionCounts: user.couponRedemptionCounts || {}
        },
        token
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Server error during registration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const rawEmail = req.body?.email;
    const password = req.body?.password;
    const email = normalizeEmail(rawEmail);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset demo user to fresh state on every login
    if (user.email === 'demo@vitacoin.com') {
      // Delete all transactions for demo user
      await Transaction.deleteMany({ user: user._id });
      
      // Reset user data
      user.coinBalance = 0;
      user.totalEarned = 0;
      user.experiencePoints = 0;
      user.userLevel = 1;
      // Reset game progress
      if (user.gameProgress && user.gameProgress instanceof Map) {
        user.gameProgress.clear();
      } else {
        user.gameProgress = new Map();
      }
      // Reset daily attempts
      if (user.dailyAttempts && user.dailyAttempts instanceof Map) {
        user.dailyAttempts.clear();
      } else {
        user.dailyAttempts = new Map();
      }
      // Reset daily challenge completion
      if (user.dailyChallengeCompleted && user.dailyChallengeCompleted instanceof Map) {
        user.dailyChallengeCompleted.clear();
      } else {
        user.dailyChallengeCompleted = new Map();
      }
      // Reset Interview Arena progress so puzzles and MCQs show as not completed
      user.completedPuzzles = [];
      user.completedMcqs = [];
      user.couponRedemptionCounts = {};
      // Clear badges (optional - remove if you want to keep badges)
      user.badges = [];
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    setAuthCookie(res, token);
    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        coinBalance: user.coinBalance,
        totalEarned: user.totalEarned,
        experiencePoints: user.experiencePoints ?? 0,
        userLevel: user.userLevel ?? 1,
        badgeCount: user.badgeCount,
        role: user.role,
        couponRedemptionCounts: user.couponRedemptionCounts || {}
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Server error during login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Request password reset OTP by email
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    if (!isMailConfigured()) {
      return res.status(500).json({
        error: 'Password reset email is not configured on the server'
      });
    }

    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email }).select(
      '+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpVerifiedAt +passwordResetOtpLastSentAt'
    );

    if (!user) {
      return res.json({
        message: 'If an account exists for this email, an OTP has been sent.'
      });
    }

    const now = Date.now();
    const lastSentAt = user.passwordResetOtpLastSentAt ? user.passwordResetOtpLastSentAt.getTime() : 0;
    const cooldownMs = PASSWORD_RESET_OTP_RESEND_COOLDOWN_SECONDS * 1000;

    if (lastSentAt && now - lastSentAt < cooldownMs) {
      return res.status(429).json({
        error: `Please wait ${PASSWORD_RESET_OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting another OTP`
      });
    }

    const otp = generateNumericOtp();
    user.passwordResetOtpHash = hashOtp(otp);
    user.passwordResetOtpExpiresAt = new Date(now + PASSWORD_RESET_OTP_EXPIRY_MINUTES * 60 * 1000);
    user.passwordResetOtpVerifiedAt = null;
    user.passwordResetOtpLastSentAt = new Date(now);
    await user.save();

    await sendPasswordResetOtpEmail({
      to: user.email,
      firstName: user.firstName,
      otp,
      expiresInMinutes: PASSWORD_RESET_OTP_EXPIRY_MINUTES
    });

    return res.json({
      message: 'If an account exists for this email, an OTP has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      error: 'Server error while requesting password reset',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Verify password reset OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email }).select(
      '+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpVerifiedAt'
    );

    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      return res.status(400).json({ error: 'No active password reset request found' });
    }

    if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
      user.passwordResetOtpHash = null;
      user.passwordResetOtpExpiresAt = null;
      user.passwordResetOtpVerifiedAt = null;
      await user.save();
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (user.passwordResetOtpHash !== hashOtp(otp)) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    user.passwordResetOtpVerifiedAt = new Date();
    await user.save();

    return res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    return res.status(500).json({
      error: 'Server error while verifying OTP',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Reset password using verified OTP
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
    const newPassword =
      typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ email }).select(
      '+password +passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpVerifiedAt'
    );

    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      return res.status(400).json({ error: 'No active password reset request found' });
    }

    if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
      user.passwordResetOtpHash = null;
      user.passwordResetOtpExpiresAt = null;
      user.passwordResetOtpVerifiedAt = null;
      await user.save();
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (user.passwordResetOtpHash !== hashOtp(otp)) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (!user.passwordResetOtpVerifiedAt) {
      return res.status(400).json({ error: 'Please verify the OTP before setting a new password' });
    }

    user.password = newPassword;
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpiresAt = null;
    user.passwordResetOtpVerifiedAt = null;
    user.passwordResetOtpLastSentAt = null;
    await user.save();

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      error: 'Server error while resetting password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('badges', 'name icon description rarity category');

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      coinBalance: user.coinBalance,
      totalEarned: user.totalEarned,
      badges: user.badges,
      badgeCount: user.badgeCount,
      profilePicture: user.profilePicture,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      error: 'Server error fetching profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, profilePicture, email } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    if (email !== undefined && typeof email === 'string') {
      const nextEmail = email.trim().toLowerCase();
      if (nextEmail && nextEmail !== user.email) {
        const taken = await User.findOne({
          email: nextEmail,
          _id: { $ne: user._id }
        });
        if (taken) {
          return res.status(400).json({ error: 'Email already in use' });
        }
        user.email = nextEmail;
      }
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      profilePicture: updatedUser.profilePicture,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      error: 'Server error updating profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      error: 'Server error changing password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
router.get('/verify', protect, (req, res) => {
  const token = extractToken(req);
  res.json({
    valid: true,
    user: req.user,
    message: 'Token is valid',
    ...(token ? { token } : {})
  });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      coinBalance: user.coinBalance,
      totalEarned: user.totalEarned,
      badgeCount: user.badgeCount,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, email, currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If updating password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change password' });
      }

      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Update password
      user.password = newPassword;
    }

    // Update other fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) {
      // Check if email is already taken by another user
      const emailExists = await User.findOne({ 
        email, 
        _id: { $ne: user._id } 
      });
      if (emailExists) {
        return res.status(400).json({ error: 'Email is already taken' });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        coinBalance: user.coinBalance,
        totalEarned: user.totalEarned,
        badgeCount: user.badgeCount,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      error: 'Server error updating profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
