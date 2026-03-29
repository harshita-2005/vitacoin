const mongoose = require('mongoose');

/**
 * Singleton document: reward tuning for the built-in 7-task daily challenge.
 */
const dailyChallengeConfigSchema = new mongoose.Schema(
  {
    baseCoins: { type: Number, default: 5, min: 0, max: 10000 },
    baseXp: { type: Number, default: 10, min: 0, max: 100000 },
    bonusCoinsMax: { type: Number, default: 10, min: 0, max: 10000 },
    bonusXpMax: { type: Number, default: 15, min: 0, max: 100000 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DailyChallengeConfig', dailyChallengeConfigSchema);
