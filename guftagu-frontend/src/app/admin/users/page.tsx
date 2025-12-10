'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, MoreVertical, Ban, Shield, Eye, ChevronLeft, ChevronRight, X, AlertTriangle } from 'lucide-react';
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
  isPremium: boolean;
  isBanned: boolean;
  isAdmin: boolean;
  lastActive: string;
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

  const handleUnbanUser = async (userId: string) => {
    if (!confirm('Are you sure you want to unban this user?')) return;

    try {
      await adminApi.unbanUser(userId);
      fetchUsers();
    } catch (error) {
      console.error('Failed to unban user:', error);
    }
    setActionMenuOpen(null);
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
            {['', 'active', 'banned', 'premium'].map((status) => (
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
                          {u.isPremium && <Badge variant="warning">Premium</Badge>}
                          {u.isAdmin && <Badge variant="primary">Admin</Badge>}
                          {!u.isBanned && !u.isPremium && !u.isAdmin && <Badge variant="success">Active</Badge>}
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
                              <Link
                                href={`/profile/${u.username}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
                              >
                                <Eye className="w-4 h-4" />
                                View Profile
                              </Link>
                              {u.isBanned ? (
                                <button
                                  onClick={() => handleUnbanUser(u._id)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-emerald-400 hover:bg-zinc-700"
                                >
                                  <Shield className="w-4 h-4" />
                                  Unban User
                                </button>
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
    </div>
  );
}
