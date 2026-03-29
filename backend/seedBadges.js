/**
 * Seeds exactly 10 catalog badges (upsert by name — does not wipe the collection).
 * Run: npm run seed-badges  (from backend folder)
 */
const mongoose = require('mongoose');
const Badge = require('./models/Badge');
require('dotenv').config();

const SAMPLE_BADGES = [
  {
    name: 'First Steps',
    description: 'Earn your first 100 Vitacoins',
    icon: '🌟',
    category: 'milestone',
    rarity: 'common',
    requirements: { coinsRequired: 100, tasksCompleted: 0, loginStreak: 0, transactionsRequired: 0 },
    rewards: { coins: 10, experience: 25 },
    isActive: true,
    isHidden: false
  },
  {
    name: 'Active Trader',
    description: 'Complete 10 wallet transactions',
    icon: '📊',
    category: 'milestone',
    rarity: 'uncommon',
    requirements: { coinsRequired: 0, tasksCompleted: 0, loginStreak: 0, transactionsRequired: 10 },
    rewards: { coins: 15, experience: 40 },
    isActive: true,
    isHidden: false
  },
  {
    name: 'Getting Started',
    description: 'Complete your first task',
    icon: '🎯',
    category: 'achievement',
    rarity: 'common',
    requirements: { tasksCompleted: 1, coinsRequired: 0, loginStreak: 0, transactionsRequired: 0 },
    rewards: { coins: 8, experience: 20 },
    isActive: true,
    isHidden: false
  },
  {
    name: 'Dedicated Player',
    description: 'Complete 5 tasks',
    icon: '📋',
    category: 'achievement',
    rarity: 'uncommon',
    requirements: { tasksCompleted: 5, coinsRequired: 0, loginStreak: 0, transactionsRequired: 0 },
    rewards: { coins: 20, experience: 50 },
    isActive: true,
    isHidden: false
  },
  {
    name: 'Task Veteran',
    description: 'Complete 10 tasks',
    icon: '🏅',
    category: 'achievement',
    rarity: 'rare',
    requirements: { tasksCompleted: 10, coinsRequired: 0, loginStreak: 0, transactionsRequired: 0 },
    rewards: { coins: 35, experience: 80 },
    isActive: true,
    isHidden: false
  },
  {
    name: 'Saving Up',
    description: 'Reach 250 Vitacoins in your balance',
    icon: '💰',
    category: 'milestone',
    rarity: 'uncommon',
    requirements: { coinsRequired: 250, tasksCompleted: 0, loginStreak: 0, transactionsRequired: 0 },
    rewards: { coins: 25, experience: 60 },
    isActive: true,
    isHidden: false
  },
  {
    name: 'Coin Builder',
    description: 'Reach 500 Vitacoins in your balance',
    icon: '💎',
    category: 'milestone',
    rarity: 'rare',
    requirements: { coinsRequired: 500, tasksCompleted: 0, loginStreak: 0, transactionsRequired: 0 },
    rewards: { coins: 50, experience: 100 },
    isActive: true,
    isHidden: false
  },
  {
    name: 'Streak Starter',
    description: 'Log in 3 days in a row',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    requirements: { loginStreak: 3, coinsRequired: 0, tasksCompleted: 0, transactionsRequired: 0 },
    rewards: { coins: 12, experience: 30 },
    isActive: true,
    isHidden: false
  },
  {
    name: 'Week Warrior',
    description: 'Maintain a 7-day login streak',
    icon: '📅',
    category: 'streak',
    rarity: 'uncommon',
    requirements: { loginStreak: 7, coinsRequired: 0, tasksCompleted: 0, transactionsRequired: 0 },
    rewards: { coins: 30, experience: 70 },
    isActive: true,
    isHidden: false
  },
  {
    name: 'Trader Plus',
    description: 'Complete 25 wallet transactions',
    icon: '⚡',
    category: 'milestone',
    rarity: 'epic',
    requirements: { coinsRequired: 0, tasksCompleted: 0, loginStreak: 0, transactionsRequired: 25 },
    rewards: { coins: 60, experience: 120 },
    isActive: true,
    isHidden: false
  }
];

async function seedBadges() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitacoin');
    console.log('MongoDB connected for badge seeding');

    let upserted = 0;
    for (const doc of SAMPLE_BADGES) {
      await Badge.findOneAndUpdate(
        { name: doc.name },
        { $set: doc },
        { upsert: true, new: true, runValidators: true }
      );
      upserted += 1;
    }

    const total = await Badge.countDocuments({ isActive: true, isHidden: false });
    console.log(`✓ Upserted ${upserted} badges (${total} active visible in catalog)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding badges:', error);
    process.exit(1);
  }
}

seedBadges();
