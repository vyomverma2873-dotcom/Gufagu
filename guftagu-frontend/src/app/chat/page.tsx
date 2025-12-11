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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex">
        {/* Video area */}
        <div className={cn('flex-1 relative', isChatOpen && 'hidden md:block')}>
          {connectionState === 'idle' ? (
            // Start screen
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                  <Video className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Ready to Chat?</h1>
                <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
                  Connect with random strangers for video conversations. Click below to start.
                </p>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-zinc-400">
                    <span className="text-white font-semibold">{onlineCount.toLocaleString()}</span> users online
                  </span>
                </div>
                <Button onClick={startSearching} size="lg" className="px-8">
                  <Video className="w-5 h-5 mr-2" />
                  Start Video Chat
                </Button>
              </div>
            </div>
          ) : (
            // Video grid
            <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {/* Remote video */}
              <div className="relative bg-zinc-900 rounded-2xl overflow-hidden flex items-center justify-center">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {connectionState !== 'connected' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    {connectionState === 'searching' && (
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-4 border-4 border-zinc-700 border-t-white rounded-full animate-spin" />
                        <p className="text-zinc-400">Finding someone...</p>
                      </div>
                    )}
                    {connectionState === 'connecting' && (
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-4 border-4 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="text-zinc-400">Connecting...</p>
                      </div>
                    )}
                    {connectionState === 'disconnected' && (
                      <div className="text-center">
                        <p className="text-zinc-400 mb-4">Partner disconnected</p>
                        <Button onClick={startSearching}>Find New Partner</Button>
                      </div>
                    )}
                  </div>
                )}
                {partner && connectionState === 'connected' && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-zinc-900/80 backdrop-blur rounded-lg">
                    <span className="text-sm text-white font-medium">{partner.username}</span>
                  </div>
                )}
              </div>

              {/* Local video */}
              <div className="relative bg-zinc-900 rounded-2xl overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
                {!localStream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto mb-3 border-4 border-zinc-700 border-t-white rounded-full animate-spin" />
                      <p className="text-zinc-400 text-sm">Starting camera...</p>
                    </div>
                  </div>
                )}
                {localStream && !isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <VideoOff className="w-12 h-12 text-zinc-600" />
                  </div>
                )}
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-zinc-900/80 backdrop-blur rounded-lg">
                  <span className="text-sm text-white font-medium">You</span>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          {connectionState !== 'idle' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button
                onClick={toggleVideo}
                className={cn(
                  'p-4 rounded-full transition-colors',
                  isVideoEnabled
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                )}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>

              <button
                onClick={toggleAudio}
                className={cn(
                  'p-4 rounded-full transition-colors',
                  isAudioEnabled
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                )}
              >
                {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>

              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={cn(
                  'p-4 rounded-full transition-colors md:hidden',
                  isChatOpen
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                )}
              >
                <MessageSquare className="w-6 h-6" />
              </button>

              {connectionState === 'connected' && (
                <button
                  onClick={skipPartner}
                  className="p-4 rounded-full bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              )}

              <button
                onClick={endChat}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        {/* Chat sidebar */}
        {connectionState !== 'idle' && (
          <div
            className={cn(
              'w-full md:w-96 bg-zinc-900/50 border-l border-zinc-800 flex flex-col',
              !isChatOpen && 'hidden md:flex'
            )}
          >
            {/* Chat header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-zinc-400" />
                <span className="font-medium text-white">Chat</span>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                Back
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2',
                    msg.isOwn
                      ? 'ml-auto bg-violet-600 text-white'
                      : 'bg-zinc-800 text-white'
                  )}
                >
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))}
              {isPartnerTyping && (
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <span>Partner is typing</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-zinc-800">
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
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  disabled={connectionState !== 'connected'}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || connectionState !== 'connected'}
                  className="p-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
