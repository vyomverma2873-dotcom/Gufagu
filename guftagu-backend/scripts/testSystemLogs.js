const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const SystemLog = require('../models/SystemLog');
const User = require('../models/User');

async function testSystemLogs() {
  try {
    console.log('🧪 Testing System Logs...\n');
    
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found!');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find admin user
    const adminUser = await User.findOne({ email: 'vyomverma2873@gmail.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }

    console.log(`📋 Admin user: ${adminUser.username} (${adminUser._id})\n`);

    // Check existing logs
    const existingLogs = await SystemLog.countDocuments();
    console.log(`📊 Existing logs in database: ${existingLogs}\n`);

    // Create test logs
    console.log('📝 Creating test logs...\n');

    const testLogs = [
      {
        action: 'user_banned',
        performedBy: adminUser._id,
        targetUser: adminUser._id,
        details: { reason: 'test_ban', type: 'temporary' },
        level: 'warning',
      },
      {
        action: 'user_unbanned',
        performedBy: adminUser._id,
        targetUser: adminUser._id,
        details: { reason: 'test_unban' },
        level: 'info',
      },
      {
        action: 'report_reviewed',
        performedBy: adminUser._id,
        details: { reportId: 'test123', status: 'reviewed', action: 'warning_issued' },
        level: 'info',
      },
    ];

    const createdLogs = await SystemLog.insertMany(testLogs);
    console.log(`✅ Created ${createdLogs.length} test logs\n`);

    // Query logs with population
    const logs = await SystemLog.find()
      .populate('performedBy', 'username displayName')
      .populate('targetUser', 'username displayName')
      .sort('-createdAt')
      .limit(5);

    console.log('📋 Sample logs from database:\n');
    logs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.action}`);
      console.log(`     Performed by: ${log.performedBy?.username || 'Unknown'}`);
      console.log(`     Target: ${log.targetUser?.username || 'N/A'}`);
      console.log(`     Created: ${log.createdAt}`);
      console.log(`     Details: ${JSON.stringify(log.details)}`);
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ System Logs Test Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

testSystemLogs();
