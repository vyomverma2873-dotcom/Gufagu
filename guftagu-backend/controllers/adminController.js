const User = require('../models/User');
const Report = require('../models/Report');
const Ban = require('../models/Ban');
const SystemLog = require('../models/SystemLog');
const Match = require('../models/Match');
const OnlineUser = require('../models/OnlineUser');
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
    const { reason, duration, type = 'temporary' } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create ban record
    const ban = new Ban({
      user: userId,
      reason,
      duration: type === 'permanent' ? null : duration,
      type,
      bannedBy: req.user._id,
      expiresAt: type === 'permanent' ? null : new Date(Date.now() + duration * 60 * 60 * 1000),
    });
    await ban.save();

    // Update user
    user.isBanned = true;
    user.banInfo = {
      reason,
      expiresAt: ban.expiresAt,
      bannedBy: req.user._id,
    };
    await user.save();

    // Log action
    await SystemLog.create({
      action: 'user_banned',
      performedBy: req.user._id,
      targetUser: userId,
      details: { reason, duration, type },
    });

    res.json({ message: 'User banned successfully', ban });
  } catch (error) {
    logger.error('Ban user error:', error);
    res.status(500).json({ error: 'Server error' });
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

    user.isBanned = false;
    user.banInfo = undefined;
    await user.save();

    // Update ban record
    await Ban.updateMany(
      { user: userId, isActive: true },
      { isActive: false, liftedAt: new Date(), liftedBy: req.user._id }
    );

    // Log action
    await SystemLog.create({
      action: 'user_unbanned',
      performedBy: req.user._id,
      targetUser: userId,
    });

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
    if (type) query.type = type;

    const reports = await Report.find(query)
      .populate('reporter', 'username displayName profilePicture userId')
      .populate('reportedUser', 'username displayName profilePicture userId')
      .populate('reviewedBy', 'username displayName')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      reports,
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
      .populate('user', 'username displayName profilePicture userId email')
      .populate('bannedBy', 'username displayName')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Ban.countDocuments({ isActive: true });

    res.json({
      bans,
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
