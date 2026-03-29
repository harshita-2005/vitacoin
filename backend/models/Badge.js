const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Badge name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Badge name cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Badge description is required'],
    trim: true,
    maxlength: [200, 'Badge description cannot exceed 200 characters']
  },
  icon: {
    type: String,
    required: [true, 'Badge icon is required'],
    trim: true
  },
  category: {
    type: String,
    enum: [
      'achievement',
      'milestone',
      'streak',
      'special',
      'event',
      'admin'
    ],
    default: 'achievement'
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  requirements: {
    coinsRequired: {
      type: Number,
      default: 0,
      min: [0, 'Coins required cannot be negative']
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
    transactionsRequired: {
      type: Number,
      default: 0,
      min: [0, 'Transactions required cannot be negative']
    },
    specialConditions: [{
      type: String,
      trim: true
    }]
  },
  rewards: {
    coins: {
      type: Number,
      default: 0,
      min: [0, 'Coin reward cannot be negative']
    },
    experience: {
      type: Number,
      default: 0,
      min: [0, 'Experience reward cannot be negative']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  unlockDate: {
    type: Date,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  },
  maxEarners: {
    type: Number,
    default: null,
    min: [1, 'Max earners must be at least 1']
  },
  currentEarners: {
    type: Number,
    default: 0,
    min: [0, 'Current earners cannot be negative']
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    eventId: String,
    eventName: String,
    version: {
      type: String,
      default: '1.0'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
badgeSchema.index({ category: 1, rarity: 1 });
badgeSchema.index({ isActive: 1, isHidden: 1 });
badgeSchema.index({ 'requirements.coinsRequired': 1 });
badgeSchema.index({ unlockDate: 1, expiryDate: 1 });

// Virtual for badge availability
badgeSchema.virtual('isAvailable').get(function() {
  const now = new Date();
  
  if (!this.isActive) return false;
  if (this.unlockDate && now < this.unlockDate) return false;
  if (this.expiryDate && now > this.expiryDate) return false;
  if (this.maxEarners && this.currentEarners >= this.maxEarners) return false;
  
  return true;
});

// Virtual for rarity color
badgeSchema.virtual('rarityColor').get(function() {
  const colors = {
    common: '#6c757d',
    uncommon: '#28a745',
    rare: '#007bff',
    epic: '#6f42c1',
    legendary: '#fd7e14'
  };
  return colors[this.rarity] || colors.common;
});

// Virtual for rarity background
badgeSchema.virtual('rarityBackground').get(function() {
  const backgrounds = {
    common: '#f8f9fa',
    uncommon: '#d4edda',
    rare: '#cce7ff',
    epic: '#e2d9f3',
    legendary: '#ffeaa7'
  };
  return backgrounds[this.rarity] || backgrounds.common;
});

// Method to check if user can earn this badge
badgeSchema.methods.canUserEarn = function(user) {
  if (!this.isAvailable) return false;

  const req = this.requirements || {};
  const hasId = (user.badges || []).some(
    (id) => id && id.toString() === this._id.toString()
  );
  if (hasId) return false;

  if ((req.coinsRequired || 0) > 0 && user.coinBalance < req.coinsRequired) return false;
  if ((req.tasksCompleted || 0) > 0 && (user.tasksCompleted || 0) < req.tasksCompleted) {
    return false;
  }
  if ((req.loginStreak || 0) > 0 && (user.loginStreak || 0) < req.loginStreak) return false;
  if ((req.transactionsRequired || 0) > 0) {
    const tx = typeof user.transactionCount === 'number' ? user.transactionCount : 0;
    if (tx < req.transactionsRequired) return false;
  }

  return true;
};

// Method to award badge to user
badgeSchema.methods.awardToUser = async function(userId) {
  const user = await mongoose.model('User').findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  if (!this.canUserEarn(user)) {
    throw new Error('User cannot earn this badge');
  }
  
  // Add badge to user
  await user.addBadge(this._id);
  
  // Award coin reward if any
  if (this.rewards.coins > 0) {
    await user.addCoins(this.rewards.coins, `Badge reward: ${this.name}`);
    
    // Create transaction record
    await mongoose.model('Transaction').createTransaction(userId, {
      type: 'earn',
      amount: this.rewards.coins,
      description: `Badge reward: ${this.name}`,
      category: 'achievement',
      metadata: {
        badgeId: this._id.toString(),
        badgeName: this.name
      }
    });
  }
  
  // Increment current earners count
  this.currentEarners += 1;
  await this.save();
  
  return user;
};

// Static method to get available badges
badgeSchema.statics.getAvailableBadges = function() {
  return this.find({ isActive: true, isHidden: false })
    .sort({ category: 1, rarity: 1, name: 1 });
};

// Static method to get badges by category
badgeSchema.statics.getByCategory = function(category) {
  return this.find({ 
    category, 
    isActive: true, 
    isHidden: false 
  }).sort({ rarity: 1, name: 1 });
};

// Static method to get rare badges
badgeSchema.statics.getRareBadges = function() {
  return this.find({ 
    rarity: { $in: ['rare', 'epic', 'legendary'] },
    isActive: true 
  }).sort({ rarity: 1, name: 1 });
};

module.exports = mongoose.model('Badge', badgeSchema);
