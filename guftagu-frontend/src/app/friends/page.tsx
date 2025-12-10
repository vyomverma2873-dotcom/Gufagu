'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, UserPlus, MessageSquare } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { friendsApi } from '@/lib/api';
import { Friend } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

export default function FriendsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Friends</h1>
          <Link href="/friends/find">
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Find Friends
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/friends" className="px-4 py-2 bg-violet-600/20 text-violet-400 rounded-lg font-medium">
            All Friends ({friends.length})
          </Link>
          <Link href="/friends/requests" className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg font-medium transition-colors">
            Requests
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </div>

        {/* Friends List */}
        {filteredFriends.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-4">
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
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
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
                    <p className="text-sm text-zinc-400">@{friend.username}</p>
                    <p className="text-xs text-zinc-500 mt-1">
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
      </div>
    </div>
  );
}
