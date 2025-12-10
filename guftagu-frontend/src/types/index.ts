// User types
export interface User {
  _id: string;
  userId: string;
  email: string;
  username?: string;
  displayName?: string;
  bio?: string;
  profilePicture?: string;
  interests: string[];
  isOnline: boolean;
  lastActive: string;
  joinDate: string;
  totalMatches: number;
  friendsCount: number;
  isPremium: boolean;
  isAdmin: boolean;
  privacy: PrivacySettings;
  needsOnboarding: boolean;
  canChangeUsername: boolean;
}

export interface PrivacySettings {
  showOnlineStatus: boolean;
  allowFriendRequests: 'everyone' | 'nobody';
  showMatchCount: boolean;
}

// Auth types
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Friend types
export interface Friend {
  _id: string;
  userId: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  bio?: string;
  isOnline: boolean;
  lastActive: string;
  friendsSince: string;
}

export interface FriendRequest {
  _id: string;
  user: {
    _id: string;
    userId: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
    bio?: string;
    interests?: string[];
  };
  message?: string;
  sentAt: string;
}

// Message types
export interface Message {
  _id: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  isDelivered: boolean;
  isRead: boolean;
  messageType: 'text' | 'image' | 'file' | 'system';
}

export interface Conversation {
  friend: {
    _id: string;
    userId: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
    isOnline: boolean;
    lastActive: string;
  };
  lastMessage?: {
    _id: string;
    content: string;
    timestamp: string;
    isOwn: boolean;
    isRead: boolean;
  };
  unreadCount: number;
}

// Notification types
export interface Notification {
  _id: string;
  type: 'friend_request' | 'friend_accepted' | 'new_message' | 'system';
  title: string;
  content: string;
  relatedUserId?: string;
  relatedUsername?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

// Match types
export interface MatchPartner {
  socketId: string;
  username: string;
  userId7Digit?: string;
  displayName?: string;
  profilePicture?: string;
  interests: string[];
}

// WebRTC types
export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Friendship status
export interface FriendshipStatus {
  status: 'friends' | 'pending' | 'none';
  direction?: 'sent' | 'received';
  requestId?: string;
}
