const mongoose = require('mongoose');
const Game = require('./models/Game');
const sampleGames = require('./data/defaultGames');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitacoin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected for seeding games'))
  .catch((err) => console.error('MongoDB connection error:', err));

const seedGames = async () => {
  try {
    await Game.deleteMany({});
    console.log('Cleared existing games');

    const insertedGames = await Game.insertMany(sampleGames);
    console.log(`Successfully seeded ${insertedGames.length} games`);

    insertedGames.forEach((game) => {
      console.log(`- ${game.name} (${game.category}) - ${game.difficulty}`);
    });

    console.log('Game seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding games:', error);
    process.exit(1);
  }
};

seedGames();
