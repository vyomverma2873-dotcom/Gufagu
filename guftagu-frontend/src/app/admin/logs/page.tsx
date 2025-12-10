'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Activity, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { formatDate, formatRelativeTime } from '@/lib/utils';

interface SystemLog {
  _id: string;
  action: string;
  performedBy?: {
    _id: string;
    username: string;
    displayName?: string;
  };
  targetUser?: {
    _id: string;
    username: string;
    displayName?: string;
  };
  details?: Record<string, any>;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  user_banned: 'error',
  user_unbanned: 'success',
  report_reviewed: 'primary',
  user_created: 'success',
  user_updated: 'default',
};

const actionLabels: Record<string, string> = {
  user_banned: 'User Banned',
  user_unbanned: 'User Unbanned',
  report_reviewed: 'Report Reviewed',
  user_created: 'User Created',
  user_updated: 'User Updated',
};

export default function AdminLogsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.isAdmin)) {
      router.push('/');
      return;
    }

    fetchLogs();
  }, [isAuthenticated, authLoading, user, router, pagination.page, actionFilter]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getLogs({
        page: pagination.page,
        limit: pagination.limit,
        action: actionFilter || undefined,
      });
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
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
            <h1 className="text-2xl font-bold text-white">System Logs</h1>
            <p className="text-zinc-400 text-sm">Administrative activity history</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['', 'user_banned', 'user_unbanned', 'report_reviewed'].map((action) => (
            <button
              key={action}
              onClick={() => {
                setActionFilter(action);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                actionFilter === action
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {action === '' ? 'All Actions' : actionLabels[action] || action}
            </button>
          ))}
        </div>

        {/* Logs List */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {logs.map((log) => (
                <div key={log._id} className="px-6 py-4 hover:bg-zinc-800/30">
                  <div className="flex items-start gap-4">
                    {/* Icon/Avatar */}
                    <div className="flex-shrink-0 mt-1">
                      {log.performedBy ? (
                        <Avatar
                          src={undefined}
                          alt={log.performedBy.username}
                          size="sm"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                          <Activity className="w-4 h-4 text-zinc-500" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={actionColors[log.action] as any || 'default'}>
                          {actionLabels[log.action] || log.action}
                        </Badge>
                        <span className="text-xs text-zinc-500">
                          {formatRelativeTime(log.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-zinc-300">
                        {log.performedBy && (
                          <span className="text-white font-medium">
                            {log.performedBy.displayName || log.performedBy.username}
                          </span>
                        )}
                        {log.performedBy && ' performed action'}
                        {log.targetUser && (
                          <>
                            {' on '}
                            <Link
                              href={`/profile/${log.targetUser.username}`}
                              className="text-violet-400 hover:underline"
                            >
                              {log.targetUser.displayName || log.targetUser.username}
                            </Link>
                          </>
                        )}
                      </p>

                      {/* Details */}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 text-xs text-zinc-500">
                          {Object.entries(log.details).map(([key, value]) => (
                            <span key={key} className="mr-4">
                              <span className="text-zinc-400">{key}:</span>{' '}
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-zinc-500 whitespace-nowrap">
                      {formatDate(log.createdAt, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
              <p className="text-sm text-zinc-400">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
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
    </div>
  );
}
