Comprehensive Prompt: Room-Based Group Video Chat System with Daily.co Integration
I need to implement a Discord-style room-based group video chat system in my Guftagu website using Daily.co free tier. Here are the complete requirements:

🎯 Core Feature Requirements:
1. Room Creation System
Room Creation Flow:

Add a prominent "Create Room" button on the main dashboard/homepage
When user clicks "Create Room", show a modal with options:

Room Name (optional, default: "{username}'s Room")
Room Type: Public or Private
Max Participants: Slider (2-10 people, default 5)
Password Protection: Toggle (optional)
Enable/Disable features:

Video (default: ON)
Audio (default: ON)
Screen Share (default: ON)
Chat (default: ON)





Room Code Generation:

Generate a unique 8-character alphanumeric code (mix of uppercase, lowercase, and numbers)
Format: ABC12xyz or XY3k9MnP
Example codes: "Gt7Km2Pq", "Hb9Xc4Nw", "Jk2Mn7Rp"
Must be unique across all rooms
Code should be easy to read (avoid confusing characters like 0/O, 1/I/l)

Room Database Schema:
rooms table:
- id (primary key)
- room_code (unique, 8 chars, indexed)
- room_name (varchar)
- host_user_id (foreign key to users table)
- created_at (timestamp)
- expires_at (timestamp, auto-delete after 24 hours if inactive)
- max_participants (integer, default 10)
- current_participants (integer, default 0)
- is_active (boolean)
- is_public (boolean)
- password_hash (nullable)
- daily_co_room_url (varchar, store Daily.co room URL)
- settings (JSON: video_enabled, audio_enabled, etc.)

room_participants table:
- id (primary key)
- room_code (foreign key)
- user_id (foreign key)
- joined_at (timestamp)
- is_host (boolean)
- is_muted (boolean, set by host)
- is_kicked (boolean)

2. User Interface Components
A. Navbar Dropdown Enhancement:
Update the existing dropdown menu to include:
Current Items:
├── Profile
├── Settings
├── Admin Panel
├── Active Sessions (1)
├── [NEW] Your Rooms  ← Add this
│   └── Shows list of active rooms user created
│   └── Shows rooms user is currently in
│   └── Quick actions: Rejoin, Delete, Share
├── Logout
└── Logout from all devices
"Your Rooms" Submenu Design:
Your Rooms →
├── Created Rooms (2)
│   ├── Room: "Gaming Night" 
│   │   Code: GT7km2Pq | 3/10 participants | [Rejoin] [Delete]
│   ├── Room: "Study Group"
│   │   Code: HB9xc4Nw | 1/10 participants | [Rejoin] [Delete]
│
├── Joined Rooms (1)
│   └── Room: "Movie Watch Party"
│       Code: JK2mn7Rp | 5/10 participants | [Rejoin]
│
└── [+ Create New Room]
B. Room Creation Modal:
╔══════════════════════════════════════════════╗
║  Create a New Room                      [×]  ║
╠══════════════════════════════════════════════╣
║                                              ║
║  Room Name (optional)                        ║
║  [_________________________________]         ║
║                                              ║
║  Max Participants                            ║
║  [2]━━━━●━━━━━━━━━━[10]  (5 selected)      ║
║                                              ║
║  Room Settings                               ║
║  ☑ Video Enabled                            ║
║  ☑ Audio Enabled                            ║
║  ☑ Screen Share Enabled                     ║
║  ☑ Chat Enabled                             ║
║                                              ║
║  Privacy                                     ║
║  ○ Public (Anyone with code can join)       ║
║  ● Private (Invite only)                    ║
║                                              ║
║  Password Protection (optional)              ║
║  ☐ Enable password  [_____________]         ║
║                                              ║
║  [Cancel]              [Create Room]        ║
╚══════════════════════════════════════════════╝
After creation, show success modal:
╔══════════════════════════════════════════════╗
║  🎉 Room Created Successfully!               ║
╠══════════════════════════════════════════════╣
║                                              ║
║  Your Room Code:                             ║
║  ┌────────────────────────────────────────┐ ║
║  │        GT7km2Pq                        │ ║
║  └────────────────────────────────────────┘ ║
║  [Copy Code]  [Share Link]                  ║
║                                              ║
║  Room Link:                                  ║
║  https://guftagu.com/room/GT7km2Pq          ║
║  [Copy Link]                                 ║
║                                              ║
║  [Join Room Now]        [Close]             ║
╚══════════════════════════════════════════════╝

3. Join Room Interface
Option A: Join via Code Input
Add a "Join Room" button on homepage with input field:
╔══════════════════════════════════════════════╗
║  Join a Room                            [×]  ║
╠══════════════════════════════════════════════╣
║                                              ║
║  Enter Room Code:                            ║
║  [_ _ _ _ _ _ _ _]  (8 characters)          ║
║                                              ║
║  Password (if required):                     ║
║  [_________________________________]         ║
║                                              ║
║  [Cancel]                  [Join Room]      ║
╚══════════════════════════════════════════════╝
Option B: Direct Link

Share link: https://guftagu.com/room/GT7km2Pq
Auto-redirect to room if code is valid
Show room preview before joining (room name, participant count, host name)


4. Video Call Room Interface (Main Feature)
Room Layout Structure:
┌─────────────────────────────────────────────────────────────┐
│  Top Bar                                                     │
│  🎥 Gaming Night | Code: GT7km2Pq | 5/10 participants      │
│  [Copy Code] [Invite] [Settings⚙️] [Leave🚪]               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Video Grid Area (Dynamically adjusts based on participants)│
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │  Video 1     │ │  Video 2     │ │  Video 3     │       │
│  │  (Host)      │ │              │ │              │       │
│  │  Vyom 🎤     │ │  John 🔇     │ │  Sarah       │       │
│  │ [Add Friend] │ │ [Add Friend] │ │ [Add Friend] │       │
│  │ [Mute]       │ │ [Unmute]     │ │ [Mute]       │       │
│  │ [Kick]       │ │ [Kick]       │ │              │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐                         │
│  │  Video 4     │ │  + Add More  │                         │
│  │              │ │  (5/10)      │                         │
│  │  Mike        │ │              │                         │
│  │ [Add Friend] │ │              │                         │
│  └──────────────┘ └──────────────┘                         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Bottom Controls Bar                                        │
│  [🎤 Mic] [📹 Camera] [🖥️ Share] [💬 Chat] [⚙️ More]       │
└─────────────────────────────────────────────────────────────┘
Dynamic Grid Layout (Smooth Transitions):
Grid must automatically adjust based on participant count:
1 participant:  [═══════ Full Screen ═══════]

2 participants: [═══════] [═══════]
                 50%       50%

3 participants: [════] [════] [════]
                 33%    33%    33%

4 participants: [════] [════]
                [════] [════]
                 2×2 Grid

5-6 participants: [══] [══] [══]
                  [══] [══] [══]
                   2×3 Grid

7-9 participants: [═] [═] [═]
                  [═] [═] [═]
                  [═] [═] [═]
                   3×3 Grid

10 participants: [═] [═] [═] [═]
                 [═] [═] [═] [═]
                 [═] [═]
                  Adaptive Grid
Animation Requirements:

When new user joins: Smoothly resize and reposition all video containers
CSS transitions: transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
No sudden jumps or flickering
Maintain aspect ratio of video containers
Show skeleton loader while video connects


5. Individual Participant Card Features
Each video container should display:
┌────────────────────────────┐
│     [Video Stream]         │
│                            │
│  ┌──────────────────────┐ │
│  │ Overlay (on hover)   │ │
│  │                      │ │
│  │  👤 Vyom Badshah    │ │
│  │  🎤 Audio: ON       │ │
│  │  📹 Video: ON       │ │
│  │                      │ │
│  │  Actions:           │ │
│  │  [➕ Add Friend]    │ │ ← Available to all users
│  │  [🔇 Mute]          │ │ ← Only for HOST
│  │  [🚫 Kick]          │ │ ← Only for HOST
│  │                      │ │
│  └──────────────────────┘ │
└────────────────────────────┘
Host Controls (visible only to room creator):

Mute Participant: Click to force mute someone
Kick from Room: Remove participant (with confirmation modal)
Make Co-Host: Transfer host privileges (optional feature)

User Actions (visible to all):

Add Friend Button: Send friend request to this participant

Click → Show toast: "Friend request sent to {username}"
Store in friend_requests table
Real-time notification to recipient




6. Room Management Features
A. Participants Panel (Side Panel)
┌─────────────────────────┐
│  Participants (5/10)    │
├─────────────────────────┤
│  👑 Vyom (Host)         │
│     🎤 🎥 Active       │
│                         │
│  👤 John                │
│     🔇 🎥 Muted        │
│     [Unmute] [Kick]     │
│                         │
│  👤 Sarah               │
│     🎤 🎥 Active       │
│     [Mute] [Kick]       │
│                         │
│  👤 Mike                │
│     🎤 📷 Video Off    │
│     [Mute] [Kick]       │
│                         │
│  + Invite More          │
└─────────────────────────┘
B. Invite System
╔══════════════════════════════════════╗
║  Invite People                       ║
╠══════════════════════════════════════╣
║                                      ║
║  Room Code: GT7km2Pq                 ║
║  [Copy Code] 📋                      ║
║                                      ║
║  Share Link:                         ║
║  guftagu.com/room/GT7km2Pq          ║
║  [Copy Link] 🔗                      ║
║                                      ║
║  Or share via:                       ║
║  [WhatsApp] [Email] [Twitter]       ║
║                                      ║
║  Invite from Friends List:           ║
║  ☐ Alice                             ║
║  ☐ Bob                               ║
║  ☐ Charlie                           ║
║  [Send Invites]                      ║
║                                      ║
╚══════════════════════════════════════╝

7. Daily.co Integration Specifications
API Integration Flow:
javascript// Step 1: Create Daily.co room when user creates Guftagu room
POST https://api.daily.co/v1/rooms
Headers: {
  'Authorization': 'Bearer YOUR_DAILY_API_KEY',
  'Content-Type': 'application/json'
}
Body: {
  "name": "guftagu-{room_code}",  // e.g., "guftagu-GT7km2Pq"
  "privacy": "private",
  "properties": {
    "max_participants": 10,
    "enable_screenshare": true,
    "enable_chat": true,
    "enable_knocking": false,
    "enable_prejoin_ui": false,
    "start_video_off": false,
    "start_audio_off": false,
    "exp": Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  }
}

// Step 2: Store Daily.co room URL in database
daily_co_room_url = response.url; // e.g., "https://yourcompany.daily.co/guftagu-GT7km2Pq"

// Step 3: Generate meeting token for each participant
POST https://api.daily.co/v1/meeting-tokens
Body: {
  "properties": {
    "room_name": "guftagu-GT7km2Pq",
    "user_name": "Vyom Badshah",
    "is_owner": true,  // true for host, false for others
    "enable_recording": false
  }
}
Frontend Integration:
javascript// Install: npm install @daily-co/daily-js

import DailyIframe from '@daily-co/daily-js';

// Create call frame
const callFrame = DailyIframe.createFrame({
  iframeStyle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  showLeaveButton: true,
  showFullscreenButton: true,
  showLocalVideo: true,
  showParticipantsBar: true,
});

// Join room with token
callFrame.join({
  url: daily_co_room_url,
  token: meeting_token,
  userName: current_user.name,
});

// Listen to events
callFrame.on('participant-joined', (event) => {
  // Update UI: Add participant to grid
  // Show notification: "{username} joined"
  // Update participant count
});

callFrame.on('participant-left', (event) => {
  // Update UI: Remove participant from grid
  // Smooth transition/animation
  // Update participant count
});

callFrame.on('participant-updated', (event) => {
  // Update mute/video status
  // Update participant card overlay
});

8. Real-time Features (WebSocket)
Required Real-time Events:
javascript// Server → Client events
socket.on('room:participant-joined', (data) => {
  // { room_code, user, participant_count }
  // Update UI: Show new participant
  // Play join sound
  // Show toast notification
});

socket.on('room:participant-left', (data) => {
  // { room_code, user_id, participant_count }
  // Update UI: Remove participant
  // Smooth grid transition
});

socket.on('room:host-action', (data) => {
  // { action: 'mute'|'kick', target_user_id }
  if (data.action === 'kick' && data.target_user_id === current_user.id) {
    // Show modal: "You were removed from the room"
    // Force leave room
  }
  if (data.action === 'mute') {
    // Update UI: Show muted status
  }
});

socket.on('room:closed', (data) => {
  // Host closed the room
  // Show modal: "Room has been closed by host"
  // Redirect to homepage
});

// Client → Server events
socket.emit('room:join', { room_code, user_id });
socket.emit('room:leave', { room_code, user_id });
socket.emit('room:host-mute', { room_code, target_user_id });
socket.emit('room:host-kick', { room_code, target_user_id });

9. UI/UX Polish Requirements
A. Smooth Animations:
css/* Grid layout transitions */
.video-grid {
  display: grid;
  gap: 1rem;
  transition: grid-template-columns 0.3s ease,
              grid-template-rows 0.3s ease;
}

.participant-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Removing participant */
.participant-leaving {
  animation: slideOut 0.3s ease forwards;
}

@keyframes slideOut {
  to {
    opacity: 0;
    transform: scale(0.8);
  }
}
```

**B. Loading States:**
- Show skeleton placeholders while videos load
- Display "Connecting..." overlay on participant cards
- Progress indicator during room creation

**C. Empty States:**
```
When room is empty except host:
┌────────────────────────────────────┐
│                                    │
│         🎥                         │
│    Waiting for participants...    │
│                                    │
│    Room Code: GT7km2Pq            │
│    [Copy Code] [Invite Friends]   │
│                                    │
└────────────────────────────────────┘
```

**D. Mobile Responsive:**
- Stack videos vertically on mobile (max 2 per row)
- Swipe between participants
- Bottom sheet for controls
- Floating action button for invite

---

### **10. Additional Features**

**A. Room Settings Panel:**
```
⚙️ Room Settings
├── Participants (5/10)
├── Waiting Room: OFF
├── Lock Room (Prevent new joins)
├── Enable Chat: ON
├── Enable Screen Share: ON
├── Recording: OFF (Premium feature)
├── Room Quality: Auto
└── End Room for All
```

**B. Chat Integration:**
- Side panel chat (collapsible)
- Text messages + emojis
- File sharing (images, documents)
- Message notifications

**C. Screen Sharing:**
- Host/participants can share screen
- Automatically expand shared screen
- Picture-in-picture for other participants

**D. Room Persistence:**
- Save room in database for 24 hours
- Auto-delete if inactive
- Option to "Save Room" permanently (Premium)
- Room history in user profile

---

### **11. Error Handling & Edge Cases**

**Error Scenarios:**

1. **Room Code Not Found:**
```
   ❌ Invalid Room Code
   The room "XYZ789" doesn't exist or has expired.
   [Try Again] [Create New Room]
```

2. **Room Full:**
```
   ⚠️ Room is Full
   This room has reached maximum capacity (10/10).
   You can create your own room instead.
   [Create Room] [Cancel]
```

3. **Host Left:**
```
   👑 Host Left
   Do you want to continue the room?
   [Become Host] [Leave Room]
```

4. **Network Issue:**
```
   ⚠️ Connection Lost
   Trying to reconnect...
   [Reconnect] [Leave Room]
```

5. **Camera/Mic Permission Denied:**
```
   ⚠️ Permission Required
   Please allow camera and microphone access.
   [Grant Permission] [Join with Audio Only]

12. Security & Privacy
Required Security Measures:

Room Code Validation: Check if user has access before joining
Rate Limiting: Prevent spam room creation (max 5 rooms per hour)
Token Expiry: Daily.co meeting tokens expire after 24 hours
Host Verification: Only room creator can kick/mute
Password Protection: Optional bcrypt-hashed passwords
Report System: Users can report inappropriate behavior
Automatic Moderation: AI-based content moderation (optional)


13. Database Queries Needed
sql-- Get all rooms created by user
SELECT * FROM rooms 
WHERE host_user_id = ? 
AND is_active = true 
ORDER BY created_at DESC;

-- Get rooms user is currently in
SELECT r.* FROM rooms r
JOIN room_participants rp ON r.room_code = rp.room_code
WHERE rp.user_id = ? 
AND r.is_active = true;

-- Get room details with participants
SELECT 
  r.*,
  u.username as host_name,
  u.avatar as host_avatar,
  COUNT(rp.user_id) as current_participants
FROM rooms r
LEFT JOIN users u ON r.host_user_id = u.id
LEFT JOIN room_participants rp ON r.room_code = rp.room_code
WHERE r.room_code = ?
GROUP BY r.id;

-- Check if room code exists
SELECT EXISTS(SELECT 1 FROM rooms WHERE room_code = ? AND is_active = true);

14. Performance Optimizations

Lazy Load Videos: Load participant videos on-demand
Compress Video Quality: Auto-adjust based on bandwidth
Cache Room Data: Redis cache for frequently accessed rooms
CDN for Assets: Serve static assets via CDN
Debounce Real-time Events: Prevent flooding WebSocket
Pagination: If room history > 50, paginate


15. Analytics & Monitoring
Track these metrics:

Total rooms created per day
Average participants per room
Average room duration
Peak usage times
Most active users
Daily.co minutes consumed
Conversion rate (free → premium)


📋 Summary of Deliverables:
Please provide:

Backend API Endpoints:

POST /api/rooms/create - Create new room
GET /api/rooms/:code - Get room details
POST /api/rooms/:code/join - Join room
POST /api/rooms/:code/leave - Leave room
DELETE /api/rooms/:code - Delete room (host only)
POST /api/rooms/:code/kick - Kick participant (host only)
POST /api/rooms/:code/mute - Mute participant (host only)
GET /api/user/rooms - Get user's rooms


Frontend Components:

CreateRoomModal component
JoinRoomModal component
VideoCallRoom component (main interface)
ParticipantCard component
ParticipantsPanel component
InviteModal component
Updated navbar dropdown


Daily.co Integration:

Room creation service
Token generation service
Call frame setup
Event listeners


Real-time Features:

WebSocket server setup
Event emitters/listeners
State synchronization


Database:

Migration files
Schema definitions
Seed data (optional)




Technology Stack to Use:


Real-time: Socket.io
Video: Daily.co free tier
Authentication: JWT (existing system)


This implementation should provide a complete, production-ready room-based video chat system similar to Discord but optimized for 1-on-1 and small group interactions with Daily.co's free tier limitations.Claude is AI and can make mistakes. Please double-check responses.