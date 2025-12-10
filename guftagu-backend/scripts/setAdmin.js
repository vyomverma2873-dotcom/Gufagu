require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = 'vyomverma2873@gmail.com';

async function setAdminPrivileges() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: ADMIN_EMAIL });

    if (!user) {
      console.log(`❌ User with email ${ADMIN_EMAIL} not found`);
      console.log('ℹ️  Please log in first to create the account, then run this script.');
      process.exit(1);
    }

    // Check if already admin
    if (user.isAdmin) {
      console.log(`✅ User ${ADMIN_EMAIL} is already an admin`);
    } else {
      // Set admin privileges
      user.isAdmin = true;
      await user.save();
      console.log(`✅ Admin privileges granted to ${ADMIN_EMAIL}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🆔 User ID: ${user.userId}`);
      console.log(`👤 Username: ${user.username || 'Not set'}`);
    }

    console.log('\n🎉 Done! Please log out and log back in to see the Admin Panel.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

setAdminPrivileges();
