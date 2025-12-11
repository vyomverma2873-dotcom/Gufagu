const Match = require('../../models/Match');
const QueueEntry = require('../../models/QueueEntry');
const User = require('../../models/User');
const logger = require('../../utils/logger');

// FIFO queue for fair matching (array instead of Map)
const matchingQueue = [];

// Track recently matched pairs to prevent immediate re-matching
// Key: sorted pair of socket IDs, Value: timestamp
const recentlyMatched = new Map();
const REMATCH_COOLDOWN_MS = 30000; // 30 seconds before same pair can match again

// Helper: Clean up expired recently matched entries
function cleanupRecentlyMatched() {
  const now = Date.now();
  for (const [key, timestamp] of recentlyMatched.entries()) {
    if (now - timestamp > REMATCH_COOLDOWN_MS) {
      recentlyMatched.delete(key);
    }
  }
}

// Helper: Check if two users were recently matched
function wereRecentlyMatched(socketId1, socketId2) {
  const key = [socketId1, socketId2].sort().join(':');
  const timestamp = recentlyMatched.get(key);
  if (!timestamp) return false;
  return Date.now() - timestamp < REMATCH_COOLDOWN_MS;
}

// Helper: Mark two users as recently matched
function markAsRecentlyMatched(socketId1, socketId2) {
  const key = [socketId1, socketId2].sort().join(':');
  recentlyMatched.set(key, Date.now());
}

// Helper: Remove user from queue by socket ID
function removeFromQueue(socketId) {
  const index = matchingQueue.findIndex(entry => entry.socketId === socketId);
  if (index !== -1) {
    matchingQueue.splice(index, 1);
    return true;
  }
  return false;
}

// Helper: Find user in queue by socket ID
function findInQueue(socketId) {
  return matchingQueue.find(entry => entry.socketId === socketId);
}

// Helper: Add to queue and trigger matching
function addToQueueAndMatch(io, socket, queueEntry) {
  // Remove if already in queue
  removeFromQueue(socket.id);
  
  // Add to end of queue (FIFO)
  matchingQueue.push(queueEntry);
  
  logger.info(`User joined queue: ${socket.id} (Queue size: ${matchingQueue.length})`);
  
  // Trigger matching
  processQueue(io);
}

// Process queue - match first valid pair (FIFO, no interest filtering)
function processQueue(io) {
  cleanupRecentlyMatched();
  
  if (matchingQueue.length < 2) return;
  
  // Find first valid pair
  for (let i = 0; i < matchingQueue.length; i++) {
    const user1 = matchingQueue[i];
    
    for (let j = i + 1; j < matchingQueue.length; j++) {
      const user2 = matchingQueue[j];
      
      // Skip if same logged-in user
      if (user1.userId && user2.userId && user1.userId.toString() === user2.userId.toString()) {
        continue;
      }
      
      // Skip if recently matched (unless very few users online)
      if (matchingQueue.length > 2 && wereRecentlyMatched(user1.socketId, user2.socketId)) {
        continue;
      }
      
      // Found a valid match - remove both from queue
      removeFromQueue(user1.socketId);
      removeFromQueue(user2.socketId);
      
      // Mark as recently matched
      markAsRecentlyMatched(user1.socketId, user2.socketId);
      
      // Create match (no interest filtering)
      createMatch(io, user1, user2, [], false);
      
      // Continue processing queue for remaining users
      if (matchingQueue.length >= 2) {
        processQueue(io);
      }
      return;
    }
  }
  
  // No valid match found, notify first user of queue position
  if (matchingQueue.length > 0) {
    const firstUser = matchingQueue[0];
    const socket = io.sockets.sockets.get(firstUser.socketId);
    if (socket) {
      socket.emit('queue_position', {
        position: 1,
        totalWaiting: matchingQueue.length,
        estimatedWait: matchingQueue.length * 5,
      });
    }
  }
}

// Create match between two users
async function createMatch(io, user1, user2, commonInterests, matchedByInterests) {
  try {
    // Remove from database queue
    await QueueEntry.deleteMany({ socketId: { $in: [user1.socketId, user2.socketId] } });
    
    // Create match record
    const match = await Match.create({
      user1Id: user1.userId,
      user2Id: user2.userId,
      user1SocketId: user1.socketId,
      user2SocketId: user2.socketId,
      user1Username: user1.username,
      user2Username: user2.username,
      user1UserId7Digit: user1.userId7Digit,
      user2UserId7Digit: user2.userId7Digit,
      interests: commonInterests,
      matchedByInterests,
      startTime: new Date(),
    });
    
    // Get socket instances
    const socket1 = io.sockets.sockets.get(user1.socketId);
    const socket2 = io.sockets.sockets.get(user2.socketId);
    
    // Join match room
    if (socket1) socket1.join(`match_${match._id}`);
    if (socket2) socket2.join(`match_${match._id}`);
    
    // Notify both users - user1 is initiator (FIFO - was in queue first)
    if (socket1) {
      socket1.emit('match_found', {
        partnerId: user2.socketId,
        partnerUsername: user2.username,
        partnerUserId7Digit: user2.userId7Digit,
        partnerInterests: user2.interests,
        matchId: match._id,
        isInitiator: true,
      });
    }
    
    if (socket2) {
      socket2.emit('match_found', {
        partnerId: user1.socketId,
        partnerUsername: user1.username,
        partnerUserId7Digit: user1.userId7Digit,
        partnerInterests: user1.interests,
        matchId: match._id,
        isInitiator: false,
      });
    }
    
    // Emit to admin room
    io.to('admin_room').emit('admin_match_started', {
      matchId: match._id,
      user1: { userId: user1.userId, username: user1.username },
      user2: { userId: user2.userId, username: user2.username },
      timestamp: new Date(),
    });
    
    logger.info(`Match created: ${match._id} (${user1.username} <-> ${user2.username})`);
  } catch (error) {
    logger.error(`Create match error: ${error.message}`);
  }
}

module.exports = (io, socket) => {
  // Join matching queue
  socket.on('join_queue', async (data) => {
    try {
      const { interests = [] } = data;

      // Create queue entry
      const queueEntry = {
        socketId: socket.id,
        userId: socket.userId || null,
        username: socket.username || 'Anonymous',
        userId7Digit: socket.userId7Digit || null,
        interests,
        joinedAt: new Date(),
      };

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

      // Add to queue and trigger matching
      addToQueueAndMatch(io, socket, queueEntry);
    } catch (error) {
      logger.error(`Join queue error: ${error.message}`);
      socket.emit('error', { code: 'QUEUE_ERROR', message: 'Failed to join queue' });
    }
  });

  // Leave queue
  socket.on('leave_queue', async () => {
    try {
      removeFromQueue(socket.id);
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

  // Skip partner - AUTO-REJOIN BOTH USERS
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

        const partnerId = match.user1SocketId === socket.id ? match.user2SocketId : match.user1SocketId;
        const partnerSocket = io.sockets.sockets.get(partnerId);

        // Leave match room
        socket.leave(`match_${match._id}`);
        if (partnerSocket) {
          partnerSocket.leave(`match_${match._id}`);
        }

        // Notify partner that they were skipped
        io.to(partnerId).emit('partner_skipped', { matchId: match._id });

        logger.info(`Match skipped: ${match._id}`);

        // AUTO-REJOIN BOTH USERS TO QUEUE
        // Create queue entries for both users
        const skipperEntry = {
          socketId: socket.id,
          userId: socket.userId || null,
          username: socket.username || 'Anonymous',
          userId7Digit: socket.userId7Digit || null,
          interests: [],
          joinedAt: new Date(),
        };

        const partnerEntry = {
          socketId: partnerId,
          userId: partnerSocket?.userId || null,
          username: partnerSocket?.username || 'Anonymous',
          userId7Digit: partnerSocket?.userId7Digit || null,
          interests: [],
          joinedAt: new Date(),
        };

        // Add partner first (they were skipped, give them slight priority)
        // Then add skipper
        if (partnerSocket) {
          addToQueueAndMatch(io, partnerSocket, partnerEntry);
        }
        addToQueueAndMatch(io, socket, skipperEntry);
      }
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

  // Handle disconnection for active matches - AUTO-REJOIN PARTNER
  socket.on('disconnect', async () => {
    try {
      // Remove from queue
      removeFromQueue(socket.id);
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
        const partnerSocket = io.sockets.sockets.get(partnerId);

        // Notify partner
        io.to(partnerId).emit('partner_disconnected', {
          reason: 'disconnect',
          matchId: match._id,
        });

        // AUTO-REJOIN PARTNER TO QUEUE
        if (partnerSocket) {
          partnerSocket.leave(`match_${match._id}`);
          
          const partnerEntry = {
            socketId: partnerId,
            userId: partnerSocket.userId || null,
            username: partnerSocket.username || 'Anonymous',
            userId7Digit: partnerSocket.userId7Digit || null,
            interests: [],
            joinedAt: new Date(),
          };
          
          // Add partner to queue immediately
          addToQueueAndMatch(io, partnerSocket, partnerEntry);
        }
      }
    } catch (error) {
      logger.error(`Disconnect cleanup error: ${error.message}`);
    }
  });
};
