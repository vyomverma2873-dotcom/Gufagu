const Message = require('../models/Message');
const Friend = require('../models/Friend');
const User = require('../models/User');
const Call = require('../models/Call');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * Get all conversations
 * GET /api/messages/conversations
 */
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all friends first
    const friends = await Friend.find({ userId }).populate(
      'friendId',
      'userId username displayName profilePicture isOnline lastActive'
    );

    // Get last message for each friend
    const conversations = await Promise.all(
      friends.map(async (friend) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: userId, receiverId: friend.friendId._id },
            { senderId: friend.friendId._id, receiverId: userId },
          ],
        }).sort({ timestamp: -1 });

        const unreadCount = await Message.countDocuments({
          senderId: friend.friendId._id,
          receiverId: userId,
          isRead: false,
        });

        return {
          friend: {
            _id: friend.friendId._id,
            userId: friend.friendId.userId,
            username: friend.friendId.username,
            displayName: friend.friendId.displayName,
            profilePicture: friend.friendId.profilePicture,
            isOnline: friend.friendId.isOnline,
            lastActive: friend.friendId.lastActive,
          },
          lastMessage: lastMessage
            ? {
                _id: lastMessage._id,
                content: lastMessage.content.slice(0, 100),
                timestamp: lastMessage.timestamp,
                isOwn: lastMessage.senderId.equals(userId),
                isRead: lastMessage.isRead,
              }
            : null,
          unreadCount,
        };
      })
    );

    // Sort by last message timestamp
    conversations.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
    });

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages with specific user
 * GET /api/messages/:userId
 */
const getMessages = async (req, res, next) => {
  try {
    const { userId: friendUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    // Check if blocked
    const currentUser = await User.findById(userId);
    const targetUser = await User.findById(friendUserId);
    
    if (currentUser?.blockedUsers?.includes(friendUserId)) {
      return res.status(403).json({ error: 'You have blocked this user' });
    }
    if (targetUser?.blockedUsers?.includes(userId.toString())) {
      return res.status(403).json({ error: 'You cannot message this user' });
    }

    // Check if friends
    const friendship = await Friend.findOne({
      userId,
      friendId: friendUserId,
    });

    if (!friendship) {
      return res.status(403).json({ error: 'You can only message friends' });
    }

    // Get messages
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: friendUserId },
        { senderId: friendUserId, receiverId: userId },
      ],
    })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get call history between these users
    const calls = await Call.find({
      $or: [
        { callerId: userId, receiverId: friendUserId },
        { callerId: friendUserId, receiverId: userId },
      ],
      status: { $in: ['answered', 'declined', 'missed', 'ended'] }
    })
      .sort({ startedAt: -1 })
      .limit(50);

    // Mark messages as read
    await Message.updateMany(
      {
        senderId: friendUserId,
        receiverId: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Get friend info
    const friend = await User.findById(friendUserId).select(
      'userId username displayName profilePicture isOnline lastActive'
    );

    const total = await Message.countDocuments({
      $or: [
        { senderId: userId, receiverId: friendUserId },
        { senderId: friendUserId, receiverId: userId },
      ],
    });

    // Emit read receipt via socket
    const io = req.app.get('io');
    if (io && friend && friend.socketId) {
      const readMessageIds = messages
        .filter((m) => m.senderId.equals(friendUserId) && !m.isRead)
        .map((m) => m._id);

      if (readMessageIds.length > 0) {
        io.to(friend.socketId).emit('dm_read', {
          messageIds: readMessageIds,
          readAt: new Date(),
          readBy: userId,
        });
      }
    }

    // Combine messages and calls into a unified timeline
    const messagesFormatted = messages.reverse().map((m) => ({
      _id: m._id,
      type: 'message',
      content: m.content,
      timestamp: m.timestamp,
      isOwn: m.senderId.equals(userId),
      isDelivered: m.isDelivered,
      isRead: m.isRead,
      messageType: m.messageType,
    }));

    const callsFormatted = calls.map((c) => ({
      _id: c._id,
      type: 'call',
      callId: c.callId,
      callType: c.callType,
      status: c.status,
      timestamp: c.startedAt,
      duration: c.duration,
      isOwn: c.callerId.equals(userId),
      endReason: c.endReason,
    }));

    // Merge and sort by timestamp
    const timeline = [...messagesFormatted, ...callsFormatted].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    res.json({
      messages: messagesFormatted,
      calls: callsFormatted,
      timeline,
      friend: {
        _id: friend._id,
        userId: friend.userId,
        username: friend.username,
        displayName: friend.displayName,
        profilePicture: friend.profilePicture,
        isOnline: friend.isOnline,
        lastActive: friend.lastActive,
      },
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
 * Send message
 * POST /api/messages/send
 */
const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver ID and content are required' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ error: 'Message is too long (max 2000 characters)' });
    }

    // Check if blocked
    const currentUser = await User.findById(senderId);
    const targetUser = await User.findById(receiverId);
    
    if (currentUser?.blockedUsers?.includes(receiverId)) {
      return res.status(403).json({ error: 'You have blocked this user' });
    }
    if (targetUser?.blockedUsers?.includes(senderId.toString())) {
      return res.status(403).json({ error: 'You cannot message this user' });
    }

    // Check if friends
    const friendship = await Friend.findOne({
      userId: senderId,
      friendId: receiverId,
    });

    if (!friendship) {
      return res.status(403).json({ error: 'You can only message friends' });
    }

    // Create message
    const message = new Message({
      senderId,
      receiverId,
      content,
      timestamp: new Date(),
    });

    await message.save();

    // Update sender message count
    await User.findByIdAndUpdate(senderId, { $inc: { totalMessagesSent: 1 } });

    // Update friend interaction
    await Friend.updateMany(
      {
        $or: [
          { userId: senderId, friendId: receiverId },
          { userId: receiverId, friendId: senderId },
        ],
      },
      { lastInteraction: new Date(), $inc: { totalMessages: 1 } }
    );

    // Get receiver info
    const receiver = await User.findById(receiverId).select('socketId isOnline username');

    // Send via socket if online
    const io = req.app.get('io');
    logger.info(`Sending message: io=${!!io}, receiver=${receiver?.username}, socketId=${receiver?.socketId || 'NONE'}, isOnline=${receiver?.isOnline}`);
    
    if (io && receiver && receiver.socketId) {
      logger.info(`Emitting dm_receive to socketId: ${receiver.socketId}`);
      io.to(receiver.socketId).emit('dm_receive', {
        messageId: message._id,
        from: {
          userId: req.user._id,
          userId7Digit: req.user.userId,
          username: req.user.username,
          displayName: req.user.displayName,
          profilePicture: req.user.profilePicture,
        },
        message: content,
        timestamp: message.timestamp,
        conversationId: senderId.toString(),
      });
      
      logger.info(`Socket event dm_receive emitted to ${receiver.socketId}`);

      // Mark as delivered
      message.isDelivered = true;
      message.deliveredAt = new Date();
      await message.save();

      // Send delivery confirmation back to sender
      if (req.user.socketId) {
        io.to(req.user.socketId).emit('dm_delivered', {
          messageId: message._id,
          deliveredAt: message.deliveredAt,
          toUserId: receiverId,
        });
      }
    }

    res.json({
      message: {
        _id: message._id,
        content: message.content,
        timestamp: message.timestamp,
        isDelivered: message.isDelivered,
        isRead: message.isRead,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark messages as read
 * PUT /api/messages/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { messageIds, fromUserId } = req.body;

    if (messageIds && messageIds.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          receiverId: req.user._id,
        },
        {
          isRead: true,
          readAt: new Date(),
        }
      );
    } else if (fromUserId) {
      await Message.updateMany(
        {
          senderId: fromUserId,
          receiverId: req.user._id,
          isRead: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        }
      );
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread message count
 * GET /api/messages/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user._id,
      isRead: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
};
