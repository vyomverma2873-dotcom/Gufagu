const User = require('../models/User');
const Report = require('../models/Report');
const Friend = require('../models/Friend');
const logger = require('../utils/logger');

/**
 * Get own profile
 * GET /api/user/profile
 */
const getProfile = async (req, res, next) => {
  try {
    res.json({
      user: {
        _id: req.user._id,
        userId: req.user.userId,
        email: req.user.email,
        username: req.user.username,
        displayName: req.user.displayName,
        bio: req.user.bio,
        profilePicture: req.user.profilePicture,
        interests: req.user.interests,
        joinDate: req.user.joinDate,
        totalMatches: req.user.totalMatches,
        friendsCount: req.user.friendsCount,
        privacy: req.user.privacy,
        isPremium: req.user.isPremium,
        isAdmin: req.user.isAdmin,
        canChangeUsername: req.user.canChangeUsername,
        usernameLastChanged: req.user.usernameLastChanged,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update own profile
 * PUT /api/user/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { username, displayName, bio, interests, privacy } = req.body;
    const updates = {};

    // Handle username change
    if (username && username !== req.user.username) {
      // Validate username
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return res.status(400).json({
          error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores',
        });
      }

      // Check if username is taken
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      // Store old username in history
      if (req.user.username) {
        updates.$push = {
          usernameHistory: {
            oldUsername: req.user.username,
            changedAt: new Date(),
          },
        };
      }

      updates.username = username.toLowerCase();
      updates.usernameLastChanged = new Date();
    }

    if (displayName !== undefined) {
      updates.displayName = displayName.slice(0, 50);
    }

    if (bio !== undefined) {
      updates.bio = bio.slice(0, 500);
    }

    if (interests !== undefined) {
      updates.interests = interests.slice(0, 10).map((i) => i.slice(0, 20));
    }

    if (privacy) {
      updates['privacy.showOnlineStatus'] = privacy.showOnlineStatus ?? req.user.privacy.showOnlineStatus;
      updates['privacy.allowFriendRequests'] = privacy.allowFriendRequests ?? req.user.privacy.allowFriendRequests;
      updates['privacy.showMatchCount'] = privacy.showMatchCount ?? req.user.privacy.showMatchCount;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        userId: user.userId,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        interests: user.interests,
        privacy: user.privacy,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by username
 * GET /api/user/:username
 */
const getUserByUsername = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check privacy settings for non-friends
    const isOwnProfile = req.user && req.user._id.equals(user._id);

    res.json({
      user: {
        _id: user._id,
        userId: user.userId,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        profilePicture: user.profilePicture,
        interests: user.interests,
        joinDate: user.joinDate,
        isOnline: user.privacy.showOnlineStatus || isOwnProfile ? user.isOnline : undefined,
        totalMatches: user.privacy.showMatchCount || isOwnProfile ? user.totalMatches : undefined,
        friendsCount: user.friendsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by 7-digit ID
 * GET /api/user/id/:userId
 */
const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!/^\d{7}$/.test(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isOwnProfile = req.user && req.user._id.equals(user._id);

    res.json({
      user: {
        _id: user._id,
        userId: user.userId,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        profilePicture: user.profilePicture,
        interests: user.interests,
        joinDate: user.joinDate,
        isOnline: user.privacy.showOnlineStatus || isOwnProfile ? user.isOnline : undefined,
        totalMatches: user.privacy.showMatchCount || isOwnProfile ? user.totalMatches : undefined,
        friendsCount: user.friendsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by MongoDB ObjectId
 * GET /api/user/oid/:objectId
 */
const getUserByObjectId = async (req, res, next) => {
  try {
    const { objectId } = req.params;

    // Validate MongoDB ObjectId format
    if (!/^[a-fA-F0-9]{24}$/.test(objectId)) {
      return res.status(400).json({ error: 'Invalid ObjectId format' });
    }

    const user = await User.findById(objectId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isOwnProfile = req.user && req.user._id.equals(user._id);

    res.json({
      user: {
        _id: user._id,
        userId: user.userId,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        profilePicture: user.profilePicture,
        interests: user.interests,
        joinDate: user.joinDate,
        isOnline: user.privacy?.showOnlineStatus || isOwnProfile ? user.isOnline : undefined,
        totalMatches: user.privacy?.showMatchCount || isOwnProfile ? user.totalMatches : undefined,
        friendsCount: user.friendsCount,
        lastActive: user.lastActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check username availability
 * GET /api/user/check-username
 */
const checkUsername = async (req, res, next) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.json({
        available: false,
        error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores',
      });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });

    res.json({
      available: !existingUser,
      username: username.toLowerCase(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload profile picture
 * POST /api/user/profile-picture
 */
const uploadProfilePicture = async (req, res, next) => {
  try {
    // For now, accept base64 encoded image or URL
    const { imageUrl, imageBase64 } = req.body;

    if (!imageUrl && !imageBase64) {
      return res.status(400).json({ error: 'Image URL or base64 data is required' });
    }

    let profilePicture = imageUrl;

    // If base64, store it directly (in production, upload to Cloudinary)
    if (imageBase64) {
      // Validate base64 image
      if (!imageBase64.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid image format' });
      }
      profilePicture = imageBase64;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture },
      { new: true }
    );

    res.json({
      message: 'Profile picture updated',
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set username (onboarding)
 * POST /api/user/set-username
 */
const setUsername = async (req, res, next) => {
  try {
    const { username, displayName } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({
        error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores',
      });
    }

    // Check if username is taken
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        username: username.toLowerCase(),
        displayName: displayName || username,
        usernameLastChanged: new Date(),
      },
      { new: true }
    );

    res.json({
      message: 'Username set successfully',
      user: {
        _id: user._id,
        userId: user.userId,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Report a user
 * POST /api/user/report
 */
const reportUser = async (req, res, next) => {
  try {
    const { userId, reason, description, messageId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Report reason is required' });
    }

    // Valid reasons
    const validReasons = [
      'inappropriate_content',
      'harassment',
      'spam',
      'nudity',
      'violence',
      'hate_speech',
      'underage',
      'scam',
      'impersonation',
      'other',
    ];

    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid report reason' });
    }

    // Can't report yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }

    // Find the reported user
    const reportedUser = await User.findById(userId);
    if (!reportedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create the report
    const report = new Report({
      reporterId: req.user._id,
      reporterUsername: req.user.username,
      reporterUserId7Digit: req.user.userId,
      reportedUserId: userId,
      reportedUsername: reportedUser.username,
      reportedUserId7Digit: reportedUser.userId,
      reason,
      description: description || '',
      messageId: messageId || null,
      status: 'pending',
      priority: reason === 'underage' || reason === 'violence' ? 'high' : 'medium',
    });

    await report.save();

    logger.info(`Report created: ${req.user.username} reported ${reportedUser.username} for ${reason}`);

    res.json({
      message: 'Report submitted successfully',
      reportId: report._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Block a user
 * POST /api/user/block
 */
const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Can't block yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot block yourself' });
    }

    // Check if user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already blocked
    if (req.user.blockedUsers && req.user.blockedUsers.includes(userId)) {
      return res.status(400).json({ error: 'User is already blocked' });
    }

    // Add to blocked users list
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { blockedUsers: userId },
    });

    // Remove any existing friendship
    await Friend.deleteMany({
      $or: [
        { user1: req.user._id, user2: userId },
        { user1: userId, user2: req.user._id },
      ],
    });

    // Update friends count for both users
    await User.findByIdAndUpdate(req.user._id, { $inc: { friendsCount: -1 } });
    await User.findByIdAndUpdate(userId, { $inc: { friendsCount: -1 } });

    logger.info(`User blocked: ${req.user.username} blocked ${targetUser.username}`);

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Unblock a user
 * POST /api/user/unblock
 */
const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user is blocked
    if (!req.user.blockedUsers || !req.user.blockedUsers.includes(userId)) {
      return res.status(400).json({ error: 'User is not blocked' });
    }

    // Remove from blocked users list
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blockedUsers: userId },
    });

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get blocked users list
 * GET /api/user/blocked
 */
const getBlockedUsers = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('blockedUsers', 'username displayName profilePicture userId');

    res.json({
      blockedUsers: user.blockedUsers || [],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserByUsername,
  getUserById,
  getUserByObjectId,
  checkUsername,
  uploadProfilePicture,
  setUsername,
  reportUser,
  blockUser,
  unblockUser,
  getBlockedUsers,
};
