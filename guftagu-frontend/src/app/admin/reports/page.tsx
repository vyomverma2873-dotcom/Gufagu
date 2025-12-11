'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Shield, Mail, AlertCircle, X } from 'lucide-react';
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
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  actionTaken?: string;
  moderatorNotes?: string;
  reviewedBy?: {
    username: string;
    displayName?: string;
  };
  reviewedAt?: string;
  createdAt: string;
  timestamp: string;
}

const statusColors: Record<string, string> = {
  pending: 'warning',
  reviewed: 'primary',
  action_taken: 'success',
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
  const [updatingAction, setUpdatingAction] = useState<{ reportId: string; action: string } | null>(null);
  
  // Action Modal State
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'ban_user' | 'send_warning' | 'close_issue' | ''>('');
  const [actionNotes, setActionNotes] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Notification Modal State
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({ show: false, type: 'info', title: '', message: '' });
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.isAdmin)) {
      router.push('/');
      return;
    }

    fetchReports();
  }, [isAuthenticated, authLoading, user, router, pagination.page, statusFilter]);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleCloseModal();
      }
    };

    if (showActionModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionModal]);

  // Close notification on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotification({ ...notification, show: false });
      }
    };

    if (notification.show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notification.show]);

  // Helper to show notifications
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotification({ show: true, type, title, message });
  };

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
    setUpdatingAction({ reportId, action: status });
    try {
      await adminApi.updateReport(reportId, { status, action });
      await fetchReports();
      setSelectedReport(null);
    } catch (error) {
      console.error('Failed to update report:', error);
      showNotification('error', 'Update Failed', 'Failed to update report. Please try again.');
    } finally {
      setUpdatingAction(null);
    }
  };

  const handleOpenActionModal = (report: Report) => {
    setSelectedReport(report);
    setActionType('');
    setActionNotes('');
    setShowActionModal(true);
  };

  const handleCloseModal = () => {
    setShowActionModal(false);
    setSelectedReport(null);
    setActionType('');
    setActionNotes('');
  };

  const handleSubmitAction = async () => {
    if (!selectedReport || !actionType) {
      showNotification('warning', 'Action Required', 'Please select an action type before submitting.');
      return;
    }

    // CRITICAL: Prevent admin from banning themselves
    if (actionType === 'ban_user' && selectedReport.reportedUser._id === user?._id) {
      showNotification(
        'warning', 
        'Self-Ban Blocked', 
        'You cannot ban yourself! This action has been blocked for your protection.'
      );
      return;
    }

    setIsSubmittingAction(true);
    try {
      const response = await adminApi.updateReport(selectedReport._id, {
        status: 'action_taken',
        action: actionType,
        notes: actionNotes,
      });
      
      await fetchReports();
      handleCloseModal();
      
      const actionLabels = {
        ban_user: 'User Banned',
        send_warning: 'Warning Sent',
        close_issue: 'Issue Closed'
      };
      
      showNotification(
        'success',
        actionLabels[actionType] || 'Action Completed',
        'The action has been submitted successfully. The user has been notified via email.'
      );
    } catch (error: any) {
      console.error('Failed to submit action:', error);
      // Check if it's a specific ban error from backend
      if (error?.response?.data?.error) {
        showNotification('error', 'Action Failed', error.response.data.error);
      } else {
        const errorMsg = error?.response?.data?.error || 'Failed to submit action. Please try again.';
        showNotification('error', 'Action Failed', errorMsg);
      }
    } finally {
      setIsSubmittingAction(false);
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
          {['', 'pending', 'reviewed', 'action_taken', 'dismissed'].map((status) => (
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
              {status === '' ? 'All' : status === 'action_taken' ? 'Action Taken' : status.charAt(0).toUpperCase() + status.slice(1)}
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
                      <p className="text-xs text-zinc-500 font-mono">{formatUserId(report.reporter.userId)}</p>
                    </div>
                  </div>

                  <div className="text-2xl text-zinc-600">→</div>

                  {/* Reported User */}
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar src={report.reportedUser.profilePicture} alt={report.reportedUser.username} size="md" />
                    <div>
                      <p className="text-sm text-zinc-400">Reported</p>
                      <p className="font-medium text-white">{report.reportedUser.displayName || report.reportedUser.username}</p>
                      <p className="text-xs text-zinc-500 font-mono">{formatUserId(report.reportedUser.userId)}</p>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-4">
                    <Badge variant={statusColors[report.status] as any}>
                      {report.status === 'action_taken' ? 'Action Taken' : report.status}
                    </Badge>
                    <span className="text-sm text-zinc-500">{formatRelativeTime(report.createdAt)}</span>
                  </div>
                </div>

                {/* Report Details */}
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-zinc-400">Reason:</span>
                      <span className="ml-2 text-white capitalize">{report.reason.replace(/_/g, ' ')}</span>
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
                      onClick={() => handleUpdateReport(report._id, 'reviewed')}
                      isLoading={updatingAction?.reportId === report._id && updatingAction?.action === 'reviewed'}
                      disabled={updatingAction !== null && !(updatingAction?.reportId === report._id && updatingAction?.action === 'reviewed')}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Mark Reviewed
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenActionModal(report)}
                      disabled={updatingAction !== null}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Take Action
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateReport(report._id, 'dismissed')}
                      isLoading={updatingAction?.reportId === report._id && updatingAction?.action === 'dismissed'}
                      disabled={updatingAction !== null && !(updatingAction?.reportId === report._id && updatingAction?.action === 'dismissed')}
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

        {/* Action Modal */}
        {showActionModal && selectedReport && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div 
              ref={modalRef}
              className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-lg shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-600/20 rounded-lg">
                    <Shield className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Take Action on Report</h3>
                    <p className="text-sm text-neutral-400">Select action and notify user</p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Reported User Info */}
                <div className="bg-neutral-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      src={selectedReport.reportedUser.profilePicture} 
                      alt={selectedReport.reportedUser.username} 
                      size="md" 
                    />
                    <div>
                      <p className="text-sm text-neutral-400">Taking action against:</p>
                      <p className="font-medium text-white">
                        {selectedReport.reportedUser.displayName || selectedReport.reportedUser.username}
                      </p>
                      <p className="text-xs text-neutral-500 font-mono">
                        {formatUserId(selectedReport.reportedUser.userId)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-neutral-700">
                    <p className="text-xs text-neutral-400">Report Reason:</p>
                    <p className="text-sm text-white capitalize">
                      {selectedReport.reason.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>

                {/* Action Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Action Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as any)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option value="">Select an action...</option>
                    <option value="ban_user">🚫 Ban User</option>
                    <option value="send_warning">⚠️ Send Warning</option>
                    <option value="close_issue">✓ Close Issue (No Action)</option>
                  </select>
                </div>

                {/* Action Description */}
                {actionType && (
                  <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-3">
                    <div className="flex gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-300">
                        {actionType === 'ban_user' && (
                          <p>The user will be permanently banned and receive an email notification. They will not be able to access their account.</p>
                        )}
                        {actionType === 'send_warning' && (
                          <p>The user will receive a warning email about their behavior. This serves as a first notice before potential ban.</p>
                        )}
                        {actionType === 'close_issue' && (
                          <p>The report will be marked as resolved without taking action. A closure notification will be sent to the reported user.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Add any additional context or notes about this action..."
                    rows={3}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Email Notification Info */}
                <div className="flex items-start gap-2 bg-neutral-800/50 rounded-lg p-3">
                  <Mail className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-neutral-400">
                    An email notification will be automatically sent to{' '}
                    <span className="font-mono text-neutral-300">
                      {selectedReport.reportedUser.displayName || selectedReport.reportedUser.username}
                    </span>{' '}
                    informing them of this action.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-neutral-800 flex gap-3">
                <button
                  onClick={handleCloseModal}
                  disabled={isSubmittingAction}
                  className="flex-1 px-4 py-2.5 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAction}
                  disabled={!actionType || isSubmittingAction}
                  className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingAction ? (
                    <>
                      <Spinner />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit Action
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {notification.show && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div 
              ref={notificationRef}
              className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200"
            >
              {/* Modal Header */}
              <div className={`p-6 border-b ${
                notification.type === 'success' ? 'border-green-800/30 bg-green-950/20' :
                notification.type === 'error' ? 'border-red-800/30 bg-red-950/20' :
                notification.type === 'warning' ? 'border-yellow-800/30 bg-yellow-950/20' :
                'border-blue-800/30 bg-blue-950/20'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      notification.type === 'success' ? 'bg-green-600/20' :
                      notification.type === 'error' ? 'bg-red-600/20' :
                      notification.type === 'warning' ? 'bg-yellow-600/20' :
                      'bg-blue-600/20'
                    }`}>
                      {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                      {notification.type === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
                      {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                      {notification.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-400" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{notification.title}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotification({ ...notification, show: false })}
                    className="text-neutral-400 hover:text-white transition-colors p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <p className={`text-sm leading-relaxed ${
                  notification.type === 'success' ? 'text-green-100' :
                  notification.type === 'error' ? 'text-red-100' :
                  notification.type === 'warning' ? 'text-yellow-100' :
                  'text-blue-100'
                }`}>
                  {notification.message}
                </p>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-neutral-800 flex justify-end">
                <button
                  onClick={() => setNotification({ ...notification, show: false })}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                    notification.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                    notification.type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                    notification.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                    'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
