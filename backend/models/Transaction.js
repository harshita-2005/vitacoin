const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['earn', 'deduct', 'transfer', 'bonus', 'penalty'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        return v !== 0;
      },
      message: 'Transaction amount cannot be zero'
    }
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  category: {
    type: String,
    enum: [
      'task_completion',
      'daily_login',
      'streak_bonus',
      'achievement',
      'referral',
      'admin_reward',
      'admin_penalty',
      'system_bonus',
      'event_reward',
      'coupon_redemption',
      'game_completion',
      'daily_challenge',
      'other'
    ],
    default: 'other'
  },
  metadata: {
    taskId: String,
    taskName: String,
    badgeId: String,
    badgeName: String,
    eventId: String,
    eventName: String,
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    location: String,
    device: String,
    // Game-related metadata
    gameSlug: String,
    difficulty: String,
    score: Number,
    time: Number,
    accuracy: Number,
    xpEarned: Number,
    levelUnlocked: Boolean
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ category: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });

// Virtual for transaction direction
transactionSchema.virtual('isEarning').get(function() {
  return this.amount > 0;
});

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  const sign = this.amount > 0 ? '+' : '';
  return `${sign}${this.amount}`;
});

// Virtual for time ago
transactionSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
});

// Pre-save middleware to calculate balance after
transactionSchema.pre('save', function(next) {
  if (this.isNew) {
    this.balanceAfter = this.balanceBefore + this.amount;
  }
  next();
});

// Static method to get user transaction history
transactionSchema.statics.getUserHistory = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type,
    category,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const query = { user: userId, isVisible: true };
  
  if (type) query.type = type;
  if (category) query.category = category;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  return this.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('metadata.adminId', 'username firstName lastName');
};

// Static method to get transaction statistics
transactionSchema.statics.getUserStats = function(userId, startDate, endDate) {
  const matchStage = {
    user: new mongoose.Types.ObjectId(userId),
    isVisible: true
  };

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalEarned: {
          $sum: {
            $cond: [{ $gt: ['$amount', 0] }, '$amount', 0]
          }
        },
        totalDeducted: {
          $sum: {
            $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0]
          }
        },
        transactionCount: { $sum: 1 },
        earningCount: {
          $sum: { $cond: [{ $gt: ['$amount', 0] }, 1, 0] }
        },
        deductionCount: {
          $sum: { $cond: [{ $lt: ['$amount', 0] }, 1, 0] }
        }
      }
    }
  ]);
};

// Static method to create transaction
transactionSchema.statics.createTransaction = async function(userId, transactionData) {
  const user = await mongoose.model('User').findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const transaction = new this({
    user: userId,
    balanceBefore: user.coinBalance,
    ...transactionData
  });

  await transaction.save();
  return transaction;
};

module.exports = mongoose.model('Transaction', transactionSchema);
