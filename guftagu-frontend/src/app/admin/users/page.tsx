'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, MoreVertical, Ban, Shield, Eye, ChevronLeft, ChevronRight, X, AlertTriangle, Download, MessageSquare, FileText, Users } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { formatDate, formatUserId } from '@/lib/utils';

interface AdminUser {
  _id: string;
  userId: string;
  email: string;
  username?: string;
  displayName?: string;
  profilePicture?: string;
  joinDate: string;
  totalMatches: number;
  friendsCount: number;
  isBanned: boolean;
  isAdmin: boolean;
  lastActive: string;
}

interface FriendWithMessages {
  _id: string;
  friendId: {
    _id: string;
    username: string;
    displayName: string;
    profilePicture?: string;
    userId: string;
    email: string;
    isOnline: boolean;
    lastActive: string;
  };
  friendsSince: string;
  messageCount: number;
  lastMessage: {
    content: string;
    timestamp: string;
    sentByUser: boolean;
  } | null;
}

interface ReportData {
  _id: string;
  reason: string;
  description?: string;
  status: string;
  actionTaken?: string;
  moderatorNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  reporterId?: { username: string; displayName: string; userId: string };
  reportedUserId?: { username: string; displayName: string; userId: string };
  reviewedBy?: { username: string };
}

interface UserDetailsData {
  user: AdminUser;
  stats: {
    reportsMade: number;
    reportsReceived: number;
    totalMatches: number;
    friendsCount: number;
  };
  friends: FriendWithMessages[];
  reportsMade: ReportData[];
  reportsReceived: ReportData[];
  banHistory: any[];
}

interface Message {
  _id: string;
  senderId: { _id: string; username: string; displayName: string; userId: string };
  receiverId: { _id: string; username: string; displayName: string; userId: string };
  content: string;
  timestamp: string;
  isRead: boolean;
}

// Ban reason options matching backend enum
const BAN_REASONS = [
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'multiple_reports', label: 'Multiple Reports' },
  { value: 'admin_discretion', label: 'Admin Discretion' },
  { value: 'underage', label: 'Underage User' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'terms_violation', label: 'Terms of Service Violation' },
  { value: 'other', label: 'Other' },
];

// Duration options in hours
const BAN_DURATIONS = [
  { value: 1, label: '1 Hour' },
  { value: 24, label: '1 Day' },
  { value: 72, label: '3 Days' },
  { value: 168, label: '7 Days' },
  { value: 720, label: '30 Days' },
  { value: 2160, label: '90 Days' },
];

export default function AdminUsersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  
  // Ban Modal State
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banTargetUser, setBanTargetUser] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banType, setBanType] = useState<'temporary' | 'permanent'>('temporary');
  const [banDuration, setBanDuration] = useState(24);
  const [banDescription, setBanDescription] = useState('');
  const [isBanning, setIsBanning] = useState(false);
  const [banError, setBanError] = useState('');
  
  // Unban Modal State
  const [unbanModalOpen, setUnbanModalOpen] = useState(false);
  const [unbanTargetUser, setUnbanTargetUser] = useState<AdminUser | null>(null);
  const [isUnbanning, setIsUnbanning] = useState(false);
  
  // User Details Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetailsData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'friends' | 'reports'>('overview');
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null);
  const [friendMessages, setFriendMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.isAdmin)) {
      router.push('/');
      return;
    }

    fetchUsers();
  }, [isAuthenticated, authLoading, user, router, pagination.page, statusFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
      });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  // Open ban modal
  const openBanModal = (targetUser: AdminUser) => {
    // Prevent admin from banning themselves
    if (targetUser._id === user?._id) {
      // Using browser alert here is acceptable for critical self-protection warning
      alert('You cannot ban yourself!');
      setActionMenuOpen(null);
      return;
    }
    
    setBanTargetUser(targetUser);
    setBanReason('');
    setBanType('temporary');
    setBanDuration(24);
    setBanDescription('');
    setBanError('');
    setBanModalOpen(true);
    setActionMenuOpen(null);
  };

  // Close ban modal
  const closeBanModal = () => {
    setBanModalOpen(false);
    setBanTargetUser(null);
    setBanError('');
  };

  // Submit ban
  const handleBanSubmit = async () => {
    if (!banTargetUser) return;
    
    if (!banReason) {
      setBanError('Please select a ban reason');
      return;
    }

    setIsBanning(true);
    setBanError('');

    try {
      await adminApi.banUser(banTargetUser._id, {
        reason: banReason,
        type: banType,
        duration: banType === 'temporary' ? banDuration : undefined,
        description: banDescription || undefined,
      });
      closeBanModal();
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to ban user:', error);
      setBanError(error.response?.data?.error || 'Failed to ban user. Please try again.');
    } finally {
      setIsBanning(false);
    }
  };

  // Open unban modal
  const openUnbanModal = (targetUser: AdminUser) => {
    setUnbanTargetUser(targetUser);
    setUnbanModalOpen(true);
    setActionMenuOpen(null);
  };

  // Close unban modal
  const closeUnbanModal = () => {
    setUnbanModalOpen(false);
    setUnbanTargetUser(null);
  };

  // Submit unban
  const handleUnbanUser = async () => {
    if (!unbanTargetUser) return;

    setIsUnbanning(true);
    try {
      await adminApi.unbanUser(unbanTargetUser._id);
      closeUnbanModal();
      fetchUsers();
    } catch (error) {
      console.error('Failed to unban user:', error);
    } finally {
      setIsUnbanning(false);
    }
  };

  // Open user details modal
  const openDetailsModal = async (userId: string) => {
    setSelectedUserId(userId);
    setDetailsModalOpen(true);
    setActiveTab('overview');
    setActiveFriendId(null);
    setFriendMessages([]);
    setActionMenuOpen(null);
    
    setIsLoadingDetails(true);
    try {
      const response = await adminApi.getUserDetails(userId);
      setUserDetails(response.data);
    } catch (error) {
      console.error('Failed to load user details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Close details modal
  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedUserId(null);
    setUserDetails(null);
    setActiveFriendId(null);
    setFriendMessages([]);
  };

  // Load messages for a specific friend
  const loadFriendMessages = async (friendId: string) => {
    if (!selectedUserId) return;
    
    setActiveFriendId(friendId);
    setIsLoadingMessages(true);
    try {
      const response = await adminApi.getUserMessages(selectedUserId, friendId);
      setFriendMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Export chat messages as text file
  const exportChatMessages = (friendName: string, messages: Message[]) => {
    if (!userDetails) return;
    
    const userName = userDetails.user.displayName || userDetails.user.username || 'User';
    let content = `Chat History between ${userName} and ${friendName}\n`;
    content += `Exported: ${new Date().toLocaleString()}\n`;
    content += `Total Messages: ${messages.length}\n`;
    content += `=`.repeat(60) + '\n\n';

    messages.forEach((msg) => {
      const sender = msg.senderId._id === userDetails.user._id 
        ? userName
        : friendName;
      const timestamp = new Date(msg.timestamp).toLocaleString();
      content += `[${timestamp}] ${sender}:\n${msg.content}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${userName}_${friendName}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-zinc-400 text-sm">Total: {pagination.total} users</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <Input
              placeholder="Search by username, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </form>
          <div className="flex gap-2">
            {['', 'active', 'banned'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Stats</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-zinc-800/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar src={u.profilePicture} alt={u.displayName || u.username || ''} size="md" />
                          <div>
                            <p className="font-medium text-white">{u.displayName || u.username || 'No name'}</p>
                            <p className="text-sm text-zinc-400">@{u.username || 'unnamed'}</p>
                            <p className="text-xs text-zinc-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-violet-400">{formatUserId(u.userId)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {u.isBanned && <Badge variant="error">Banned</Badge>}
                          {u.isAdmin && <Badge variant="primary">Admin</Badge>}
                          {!u.isBanned && !u.isAdmin && <Badge variant="success">Active</Badge>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                        {formatDate(u.joinDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                        <span>{u.totalMatches} matches</span>
                        <span className="mx-1">•</span>
                        <span>{u.friendsCount} friends</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === u._id ? null : u._id)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {actionMenuOpen === u._id && (
                            <div className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10">
                              <button
                                onClick={() => openDetailsModal(u._id)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              {u.isBanned ? (
                                <button
                                                                  onClick={() => openUnbanModal(u)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-emerald-400 hover:bg-zinc-700"
                                >
                                  <Shield className="w-4 h-4" />
                                  Unban User
                                </button>
                              ) : u._id === user?._id ? (
                                <div className="flex items-center gap-2 w-full px-4 py-2 text-sm text-zinc-500 cursor-not-allowed">
                                  <Ban className="w-4 h-4" />
                                  Cannot Ban Self
                                </div>
                              ) : (
                                <button
                                  onClick={() => openBanModal(u)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-zinc-700"
                                >
                                  <Ban className="w-4 h-4" />
                                  Ban User
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
              <p className="text-sm text-zinc-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ban User Modal */}
      {banModalOpen && banTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeBanModal}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-md mx-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Ban User</h2>
              </div>
              <button
                onClick={closeBanModal}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <Avatar src={banTargetUser.profilePicture} alt={banTargetUser.displayName || banTargetUser.username || ''} size="md" />
                <div>
                  <p className="font-medium text-white">{banTargetUser.displayName || banTargetUser.username || 'No name'}</p>
                  <p className="text-sm text-zinc-400">@{banTargetUser.username || 'unnamed'}</p>
                  <p className="text-xs text-zinc-500">{banTargetUser.email}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4">
              {/* Error Message */}
              {banError && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{banError}</p>
                </div>
              )}

              {/* Ban Reason */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Ban Reason <span className="text-red-400">*</span>
                </label>
                <select
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="">Select a reason...</option>
                  {BAN_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ban Type */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Ban Type</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setBanType('temporary')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      banType === 'temporary'
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                    }`}
                  >
                    Temporary
                  </button>
                  <button
                    type="button"
                    onClick={() => setBanType('permanent')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      banType === 'permanent'
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                    }`}
                  >
                    Permanent
                  </button>
                </div>
              </div>

              {/* Duration (only for temporary) */}
              {banType === 'temporary' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Duration</label>
                  <select
                    value={banDuration}
                    onChange={(e) => setBanDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    {BAN_DURATIONS.map((duration) => (
                      <option key={duration.value} value={duration.value}>
                        {duration.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Additional Notes <span className="text-zinc-500">(optional)</span>
                </label>
                <textarea
                  value={banDescription}
                  onChange={(e) => setBanDescription(e.target.value)}
                  placeholder="Add any additional details about this ban..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                />
                <p className="text-xs text-zinc-500 mt-1">{banDescription.length}/500 characters</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 border-t border-zinc-700">
              <Button
                variant="outline"
                className="flex-1"
                onClick={closeBanModal}
                disabled={isBanning}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 !bg-red-600 hover:!bg-red-700"
                onClick={handleBanSubmit}
                isLoading={isBanning}
              >
                {isBanning ? 'Banning...' : 'Ban User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unban Confirmation Modal */}
      {unbanModalOpen && unbanTargetUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600/20 rounded-lg">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Unban User</h3>
                  <p className="text-sm text-zinc-400">Restore user account access</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="bg-zinc-800/50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <Avatar 
                    src={unbanTargetUser.profilePicture} 
                    alt={unbanTargetUser.displayName || unbanTargetUser.username || ''} 
                    size="md" 
                  />
                  <div>
                    <p className="font-medium text-white">
                      {unbanTargetUser.displayName || unbanTargetUser.username || 'No name'}
                    </p>
                    <p className="text-sm text-zinc-400">@{unbanTargetUser.username || 'unnamed'}</p>
                    <p className="text-xs text-zinc-500 font-mono">
                      {formatUserId(unbanTargetUser.userId)}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed">
                Are you sure you want to unban this user? They will regain full access to their account and all features.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-zinc-700">
              <Button
                variant="outline"
                className="flex-1"
                onClick={closeUnbanModal}
                disabled={isUnbanning}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 !bg-emerald-600 hover:!bg-emerald-700"
                onClick={handleUnbanUser}
                isLoading={isUnbanning}
              >
                {isUnbanning ? 'Unbanning...' : 'Unban User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {detailsModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-6xl shadow-2xl my-8">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-700 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
              <h2 className="text-2xl font-bold text-white">User Details</h2>
              <button
                onClick={closeDetailsModal}
                className="p-2 hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {isLoadingDetails ? (
              <div className="p-12 flex items-center justify-center">
                <Spinner />
              </div>
            ) : userDetails ? (
              <>
                {/* User Info Header */}
                <div className="p-6 bg-zinc-800/50">
                  <div className="flex items-start gap-4">
                    <Avatar 
                      src={userDetails.user.profilePicture} 
                      alt={userDetails.user.displayName || userDetails.user.username || ''} 
                      size="lg" 
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white">
                        {userDetails.user.displayName || userDetails.user.username || 'No name'}
                      </h3>
                      <p className="text-zinc-400">@{userDetails.user.username || 'unnamed'}</p>
                      <p className="text-sm text-zinc-500 font-mono mt-1">
                        ID: {formatUserId(userDetails.user.userId)}
                      </p>
                      <p className="text-sm text-zinc-500">{userDetails.user.email}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {userDetails.user.isBanned && <Badge variant="error">Banned</Badge>}
                        {userDetails.user.isAdmin && <Badge variant="primary">Admin</Badge>}
                        {!userDetails.user.isBanned && !userDetails.user.isAdmin && <Badge variant="success">Active</Badge>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-zinc-700 px-6">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`px-4 py-3 border-b-2 transition ${
                        activeTab === 'overview'
                          ? 'border-blue-500 text-white'
                          : 'border-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('friends')}
                      className={`px-4 py-3 border-b-2 transition flex items-center gap-2 ${
                        activeTab === 'friends'
                          ? 'border-blue-500 text-white'
                          : 'border-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Friends ({userDetails.stats.friendsCount})
                    </button>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className={`px-4 py-3 border-b-2 transition flex items-center gap-2 ${
                        activeTab === 'reports'
                          ? 'border-blue-500 text-white'
                          : 'border-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Reports ({userDetails.stats.reportsMade + userDetails.stats.reportsReceived})
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-zinc-800/50 p-4 rounded-lg">
                          <p className="text-zinc-400 text-sm">Total Matches</p>
                          <p className="text-2xl font-bold text-white">{userDetails.stats.totalMatches}</p>
                        </div>
                        <div className="bg-zinc-800/50 p-4 rounded-lg">
                          <p className="text-zinc-400 text-sm">Friends</p>
                          <p className="text-2xl font-bold text-white">{userDetails.stats.friendsCount}</p>
                        </div>
                        <div className="bg-zinc-800/50 p-4 rounded-lg">
                          <p className="text-zinc-400 text-sm">Reports Made</p>
                          <p className="text-2xl font-bold text-white">{userDetails.stats.reportsMade}</p>
                        </div>
                        <div className="bg-zinc-800/50 p-4 rounded-lg">
                          <p className="text-zinc-400 text-sm">Reports Received</p>
                          <p className="text-2xl font-bold text-white">{userDetails.stats.reportsReceived}</p>
                        </div>
                      </div>

                      {/* Account Info */}
                      <div className="bg-zinc-800/30 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-3">Account Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-zinc-500">Joined</p>
                            <p className="text-sm text-zinc-300">{formatDate(userDetails.user.joinDate)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500">Last Active</p>
                            <p className="text-sm text-zinc-300">{formatDate(userDetails.user.lastActive)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Ban History */}
                      {userDetails.banHistory.length > 0 && (
                        <div className="bg-zinc-800/30 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-3">Ban History</h4>
                          <div className="space-y-2">
                            {userDetails.banHistory.map((ban: any) => (
                              <div key={ban._id} className="bg-zinc-800/50 p-3 rounded text-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-white font-medium">{ban.reason}</p>
                                    <p className="text-zinc-400 text-xs mt-1">{ban.description}</p>
                                  </div>
                                  <Badge variant={ban.isActive ? 'error' : 'default'}>
                                    {ban.isActive ? 'Active' : 'Expired'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">
                                  By {ban.bannedByUsername} • {formatDate(ban.createdAt)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'friends' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Friends List */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-white mb-3">Friends List</h4>
                        {userDetails.friends.length === 0 ? (
                          <p className="text-zinc-400 text-sm text-center py-8">No friends</p>
                        ) : (
                          userDetails.friends.map((friend) => (
                            <div
                              key={friend._id}
                              onClick={() => loadFriendMessages(friend.friendId._id)}
                              className={`bg-zinc-800/50 p-3 rounded-lg cursor-pointer hover:bg-zinc-800 transition ${
                                activeFriendId === friend.friendId._id ? 'ring-2 ring-blue-500' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar 
                                  src={friend.friendId.profilePicture} 
                                  alt={friend.friendId.displayName} 
                                  size="sm" 
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium text-sm truncate">
                                    {friend.friendId.displayName}
                                  </p>
                                  <p className="text-zinc-400 text-xs">@{friend.friendId.username}</p>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                                    <MessageSquare className="w-3 h-3" />
                                    {friend.messageCount}
                                  </div>
                                </div>
                              </div>
                              {friend.lastMessage && (
                                <p className="text-xs text-zinc-500 mt-2 truncate">
                                  {friend.lastMessage.sentByUser ? 'You: ' : ''}
                                  {friend.lastMessage.content}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Chat History */}
                      <div className="bg-zinc-800/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-white">Chat History</h4>
                          {activeFriendId && friendMessages.length > 0 && (
                            <button
                              onClick={() => {
                                const friend = userDetails.friends.find(f => f.friendId._id === activeFriendId);
                                if (friend) exportChatMessages(friend.friendId.displayName, friendMessages);
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition"
                            >
                              <Download className="w-3 h-3" />
                              Export
                            </button>
                          )}
                        </div>
                        {!activeFriendId ? (
                          <p className="text-zinc-400 text-sm text-center py-8">Select a friend to view messages</p>
                        ) : isLoadingMessages ? (
                          <div className="flex items-center justify-center py-8">
                            <Spinner />
                          </div>
                        ) : friendMessages.length === 0 ? (
                          <p className="text-zinc-400 text-sm text-center py-8">No messages</p>
                        ) : (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {friendMessages.map((msg) => (
                              <div
                                key={msg._id}
                                className={`p-2 rounded text-sm ${
                                  msg.senderId._id === userDetails.user._id
                                    ? 'bg-blue-600/20 ml-8'
                                    : 'bg-zinc-700/50 mr-8'
                                }`}
                              >
                                <p className="text-white">{msg.content}</p>
                                <p className="text-xs text-zinc-400 mt-1">
                                  {msg.senderId._id === userDetails.user._id ? 'User' : msg.senderId.displayName} • 
                                  {new Date(msg.timestamp).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'reports' && (
                    <div className="space-y-6">
                      {/* Reports Made */}
                      <div>
                        <h4 className="font-semibold text-white mb-3">Reports Made by User ({userDetails.stats.reportsMade})</h4>
                        {userDetails.reportsMade.length === 0 ? (
                          <p className="text-zinc-400 text-sm text-center py-4">No reports made</p>
                        ) : (
                          <div className="space-y-2">
                            {userDetails.reportsMade.map((report) => (
                              <div key={report._id} className="bg-zinc-800/50 p-4 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="text-white font-medium capitalize">{report.reason.replace(/_/g, ' ')}</p>
                                    <p className="text-xs text-zinc-500">Reported: @{report.reportedUserId?.username}</p>
                                  </div>
                                  <Badge variant={report.status === 'pending' ? 'warning' : 'default'}>
                                    {report.status}
                                  </Badge>
                                </div>
                                {report.description && (
                                  <p className="text-sm text-zinc-400 mt-2">{report.description}</p>
                                )}
                                <div className="flex justify-between items-center mt-3 text-xs text-zinc-500">
                                  <span>{formatDate(report.createdAt)}</span>
                                  {report.reviewedBy && (
                                    <span>Reviewed by {report.reviewedBy.username}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Reports Received */}
                      <div>
                        <h4 className="font-semibold text-white mb-3">Reports Against User ({userDetails.stats.reportsReceived})</h4>
                        {userDetails.reportsReceived.length === 0 ? (
                          <p className="text-zinc-400 text-sm text-center py-4">No reports against this user</p>
                        ) : (
                          <div className="space-y-2">
                            {userDetails.reportsReceived.map((report) => (
                              <div key={report._id} className="bg-zinc-800/50 p-4 rounded-lg border-l-4 border-red-500/50">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="text-white font-medium capitalize">{report.reason.replace(/_/g, ' ')}</p>
                                    <p className="text-xs text-zinc-500">Reported by: @{report.reporterId?.username}</p>
                                  </div>
                                  <Badge variant={report.status === 'action_taken' ? 'error' : report.status === 'pending' ? 'warning' : 'default'}>
                                    {report.status}
                                  </Badge>
                                </div>
                                {report.description && (
                                  <p className="text-sm text-zinc-400 mt-2">{report.description}</p>
                                )}
                                {report.moderatorNotes && (
                                  <div className="mt-2 p-2 bg-zinc-900/50 rounded">
                                    <p className="text-xs text-zinc-500">Moderator Notes:</p>
                                    <p className="text-sm text-zinc-300">{report.moderatorNotes}</p>
                                  </div>
                                )}
                                <div className="flex justify-between items-center mt-3 text-xs text-zinc-500">
                                  <span>{formatDate(report.createdAt)}</span>
                                  {report.reviewedBy && (
                                    <span>Reviewed by {report.reviewedBy.username}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-zinc-400">
                Failed to load user details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
