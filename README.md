# Guftagu - Random Video Chat Platform

<div align="center">
  <img src="guftagu-frontend/public/favicon.svg" alt="Guftagu Logo" width="80" height="80">
  
  **Connect with strangers through live video chat**
  
  [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)](https://nodejs.org/)
  [![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-white?logo=socket.io)](https://socket.io/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://mongodb.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org/)
</div>

---

## 📖 Overview

Guftagu is a production-ready random video chat platform similar to Omegle where users can connect randomly with strangers for live video and voice conversations. Built with modern web technologies, it features passwordless OTP authentication, real-time user count updates, friend system with direct messaging, and a comprehensive admin panel.

### ✨ Key Highlights

- **Random Video Matching** - Connect with strangers instantly via WebRTC
- **Passwordless Authentication** - OTP-based login via email (Brevo API)
- **Real-time Everything** - User count, notifications, messages via Socket.IO
- **Friend System** - Add friends by username or 7-digit unique ID
- **Direct Messaging** - Chat with friends with typing indicators & read receipts
- **Admin Dashboard** - Real-time stats, user management, reports handling

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 16 | React framework with App Router |
| TypeScript | Type-safe development |
| Tailwind CSS 4 | Utility-first styling |
| Socket.IO Client | Real-time communication |
| Zustand | State management |
| React Query | Server state & caching |
| GSAP | Animations |
| Three.js | 3D graphics |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express 5 | REST API server |
| Socket.IO | WebSocket server |
| MongoDB + Mongoose | Database |
| Redis (Upstash) | OTP storage & caching |
| Brevo API | Email delivery |
| JWT | Authentication |
| Winston | Logging |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting |
| Render | Backend hosting |
| MongoDB Atlas | Database (free tier) |
| Upstash Redis | Redis (free tier) |

---

## 🚀 Features

### Authentication
- Passwordless OTP login via email
- 6-digit OTP with 10-minute expiry
- JWT token-based sessions
- Auto-login with stored tokens

### Random Video Chat
- WebRTC peer-to-peer video/audio
- Real-time text chat during calls
- Skip to next stranger instantly
- Camera/microphone toggle controls
- Connection quality indicators

### User Profiles
- Unique 7-digit user ID (permanent)
- Customizable username (change every 30 days)
- Profile picture upload
- Bio and interest tags
- Privacy settings

### Friend System
- Send friend requests by username or 7-digit ID
- Real-time friend request notifications
- Accept/reject from notifications dropdown
- Online/offline status for friends

### Direct Messaging
- Real-time message delivery
- Typing indicators
- Read receipts (✓ sent, ✓✓ delivered, ✓✓ read)
- Message history persistence

### Admin Panel
- Real-time dashboard statistics
- User management (ban/unban, edit, delete)
- Reports handling system
- System activity logs
- Online user monitoring

---

## 📁 Project Structure

```
Guftagu/
├── guftagu-frontend/           # Next.js frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── admin/         # Admin panel pages
│   │   │   ├── chat/          # Video chat page
│   │   │   ├── friends/       # Friends pages
│   │   │   ├── login/         # Auth pages
│   │   │   ├── messages/      # DM pages
│   │   │   ├── profile/       # Profile pages
│   │   │   └── ...
│   │   ├── components/        # React components
│   │   │   ├── layout/        # Header, Footer
│   │   │   ├── ui/            # Reusable UI
│   │   │   └── ...
│   │   ├── contexts/          # React contexts
│   │   ├── lib/               # Utilities
│   │   └── types/             # TypeScript types
│   ├── public/                # Static assets
│   └── package.json
│
├── guftagu-backend/            # Express backend
│   ├── config/                # Database configs
│   ├── controllers/           # Route handlers
│   ├── middleware/            # Express middleware
│   ├── models/                # Mongoose schemas
│   ├── routes/                # API routes
│   ├── socket/                # Socket.IO handlers
│   │   └── handlers/          # Event handlers
│   ├── utils/                 # Helper functions
│   ├── scripts/               # Admin scripts
│   ├── server.js              # Entry point
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB (local or Atlas)
- Redis (local or Upstash)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/guftagu.git
cd guftagu
```

### 2. Install Backend Dependencies
```bash
cd guftagu-backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../guftagu-frontend
npm install
```

---

## 🔐 Environment Variables

### Backend (`guftagu-backend/.env`)
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/guftagu

# Redis (Upstash or local)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Brevo Email API
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Guftagu

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000

# Admin emails
ADMIN_EMAILS=admin@example.com
```

### Frontend (`guftagu-frontend/.env.local`)
```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Socket URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🏃 Running Locally

### Start Backend
```bash
cd guftagu-backend
npm run dev
```
Server runs on `http://localhost:5000`

### Start Frontend
```bash
cd guftagu-frontend
npm run dev
```
App runs on `http://localhost:3000`

---

## 📜 Available Scripts

### Backend
| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with nodemon (hot reload) |

### Frontend
| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to email |
| POST | `/api/auth/verify-otp` | Verify OTP & login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get own profile |
| PUT | `/api/user/profile` | Update profile |
| GET | `/api/user/:username` | Get user by username |
| GET | `/api/user/id/:userId` | Get user by 7-digit ID |
| POST | `/api/user/profile-picture` | Upload profile picture |

### Friends
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/friends` | Get friends list |
| POST | `/api/friends/request` | Send friend request |
| POST | `/api/friends/accept/:id` | Accept request |
| POST | `/api/friends/reject/:id` | Reject request |
| GET | `/api/friends/requests` | Get pending requests |
| DELETE | `/api/friends/:id` | Unfriend |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations` | Get all conversations |
| GET | `/api/messages/:userId` | Get messages with user |
| PUT | `/api/messages/read/:odId` | Mark as read |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/read` | Mark as read |
| DELETE | `/api/notifications/:id` | Delete notification |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/users` | All users (paginated) |
| POST | `/api/admin/ban` | Ban user |
| POST | `/api/admin/unban/:userId` | Unban user |
| GET | `/api/admin/reports` | Get reports |
| PUT | `/api/admin/reports/:id` | Update report |
| GET | `/api/admin/logs` | System logs |

---

## 🔌 Socket.IO Events

### Connection
| Event | Direction | Description |
|-------|-----------|-------------|
| `connect` | Client→Server | Initial connection |
| `authenticate` | Client→Server | Send JWT token |
| `authenticated` | Server→Client | Auth successful |
| `user_count_update` | Server→All | Online user count |

### Video Chat
| Event | Direction | Description |
|-------|-----------|-------------|
| `join_queue` | Client→Server | Join matching queue |
| `leave_queue` | Client→Server | Leave queue |
| `match_found` | Server→Client | Partner found |
| `skip_partner` | Client→Server | Skip current partner |
| `partner_skipped` | Server→Client | Partner skipped you |
| `webrtc_offer` | Bidirectional | WebRTC offer |
| `webrtc_answer` | Bidirectional | WebRTC answer |
| `webrtc_ice_candidate` | Bidirectional | ICE candidate |

### Chat (During Video)
| Event | Direction | Description |
|-------|-----------|-------------|
| `chat_message` | Bidirectional | Send/receive message |
| `chat_typing_start` | Bidirectional | Typing indicator |
| `chat_typing_stop` | Bidirectional | Stop typing |

### Direct Messages
| Event | Direction | Description |
|-------|-----------|-------------|
| `dm_send` | Client→Server | Send DM |
| `dm_receive` | Server→Client | Receive DM |
| `dm_typing_start` | Bidirectional | Typing indicator |
| `dm_read` | Bidirectional | Read receipt |

### Friends
| Event | Direction | Description |
|-------|-----------|-------------|
| `friend_request_received` | Server→Client | New request |
| `friend_request_accepted` | Server→Client | Request accepted |
| `friend_online` | Server→Client | Friend came online |
| `friend_offline` | Server→Client | Friend went offline |

### Notifications
| Event | Direction | Description |
|-------|-----------|-------------|
| `notification_new` | Server→Client | New notification |
| `notification_count_update` | Server→Client | Unread count |

---

## 🗄️ Database Schema

### Users
```javascript
{
  userId: String,        // 7-digit unique ID
  email: String,         // Unique, indexed
  username: String,      // Unique, 3-20 chars
  displayName: String,
  bio: String,           // Max 500 chars
  profilePicture: String,
  interests: [String],   // Max 10 tags
  isOnline: Boolean,
  isAdmin: Boolean,
  isBanned: Boolean,
  privacy: { showOnlineStatus, allowFriendRequests }
}
```

### Matches
```javascript
{
  user1Id, user2Id,
  user1SocketId, user2SocketId,
  startTime, endTime, duration,
  status: 'active' | 'ended' | 'skipped',
  chatMessages: [{ senderId, message, timestamp }]
}
```

### Messages
```javascript
{
  senderId, receiverId,
  content: String,
  isDelivered, deliveredAt,
  isRead, readAt,
  timestamp
}
```

### FriendRequests
```javascript
{
  senderId, receiverId,
  status: 'pending' | 'accepted' | 'rejected',
  sentAt, respondedAt
}
```

### Reports
```javascript
{
  reporterId, reportedUserId,
  reason, description,
  status: 'pending' | 'reviewed' | 'action_taken',
  moderatorNotes
}
```

---

## 🚀 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set environment variables:
   - `NEXT_PUBLIC_API_URL` = your backend URL
   - `NEXT_PUBLIC_SOCKET_URL` = your backend URL
5. Deploy

### Backend (Render)

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service
4. Connect your repository
5. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Root Directory:** `guftagu-backend`
6. Add environment variables
7. Deploy

### Database (MongoDB Atlas)

1. Create free cluster at [mongodb.com](https://mongodb.com/atlas)
2. Create database user
3. Whitelist IP addresses (or allow all: `0.0.0.0/0`)
4. Get connection string and add to `MONGODB_URI`

### Redis (Upstash)

1. Create free database at [upstash.com](https://upstash.com)
2. Get Redis URL
3. Add to `REDIS_URL` environment variable

---

## 🎥 Group Video Call (Room-Based)

Guftagu supports room-based group video calls where users can create private rooms and invite others to join.

### Room Features
- **Private Rooms** - Create rooms with unique 6-character codes
- **Up to 5 Participants** - Support for multi-user video conferencing
- **Host Controls** - Room creator can kick participants
- **WebRTC Mesh** - Full mesh topology for peer connections
- **Screen Sharing** - Share screen with all participants (desktop only)

### Room Creation Flow
```
1. User clicks "Create Room"
2. Backend generates unique 6-character room code
3. Room document created in MongoDB
4. Creator becomes the host with elevated permissions
5. Room code can be shared for others to join
```

### Room Code System
- **Format**: 6 uppercase alphanumeric characters (e.g., `ABC123`)
- **Case-Insensitive**: Codes work regardless of input case
- **Unique**: No duplicate active room codes
- **Expiry**: Rooms expire after all participants leave

### WebRTC Mesh Architecture
```
Participant A ←→ Participant B
     ↕               ↕
Participant C ←→ Participant D
```
Each participant maintains peer connections with all other participants.

### Socket Events (Room)
| Event | Direction | Description |
|-------|-----------|-------------|
| `room:create` | Client→Server | Create new room |
| `room:join` | Client→Server | Join existing room |
| `room:leave` | Client→Server | Leave room |
| `room:user-joined` | Server→Room | New participant joined |
| `room:user-left` | Server→Room | Participant left |
| `room:kick` | Client→Server | Host kicks participant |
| `room:kicked` | Server→Client | You were kicked |
| `room:chat` | Bidirectional | In-room messages |
| `webrtc:offer` | Bidirectional | WebRTC offer with user metadata |
| `webrtc:answer` | Bidirectional | WebRTC answer |
| `webrtc:ice-candidate` | Bidirectional | ICE candidate exchange |

### Room Database Schema
```javascript
{
  code: String,           // 6-char unique code
  host: ObjectId,         // Room creator (User ref)
  participants: [{        // Current participants
    user: ObjectId,
    socketId: String,
    joinedAt: Date
  }],
  maxParticipants: Number, // Default: 8
  isActive: Boolean,
  createdAt: Date,
  endedAt: Date
}
```

### Host Privileges
- **Kick Participants**: Remove any user from the room
- **Room Persistence**: Room stays active as long as host is present
- **Transfer**: Host privileges transfer if host leaves (oldest participant)

### Screen Sharing
- **Desktop**: Full support via `getDisplayMedia` API
- **iOS Safari**: Not supported (shows "not supported" message)
- **Android Chrome**: Supported on most devices

---

## 🔐 Session Tracking System

Guftagu implements IP-based session tracking for security and device management.

### Session Features
- **Device Tracking** - Track login devices with IP and user agent
- **Active Sessions** - View all active sessions in profile
- **Session Termination** - Remotely logout from other devices
- **Login History** - Complete history of login events
- **Security Alerts** - Notifications for new device logins

### How It Works
```
1. User logs in via OTP
2. Backend captures IP address and user agent
3. Session document created with device fingerprint
4. JWT token issued (365-day expiry)
5. Session linked to token for tracking
```

### Session Database Schema
```javascript
{
  user: ObjectId,          // User reference
  token: String,           // JWT token (hashed)
  ipAddress: String,       // Login IP
  userAgent: String,       // Browser/device info
  deviceType: String,      // 'mobile' | 'desktop' | 'tablet'
  browser: String,         // Chrome, Safari, etc.
  os: String,              // iOS, Android, Windows, etc.
  isActive: Boolean,       // Currently active
  lastActivity: Date,      // Last API request
  createdAt: Date,         // Login time
  expiresAt: Date          // Token expiry
}
```

### Login Tracking Schema
```javascript
{
  user: ObjectId,
  ipAddress: String,
  userAgent: String,
  deviceInfo: {
    deviceType: String,
    browser: String,
    os: String
  },
  location: {              // GeoIP (optional)
    country: String,
    city: String
  },
  success: Boolean,        // Login succeeded
  failureReason: String,   // If failed
  timestamp: Date
}
```

### Session Management API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/sessions` | Get all active sessions |
| DELETE | `/api/auth/sessions/:id` | Terminate specific session |
| DELETE | `/api/auth/sessions` | Terminate all other sessions |
| GET | `/api/auth/login-history` | Get login history |

### Token & Session Lifecycle
- **JWT Expiry**: 365 days
- **Session Update**: `lastActivity` updated on each API request
- **Auto-Cleanup**: Expired sessions pruned daily
- **Logout**: Session deactivated, token invalidated

### Security Considerations
- IP addresses stored for security auditing
- User agent parsing for device identification
- New device login triggers notification
- Suspicious activity detection (multiple failed logins)

### Cold Start Behavior (Render Free Tier)
On Render's free tier, the backend may cold start after inactivity:
1. User opens app after inactivity
2. Frontend calls `getMe()` to validate session
3. Backend is still spinning up → request fails
4. Frontend clears token on any auth error
5. User appears "logged out"

**Mitigation**: Frontend has retry logic for transient failures.

---

## 🔧 Troubleshooting

### Common Issues

**OTP not being sent**
- Verify Brevo API key is correct
- Check sender email is verified in Brevo
- Check backend logs for error details

**WebRTC connection failing**
- Ensure both users allow camera/microphone access
- Check if users are behind strict firewalls
- Verify TURN/STUN servers if needed

**Socket connection issues**
- Verify `NEXT_PUBLIC_SOCKET_URL` matches backend URL
- Check CORS settings in backend
- Ensure backend is running and accessible

**Database connection failing**
- Verify MongoDB URI is correct
- Check IP whitelist in Atlas
- Ensure database user has correct permissions

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for frontend
- Follow ESLint configuration
- Use meaningful commit messages
- Write comments for complex logic

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**Vyom Verma**

---

<div align="center">
  Made with ❤️ for connecting people
</div>
