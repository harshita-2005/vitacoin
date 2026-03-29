const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['puzzle', 'action', 'strategy', 'quiz', 'memory', 'math', 'word', 'reaction'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  type: {
    type: String,
    enum: ['embedded', 'external', 'api'],
    required: true
  },
  // For embedded games (built into the app)
  gameConfig: {
    rules: String,
    timeLimit: Number, // in seconds (rewards / session timers where supported)
    maxScore: Number,
    /** @deprecated Prefer minScores — if set without per-tier overrides, applies to all difficulties */
    minScore: Number,
    /** Per-difficulty minimum % to earn coins/XP (easy / medium / hard) */
    minScores: {
      easy: { type: Number, min: 0, max: 100 },
      medium: { type: Number, min: 0, max: 100 },
      hard: { type: Number, min: 0, max: 100 }
    },
    instructions: String,
    /** When set, Math Quiz & Word Shuffle use this many questions/words (admin-tunable) */
    questionCount: Number
  },
  // For external games
  externalUrl: String,
  apiKey: String,
  gameId: String,
  // Reward configuration
  rewards: {
    baseCoins: {
      type: Number,
      default: 10
    },
    bonusCoins: {
      type: Number,
      default: 5
    },
    streakBonus: {
      type: Number,
      default: 2
    },
    perfectScoreBonus: {
      type: Number,
      default: 10
    },
    /** Optional: Easy-tier XP base; medium/hard scale 2× and 3×. Omit/unset = derive XP from baseCoins (default). */
    baseXp: {
      type: Number,
      min: 0
    }
  },
  // Game availability
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  // Game statistics
  stats: {
    totalPlays: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  },
  // Visual assets
  thumbnail: String,
  icon: String,
  color: String,
  // Metadata
  tags: [String],
  developer: String,
  version: {
    type: String,
    default: '1.0.0'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// Note: slug already has unique: true which creates an index, so we don't need to index it again
gameSchema.index({ category: 1, isActive: 1 });
gameSchema.index({ isFeatured: 1, isActive: 1 });

// Virtual for full game info
gameSchema.virtual('fullInfo').get(function() {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    description: this.description,
    category: this.category,
    difficulty: this.difficulty,
    type: this.type,
    rewards: this.rewards,
    stats: this.stats,
    thumbnail: this.thumbnail,
    icon: this.icon,
    color: this.color,
    isActive: this.isActive,
    isFeatured: this.isFeatured
  };
});

// Static method to get featured games
gameSchema.statics.getFeaturedGames = function() {
  return this.find({ isActive: true, isFeatured: true })
    .sort({ 'stats.totalPlays': -1 })
    .limit(6);
};

// Static method to get games by category
gameSchema.statics.getGamesByCategory = function(category, limit = 10) {
  return this.find({ isActive: true, category })
    .sort({ 'stats.totalPlays': -1 })
    .limit(limit);
};

// Static method to search games
gameSchema.statics.searchGames = function(query, limit = 10) {
  return this.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  })
  .sort({ 'stats.totalPlays': -1 })
  .limit(limit);
};

module.exports = mongoose.model('Game', gameSchema);
