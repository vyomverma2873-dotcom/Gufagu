'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, Smartphone, Tablet, Globe, Clock, MapPin, X, LogOut, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface Session {
  id: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  deviceName: string;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  deviceVendor: string | null;
  deviceModel: string | null;
  ipAddress: string;
  city: string | null;
  country: string | null;
  countryCode: string | null;
  location: string;
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
  isCurrent: boolean;
}

export default function SessionsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!isAuthenticated) return;
      
      try {
        setIsLoading(true);
        const response = await api.get('/sessions');
        setSessions(response.data.sessions || []);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch sessions:', err);
        setError(err.response?.data?.error || 'Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [isAuthenticated]);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-6 h-6" />;
      case 'tablet':
        return <Tablet className="w-6 h-6" />;
      case 'desktop':
      default:
        return <Monitor className="w-6 h-6" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevokingSessionId(sessionId);
      await api.delete(`/sessions/${sessionId}`);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (err: any) {
      console.error('Failed to revoke session:', err);
      setError(err.response?.data?.error || 'Failed to end session');
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleLogoutAll = async () => {
    try {
      setIsLoggingOutAll(true);
      await api.delete('/sessions/logout-all');
      await logout();
    } catch (err: any) {
      console.error('Failed to logout from all devices:', err);
      setError(err.response?.data?.error || 'Failed to logout from all devices');
    } finally {
      setIsLoggingOutAll(false);
      setShowLogoutAllModal(false);
    }
  };

  const otherSessionsCount = sessions.filter(s => !s.isCurrent).length;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Active Sessions</h1>
          <p className="text-neutral-400">
            Manage your active login sessions across all devices. You are currently logged in on {sessions.length} device{sessions.length !== 1 ? 's' : ''}.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Logout from all devices button */}
        {otherSessionsCount > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowLogoutAllModal(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600/10 border border-red-600/30 text-red-400 hover:bg-red-600/20 transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout from all other devices ({otherSessionsCount})</span>
            </button>
          </div>
        )}

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 text-center">
              <Monitor className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400">No active sessions found.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`bg-neutral-900/50 border rounded-2xl p-4 sm:p-6 transition-all ${
                  session.isCurrent
                    ? 'border-blue-500/50 bg-blue-500/5'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Device Icon */}
                  <div className={`p-3 rounded-xl ${session.isCurrent ? 'bg-blue-500/20 text-blue-400' : 'bg-neutral-800 text-neutral-400'}`}>
                    {getDeviceIcon(session.deviceType)}
                  </div>

                  {/* Session Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-white font-medium truncate">{session.deviceName}</h3>
                      {session.isCurrent && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-neutral-400">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{session.ipAddress} • {session.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>
                          Logged in {formatTimeAgo(session.loginTime)} • {session.isCurrent ? (
                            <span className="text-green-400">Active now</span>
                          ) : (
                            `Last active ${formatTimeAgo(session.lastActivity)}`
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Revoke Button */}
                  {!session.isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revokingSessionId === session.id}
                      className="p-2 rounded-xl text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="End this session"
                    >
                      {revokingSessionId === session.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <X className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Security Info */}
        <div className="mt-8 bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-white font-medium mb-2">Security Tips</h3>
          <ul className="text-sm text-neutral-400 space-y-2">
            <li>• If you see a session you don&apos;t recognize, end it immediately and change your password.</li>
            <li>• Sessions automatically expire after 30 days of inactivity.</li>
            <li>• A maximum of 10 active sessions are allowed per account.</li>
          </ul>
        </div>
      </div>

      {/* Logout from all devices confirmation modal */}
      {showLogoutAllModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-2">Logout from all other devices?</h3>
            <p className="text-neutral-400 mb-6">
              This will end {otherSessionsCount} other session{otherSessionsCount !== 1 ? 's' : ''}. You will remain logged in on this device.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutAllModal(false)}
                className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
                disabled={isLoggingOutAll}
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutAll}
                disabled={isLoggingOutAll}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoggingOutAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <span>Logout from all other devices</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
