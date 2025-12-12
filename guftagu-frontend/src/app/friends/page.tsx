'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, UserPlus, MessageSquare, Shield, UserX } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { friendsApi, userApi } from '@/lib/api';
import { Friend } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface BlockedUser {
  _id: string;
  userId: string;
  username: string;
  displayName: string;
  profilePicture?: string;
}

export default function FriendsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'blocked'>('friends');
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [userToUnblock, setUserToUnblock] = useState<BlockedUser | null>(null);
  const [isUnblocking, setIsUnblocking] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchFriends = async () => {
      try {
        const response = await friendsApi.getFriends();
        setFriends(response.data.friends);
      } catch (error) {
        console.error('Failed to fetch friends:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchFriends();
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch blocked users when tab changes
  useEffect(() => {
    if (activeTab === 'blocked' && isAuthenticated) {
      fetchBlockedUsers();
    }
  }, [activeTab, isAuthenticated]);

  const fetchBlockedUsers = async () => {
    setIsLoadingBlocked(true);
    try {
      const response = await userApi.getBlockedUsers();
      setBlockedUsers(response.data.blockedUsers || []);
    } catch (error) {
      console.error('Failed to fetch blocked users:', error);
    } finally {
      setIsLoadingBlocked(false);
    }
  };

  const handleUnblock = async () => {
    if (!userToUnblock) return;
    
    setIsUnblocking(true);
    try {
      await userApi.unblockUser(userToUnblock._id);
      setBlockedUsers(prev => prev.filter(u => u._id !== userToUnblock._id));
      setShowUnblockModal(false);
      setUserToUnblock(null);
    } catch (error) {
      console.error('Failed to unblock user:', error);
    } finally {
      setIsUnblocking(false);
    }
  };

  // Listen for real-time online/offline status updates
  useEffect(() => {
    if (!socket) return;

    const handleFriendOnline = (data: any) => {
      setFriends((prev) =>
        prev.map((friend) =>
          friend._id === data.friendId
            ? { ...friend, isOnline: true }
            : friend
        )
      );
    };

    const handleFriendOffline = (data: any) => {
      setFriends((prev) =>
        prev.map((friend) =>
          friend._id === data.friendId
            ? { ...friend, isOnline: false, lastActive: new Date().toISOString() }
            : friend
        )
      );
    };

    socket.on('friend_online', handleFriendOnline);
    socket.on('friend_offline', handleFriendOffline);

    return () => {
      socket.off('friend_online', handleFriendOnline);
      socket.off('friend_offline', handleFriendOffline);
    };
  }, [socket]);

  const filteredFriends = friends.filter(
    (friend) =>
      friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Card Container */}
        <div className="bg-neutral-900/70 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Friends</h1>
            <Link href="/friends/find">
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Find Friends
              </Button>
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => setActiveTab('friends')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'friends' 
                  ? 'bg-white/10 text-white border border-white/20' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              All Friends ({friends.length})
            </button>
            <Link href="/friends/requests" className="px-4 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-lg font-medium transition-colors">
              Requests
            </Link>
            <button 
              onClick={() => setActiveTab('blocked')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'blocked' 
                  ? 'bg-white/10 text-white border border-white/20' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              Blocked ({blockedUsers.length})
            </button>
          </div>

          {/* Search - only show for friends tab */}
          {activeTab === 'friends' && (
            <div className="mb-6">
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5" />}
              />
            </div>
          )}

          {/* Friends List */}
          {activeTab === 'friends' && (
            <>
              {filteredFriends.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-400 mb-4">
                    {searchQuery ? 'No friends match your search' : 'You haven\'t added any friends yet'}
                  </p>
                  <Link href="/friends/find">
                    <Button>Find Friends</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend._id}
                      className="bg-neutral-800/40 border border-neutral-700/50 rounded-xl p-4 hover:bg-neutral-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar
                          src={friend.profilePicture}
                          alt={friend.displayName || friend.username}
                          size="lg"
                          isOnline={friend.isOnline}
                        />
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${friend.username}`} className="hover:underline">
                            <h3 className="font-medium text-white truncate">
                              {friend.displayName || friend.username}
                            </h3>
                          </Link>
                          <p className="text-sm text-neutral-400">@{friend.username}</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {friend.isOnline ? (
                              <span className="text-emerald-400">Online now</span>
                            ) : (
                              `Last seen ${formatRelativeTime(friend.lastActive)}`
                            )}
                          </p>
                        </div>
                        <Link href={`/messages/${friend._id}`}>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Blocked Users List */}
          {activeTab === 'blocked' && (
            <>
              {isLoadingBlocked ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner />
                </div>
              ) : blockedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-400 mb-2">No blocked users</p>
                  <p className="text-neutral-500 text-sm">Users you block will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {blockedUsers.map((user) => (
                    <div
                      key={user._id}
                      className="bg-neutral-800/40 border border-neutral-700/50 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar
                          src={user.profilePicture}
                          alt={user.displayName || user.username}
                          size="lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">
                            {user.displayName || user.username}
                          </h3>
                          <p className="text-sm text-neutral-400">@{user.username}</p>
                          <p className="text-xs text-neutral-500 mt-1">ID: {user.userId}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setUserToUnblock(user);
                            setShowUnblockModal(true);
                          }}
                          className="text-emerald-400 border-emerald-400/50 hover:bg-emerald-400/10"
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Unblock
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Unblock Confirmation Modal */}
      <ConfirmModal
        isOpen={showUnblockModal}
        onClose={() => {
          setShowUnblockModal(false);
          setUserToUnblock(null);
        }}
        onConfirm={handleUnblock}
        title="Unblock User"
        message={`Are you sure you want to unblock ${userToUnblock?.displayName || userToUnblock?.username}? They will be able to see your profile and send you friend requests again.`}
        confirmText={isUnblocking ? 'Unblocking...' : 'Unblock'}
        cancelText="Cancel"
        confirmVariant="primary"
        icon={
          <div className="p-3 rounded-xl bg-emerald-900/30">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
        }
      />
    </div>
  );
}
