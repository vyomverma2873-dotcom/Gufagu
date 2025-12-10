const Match = require('../../models/Match');
const logger = require('../../utils/logger');

module.exports = (io, socket) => {
  // Send chat message during video chat
  socket.on('chat_message', async (data) => {
    try {
      const { to, message } = data;

      if (!message || message.length > 500) return;

      // Find active match
      const match = await Match.findOne({
        $or: [
          { user1SocketId: socket.id, user2SocketId: to, status: 'active' },
          { user1SocketId: to, user2SocketId: socket.id, status: 'active' },
        ],
      });

      if (match) {
        // Save message to match
        match.chatMessages.push({
          senderId: socket.id,
          senderUsername: socket.username || 'Anonymous',
          message,
          timestamp: new Date(),
        });
        await match.save();

        // Relay to partner
        io.to(to).emit('chat_message', {
          from: socket.id,
          fromUsername: socket.username || 'Anonymous',
          message,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      logger.error(`Chat message error: ${error.message}`);
    }
  });

  // Typing indicator start
  socket.on('chat_typing_start', (data) => {
    const { to } = data;
    io.to(to).emit('chat_typing_start', { from: socket.id });
  });

  // Typing indicator stop
  socket.on('chat_typing_stop', (data) => {
    const { to } = data;
    io.to(to).emit('chat_typing_stop', { from: socket.id });
  });
};
