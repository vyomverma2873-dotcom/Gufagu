const Room = require('../../models/Room');
const RoomParticipant = require('../../models/RoomParticipant');
const User = require('../../models/User');
const logger = require('../../utils/logger');

// Track active WebRTC peers per room
const roomPeers = new Map(); // Map<roomCode, Map<socketId, userInfo>>

module.exports = (io, socket) => {
  // Join room socket channel
  socket.on('room:join', async (data) => {
    try {
      const roomCode = data.roomCode?.toUpperCase(); // Normalize to uppercase

      if (!socket.userId) {
        socket.emit('room:error', { message: 'Authentication required' });
        return;
      }

      if (!roomCode) {
        socket.emit('room:error', { message: 'Room code required' });
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
      socket.currentRoom = roomCode;

      // Initialize room peers map if needed
      if (!roomPeers.has(roomCode)) {
        roomPeers.set(roomCode, new Map());
      }

      // Get participant info
      const participant = await RoomParticipant.findOne({ 
        roomCode, 
        userId: socket.userId, 
        leftAt: null 
      });

      const userInfo = {
        _id: socket.userId,
        username: socket.username,
        displayName: socket.displayName,
        profilePicture: socket.profilePicture,
        isHost: participant?.isHost || false,
        isMuted: participant?.isMuted || false,
      };

      // Add to room peers
      roomPeers.get(roomCode).set(socket.id, userInfo);

      // Get current participants
      const participants = await RoomParticipant.getActiveParticipants(roomCode);

      // Send existing peers to the new joiner (for WebRTC connections)
      const existingPeers = [];
      roomPeers.get(roomCode).forEach((peerInfo, socketId) => {
        if (socketId !== socket.id) {
          existingPeers.push({ socketId, ...peerInfo });
        }
      });

      socket.emit('room:peers', { peers: existingPeers });

      // Notify all room members about new peer
      socket.to(`room:${roomCode}`).emit('room:participant-joined', {
        roomCode,
        socketId: socket.id,
        user: userInfo,
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
      const roomCode = data.roomCode?.toUpperCase(); // Normalize to uppercase

      if (!socket.userId || !roomCode) return;

      // Remove from room peers
      if (roomPeers.has(roomCode)) {
        roomPeers.get(roomCode).delete(socket.id);
        if (roomPeers.get(roomCode).size === 0) {
          roomPeers.delete(roomCode);
        }
      }

      // Leave socket room
      socket.leave(`room:${roomCode}`);
      socket.currentRoom = null;

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

        // Notify remaining participants (includes socketId for WebRTC cleanup)
        io.to(`room:${roomCode}`).emit('room:participant-left', {
          roomCode,
          socketId: socket.id,
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
      const roomCode = data.roomCode?.toUpperCase(); // Normalize to uppercase
      const { targetUserId, mute = true } = data;

      if (!socket.userId || !roomCode) return;

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
      const roomCode = data.roomCode?.toUpperCase(); // Normalize to uppercase
      const { targetUserId } = data;

      if (!socket.userId || !roomCode) return;

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

      // Get current kick count and increment
      const currentKickCount = await RoomParticipant.getKickCount(roomCode, targetUserId);
      const newKickCount = currentKickCount + 1;

      // Update participant with incremented kick count
      await RoomParticipant.findOneAndUpdate(
        { roomCode, userId: targetUserId, leftAt: null },
        { isKicked: true, leftAt: new Date(), kickCount: newKickCount }
      );

      // Update room count
      room.currentParticipants = Math.max(0, room.currentParticipants - 1);
      await room.save();

      // Determine if this is a permanent ban
      const isPermanentBan = newKickCount >= 3;

      // Notify the kicked user
      const targetUser = await User.findById(targetUserId);
      if (targetUser?.socketId) {
        io.to(targetUser.socketId).emit('room:host-action', {
          action: 'kick',
          roomCode,
          message: isPermanentBan 
            ? 'You have been permanently banned from this room' 
            : `You were removed from the room by the host (${newKickCount}/3 warnings)`,
          permanentBan: isPermanentBan,
          kickCount: newKickCount,
        });
      }

      // Notify all participants
      io.to(`room:${roomCode}`).emit('room:participant-left', {
        roomCode,
        userId: targetUserId,
        participantCount: room.currentParticipants,
        kicked: true,
      });

      logger.info(`Host ${socket.username} kicked user ${targetUserId} from room ${roomCode} (kick count: ${newKickCount})`);
    } catch (error) {
      logger.error(`Room kick error: ${error.message}`);
    }
  });

  // Close room (host only)
  socket.on('room:close', async (data) => {
    try {
      const roomCode = data.roomCode?.toUpperCase(); // Normalize to uppercase

      if (!socket.userId || !roomCode) return;

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
      const roomCode = data.roomCode?.toUpperCase(); // Normalize to uppercase
      const { message } = data;

      if (!socket.userId || !roomCode || !message || message.length > 500) return;

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
      const roomCode = data.roomCode?.toUpperCase(); // Normalize to uppercase
      const { targetUserIds } = data;

      if (!socket.userId || !roomCode || !Array.isArray(targetUserIds)) return;

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

  // ================== WebRTC Signaling Events ==================

  // Send WebRTC offer to specific peer
  socket.on('webrtc:offer', (data) => {
    const { targetSocketId, offer } = data;
    if (!socket.userId || !targetSocketId || !offer) return;

    io.to(targetSocketId).emit('webrtc:offer', {
      fromSocketId: socket.id,
      fromUserId: socket.userId,
      offer,
    });
  });

  // Send WebRTC answer to specific peer
  socket.on('webrtc:answer', (data) => {
    const { targetSocketId, answer } = data;
    if (!socket.userId || !targetSocketId || !answer) return;

    io.to(targetSocketId).emit('webrtc:answer', {
      fromSocketId: socket.id,
      fromUserId: socket.userId,
      answer,
    });
  });

  // Send ICE candidate to specific peer
  socket.on('webrtc:ice-candidate', (data) => {
    const { targetSocketId, candidate } = data;
    if (!socket.userId || !targetSocketId || !candidate) return;

    io.to(targetSocketId).emit('webrtc:ice-candidate', {
      fromSocketId: socket.id,
      candidate,
    });
  });

  // Notify peers about media state changes (mute/video off)
  socket.on('webrtc:media-state', (data) => {
    const roomCode = data.roomCode?.toUpperCase(); // Normalize to uppercase
    const { audioEnabled, videoEnabled } = data;
    if (!socket.userId || !roomCode) return;

    socket.to(`room:${roomCode}`).emit('webrtc:media-state', {
      socketId: socket.id,
      userId: socket.userId,
      audioEnabled,
      videoEnabled,
    });
  });

  // Handle socket disconnect - cleanup WebRTC peers
  socket.on('disconnect', async () => {
    if (socket.currentRoom) {
      const roomCode = socket.currentRoom;

      // Remove from room peers
      if (roomPeers.has(roomCode)) {
        roomPeers.get(roomCode).delete(socket.id);
        if (roomPeers.get(roomCode).size === 0) {
          roomPeers.delete(roomCode);
        }
      }

      // Update participant record
      if (socket.userId) {
        await RoomParticipant.findOneAndUpdate(
          { roomCode, userId: socket.userId, leftAt: null },
          { leftAt: new Date() }
        );

        const room = await Room.findOne({ roomCode });
        if (room) {
          room.currentParticipants = Math.max(0, room.currentParticipants - 1);
          await room.save();

          // Notify remaining participants
          io.to(`room:${roomCode}`).emit('room:participant-left', {
            roomCode,
            socketId: socket.id,
            userId: socket.userId,
            participantCount: room.currentParticipants,
          });
        }
      }
    }
  });
};
