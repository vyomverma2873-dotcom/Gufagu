const User = require('../models/User');
const Friend = require('../models/Friend');
const FriendRequest = require('../models/FriendRequest');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * Send friend request by username
 * POST /api/friends/request
 */
const sendFriendRequest = async (req, res, next) => {
  try {
    const { username, message } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const targetUser = await User.findOne({ username: username.toLowerCase() });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return await createFriendRequest(req, res, targetUser, message);
  } catch (error) {
    next(error);
  }
};

/**
 * Send friend request by 7-digit ID
 * POST /api/friends/request-by-id
 */
const sendFriendRequestById = async (req, res, next) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !/^\d{7}$/.test(userId)) {
      return res.status(400).json({ error: 'Valid 7-digit user ID is required' });
    }

    const targetUser = await User.findOne({ userId });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return await createFriendRequest(req, res, targetUser, message);
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to create friend request
 */
const createFriendRequest = async (req, res, targetUser, message) => {
  const senderId = req.user._id;

  // Check if trying to add self
  if (targetUser._id.equals(senderId)) {
    return res.status(400).json({ error: 'You cannot send a friend request to yourself' });
  }

  // Check if either user has blocked the other
  const currentUser = await User.findById(senderId);
  const isBlockedByMe = currentUser?.blockedUsers?.includes(targetUser._id.toString());
  const hasBlockedMe = targetUser.blockedUsers?.includes(senderId.toString());
  
  if (isBlockedByMe || hasBlockedMe) {
    return res.status(400).json({ error: 'Cannot send friend request to this user' });
  }

  // Check privacy settings
  if (targetUser.privacy.allowFriendRequests === 'nobody') {
    return res.status(400).json({ error: 'This user is not accepting friend requests' });
  }

  // Check if already friends
  const existingFriend = await Friend.findOne({
    userId: senderId,
    friendId: targetUser._id,
  });

  if (existingFriend) {
    return res.status(400).json({ error: 'You are already friends with this user' });
  }

  // Check for existing pending request
  const existingRequest = await FriendRequest.findOne({
    $or: [
      { senderId, receiverId: targetUser._id, status: 'pending' },
      { senderId: targetUser._id, receiverId: senderId, status: 'pending' },
    ],
  });

  if (existingRequest) {
    if (existingRequest.senderId.equals(senderId)) {
      return res.status(400).json({ error: 'Friend request already sent' });
    } else {
      return res.status(400).json({
        error: 'This user has already sent you a friend request',
        pendingRequestId: existingRequest._id,
      });
    }
  }

  // Create friend request
  const friendRequest = new FriendRequest({
    senderId,
    receiverId: targetUser._id,
    message: message?.slice(0, 200),
    sentAt: new Date(),
  });

  await friendRequest.save();

  // Create notification for receiver
  const notification = new Notification({
    userId: targetUser._id,
    type: 'friend_request',
    title: 'New Friend Request',
    content: `${req.user.displayName || req.user.username} wants to be your friend`,
    relatedUserId: senderId,
    relatedUsername: req.user.username,
    relatedUserId7Digit: req.user.userId,
    relatedId: friendRequest._id,
    actionUrl: '/friends/requests',
  });

  await notification.save();

  // Emit socket event if user is online
  const io = req.app.get('io');
  if (io && targetUser.socketId) {
    io.to(targetUser.socketId).emit('friend_request_received', {
      requestId: friendRequest._id,
      from: {
        userId: req.user._id,
        userId7Digit: req.user.userId,
        username: req.user.username,
        displayName: req.user.displayName,
        profilePicture: req.user.profilePicture,
        bio: req.user.bio,
        interests: req.user.interests,
      },
      message,
      sentAt: friendRequest.sentAt,
    });

    io.to(targetUser.socketId).emit('notification_new', {
      notificationId: notification._id,
      type: 'friend_request',
      title: notification.title,
      content: notification.content,
      relatedUserId: senderId,
      relatedUsername: req.user.username,
      relatedUserId7Digit: req.user.userId,
      actionUrl: '/friends/requests',
      timestamp: new Date(),
    });
  }

  logger.info(`Friend request sent from ${req.user.username} to ${targetUser.username}`);

  res.json({
    message: 'Friend request sent',
    requestId: friendRequest._id,
  });
};

/**
 * Accept friend request
 * POST /api/friends/accept
 */
const acceptFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (!friendRequest.receiverId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to accept this request' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been processed' });
    }

    // Update request status
    friendRequest.status = 'accepted';
    friendRequest.respondedAt = new Date();
    await friendRequest.save();

    // Create bidirectional friendship
    await Friend.create([
      { userId: friendRequest.senderId, friendId: friendRequest.receiverId },
      { userId: friendRequest.receiverId, friendId: friendRequest.senderId },
    ]);

    // Update friend counts
    await User.findByIdAndUpdate(friendRequest.senderId, { $inc: { friendsCount: 1 } });
    await User.findByIdAndUpdate(friendRequest.receiverId, { $inc: { friendsCount: 1 } });

    // Get sender info
    const sender = await User.findById(friendRequest.senderId);

    // Create notification for sender
    const notification = new Notification({
      userId: friendRequest.senderId,
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      content: `${req.user.displayName || req.user.username} accepted your friend request`,
      relatedUserId: req.user._id,
      relatedUsername: req.user.username,
      relatedUserId7Digit: req.user.userId,
      relatedId: friendRequest._id,
      actionUrl: `/profile/${req.user.username}`,
    });

    await notification.save();

    // Emit socket events
    const io = req.app.get('io');
    if (io && sender && sender.socketId) {
      io.to(sender.socketId).emit('friend_request_accepted', {
        requestId: friendRequest._id,
        by: {
          userId: req.user._id,
          userId7Digit: req.user.userId,
          username: req.user.username,
          displayName: req.user.displayName,
          profilePicture: req.user.profilePicture,
        },
        acceptedAt: new Date(),
      });
    }

    logger.info(`Friend request accepted: ${sender?.username} and ${req.user.username}`);

    res.json({
      message: 'Friend request accepted',
      friend: {
        _id: sender._id,
        userId: sender.userId,
        username: sender.username,
        displayName: sender.displayName,
        profilePicture: sender.profilePicture,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject friend request
 * POST /api/friends/reject
 */
const rejectFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (!friendRequest.receiverId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to reject this request' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been processed' });
    }

    friendRequest.status = 'rejected';
    friendRequest.respondedAt = new Date();
    await friendRequest.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel sent friend request
 * DELETE /api/friends/cancel/:requestId
 */
const cancelFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (!friendRequest.senderId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to cancel this request' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been processed' });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    res.json({ message: 'Friend request cancelled' });
  } catch (error) {
    next(error);
  }
};

/**
 * Unfriend
 * DELETE /api/friends/:friendId
 */
const unfriend = async (req, res, next) => {
  try {
    const { friendId } = req.params;

    // Delete both friendship records
    await Friend.deleteMany({
      $or: [
        { userId: req.user._id, friendId },
        { userId: friendId, friendId: req.user._id },
      ],
    });

    // Update friend counts
    await User.findByIdAndUpdate(req.user._id, { $inc: { friendsCount: -1 } });
    await User.findByIdAndUpdate(friendId, { $inc: { friendsCount: -1 } });

    res.json({ message: 'Unfriended successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get friends list
 * GET /api/friends
 */
const getFriends = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, sort = 'recent' } = req.query;

    const friends = await Friend.find({ userId: req.user._id })
      .populate('friendId', 'userId username displayName profilePicture bio isOnline lastActive')
      .sort(sort === 'alphabetical' ? { 'friendId.username': 1 } : { lastInteraction: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    let friendsList = friends.map((f) => ({
      _id: f.friendId._id,
      userId: f.friendId.userId,
      username: f.friendId.username,
      displayName: f.friendId.displayName,
      profilePicture: f.friendId.profilePicture,
      bio: f.friendId.bio,
      isOnline: f.friendId.isOnline,
      lastActive: f.friendId.lastActive,
      friendsSince: f.friendsSince,
    }));

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      friendsList = friendsList.filter(
        (f) =>
          f.username?.toLowerCase().includes(searchLower) ||
          f.displayName?.toLowerCase().includes(searchLower)
      );
    }

    const total = await Friend.countDocuments({ userId: req.user._id });

    res.json({
      friends: friendsList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get friend requests (sent and received)
 * GET /api/friends/requests
 */
const getFriendRequests = async (req, res, next) => {
  try {
    const { type = 'received' } = req.query;

    let requests;

    if (type === 'received') {
      requests = await FriendRequest.find({
        receiverId: req.user._id,
        status: 'pending',
      })
        .populate('senderId', 'userId username displayName profilePicture bio interests')
        .sort({ sentAt: -1 });
    } else {
      requests = await FriendRequest.find({
        senderId: req.user._id,
        status: 'pending',
      })
        .populate('receiverId', 'userId username displayName profilePicture')
        .sort({ sentAt: -1 });
    }

    const formattedRequests = requests.map((r) => ({
      _id: r._id,
      user: type === 'received' ? {
        _id: r.senderId._id,
        userId: r.senderId.userId,
        username: r.senderId.username,
        displayName: r.senderId.displayName,
        profilePicture: r.senderId.profilePicture,
        bio: r.senderId.bio,
        interests: r.senderId.interests,
      } : {
        _id: r.receiverId._id,
        userId: r.receiverId.userId,
        username: r.receiverId.username,
        displayName: r.receiverId.displayName,
        profilePicture: r.receiverId.profilePicture,
      },
      message: r.message,
      sentAt: r.sentAt,
    }));

    res.json({ requests: formattedRequests, type });
  } catch (error) {
    next(error);
  }
};

/**
 * Search users by username
 * GET /api/friends/search
 */
const searchUsers = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({ users: [] });
    }

    // Get current user's blocked users list
    const currentUser = await User.findById(req.user._id);
    const blockedUserIds = currentUser?.blockedUsers || [];

    // Also get users who have blocked the current user
    const usersWhoBlockedMe = await User.find({
      blockedUsers: req.user._id
    }).select('_id');
    const blockedByOthersIds = usersWhoBlockedMe.map(u => u._id);

    // Combine all blocked user IDs
    const allBlockedIds = [...blockedUserIds, ...blockedByOthersIds];

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        { _id: { $nin: allBlockedIds } },
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { displayName: { $regex: q, $options: 'i' } },
          ],
        },
      ],
    })
      .select('userId username displayName profilePicture bio interests')
      .limit(parseInt(limit));

    res.json({
      users: users.map((u) => ({
        _id: u._id,
        userId: u.userId,
        username: u.username,
        displayName: u.displayName,
        profilePicture: u.profilePicture,
        bio: u.bio,
        interests: u.interests || [],
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is friend
 * GET /api/friends/check/:userId
 */
const checkFriendship = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const friendship = await Friend.findOne({
      userId: req.user._id,
      friendId: userId,
    });

    const pendingRequest = await FriendRequest.findOne({
      $or: [
        { senderId: req.user._id, receiverId: userId, status: 'pending' },
        { senderId: userId, receiverId: req.user._id, status: 'pending' },
      ],
    });

    res.json({
      isFriend: !!friendship,
      pendingRequest: pendingRequest ? {
        _id: pendingRequest._id,
        isSender: pendingRequest.senderId.equals(req.user._id),
      } : null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendFriendRequest,
  sendFriendRequestById,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  unfriend,
  getFriends,
  getFriendRequests,
  searchUsers,
  checkFriendship,
};
