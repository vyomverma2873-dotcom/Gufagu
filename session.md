Prompt for Building Session Management & Active Login Tracking System with Navbar Integration:
I need to build a comprehensive session management system for my website that tracks where users are logged in and displays this information in the existing navbar dropdown menu.
Core Features Required:
1. Update Existing Navbar Dropdown Menu
Modify the current dropdown (shown when clicking on user avatar "VB") to include:
Current Menu Items:

Profile
Settings
Admin Panel
Logout

Add New Menu Items (between Admin Panel and Logout):

Active Sessions / Manage Devices (new page link)

Icon: 🖥️ or device icon
Shows count badge (e.g., "3 devices")
Click opens dedicated sessions management page



Enhanced Logout Options:

Keep existing "Logout" for current device
Add "Logout from all devices" option (with confirmation modal)

2. Active Sessions Dashboard Page
Create a dedicated full page (/sessions or /active-devices) that shows:

Header: "Active Sessions" or "Your Active Devices"
List of all active login sessions for the current user
Each session card should display:

Device Icon (Desktop 🖥️, Mobile 📱, Tablet, etc.)
Device Name/Type: "Chrome on Windows", "Safari on iPhone"
IP Address: e.g., 103.45.67.89
Location: City, Country (based on IP geolocation)
Login Time: "Logged in 2 days ago"
Last Activity: "Active now" or "Last active 3 hours ago"
Current Device Indicator: Badge or highlight for current session
Action Button: "Revoke Access" or "End Session" button (not available for current device)


Bulk Actions:

"Logout from all other devices" button at top/bottom
Confirmation modal before bulk logout



3. Backend Session Management System
Database Schema:
sqlCREATE TABLE user_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  device_type ENUM('desktop', 'mobile', 'tablet', 'unknown') DEFAULT 'unknown',
  browser VARCHAR(50),
  os VARCHAR(50),
  city VARCHAR(100),
  country VARCHAR(100),
  country_code VARCHAR(5),
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_active (user_id, is_active),
  INDEX idx_session_token (session_token)
);
Session Management Logic:

On login: Create new session entry with IP, device info, location
On each authenticated request: Update last_activity timestamp
Auto-expire sessions after 30 days of inactivity
Limit max 10 active sessions per user (auto-revoke oldest if exceeded)
Parse user_agent to extract device type, browser, OS
Use IP geolocation API to get city/country

4. API Endpoints Required
javascript// Get all active sessions for current user
GET /api/user/sessions
Response: {
  sessions: [
    {
      id: 123,
      device_type: "desktop",
      browser: "Chrome",
      os: "Windows 10",
      ip_address: "103.45.67.89",
      location: "New Delhi, India",
      login_time: "2024-01-15T10:30:00Z",
      last_activity: "2024-01-15T15:45:00Z",
      is_current: true,
      is_active: true
    },
    // ... more sessions
  ],
  total_active: 3
}

// Get session count for navbar badge
GET /api/user/sessions/count
Response: { active_count: 3 }

// Revoke specific session
DELETE /api/user/sessions/:sessionId
Response: { success: true, message: "Session terminated" }

// Logout from all devices except current
DELETE /api/user/sessions/logout-all
Response: { success: true, sessions_terminated: 2 }

// Verify current session is still valid
GET /api/user/sessions/verify
Response: { valid: true, session_id: 123 }
5. Security Features

Session Token Security:

Generate cryptographically secure session tokens (256-bit)
Store hashed tokens in database (use bcrypt or similar)
Include CSRF tokens in all state-changing requests


Suspicious Activity Detection:

Email notification when login from new device/location
Flag sessions with unusual activity patterns
Option to mark devices as "trusted"


Session Validation Middleware:

Verify session token on each request
Check if session is still active
Update last_activity timestamp
Reject expired or revoked sessions



6. Frontend Components Needed
A. Navbar Dropdown Component Enhancement:
jsx// Update existing dropdown to include:
<DropdownMenu>
  <DropdownMenuItem href="/profile">
    <User /> Profile
  </DropdownMenuItem>
  <DropdownMenuItem href="/settings">
    <Settings /> Settings
  </DropdownMenuItem>
  <DropdownMenuItem href="/admin">
    <Shield /> Admin Panel
  </DropdownMenuItem>
  
  {/* NEW ITEMS */}
  <DropdownMenuSeparator />
  <DropdownMenuItem href="/sessions">
    <Devices /> Active Sessions
    <Badge>{activeSessionCount}</Badge>
  </DropdownMenuItem>
  
  <DropdownMenuSeparator />
  <DropdownMenuItem onClick={handleLogout}>
    <LogOut /> Logout
  </DropdownMenuItem>
  <DropdownMenuItem onClick={handleLogoutAll}>
    <LogOut /> Logout from all devices
  </DropdownMenuItem>
</DropdownMenu>
```

**B. Sessions Page Component:**
- Responsive grid layout for session cards
- Real-time session count updates
- Loading states and error handling
- Empty state when no other sessions exist
- Confirmation modals for destructive actions

### 7. **UI/UX Design Requirements**

**Color Scheme (matching your dark theme):**
- Background: Dark gray/black (#0a0a0a, #1a1a1a)
- Cards: Slightly lighter (#2a2a2a)
- Text: White/gray (#ffffff, #a0a0a0)
- Current device: Blue accent (#3b82f6)
- Danger actions: Red (#ef4444)

**Session Card Design:**
```
┌─────────────────────────────────────────┐
│ 🖥️ Chrome on Windows     [Current] 💚  │
│ 103.45.67.89 • New Delhi, India         │
│ Logged in 2 days ago • Active now       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📱 Safari on iPhone           [End ×]   │
│ 182.76.34.21 • Mumbai, India            │
│ Logged in 1 week ago • Last active 3h   │
└─────────────────────────────────────────┘
8. Device Detection & Parsing
Use a library like ua-parser-js or device-detector-js to parse user agent:
javascript// Example parsing
{
  device: { type: 'mobile', vendor: 'Apple', model: 'iPhone' },
  browser: { name: 'Safari', version: '17.0' },
  os: { name: 'iOS', version: '17.1' }
}
9. IP Geolocation Integration
Use free tier APIs:

ipapi.co: https://ipapi.co/{ip}/json/
ip-api.com: http://ip-api.com/json/{ip}

Cache geolocation results to avoid repeated API calls.

