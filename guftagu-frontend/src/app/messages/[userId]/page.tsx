'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, MoreVertical, Phone, Video, PhoneOff, X, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, Check, CheckCheck } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { messagesApi, userApi } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';

interface Message {
  _id: string;
  senderId?: string;
  receiverId?: string;
  content: string;
  isRead?: boolean;
  isDelivered?: boolean;
  isOwn?: boolean;
  createdAt?: string;
  timestamp?: string;
  isNew?: boolean; // For animation
  type?: 'message' | 'call';
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface CallEntry {
  _id: string;
  type: 'call';
  callId: string;
  callType: 'voice' | 'video';
  status: 'answered' | 'declined' | 'missed' | 'ended';
  timestamp: string;
  duration: number;
  isOwn: boolean;
  endReason?: string;
}

type TimelineItem = Message | CallEntry;

interface ChatUser {
  _id: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  isOnline?: boolean;
  lastActive?: string;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { socket, callStatus: globalCallStatus, endCall: globalEndCall, startCall } = useSocket();
  
  const userId = params.userId as string;
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  // Hide footer when chat page is active
  useEffect(() => {
    document.body.classList.add('chat-active');
    return () => {
      document.body.classList.remove('chat-active');
    };
  }, []);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Local call state for this conversation
  const [localCallType, setLocalCallType] = useState<'voice' | 'video' | null>(null);
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);
    
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        if (smooth) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        } else {
          container.scrollTop = container.scrollHeight;
        }
      }
      // Also scroll the end ref into view as backup
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      }
    });
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch user info using MongoDB ObjectId
        const userResponse = await userApi.getUserByObjectId(userId);
        setChatUser(userResponse.data.user);

        // Fetch messages and calls
        const messagesResponse = await messagesApi.getMessages(userId);
        setMessages(messagesResponse.data.messages);
        setTimeline(messagesResponse.data.timeline || messagesResponse.data.messages);

        // Mark messages as read via REST and socket
        await messagesApi.markAsRead(undefined, userId);
      } catch (error) {
        console.error('Failed to fetch conversation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && userId) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, userId, router]);

  // Scroll to bottom when timeline changes
  const initialScrollDone = useRef(false);
  useEffect(() => {
    if (timeline.length > 0 && !isLoading) {
      // Use instant scroll on first load, smooth scroll for subsequent updates
      if (!initialScrollDone.current) {
        // Add a small delay to ensure DOM is fully rendered after data load
        const timer = setTimeout(() => {
          scrollToBottom(false); // instant
          initialScrollDone.current = true;
        }, 100);
        return () => clearTimeout(timer);
      } else {
        scrollToBottom(true); // smooth
      }
    }
  }, [timeline, scrollToBottom, isLoading]);

  // Force scroll to bottom after initial render is complete
  useEffect(() => {
    if (!isLoading && timeline.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading]); // Only run when loading state changes

  // Emit read receipts when conversation is opened and socket is ready
  useEffect(() => {
    if (socket && !isLoading && userId) {
      socket.emit('dm_mark_read', { fromUserId: userId });
    }
  }, [socket, isLoading, userId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !user) return;

    console.log('[Chat Socket] Setting up listeners, userId:', userId, 'socket connected:', socket.connected);

    // Listen for new messages - backend emits 'dm_receive'
    const handleNewMessage = (data: any) => {
      console.log('[Chat Socket] Received dm_receive:', data);
      console.log('[Chat Socket] Checking: from.userId:', data.from?.userId, 'conversationId:', data.conversationId, 'current userId:', userId);
      
      // Check if message is from current chat user (compare as strings)
      const fromUserId = String(data.from?.userId || '');
      const conversationId = String(data.conversationId || '');
      const currentUserId = String(userId);
      
      if (fromUserId === currentUserId || conversationId === currentUserId) {
        console.log('[Chat Socket] Message matches, adding to state');
        const newMsg = {
          _id: data.messageId || `msg-${Date.now()}`,
          senderId: data.from?.userId,
          content: data.message || data.content,
          isOwn: false,
          isRead: true,
          isNew: true, // For animation
          timestamp: data.timestamp || new Date().toISOString(),
        };
        
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some(m => m._id === newMsg._id)) {
            console.log('[Chat Socket] Duplicate message, skipping');
            return prev;
          }
          return [...prev, newMsg];
        });
        
        // Also update timeline
        setTimeline((prev) => {
          if (prev.some(m => m._id === newMsg._id)) {
            return prev;
          }
          return [...prev, newMsg as TimelineItem];
        });
        
        // Remove animation flag after animation completes
        setTimeout(() => {
          setMessages((prev) => 
            prev.map(m => m._id === newMsg._id ? { ...m, isNew: false } : m)
          );
        }, 500);
        
        // Mark as read via REST and socket for real-time read receipts
        if (data.messageId) {
          messagesApi.markAsRead([data.messageId]);
          socket?.emit('dm_mark_read', { messageIds: [data.messageId], fromUserId: data.from?.userId });
        }
      }
    };

    // Listen for typing indicators - backend emits 'dm_typing_start'
    const handleTypingStart = (data: any) => {
      if (data.from?.userId === userId) {
        setIsTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    };

    const handleTypingStop = (data: any) => {
      if (data.from?.userId === userId) {
        setIsTyping(false);
      }
    };

    // Listen for friend online/offline status
    const handleFriendOnline = (data: any) => {
      if (data.friendId === userId) {
        setChatUser(prev => prev ? { ...prev, isOnline: true } : null);
      }
    };

    const handleFriendOffline = (data: any) => {
      if (data.friendId === userId) {
        setChatUser(prev => prev ? { ...prev, isOnline: false } : null);
      }
    };

    // Listen for message delivered status
    const handleMessageDelivered = (data: any) => {
      console.log('[Chat Socket] Message delivered:', data);
      if (data.toUserId === userId) {
        setMessages((prev) => 
          prev.map(m => m._id === data.messageId ? { ...m, isDelivered: true, status: 'delivered' } : m)
        );
        setTimeline((prev) => 
          prev.map(item => item._id === data.messageId ? { ...item, isDelivered: true, status: 'delivered' } as TimelineItem : item)
        );
      }
    };

    // Listen for message read status
    const handleMessageRead = (data: any) => {
      console.log('[Chat Socket] Messages read:', data);
      if (data.readBy === userId) {
        // Update all messages from this user as read
        setMessages((prev) => 
          prev.map(m => m.isOwn ? { ...m, isRead: true, status: 'read' } : m)
        );
        setTimeline((prev) => 
          prev.map(item => {
            if (item.type !== 'call' && (item as Message).isOwn) {
              return { ...item, isRead: true, status: 'read' } as TimelineItem;
            }
            return item;
          })
        );
      }
    };

    // Register all event listeners
    console.log('[Chat Socket] Registering event listeners for socket:', socket.id);
    socket.on('dm_receive', handleNewMessage);
    socket.on('new_dm', handleNewMessage); // fallback
    socket.on('dm_typing_start', handleTypingStart);
    socket.on('dm_typing_stop', handleTypingStop);
    socket.on('typing', handleTypingStart); // fallback
    socket.on('stop_typing', handleTypingStop); // fallback
    socket.on('friend_online', handleFriendOnline);
    socket.on('friend_offline', handleFriendOffline);
    socket.on('dm_delivered', handleMessageDelivered);
    socket.on('dm_read', handleMessageRead);

    // Note: Call events are now handled globally in SocketContext

    return () => {
      socket.off('dm_receive', handleNewMessage);
      socket.off('new_dm', handleNewMessage);
      socket.off('dm_typing_start', handleTypingStart);
      socket.off('dm_typing_stop', handleTypingStop);
      socket.off('typing', handleTypingStart);
      socket.off('stop_typing', handleTypingStop);
      socket.off('friend_online', handleFriendOnline);
      socket.off('friend_offline', handleFriendOffline);
      socket.off('dm_delivered', handleMessageDelivered);
      socket.off('dm_read', handleMessageRead);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, user, userId]);

  const handleStartCall = (type: 'voice' | 'video') => {
    if (!chatUser) {
      console.log('[Call] Cannot start - no chat user');
      return;
    }
    if (!chatUser.isOnline) {
      alert('User is offline');
      return;
    }
    
    console.log('[Call] Starting', type, 'call to', chatUser.username);
    
    // Use the new startCall from SocketContext - shows calling screen immediately
    startCall(
      chatUser._id,
      { username: chatUser.displayName || chatUser.username, profilePicture: chatUser.profilePicture },
      type
    );
  };

  const handleEndCallLocal = () => {
    setLocalCallType(null);
    setIsInitiatingCall(false);
    globalEndCall();
  };
  
    const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      senderId: user!._id,
      receiverId: userId,
      content: newMessage.trim(),
      isOwn: true,
      isRead: false,
      isDelivered: false,
      isNew: true,
      status: 'sending',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setTimeline((prev) => [...prev, tempMessage as TimelineItem]);
    setNewMessage('');
    setIsSending(true);

    // Stop typing indicator
    socket?.emit('dm_typing_stop', { to: userId });

    try {
      const response = await messagesApi.sendMessage(userId, tempMessage.content);
      
      // Replace temp message with actual message, set status to 'sent'
      setMessages((prev) => 
        prev.map((msg) => 
          msg._id === tempMessage._id 
            ? { ...msg, _id: response.data.message._id, isNew: false, status: 'sent' }
            : msg
        )
      );
      setTimeline((prev) => 
        prev.map((item) => 
          item._id === tempMessage._id 
            ? { ...item, _id: response.data.message._id, isNew: false, status: 'sent' } as TimelineItem
            : item
        )
      );
      // Note: REST API already handles real-time delivery via socket
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
      setTimeline((prev) => prev.filter((item) => item._id !== tempMessage._id));
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    // Emit typing indicator
    socket?.emit('dm_typing_start', { to: userId });
    
    // Clear previous timeout and set new one to stop typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('dm_typing_stop', { to: userId });
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to format call duration
  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to get call status text and icon
  const getCallDisplay = (call: CallEntry) => {
    const isOutgoing = call.isOwn;
    let icon = isOutgoing ? <PhoneOutgoing className="w-4 h-4" /> : <PhoneIncoming className="w-4 h-4" />;
    let text = '';
    let statusColor = 'text-neutral-400';
    
    switch (call.status) {
      case 'answered':
      case 'ended':
        text = isOutgoing ? 'Outgoing call' : 'Incoming call';
        statusColor = 'text-emerald-400';
        break;
      case 'missed':
        icon = <PhoneMissed className="w-4 h-4" />;
        text = isOutgoing ? 'Call not answered' : 'Missed call';
        statusColor = 'text-red-400';
        break;
      case 'declined':
        icon = <PhoneMissed className="w-4 h-4" />;
        text = isOutgoing ? 'Call declined' : 'You declined';
        statusColor = 'text-amber-400';
        break;
      default:
        text = `${isOutgoing ? 'Outgoing' : 'Incoming'} ${call.callType} call`;
    }
    
    return { icon, text, statusColor };
  };

  // Group timeline by date
  const groupedTimeline = timeline.reduce((groups: { [key: string]: TimelineItem[] }, item) => {
    const itemDate = item.timestamp || (item as Message).createdAt || new Date().toISOString();
    const date = formatDate(itemDate, { month: 'long', day: 'numeric', year: 'numeric' });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});

  // Group messages by date (keep for backward compatibility)
  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const msgDate = message.timestamp || message.createdAt || new Date().toISOString();
    const date = formatDate(msgDate, { month: 'long', day: 'numeric', year: 'numeric' });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen pt-24 sm:pt-28 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!chatUser) {
    return (
      <div className="min-h-screen pt-24 sm:pt-28 flex flex-col items-center justify-center">
        <p className="text-neutral-400 mb-4">User not found</p>
        <Link href="/messages">
          <Button>Back to Messages</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pt-[88px] sm:pt-24 flex flex-col">
      {/* Note: Call overlays are now rendered globally via IncomingCallOverlay and VideoCallOverlay components */}

      {/* Chat Header - Fixed below navbar */}
      <div className="flex-shrink-0 bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-800/80">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push('/messages')}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <Link href={`/profile/${chatUser.username}`} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Avatar
                src={chatUser.profilePicture}
                alt={chatUser.displayName || chatUser.username}
                size="md"
                isOnline={chatUser.isOnline}
              />
              <div className="min-w-0">
                <h2 className="font-medium text-white text-sm sm:text-base truncate">
                  {chatUser.displayName || chatUser.username}
                </h2>
                <p className="text-xs text-neutral-400">
                  {isTyping ? (
                    <span className="text-white flex items-center gap-1">
                      <span className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      typing
                    </span>
                  ) : chatUser.isOnline ? (
                    <span className="text-emerald-400">Online</span>
                  ) : (
                    'Offline'
                  )}
                </p>
              </div>
            </Link>

            {/* Call buttons - responsive */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => handleStartCall('voice')}
                disabled={!chatUser.isOnline}
                className="p-2 sm:p-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={chatUser.isOnline ? 'Voice call' : 'User is offline'}
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => handleStartCall('video')}
                disabled={!chatUser.isOnline}
                className="p-2 sm:p-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={chatUser.isOnline ? 'Video call' : 'User is offline'}
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button className="p-2 sm:p-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors">
                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages and Calls Timeline - Scrollable area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 pb-6 space-y-4">
          {Object.entries(groupedTimeline).map(([date, dateItems]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1.5 bg-neutral-800/60 border border-neutral-700/50 rounded-full text-xs text-neutral-400">
                  {date}
                </span>
              </div>

              {/* Items for this date */}
              {dateItems.map((item, index) => {
                // Check if this is a call entry
                if (item.type === 'call') {
                  const call = item as CallEntry;
                  const { icon, text, statusColor } = getCallDisplay(call);
                  
                  return (
                    <div key={call._id} className="flex justify-center my-3">
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-full">
                        <div className={`p-1.5 rounded-full ${call.status === 'missed' || call.status === 'declined' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                          <span className={statusColor}>
                            {call.callType === 'video' ? <Video className="w-4 h-4" /> : icon}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className={statusColor}>{text}</span>
                          {(call.status === 'answered' || call.status === 'ended') && call.duration > 0 && (
                            <span className="text-neutral-500 ml-2">
                              {formatDuration(call.duration)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-neutral-500">
                          {formatTime(call.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                }
                
                // Regular message
                const message = item as Message;
                const isOwn = message.isOwn === true || message.senderId === user?._id;
                const prevItem = dateItems[index - 1];
                const showAvatar = index === 0 || 
                  prevItem?.type === 'call' ||
                  ((prevItem as Message).isOwn !== isOwn && (prevItem as Message).senderId !== message.senderId);

                return (
                  <div
                    key={message._id}
                    className={`flex items-end gap-1.5 sm:gap-2 ${isOwn ? 'justify-end' : 'justify-start'} ${
                      message.isNew ? 'animate-fade-in-up' : ''
                    }`}
                    style={message.isNew ? {
                      animation: 'fadeInUp 0.3s ease-out forwards'
                    } : undefined}
                  >
                    {/* Other user's avatar */}
                    {!isOwn && (
                      <div className={`w-6 sm:w-8 flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
                        <Avatar
                          src={chatUser.profilePicture}
                          alt={chatUser.username}
                          size="sm"
                        />
                      </div>
                    )}
                    
                    {/* Message content */}
                    <div className="flex flex-col">
                      {/* Sender name - show when avatar is visible */}
                      {showAvatar && (
                        <span className={`text-[10px] sm:text-xs mb-0.5 ${
                          isOwn ? 'text-right text-neutral-400' : 'text-left text-neutral-400'
                        }`}>
                          {isOwn ? (user?.displayName || user?.username || 'You') : (chatUser.displayName || chatUser.username)}
                        </span>
                      )}
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl transition-all duration-300 ${
                          isOwn
                            ? 'bg-white text-neutral-900 rounded-br-md shadow-lg shadow-white/10'
                            : 'bg-neutral-800/80 border border-neutral-700/50 text-white rounded-bl-md'
                        } ${
                          message.isNew ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
                        }`}
                        style={message.isNew ? {
                          animation: 'scaleIn 0.3s ease-out 0.1s forwards'
                        } : undefined}
                      >
                        <p className="break-words text-sm sm:text-base">{message.content}</p>
                        <div className={`flex items-center gap-1 mt-0.5 sm:mt-1 ${
                          isOwn ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className={`text-[9px] sm:text-[10px] ${
                            isOwn ? 'text-neutral-500' : 'text-neutral-500'
                          }`}>
                            {formatTime(message.timestamp || message.createdAt || '')}
                          </span>
                          {/* Delivery status indicators for own messages */}
                          {isOwn && (
                            <span className="flex items-center">
                              {message.status === 'sending' ? (
                                <span className="w-3 h-3 border border-neutral-400 border-t-transparent rounded-full animate-spin" />
                              ) : message.isRead || message.status === 'read' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                              ) : message.isDelivered || message.status === 'delivered' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-neutral-400" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-neutral-400" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Own user's avatar */}
                    {isOwn && (
                      <div className={`w-6 sm:w-8 flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
                        <Avatar
                          src={user?.profilePicture}
                          alt={user?.username || 'You'}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          
          {/* Typing indicator bubble - with proper spacing */}
          {isTyping && (
            <div className="flex items-end gap-2 justify-start mb-4">
              <div className="w-6 sm:w-8 flex-shrink-0">
                <Avatar
                  src={chatUser.profilePicture}
                  alt={chatUser.username}
                  size="sm"
                />
              </div>
              <div className="bg-neutral-800/80 border border-neutral-700/50 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1.5 items-center h-4">
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
                </div>
              </div>
            </div>
          )}
          
          {/* Bottom spacer for scroll clearance */}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area - Fixed at bottom with proper spacing */}
      <div className="flex-shrink-0 bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-800/80 safe-area-bottom">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-1 min-w-0 bg-neutral-800/60 border border-neutral-700/50 rounded-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
              className="p-2.5 sm:p-3 bg-white rounded-full text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-white/10 flex-shrink-0"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
