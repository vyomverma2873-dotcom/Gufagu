'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Copy, Users, Check, Share2, Settings, LogOut, Crown, UserPlus, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import GalaxyBackground from '@/components/layout/GalaxyBackground';
import VideoGrid from '@/components/room/VideoGrid';
import ControlsBar from '@/components/room/ControlsBar';
import ParticipantsPanel from '@/components/room/ParticipantsPanel';
import InviteModal from '@/components/room/InviteModal';
import ExpirationTimer from '@/components/room/ExpirationTimer';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useWebRTC } from '@/hooks/useWebRTC';
import { roomsApi, friendsApi } from '@/lib/api';

interface RoomData {
  roomCode: string;
  roomName: string;
  host: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
  };
  maxParticipants: number;
  currentParticipants: number;
  isPublic: boolean;
  hasPassword: boolean;
  settings: {
    videoEnabled: boolean;
    audioEnabled: boolean;
    screenShareEnabled: boolean;
    chatEnabled: boolean;
  };
  expiresAt: string;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { socket } = useSocket();
  const code = params.code as string;

  const [room, setRoom] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [iceServers, setIceServers] = useState<RTCIceServer[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [mutedByHost, setMutedByHost] = useState(false);
  const [readyToJoin, setReadyToJoin] = useState(false);
  const [passwordAttempted, setPasswordAttempted] = useState(false);

  // WebRTC hook - only initialize after joining
  const webrtc = useWebRTC({
    roomCode: code,
    socket: hasJoined ? socket : null,
    iceServers,
    localUser: {
      _id: user?._id || '',
      username: user?.username || '',
      displayName: user?.displayName,
      profilePicture: user?.profilePicture,
    },
    isHost,
  });

  // Fetch room details
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/room/${code}`);
      return;
    }

    const fetchRoom = async () => {
      try {
        const response = await roomsApi.getRoomDetails(code);
        setRoom(response.data.room);
        // Signal that we're ready to show joining state
        setReadyToJoin(true);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Room not found');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchRoom();
    }
  }, [code, isAuthenticated, authLoading, router]);

  // Auto-join room after fetching (direct join flow)
  useEffect(() => {
    if (room && readyToJoin && !hasJoined && !isJoining && !showPassword && !passwordAttempted && !error) {
      // If room requires password, show password prompt directly (no API call needed)
      if (room.hasPassword) {
        setShowPassword(true);
        setPasswordAttempted(true);
      } else {
        // Non-password rooms: join directly
        joinRoom();
      }
    }
  }, [room, readyToJoin, hasJoined, isJoining, showPassword, passwordAttempted, error]);

  // Hide header/footer when in room (full-screen mode)
  useEffect(() => {
    if (hasJoined) {
      document.body.classList.add('video-chat-active');
    }
    return () => {
      document.body.classList.remove('video-chat-active');
    };
  }, [hasJoined]);

  // Join room
  const joinRoom = async () => {
    if (!room) return;

    setIsJoining(true);
    setPasswordError(null);
    try {
      const response = await roomsApi.joinRoom(code, password);
      const { iceServers: servers, isHost: hostStatus } = response.data.room;
      
      setIceServers(servers || []);
      setIsHost(hostStatus);
      setHasJoined(true);
      setShowPassword(false);
      setPassword('');
      setPasswordAttempted(false);
      
      // Join socket room
      if (socket) {
        socket.emit('room:join', { roomCode: code });
      }
    } catch (err: any) {
      if (err.response?.data?.requiresPassword) {
        setShowPassword(true);
        setPasswordAttempted(true);
      } else if (err.response?.data?.error === 'Invalid password') {
        setPasswordError('Incorrect password. Please try again.');
        setPassword('');
        setPasswordAttempted(true);
      } else {
        setError(err.response?.data?.error || 'Failed to join room');
      }
    } finally {
      setIsJoining(false);
    }
  };

  // Socket event listeners for room updates
  useEffect(() => {
    if (!socket || !hasJoined) return;

    const handleHostAction = (data: any) => {
      if (data.action === 'kick') {
        // Immediately leave room and cleanup
        webrtc.cleanup();
        
        if (socket) {
          socket.emit('room:leave', { roomCode: code });
        }
        
        // Show message based on ban status
        const message = data.permanentBan
          ? 'You have been permanently banned from this room'
          : `You were removed from the room by the host (${data.kickCount || 1}/3 warnings)`;
        
        alert(message);
        router.push('/');
      } else if (data.action === 'mute') {
        // Host muted us - toggle our audio off
        if (webrtc.audioEnabled) {
          webrtc.toggleAudio();
        }
        setMutedByHost(true);
        setTimeout(() => setMutedByHost(false), 3000);
      } else if (data.action === 'unmute') {
        setMutedByHost(false);
      }
    };

    const handleRoomClosed = (data: any) => {
      if (data.roomCode === code) {
        alert('Room was closed by the host');
        webrtc.cleanup();
        router.push('/');
      }
    };

    const handleParticipantUpdate = (data: any) => {
      if (data.roomCode === code) {
        setRoom(prev => prev ? { 
          ...prev, 
          currentParticipants: data.participantCount || prev.currentParticipants 
        } : null);
      }
    };

    socket.on('room:host-action', handleHostAction);
    socket.on('room:closed', handleRoomClosed);
    socket.on('room:participant-joined', handleParticipantUpdate);
    socket.on('room:participant-left', handleParticipantUpdate);

    return () => {
      socket.off('room:host-action', handleHostAction);
      socket.off('room:closed', handleRoomClosed);
      socket.off('room:participant-joined', handleParticipantUpdate);
      socket.off('room:participant-left', handleParticipantUpdate);
    };
  }, [socket, hasJoined, code, router, webrtc]);

  // Leave room
  const handleLeave = useCallback(async () => {
    try {
      webrtc.cleanup();
      await roomsApi.leaveRoom(code);
      
      if (socket) {
        socket.emit('room:leave', { roomCode: code });
      }
      
      router.push('/');
    } catch (err) {
      console.error('Error leaving room:', err);
      router.push('/');
    }
  }, [code, socket, router, webrtc]);

  // Copy room code
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Copy room link
  const copyLink = () => {
    const link = `${window.location.origin}/room/${code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Kick participant (host only)
  const kickParticipant = async (userId: string) => {
    if (!isHost) return;
    try {
      await roomsApi.kickParticipant(code, userId);
      // Also emit socket event for immediate UI update
      if (socket) {
        socket.emit('room:host-kick', { roomCode: code, targetUserId: userId });
      }
    } catch (err) {
      console.error('Failed to remove participant');
    }
  };

  // Mute participant (host only)
  const muteParticipant = async (userId: string, mute: boolean) => {
    if (!isHost) return;
    try {
      await roomsApi.muteParticipant(code, userId, mute);
      // Also emit socket event for immediate UI update
      if (socket) {
        socket.emit('room:host-mute', { roomCode: code, targetUserId: userId, mute });
      }
    } catch (err) {
      console.error('Failed to mute participant');
    }
  };

  // Add friend
  const addFriend = async (userId: string) => {
    try {
      await friendsApi.sendRequest(userId);
      alert('Friend request sent!');
    } catch (err) {
      console.error('Failed to send friend request');
    }
  };

  // Show connecting state for any loading/joining phase (before joined)
  // Don't show if we're about to or currently showing password prompt
  // Also show when isJoining is true (API call in progress) to prevent footer flash
  if ((authLoading || isLoading || isJoining || (readyToJoin && !hasJoined && !passwordAttempted)) && !error && !webrtc.error && !showPassword) {
    return (
      <>
        <GalaxyBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <Spinner />
            <p className="text-neutral-400 mt-4">Connecting to room...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || webrtc.error) {
    return (
      <>
        <GalaxyBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
            <p className="text-neutral-400 mb-6">{error || webrtc.error}</p>
            <Button onClick={() => router.push('/')}>Go Home</Button>
          </div>
        </div>
      </>
    );
  }

  // Password prompt
  if (showPassword && !hasJoined) {
    return (
      <>
        <GalaxyBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="bg-neutral-900/70 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Password Required</h2>
            <p className="text-neutral-400 mb-6">This room requires a password to join.</p>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              placeholder="Enter password"
              className={`w-full px-4 py-3 bg-neutral-800/50 border rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4 ${
                passwordError ? 'border-red-500' : 'border-neutral-700/50'
              }`}
              autoFocus
            />
            {passwordError && (
              <div className="p-3 bg-red-900/30 border border-red-800/50 rounded-lg mb-4">
                <p className="text-red-400 text-sm">{passwordError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
                Cancel
              </Button>
              <Button onClick={joinRoom} isLoading={isJoining} className="flex-1">
                Join Room
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // In-call view with custom WebRTC UI
  return (
    <div className="fixed inset-0 flex flex-col bg-neutral-950">
      {/* Muted by host notification */}
      {(mutedByHost || webrtc.mutedByHost) && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 px-4 py-2 rounded-xl animate-fade-in">
          You were muted by the host - You cannot unmute yourself
        </div>
      )}

      {/* Top Bar - Responsive height and spacing */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-neutral-900/90 backdrop-blur-sm border-b border-neutral-800 z-20">
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
          {/* Room name with host badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {isHost && <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0" />}
            <span className="text-sm sm:text-lg font-semibold text-white truncate">{room?.roomName}</span>
          </div>
          
          {/* Copy Code button - Hidden on mobile */}
          <button 
            onClick={copyCode}
            className="hidden sm:flex items-center gap-2 text-neutral-400 hover:text-white text-sm bg-neutral-800/50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Code: {code}
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Room Expiration Timer */}
          {room?.expiresAt && (
            <ExpirationTimer 
              expiresAt={room.expiresAt} 
              onExpired={() => {
                alert('This room has expired and will be closed.');
                router.push('/');
              }}
            />
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Invite button - Icon only on mobile */}
          <button 
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 text-neutral-400 hover:text-white px-2 sm:px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Invite</span>
          </button>

          {/* Participants button */}
          <button 
            onClick={() => setShowParticipants(!showParticipants)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg transition-colors text-sm ${
              showParticipants 
                ? 'bg-violet-600 text-white' 
                : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-xs sm:text-sm">{webrtc.peers.length + 1}/{room?.maxParticipants || 5}</span>
          </button>

          {/* Leave button - Icon only on mobile */}
          <button 
            onClick={() => setShowLeaveConfirm(true)}
            className="flex items-center gap-2 text-red-400 hover:text-white px-2 sm:px-3 py-1.5 rounded-lg hover:bg-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>

      {/* Video Grid Area - Responsive with proper spacing */}
      <div className={`flex-1 overflow-hidden relative transition-all duration-300 ${
        showParticipants ? 'lg:mr-80' : ''
      }`}>
        <VideoGrid
          localStream={webrtc.localStream}
          localUser={{
            _id: user?._id || '',
            username: user?.username || '',
            displayName: user?.displayName,
            profilePicture: user?.profilePicture,
          }}
          isHost={isHost}
          audioEnabled={webrtc.audioEnabled}
          videoEnabled={webrtc.videoEnabled}
          participants={webrtc.peers}
          onMuteParticipant={isHost ? muteParticipant : undefined}
          onKickParticipant={isHost ? kickParticipant : undefined}
          onAddFriend={addFriend}
          currentUserId={user?._id || ''}
        />
      </div>

      {/* Bottom Controls Bar */}
      <ControlsBar
        audioEnabled={webrtc.audioEnabled}
        videoEnabled={webrtc.videoEnabled}
        isScreenSharing={webrtc.isScreenSharing}
        onToggleAudio={webrtc.toggleAudio}
        onToggleVideo={webrtc.toggleVideo}
        onToggleScreenShare={webrtc.toggleScreenShare}
        onLeave={() => setShowLeaveConfirm(true)}
      />

      {/* Participants Panel (groupcall.md lines 254-275) */}
      <ParticipantsPanel
        isOpen={showParticipants}
        onClose={() => setShowParticipants(false)}
        participants={webrtc.peers}
        localUser={{
          _id: user?._id || '',
          username: user?.username || '',
          displayName: user?.displayName,
          profilePicture: user?.profilePicture,
        }}
        isLocalHost={isHost}
        localAudioEnabled={webrtc.audioEnabled}
        localVideoEnabled={webrtc.videoEnabled}
        maxParticipants={room?.maxParticipants || 5}
        onMuteParticipant={isHost ? muteParticipant : undefined}
        onKickParticipant={isHost ? kickParticipant : undefined}
        onAddFriend={addFriend}
        onInvite={() => setShowInvite(true)}
        currentUserId={user?._id || ''}
      />

      {/* Invite Modal (groupcall.md lines 276-296) */}
      <InviteModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        roomCode={code}
        roomName={room?.roomName || 'Room'}
      />

      {/* Leave Confirmation Modal */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeave}
        title="Leave Room"
        message="Are you sure you want to leave this room?"
        confirmText="Leave"
        cancelText="Stay"
        confirmVariant="danger"
      />
    </div>
  );
}
