const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createDemoUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitacoin');

    console.log('Connected to MongoDB');

    // Check if demo user already exists
    const existingDemo = await User.findOne({ email: 'demo@vitacoin.com' });
    if (existingDemo) {
      console.log('Demo user already exists');
      process.exit(0);
    }

    // Create demo user (regular user, not admin)
    const demoUser = new User({
      username: 'demo',
      email: 'demo@vitacoin.com',
      password: 'demo123',
      firstName: 'Demo',
      lastName: 'User',
      role: 'user',
      coinBalance: 100, // Give some starting coins for testing
      totalEarned: 100,
      isActive: true
    });

    await demoUser.save();
    console.log('Demo user created successfully');
    console.log('Email: demo@vitacoin.com');
    console.log('Password: demo123');
    console.log('Role: user (regular user, not admin)');
    console.log('Starting coins: 100');

    process.exit(0);
  } catch (error) {
    console.error('Error creating demo user:', error);
    process.exit(1);
  }
};

createDemoUser();

