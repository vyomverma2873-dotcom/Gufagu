import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  sendOTP: (email: string) => api.post('/auth/send-otp', { email }),
  verifyOTP: (email: string, otp: string) => api.post('/auth/verify-otp', { email, otp }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// User API
export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: any) => api.put('/user/profile', data),
  getUserByUsername: (username: string) => api.get(`/user/${username}`),
  getUserById: (userId: string) => api.get(`/user/id/${userId}`),
  getUserByObjectId: (objectId: string) => api.get(`/user/oid/${objectId}`),
  checkUsername: (username: string) => api.get(`/user/check-username?username=${username}`),
  setUsername: (username: string, displayName?: string) => 
    api.post('/user/set-username', { username, displayName }),
  uploadProfilePicture: (imageUrl: string) => 
    api.post('/user/profile-picture', { imageUrl }),
  // Report user
  reportUser: (userId: string, reason: string, description?: string, messageId?: string) =>
    api.post('/user/report', { userId, reason, description, messageId }),
  // Block/Unblock
  blockUser: (userId: string) => api.post('/user/block', { userId }),
  unblockUser: (userId: string) => api.post('/user/unblock', { userId }),
  getBlockedUsers: () => api.get('/user/blocked'),
};

// Friends API
export const friendsApi = {
  getFriends: (params?: any) => api.get('/friends', { params }),
  getRequests: (type?: string) => api.get('/friends/requests', { params: { type } }),
  sendRequest: (username: string, message?: string) => 
    api.post('/friends/request', { username, message }),
  sendRequestById: (userId: string, message?: string) => 
    api.post('/friends/request-by-id', { userId, message }),
  acceptRequest: (requestId: string) => api.post('/friends/accept', { requestId }),
  rejectRequest: (requestId: string) => api.post('/friends/reject', { requestId }),
  cancelRequest: (requestId: string) => api.delete(`/friends/cancel/${requestId}`),
  unfriend: (friendId: string) => api.delete(`/friends/${friendId}`),
  searchUsers: (q: string) => api.get('/friends/search', { params: { q } }),
  checkFriendship: (userId: string) => api.get(`/friends/check/${userId}`),
};

// Messages API
export const messagesApi = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId: string, params?: any) => 
    api.get(`/messages/${userId}`, { params }),
  sendMessage: (receiverId: string, content: string) => 
    api.post('/messages/send', { receiverId, content }),
  markAsRead: (messageIds?: string[], fromUserId?: string) => 
    api.put('/messages/read', { messageIds, fromUserId }),
  getUnreadCount: () => api.get('/messages/unread-count'),
};

// Notifications API
export const notificationsApi = {
  getNotifications: (params?: any) => api.get('/notifications', { params }),
  markAsRead: (notificationIds?: string[], markAll?: boolean) => 
    api.put('/notifications/read', { notificationIds, markAll }),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// Stats API
export const statsApi = {
  getOnlineCount: () => api.get('/stats/online'),
};

// Admin API
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getUserDetails: (userId: string) => api.get(`/admin/users/${userId}`),
  banUser: (userId: string, data: { reason: string; duration?: number; type: 'temporary' | 'permanent'; description?: string }) =>
    api.post(`/admin/users/${userId}/ban`, data),
  unbanUser: (userId: string) => api.post(`/admin/users/${userId}/unban`),
  getReports: (params?: any) => api.get('/admin/reports', { params }),
  updateReport: (reportId: string, data: { status: string; action?: string; notes?: string }) =>
    api.put(`/admin/reports/${reportId}`, data),
  getBans: (params?: any) => api.get('/admin/bans', { params }),
  getLogs: (params?: any) => api.get('/admin/logs', { params }),
  // Chat Export
  getChatStats: () => api.get('/admin/chats/stats'),
  getConversations: (params?: { search?: string }) => api.get('/admin/chats/conversations', { params }),
  exportChat: (params: { user1Id?: string; user2Id?: string; startDate?: string; endDate?: string }) => 
    api.get('/admin/chats/export', { params, responseType: 'blob' }),
};

export default api;
