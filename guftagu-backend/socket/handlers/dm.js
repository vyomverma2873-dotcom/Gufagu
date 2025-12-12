const Message = require('../../models/Message');
const Friend = require('../../models/Friend');
const User = require('../../models/User');
const Call = require('../../models/Call');
const logger = require('../../utils/logger');

// Store active calls in memory for quick access
const activeCalls = new Map();

// Export function to access activeCalls from other modules
const getActiveCalls = () => activeCalls;

module.exports = (io, socket) => {
  // Send direct message
  socket.on('dm_send', async (data) => {
    try {
      const { to, message } = data;

      if (!socket.userId) {
        socket.emit('dm_error', { error: 'Authentication required' });
        return;
      }

      if (!message || message.length > 2000) {
        socket.emit('dm_error', { error: 'Invalid message' });
        return;
      }

      // Check if friends
      const friendship = await Friend.findOne({
        userId: socket.userId,
        friendId: to,
      });

      if (!friendship) {
        socket.emit('dm_error', { error: 'You can only message friends' });
        return;
      }

      // Create message
      const newMessage = await Message.create({
        senderId: socket.userId,
        receiverId: to,
        content: message,
        timestamp: new Date(),
      });

      // Update interaction stats
      await Friend.updateMany(
        {
          $or: [
            { userId: socket.userId, friendId: to },
            { userId: to, friendId: socket.userId },
          ],
        },
        { lastInteraction: new Date(), $inc: { totalMessages: 1 } }
      );

      // Get sender info
      const sender = await User.findById(socket.userId);

      // Get receiver info
      const receiver = await User.findById(to);

      if (receiver && receiver.socketId) {
        // Mark as delivered immediately if online
        newMessage.isDelivered = true;
        newMessage.deliveredAt = new Date();
        await newMessage.save();

        // Send to receiver
        io.to(receiver.socketId).emit('dm_receive', {
          messageId: newMessage._id,
          from: {
            userId: socket.userId,
            userId7Digit: sender?.userId,
            username: sender?.username,
            displayName: sender?.displayName,
            profilePicture: sender?.profilePicture,
          },
          message,
          timestamp: newMessage.timestamp,
          conversationId: socket.userId.toString(),
        });

        // Send delivery confirmation to sender
        socket.emit('dm_delivered', {
          messageId: newMessage._id,
          deliveredAt: newMessage.deliveredAt,
          toUserId: to,
        });
      }
    } catch (error) {
      logger.error(`DM send error: ${error.message}`);
      socket.emit('dm_error', { error: 'Failed to send message' });
    }
  });

  // Typing start
  socket.on('dm_typing_start', async (data) => {
    try {
      const { to } = data;
      if (!socket.userId) return;

      const receiver = await User.findById(to);
      if (receiver && receiver.socketId) {
        io.to(receiver.socketId).emit('dm_typing_start', {
          from: {
            userId: socket.userId,
            username: socket.username,
          },
        });
      }
    } catch (error) {
      logger.error(`DM typing start error: ${error.message}`);
    }
  });

  // Typing stop
  socket.on('dm_typing_stop', async (data) => {
    try {
      const { to } = data;
      if (!socket.userId) return;

      const receiver = await User.findById(to);
      if (receiver && receiver.socketId) {
        io.to(receiver.socketId).emit('dm_typing_stop', {
          from: { userId: socket.userId },
        });
      }
    } catch (error) {
      logger.error(`DM typing stop error: ${error.message}`);
    }
  });

  // Mark messages as read
  socket.on('dm_mark_read', async (data) => {
    try {
      const { messageIds, fromUserId } = data;
      if (!socket.userId) return;

      if (messageIds && messageIds.length > 0) {
        await Message.updateMany(
          { _id: { $in: messageIds }, receiverId: socket.userId },
          { isRead: true, readAt: new Date() }
        );
      } else if (fromUserId) {
        await Message.updateMany(
          { senderId: fromUserId, receiverId: socket.userId, isRead: false },
          { isRead: true, readAt: new Date() }
        );
      }

      // Notify sender
      const sender = await User.findById(fromUserId);
      if (sender && sender.socketId) {
        io.to(sender.socketId).emit('dm_read', {
          messageIds,
          readAt: new Date(),
          readBy: socket.userId,
        });
      }
    } catch (error) {
      logger.error(`DM mark read error: ${error.message}`);
    }
  });

  // =====================================================
  // FRIEND CALLING (Voice/Video)
  // =====================================================

  // Initiate call to friend
  socket.on('call_friend', async (data) => {
    try {
      const { friendId, callType } = data;
      if (!socket.userId) {
        socket.emit('call_error', { error: 'Authentication required' });
        return;
      }

      // Check if friends
      const friendship = await Friend.findOne({
        userId: socket.userId,
        friendId: friendId,
      });

      if (!friendship) {
        socket.emit('call_error', { error: 'You can only call friends' });
        return;
      }

      // Get caller info
      const caller = await User.findById(socket.userId);

      // Get callee info
      const callee = await User.findById(friendId);

      if (!callee || !callee.socketId) {
        socket.emit('call_error', { error: 'Friend is not online' });
        return;
      }

      // Generate unique call ID
      const callId = `call_${socket.userId}_${friendId}_${Date.now()}`;

      // Create call record in database
      const callRecord = await Call.create({
        callId,
        callerId: socket.userId,
        receiverId: friendId,
        callType,
        status: 'ringing',
        startedAt: new Date(),
      });

      // Store in active calls
      activeCalls.set(callId, {
        callerId: socket.userId,
        receiverId: friendId,
        callType,
        startedAt: new Date(),
        callerSocketId: socket.id,
        receiverSocketId: callee.socketId,
      });

      // Send call request to friend
      logger.info(`Emitting incoming_call to ${callee.username} (socketId: ${callee.socketId})`);
      io.to(callee.socketId).emit('incoming_call', {
        callId,
        from: {
          userId: socket.userId,
          username: caller?.username,
          displayName: caller?.displayName,
          profilePicture: caller?.profilePicture,
        },
        callType,
        timestamp: new Date(),
      });

      // Confirm call initiated to caller
      socket.emit('call_initiated', {
        callId,
        to: {
          userId: friendId,
          username: callee.username,
          displayName: callee.displayName,
        },
        callType,
      });

      // Set timeout for missed call (30 seconds)
      setTimeout(async () => {
        const activeCall = activeCalls.get(callId);
        if (activeCall && activeCall.status !== 'answered') {
          // Mark as missed
          await Call.findOneAndUpdate(
            { callId },
            { status: 'missed', endedAt: new Date(), endReason: 'missed' }
          );
          activeCalls.delete(callId);
          
          // Notify caller
          io.to(activeCall.callerSocketId).emit('call_missed', {
            callId,
            reason: 'No answer',
          });
        }
      }, 30000);

      logger.info(`Call initiated: ${socket.userId} -> ${friendId} (${callType})`);
    } catch (error) {
      logger.error(`Call friend error: ${error.message}`);
      socket.emit('call_error', { error: 'Failed to initiate call' });
    }
  });

  // Accept incoming call
  socket.on('accept_call', async (data) => {
    try {
      const { callId, callerId } = data;
      if (!socket.userId) return;

      const caller = await User.findById(callerId);
      const callee = await User.findById(socket.userId);

      // Update call record
      await Call.findOneAndUpdate(
        { callId },
        { status: 'answered', answeredAt: new Date() }
      );

      // Update active call status
      const activeCall = activeCalls.get(callId);
      if (activeCall) {
        activeCall.status = 'answered';
        activeCall.answeredAt = new Date();
      }

      // Use callerSocketId from activeCall (more reliable than user document)
      const callerSocketId = activeCall?.callerSocketId || caller?.socketId;

      if (callerSocketId) {
        io.to(callerSocketId).emit('call_accepted', {
          callId,
          by: {
            userId: socket.userId,
            username: callee?.username,
            displayName: callee?.displayName,
            socketId: socket.id,
          },
        });
      }

      // Send caller's socket ID to callee for WebRTC connection
      socket.emit('call_connected', {
        callId,
        peer: {
          userId: callerId,
          username: caller?.username,
          displayName: caller?.displayName,
          socketId: callerSocketId,
        },
      });

      logger.info(`Call accepted: ${callId}`);
    } catch (error) {
      logger.error(`Accept call error: ${error.message}`);
    }
  });

  // Decline incoming call
  socket.on('decline_call', async (data) => {
    try {
      const { callId, callerId } = data;
      if (!socket.userId) return;

      // Update call record
      await Call.findOneAndUpdate(
        { callId },
        { status: 'declined', endedAt: new Date(), endReason: 'declined' }
      );

      // Remove from active calls
      activeCalls.delete(callId);

      const caller = await User.findById(callerId);

      if (caller && caller.socketId) {
        io.to(caller.socketId).emit('call_declined', {
          callId,
          by: socket.userId,
          reason: 'User declined the call',
        });
      }

      logger.info(`Call declined: ${callId}`);
    } catch (error) {
      logger.error(`Decline call error: ${error.message}`);
    }
  });

  // End call
  socket.on('end_friend_call', async (data) => {
    try {
      const { friendId, callId } = data;
      if (!socket.userId) return;

      // Get active call to calculate duration
      const activeCall = activeCalls.get(callId);
      let duration = 0;
      
      if (activeCall && activeCall.answeredAt) {
        duration = Math.round((Date.now() - activeCall.answeredAt.getTime()) / 1000);
      }

      // Update call record
      if (callId) {
        await Call.findOneAndUpdate(
          { callId },
          { 
            status: 'ended', 
            endedAt: new Date(), 
            endedBy: socket.userId,
            duration,
            endReason: 'completed'
          }
        );
      }

      // Remove from active calls
      if (callId) {
        activeCalls.delete(callId);
      }

      const friend = await User.findById(friendId);

      if (friend && friend.socketId) {
        io.to(friend.socketId).emit('call_ended', {
          callId,
          by: socket.userId,
          duration,
          timestamp: new Date(),
        });
      }

      logger.info(`Call ended: ${socket.userId} -> ${friendId}, duration: ${duration}s`);
    } catch (error) {
      logger.error(`End call error: ${error.message}`);
    }
  });

  // WebRTC signaling for friend calls
  socket.on('friend_call_offer', async (data) => {
    try {
      const { to, offer } = data;
      io.to(to).emit('friend_call_offer', {
        from: socket.id,
        offer,
      });
    } catch (error) {
      logger.error(`Friend call offer error: ${error.message}`);
    }
  });

  socket.on('friend_call_answer', async (data) => {
    try {
      const { to, answer } = data;
      io.to(to).emit('friend_call_answer', {
        from: socket.id,
        answer,
      });
    } catch (error) {
      logger.error(`Friend call answer error: ${error.message}`);
    }
  });

  socket.on('friend_call_ice_candidate', async (data) => {
    try {
      const { to, candidate } = data;
      io.to(to).emit('friend_call_ice_candidate', {
        from: socket.id,
        candidate,
      });
    } catch (error) {
      logger.error(`Friend call ICE error: ${error.message}`);
    }
  });
};

// Export getActiveCalls function
module.exports.getActiveCalls = getActiveCalls;
