'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, MessageSquare, Users, Calendar, Check, X, Clock } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { userApi, friendsApi } from '@/lib/api';
import { User, FriendshipStatus } from '@/types';
import { formatDate } from '@/lib/utils';

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const username = params.username as string;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await userApi.getUserByUsername(username);
        setUser(response.data.user);

        // Check friendship status if logged in
        if (isAuthenticated && response.data.user._id !== currentUser?._id) {
          const statusResponse = await friendsApi.checkFriendship(response.data.user._id);
          // Transform API response to FriendshipStatus format
          const apiData = statusResponse.data;
          if (apiData.isFriend) {
            setFriendshipStatus({ status: 'friends' });
          } else if (apiData.pendingRequest) {
            setFriendshipStatus({
              status: 'pending',
              direction: apiData.pendingRequest.isSender ? 'sent' : 'received',
              requestId: apiData.pendingRequest._id
            });
          } else {
            setFriendshipStatus({ status: 'none' });
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'User not found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [username, isAuthenticated, currentUser]);

  const handleSendRequest = async () => {
    if (!user || !user.username) return;
    setIsActionLoading(true);
    try {
      await friendsApi.sendRequest(user.username);
      setFriendshipStatus({ 
        status: 'pending', 
        direction: 'sent',
        requestId: '' 
      });
    } catch (err: any) {
      console.error('Failed to send friend request:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!friendshipStatus?.requestId) return;
    setIsActionLoading(true);
    try {
      await friendsApi.acceptRequest(friendshipStatus.requestId);
      setFriendshipStatus({ status: 'friends' });
    } catch (err: any) {
      console.error('Failed to accept friend request:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!friendshipStatus?.requestId) return;
    setIsActionLoading(true);
    try {
      await friendsApi.cancelRequest(friendshipStatus.requestId);
      setFriendshipStatus(null);
    } catch (err: any) {
      console.error('Failed to cancel friend request:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
        <p className="text-zinc-400 mb-4">{error || 'User not found'}</p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === user._id;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Profile Header */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-zinc-800 to-zinc-700" />
          
          {/* Profile info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
              <Avatar
                src={user.profilePicture}
                alt={user.displayName || user.username || ''}
                size="xl"
                className="w-24 h-24 border-4 border-zinc-900"
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-white">
                    {user.displayName || user.username}
                  </h1>
                </div>
                <p className="text-zinc-400">@{user.username}</p>
              </div>

              {/* Action buttons */}
              {isAuthenticated && !isOwnProfile && (
                <div className="flex items-center gap-2">
                  {friendshipStatus?.status === 'friends' ? (
                    <>
                      <Link href={`/messages/${user._id}`}>
                        <Button>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </Link>
                    </>
                  ) : friendshipStatus?.status === 'pending' ? (
                    friendshipStatus.direction === 'sent' ? (
                      <Button 
                        variant="outline" 
                        onClick={handleCancelRequest}
                        isLoading={isActionLoading}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Pending
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={handleAcceptRequest} isLoading={isActionLoading}>
                          <Check className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                        <Button variant="outline" onClick={handleCancelRequest}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  ) : (
                    <Button onClick={handleSendRequest} isLoading={isActionLoading}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </Button>
                  )}
                </div>
              )}

              {isOwnProfile && (
                <Link href="/profile/edit">
                  <Button variant="outline" size="sm">
                    Edit Profile
                  </Button>
                </Link>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="mt-6 text-zinc-300">{user.bio}</p>
            )}

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-800/50 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-zinc-400" />
                  <span className="text-2xl font-bold text-white">{user.friendsCount || 0}</span>
                </div>
                <p className="text-sm text-zinc-400">Friends</p>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                </div>
                <p className="text-sm text-zinc-400">
                  Joined {formatDate(user.joinDate, { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Interests */}
            {user.interests && user.interests.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest, index) => (
                    <Badge key={index} variant="default">{interest}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
