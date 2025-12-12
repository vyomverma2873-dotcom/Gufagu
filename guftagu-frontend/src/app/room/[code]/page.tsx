'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Copy, Users, Check, Share2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import VideoGrid from '@/components/room/VideoGrid';
import ControlsBar from '@/components/room/ControlsBar';
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
  const [iceServers, setIceServers] = useState<RTCIceServer[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(false);

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

  // Join room
  const joinRoom = async () => {
    if (!room) return;

    setIsJoining(true);
    try {
      const response = await roomsApi.joinRoom(code, password);
      const { iceServers: servers, isHost: hostStatus } = response.data.room;
      
      setIceServers(servers || []);
      setIsHost(hostStatus);
      setHasJoined(true);
      
      // Join socket room
      if (socket) {
        socket.emit('room:join', { roomCode: code });
      }
    } catch (err: any) {
      if (err.response?.data?.requiresPassword) {
        setShowPassword(true);
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
        alert('You were removed from the room');
        handleLeave();
      } else if (data.action === 'mute') {
        // Host muted us - toggle our audio off
        webrtc.toggleAudio();
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
    try {
      await roomsApi.kickParticipant(code, userId);
    } catch (err) {
      console.error('Failed to remove participant');
    }
  };

  // Mute participant (host only)
  const muteParticipant = async (userId: string, mute: boolean) => {
    try {
      await roomsApi.muteParticipant(code, userId, mute);
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Spinner />
      </div>
    );
  }

  if (error || webrtc.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-neutral-400 mb-6">{error || webrtc.error}</p>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  // Password prompt
  if (showPassword && !hasJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="bg-neutral-900/70 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-8 max-w-md w-full">
          <h2 className="text-xl font-bold text-white mb-4">Password Required</h2>
          <p className="text-neutral-400 mb-6">This room requires a password to join.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
          />
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
    );
  }

  // Room preview (before joining)
  if (!hasJoined && room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="bg-neutral-900/70 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🎥</div>
            <h1 className="text-2xl font-bold text-white mb-2">{room.roomName}</h1>
            <p className="text-neutral-400">
              Hosted by {room.host.displayName || room.host.username}
            </p>
          </div>

          <div className="bg-neutral-800/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-neutral-400">Room Code</span>
              <button 
                onClick={copyCode}
                className="flex items-center gap-2 text-white font-mono bg-neutral-700/50 px-3 py-1 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                {code}
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Participants</span>
              <span className="text-white">{room.currentParticipants}/{room.maxParticipants}</span>
            </div>
          </div>

          {room.currentParticipants >= room.maxParticipants ? (
            <div className="text-center">
              <p className="text-yellow-400 mb-4">Room is full</p>
              <Button variant="outline" onClick={() => router.push('/')}>
                Go Back
              </Button>
            </div>
          ) : (
            <Button onClick={joinRoom} isLoading={isJoining} className="w-full">
              Join Room
            </Button>
          )}
        </div>
      </div>
    );
  }

  // In-call view with custom WebRTC UI
  return (
    <div className="h-screen flex flex-col bg-neutral-950 relative">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/80 border-b border-neutral-800 z-10">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-white">{room?.roomName}</span>
          <button 
            onClick={copyCode}
            className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm bg-neutral-800/50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Code: {code}
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={copyLink}
            className="flex items-center gap-2 text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Invite
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50 text-neutral-400">
            <Users className="w-4 h-4" />
            {webrtc.peers.length + 1}/{room?.maxParticipants || 10}
          </div>
        </div>
      </div>

      {/* Video Grid Area */}
      <div className="flex-1 overflow-hidden pb-24">
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
        chatEnabled={room?.settings.chatEnabled}
        showChat={showChat}
        onToggleAudio={webrtc.toggleAudio}
        onToggleVideo={webrtc.toggleVideo}
        onToggleScreenShare={webrtc.toggleScreenShare}
        onToggleChat={() => setShowChat(!showChat)}
        onLeave={() => setShowLeaveConfirm(true)}
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
