const express = require('express');
const router = express.Router();
const {
  createRoom,
  getRoomDetails,
  joinRoom,
  forceJoinRoom,
  leaveRoom,
  deleteRoom,
  kickParticipant,
  muteParticipant,
  getUserRooms,
  getMeetingToken,
} = require('../controllers/roomController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// POST /api/rooms/create - Create new room
router.post('/create', createRoom);

// GET /api/rooms/my-rooms - Get user's rooms (created and joined)
router.get('/my-rooms', getUserRooms);

// GET /api/rooms/:code - Get room details
router.get('/:code', getRoomDetails);

// POST /api/rooms/:code/join - Join room
router.post('/:code/join', joinRoom);

// POST /api/rooms/:code/force-join - Force join room (disconnect from other devices)
router.post('/:code/force-join', forceJoinRoom);

// POST /api/rooms/:code/leave - Leave room
router.post('/:code/leave', leaveRoom);

// POST /api/rooms/:code/token - Get meeting token
router.post('/:code/token', getMeetingToken);

// POST /api/rooms/:code/kick - Kick participant (host only)
router.post('/:code/kick', kickParticipant);

// POST /api/rooms/:code/mute - Mute participant (host only)
router.post('/:code/mute', muteParticipant);

// DELETE /api/rooms/:code - Delete room (host only)
router.delete('/:code', deleteRoom);

module.exports = router;
