'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { formatDate, formatRelativeTime, formatUserId } from '@/lib/utils';

interface Ban {
  _id: string;
  user: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
    userId: string;
    email: string;
  };
  reason: string;
  type: 'temporary' | 'permanent';
  duration?: number;
  expiresAt?: string;
  bannedBy: {
    username: string;
    displayName?: string;
  };
  createdAt: string;
  isActive: boolean;
}

export default function AdminBansPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [bans, setBans] = useState<Ban[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [isUnbanning, setIsUnbanning] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.isAdmin)) {
      router.push('/');
      return;
    }

    fetchBans();
  }, [isAuthenticated, authLoading, user, router, pagination.page]);

  const fetchBans = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getBans({
        page: pagination.page,
        limit: pagination.limit,
      });
      setBans(response.data.bans);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch bans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnban = async (userId: string) => {
    if (!confirm('Are you sure you want to unban this user?')) return;

    setIsUnbanning(userId);
    try {
      await adminApi.unbanUser(userId);
      fetchBans();
    } catch (error) {
      console.error('Failed to unban user:', error);
    } finally {
      setIsUnbanning(null);
    }
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
            <h1 className="text-2xl font-bold text-white">Active Bans</h1>
            <p className="text-zinc-400 text-sm">Manage banned users</p>
          </div>
        </div>

        {/* Bans List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : bans.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
              <Shield className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No active bans</p>
            </div>
          ) : (
            bans.map((ban) => (
              <div
                key={ban._id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* User Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar src={ban.user.profilePicture} alt={ban.user.username} size="lg" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">
                          {ban.user.displayName || ban.user.username}
                        </h3>
                        <Badge variant={ban.type === 'permanent' ? 'error' : 'warning'}>
                          {ban.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-400">@{ban.user.username}</p>
                      <p className="text-xs text-zinc-500 font-mono">{formatUserId(ban.user.userId)}</p>
                    </div>
                  </div>

                  {/* Ban Details */}
                  <div className="flex-1">
                    <p className="text-sm text-zinc-400 mb-1">Reason</p>
                    <p className="text-white">{ban.reason}</p>
                  </div>

                  {/* Expiry */}
                  <div className="text-right">
                    <p className="text-sm text-zinc-400 mb-1">
                      {ban.type === 'permanent' ? 'Permanent Ban' : 'Expires'}
                    </p>
                    {ban.expiresAt && (
                      <p className="text-white">{formatDate(ban.expiresAt)}</p>
                    )}
                    <p className="text-xs text-zinc-500 mt-1">
                      Banned {formatRelativeTime(ban.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnban(ban.user._id)}
                    isLoading={isUnbanning === ban.user._id}
                  >
                    Unban
                  </Button>
                </div>

                {/* Banned by */}
                <div className="mt-4 pt-4 border-t border-zinc-800 text-sm text-zinc-400">
                  Banned by {ban.bannedBy.displayName || ban.bannedBy.username}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-zinc-400">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
