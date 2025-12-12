'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, MoreVertical, Phone, Video, PhoneOff, X, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, Check, CheckCheck, Flag, UserX, UserMinus, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { messagesApi, userApi, friendsApi } from '@/lib/api';
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
  const [requestingPermissionFor, setRequestingPermissionFor] = useState<'voice' | 'video' | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  // Action menu state
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnfriendModal, setShowUnfriendModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const actionMenuRef = useRef<HTMLDivElement>(null);
    
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
      // Check if message is from current chat user (compare as strings)
      const fromUserId = String(data.from?.userId || '');
      const conversationId = String(data.conversationId || '');
      const currentUserId = String(userId);
      
      if (fromUserId === currentUserId || conversationId === currentUserId) {
        const newMsg = {
          _id: data.messageId || `msg-${Date.now()}`,
          senderId: data.from?.userId,
          content: data.message || data.content,
          isOwn: false,
          isRead: true,
          isNew: true, // Quick 0.1s animation
          timestamp: data.timestamp || new Date().toISOString(),
        };
        
        // Update state immediately
        setMessages((prev) => {
          if (prev.some(m => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        
        setTimeline((prev) => {
          if (prev.some(m => m._id === newMsg._id)) return prev;
          return [...prev, newMsg as TimelineItem];
        });
        
        // Mark as read via socket (non-blocking)
        if (data.messageId) {
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

    // Listen for message sent confirmation (socket-based sending)
    const handleMessageSent = (data: any) => {
      console.log('[Chat Socket] Message sent confirmation:', data);
      if (data.tempId) {
        setMessages((prev) => 
          prev.map((msg) => 
            msg._id === data.tempId 
              ? { ...msg, _id: data.messageId, isNew: false, status: 'sent' }
              : msg
          )
        );
        setTimeline((prev) => 
          prev.map((item) => 
            item._id === data.tempId 
              ? { ...item, _id: data.messageId, isNew: false, status: 'sent' } as TimelineItem
              : item
          )
        );
      }
    };

    // Listen for message send errors
    const handleDmError = (data: any) => {
      console.error('[Chat Socket] DM error:', data);
      // Could show error toast here
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
    socket.on('dm_sent', handleMessageSent);
    socket.on('dm_error', handleDmError);

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
      socket.off('dm_sent', handleMessageSent);
      socket.off('dm_error', handleDmError);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, user, userId]);

  const handleStartCall = async (type: 'voice' | 'video') => {
    if (!chatUser) {
      console.log('[Call] Cannot start - no chat user');
      return;
    }
    if (!chatUser.isOnline) {
      setActionError('User is offline');
      setTimeout(() => setActionError(''), 3000);
      return;
    }
    
    // Request camera/mic permissions FIRST before initiating call
    setRequestingPermissionFor(type);
    setPermissionError(null);
    
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera/microphone not supported on this device');
      }
      
      // Request permissions - this will show the browser permission prompt
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === 'video',
      };
      
      console.log('[Call] Requesting permissions for', type, 'call');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Stop the test stream immediately - VideoCallOverlay will request its own
      stream.getTracks().forEach(track => track.stop());
      
      console.log('[Call] Permission granted, starting', type, 'call to', chatUser.username);
      
      setRequestingPermissionFor(null);
      
      // Permission granted - now start the call
      startCall(
        chatUser._id,
        { username: chatUser.displayName || chatUser.username, profilePicture: chatUser.profilePicture },
        type
      );
    } catch (error: any) {
      console.error('[Call] Permission error:', error);
      setRequestingPermissionFor(null);
      
      // Handle specific permission errors
      let errorMessage = 'Failed to access camera/microphone.';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera/microphone permission denied. Please allow access to make a call.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera or microphone found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera/microphone is already in use by another application.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setPermissionError(errorMessage);
      setActionError(errorMessage);
      setTimeout(() => {
        setPermissionError(null);
        setActionError('');
      }, 5000);
    }
  };

  const handleEndCallLocal = () => {
    setLocalCallType(null);
    setIsInitiatingCall(false);
    globalEndCall();
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false);
      }
    };
    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionMenu]);

  // Handle block user
  const handleBlockUser = async () => {
    if (!chatUser) return;

    setIsSubmittingAction(true);
    setActionError('');
    try {
      await userApi.blockUser(chatUser._id);
      setActionSuccess('User blocked successfully');
      setShowActionMenu(false);
      // Redirect back to messages list
      setTimeout(() => router.push('/messages'), 1500);
    } catch (error: any) {
      setActionError(error.response?.data?.error || 'Failed to block user');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle unfriend user
  const handleUnfriend = async () => {
    if (!chatUser) return;

    setIsSubmittingAction(true);
    setActionError('');
    try {
      await friendsApi.unfriend(chatUser._id);
      setActionSuccess('Friend removed successfully');
      setShowActionMenu(false);
      // Redirect back to messages list
      setTimeout(() => router.push('/messages'), 1500);
    } catch (error: any) {
      setActionError(error.response?.data?.error || 'Failed to unfriend user');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle report user submission
  const handleReportSubmit = async () => {
    if (!chatUser || !reportReason) return;

    setIsSubmittingAction(true);
    setActionError('');
    try {
      await userApi.reportUser(chatUser._id, reportReason, reportDescription);
      setActionSuccess('Report submitted successfully');
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (error: any) {
      setActionError(error.response?.data?.error || 'Failed to submit report');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Report reason options
  const REPORT_REASONS = [
    { value: 'harassment', label: 'Harassment' },
    { value: 'spam', label: 'Spam' },
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'hate_speech', label: 'Hate Speech' },
    { value: 'violence', label: 'Violence or Threats' },
    { value: 'scam', label: 'Scam or Fraud' },
    { value: 'impersonation', label: 'Impersonation' },
    { value: 'underage', label: 'Underage User' },
    { value: 'other', label: 'Other' },
  ];
  
  const handleSend = () => {
    if (!newMessage.trim() || isSending || !socket) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      _id: tempId,
      senderId: user!._id,
      receiverId: userId,
      content: newMessage.trim(),
      isOwn: true,
      isRead: false,
      isDelivered: false,
      isNew: false, // No animation for own messages - appear instantly
      status: 'sending',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setTimeline((prev) => [...prev, tempMessage as TimelineItem]);
    setNewMessage('');
    setIsSending(true);

    // Stop typing indicator
    socket.emit('dm_typing_stop', { to: userId });

    // Send via WebSocket for instant delivery
    socket.emit('dm_send', {
      to: userId,
      message: tempMessage.content,
      tempId: tempId,
    });

    // Reset sending state after a short delay (actual confirmation comes via dm_sent event)
    setTimeout(() => setIsSending(false), 100);
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
        <div className="bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-8">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!chatUser) {
    return (
      <div className="min-h-screen pt-24 sm:pt-28 flex flex-col items-center justify-center px-4">
        <div className="bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-8 text-center">
          <p className="text-neutral-400 mb-4">User not found</p>
          <Link href="/messages">
            <Button>Back to Messages</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pt-[88px] sm:pt-24 flex flex-col">
      {/* Note: Call overlays are now rendered globally via IncomingCallOverlay and VideoCallOverlay components */}

      {/* Chat Header Card - Fixed below navbar */}
      <div className="flex-shrink-0 px-2 sm:px-4 pt-2 sm:pt-3 relative z-40">
        <div className="max-w-4xl mx-auto">
          <div className="bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-neutral-700/50 shadow-lg overflow-visible">
            <div className="px-3 sm:px-5 py-3 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                {/* Back button */}
                <button
                  onClick={() => router.push('/messages')}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-all flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                {/* User info with online status card */}
                <Link href={`/profile/${chatUser.username}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                  <div className="relative">
                    <Avatar
                      src={chatUser.profilePicture}
                      alt={chatUser.displayName || chatUser.username}
                      size="md"
                      isOnline={chatUser.isOnline}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-white text-sm sm:text-base truncate group-hover:text-neutral-200 transition-colors">
                      {chatUser.displayName || chatUser.username}
                    </h2>
                    {/* Online status badge */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isTyping ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800/60 border border-neutral-700/40 rounded-full">
                          <span className="flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-typing-dot" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-typing-dot" style={{ animationDelay: '200ms' }} />
                            <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-typing-dot" style={{ animationDelay: '400ms' }} />
                          </span>
                          <span className="text-xs text-neutral-400 font-medium">typing</span>
                        </span>
                      ) : chatUser.isOnline ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 rounded-full">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                          <span className="text-xs text-emerald-400 font-medium">Online</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-neutral-800/80 rounded-full">
                          <span className="w-2 h-2 bg-neutral-500 rounded-full" />
                          <span className="text-xs text-neutral-400 font-medium">Offline</span>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Call action buttons card */}
                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 bg-neutral-800/60 rounded-xl p-1">
                  <button
                    onClick={() => handleStartCall('voice')}
                    disabled={!chatUser.isOnline || requestingPermissionFor !== null}
                    className="p-2 sm:p-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-700/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    title={!chatUser.isOnline ? 'User is offline' : requestingPermissionFor ? 'Requesting permission...' : 'Voice call'}
                  >
                    {requestingPermissionFor === 'voice' ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : (
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleStartCall('video')}
                    disabled={!chatUser.isOnline || requestingPermissionFor !== null}
                    className="p-2 sm:p-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-700/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    title={!chatUser.isOnline ? 'User is offline' : requestingPermissionFor ? 'Requesting permission...' : 'Video call'}
                  >
                    {requestingPermissionFor === 'video' ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : (
                      <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                  <div className="w-px h-5 sm:h-6 bg-neutral-700 mx-0.5" />
                  <div className="relative" ref={actionMenuRef}>
                    <button 
                      onClick={() => setShowActionMenu(!showActionMenu)}
                      className="p-2 sm:p-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-700/60 transition-all"
                      title="More options"
                    >
                      <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    
                    {/* Dropdown Menu - positioned absolutely outside overflow context */}
                    {showActionMenu && (
                      <div className="fixed sm:absolute right-2 sm:right-0 top-[140px] sm:top-full mt-0 sm:mt-2 w-56 sm:w-48 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl z-[100] overflow-hidden">
                        <button
                          onClick={() => {
                            setShowActionMenu(false);
                            setShowReportModal(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
                        >
                          <Flag className="w-4 h-4" />
                          Report User
                        </button>
                        <button
                          onClick={() => {
                            setShowActionMenu(false);
                            setShowBlockModal(true);
                          }}
                          disabled={isSubmittingAction}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors disabled:opacity-50"
                        >
                          <Shield className="w-4 h-4" />
                          Block User
                        </button>
                        <button
                          onClick={() => {
                            setShowActionMenu(false);
                            setShowUnfriendModal(true);
                          }}
                          disabled={isSubmittingAction}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          <UserMinus className="w-4 h-4" />
                          Unfriend
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container Card - Messages + Input in unified container */}
      <div className="flex-1 flex flex-col min-h-0 px-2 sm:px-4 py-2 sm:py-3 pb-2 sm:pb-3">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col min-h-0">
          <div className="bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-700/50 flex-1 flex flex-col min-h-0 shadow-lg overflow-hidden">
            
            {/* Messages Scrollable Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-3 sm:px-5 py-4 space-y-3">
              {Object.entries(groupedTimeline).map(([date, dateItems]) => (
                <div key={date}>
                  {/* Date separator */}
                  <div className="flex items-center justify-center my-4">
                    <span className="px-3 py-1.5 bg-neutral-800/80 border border-neutral-700/50 rounded-full text-xs text-neutral-400 font-medium">
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
                          <div className="flex items-center gap-3 px-4 py-2.5 bg-neutral-800/60 border border-neutral-700/50 rounded-full">
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
                        className={`flex items-end gap-1.5 sm:gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Other user's avatar - always visible */}
                        {!isOwn && (
                          <div className="w-6 sm:w-8 flex-shrink-0">
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
                              isOwn ? 'text-right text-neutral-500' : 'text-left text-neutral-500'
                            }`}>
                              {isOwn ? (user?.displayName || user?.username || 'You') : (chatUser.displayName || chatUser.username)}
                            </span>
                          )}
                          <div
                            className={`max-w-[80%] sm:max-w-[70%] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl ${
                              isOwn
                                ? 'bg-white text-neutral-900 rounded-br-md shadow-lg shadow-white/10'
                                : 'bg-neutral-800/80 border border-neutral-700/50 text-white rounded-bl-md'
                            } ${
                              !isOwn && message.isNew ? 'animate-message-in' : ''
                            }`}
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
                        
                        {/* Own user's avatar - always visible */}
                        {isOwn && (
                          <div className="w-6 sm:w-8 flex-shrink-0">
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
              
              {/* Bottom spacer for scroll clearance */}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>

          {/* Input Area - Fixed at bottom inside card */}
          <div className="flex-shrink-0 border-t border-neutral-700/50 bg-neutral-900/80 backdrop-blur-xl safe-area-bottom">
            <div className="px-3 sm:px-4 py-2.5 sm:py-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 min-w-0 bg-neutral-800/60 border border-neutral-700/50 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-neutral-600 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isSending}
                  className="p-2.5 sm:p-3 bg-white rounded-xl text-neutral-900 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-white/10 flex-shrink-0"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
          
          </div>
        </div>
      </div>

      {/* Action Success/Error Toast */}
      {actionSuccess && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-emerald-500/90 text-white rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-4">
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500/90 text-white rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-4">
          {actionError}
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-400" />
                Report User
              </h2>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDescription('');
                  setActionError('');
                }}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-xl">
                <Avatar src={chatUser?.profilePicture} alt={chatUser?.username || ''} size="md" />
                <div>
                  <p className="text-white font-medium">{chatUser?.displayName || chatUser?.username}</p>
                  <p className="text-sm text-neutral-400">@{chatUser?.username}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Reason for Report *</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="">Select a reason...</option>
                  {REPORT_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Additional Details (optional)</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide more context about what happened..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                  rows={3}
                />
              </div>

              {actionError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
                  {actionError}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-700">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDescription('');
                  setActionError('');
                }}
                className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                disabled={!reportReason || isSubmittingAction}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSubmittingAction ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block User Confirmation Modal */}
      <ConfirmModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleBlockUser}
        title="Block User"
        message={`Are you sure you want to block ${chatUser?.displayName || chatUser?.username}? This will also unfriend them and you won't be able to message each other.`}
        confirmText="Block User"
        cancelText="Cancel"
        confirmVariant="danger"
        icon={
          <div className="p-3 rounded-xl bg-red-900/30">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
        }
      />

      {/* Unfriend Confirmation Modal */}
      <ConfirmModal
        isOpen={showUnfriendModal}
        onClose={() => setShowUnfriendModal(false)}
        onConfirm={handleUnfriend}
        title="Unfriend User"
        message={`Are you sure you want to unfriend ${chatUser?.displayName || chatUser?.username}? You can send them a friend request again later.`}
        confirmText="Unfriend"
        cancelText="Cancel"
        confirmVariant="danger"
        icon={
          <div className="p-3 rounded-xl bg-amber-900/30">
            <UserMinus className="w-8 h-8 text-amber-400" />
          </div>
        }
      />
    </div>
  );
}
