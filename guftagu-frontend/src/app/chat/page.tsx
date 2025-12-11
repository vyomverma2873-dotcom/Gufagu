'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Video, VideoOff, Mic, MicOff, SkipForward, PhoneOff, MessageSquare, Send, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  from: string;
  fromUsername: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

interface MatchPartner {
  socketId: string;
  username: string;
  userId7Digit?: string;
  interests: string[];
}

type ConnectionState = 'idle' | 'searching' | 'connecting' | 'connected' | 'disconnected';

export default function ChatPage() {
  const { socket, isConnected, onlineCount } = useSocket();
  const { user, isAuthenticated } = useAuth();
  
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [partner, setPartner] = useState<MatchPartner | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  // Chat is always visible in the new layout
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousMessagesLengthRef = useRef<number>(0);

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Initialize local media
  const initializeMedia = useCallback(async () => {
    try {
      console.log('[Media] Requesting camera and microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log('[Media] Got stream:', stream.id);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('[Media] Failed to get media devices:', error);
      return null;
    }
  }, []);

  // Sync local video element with stream (handles late mounting)
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log('[Video] Setting local video srcObject');
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(e => console.log('[Video] Play error:', e));
    }
  }, [localStream, connectionState]); // Re-run when stream or connectionState changes

  // Create peer connection
  const createPeerConnection = useCallback((partnerId: string) => {
    console.log('[WebRTC] Creating peer connection for partner:', partnerId);
    const pc = new RTCPeerConnection(iceServers);

    // Add local tracks
    if (localStreamRef.current) {
      console.log('[WebRTC] Adding local tracks to peer connection');
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    } else {
      console.warn('[WebRTC] No local stream to add tracks from!');
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log('[WebRTC] Sending ICE candidate');
        socket.emit('webrtc_ice_candidate', {
          to: partnerId,
          candidate: event.candidate,
        });
      }
    };

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.play().catch(e => console.log('[Video] Remote play error:', e));
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setConnectionState('connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setConnectionState('disconnected');
      }
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [socket]);

  // Start searching for a match
  const startSearching = async () => {
    if (!socket || !isConnected) return;

    const stream = await initializeMedia();
    if (!stream) return;

    setConnectionState('searching');
    setMessages([]);
    setPartner(null);

    socket.emit('join_queue', {
      interests: [],
      userId: user?._id,
      userId7Digit: user?.userId,
    });
  };

  // Skip current partner
  const skipPartner = () => {
    if (!socket) return;
    cleanupConnection();
    socket.emit('skip_partner');
    setConnectionState('searching');
    setMessages([]);
    setPartner(null);
  };

  // End chat
  const endChat = () => {
    if (!socket) return;
    socket.emit('end_chat');
    cleanupConnection();
    // Stop local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setConnectionState('idle');
    setMessages([]);
    setPartner(null);
  };

  // Cleanup connection
  const cleanupConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Send chat message
  const sendMessage = () => {
    if (!messageInput.trim() || !socket || !partner) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      from: socket.id || '',
      fromUsername: user?.username || 'Anonymous',
      message: messageInput.trim(),
      timestamp: new Date(),
      isOwn: true,
    };

    setMessages((prev) => [...prev, message]);
    socket.emit('chat_message', {
      to: partner.socketId,
      message: messageInput.trim(),
    });
    setMessageInput('');
    socket.emit('chat_typing_stop', { to: partner.socketId });
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !partner) return;

    socket.emit('chat_typing_start', { to: partner.socketId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat_typing_stop', { to: partner.socketId });
    }, 1000);
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Match found
    socket.on('match_found', async (data) => {
      console.log('[Match] Found partner:', data.partnerUsername, 'isInitiator:', data.isInitiator);
      setPartner({
        socketId: data.partnerId,
        username: data.partnerUsername,
        userId7Digit: data.partnerUserId7Digit,
        interests: data.partnerInterests || [],
      });
      setConnectionState('connecting');

      // Only the initiator creates and sends the offer
      if (data.isInitiator) {
        console.log('[WebRTC] Creating offer as initiator...');
        const pc = createPeerConnection(data.partnerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('webrtc_offer', {
          to: data.partnerId,
          offer,
        });
        console.log('[WebRTC] Offer sent to:', data.partnerId);
      } else {
        console.log('[WebRTC] Waiting for offer from initiator...');
        // Non-initiator: create peer connection but wait for offer
        createPeerConnection(data.partnerId);
      }
    });

    // WebRTC offer received (only non-initiator receives this)
    socket.on('webrtc_offer', async (data) => {
      console.log('[WebRTC] Received offer from:', data.from);
      
      // Use existing peer connection if available, otherwise create new one
      let pc = peerConnectionRef.current;
      if (!pc) {
        console.log('[WebRTC] Creating peer connection for offer');
        pc = createPeerConnection(data.from);
      }
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc_answer', {
          to: data.from,
          answer,
        });
        console.log('[WebRTC] Answer sent to:', data.from);
      } catch (error) {
        console.error('[WebRTC] Error handling offer:', error);
      }
    });

    // WebRTC answer received (only initiator receives this)
    socket.on('webrtc_answer', async (data) => {
      console.log('[WebRTC] Received answer from:', data.from);
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          console.log('[WebRTC] Remote description set from answer');
        } catch (error) {
          console.error('[WebRTC] Error handling answer:', error);
        }
      } else {
        console.error('[WebRTC] No peer connection for answer!');
      }
    });

    // ICE candidate received
    socket.on('webrtc_ice_candidate', async (data) => {
      console.log('[WebRTC] Received ICE candidate from:', data.from);
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (error) {
          console.error('[WebRTC] Error adding ICE candidate:', error);
        }
      } else {
        console.warn('[WebRTC] No peer connection for ICE candidate');
      }
    });

    // Partner disconnected
    socket.on('partner_disconnected', () => {
      cleanupConnection();
      setConnectionState('disconnected');
    });

    // Partner skipped
    socket.on('partner_skipped', () => {
      cleanupConnection();
      setConnectionState('searching');
      setMessages([]);
      setPartner(null);
    });

    // Chat message received
    socket.on('chat_message', (data) => {
      const message: ChatMessage = {
        id: Date.now().toString(),
        from: data.from,
        fromUsername: data.fromUsername,
        message: data.message,
        timestamp: new Date(data.timestamp),
        isOwn: false,
      };
      setMessages((prev) => [...prev, message]);
      setIsPartnerTyping(false);
    });

    // Typing indicators
    socket.on('chat_typing_start', () => setIsPartnerTyping(true));
    socket.on('chat_typing_stop', () => setIsPartnerTyping(false));

    return () => {
      socket.off('match_found');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
      socket.off('partner_disconnected');
      socket.off('partner_skipped');
      socket.off('chat_message');
      socket.off('chat_typing_start');
      socket.off('chat_typing_stop');
    };
  }, [socket, createPeerConnection]);

  // Scroll to bottom only on new messages (not when typing)
  useEffect(() => {
    // Only scroll if a new message was added
    if (messages.length > previousMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      previousMessagesLengthRef.current = messages.length;
    }
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupConnection();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Hide navbar and footer when video call is active using CSS class
  useEffect(() => {
    const isActive = connectionState !== 'idle';
    
    if (isActive) {
      document.body.classList.add('video-chat-active');
    } else {
      document.body.classList.remove('video-chat-active');
    }
    
    return () => {
      // Always remove class on unmount
      document.body.classList.remove('video-chat-active');
    };
  }, [connectionState]);

  return (
    <div className={cn(
      "fixed inset-0 flex flex-col overflow-hidden",
      connectionState === 'idle' ? 'top-16 z-40 bg-transparent' : 'top-0 z-[9999] bg-zinc-950'
    )}>
      {connectionState === 'idle' ? (
        // Start screen - Card-based design
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white mb-3">Random Video Chat</h1>
              <p className="text-neutral-400 text-sm mb-6">
                Connect with random strangers for video conversations.
              </p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-neutral-400 text-sm">
                  <span className="text-white font-semibold">{onlineCount.toLocaleString()}</span> online
                </span>
              </div>
              <Button onClick={startSearching} size="lg" className="w-full">
                <Video className="w-5 h-5 mr-2" />
                Start Video Chat
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Active call - Vertical layout: Video on top, Chat below
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Section - Takes remaining space */}
          <div className="flex-1 min-h-0 relative p-2 md:p-3">
            <div className="h-full grid grid-cols-2 gap-2">
              {/* Remote video */}
              <div className="relative bg-neutral-900 rounded-xl overflow-hidden">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {connectionState !== 'connected' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                    {connectionState === 'searching' && (
                      <div className="text-center">
                        <div className="w-10 h-10 mx-auto mb-3 border-4 border-zinc-700 border-t-white rounded-full animate-spin" />
                        <p className="text-neutral-400 text-xs md:text-sm">Finding...</p>
                      </div>
                    )}
                    {connectionState === 'connecting' && (
                      <div className="text-center">
                        <div className="w-10 h-10 mx-auto mb-3 border-4 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="text-neutral-400 text-xs md:text-sm">Connecting...</p>
                      </div>
                    )}
                    {connectionState === 'disconnected' && (
                      <div className="text-center p-2">
                        <p className="text-neutral-400 text-xs md:text-sm mb-2">Disconnected</p>
                        <Button onClick={startSearching} size="sm">Find New</Button>
                      </div>
                    )}
                  </div>
                )}
                {partner && connectionState === 'connected' && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-zinc-900/80 backdrop-blur rounded text-xs text-white">
                    {partner.username}
                  </div>
                )}
              </div>

              {/* Local video */}
              <div className="relative bg-neutral-900 rounded-xl overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
                {!localStream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                    <div className="w-8 h-8 border-4 border-zinc-700 border-t-white rounded-full animate-spin" />
                  </div>
                )}
                {localStream && !isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                    <VideoOff className="w-8 h-8 text-zinc-600" />
                  </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-1 bg-zinc-900/80 backdrop-blur rounded text-xs text-white">
                  You
                </div>
              </div>
            </div>

            {/* Controls overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <button
                onClick={toggleVideo}
                className={cn(
                  'p-2.5 md:p-3 rounded-full transition-colors',
                  isVideoEnabled
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                )}
              >
                {isVideoEnabled ? <Video className="w-4 h-4 md:w-5 md:h-5" /> : <VideoOff className="w-4 h-4 md:w-5 md:h-5" />}
              </button>

              <button
                onClick={toggleAudio}
                className={cn(
                  'p-2.5 md:p-3 rounded-full transition-colors',
                  isAudioEnabled
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                )}
              >
                {isAudioEnabled ? <Mic className="w-4 h-4 md:w-5 md:h-5" /> : <MicOff className="w-4 h-4 md:w-5 md:h-5" />}
              </button>

              {connectionState === 'connected' && (
                <button
                  onClick={skipPartner}
                  className="p-2.5 md:p-3 rounded-full bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                >
                  <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              )}

              <button
                onClick={endChat}
                className="p-2.5 md:p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                <PhoneOff className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>

          {/* Chat Section - Fixed height, always visible */}
          <div className="h-48 md:h-56 bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-800 flex flex-col">
            {/* Chat header */}
            <div className="px-3 py-2 border-b border-neutral-800 flex items-center gap-2 flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-neutral-400" />
              <span className="text-sm font-medium text-white">Chat</span>
              {partner && connectionState === 'connected' && (
                <span className="text-xs text-neutral-500">with {partner.username}</span>
              )}
            </div>

            {/* Messages container - scrollable */}
            <div 
              ref={messagesContainerRef} 
              className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
            >
              {messages.length === 0 && (
                <p className="text-neutral-500 text-xs text-center py-4">No messages yet</p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'max-w-[75%] rounded-lg px-3 py-1.5',
                    msg.isOwn
                      ? 'ml-auto bg-zinc-700 text-white'
                      : 'bg-neutral-800 text-white'
                  )}
                >
                  <p className="text-xs md:text-sm">{msg.message}</p>
                </div>
              ))}
              {isPartnerTyping && (
                <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
                  <span>Typing</span>
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="px-3 py-2 border-t border-neutral-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  disabled={connectionState !== 'connected'}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || connectionState !== 'connected'}
                  className="p-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
