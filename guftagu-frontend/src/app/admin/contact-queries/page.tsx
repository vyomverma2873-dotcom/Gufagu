'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Calendar, User, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface ContactQuery {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'resolved';
  adminComments?: string;
  resolvedBy?: {
    username: string;
    displayName: string;
  };
  resolvedAt?: string;
  createdAt: string;
}

export default function ContactQueriesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<ContactQuery | null>(null);
  const [adminComments, setAdminComments] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

  // Check admin access
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.email !== 'vyomverma2873@gmail.com')) {
      router.push('/');
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch queries
  const fetchQueries = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: pagination.page };
      if (statusFilter) params.status = statusFilter;

      const response = await adminApi.getContactQueries(params);
      setQueries(response.data.queries);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch contact queries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.email === 'vyomverma2873@gmail.com') {
      fetchQueries();
    }
  }, [isAuthenticated, user, statusFilter, pagination.page]);

  const handleResolve = async (queryId: string, status: string) => {
    try {
      setIsResolving(true);
      await adminApi.resolveContactQuery(queryId, {
        status,
        adminComments,
      });

      // Refresh queries
      await fetchQueries();
      setSelectedQuery(null);
      setAdminComments('');
    } catch (error: any) {
      console.error('Failed to resolve query:', error);
      alert(error.response?.data?.error || 'Failed to resolve query');
    } finally {
      setIsResolving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-blue-900/30 text-blue-400 border-blue-500/50',
      pending: 'bg-amber-900/30 text-amber-400 border-amber-500/50',
      resolved: 'bg-emerald-900/30 text-emerald-400 border-emerald-500/50',
    };

    const icons = {
      open: <AlertCircle className="w-3 h-3" />,
      pending: <Clock className="w-3 h-3" />,
      resolved: <CheckCircle className="w-3 h-3" />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Contact Queries</h1>
          <p className="text-zinc-400">Manage and respond to user support queries</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === '' ? 'bg-white text-zinc-900' : 'bg-zinc-800 text-white hover:bg-zinc-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'open' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-white hover:bg-zinc-700'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-white hover:bg-zinc-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'resolved' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-white hover:bg-zinc-700'
            }`}
          >
            Resolved
          </button>
        </div>

        {/* Queries List */}
        <div className="space-y-4">
          {queries.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
              <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No queries found</p>
            </div>
          ) : (
            queries.map((query) => (
              <div
                key={query._id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{query.subject}</h3>
                      {getStatusBadge(query.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {query.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {query.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(query.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                  <p className="text-white text-sm whitespace-pre-wrap">{query.message}</p>
                </div>

                {query.status === 'resolved' && query.adminComments && (
                  <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 mb-4">
                    <p className="text-xs text-emerald-400 font-medium mb-2">Admin Response:</p>
                    <p className="text-sm text-white whitespace-pre-wrap">{query.adminComments}</p>
                    {query.resolvedBy && (
                      <p className="text-xs text-zinc-500 mt-2">
                        Resolved by {query.resolvedBy.username} on {new Date(query.resolvedAt!).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {query.status !== 'resolved' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedQuery(query);
                        setAdminComments(query.adminComments || '');
                      }}
                    >
                      {query.status === 'open' ? 'Respond' : 'Resolve'}
                    </Button>
                    {query.status === 'open' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleResolve(query._id, 'pending')}
                      >
                        Mark as Pending
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-white">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Resolve Query</h2>

            <div className="mb-4">
              <p className="text-sm text-zinc-400 mb-1">From: {selectedQuery.name} ({selectedQuery.email})</p>
              <p className="text-sm text-zinc-400 mb-3">Subject: {selectedQuery.subject}</p>
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <p className="text-white text-sm whitespace-pre-wrap">{selectedQuery.message}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                Admin Response (will be sent via email)
              </label>
              <textarea
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                className="w-full h-32 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                placeholder="Enter your response to the user..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleResolve(selectedQuery._id, 'resolved')}
                isLoading={isResolving}
                disabled={isResolving}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Resolved & Send Email
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedQuery(null);
                  setAdminComments('');
                }}
                disabled={isResolving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
