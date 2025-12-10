'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { friendsApi } from '@/lib/api';
import { FriendRequest } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

export default function FriendRequestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchRequests = async () => {
      try {
        const [received, sent] = await Promise.all([
          friendsApi.getRequests('received'),
          friendsApi.getRequests('sent'),
        ]);
        setReceivedRequests(received.data.requests);
        setSentRequests(sent.data.requests);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchRequests();
    }
  }, [isAuthenticated, authLoading, router]);

  const handleAccept = async (requestId: string) => {
    setProcessingIds((prev) => new Set(prev).add(requestId));
    try {
      await friendsApi.acceptRequest(requestId);
      setReceivedRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (error) {
      console.error('Failed to accept request:', error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingIds((prev) => new Set(prev).add(requestId));
    try {
      await friendsApi.rejectRequest(requestId);
      setReceivedRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleCancel = async (requestId: string) => {
    setProcessingIds((prev) => new Set(prev).add(requestId));
    try {
      await friendsApi.cancelRequest(requestId);
      setSentRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (error) {
      console.error('Failed to cancel request:', error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const currentRequests = activeTab === 'received' ? receivedRequests : sentRequests;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/friends" className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Friend Requests</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'received'
                ? 'bg-violet-600/20 text-violet-400'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            Received ({receivedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-violet-600/20 text-violet-400'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            Sent ({sentRequests.length})
          </button>
        </div>

        {/* Requests List */}
        {currentRequests.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <p className="text-zinc-400">
              {activeTab === 'received'
                ? 'No pending friend requests'
                : 'No sent requests'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentRequests.map((request) => (
              <div
                key={request._id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
              >
                <div className="flex items-center gap-4">
                  <Avatar
                    src={request.user.profilePicture}
                    alt={request.user.displayName || request.user.username}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${request.user.username}`} className="hover:underline">
                      <h3 className="font-medium text-white truncate">
                        {request.user.displayName || request.user.username}
                      </h3>
                    </Link>
                    <p className="text-sm text-zinc-400">@{request.user.username}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {formatRelativeTime(request.sentAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeTab === 'received' ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(request._id)}
                          isLoading={processingIds.has(request._id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(request._id)}
                          disabled={processingIds.has(request._id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(request._id)}
                        isLoading={processingIds.has(request._id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
                {request.message && (
                  <p className="mt-3 text-sm text-zinc-300 bg-zinc-800/50 rounded-lg p-3">
                    "{request.message}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
