const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const recreateAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitacoin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Remove existing admin user
    const deletedAdmin = await User.findOneAndDelete({ email: 'admin@vitacoin.com' });
    if (deletedAdmin) {
      console.log('🗑️ Removed existing admin user');
    } else {
      console.log('ℹ️ No existing admin user found');
    }

    // Create fresh admin user
    console.log('Creating new admin user...');
    
    const adminUser = new User({
      username: 'admin',
      email: 'admin@vitacoin.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      coinBalance: 1000,
      totalEarned: 1000,
      isActive: true,
      tasksCompleted: 0,
      loginStreak: 0
    });

    await adminUser.save();
    console.log('✅ New admin user created successfully');

    console.log('\n📋 Fresh Admin Credentials:');
    console.log('Email: admin@vitacoin.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    console.log('Starting Balance: 1000 coins');
    console.log('\n🔗 You can now login at: http://localhost:3000/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error recreating admin user:', error);
    process.exit(1);
  }
};

recreateAdminUser();
