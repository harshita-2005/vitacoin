const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  coinBalance: {
    type: Number,
    default: 0,
    min: [0, 'Coin balance cannot be negative']
  },
  totalEarned: {
    type: Number,
    default: 0,
    min: [0, 'Total earned cannot be negative']
  },
  badges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge'
  }],
  profilePicture: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  passwordResetOtpHash: {
    type: String,
    select: false,
    default: null
  },
  passwordResetOtpExpiresAt: {
    type: Date,
    select: false,
    default: null
  },
  passwordResetOtpVerifiedAt: {
    type: Date,
    select: false,
    default: null
  },
  passwordResetOtpLastSentAt: {
    type: Date,
    select: false,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  tasksCompleted: {
    type: Number,
    default: 0,
    min: [0, 'Tasks completed cannot be negative']
  },
  loginStreak: {
    type: Number,
    default: 0,
    min: [0, 'Login streak cannot be negative']
  },
  // Game progress tracking
  gameProgress: {
    type: Map,
    of: {
      level: {
        type: Number,
        default: 0,
        min: 0,
        max: 2 // 0 = Easy, 1 = Medium, 2 = Hard
      },
      unlocked: {
        type: Boolean,
        default: true
      },
      bestScore: {
        type: Number,
        default: 0
      },
      // Store best score per difficulty level
      scores: {
        easy: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard: { type: Number, default: 0 }
      },
      timesPlayed: {
        type: Number,
        default: 0
      }
    },
    default: {}
  },
  // Daily attempt tracking (resets daily)
  dailyAttempts: {
    type: Map,
    of: {
      type: Number,
      default: 0
    },
    default: {}
  },
  // Experience points and leveling system
  experiencePoints: {
    type: Number,
    default: 0,
    min: [0, 'Experience points cannot be negative']
  },
  userLevel: {
    type: Number,
    default: 1,
    min: [1, 'User level must be at least 1']
  },
  // Daily challenge completion tracking
  dailyChallengeCompleted: {
    type: Map,
    of: {
      completed: Boolean,
      completedAt: Date,
      score: Number,
      correctAnswers: Number,
      coinsAwarded: Number,
      xpAwarded: Number
    },
    default: {}
  },
  // Interview puzzle completion (Interview Arena)
  completedPuzzles: [{
    puzzleId: { type: String, required: true },
    completedAt: { type: Date, default: Date.now }
  }],
  // CS Fundamentals MCQ completion (Interview Arena)
  completedMcqs: [{
    mcqId: { type: String, required: true },
    completedAt: { type: Date, default: Date.now }
  }],
  // Times each catalog coupon id (1–6) was redeemed — next Vitacoin price increases per brand
  couponRedemptionCounts: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for badge count
userSchema.virtual('badgeCount').get(function() {
  return this.badges ? this.badges.length : 0;
});

// Index for leaderboard queries
userSchema.index({ coinBalance: -1 });
userSchema.index({ 'badges': 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to add coins
userSchema.methods.addCoins = function(amount, reason = 'Reward') {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  this.coinBalance += amount;
  this.totalEarned += amount;
  
  return this.save();
};

// Method to deduct coins
userSchema.methods.deductCoins = function(amount, reason = 'Deduction') {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  if (this.coinBalance < amount) {
    throw new Error('Insufficient coin balance');
  }
  
  this.coinBalance -= amount;
  
  return this.save();
};

// Method to add badge
userSchema.methods.addBadge = function(badgeId) {
  if (!this.badges.includes(badgeId)) {
    this.badges.push(badgeId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find({ isActive: true })
    .select('username firstName lastName coinBalance badges profilePicture')
    .populate('badges', 'name icon')
    .sort({ coinBalance: -1 })
    .limit(limit);
};

module.exports = mongoose.model('User', userSchema);
