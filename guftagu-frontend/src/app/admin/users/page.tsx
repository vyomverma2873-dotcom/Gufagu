'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, MoreVertical, Ban, Shield, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
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

export default function AdminUsersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

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

  const handleBanUser = async (userId: string) => {
    const reason = prompt('Enter ban reason:');
    if (!reason) return;

    try {
      await adminApi.banUser(userId, { reason, type: 'permanent' });
      fetchUsers();
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
    setActionMenuOpen(null);
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
                                  onClick={() => handleBanUser(u._id)}
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
    </div>
  );
}
