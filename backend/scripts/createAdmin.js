const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');

// Load .env from backend folder no matter where the script is invoked from
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ADMIN_EMAIL = 'admin@vitacoin.com';
const ADMIN_PASSWORD = 'admin123';

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitacoin');

    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      // Always refresh password + role so login works (same as reset-admin)
      console.log('Admin user already exists — resetting password and admin role...');
      existingAdmin.password = ADMIN_PASSWORD;
      existingAdmin.isActive = true;
      existingAdmin.role = 'admin';
      existingAdmin.coinBalance = Math.max(existingAdmin.coinBalance || 0, 1000);
      existingAdmin.totalEarned = Math.max(existingAdmin.totalEarned || 0, 1000);
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully');
    } else {
      const adminUser = new User({
        username: 'admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        coinBalance: 1000,
        totalEarned: 1000,
        isActive: true
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully');
    }

    console.log('\n📋 Admin credentials:');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log('Role: admin');
    console.log('\nLogin at: http://localhost:3000/login');
    console.log('(If login still fails, run: npm run test-admin)');

    process.exit(0);
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
