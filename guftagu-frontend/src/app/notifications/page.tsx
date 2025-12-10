'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Trash2, UserPlus, MessageSquare, Video, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { notificationsApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

interface Notification {
  _id: string;
  type: 'friend_request' | 'friend_accepted' | 'new_message' | 'system' | 'match';
  title: string;
  message: string;
  isRead: boolean;
  data?: {
    userId?: string;
    username?: string;
    profilePicture?: string;
    requestId?: string;
  };
  createdAt: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'friend_request':
    case 'friend_accepted':
      return <UserPlus className="w-5 h-5 text-violet-400" />;
    case 'new_message':
      return <MessageSquare className="w-5 h-5 text-blue-400" />;
    case 'match':
      return <Video className="w-5 h-5 text-emerald-400" />;
    default:
      return <Bell className="w-5 h-5 text-zinc-400" />;
  }
};

const getNotificationLink = (notification: Notification) => {
  switch (notification.type) {
    case 'friend_request':
      return '/friends/requests';
    case 'friend_accepted':
      return notification.data?.username ? `/profile/${notification.data.username}` : '/friends';
    case 'new_message':
      return notification.data?.userId ? `/messages/${notification.data.userId}` : '/messages';
    default:
      return null;
  }
};

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { refreshNotifications } = useNotifications();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchNotifications = async () => {
      try {
        const response = await notificationsApi.getNotifications({ limit: 50 });
        setNotifications(response.data.notifications);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, authLoading, router]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead([id]);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      refreshNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAsRead(undefined, true);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      refreshNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      refreshNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-zinc-400 mt-1">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">No notifications yet</p>
            <p className="text-sm text-zinc-500">
              We'll notify you when something important happens
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const link = getNotificationLink(notification);
              const content = (
                <div
                  className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
                    notification.isRead
                      ? 'bg-zinc-900/50 border border-zinc-800'
                      : 'bg-violet-900/20 border border-violet-800/50'
                  } ${link ? 'hover:bg-zinc-800/50 cursor-pointer' : ''}`}
                >
                  {/* Icon or Avatar */}
                  <div className="flex-shrink-0 mt-0.5">
                    {notification.data?.profilePicture ? (
                      <Avatar
                        src={notification.data.profilePicture}
                        alt={notification.data.username || 'User'}
                        size="md"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${notification.isRead ? 'text-zinc-200' : 'text-white'}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-zinc-400 mt-0.5">{notification.message}</p>
                    <p className="text-xs text-zinc-500 mt-2">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification._id)}
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );

              return link ? (
                <Link key={notification._id} href={link}>
                  {content}
                </Link>
              ) : (
                <div key={notification._id}>{content}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
