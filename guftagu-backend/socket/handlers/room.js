const Room = require('../../models/Room');
const RoomParticipant = require('../../models/RoomParticipant');
const User = require('../../models/User');
const logger = require('../../utils/logger');

module.exports = (io, socket) => {
  // Join room socket channel
  socket.on('room:join', async (data) => {
    try {
      const { roomCode } = data;

      if (!socket.userId) {
        socket.emit('room:error', { message: 'Authentication required' });
        return;
      }

      const room = await Room.findOne({ roomCode, isActive: true });
      if (!room) {
        socket.emit('room:error', { message: 'Room not found' });
        return;
      }

      // Check if user is participant
      const isParticipant = await RoomParticipant.isUserInRoom(roomCode, socket.userId);
      if (!isParticipant) {
        socket.emit('room:error', { message: 'Not a participant in this room' });
        return;
      }

      // Join socket room
      socket.join(`room:${roomCode}`);

      // Get current participants
      const participants = await RoomParticipant.getActiveParticipants(roomCode);

      // Notify all room members
      io.to(`room:${roomCode}`).emit('room:participant-joined', {
        roomCode,
        user: {
          _id: socket.userId,
          username: socket.username,
          displayName: socket.displayName,
          profilePicture: socket.profilePicture,
        },
        participantCount: participants.length,
      });

      logger.info(`User ${socket.username} joined room socket: ${roomCode}`);
    } catch (error) {
      logger.error(`Room join error: ${error.message}`);
      socket.emit('room:error', { message: 'Failed to join room' });
    }
  });

  // Leave room socket channel
  socket.on('room:leave', async (data) => {
    try {
      const { roomCode } = data;

      if (!socket.userId) return;

      // Leave socket room
      socket.leave(`room:${roomCode}`);

      // Update participant record
      await RoomParticipant.findOneAndUpdate(
        { roomCode, userId: socket.userId, leftAt: null },
        { leftAt: new Date() }
      );

      // Update room participant count
      const room = await Room.findOne({ roomCode });
      if (room) {
        room.currentParticipants = Math.max(0, room.currentParticipants - 1);
        await room.save();

        // Notify remaining participants
        io.to(`room:${roomCode}`).emit('room:participant-left', {
          roomCode,
          userId: socket.userId,
          participantCount: room.currentParticipants,
        });
      }

      logger.info(`User ${socket.username} left room socket: ${roomCode}`);
    } catch (error) {
      logger.error(`Room leave error: ${error.message}`);
    }
  });

  // Host mute participant
  socket.on('room:host-mute', async (data) => {
    try {
      const { roomCode, targetUserId, mute = true } = data;

      if (!socket.userId) return;

      const room = await Room.findOne({ roomCode, isActive: true });
      if (!room || !room.hostUserId.equals(socket.userId)) {
        socket.emit('room:error', { message: 'Only host can mute participants' });
        return;
      }

      // Update participant
      await RoomParticipant.findOneAndUpdate(
        { roomCode, userId: targetUserId, leftAt: null },
        { isMuted: mute }
      );

      // Notify the target user
      const targetUser = await User.findById(targetUserId);
      if (targetUser?.socketId) {
        io.to(targetUser.socketId).emit('room:host-action', {
          action: mute ? 'mute' : 'unmute',
          roomCode,
          message: mute ? 'You were muted by the host' : 'You were unmuted by the host',
        });
      }

      // Notify all participants
      io.to(`room:${roomCode}`).emit('room:participant-updated', {
        roomCode,
        userId: targetUserId,
        isMuted: mute,
      });

      logger.info(`Host ${socket.username} ${mute ? 'muted' : 'unmuted'} user ${targetUserId} in room ${roomCode}`);
    } catch (error) {
      logger.error(`Room mute error: ${error.message}`);
    }
  });

  // Host kick participant
  socket.on('room:host-kick', async (data) => {
    try {
      const { roomCode, targetUserId } = data;

      if (!socket.userId) return;

      const room = await Room.findOne({ roomCode, isActive: true });
      if (!room || !room.hostUserId.equals(socket.userId)) {
        socket.emit('room:error', { message: 'Only host can kick participants' });
        return;
      }

      // Cannot kick yourself
      if (targetUserId === socket.userId.toString()) {
        socket.emit('room:error', { message: 'Cannot kick yourself' });
        return;
      }

      // Update participant
      await RoomParticipant.findOneAndUpdate(
        { roomCode, userId: targetUserId, leftAt: null },
        { isKicked: true, leftAt: new Date() }
      );

      // Update room count
      room.currentParticipants = Math.max(0, room.currentParticipants - 1);
      await room.save();

      // Notify the kicked user
      const targetUser = await User.findById(targetUserId);
      if (targetUser?.socketId) {
        io.to(targetUser.socketId).emit('room:host-action', {
          action: 'kick',
          roomCode,
          message: 'You were removed from the room by the host',
        });
      }

      // Notify all participants
      io.to(`room:${roomCode}`).emit('room:participant-left', {
        roomCode,
        userId: targetUserId,
        participantCount: room.currentParticipants,
        kicked: true,
      });

      logger.info(`Host ${socket.username} kicked user ${targetUserId} from room ${roomCode}`);
    } catch (error) {
      logger.error(`Room kick error: ${error.message}`);
    }
  });

  // Close room (host only)
  socket.on('room:close', async (data) => {
    try {
      const { roomCode } = data;

      if (!socket.userId) return;

      const room = await Room.findOne({ roomCode });
      if (!room || !room.hostUserId.equals(socket.userId)) {
        socket.emit('room:error', { message: 'Only host can close the room' });
        return;
      }

      // Mark room as inactive
      room.isActive = false;
      await room.save();

      // Mark all participants as left
      await RoomParticipant.updateMany(
        { roomCode, leftAt: null },
        { leftAt: new Date() }
      );

      // Notify all participants
      io.to(`room:${roomCode}`).emit('room:closed', {
        roomCode,
        message: 'Room has been closed by the host',
      });

      logger.info(`Host ${socket.username} closed room ${roomCode}`);
    } catch (error) {
      logger.error(`Room close error: ${error.message}`);
    }
  });

  // Room chat message
  socket.on('room:chat', async (data) => {
    try {
      const { roomCode, message } = data;

      if (!socket.userId || !message || message.length > 500) return;

      const room = await Room.findOne({ roomCode, isActive: true });
      if (!room || !room.settings.chatEnabled) return;

      // Verify user is in room
      const isParticipant = await RoomParticipant.isUserInRoom(roomCode, socket.userId);
      if (!isParticipant) return;

      // Broadcast to room
      io.to(`room:${roomCode}`).emit('room:chat-message', {
        roomCode,
        user: {
          _id: socket.userId,
          username: socket.username,
          displayName: socket.displayName,
          profilePicture: socket.profilePicture,
        },
        message,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`Room chat error: ${error.message}`);
    }
  });

  // Handle room invite
  socket.on('room:invite', async (data) => {
    try {
      const { roomCode, targetUserIds } = data;

      if (!socket.userId || !Array.isArray(targetUserIds)) return;

      const room = await Room.findOne({ roomCode, isActive: true });
      if (!room) return;

      // Send invite to each target user
      for (const targetUserId of targetUserIds) {
        const targetUser = await User.findById(targetUserId);
        if (targetUser?.socketId) {
          io.to(targetUser.socketId).emit('room:invite-received', {
            roomCode,
            roomName: room.roomName,
            from: {
              _id: socket.userId,
              username: socket.username,
              displayName: socket.displayName,
              profilePicture: socket.profilePicture,
            },
            timestamp: new Date(),
          });
        }
      }

      logger.info(`User ${socket.username} sent room invite for ${roomCode} to ${targetUserIds.length} users`);
    } catch (error) {
      logger.error(`Room invite error: ${error.message}`);
    }
  });
};
