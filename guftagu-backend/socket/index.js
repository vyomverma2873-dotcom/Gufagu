const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OnlineUser = require('../models/OnlineUser');
const Friend = require('../models/Friend');
const logger = require('../utils/logger');

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Helper function to get accurate online count
  const getAccurateOnlineCount = () => {
    // Get all connected sockets across all namespaces
    const sockets = io.sockets.sockets;
    return sockets.size;
  };

  // Broadcast online count to all clients
  const broadcastOnlineCount = () => {
    const count = getAccurateOnlineCount();
    io.emit('user_count_update', {
      count,
      timestamp: new Date(),
    });
    logger.info(`Broadcasting online count: ${count}`);
  };

  // Connection handler
  io.on('connection', async (socket) => {
    const currentCount = getAccurateOnlineCount();
    logger.info(`Socket connected: ${socket.id} (Total: ${currentCount})`);

    // Broadcast updated user count to ALL clients immediately
    broadcastOnlineCount();

    // Track online user
    await OnlineUser.create({
      socketId: socket.id,
      isAnonymous: true,
      connectedAt: new Date(),
      lastPing: new Date(),
      userAgent: socket.handshake.headers['user-agent'],
    });

    // Authentication handler
    socket.on('authenticate', async (data) => {
      try {
        const { token } = data;
        if (!token) return;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (user && !user.isBanActive()) {
          socket.userId = user._id;
          socket.username = user.username;
          socket.userId7Digit = user.userId;

          // Update user status
          await User.findByIdAndUpdate(user._id, {
            isOnline: true,
            socketId: socket.id,
            lastActive: new Date(),
          });

          // Update online user record
          await OnlineUser.findOneAndUpdate(
            { socketId: socket.id },
            {
              userId: user._id,
              username: user.username,
              userId7Digit: user.userId,
              isAnonymous: false,
            }
          );

          // Join personal room
          socket.join(`user_${user._id}`);

          // Join admin room if admin
          if (user.isAdmin) {
            socket.join('admin_room');
          }

          // Notify friends that user is online
          const friends = await Friend.find({ userId: user._id });
          for (const friend of friends) {
            const friendUser = await User.findById(friend.friendId);
            if (friendUser && friendUser.socketId) {
              io.to(friendUser.socketId).emit('friend_online', {
                friendId: user._id,
                userId7Digit: user.userId,
                username: user.username,
                displayName: user.displayName,
                profilePicture: user.profilePicture,
                timestamp: new Date(),
              });
            }
          }

          // Send authentication success
          socket.emit('authenticated', {
            userId: user._id,
            username: user.username,
            userId7Digit: user.userId,
            displayName: user.displayName,
            profilePicture: user.profilePicture,
            isAdmin: user.isAdmin,
            isPremium: user.isPremium,
            friendsCount: user.friendsCount,
          });

          logger.info(`User authenticated: ${user.username} (${socket.id})`);
        }
      } catch (error) {
        socket.emit('auth_error', { message: 'Authentication failed', code: 'AUTH_FAILED' });
        logger.error(`Auth error: ${error.message}`);
      }
    });

    // Heartbeat for keeping connection alive
    socket.on('heartbeat', async () => {
      await OnlineUser.findOneAndUpdate(
        { socketId: socket.id },
        { lastPing: new Date() }
      );
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, { lastActive: new Date() });
      }
    });

    // WebRTC signaling
    require('./handlers/webrtc')(io, socket);

    // Video chat text messages
    require('./handlers/chat')(io, socket);

    // Direct messages
    require('./handlers/dm')(io, socket);

    // Friend system
    require('./handlers/friends')(io, socket);

    // Disconnect handler
    socket.on('disconnect', async () => {
      const currentCount = getAccurateOnlineCount();
      logger.info(`Socket disconnected: ${socket.id} (Total: ${currentCount})`);

      // Broadcast updated user count immediately
      broadcastOnlineCount();

      // Remove from online users
      await OnlineUser.findOneAndDelete({ socketId: socket.id });

      // Update user status if authenticated
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          socketId: null,
          lastActive: new Date(),
        });

        // Notify friends that user is offline
        const friends = await Friend.find({ userId: socket.userId });
        for (const friend of friends) {
          const friendUser = await User.findById(friend.friendId);
          if (friendUser && friendUser.socketId) {
            io.to(friendUser.socketId).emit('friend_offline', {
              friendId: socket.userId,
              userId7Digit: socket.userId7Digit,
              username: socket.username,
              timestamp: new Date(),
            });
          }
        }

        // Emit to admin room
        io.to('admin_room').emit('admin_user_status_change', {
          userId: socket.userId,
          userId7Digit: socket.userId7Digit,
          username: socket.username,
          isOnline: false,
          timestamp: new Date(),
        });
      }
    });
  });

  // Periodic sync to ensure count accuracy (every 30 seconds)
  setInterval(() => {
    broadcastOnlineCount();
  }, 30000);

  // Return io instance and helper function
  return { io, getOnlineCount: getAccurateOnlineCount };
};

module.exports = {
  initializeSocket,
};
