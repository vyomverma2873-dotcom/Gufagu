const User = require('../models/User');
const Report = require('../models/Report');
const Ban = require('../models/Ban');
const SystemLog = require('../models/SystemLog');
const Match = require('../models/Match');
const OnlineUser = require('../models/OnlineUser');
const Message = require('../models/Message');
const mongoose = require('mongoose');
const { sendBanNotificationEmail } = require('../utils/brevo');
const logger = require('../utils/logger');

// Get admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // User stats
    const totalUsers = await User.countDocuments();
    const usersToday = await User.countDocuments({ joinDate: { $gte: today } });
    const usersThisMonth = await User.countDocuments({ joinDate: { $gte: thisMonth } });
    const usersLastMonth = await User.countDocuments({ 
      joinDate: { $gte: lastMonth, $lt: thisMonth } 
    });
    const premiumUsers = await User.countDocuments({ isPremium: true });
    const bannedUsers = await User.countDocuments({ isBanned: true });

    // Online users
    const onlineUsers = await OnlineUser.countDocuments();

    // Match stats
    const totalMatches = await Match.countDocuments();
    const matchesToday = await Match.countDocuments({ startTime: { $gte: today } });
    const matchesThisMonth = await Match.countDocuments({ startTime: { $gte: thisMonth } });

    // Report stats
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const reportsToday = await Report.countDocuments({ createdAt: { $gte: today } });

    // Calculate growth percentages
    const userGrowth = usersLastMonth > 0 
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(1)
      : 0;

    res.json({
      stats: {
        totalUsers,
        usersToday,
        usersThisMonth,
        userGrowth,
        premiumUsers,
        bannedUsers,
        onlineUsers,
        totalMatches,
        matchesToday,
        matchesThisMonth,
        totalReports,
        pendingReports,
        reportsToday,
      },
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all users with pagination and filters
exports.getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status, 
      sort = '-joinDate' 
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { userId: search },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'banned') {
      query.isBanned = true;
    } else if (status === 'premium') {
      query.isPremium = true;
    } else if (status === 'active') {
      query.isBanned = { $ne: true };
    }

    const users = await User.find(query)
      .select('-__v')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user details
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-__v');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's reports
    const reportsMade = await Report.countDocuments({ reporter: userId });
    const reportsReceived = await Report.countDocuments({ reportedUser: userId });

    // Get user's matches
    const totalMatches = await Match.countDocuments({
      $or: [{ user1: userId }, { user2: userId }],
    });

    // Get ban history
    const banHistory = await Ban.find({ user: userId }).sort('-createdAt').limit(10);

    res.json({
      user,
      stats: {
        reportsMade,
        reportsReceived,
        totalMatches,
      },
      banHistory,
    });
  } catch (error) {
    logger.error('Get user details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Ban a user
exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration, type = 'temporary', description } = req.body;

    // Prevent admin from banning themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot ban yourself' });
    }

    // Validate required fields
    if (!reason) {
      return res.status(400).json({ error: 'Ban reason is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already banned
    if (user.isBanned) {
      return res.status(400).json({ error: 'User is already banned' });
    }

    // Calculate ban expiry date
    const banUntil = type === 'permanent' 
      ? null 
      : new Date(Date.now() + (duration || 24) * 60 * 60 * 1000);

    // Create ban record with correct field names matching Ban model
    const ban = new Ban({
      userId: userId,
      username: user.username,
      userId7Digit: user.userId,
      email: user.email,
      reason: reason,
      description: description || '',
      banType: type,
      bannedAt: new Date(),
      bannedBy: req.user._id,
      bannedByUsername: req.user.username,
      banUntil: banUntil,
      isActive: true,
    });
    await ban.save();

    // Update user
    user.isBanned = true;
    user.banReason = reason;
    user.banUntil = banUntil;
    await user.save();

    // Log action (non-blocking)
    try {
      await SystemLog.create({
        action: 'user_banned',
        performedBy: req.user._id,
        targetUser: userId,
        details: { reason, duration, type, description },
      });
    } catch (logError) {
      logger.warn('Failed to log ban action:', logError.message);
    }

    // Send ban notification email (non-blocking)
    try {
      await sendBanNotificationEmail(user.email, user.username || user.displayName, {
        reason,
        banType: type,
        banUntil,
        description,
        duration: duration || 24
      });
      logger.info(`Ban notification email sent to ${user.email}`);
    } catch (emailError) {
      logger.warn('Failed to send ban notification email:', emailError.message);
    }

    res.json({ 
      message: 'User banned successfully', 
      ban: {
        _id: ban._id,
        userId: ban.userId,
        reason: ban.reason,
        banType: ban.banType,
        banUntil: ban.banUntil,
        isActive: ban.isActive
      }
    });
  } catch (error) {
    logger.error('Ban user error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to ban user: ' + error.message });
  }
};

// Unban a user
exports.unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isBanned) {
      return res.status(400).json({ error: 'User is not banned' });
    }

    user.isBanned = false;
    user.banReason = undefined;
    user.banUntil = undefined;
    await user.save();

    // Update ban record - use correct field name 'userId' instead of 'user'
    await Ban.updateMany(
      { userId: userId, isActive: true },
      { 
        isActive: false, 
        unbannedAt: new Date(), 
        unbannedBy: req.user._id,
        unbannedByUsername: req.user.username
      }
    );

    // Log action (non-blocking)
    try {
      await SystemLog.create({
        action: 'user_unbanned',
        performedBy: req.user._id,
        targetUser: userId,
      });
    } catch (logError) {
      logger.warn('Failed to log unban action:', logError.message);
    }

    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    logger.error('Unban user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get reports
exports.getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.reason = type;

    const reports = await Report.find(query)
      .populate('reporterId', 'username displayName profilePicture userId')
      .populate('reportedUserId', 'username displayName profilePicture userId')
      .populate('reviewedBy', 'username displayName')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    // Transform to match frontend expectations
    const transformedReports = reports.map(report => ({
      _id: report._id,
      reporter: report.reporterId ? {
        _id: report.reporterId._id,
        username: report.reporterId.username,
        displayName: report.reporterId.displayName,
        profilePicture: report.reporterId.profilePicture,
        userId: report.reporterId.userId,
      } : {
        username: report.reporterUsername || 'Unknown',
        userId: report.reporterUserId7Digit,
      },
      reportedUser: report.reportedUserId ? {
        _id: report.reportedUserId._id,
        username: report.reportedUserId.username,
        displayName: report.reportedUserId.displayName,
        profilePicture: report.reportedUserId.profilePicture,
        userId: report.reportedUserId.userId,
      } : {
        username: report.reportedUsername || 'Unknown',
        userId: report.reportedUserId7Digit,
      },
      reason: report.reason,
      description: report.description,
      status: report.status,
      priority: report.priority,
      reviewedBy: report.reviewedBy,
      reviewedAt: report.reviewedAt,
      actionTaken: report.actionTaken,
      moderatorNotes: report.moderatorNotes,
      createdAt: report.createdAt,
      timestamp: report.timestamp,
    }));

    res.json({
      reports: transformedReports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get reports error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update report status
exports.updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, action, notes } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    report.status = status;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    report.reviewNotes = notes;
    report.actionTaken = action;
    await report.save();

    // Log action
    await SystemLog.create({
      action: 'report_reviewed',
      performedBy: req.user._id,
      details: { reportId, status, action },
    });

    res.json({ message: 'Report updated', report });
  } catch (error) {
    logger.error('Update report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get system logs
exports.getSystemLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, startDate, endDate } = req.query;

    const query = {};
    if (action) query.action = action;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await SystemLog.find(query)
      .populate('performedBy', 'username displayName')
      .populate('targetUser', 'username displayName')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await SystemLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get active bans
exports.getActiveBans = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const bans = await Ban.find({ isActive: true })
      .populate('userId', 'username displayName profilePicture userId email')
      .populate('bannedBy', 'username displayName')
      .sort('-bannedAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Ban.countDocuments({ isActive: true });

    // Transform the data to match frontend expectations
    const transformedBans = bans.map(ban => ({
      _id: ban._id,
      user: ban.userId ? {
        _id: ban.userId._id,
        username: ban.userId.username,
        displayName: ban.userId.displayName,
        profilePicture: ban.userId.profilePicture,
        userId: ban.userId.userId,
        email: ban.userId.email,
      } : {
        _id: ban.userId,
        username: ban.username || 'Unknown',
        displayName: ban.username,
        userId: ban.userId7Digit,
        email: ban.email,
      },
      reason: ban.reason,
      description: ban.description,
      type: ban.banType,
      expiresAt: ban.banUntil,
      bannedBy: ban.bannedBy ? {
        username: ban.bannedBy.username,
        displayName: ban.bannedBy.displayName,
      } : {
        username: ban.bannedByUsername || 'System',
        displayName: ban.bannedByUsername,
      },
      createdAt: ban.bannedAt,
      isActive: ban.isActive,
    }));

    res.json({
      bans: transformedBans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get bans error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all conversations list for export
exports.getConversationsList = async (req, res) => {
  try {
    const { search } = req.query;

    // Get all unique user pairs from messages
    const conversations = await Message.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $lt: ['$senderId', '$receiverId'] },
              { sender: '$senderId', receiver: '$receiverId' },
              { sender: '$receiverId', receiver: '$senderId' }
            ]
          },
          messageCount: { $sum: 1 },
          lastMessage: { $last: '$timestamp' },
          firstMessage: { $first: '$timestamp' }
        }
      },
      { $sort: { lastMessage: -1 } },
      { $limit: 100 }
    ]);

    // Get user details for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const user1 = await User.findById(conv._id.sender).select('username displayName userId email');
        const user2 = await User.findById(conv._id.receiver).select('username displayName userId email');
        
        return {
          user1: user1 ? {
            _id: user1._id,
            username: user1.username,
            displayName: user1.displayName,
            userId: user1.userId,
            email: user1.email
          } : null,
          user2: user2 ? {
            _id: user2._id,
            username: user2.username,
            displayName: user2.displayName,
            userId: user2.userId,
            email: user2.email
          } : null,
          messageCount: conv.messageCount,
          lastMessage: conv.lastMessage,
          firstMessage: conv.firstMessage
        };
      })
    );

    // Filter if search query provided
    let filteredConversations = populatedConversations.filter(c => c.user1 && c.user2);
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredConversations = filteredConversations.filter(c => 
        c.user1.username?.toLowerCase().includes(searchLower) ||
        c.user2.username?.toLowerCase().includes(searchLower) ||
        c.user1.email?.toLowerCase().includes(searchLower) ||
        c.user2.email?.toLowerCase().includes(searchLower) ||
        c.user1.userId?.includes(search) ||
        c.user2.userId?.includes(search)
      );
    }

    res.json({ conversations: filteredConversations });
  } catch (error) {
    logger.error('Get conversations list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Export chat messages as CSV
exports.exportChatMessages = async (req, res) => {
  try {
    const { user1Id, user2Id, startDate, endDate, format = 'csv' } = req.query;

    // Build query
    const query = {};
    
    // Convert string IDs to ObjectId
    const toObjectId = (id) => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        return null;
      }
    };
    
    if (user1Id && user2Id) {
      const user1ObjectId = toObjectId(user1Id);
      const user2ObjectId = toObjectId(user2Id);
      
      if (!user1ObjectId || !user2ObjectId) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }
      
      // Export conversation between two specific users
      query.$or = [
        { senderId: user1ObjectId, receiverId: user2ObjectId },
        { senderId: user2ObjectId, receiverId: user1ObjectId }
      ];
    } else if (user1Id) {
      const user1ObjectId = toObjectId(user1Id);
      
      if (!user1ObjectId) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }
      
      // Export all messages involving one user
      query.$or = [
        { senderId: user1ObjectId },
        { receiverId: user1ObjectId }
      ];
    }

    // Date filtering
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Fetch messages with user details
    const messages = await Message.find(query)
      .populate('senderId', 'username displayName userId email')
      .populate('receiverId', 'username displayName userId email')
      .sort('timestamp')
      .lean();

    if (messages.length === 0) {
      return res.status(404).json({ error: 'No messages found for the specified criteria' });
    }

    // Generate CSV content
    const csvHeaders = [
      'Message ID',
      'Sender ID (ObjectId)',
      'Sender User ID (7-digit)',
      'Sender Username',
      'Sender Display Name',
      'Sender Email',
      'Receiver ID (ObjectId)',
      'Receiver User ID (7-digit)',
      'Receiver Username',
      'Receiver Display Name',
      'Receiver Email',
      'Message Content',
      'Message Type',
      'Is Delivered',
      'Delivered At',
      'Is Read',
      'Read At',
      'Timestamp',
      'Created At',
      'Updated At',
      'Edited At',
      'Deleted At'
    ];

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = messages.map(msg => [
      escapeCSV(msg._id),
      escapeCSV(msg.senderId?._id || msg.senderId),
      escapeCSV(msg.senderId?.userId),
      escapeCSV(msg.senderId?.username),
      escapeCSV(msg.senderId?.displayName),
      escapeCSV(msg.senderId?.email),
      escapeCSV(msg.receiverId?._id || msg.receiverId),
      escapeCSV(msg.receiverId?.userId),
      escapeCSV(msg.receiverId?.username),
      escapeCSV(msg.receiverId?.displayName),
      escapeCSV(msg.receiverId?.email),
      escapeCSV(msg.content),
      escapeCSV(msg.messageType),
      escapeCSV(msg.isDelivered),
      escapeCSV(msg.deliveredAt),
      escapeCSV(msg.isRead),
      escapeCSV(msg.readAt),
      escapeCSV(msg.timestamp),
      escapeCSV(msg.createdAt),
      escapeCSV(msg.updatedAt),
      escapeCSV(msg.editedAt),
      escapeCSV(msg.deletedAt)
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Log export action (non-blocking)
    try {
      await SystemLog.create({
        action: 'chat_export',
        performedBy: req.user._id,
        details: {
          user1Id,
          user2Id,
          startDate,
          endDate,
          messageCount: messages.length
        }
      });
    } catch (logError) {
      logger.warn('Failed to log chat export action:', logError.message);
    }

    // Set headers for file download
    const filename = user1Id && user2Id 
      ? `chat_export_${user1Id}_${user2Id}_${Date.now()}.csv`
      : user1Id 
        ? `chat_export_user_${user1Id}_${Date.now()}.csv`
        : `chat_export_all_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (error) {
    logger.error('Export chat messages error:', error.message, error.stack);
    res.status(500).json({ error: 'Export failed: ' + error.message });
  }
};

// Get chat statistics for admin dashboard
exports.getChatStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalMessages = await Message.countDocuments();
    const messagesToday = await Message.countDocuments({ timestamp: { $gte: today } });
    const messagesThisMonth = await Message.countDocuments({ timestamp: { $gte: thisMonth } });

    // Get unique conversations count
    const uniqueConversations = await Message.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $lt: ['$senderId', '$receiverId'] },
              { sender: '$senderId', receiver: '$receiverId' },
              { sender: '$receiverId', receiver: '$senderId' }
            ]
          }
        }
      },
      { $count: 'total' }
    ]);

    res.json({
      stats: {
        totalMessages,
        messagesToday,
        messagesThisMonth,
        uniqueConversations: uniqueConversations[0]?.total || 0
      }
    });
  } catch (error) {
    logger.error('Get chat stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
