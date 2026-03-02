const mongoose = require('mongoose');
const Game = require('./models/Game');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitacoin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for seeding games'))
.catch(err => console.error('MongoDB connection error:', err));

// Sample games data
const sampleGames = [
  {
    name: "Math Quiz",
    slug: "math-quiz",
    description: "Test your mathematical skills with various difficulty levels",
    icon: "🧮",
    category: "math",
    type: "embedded",
    difficulty: "easy",
    isActive: true,
    rewards: {
      baseCoins: 10,
      bonusCoins: 5,
      streakBonus: 2,
      perfectScoreBonus: 10
    },
    gameConfig: {
      rules: "Answer math questions correctly to earn points",
      timeLimit: 60,
      maxScore: 100,
      minScore: 0,
      instructions: "Solve the math problems as quickly as possible"
    }
  },
  {
    name: "Memory Game",
    slug: "memory-game",
    description: "Match pairs of cards to test your memory",
    icon: "🧠",
    category: "memory",
    type: "embedded",
    difficulty: "medium",
    isActive: true,
    rewards: {
      baseCoins: 15,
      bonusCoins: 10,
      streakBonus: 3,
      perfectScoreBonus: 15
    },
    gameConfig: {
      rules: "Find matching pairs of cards",
      timeLimit: 120,
      maxScore: 100,
      minScore: 0,
      instructions: "Click on cards to reveal them and find matches"
    }
  },
  {
    name: "Puzzle Solver",
    slug: "puzzle-solver",
    description: "Solve various logic puzzles and brain teasers",
    icon: "🧩",
    category: "puzzle",
    type: "embedded",
    difficulty: "hard",
    isActive: true,
    rewards: {
      baseCoins: 20,
      bonusCoins: 15,
      streakBonus: 5,
      perfectScoreBonus: 20
    },
    gameConfig: {
      rules: "Solve logic puzzles to progress",
      timeLimit: 300,
      maxScore: 100,
      minScore: 0,
      instructions: "Use logic and reasoning to solve each puzzle"
    }
  },
  {
    name: "Reaction Time",
    slug: "reaction-time",
    description: "Test your reflexes and reaction speed",
    icon: "⚡",
    category: "reaction",
    type: "embedded",
    difficulty: "medium",
    isActive: true,
    rewards: {
      baseCoins: 12,
      bonusCoins: 8,
      streakBonus: 3,
      perfectScoreBonus: 12
    },
    gameConfig: {
      rules: "Click as fast as possible when the screen changes color",
      timeLimit: 90,
      maxScore: 100,
      minScore: 0,
      instructions: "Wait for the screen to turn green, then click immediately"
    }
  },
  {
    name: "Word Scramble",
    slug: "word-scramble",
    description: "Unscramble letters to form words",
    icon: "📝",
    category: "word",
    type: "embedded",
    difficulty: "easy",
    isActive: true,
    rewards: {
      baseCoins: 8,
      bonusCoins: 6,
      streakBonus: 2,
      perfectScoreBonus: 8
    },
    gameConfig: {
      rules: "Unscramble the letters to form the correct word",
      timeLimit: 45,
      maxScore: 100,
      minScore: 0,
      instructions: "Rearrange the letters to spell the word correctly"
    }
  }
];

// Seed function
const seedGames = async () => {
  try {
    // Clear existing games
    await Game.deleteMany({});
    console.log('Cleared existing games');

    // Insert new games
    const insertedGames = await Game.insertMany(sampleGames);
    console.log(`Successfully seeded ${insertedGames.length} games`);

    // Display the seeded games
    insertedGames.forEach(game => {
      console.log(`- ${game.name} (${game.category}) - ${game.difficulty}`);
    });

    console.log('Game seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding games:', error);
    process.exit(1);
  }
};

// Run the seed function
seedGames();
