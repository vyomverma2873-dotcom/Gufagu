const FriendRequest = require('../../models/FriendRequest');
const Friend = require('../../models/Friend');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const logger = require('../../utils/logger');

module.exports = (io, socket) => {
  // Send friend request (via socket for real-time)
  socket.on('send_friend_request', async (data) => {
    try {
      const { toUserId, toUsername, toUserId7Digit, message } = data;

      if (!socket.userId) {
        socket.emit('error', { code: 'AUTH_REQUIRED', message: 'Authentication required' });
        return;
      }

      let targetUser;

      if (toUserId) {
        targetUser = await User.findById(toUserId);
      } else if (toUsername) {
        targetUser = await User.findOne({ username: toUsername.toLowerCase() });
      } else if (toUserId7Digit) {
        targetUser = await User.findOne({ userId: toUserId7Digit });
      }

      if (!targetUser) {
        socket.emit('error', { code: 'USER_NOT_FOUND', message: 'User not found' });
        return;
      }

      if (targetUser._id.equals(socket.userId)) {
        socket.emit('error', { code: 'INVALID_REQUEST', message: 'Cannot add yourself' });
        return;
      }

      // Check if already friends
      const existingFriend = await Friend.findOne({
        userId: socket.userId,
        friendId: targetUser._id,
      });

      if (existingFriend) {
        socket.emit('error', { code: 'ALREADY_FRIENDS', message: 'Already friends' });
        return;
      }

      // Check for existing pending request
      const existingRequest = await FriendRequest.findOne({
        $or: [
          { senderId: socket.userId, receiverId: targetUser._id, status: 'pending' },
          { senderId: targetUser._id, receiverId: socket.userId, status: 'pending' },
        ],
      });

      if (existingRequest) {
        socket.emit('error', { code: 'REQUEST_EXISTS', message: 'Request already exists' });
        return;
      }

      // Create request
      const friendRequest = await FriendRequest.create({
        senderId: socket.userId,
        receiverId: targetUser._id,
        message: message?.slice(0, 200),
        sentAt: new Date(),
      });

      // Get sender info
      const sender = await User.findById(socket.userId);

      // Create notification
      const notification = await Notification.create({
        userId: targetUser._id,
        type: 'friend_request',
        title: 'New Friend Request',
        content: `${sender.displayName || sender.username} wants to be your friend`,
        relatedUserId: socket.userId,
        relatedUsername: sender.username,
        relatedUserId7Digit: sender.userId,
        relatedId: friendRequest._id,
        actionUrl: '/friends/requests',
      });

      // Send to target if online
      if (targetUser.socketId) {
        io.to(targetUser.socketId).emit('friend_request_received', {
          requestId: friendRequest._id,
          from: {
            userId: sender._id,
            userId7Digit: sender.userId,
            username: sender.username,
            displayName: sender.displayName,
            profilePicture: sender.profilePicture,
          },
          message,
          sentAt: friendRequest.sentAt,
        });

        io.to(targetUser.socketId).emit('notification_new', {
          notificationId: notification._id,
          type: 'friend_request',
          title: notification.title,
          content: notification.content,
          timestamp: new Date(),
        });
      }

      socket.emit('friend_request_sent', { requestId: friendRequest._id });
      logger.info(`Friend request sent: ${sender.username} -> ${targetUser.username}`);
    } catch (error) {
      logger.error(`Send friend request error: ${error.message}`);
      socket.emit('error', { code: 'REQUEST_FAILED', message: 'Failed to send request' });
    }
  });

  // Accept friend request
  socket.on('accept_friend_request', async (data) => {
    try {
      const { requestId } = data;
      if (!socket.userId) return;

      const request = await FriendRequest.findById(requestId);
      if (!request || !request.receiverId.equals(socket.userId)) {
        socket.emit('error', { code: 'INVALID_REQUEST', message: 'Invalid request' });
        return;
      }

      if (request.status !== 'pending') {
        socket.emit('error', { code: 'ALREADY_PROCESSED', message: 'Already processed' });
        return;
      }

      // Update request
      request.status = 'accepted';
      request.respondedAt = new Date();
      await request.save();

      // Create friendships
      await Friend.create([
        { userId: request.senderId, friendId: request.receiverId },
        { userId: request.receiverId, friendId: request.senderId },
      ]);

      // Update counts
      await User.findByIdAndUpdate(request.senderId, { $inc: { friendsCount: 1 } });
      await User.findByIdAndUpdate(request.receiverId, { $inc: { friendsCount: 1 } });

      // Get users
      const accepter = await User.findById(socket.userId);
      const sender = await User.findById(request.senderId);

      // Notify sender
      if (sender && sender.socketId) {
        io.to(sender.socketId).emit('friend_request_accepted', {
          requestId: request._id,
          by: {
            userId: accepter._id,
            userId7Digit: accepter.userId,
            username: accepter.username,
            displayName: accepter.displayName,
            profilePicture: accepter.profilePicture,
          },
          acceptedAt: new Date(),
        });
      }

      socket.emit('friend_added', {
        friend: {
          userId: sender._id,
          userId7Digit: sender.userId,
          username: sender.username,
          displayName: sender.displayName,
          profilePicture: sender.profilePicture,
        },
      });

      logger.info(`Friend request accepted: ${accepter.username} <- ${sender.username}`);
    } catch (error) {
      logger.error(`Accept friend request error: ${error.message}`);
    }
  });

  // Reject friend request
  socket.on('reject_friend_request', async (data) => {
    try {
      const { requestId } = data;
      if (!socket.userId) return;

      const request = await FriendRequest.findById(requestId);
      if (!request || !request.receiverId.equals(socket.userId)) return;

      request.status = 'rejected';
      request.respondedAt = new Date();
      await request.save();

      socket.emit('friend_request_rejected', { requestId });
    } catch (error) {
      logger.error(`Reject friend request error: ${error.message}`);
    }
  });
};
