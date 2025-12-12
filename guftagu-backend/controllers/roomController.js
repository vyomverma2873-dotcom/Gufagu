const Room = require('../models/Room');
const RoomParticipant = require('../models/RoomParticipant');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// ICE Servers configuration for WebRTC (NAT traversal)
// Uses free public STUN servers, can add TURN server for better connectivity
const getIceServers = () => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ];

  // Add TURN server if configured (for better NAT traversal)
  if (process.env.TURN_SERVER_URL) {
    iceServers.push({
      urls: process.env.TURN_SERVER_URL,
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || '',
    });
  }

  return iceServers;
};

/**
 * Create a new room
 * POST /api/rooms/create
 */
const createRoom = async (req, res, next) => {
  try {
    const {
      roomName,
      maxParticipants = 5,
      isPublic = true,
      password,
      settings = {},
    } = req.body;

    // Rate limiting check (max 5 rooms per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRooms = await Room.countDocuments({
      hostUserId: req.user._id,
      createdAt: { $gte: oneHourAgo },
    });

    if (recentRooms >= 5) {
      return res.status(429).json({
        error: 'Rate limit exceeded. You can create maximum 5 rooms per hour.',
      });
    }

    // Generate unique room code
    const roomCode = await Room.generateRoomCode();

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Room settings with defaults
    const roomSettings = {
      videoEnabled: settings.videoEnabled !== false,
      audioEnabled: settings.audioEnabled !== false,
      screenShareEnabled: settings.screenShareEnabled !== false,
      chatEnabled: settings.chatEnabled !== false,
    };

    // Create room in database (no external API needed - pure WebRTC)
    const room = new Room({
      roomCode,
      roomName: roomName || `${req.user.displayName || req.user.username}'s Room`,
      hostUserId: req.user._id,
      maxParticipants: Math.min(Math.max(maxParticipants, 2), 10), // Clamp between 2-10
      isPublic,
      passwordHash,
      settings: roomSettings,
    });

    await room.save();

    logger.info(`Room created: ${roomCode} by ${req.user.username}`);

    res.status(201).json({
      message: 'Room created successfully',
      room: {
        roomCode: room.roomCode,
        roomName: room.roomName,
        maxParticipants: room.maxParticipants,
        isPublic: room.isPublic,
        hasPassword: !!room.passwordHash,
        settings: room.settings,
        iceServers: getIceServers(),
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get room details
 * GET /api/rooms/:code
 */
const getRoomDetails = async (req, res, next) => {
  try {
    const { code } = req.params;

    const room = await Room.findOne({ roomCode: code, isActive: true })
      .populate('hostUserId', 'username displayName profilePicture');

    if (!room) {
      return res.status(404).json({ error: 'Room not found or has expired' });
    }

    // Get active participants
    const participants = await RoomParticipant.getActiveParticipants(code);

    res.json({
      room: {
        roomCode: room.roomCode,
        roomName: room.roomName,
        host: {
          _id: room.hostUserId._id,
          username: room.hostUserId.username,
          displayName: room.hostUserId.displayName,
          profilePicture: room.hostUserId.profilePicture,
        },
        maxParticipants: room.maxParticipants,
        currentParticipants: room.currentParticipants,
        isPublic: room.isPublic,
        hasPassword: !!room.passwordHash,
        settings: room.settings,
        participants: participants.map(p => ({
          _id: p.userId._id,
          username: p.userId.username,
          displayName: p.userId.displayName,
          profilePicture: p.userId.profilePicture,
          isHost: p.isHost,
          isMuted: p.isMuted,
          joinedAt: p.joinedAt,
        })),
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join a room
 * POST /api/rooms/:code/join
 */
const joinRoom = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { password } = req.body;

    const room = await Room.findOne({ roomCode: code, isActive: true });

    if (!room) {
      return res.status(404).json({ error: 'Room not found or has expired' });
    }

    // Check if room is expired
    if (room.isExpired()) {
      room.isActive = false;
      await room.save();
      return res.status(410).json({ error: 'Room has expired' });
    }

    // Check if room is full
    if (room.isFull()) {
      return res.status(403).json({
        error: 'Room is full',
        maxParticipants: room.maxParticipants,
        currentParticipants: room.currentParticipants,
      });
    }

    // Check password if required
    if (room.passwordHash) {
      if (!password) {
        return res.status(401).json({ error: 'Password required', requiresPassword: true });
      }
      const isValidPassword = await bcrypt.compare(password, room.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Check if user is permanently banned (kicked 3+ times)
    const isPermanentlyBanned = await RoomParticipant.isPermanentlyBanned(code, req.user._id);
    if (isPermanentlyBanned) {
      return res.status(403).json({ 
        error: 'You have been permanently banned from this room',
        permanentBan: true
      });
    }

    // Check if user was recently kicked (but can still rejoin)
    const kickedRecord = await RoomParticipant.findOne({
      roomCode: code,
      userId: req.user._id,
      isKicked: true,
    }).sort({ updatedAt: -1 });

    const kickCount = await RoomParticipant.getKickCount(code, req.user._id);
    
    // If kicked but under 3 times, allow rejoin with warning
    if (kickedRecord && kickCount < 3) {
      // Clear the kicked status to allow rejoin
      await RoomParticipant.updateMany(
        { roomCode: code, userId: req.user._id, isKicked: true },
        { leftAt: new Date() }
      );
    }

    // Check if user is already in the room
    const existingParticipant = await RoomParticipant.findOne({
      roomCode: code,
      userId: req.user._id,
      leftAt: null,
      isKicked: false,
    });

    if (existingParticipant) {
      // User is already in room
      return res.json({
        message: 'Already in room',
        room: {
          roomCode: room.roomCode,
          roomName: room.roomName,
          iceServers: getIceServers(),
          isHost: existingParticipant.isHost,
          settings: room.settings,
        },
      });
    }

    const isHost = room.hostUserId.equals(req.user._id);

    // Add participant
    const participant = new RoomParticipant({
      roomCode: code,
      roomId: room._id,
      userId: req.user._id,
      isHost,
    });

    await participant.save();

    // Update participant count
    room.currentParticipants += 1;
    await room.save();

    // Emit socket event for participant joined
    const io = req.app.get('io');
    if (io) {
      io.to(`room:${code}`).emit('room:participant-joined', {
        roomCode: code,
        user: {
          _id: req.user._id,
          username: req.user.username,
          displayName: req.user.displayName,
          profilePicture: req.user.profilePicture,
        },
        participantCount: room.currentParticipants,
      });
    }

    logger.info(`User ${req.user.username} joined room ${code}`);

    res.json({
      message: 'Joined room successfully',
      room: {
        roomCode: room.roomCode,
        roomName: room.roomName,
        iceServers: getIceServers(),
        isHost,
        settings: room.settings,
        maxParticipants: room.maxParticipants,
        currentParticipants: room.currentParticipants,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Leave a room
 * POST /api/rooms/:code/leave
 */
const leaveRoom = async (req, res, next) => {
  try {
    const { code } = req.params;

    const room = await Room.findOne({ roomCode: code });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Update participant record
    const participant = await RoomParticipant.findOneAndUpdate(
      {
        roomCode: code,
        userId: req.user._id,
        leftAt: null,
      },
      { leftAt: new Date() },
      { new: true }
    );

    if (participant) {
      // Decrement participant count
      room.currentParticipants = Math.max(0, room.currentParticipants - 1);
      await room.save();

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(`room:${code}`).emit('room:participant-left', {
          roomCode: code,
          userId: req.user._id,
          participantCount: room.currentParticipants,
        });
      }

      logger.info(`User ${req.user.username} left room ${code}`);
    }

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a room (host only)
 * DELETE /api/rooms/:code
 */
const deleteRoom = async (req, res, next) => {
  try {
    const { code } = req.params;

    const room = await Room.findOne({ roomCode: code });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is the host
    if (!room.hostUserId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only the host can delete the room' });
    }

    // Mark room as inactive
    room.isActive = false;
    await room.save();

    // Mark all participants as left
    await RoomParticipant.updateMany(
      { roomCode: code, leftAt: null },
      { leftAt: new Date() }
    );

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`room:${code}`).emit('room:closed', {
        roomCode: code,
        message: 'Room has been closed by the host',
      });
    }

    logger.info(`Room ${code} deleted by ${req.user.username}`);

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Kick a participant (host only)
 * POST /api/rooms/:code/kick
 */
const kickParticipant = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const room = await Room.findOne({ roomCode: code, isActive: true });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is the host
    if (!room.hostUserId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only the host can kick participants' });
    }

    // Cannot kick yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot kick yourself' });
    }

    // Update participant record
    const participant = await RoomParticipant.findOneAndUpdate(
      {
        roomCode: code,
        userId,
        leftAt: null,
      },
      { isKicked: true, leftAt: new Date() },
      { new: true }
    );

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found in room' });
    }

    // Decrement participant count
    room.currentParticipants = Math.max(0, room.currentParticipants - 1);
    await room.save();

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      // Notify all room participants
      io.to(`room:${code}`).emit('room:participant-left', {
        roomCode: code,
        userId,
        participantCount: room.currentParticipants,
        kicked: true,
      });

      // Notify the kicked user specifically
      const kickedUser = await User.findById(userId);
      if (kickedUser?.socketId) {
        io.to(kickedUser.socketId).emit('room:host-action', {
          action: 'kick',
          roomCode: code,
          message: 'You were removed from the room by the host',
        });
      }
    }

    logger.info(`User ${userId} kicked from room ${code} by ${req.user.username}`);

    res.json({ message: 'Participant kicked successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Mute/unmute a participant (host only)
 * POST /api/rooms/:code/mute
 */
const muteParticipant = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { userId, mute = true } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const room = await Room.findOne({ roomCode: code, isActive: true });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is the host
    if (!room.hostUserId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only the host can mute participants' });
    }

    // Update participant record
    const participant = await RoomParticipant.findOneAndUpdate(
      {
        roomCode: code,
        userId,
        leftAt: null,
      },
      { isMuted: mute },
      { new: true }
    );

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found in room' });
    }

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      const targetUser = await User.findById(userId);
      if (targetUser?.socketId) {
        io.to(targetUser.socketId).emit('room:host-action', {
          action: mute ? 'mute' : 'unmute',
          roomCode: code,
          message: mute ? 'You were muted by the host' : 'You were unmuted by the host',
        });
      }

      // Notify all participants about mute status change
      io.to(`room:${code}`).emit('room:participant-updated', {
        roomCode: code,
        userId,
        isMuted: mute,
      });
    }

    res.json({
      message: mute ? 'Participant muted' : 'Participant unmuted',
      isMuted: mute,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's rooms (created and joined)
 * GET /api/user/rooms
 */
const getUserRooms = async (req, res, next) => {
  try {
    // Get rooms created by user
    const createdRooms = await Room.find({
      hostUserId: req.user._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    // Get rooms user has joined (excluding their own)
    const joinedParticipants = await RoomParticipant.find({
      userId: req.user._id,
      leftAt: null,
      isKicked: false,
    }).populate({
      path: 'roomId',
      match: { isActive: true },
      populate: {
        path: 'hostUserId',
        select: 'username displayName profilePicture',
      },
    });

    const joinedRooms = joinedParticipants
      .filter(p => p.roomId && !p.roomId.hostUserId._id.equals(req.user._id))
      .map(p => p.roomId);

    res.json({
      createdRooms: createdRooms.map(room => ({
        roomCode: room.roomCode,
        roomName: room.roomName,
        maxParticipants: room.maxParticipants,
        currentParticipants: room.currentParticipants,
        isPublic: room.isPublic,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
      })),
      joinedRooms: joinedRooms.map(room => ({
        roomCode: room.roomCode,
        roomName: room.roomName,
        host: {
          username: room.hostUserId.username,
          displayName: room.hostUserId.displayName,
          profilePicture: room.hostUserId.profilePicture,
        },
        maxParticipants: room.maxParticipants,
        currentParticipants: room.currentParticipants,
        createdAt: room.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get WebRTC config for a room
 * POST /api/rooms/:code/token
 */
const getMeetingToken = async (req, res, next) => {
  try {
    const { code } = req.params;

    const room = await Room.findOne({ roomCode: code, isActive: true });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is a participant
    const participant = await RoomParticipant.findOne({
      roomCode: code,
      userId: req.user._id,
      leftAt: null,
      isKicked: false,
    });

    if (!participant) {
      return res.status(403).json({ error: 'You are not in this room' });
    }

    res.json({
      iceServers: getIceServers(),
      isHost: participant.isHost,
      settings: room.settings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom,
  getRoomDetails,
  joinRoom,
  leaveRoom,
  deleteRoom,
  kickParticipant,
  muteParticipant,
  getUserRooms,
  getMeetingToken,
};
