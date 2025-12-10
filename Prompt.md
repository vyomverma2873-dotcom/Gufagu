PROJECT: Guftagu - Random Video Chat Platform (Next.js)
Overview:
Build a production-ready video chat platform similar to Omegle where users can connect randomly with strangers for live video and voice conversations. Features include passwordless OTP authentication via Brevo, REAL-TIME user count (instant updates via Socket.io), user profiles with 7-digit unique user IDs, friend requests system (send by username or unique ID), and direct messaging between friends. Deploy frontend on Vercel and backend on Render using only free services.
Core Requirements:

Tech Stack:

Next.js 14+ (App Router) - Frontend on Vercel
TypeScript (mandatory for all files)
WebRTC for video/audio streaming
Socket.io for ALL real-time features (signaling, chat, notifications, user count, typing indicators)
Tailwind CSS for styling
MongoDB + Mongoose for database (MongoDB Atlas free tier - 512MB)
Brevo API for OTP-based passwordless authentication (300 emails/day free)
Redis (Upstash free tier - 10k commands/day) for queue management and OTP storage
Node.js/Express backend for Socket.io server on Render (free tier - 750hrs/month)


Complete Feature List:
Authentication System (Passwordless OTP via Brevo):

User enters email address only (no password)
System generates random 6-digit OTP (000000-999999)
OTP sent via Brevo Email API
OTP valid for 10 minutes
Store OTP in Redis with TTL (Time To Live) expiration
User enters OTP to verify and login
JWT token generated after successful OTP verification
Auto-login with stored JWT in localStorage
Logout functionality clears JWT token
On first login, user must set unique username
System auto-generates 7-digit unique user ID (shown in profile)

7-Digit Unique User ID System:

Every user gets a unique 7-digit ID on signup (e.g., 1234567)
ID is auto-generated and guaranteed unique
ID is permanent and cannot be changed
ID is displayed prominently on user's profile page
Users can share their ID to receive friend requests
Anyone can send friend request by entering this 7-digit ID
ID search functionality: Enter 7-digit ID → Find user → Send request
Username can be changed (once per 30 days) but ID stays same

Random Video Chat:

Anonymous or logged-in user matching
Random 1-on-1 video chat matching via queue system
Real-time text chat alongside video (Socket.io based)
"Next" button to skip to next stranger (instant queue rejoin)
"Stop" button to end current chat session
Camera toggle (on/off) with visual indicator
Microphone toggle (on/off) with visual indicator
Screen sharing toggle (optional feature)
Connection status indicators (connecting/connected/disconnected/reconnecting)
Interest tags for filtered matching (optional selection before matching)
Auto-reconnection logic if connection drops temporarily
Auto-match after skipping (automatically join queue again)
Video quality indicators (connection strength)
Peer-to-peer WebRTC connection
Graceful handling of partner disconnection

Real-time User Count (INSTANT - NO POLLING):

Display live online user count on homepage hero section
Updates INSTANTLY when ANY user connects/disconnects anywhere
Pure Socket.io real-time broadcast - ZERO delays
NO 10-second intervals, NO polling, NO setTimeout
Format: "🟢 1,234 users online now" (with animated green dot)
Shows in header across ALL pages of website
Admin panel shows same count in real-time dashboard
Count includes both anonymous and logged-in users
Backend tracks via Socket.io connection/disconnection events
Broadcast to ALL connected clients on every change
Smooth number animation when count changes

User Profile System:

Profile page accessible at /profile/[username] or /profile/id/[userId]
View own profile at /profile or /me
Profile displays:

7-digit unique User ID (large, prominent, copyable)
Profile picture (upload to Cloudinary free tier or MongoDB GridFS)
Username (unique, changeable once per 30 days)
Display name (can differ from username)
Bio (max 500 characters with emoji support)
Interests/tags (array of strings, max 10 tags)
Join date (formatted: "Member since January 2025")
Total matches count
Online status (green dot if online, updated in real-time)
"Add Friend" button (if not friends yet)
"Message" button (if already friends)
Friends count display


Edit profile page (/profile/edit) for own profile:

Change username (if 30 days passed since last change)
Upload/change profile picture
Edit display name
Edit bio with character counter
Add/remove interest tags
Privacy settings toggle


Privacy settings:

Show/hide online status to non-friends
Allow friend requests from: Everyone / Nobody
Show/hide match count


Profile picture requirements:

Max 5MB file size
Formats: JPG, PNG, WebP
Auto-resize to 400x400px
Compression before upload



Friend Request System (Real-time via Socket.io):
Sending Friend Requests (Two Methods):
Method 1 - By Username:

"Add Friend" button on any user's profile page
Search users by username in dedicated search page (/friends/find)
Real-time search suggestions as user types

Method 2 - By 7-Digit User ID:

Input field to enter 7-digit user ID on /friends/find page
Click "Find User" → System looks up user by ID
If found, show user card with profile pic, username, display name
"Send Friend Request" button on user card
If ID not found, show friendly error message

Friend Request Flow:

Send friend request → recipient gets INSTANT notification via Socket.io
No page refresh needed - notification appears immediately in header bell icon
Friend request states: Pending / Accepted / Rejected
Notification bell icon in header shows unread count badge
Notifications dropdown (click bell icon) shows:

Friend requests received (with accept/reject buttons)
Friend requests accepted notifications
New messages from friends
All notifications sorted by timestamp (newest first)


Click notification → navigate to relevant page automatically
Accept/Reject buttons available in:

Notifications dropdown
Dedicated page /friends/requests
User's profile page (if they sent you request)


Friend list page at /friends showing all accepted friends:

Grid or list view toggle
Real-time online/offline status for each friend
Search/filter friends by name
Sort by: Recently active, Alphabetical, Recently added
Click friend → view profile or message directly


Unfriend option available (with confirmation modal)
Block user option (prevents future requests and messages)
Can't send duplicate requests (UI prevents it)
Pending request can be cancelled by sender

Direct Messaging System (Real-time WebSocket):

Chat ONLY available between accepted friends
Access DM from:

Friend list page (message icon next to each friend)
User profile page ("Message" button if friends)
Notification click (if new message notification)



Message Features:

Real-time message delivery via Socket.io (instant, no delays)
Text messages with full Unicode/emoji support
Typing indicators (shows "Friend is typing..." in real-time)
Read receipts with status indicators:

✓ Sent (gray checkmark)
✓✓ Delivered (gray double checkmarks)
✓✓ Read (blue double checkmarks)


Message timestamps (formatted: "Just now", "2m ago", "Yesterday 3:45 PM")
Unread message counter badge on:

Header messages icon
Friend list (per friend)
Message list (per conversation)


Message list page at /messages showing all conversations:

Each conversation shows:

Friend's profile picture and name
Last message preview (truncated)
Timestamp of last message
Unread count badge
Online status indicator


Sort by: Most recent message first
Search conversations by friend name
Mark all as read button


Chat interface at /messages/[userId]:

Full-screen chat layout (mobile-friendly)
Friend info header (profile pic, name, online status)
Message history (infinite scroll up for older messages)
Message input box at bottom with:

Text input field (auto-expanding, max 2000 chars)
Emoji picker button
Send button (or Enter to send, Shift+Enter for new line)


Auto-scroll to bottom on new message
Visual indicator when friend is typing
Messages grouped by date (date separators)
Own messages align right (blue), friend's align left (gray)


Messages stored in MongoDB for persistence
Load last 50 messages on chat open (load more on scroll up)
Message delivery queue (if recipient offline, deliver when online)
Notification sound on new message (optional, user can toggle)
Desktop notifications (if user granted permission)

Admin Panel (Real-time Dashboard):

Protected route /admin (admin-only access, middleware check)
Must be logged in with admin flag (isAdmin: true in database)

Real-time Statistics Dashboard:

Hero stats cards (large, prominent):

Current online users count (updates instantly via Socket.io)
Total registered users (all time)
Active video matches count (live connections)
Reports pending review (needs attention badge)


Today's statistics section:

New registrations today
Total matches today
Total messages sent today
Peak online users today (with timestamp)


Charts and graphs:

Line chart: Online users over last 24 hours
Bar chart: Matches per hour today
Pie chart: User activity breakdown (active/idle/offline)


Real-time activity feed:

New user registrations (as they happen)
New matches starting (live)
Reports submitted (instant alerts)
User bans/unbans


System health indicators:

Database connection status (green/red dot)
Socket.io server status
Redis connection status
API response time



All Users Management Page (/admin/users):

Comprehensive searchable table of ALL registered users
Table columns:

Profile picture (thumbnail)
7-digit User ID (sortable, searchable)
Username (sortable, searchable, clickable → profile)
Email (searchable)
Display name
Join date (sortable)
Last active (sortable, real-time updates)
Status: Online/Offline with real-time indicator (🟢/⚫)
Account status: Active/Banned/Suspended
Premium status: Yes/No
Total matches count
Friends count
Actions (dropdown menu)


Real-time online status updates:

Green dot appears INSTANTLY when user connects
Gray dot appears INSTANTLY when user disconnects
No page refresh needed


Advanced search and filters:

Search by: User ID, Username, Email, Display name
Filter by: Online/Offline, Banned/Active, Premium/Free
Filter by join date range (date picker)
Filter by last active range
Multi-select filters (combine multiple)


Sorting options:

Join date (newest/oldest)
Last active (most/least recent)
Username (A-Z/Z-A)
Total matches (high/low)
Friends count (high/low)


Pagination:

50 users per page (configurable: 25/50/100)
Page number selector
Previous/Next buttons
"Go to page" input box


Bulk actions:

Select multiple users (checkboxes)
Bulk export to CSV
Bulk ban (with reason)



Per-User Actions in Admin Panel:

View full profile (opens user's profile in new tab)
Edit user details (admin override):

Change username
Change email
Reset password (sends new OTP)
Toggle premium status
Toggle admin status


Ban user:

Modal opens with form
Required: Ban reason (dropdown + text)
Required: Ban duration (Permanent / 1 day / 7 days / 30 days)
Optional: Internal notes
Confirmation required
User immediately disconnected from active match/chat
User cannot login while banned


Unban user:

One-click unban with confirmation
User can immediately login again


Delete user account:

Permanent deletion (cannot be undone)
Confirmation modal with warning
Requires typing "DELETE" to confirm
Removes all user data: profile, messages, matches, friend connections


View user's match history:

Table of all matches (date, partner, duration)
Filter by date range
Export to CSV


View reports against user:

All reports where user was reported
Report details: Reporter, reason, date, status
Quick action to ban from report view


Manually grant premium:

Set premium until date (date picker)
Add internal note for reason


View user's messages:

All conversations (for moderation)
Search messages by keyword
Flag inappropriate messages


Send system message to user:

Appears in their DMs from "System" account
Use for warnings, notices, etc.



Reports Management Page (/admin/reports):

Table of all reports submitted by users:

Report ID
Reporter (username, clickable)
Reported user (username, clickable)
Reason (dropdown: Inappropriate content, Harassment, Spam, etc.)
Description (user's explanation)
Match ID (if from video chat)
Timestamp (sortable)
Status: Pending / Reviewed / Action Taken / Dismissed
Assigned moderator (if any)
Actions dropdown


Filters:

Status (Pending/Reviewed/Action Taken/Dismissed)
Date range
Reason category
Reported user


Sort by: Date (newest first default), Status
Report actions:

View full details (opens modal with all info)
View reported user's profile
View match details (if available)
Assign to moderator (if multiple admins)
Mark as reviewed
Take action:

Ban reported user (choose duration)
Send warning to reported user
Dismiss report (if false report)
Ban reporter (if abuse of report system)


Add moderator notes (internal only)
Mark as resolved


Quick action buttons for pending reports
Export reports to CSV (for record keeping)

Ban Management Section:

Table of all banned users:

User ID and username
Ban reason
Banned by (admin username)
Ban date
Ban until date (or "Permanent")
Unban option (button)


Filter by: Permanent bans / Temporary bans / Expiring soon
Search banned users
Bulk unban (select multiple)

System Logs Page (/admin/logs):

Real-time activity logs:

User connections/disconnections
Match creations/endings
Friend requests sent/accepted
Messages sent (count, not content)
Reports submitted
Admin actions (bans, unbans, edits)
Authentication events (logins, logouts, failed OTP)
Errors and exceptions


Log levels: Info / Warning / Error
Filter by: Level, Date range, User, Event type
Search logs by keyword
Auto-refresh (real-time log streaming)
Export logs to file

Admin Settings:

Manage admin users (add/remove admin privileges)
System configuration:

Max concurrent matches
Match timeout duration
Queue timeout duration
Max friends per user
Max message length
Enable/disable anonymous matching


Maintenance mode toggle (disable new matches temporarily)
Clear cache buttons (Redis)
Database health check
Run database migrations


Technical Architecture in Detail:
Frontend Structure (Next.js on Vercel):

   /guftagu-frontend
     /app
       /layout.tsx                          → Root layout with header, footer, real-time user count
       /page.tsx                            → Landing page with hero, features, live user count
       
       /login
         /page.tsx                          → Email input for OTP request
       
       /verify
         /page.tsx                          → OTP verification (6-digit input)
       
       /onboard
         /page.tsx                          → New user: Set username after first login
       
       /chat
         /page.tsx                          → Video chat interface (main app)
       
       /profile
         /page.tsx                          → Own profile (view/edit mode toggle)
         /edit
           /page.tsx                        → Edit profile form
         /[username]
           /page.tsx                        → View any user's profile by username
         /id
           /[userId]
             /page.tsx                      → View any user's profile by 7-digit ID
       
       /friends
         /page.tsx                          → Friends list with online status
         /find
           /page.tsx                        → Find users (search by username or 7-digit ID)
         /requests
           /page.tsx                        → Friend requests (received/sent tabs)
       
       /messages
         /page.tsx                          → Message conversations list
         /[userId]
           /page.tsx                        → Direct message chat interface
       
       /notifications
         /page.tsx                          → All notifications page (full list)
       
       /admin
         /page.tsx                          → Admin dashboard (stats overview)
         /users
           /page.tsx                        → All users management table
         /reports
           /page.tsx                        → Reports management
         /bans
           /page.tsx                        → Banned users list
         /logs
           /page.tsx                        → System activity logs
         /settings
           /page.tsx                        → Admin settings
       
       /pricing
         /page.tsx                          → Premium subscription plans
       
       /terms
         /page.tsx                          → Terms of service
       
       /privacy
         /page.tsx                          → Privacy policy
       
       /help
         /page.tsx                          → Help center / FAQ
     
     /components
       /layout
         /Header.tsx                        → Header with logo, nav, user count, notification bell
         /Footer.tsx                        → Footer with links
         /Sidebar.tsx                       → Sidebar navigation (mobile)
       
       /auth
         /LoginForm.tsx                     → Email input form
         /OTPForm.tsx                       → OTP verification form
         /OnboardingForm.tsx                → Username selection form
       
       /chat
         /VideoChat.tsx                     → Main video chat component
         /VideoPlayer.tsx                   → Video element wrapper
         /TextChat.tsx                      → Real-time text chat sidebar
         /ChatMessage.tsx                   → Single message component
         /ChatControls.tsx                  → Camera, mic, skip, stop buttons
         /ConnectionStatus.tsx              → Connection quality indicator
         /InterestSelector.tsx              → Tag selection before matching
       
       /profile
         /ProfileCard.tsx                   → Profile display card
         /ProfilePicture.tsx                → Avatar with upload
         /UserIdDisplay.tsx                 → 7-digit ID with copy button
         /EditProfileForm.tsx               → Edit profile fields
         /PrivacySettings.tsx               → Privacy toggles
       
       /friends
         /FriendsList.tsx                   → List of accepted friends
         /FriendCard.tsx                    → Single friend card with status
         /FriendRequestCard.tsx             → Friend request with accept/reject
         /UserSearchBar.tsx                 → Search users by name
         /UserIdSearchForm.tsx              → Search by 7-digit ID
       
       /messages
         /ConversationList.tsx              → All conversations
         /ConversationCard.tsx              → Single conversation preview
         /ChatInterface.tsx                 → Full chat UI
         /MessageBubble.tsx                 → Single message bubble
         /TypingIndicator.tsx               → "... is typing" component
         /MessageInput.tsx                  → Text input with emoji picker
       
       /notifications
         /NotificationBell.tsx              → Bell icon with badge in header
         /NotificationDropdown.tsx          → Dropdown with recent notifications
         /NotificationItem.tsx              → Single notification
       
       /admin
         /StatsCard.tsx                     → Statistic card component
         /UsersTable.tsx                    → All users table
         /UserRow.tsx                       → Single user row with actions
         /ReportsTable.tsx                  → Reports management table
         /BanModal.tsx                      → Ban user modal form
         /ActivityFeed.tsx                  → Real-time activity stream
         /UserCountChart.tsx                → Chart for user count over time
       
       /ui
         /Button.tsx                        → Reusable button component
         /Input.tsx                         → Form input component
         /Modal.tsx                         → Modal dialog
         /Toast.tsx                         → Toast notification
         /Badge.tsx                         → Badge component (for counts)
         /Avatar.tsx                        → User avatar component
         /Spinner.tsx                       → Loading spinner
         /Tooltip.tsx                       → Tooltip component
         /Dropdown.tsx                      → Dropdown menu
     
     /lib
       /socket.ts                           → Socket.io client initialization
       /api.ts                              → API client wrapper (fetch)
       /auth.ts                             → Auth helper functions (JWT handling)
       /utils.ts                            → Utility functions
     
     /hooks
       /useSocket.ts                        → Socket.io connection hook
       /useAuth.ts                          → Authentication state hook
       /useUserCount.ts                     → Real-time user count hook
       /useWebRTC.ts                        → WebRTC connection management hook
       /useTyping.ts                        → Typing indicator hook
       /useNotifications.ts                 → Notifications management hook
       /useChat.ts                          → Chat messages hook
     
     /contexts
       /AuthContext.tsx                     → Auth context provider
       /SocketContext.tsx                   → Socket.io context provider
       /NotificationContext.tsx             → Notifications context
     
     /types
       /index.ts                            → TypeScript type definitions
       /user.ts                             → User-related types
       /message.ts                          → Message-related types
       /match.ts                            → Match-related types
     
     /styles
       /globals.css                         → Global styles with Tailwind
     
     /public
       /images                              → Static images
       /icons                               → Icon assets
Backend Structure (Node.js/Express + Socket.io on Render):
   /guftagu-backend
     /server.js                             → Express app + Socket.io server initialization
     
     /routes
       /auth.js                             → Authentication routes
         POST /api/auth/send-otp            → Send OTP to email
         POST /api/auth/verify-otp          → Verify OTP and login
         POST /api/auth/logout              → Logout (invalidate token)
         GET /api/auth/me                   → Get current user info
       
       /user.js                             → User management routes
         GET /api/user/profile              → Get own profile
         PUT /api/user/profile              → Update own profile
         GET /api/user/:username            → Get user by username
         GET /api/user/id/:userId           → Get user by 7-digit ID
         POST /api/user/profile-picture     → Upload profile picture
         GET /api/user/check-username       → Check username availability
       
       /friends.js                          → Friend system routes
         POST /api/friends/request          → Send friend request (by username)
         POST /api/friends/request-by-id    → Send friend request (by 7-digit ID)
         POST /api/friends/accept           → Accept friend request
         POST /api/friends/reject           → Reject friend request
         DELETE /api/friends/:friendId      → Unfriend
         GET /api/friends                   → Get friends list
         GET /api/friends/requests          → Get pending requests (sent/received)
         GET /api/friends/search            → Search users by username
       
       /messages.js                         → Messaging routes
         GET /api/messages/conversations    → Get all conversations
         GET /api/messages/:userId          → Get messages with specific user
         POST /api/messages/send            → Send message (also via Socket.io)
         PUT /api/messages/read             → Mark messages as read
       
       /match.js                            → Video chat matching routes
         POST /api/match/join-queue         → Join matching queue
         POST /api/match/leave-queue        → Leave queue
         POST /api/match/next               → Skip to next partner
         POST /api/match/end                → End current match
         GET /api/match/history             → Get own match history
       
       /report.js                           → Report system routes
         POST /api/report/user              → Report a user
         GET /api/report/my-reports         → Get own reports
       
       /notification.js                     → Notification routes
         GET /api/notifications             → Get all notifications
         PUT /api/notifications/read        → Mark notifications as read
         DELETE /api/notifications/:id      → Delete notification
       
       /admin.js                            → Admin-only routes
         GET /api/admin/stats               → Get dashboard statistics
         GET /api/admin/users               → Get all users (paginated)
         GET /api/admin/user/:userId        → Get user details
         PUT /api/admin/user/:userId        → Update user (admin override)
         POST /api/admin/ban                → Ban user
         POST /api/admin/unban              → Unban user
         DELETE /api/admin/user/:userId     → Delete user account
         GET /api/admin/reports             → Get all reports
         PUT /api/admin/report/:reportId    → Update report status
         GET /api/admin/logs                → Get system logs
         GET /api/admin/bans                → Get all banned users
     
     /models                                → Mongoose schemas
       /User.js                             → User model
       /Match.js                            → Match model
       /Message.js                          → Message model
       /FriendRequest.js                    → Friend request model
       /Friend.js                           → Friend connection model
       /Report.js                           → Report model
       /Notification.js                     → Notification model
       /OnlineUser.js                       → Online user tracking model
       /Ban.js                              → Ban records model
     
     /middleware
       /auth.js                             → JWT authentication middleware
       /admin.js                            → Admin role verification middleware
       /rateLimit.js                        → Rate limiting middleware
       /validation.js                       → Request validation middleware
       /errorHandler.js                     → Global error handler
     
     /controllers                           → Route controllers
       /authController.js                   → Authentication logic
       /userController.js                   → User management logic
       /friendController.js                 → Friend system logic
       /messageController.js                → Messaging logic
       /matchController.js                  → Matching logic
       /reportController.js                 → Reporting logic
       /notificationController.js           → Notification logic
       /adminController.js                  → Admin operations logic
     
     /utils                                 → Utility functions
       /brevo.js                            → Brevo email API integration
       /otp.js                              → OTP generation and validation
       /redis.js                            → Redis client setup
       /cloudinary.js                       → Cloudinary image upload (if using)
       /userId.js                           → 7-digit unique ID generator
       /logger.js                           → Winston logger setup
       /validators.js                       → Input validation helpers
     
     /socket                                → Socket.io event handlers
       /index.js                            → Socket.io initialization
       
       /handlers
         /connection.js                     → Connection/disconnection logic
           - Track online users count
           - Broadcast count updates INSTANTLY
           - Handle authentication
           - Join user-specific rooms
         
         /webrtc.js                         → WebRTC signaling handlers
           - Offer/Answer exchange
           - ICE candidate exchange
           - Match notifications
         
         /chat.js                           → Video chat text messages
           - Real-time message relay
           - Store messages in database
         
         /dm.js                             → Direct message handlers
           - Send/receive DMs
           - Typing indicators
           - Read receipts
           - Delivery confirmations
         
         /friends.js                        → Friend request notifications
           - Send request notification
           - Accept/reject notifications
           - Online/offline status updates
         
         /userCount.js                      → User count broadcast logic
           - Increment on connect
           - Decrement on disconnect
           - Broadcast to all clients INSTANTLY
         
         /notifications.js                  → General notifications
           - New notification push
           - Mark as read
         
         /admin.js                          → Admin-specific events
           - Real-time admin dashboard updates
           - User status changes
           - New reports
     
     /config
       /database.js                         → MongoDB connection config
       /redis.js                            → Redis connection config
       /env.js                              → Environment variables validation
     
     /.env                                  → Environment variables (not committed)
     /package.json                          → Dependencies
     /Dockerfile                            → Docker config (if needed for Render)

MongoDB Collections Schema (Detailed):
// =====================================================
   // Users Collection
   // =====================================================
   {
     _id: ObjectId,
     
     // 7-Digit Unique User ID (CRITICAL FEATURE)
     userId: String (unique, indexed, exactly 7 digits, e.g., "1234567"),
     // This ID is auto-generated on user creation
     // It's permanent and cannot be changed
     // Users can share this ID to receive friend requests
     // Format: Always 7 digits, padded with leading zeros if needed
     
     // Authentication
     email: String (unique, indexed, lowercase, validated),
     isVerified: Boolean (default: false, true after OTP verification),
     
     // Profile Information
     username: String (unique, indexed, 3-20 chars, alphanumeric + underscore only),
     displayName: String (max 50 chars, can contain spaces and special chars),
     bio: String (max 500 chars, supports emoji),
     profilePicture: String (URL to Cloudinary or GridFS reference),
     interests: [String] (array of interest tags, max 10 tags, each max 20 chars),
     
     // Account Status
     isOnline: Boolean (indexed, real-time updated via Socket.io),
     socketId: String (current active socket connection ID, null if offline),
     lastActive: Date (indexed, updated on every action),
     joinDate: Date (set on account creation, never changes),
     
     // Statistics (denormalized for performance)
     totalMatches: Number (default: 0, incremented after each match),
     friendsCount: Number (default: 0, updated when friends added/removed),
     totalMessagesSent: Number (default: 0, optional stat),
     
     // Roles & Premium
     isPremium: Boolean (default: false, enables premium features),
     premiumUntil: Date (subscription expiry date),
     premiumPlan: String (enum: ['monthly', 'yearly', 'lifetime']),
     isAdmin: Boolean (default: false, indexed, grants admin panel access),
     
     // Ban Information
     isBanned: Boolean (default: false, indexed, prevents login if true),
     banReason: String (reason for ban, shown to user),
     bannedAt: Date (timestamp of ban),
     bannedBy: ObjectId (ref: 'User', admin who banned),
     banUntil: Date (null if permanent ban, Date if temporary),
     
     // Privacy Settings
     privacy: {
       showOnlineStatus: Boolean (default: true, hide green dot if false),
       allowFriendRequests: String (enum: ['everyone', 'nobody'], default: 'everyone')
     },
     
     // Username Change Tracking (username can change, but only once per 30 days)
     usernameLastChanged: Date (null if never changed),
     usernameHistory: [{
       oldUsername: String,
       changedAt: Date
     }] (keep history of username changes),
     
     // Timestamps
     createdAt: Date (auto-generated),
     updatedAt: Date (auto-updated)
   }

   // MongoDB Indexes for Users Collection:
   db.users.createIndex({ userId: 1 }, { unique: true })
   db.users.createIndex({ email: 1 }, { unique: true })
   db.users.createIndex({ username: 1 }, { unique: true })
   db.users.createIndex({ isOnline: 1 })
   db.users.createIndex({ isAdmin: 1 })
   db.users.createIndex({ isBanned: 1 })
   db.users.createIndex({ lastActive: -1 })
   db.users.createIndex({ createdAt: -1 })

   // =====================================================
   // Matches Collection (Video Chat Sessions)
   // =====================================================
   {
     _id: ObjectId,
     
     // Participants (can be null for anonymous users)
     user1Id: ObjectId (ref: 'User', nullable, indexed),
     user2Id: ObjectId (ref: 'User', nullable, indexed),
     user1SocketId: String (indexed, socket connection ID),
     user2SocketId: String (indexed),
     user1Username: String (denormalized, "Anonymous" if no account),
     user2Username: String,
     user1UserId7Digit: String (7-digit ID, null if anonymous),
     user2UserId7Digit: String,
     
     // Match Details
     startTime: Date (indexed, when match started),
     endTime: Date (when match ended),
     duration: Number (in seconds, calculated: endTime - startTime),
     status: String (
       enum: ['active', 'ended', 'skipped', 'reported'], 
       indexed,
       'active' = currently ongoing,
       'ended' = normally ended by user,
       'skipped' = user clicked Next,
       'reported' = ended due to report
     ),
     endReason: String (enum: ['user_ended', 'partner_ended', 'user_skipped', 'partner_skipped', 'disconnect', 'report']),
     
     // Matching Criteria
     interests: [String] (common interests used for this match),
     matchedByInterests: Boolean (true if matched by interests, false if random),
     
     // Chat History (text messages exchanged during video chat)
     chatMessages: [{
       senderId: String (socketId of sender),
       senderUsername: String,
       message: String (max 500 chars),
       timestamp: Date
     }] (array of messages, max 500 messages per match to avoid bloat),
     
     // WebRTC Connection Info
     connectionQuality: String (
       enum: ['excellent', 'good', 'poor', 'failed'],
       tracked for analytics
     ),
     iceConnectionState: String (final ICE connection state),
     
     // Timestamps
     createdAt: Date,
     updatedAt: Date
   }

   // MongoDB Indexes for Matches Collection:
   db.matches.createIndex({ user1Id: 1 })
   db.matches.createIndex({ user2Id: 1 })
   db.matches.createIndex({ user1SocketId: 1 })
   db.matches.createIndex({ user2SocketId: 1 })
   db.matches.createIndex({ startTime: -1 })
   db.matches.createIndex({ status: 1 })
   db.matches.createIndex({ createdAt: -1 })
   // Compound index for user match history
   db.matches.createIndex({ user1Id: 1, startTime: -1 })
   db.matches.createIndex({ user2Id: 1, startTime: -1 })

   // =====================================================
   // Messages Collection (Direct Messages between friends)
   // =====================================================
   {
     _id: ObjectId,
     
     // Participants (both must be registered users and friends)
     senderId: ObjectId (ref: 'User', indexed, cannot be null),
     receiverId: ObjectId (ref: 'User', indexed, cannot be null),
     
     // Message Content
     content: String (max 2000 chars, supports emoji and Unicode),
     
     // Delivery Status (for read receipts)
     isDelivered: Boolean (default: false, true when received by socket),
     deliveredAt: Date (timestamp when delivered),
     isRead: Boolean (default: false, indexed, true when user views message),
     readAt: Date (timestamp when read),
     
     // Message Type (for future features)
     messageType: String (
       enum: ['text', 'image', 'file', 'system'], 
       default: 'text',
       'system' for friend request accepted notification, etc.
     ),
     
     // Timestamps
     timestamp: Date (indexed, message sent time),
     createdAt: Date,
     editedAt: Date (if message edited - future feature),
     deletedAt: Date (soft delete - future feature)
   }

   // MongoDB Indexes for Messages Collection:
   db.messages.createIndex({ senderId: 1 })
   db.messages.createIndex({ receiverId: 1 })
   db.messages.createIndex({ timestamp: -1 })
   db.messages.createIndex({ isRead: 1 })
   // Compound indexes for conversation queries
   db.messages.createIndex({ senderId: 1, receiverId: 1, timestamp: -1 })
   db.messages.createIndex({ receiverId: 1, senderId: 1, timestamp: -1 })
   // For unread message counts
   db.messages.createIndex({ receiverId: 1, isRead: 1 })

   // =====================================================
   // FriendRequests Collection
   // =====================================================
   {
     _id: ObjectId,
     
     // Participants
     senderId: ObjectId (ref: 'User', indexed, who sent the request),
     receiverId: ObjectId (ref: 'User', indexed, who receives the request),
     
     // Request Status
     status: String (
       enum: ['pending', 'accepted', 'rejected'], 
       default: 'pending', 
       indexed,
       'pending' = waiting for response,
       'accepted' = became friends,
       'rejected' = declined
     ),
     
     // Request Message (optional)
     message: String (max 200 chars, optional message when sending request),
     
     // Timestamps
     sentAt: Date (when request was sent),
     respondedAt: Date (when accepted/rejected, null if pending),
     expiresAt: Date (optional: auto-reject after 30 days - future feature),
     createdAt: Date,
     updatedAt: Date
   }

   // MongoDB Indexes for FriendRequests Collection:
   db.friendRequests.createIndex({ senderId: 1 })
   db.friendRequests.createIndex({ receiverId: 1 })
   db.friendRequests.createIndex({ status: 1 })
   // Compound indexes for efficient queries
   db.friendRequests.createIndex({ receiverId: 1, status: 1 })
   db.friendRequests.createIndex({ senderId: 1, status: 1 })
   // Prevent duplicate requests
   db.friendRequests.createIndex(
     { senderId: 1, receiverId: 1, status: 1 }, 
     { unique: true, partialFilterExpression: { status: 'pending' } }
   )

   // =====================================================
   // Friends Collection (Accepted friendships - bidirectional)
   // =====================================================
   {
     _id: ObjectId,
     
     // Friend Pair
     // IMPORTANT: Each friendship creates TWO documents (bidirectional)
     // Example: If User A and User B become friends:
     //   Doc 1: { userId: A, friendId: B }
     //   Doc 2: { userId: B, friendId: A }
     userId: ObjectId (ref: 'User', indexed),
     friendId: ObjectId (ref: 'User', indexed),
     
     // Friendship Details
     friendsSince: Date (when friendship was established),
     
     // Interaction Stats (optional, for future features)
     totalMessages: Number (default: 0, count of DMs exchanged),
     lastInteraction: Date (last message or interaction),
     
     // Timestamps
     createdAt: Date
   }

   // MongoDB Indexes for Friends Collection:
   db.friends.createIndex({ userId: 1 })
   db.friends.createIndex({ friendId: 1 })
   // Compound unique index to prevent duplicates
   db.friends.createIndex({ userId: 1, friendId: 1 }, { unique: true })
   // For checking if two users are friends
   db.friends.createIndex({ userId: 1, friendId: 1 })

   // =====================================================
   // Reports Collection
   // =====================================================
   {
     _id: ObjectId,
     
     // Reporter (can be null if anonymous user reported)
     reporterId: ObjectId (ref: 'User', nullable, indexed),
     reporterSocketId: String (socket ID of reporter),
     reporterUsername: String (denormalized, or "Anonymous"),
     reporterUserId7Digit: String (7-digit ID, null if anonymous),
     
     // Reported User (can be null if anonymous)
     reportedUserId: ObjectId (ref: 'User', nullable, indexed),
     reportedSocketId: String (socket ID of reported user),
     reportedUsername: String (or "Anonymous"),
     reportedUserId7Digit: String,
     
     // Report Details
     matchId: ObjectId (ref: 'Match', nullable, which match this happened in),
     reason: String (
       enum: [
         'inappropriate_content',
         'harassment',
         'spam',
         'nudity',
         'violence',
         'hate_speech',
         'underage',
         'scam',
         'impersonation',
         'other'
       ], 
       indexed
     ),
     description: String (max 1000 chars, detailed explanation from reporter),
     
     // Status & Review (admin moderation)
     status: String (
       enum: ['pending', 'reviewed', 'action_taken', 'dismissed'], 
       default: 'pending', 
       indexed,
       'pending' = needs review,
       'reviewed' = admin looked at it,
       'action_taken' = user banned or warned,
       'dismissed' = no action needed
     ),
     reviewedBy: ObjectId (ref: 'User', admin who reviewed),
     reviewedByUsername: String,
     reviewedAt: Date,
     actionTaken: String (description of what action admin took),
     moderatorNotes: String (internal admin notes, not shown to users),
     
     // Priority (for urgent reports)
     priority: String (enum: ['low', 'medium', 'high', 'critical'], default: 'medium'),
     
     // Timestamps
     timestamp: Date (indexed, when report was created),
     createdAt: Date,
     updatedAt: Date
   }

   // MongoDB Indexes for Reports Collection:
   db.reports.createIndex({ reporterId: 1 })
   db.reports.createIndex({ reportedUserId: 1 })
   db.reports.createIndex({ status: 1 })
   db.reports.createIndex({ timestamp: -1 })
   db.reports.createIndex({ priority: 1 })
   // Compound index for admin dashboard
   db.reports.createIndex({ status: 1, timestamp: -1 })
   db.reports.createIndex({ reportedUserId: 1, status: 1 })

   // =====================================================
   // Notifications Collection
   // =====================================================
   {
     _id: ObjectId,
     
     // Recipient
     userId: ObjectId (ref: 'User', indexed, who receives this notification),
     
     // Notification Details
     type: String (
       enum: [
         'friend_request',          // Someone sent you friend request
         'friend_accepted',         // Someone accepted your request
         'new_message',             // New DM received
         'system',                  // System announcement
         'account_warning',         // Warning from admin
         'premium_expired',         // Premium subscription expired
         'match_report_resolved'    // Your report was handled
       ], 
       indexed
     ),
     
     // Related Entities
     relatedUserId: ObjectId (ref: 'User', user involved in notification),
     relatedUsername: String (denormalized for quick display),
     relatedUserId7Digit: String,
     relatedId: ObjectId (ID of friend request, message, etc.),
     
     // Notification Content
     title: String (notification title, max 100 chars),
     content: String (notification text, max 300 chars),
     
     // Action Link (where to navigate when clicked)
     actionUrl: String (e.g., '/messages/[userId]', '/friends/requests'),
     
     // Read Status
     isRead: Boolean (default: false, indexed),
     readAt: Date,
     
     // Push Notification Status (for mobile apps - future)
     isPushed: Boolean (default: false),
     pushedAt: Date,
     
     // Timestamps
     createdAt: Date (indexed, for sorting by recency),
     expiresAt: Date (optional, auto-delete old notifications after 30 days)
   }

   // MongoDB Indexes for Notifications Collection:
   db.notifications.createIndex({ userId: 1 })
   db.notifications.createIndex({ type: 1 })
   db.notifications.createIndex({ isRead: 1 })
   db.notifications.createIndex({ createdAt: -1 })
   // Compound indexes
   db.notifications.createIndex({ userId: 1, isRead: 1, createdAt: -1 })
   db.notifications.createIndex({ userId: 1, type: 1 })
   // TTL index to auto-delete old notifications after 30 days
   db.notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

   // =====================================================
   // OnlineUsers Collection (Cache for real-time user count)
   // =====================================================
   {
     _id: ObjectId,
     
     // Connection Details
     socketId: String (unique, indexed, current socket connection ID),
     userId: ObjectId (ref: 'User', nullable, indexed, null if anonymous),
     username: String (denormalized, "Anonymous" if no account),
     userId7Digit: String (null if anonymous),
     
     // Connection Type
     isAnonymous: Boolean (true if not logged in),
     
     // Connection Timestamps
     connectedAt: Date (when socket connected),
     lastPing: Date (indexed, updated every 30 seconds via heartbeat, for TTL),
     
     // Client Info (optional, for analytics)
     userAgent: String (browser/device info),
     ip: String (IP address, hashed for privacy)
   }

   // MongoDB Indexes for OnlineUsers Collection:
   db.onlineUsers.createIndex({ socketId: 1 }, { unique: true })
   db.onlineUsers.createIndex({ userId: 1 })
   db.onlineUsers.createIndex({ lastPing: 1 })
   // TTL index: auto-delete documents if no ping for 1 hour (3600 seconds)
   db.onlineUsers.createIndex({ lastPing: 1 }, { expireAfterSeconds: 3600 })

   // =====================================================
   // Bans Collection (Ban history and active bans)
   // =====================================================
   {
     _id: ObjectId,
     
     // Banned User
     userId: ObjectId (ref: 'User', indexed),
     username: String (denormalized for quick display),
     userId7Digit: String,
     email: String (denormalized),
     
     // Ban Details
     reason: String (
       enum: [
         'inappropriate_content',
         'harassment',
         'spam',
         'multiple_reports',
         'admin_discretion',
         'underage',
         'impersonation',
         'terms_violation',
         'other'
       ]
     ),
     description: String (detailed ban reason, max 1000 chars),
     banType: String (enum: ['permanent', 'temporary']),
     
     // Ban Dates
     bannedAt: Date (indexed, when ban was issued),
     bannedBy: ObjectId (ref: 'User', admin who issued ban),
     bannedByUsername: String (denormalized),
     banUntil: Date (null if permanent, Date if temporary, indexed),
     
     // Ban Status
     isActive: Boolean (default: true, indexed, false if unbanned),
     
     // Unban Information
     unbannedAt: Date (when user was unbanned),
     unbannedBy: ObjectId (ref: 'User', admin who unbanned),
     unbannedByUsername: String,
     unbanReason: String (why ban was lifted),
     
     // Related Information
     relatedReportIds: [ObjectId] (reports that led to this ban),
     relatedMatchIds: [ObjectId] (matches where violations occurred),
     
     // Appeal Information (future feature)
     appealSubmitted: Boolean (default: false),
     appealText: String,
     appealDate: Date,
     appealStatus: String (enum: ['pending', 'approved', 'rejected']),
     
     // Timestamps
     createdAt: Date,
     updatedAt: Date
   }

   // MongoDB Indexes for Bans Collection:
   db.bans.createIndex({ userId: 1 })
   db.bans.createIndex({ bannedAt: -1 })
   db.bans.createIndex({ banUntil: 1 })
   db.bans.createIndex({ isActive: 1 })
   // Compound indexes
   db.bans.createIndex({ userId: 1, isActive: 1 })
   db.bans.createIndex({ isActive: 1, banUntil: 1 })

   // =====================================================
   // SystemLogs Collection (Admin activity and system logs)
   // =====================================================
   {
     _id: ObjectId,
     
     // Log Details
     level: String (
       enum: ['info', 'warning', 'error', 'critical'], 
       indexed,
       'info' = normal operations,
       'warning' = potential issues,
       'error' = errors that need attention,
       'critical' = system-breaking issues
     ),
     action: String (
       indexed,
       e.g., 'user_banned', 'user_unbanned', 'report_reviewed', 
       'user_registered', 'match_created', 'admin_login', etc.
     ),
     description: String (detailed log message, max 1000 chars),
     
     // Related Entities
     userId: ObjectId (ref: 'User', nullable, indexed, user involved),
     adminId: ObjectId (ref: 'User', nullable, admin who performed action),
     targetUserId: ObjectId (ref: 'User', nullable, user affected by action),
     
     // Request Information
     ip: String (IP address of request),
     userAgent: String (browser/device info),
     endpoint: String (API endpoint called, e.g., '/api/admin/ban'),
     method: String (HTTP method: GET, POST, PUT, DELETE),
     
     // Additional Data (flexible JSON for any extra info)
     metadata: Object (flexible structure for additional context),
     
     // Error Information (if level is 'error' or 'critical')
     errorMessage: String,
     errorStack: String (stack trace),
     
     // Timestamps
     timestamp: Date (indexed, when log was created),
     createdAt: Date
   }

   // MongoDB Indexes for SystemLogs Collection:
   db.systemLogs.createIndex({ level: 1 })
   db.systemLogs.createIndex({ action: 1 })
   db.systemLogs.createIndex({ userId: 1 })
   db.systemLogs.createIndex({ adminId: 1 })
   db.systemLogs.createIndex({ timestamp: -1 })
   // Compound indexes
   db.systemLogs.createIndex({ level: 1, timestamp: -1 })
   db.systemLogs.createIndex({ action: 1, timestamp: -1 })
   // TTL index: auto-delete logs older than 90 days
   db.systemLogs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 })

   // =====================================================
   // QueueEntries Collection (Matching queue for video chat)
   // =====================================================
   {
     _id: ObjectId,
     
     // User Information
     socketId: String (unique, indexed, current socket connection),
     userId: ObjectId (ref: 'User', nullable, null if anonymous),
     username: String ("Anonymous" if no account),
     userId7Digit: String (null if anonymous),
     isAnonymous: Boolean,
     
     // Matching Preferences
     interests: [String] (array of interest tags for filtered matching),
     preferredGender: String (enum: ['any', 'male', 'female'], premium feature),
     preferredLocation: String (country code, premium feature),
     
     // Queue Status
     status: String (
       enum: ['waiting', 'matched', 'expired'], 
       default: 'waiting',
       'waiting' = in queue,
       'matched' = partner found,
       'expired' = removed from queue after timeout
     ),
     joinedAt: Date (indexed, when user joined queue),
     matchedAt: Date (when partner was found),
     
     // Queue Position (for display)
     position: Number (current position in queue, updated periodically),
     
     // Timestamps
     createdAt: Date,
     expiresAt: Date (TTL, remove from queue after 10 minutes of waiting)
   }

   // MongoDB Indexes for QueueEntries Collection:
   db.queueEntries.createIndex({ socketId: 1 }, { unique: true })
   db.queueEntries.createIndex({ userId: 1 })
   db.queueEntries.createIndex({ status: 1 })
   db.queueEntries.createIndex({ joinedAt: 1 })
   // Compound index for matching algorithm
   db.queueEntries.createIndex({ status: 1, joinedAt: 1 })
   // TTL index: auto-delete after 10 minutes
   db.queueEntries.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

   // =====================================================
   // Subscriptions Collection (Premium subscriptions)
   // =====================================================
   {
     _id: ObjectId,
     
     // User
     userId: ObjectId (ref: 'User', indexed),
     
     // Subscription Details
     plan: String (enum: ['monthly', 'yearly', 'lifetime']),
     status: String (
       enum: ['active', 'expired', 'cancelled', 'pending'], 
       indexed,
       'active' = currently subscribed,
       'expired' = subscription ended,
       'cancelled' = user cancelled, runs till end date,
       'pending' = payment processing
     ),
     
     // Dates
     startDate: Date (when subscription started),
     endDate: Date (when subscription ends, null for lifetime),
     cancelledAt: Date (when user cancelled),
     
     // Payment Information
     amount: Number (price paid in cents),
     currency: String (default: 'USD'),
     paymentMethod: String (enum: ['stripe', 'paypal', 'manual']),
     transactionId: String (payment gateway transaction ID),
     
     // Renewal
     autoRenew: Boolean (default: true),
     nextBillingDate: Date,
     
     // Timestamps
     createdAt: Date,
     updatedAt: Date
   }

   // MongoDB Indexes for Subscriptions Collection:
   db.subscriptions.createIndex({ userId: 1 })
   db.subscriptions.createIndex({ status: 1 })
   db.subscriptions.createIndex({ endDate: 1 })
   db.subscriptions.createIndex({ nextBillingDate: 1 })
   // Compound index
   db.subscriptions.createIndex({ userId: 1, status: 1 })

   7-Digit User ID Generation System:

javascript   // backend/utils/userId.js
   
   /**
    * Generate a unique 7-digit user ID
    * Format: 1000000 - 9999999
    * Ensures uniqueness by checking database
    */
   
   const User = require('../models/User');
   
   async function generateUniqueUserId() {
     let attempts = 0;
     const maxAttempts = 10;
     
     while (attempts < maxAttempts) {
       // Generate random 7-digit number
       const userId = Math.floor(1000000 + Math.random() * 9000000).toString();
       
       // Check if already exists in database
       const existingUser = await User.findOne({ userId });
       
       if (!existingUser) {
         return userId; // Unique ID found
       }
       
       attempts++;
     }
     
     // Fallback: use timestamp-based ID if random generation fails
     const timestamp = Date.now().toString().slice(-7);
     return timestamp;
   }
   
   /**
    * Validate 7-digit user ID format
    */
   function isValidUserId(userId) {
     // Must be exactly 7 digits
     const regex = /^\d{7}$/;
     return regex.test(userId);
   }
   
   /**
    * Format user ID with separators for display (optional)
    * e.g., "1234567" → "123-4567"
    */
   function formatUserId(userId) {
     if (!isValidUserId(userId)) return userId;
     return `${userId.slice(0, 3)}-${userId.slice(3)}`;
   }
   
   module.exports = {
     generateUniqueUserId,
     isValidUserId,
     formatUserId
   };

Socket.io Events Specification (Complete & Detailed):

// =====================================================
   // CONNECTION EVENTS
   // =====================================================
   
   // Client → Server
   'connect'                                // Automatic on connection
   'authenticate' → {                       // Send JWT for authentication
     token: String (JWT)
   }
   'disconnect'                             // Automatic on disconnection
   'reconnect'                              // Automatic on reconnection
   'heartbeat'                              // Ping every 30 seconds to update lastPing in DB
   
   // Server → Client
   'authenticated' → {                      // Authentication successful
     userId: ObjectId,
     username: String,
     userId7Digit: String,                  // 7-digit unique ID
     displayName: String,
     profilePicture: String,
     isAdmin: Boolean,
     isPremium: Boolean,
     friendsCount: Number,
     unreadNotifications: Number,
     unreadMessages: Number
   }
   'auth_error' → {                         // Authentication failed
     message: String,
     code: String
   }
   'reconnected' → {                        // Reconnection successful
     missedNotifications: Number,           // Count of notifications missed
     missedMessages: Number                 // Count of DMs missed
   }
   'force_disconnect' → {                   // Server forcing disconnect
     reason: String                         // e.g., "account_banned", "duplicate_session"
   }

   // =====================================================
   // USER COUNT EVENTS (REAL-TIME, INSTANT, NO POLLING)
   // =====================================================
   
   // Server → All Clients (broadcast on EVERY connect/disconnect)
   'user_count_update' → {                  // INSTANT broadcast to ALL clients
     count: Number,                         // Current total online users
     timestamp: Date                        // When count was updated
   }
   
   // CRITICAL IMPLEMENTATION DETAILS:
   // - This event is emitted to ALL connected clients immediately
   // - Triggered on EVERY socket connect and disconnect event
   // - NO delays, NO polling, NO setInterval, NO setTimeout
   // - Pure WebSocket real-time broadcast
   // - Frontend listens to this event and updates UI instantly
   // - Backend maintains a counter that increments/decrements
   
   // Backend Implementation Example:
   /*
   let onlineUsersCount = 0;
   
   io.on('connection', (socket) => {
     onlineUsersCount++;
     
     // Broadcast to ALL clients immediately
     io.emit('user_count_update', { 
       count: onlineUsersCount, 
       timestamp: new Date() 
     });
     
     socket.on('disconnect', () => {
       onlineUsersCount--;
       
       // Broadcast to ALL clients immediately
       io.emit('user_count_update', { 
         count: onlineUsersCount, 
         timestamp: new Date() 
       });
     });
   });
   */

   // =====================================================
   // WEBRTC SIGNALING EVENTS (Video Chat)
   // =====================================================
   
   // Client → Server
   'join_queue' → {                         // Join matching queue
     interests: [String],                   // Optional interest tags for filtered matching
     userId: ObjectId (nullable),           // Null if anonymous user
     userId7Digit: String (nullable)        // 7-digit ID, null if anonymous
   }
   'leave_queue'                            // Leave matching queue
   
   'webrtc_offer' → {                       // Send WebRTC offer to partner
     to: String (socketId),                 // Partner's socket ID
     offer: RTCSessionDescription           // WebRTC offer object
   }
   'webrtc_answer' → {                      // Send WebRTC answer to partner
     to: String (socketId),                 // Partner's socket ID
     answer: RTCSessionDescription          // WebRTC answer object
   }
   'webrtc_ice_candidate' → {               // Send ICE candidate to partner
     to: String (socketId),                 // Partner's socket ID
     candidate: RTCIceCandidate             // ICE candidate object
   }
   
   'skip_partner'                           // Skip current partner and find new one
   'end_chat'                               // End current chat session
   
   'report_partner' → {                     // Report current partner
     reason: String,                        // Report reason enum value
     description: String                    // Detailed description
   }
   
   'connection_quality' → {                 // Report connection quality (for analytics)
     quality: String,                       // 'excellent', 'good', 'poor', 'failed'
     partnerId: String (socketId)
   }
   
   // Server → Client
   'match_found' → {                        // Partner found successfully
     partnerId: String (socketId),
     partnerUsername: String (or "Anonymous"),
     partnerUserId7Digit: String (or null),
     partnerDisplayName: String,
     partnerProfilePicture: String (or null),
     partnerInterests: [String],
     matchId: ObjectId                      // Match document ID
   }
   
   'partner_disconnected' → {               // Partner disconnected
     reason: String,                        // 'disconnect', 'network_error', 'ended'
     matchId: ObjectId
   }
   
   'partner_skipped' → {                    // Partner skipped you
     matchId: ObjectId
   }
   
   'webrtc_offer' → {                       // Receive offer from partner
     from: String (socketId),
     offer: RTCSessionDescription
   }
   
   'webrtc_answer' → {                      // Receive answer from partner
     from: String (socketId),
     answer: RTCSessionDescription
   }
   
   'webrtc_ice_candidate' → {               // Receive ICE candidate from partner
     from: String (socketId),
     candidate: RTCIceCandidate
   }
   
   'queue_position' → {                     // Your current position in queue
     position: Number,
     totalWaiting: Number,
     estimatedWait: Number (seconds)
   }
   
   'match_ended' → {                        // Match session ended
     matchId: ObjectId,
     duration: Number (seconds),
     reason: String,                        // 'ended', 'skipped', 'disconnected', 'reported'
     partnerId: String (socketId)
   }
   
   'no_match_available' → {                 // No users in queue to match with
     message: String
   }
   
   'queue_timeout' → {                      // Exceeded max wait time in queue
     waitTime: Number (seconds)
   }

   // =====================================================
   // VIDEO CHAT TEXT MESSAGES (Real-time chat during video)
   // =====================================================
   
   // Client → Server
   'chat_message' → {                       // Send message during video chat
     to: String (socketId),                 // Partner's socket ID
     message: String (max 500 chars)
   }
   
   'chat_typing_start' → {                  // User started typing
     to: String (socketId)
   }
   
   'chat_typing_stop' → {                   // User stopped typing
     to: String (socketId)
   }
   
   // Server → Client
   'chat_message' → {                       // Receive message from partner
     from: String (socketId),
     fromUsername: String,
     message: String,
     timestamp: Date
   }
   
   'chat_typing_start' → {                  // Partner started typing
     from: String (socketId)
   }
   
   'chat_typing_stop' → {                   // Partner stopped typing
     from: String (socketId)
   }

   // =====================================================
   // FRIEND SYSTEM EVENTS (REAL-TIME)
   // =====================================================
   
   // Client → Server
   'send_friend_request' → {                // Send friend request
     toUserId: ObjectId,                    // Target user's ObjectId (if known)
     toUsername: String,                    // OR target user's username
     toUserId7Digit: String,                // OR target user's 7-digit ID
     message: String (optional, max 200 chars) // Optional message with request
   }
   
   'accept_friend_request' → {              // Accept friend request
     requestId: ObjectId                    // Friend request document ID
   }
   
   'reject_friend_request' → {              // Reject friend request
     requestId: ObjectId
   }
   
   'cancel_friend_request' → {              // Cancel sent request (before accepted)
     requestId: ObjectId
   }
   
   'unfriend' → {                           // Remove friend
     friendId: ObjectId                     // Friend's user ID
   }
   
   'block_user' → {                         // Block a user
     userId: ObjectId
   }
   
   'unblock_user' → {                       // Unblock a user
     userId: ObjectId
   }
   
   // Server → Client (to recipient only, INSTANT notification)
   'friend_request_received' → {            // New friend request received
     requestId: ObjectId,
     from: {
       userId: ObjectId,
       userId7Digit: String,                // 7-digit ID
       username: String,
       displayName: String,
       profilePicture: String,
       bio: String,
       interests: [String]
     },
     message: String (optional),            // Message included with request
     sentAt: Date
   }
   
   'friend_request_accepted' → {            // Your request was accepted
     requestId: ObjectId,
     by: {
       userId: ObjectId,
       userId7Digit: String,
       username: String,
       displayName: String,
       profilePicture: String
     },
     acceptedAt: Date
   }
   
   'friend_request_rejected' → {            // Your request was rejected
     requestId: ObjectId,
     by: {
       userId: ObjectId,
       username: String
     },
     rejectedAt: Date
   }
   
   'friend_request_cancelled' → {           // Sender cancelled their request
     requestId: ObjectId,
     by: {
       userId: ObjectId,
       username: String
     }
   }
   
   'friend_online' → {                      // Friend came online (INSTANT)
     friendId: ObjectId,
     userId7Digit: String,
     username: String,
     displayName: String,
     profilePicture: String,
     timestamp: Date
   }
   
   'friend_offline' → {                     // Friend went offline (INSTANT)
     friendId: ObjectId,
     userId7Digit: String,
     username: String,
     timestamp: Date
   }
   
   'unfriended' → {                         // Someone unfriended you
     by: {
       userId: ObjectId,
       username: String
     },
     timestamp: Date
   }
   
   'blocked_by_user' → {                    // Someone blocked you
     by: {
       userId: ObjectId,
       username: String
     }
   }
   
   'friend_profile_updated' → {             // Friend updated their profile (optional)
     friendId: ObjectId,
     updatedFields: {
       displayName: String,
       profilePicture: String,
       bio: String
     }
   }

   // =====================================================
   // DIRECT MESSAGING EVENTS (REAL-TIME)
   // =====================================================
   
   // Client → Server
   'dm_send' → {                            // Send direct message
     to: ObjectId (userId),                 // Recipient's user ID
     message: String (max 2000 chars)
   }
   
   'dm_typing_start' → {                    // Start typing indicator
     to: ObjectId (userId)
   }
   
   'dm_typing_stop' → {                     // Stop typing indicator
     to: ObjectId (userId)
   }
   
   'dm_mark_read' → {                       // Mark messages as read
     messageIds: [ObjectId],                // Array of message IDs
     fromUserId: ObjectId                   // Sender's user ID
   }
   
   'dm_mark_delivered' → {                  // Mark messages as delivered
     messageIds: [ObjectId]
   }
   
   'dm_delete' → {                          // Delete message (soft delete)
     messageId: ObjectId
   }
   
   // Server → Client (to recipient only, INSTANT delivery)
   'dm_receive' → {                         // New message received
     messageId: ObjectId,
     from: {
       userId: ObjectId,
       userId7Digit: String,
       username: String,
       displayName: String,
       profilePicture: String
     },
     message: String,
     timestamp: Date,
     conversationId: String                 // For grouping messages
   }
   
   'dm_delivered' → {                       // Message delivered to recipient
     messageId: ObjectId,
     deliveredAt: Date,
     toUserId: ObjectId
   }
   
   'dm_read' → {                            // Message read by recipient
     messageIds: [ObjectId],
     readAt: Date,
     readBy: ObjectId (userId)
   }
   
   'dm_typing_start' → {                    // Friend started typing
     from: {
       userId: ObjectId,
       username: String
     }
   }
   
   'dm_typing_stop' → {                     // Friend stopped typing
     from: {
       userId: ObjectId
     }
   }
   
   'dm_deleted' → {                         // Message was deleted
     messageId: ObjectId,
     deletedBy: ObjectId,
     timestamp: Date
   }
   
   'dm_error' → {                           // Error sending message
     error: String,
     originalMessage: String
   }

   // =====================================================
   // NOTIFICATION EVENTS (REAL-TIME)
   // =====================================================
   
   // Server → Client (INSTANT push)
   'notification_new' → {                   // New notification
     notificationId: ObjectId,
     type: String,                          // 'friend_request', 'friend_accepted', 'new_message', etc.
     title: String,
     content: String,
     relatedUserId: ObjectId,
     relatedUsername: String,
     relatedUserId7Digit: String,
     actionUrl: String,                     // Where to navigate when clicked
     timestamp: Date,
     priority: String                       // 'low', 'medium', 'high'
   }
   
   'notification_count_update' → {          // Unread notification count changed
     unreadCount: Number,
     lastNotification: Object (optional)
   }
   
   // Client → Server
   'notification_mark_read' → {             // Mark notification as read
     notificationIds: [ObjectId]
   }
   
   'notification_delete' → {                // Delete notification
     notificationId: ObjectId
   }
   
   'notification_clear_all'                 // Clear all notifications

   // =====================================================
   // ADMIN EVENTS (Admin Dashboard Real-time Updates)
   // =====================================================
   
   // Server → Admin Clients Only (users with isAdmin: true)
   'admin_user_count_update' → {            // Real-time user count for admin
     count: Number,
     anonymous: Number,                     // Anonymous users count
     registered: Number,                    // Logged-in users count
     premium: Number,                       // Premium users online
     timestamp: Date
   }
   
   'admin_new_registration' → {             // New user registered
     user: {
       userId: ObjectId,
       userId7Digit: String,
       username: String,
       email: String,
       joinDate: Date,
       registrationIp: String
     }
   }
   
   'admin_new_report' → {                   // New report submitted
     report: {
       reportId: ObjectId,
       reporterId: ObjectId,
       reporterUsername: String,
       reportedUserId: ObjectId,
       reportedUsername: String,
       reason: String,
       description: String,
       matchId: ObjectId,
       priority: String,
       timestamp: Date
     }
   }
   
   'admin_user_status_change' → {           // User online/offline status changed
     userId: ObjectId,
     userId7Digit: String,
     username: String,
     isOnline: Boolean,
     timestamp: Date
   }
   
   'admin_user_banned' → {                  // User was banned
     userId: ObjectId,
     userId7Digit: String,
     username: String,
     bannedBy: ObjectId,
     bannedByUsername: String,
     reason: String,
     banType: String,                       // 'permanent' or 'temporary'
     banUntil: Date (null if permanent),
     timestamp: Date
   }
   
   'admin_user_unbanned' → {                // User was unbanned
     userId: ObjectId,
     userId7Digit: String,
     username: String,
     unbannedBy: ObjectId,
     unbannedByUsername: String,
     reason: String,
     timestamp: Date
   }
   
   'admin_match_started' → {                // New match started
     matchId: ObjectId,
     user1: {
       userId: ObjectId,
       username: String,
       userId7Digit: String
     },
     user2: {
       userId: ObjectId,
       username: String,
       userId7Digit: String
     },
     interests: [String],
     timestamp: Date
   }
   
   'admin_match_ended' → {                  // Match ended
     matchId: ObjectId,
     duration: Number (seconds),
     endReason: String,
     timestamp: Date
   }
   
   'admin_report_reviewed' → {              // Report was reviewed
     reportId: ObjectId,
     reviewedBy: ObjectId,
     reviewedByUsername: String,
     status: String,                        // 'reviewed', 'action_taken', 'dismissed'
     actionTaken: String,
     timestamp: Date
   }
   
   'admin_system_alert' → {                 // System alert for admins
     level: String,                         // 'info', 'warning', 'error', 'critical'
     message: String,
     details: Object,
     timestamp: Date
   }
   
   'admin_stats_update' → {                 // Periodic stats update (every 30 seconds)
     totalUsers: Number,
     onlineUsers: Number,
     activeMatches: Number,
     pendingReports: Number,
     todayRegistrations: Number,
     todayMatches: Number,
     peakOnlineToday: Number,
     timestamp: Date
   }

   // =====================================================
   // ERROR EVENTS
   // =====================================================
   
   // Server → Client
   'error' → {                              // General error
     code: String,                          // Error code (e.g., 'INVALID_REQUEST')
     message: String,                       // Human-readable error message
     details: Object (optional)             // Additional error details
   }
   
   'rate_limit_exceeded' → {                // Too many requests
     endpoint: String,                      // Which action was rate limited
     retryAfter: Number (seconds),          // How long to wait
     limit: Number,                         // Request limit
     window: Number (seconds)               // Time window
   }
   
   'validation_error' → {                   // Input validation failed
     field: String,                         // Which field failed
     message: String,
     value: String (optional)
   }
   
   'auth_required' → {                      // Action requires authentication
     action: String,                        // Which action was attempted
     message: String
   }
   
   'permission_denied' → {                  // User lacks permission
     action: String,
     requiredRole: String,                  // e.g., 'admin', 'premium'
     message: String
   }
   
   'user_banned' → {                        // User is banned
     reason: String,
     banType: String,                       // 'permanent' or 'temporary'
     banUntil: Date (null if permanent),
     appealUrl: String (optional)
   }

   // =====================================================
   // ROOM MANAGEMENT (Internal - for Socket.io rooms)
   // =====================================================
   
   // Backend automatically joins users to these rooms:
   // - `user_${userId}` - Personal room for direct notifications
   // - `admin_room` - Room for all admins (for admin events)
   // - `match_${matchId}` - Room for two users in a match
   // - `friends_${userId}` - Room for friend online/offline notifications
   
   // No client events needed - handled automatically by backend



   Make a Attractive Premium Aesthetic Website which should look very premium to feel when user interact 
