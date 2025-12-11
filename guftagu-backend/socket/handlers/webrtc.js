const Match = require('../../models/Match');
const QueueEntry = require('../../models/QueueEntry');
const User = require('../../models/User');
const logger = require('../../utils/logger');

// In-memory queue for faster matching
const matchingQueue = new Map();

module.exports = (io, socket) => {
  // Join matching queue
  socket.on('join_queue', async (data) => {
    try {
      const { interests = [] } = data;

      // Remove from existing queue if any
      matchingQueue.delete(socket.id);

      // Add to queue
      const queueEntry = {
        socketId: socket.id,
        userId: socket.userId || null,
        username: socket.username || 'Anonymous',
        userId7Digit: socket.userId7Digit || null,
        interests,
        joinedAt: new Date(),
      };

      matchingQueue.set(socket.id, queueEntry);

      // Save to database as backup
      await QueueEntry.findOneAndUpdate(
        { socketId: socket.id },
        {
          ...queueEntry,
          isAnonymous: !socket.userId,
          status: 'waiting',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
        { upsert: true, new: true }
      );

      logger.info(`User joined queue: ${socket.id}`);

      // Try to find a match
      await findMatch(io, socket, queueEntry);
    } catch (error) {
      logger.error(`Join queue error: ${error.message}`);
      socket.emit('error', { code: 'QUEUE_ERROR', message: 'Failed to join queue' });
    }
  });

  // Leave queue
  socket.on('leave_queue', async () => {
    try {
      matchingQueue.delete(socket.id);
      await QueueEntry.findOneAndDelete({ socketId: socket.id });
      logger.info(`User left queue: ${socket.id}`);
    } catch (error) {
      logger.error(`Leave queue error: ${error.message}`);
    }
  });

  // WebRTC offer
  socket.on('webrtc_offer', (data) => {
    const { to, offer } = data;
    io.to(to).emit('webrtc_offer', {
      from: socket.id,
      offer,
    });
  });

  // WebRTC answer
  socket.on('webrtc_answer', (data) => {
    const { to, answer } = data;
    io.to(to).emit('webrtc_answer', {
      from: socket.id,
      answer,
    });
  });

  // ICE candidate
  socket.on('webrtc_ice_candidate', (data) => {
    const { to, candidate } = data;
    io.to(to).emit('webrtc_ice_candidate', {
      from: socket.id,
      candidate,
    });
  });

  // Skip partner
  socket.on('skip_partner', async () => {
    try {
      // End current match
      const match = await Match.findOneAndUpdate(
        {
          $or: [
            { user1SocketId: socket.id, status: 'active' },
            { user2SocketId: socket.id, status: 'active' },
          ],
        },
        {
          status: 'skipped',
          endTime: new Date(),
          endReason: 'user_skipped',
        },
        { new: true }
      );

      if (match) {
        // Calculate duration
        match.duration = Math.floor((match.endTime - match.startTime) / 1000);
        await match.save();

        // Notify partner
        const partnerId = match.user1SocketId === socket.id ? match.user2SocketId : match.user1SocketId;
        io.to(partnerId).emit('partner_skipped', { matchId: match._id });

        // Leave match room
        socket.leave(`match_${match._id}`)
        const partnerSocket = io.sockets.sockets.get(partnerId);
        if (partnerSocket) {
          partnerSocket.leave(`match_${match._id}`);
        }

        logger.info(`Match skipped: ${match._id}`);
      }

      // Don't auto-rejoin - let frontend handle it
      // This allows user to decide if they want to search again
    } catch (error) {
      logger.error(`Skip partner error: ${error.message}`);
    }
  });

  // End chat
  socket.on('end_chat', async () => {
    try {
      const match = await Match.findOneAndUpdate(
        {
          $or: [
            { user1SocketId: socket.id, status: 'active' },
            { user2SocketId: socket.id, status: 'active' },
          ],
        },
        {
          status: 'ended',
          endTime: new Date(),
          endReason: 'user_ended',
        },
        { new: true }
      );

      if (match) {
        match.duration = Math.floor((match.endTime - match.startTime) / 1000);
        await match.save();

        // Update user match counts
        if (match.user1Id) {
          await User.findByIdAndUpdate(match.user1Id, { $inc: { totalMatches: 1 } });
        }
        if (match.user2Id) {
          await User.findByIdAndUpdate(match.user2Id, { $inc: { totalMatches: 1 } });
        }

        // Notify partner
        const partnerId = match.user1SocketId === socket.id ? match.user2SocketId : match.user1SocketId;
        io.to(partnerId).emit('partner_disconnected', {
          reason: 'ended',
          matchId: match._id,
        });

        // Leave match room
        socket.leave(`match_${match._id}`);

        socket.emit('match_ended', {
          matchId: match._id,
          duration: match.duration,
          reason: 'ended',
        });

        logger.info(`Match ended: ${match._id}`);
      }
    } catch (error) {
      logger.error(`End chat error: ${error.message}`);
    }
  });

  // Connection quality report
  socket.on('connection_quality', async (data) => {
    try {
      const { quality, partnerId } = data;
      await Match.findOneAndUpdate(
        {
          $or: [
            { user1SocketId: socket.id, status: 'active' },
            { user2SocketId: socket.id, status: 'active' },
          ],
        },
        { connectionQuality: quality }
      );
    } catch (error) {
      logger.error(`Connection quality error: ${error.message}`);
    }
  });

  // Handle disconnection for active matches
  socket.on('disconnect', async () => {
    try {
      // Remove from queue
      matchingQueue.delete(socket.id);
      await QueueEntry.findOneAndDelete({ socketId: socket.id });

      // Handle active match
      const match = await Match.findOneAndUpdate(
        {
          $or: [
            { user1SocketId: socket.id, status: 'active' },
            { user2SocketId: socket.id, status: 'active' },
          ],
        },
        {
          status: 'ended',
          endTime: new Date(),
          endReason: 'disconnect',
        },
        { new: true }
      );

      if (match) {
        match.duration = Math.floor((match.endTime - match.startTime) / 1000);
        await match.save();

        const partnerId = match.user1SocketId === socket.id ? match.user2SocketId : match.user1SocketId;
        io.to(partnerId).emit('partner_disconnected', {
          reason: 'disconnect',
          matchId: match._id,
        });
      }
    } catch (error) {
      logger.error(`Disconnect cleanup error: ${error.message}`);
    }
  });
};

async function findMatch(io, socket, queueEntry) {
  // Find compatible partner from queue
  for (const [partnerId, partnerEntry] of matchingQueue.entries()) {
    // Skip self
    if (partnerId === socket.id) continue;

    // Skip if same user (if logged in)
    if (queueEntry.userId && partnerEntry.userId && queueEntry.userId.equals(partnerEntry.userId)) {
      continue;
    }

    // Check interest overlap (optional)
    let matchedByInterests = false;
    const commonInterests = queueEntry.interests.filter((i) =>
      partnerEntry.interests.includes(i)
    );
    if (queueEntry.interests.length > 0 && partnerEntry.interests.length > 0) {
      if (commonInterests.length === 0) continue;
      matchedByInterests = true;
    }

    // Found a match!
    matchingQueue.delete(socket.id);
    matchingQueue.delete(partnerId);

    // Remove from database queue
    await QueueEntry.deleteMany({ socketId: { $in: [socket.id, partnerId] } });

    // Create match record
    const match = await Match.create({
      user1Id: queueEntry.userId,
      user2Id: partnerEntry.userId,
      user1SocketId: socket.id,
      user2SocketId: partnerId,
      user1Username: queueEntry.username,
      user2Username: partnerEntry.username,
      user1UserId7Digit: queueEntry.userId7Digit,
      user2UserId7Digit: partnerEntry.userId7Digit,
      interests: commonInterests,
      matchedByInterests,
      startTime: new Date(),
    });

    // Join match room
    socket.join(`match_${match._id}`);
    io.sockets.sockets.get(partnerId)?.join(`match_${match._id}`);

    // Notify both users - only one should be the initiator
    socket.emit('match_found', {
      partnerId: partnerId,
      partnerUsername: partnerEntry.username,
      partnerUserId7Digit: partnerEntry.userId7Digit,
      partnerInterests: partnerEntry.interests,
      matchId: match._id,
      isInitiator: true, // This user initiates the WebRTC connection
    });

    io.to(partnerId).emit('match_found', {
      partnerId: socket.id,
      partnerUsername: queueEntry.username,
      partnerUserId7Digit: queueEntry.userId7Digit,
      partnerInterests: queueEntry.interests,
      matchId: match._id,
      isInitiator: false, // This user waits for the offer
    });

    // Emit to admin room
    io.to('admin_room').emit('admin_match_started', {
      matchId: match._id,
      user1: { userId: queueEntry.userId, username: queueEntry.username },
      user2: { userId: partnerEntry.userId, username: partnerEntry.username },
      timestamp: new Date(),
    });

    logger.info(`Match created: ${match._id} (${queueEntry.username} <-> ${partnerEntry.username})`);
    return;
  }

  // No match found, notify user they're in queue
  socket.emit('queue_position', {
    position: matchingQueue.size,
    totalWaiting: matchingQueue.size,
    estimatedWait: matchingQueue.size * 5, // rough estimate
  });
}
