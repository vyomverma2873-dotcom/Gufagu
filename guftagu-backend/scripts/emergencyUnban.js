const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Ban = require('../models/Ban');

const ADMIN_EMAIL = 'vyomverma2873@gmail.com';

async function emergencyUnban() {
  try {
    console.log('🚨 Emergency Unban Script Starting...\n');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables!');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find the admin user
    const user = await User.findOne({ email: ADMIN_EMAIL });
    
    if (!user) {
      console.log(`❌ User with email ${ADMIN_EMAIL} not found!`);
      process.exit(1);
    }

    console.log(`📋 User found: ${user.username} (${user.userId})`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Admin: ${user.isAdmin}`);
    console.log(`   Banned: ${user.isBanned}\n`);

    // Find all active bans for this user
    const activeBans = await Ban.find({ 
      userId: user._id, 
      isActive: true 
    });

    if (activeBans.length === 0) {
      console.log('ℹ️  No active bans found for this user.');
    } else {
      console.log(`🔍 Found ${activeBans.length} active ban(s):\n`);
      
      activeBans.forEach((ban, index) => {
        console.log(`   Ban #${index + 1}:`);
        console.log(`   - Reason: ${ban.reason}`);
        console.log(`   - Type: ${ban.banType}`);
        console.log(`   - Banned At: ${ban.bannedAt}`);
        console.log(`   - Banned By: ${ban.bannedByUsername || 'Unknown'}`);
        console.log(`   - Description: ${ban.description || 'None'}\n`);
      });

      // Deactivate all bans
      console.log('🔓 Deactivating all bans...');
      await Ban.updateMany(
        { userId: user._id, isActive: true },
        { 
          $set: { 
            isActive: false,
            unbannedAt: new Date(),
            unbannedByUsername: 'Emergency Script',
            unbanReason: 'Emergency admin unban via script'
          }
        }
      );
      console.log('✅ All bans deactivated\n');
    }

    // Update user's banned status
    if (user.isBanned) {
      console.log('👤 Updating user banned status...');
      user.isBanned = false;
      user.banReason = null;
      await user.save();
      console.log('✅ User unbanned status updated\n');
    }

    // Ensure admin status is set
    if (!user.isAdmin) {
      console.log('🛡️  Restoring admin privileges...');
      user.isAdmin = true;
      await user.save();
      console.log('✅ Admin privileges restored\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 EMERGENCY UNBAN COMPLETED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`✅ User: ${user.username}`);
    console.log(`✅ Email: ${user.email}`);
    console.log(`✅ Banned: ${user.isBanned}`);
    console.log(`✅ Admin: ${user.isAdmin}`);
    console.log(`✅ Active Bans: 0\n`);
    console.log('You can now log in to your account!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during emergency unban:', error);
    process.exit(1);
  }
}

// Run the script
emergencyUnban();
