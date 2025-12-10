'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { formatRelativeTime, formatUserId } from '@/lib/utils';

interface Report {
  _id: string;
  reporter: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
    userId: string;
  };
  reportedUser: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
    userId: string;
  };
  type: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  actionTaken?: string;
  reviewedBy?: {
    username: string;
    displayName?: string;
  };
  reviewedAt?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'warning',
  reviewed: 'primary',
  resolved: 'success',
  dismissed: 'default',
};

export default function AdminReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.isAdmin)) {
      router.push('/');
      return;
    }

    fetchReports();
  }, [isAuthenticated, authLoading, user, router, pagination.page, statusFilter]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getReports({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter || undefined,
      });
      setReports(response.data.reports);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReport = async (reportId: string, status: string, action?: string) => {
    setIsUpdating(true);
    try {
      await adminApi.updateReport(reportId, { status, action });
      fetchReports();
      setSelectedReport(null);
    } catch (error) {
      console.error('Failed to update report:', error);
    } finally {
      setIsUpdating(false);
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
            <h1 className="text-2xl font-bold text-white">Reports</h1>
            <p className="text-zinc-400 text-sm">Review and manage user reports</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['', 'pending', 'reviewed', 'resolved', 'dismissed'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No reports found</p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report._id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Reporter */}
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar src={report.reporter.profilePicture} alt={report.reporter.username} size="md" />
                    <div>
                      <p className="text-sm text-zinc-400">Reported by</p>
                      <p className="font-medium text-white">{report.reporter.displayName || report.reporter.username}</p>
                    </div>
                  </div>

                  <div className="text-2xl text-zinc-600">→</div>

                  {/* Reported User */}
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar src={report.reportedUser.profilePicture} alt={report.reportedUser.username} size="md" />
                    <div>
                      <p className="text-sm text-zinc-400">Reported</p>
                      <p className="font-medium text-white">{report.reportedUser.displayName || report.reportedUser.username}</p>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-4">
                    <Badge variant={statusColors[report.status] as any}>{report.status}</Badge>
                    <span className="text-sm text-zinc-500">{formatRelativeTime(report.createdAt)}</span>
                  </div>
                </div>

                {/* Report Details */}
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-zinc-400">Type:</span>
                      <span className="ml-2 text-white capitalize">{report.type}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Reason:</span>
                      <span className="ml-2 text-white">{report.reason}</span>
                    </div>
                  </div>
                  {report.description && (
                    <p className="mt-2 text-zinc-300">{report.description}</p>
                  )}
                </div>

                {/* Actions */}
                {report.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateReport(report._id, 'resolved', 'warning_issued')}
                      isLoading={isUpdating}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateReport(report._id, 'dismissed')}
                      isLoading={isUpdating}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Dismiss
                    </Button>
                    <Link href={`/admin/users?search=${report.reportedUser.userId}`}>
                      <Button size="sm" variant="ghost">
                        View User
                      </Button>
                    </Link>
                  </div>
                )}

                {report.reviewedBy && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 text-sm text-zinc-400">
                    Reviewed by {report.reviewedBy.displayName || report.reviewedBy.username}
                    {report.actionTaken && <span className="mx-2">•</span>}
                    {report.actionTaken && <span>Action: {report.actionTaken}</span>}
                  </div>
                )}
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
