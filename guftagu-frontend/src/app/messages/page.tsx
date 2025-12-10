'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MessageSquare } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { messagesApi } from '@/lib/api';
import { formatRelativeTime, truncateText } from '@/lib/utils';

interface Conversation {
  _id?: string;
  friend: {
    _id: string;
    userId?: string;
    username?: string;
    displayName?: string;
    profilePicture?: string;
    isOnline?: boolean;
  };
  lastMessage?: {
    _id?: string;
    content: string;
    timestamp?: string;
    isOwn?: boolean;
    isRead?: boolean;
  };
  unreadCount: number;
}

export default function MessagesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchConversations = async () => {
      try {
        const response = await messagesApi.getConversations();
        setConversations(response.data.conversations);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, authLoading, router]);

  // Listen for new messages and online/offline status updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      // Handle both dm_receive and new_dm events
      const senderId = data.from?.userId || data.senderId;
      const content = data.message || data.content;
      const timestamp = data.timestamp || data.createdAt || new Date().toISOString();

      setConversations((prev) => {
        const existingIndex = prev.findIndex(
          (c) => c.friend?._id === senderId
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: {
              content: content,
              timestamp: timestamp,
              isOwn: false,
              isRead: false,
            },
            unreadCount: updated[existingIndex].unreadCount + 1,
          };
          // Move to top
          const [item] = updated.splice(existingIndex, 1);
          updated.unshift(item);
          return updated;
        }

        return prev;
      });
    };

    // Handle friend online status
    const handleFriendOnline = (data: any) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.friend?._id === data.friendId
            ? { ...conv, friend: { ...conv.friend, isOnline: true } }
            : conv
        )
      );
    };

    // Handle friend offline status
    const handleFriendOffline = (data: any) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.friend?._id === data.friendId
            ? { ...conv, friend: { ...conv.friend, isOnline: false } }
            : conv
        )
      );
    };

    socket.on('dm_receive', handleNewMessage);
    socket.on('new_dm', handleNewMessage);
    socket.on('friend_online', handleFriendOnline);
    socket.on('friend_offline', handleFriendOffline);

    return () => {
      socket.off('dm_receive', handleNewMessage);
      socket.off('new_dm', handleNewMessage);
      socket.off('friend_online', handleFriendOnline);
      socket.off('friend_offline', handleFriendOffline);
    };
  }, [socket]);

  const filteredConversations = conversations.filter((conv) => {
    if (!conv.friend) return false;
    const username = conv.friend.username?.toLowerCase() || '';
    const displayName = conv.friend.displayName?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return username.includes(query) || displayName.includes(query);
  });

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
            <h1 className="text-2xl font-bold text-white">Messages</h1>
          </div>

          {/* Search */}
          <div className="mb-6">
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>

          {/* Conversations List */}
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800/50 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-neutral-500" />
              </div>
              <p className="text-neutral-400 mb-2">
                {searchQuery ? 'No conversations match your search' : 'No messages yet'}
              </p>
              <p className="text-sm text-neutral-500">
                Start a conversation with a friend
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conv) => {
                if (!conv.friend) return null;
                return (
                  <Link
                    key={conv.friend._id}
                    href={`/messages/${conv.friend._id}`}
                    className="block"
                  >
                    <div className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                      conv.unreadCount > 0 
                        ? 'bg-white/5 border border-white/20 hover:bg-white/10' 
                        : 'bg-neutral-800/40 border border-neutral-700/50 hover:bg-neutral-800/60'
                    }`}>
                      <Avatar
                        src={conv.friend.profilePicture}
                        alt={conv.friend.displayName || conv.friend.username || 'User'}
                        size="lg"
                        isOnline={conv.friend.isOnline}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-medium truncate ${
                            conv.unreadCount > 0 ? 'text-white' : 'text-neutral-200'
                          }`}>
                            {conv.friend.displayName || conv.friend.username || 'Unknown'}
                          </h3>
                          {conv.lastMessage?.timestamp && (
                            <span className="text-xs text-neutral-500 whitespace-nowrap ml-2">
                              {formatRelativeTime(conv.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${
                            conv.unreadCount > 0 ? 'text-neutral-300' : 'text-neutral-500'
                          }`}>
                            {conv.lastMessage?.isOwn && (
                              <span className="text-neutral-500">You: </span>
                            )}
                            {conv.lastMessage ? truncateText(conv.lastMessage.content, 50) : 'No messages yet'}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="ml-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-white text-neutral-900 text-xs font-semibold rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
