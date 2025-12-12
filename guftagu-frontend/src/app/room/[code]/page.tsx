'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { 
  Copy, 
  Users, 
  Settings, 
  LogOut, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  MonitorUp,
  MessageSquare,
  UserPlus,
  Crown,
  MoreVertical,
  X,
  Check,
  Share2,
  Link as LinkIcon
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { roomsApi, friendsApi } from '@/lib/api';

interface Participant {
  _id: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  isHost: boolean;
  isMuted: boolean;
}

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
  participants: Participant[];
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
  
  // Daily.co state
  const [callFrame, setCallFrame] = useState<DailyCall | null>(null);
  const [dailyToken, setDailyToken] = useState<string | null>(null);
  const [dailyUrl, setDailyUrl] = useState<string | null>(null);
  const callContainerRef = useRef<HTMLDivElement>(null);
  
  // UI state
  const [showParticipants, setShowParticipants] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);

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
        setParticipants(response.data.room.participants);
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
      const { dailyCoRoomUrl, dailyToken: token, isHost: hostStatus } = response.data.room;
      
      setDailyUrl(dailyCoRoomUrl);
      setDailyToken(token);
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

  // Initialize Daily.co call frame
  useEffect(() => {
    if (!hasJoined || !dailyUrl || !callContainerRef.current) return;

    const initDaily = async () => {
      try {
        const frame = DailyIframe.createFrame(callContainerRef.current!, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '12px',
          },
          showLeaveButton: false,
          showFullscreenButton: true,
          showLocalVideo: true,
          showParticipantsBar: false,
        });

        // Join the call
        await frame.join({
          url: dailyUrl,
          token: dailyToken || undefined,
          userName: user?.displayName || user?.username || 'Anonymous',
        });

        setCallFrame(frame);

        // Event listeners
        frame.on('participant-joined', (event) => {
          console.log('Participant joined:', event);
        });

        frame.on('participant-left', (event) => {
          console.log('Participant left:', event);
        });

        frame.on('left-meeting', () => {
          handleLeave();
        });
      } catch (err) {
        console.error('Failed to initialize Daily call:', err);
        setError('Failed to connect to video call');
      }
    };

    initDaily();

    return () => {
      if (callFrame) {
        callFrame.destroy();
      }
    };
  }, [hasJoined, dailyUrl, dailyToken]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleParticipantJoined = (data: any) => {
      if (data.roomCode === code) {
        setParticipants(prev => [...prev.filter(p => p._id !== data.user._id), {
          _id: data.user._id,
          username: data.user.username,
          displayName: data.user.displayName,
          profilePicture: data.user.profilePicture,
          isHost: false,
          isMuted: false,
        }]);
        if (room) {
          setRoom(prev => prev ? { ...prev, currentParticipants: data.participantCount } : null);
        }
      }
    };

    const handleParticipantLeft = (data: any) => {
      if (data.roomCode === code) {
        setParticipants(prev => prev.filter(p => p._id !== data.userId));
        if (room) {
          setRoom(prev => prev ? { ...prev, currentParticipants: data.participantCount } : null);
        }
      }
    };

    const handleHostAction = (data: any) => {
      if (data.action === 'kick') {
        alert('You were removed from the room');
        handleLeave();
      } else if (data.action === 'mute') {
        console.log('You were muted by the host');
      } else if (data.action === 'unmute') {
        console.log('You were unmuted by the host');
      }
    };

    const handleRoomClosed = (data: any) => {
      if (data.roomCode === code) {
        alert('Room was closed by the host');
        router.push('/');
      }
    };

    socket.on('room:participant-joined', handleParticipantJoined);
    socket.on('room:participant-left', handleParticipantLeft);
    socket.on('room:host-action', handleHostAction);
    socket.on('room:closed', handleRoomClosed);

    return () => {
      socket.off('room:participant-joined', handleParticipantJoined);
      socket.off('room:participant-left', handleParticipantLeft);
      socket.off('room:host-action', handleHostAction);
      socket.off('room:closed', handleRoomClosed);
    };
  }, [socket, code, room, router]);

  // Leave room
  const handleLeave = async () => {
    try {
      if (callFrame) {
        await callFrame.leave();
        callFrame.destroy();
      }
      
      await roomsApi.leaveRoom(code);
      
      if (socket) {
        socket.emit('room:leave', { roomCode: code });
      }
      
      router.push('/');
    } catch (err) {
      console.error('Error leaving room:', err);
      router.push('/');
    }
  };

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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Room Not Found</h1>
          <p className="text-neutral-400 mb-6">{error}</p>
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

  // In-call view
  return (
    <div className="h-screen flex flex-col bg-neutral-950">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/80 border-b border-neutral-800">
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
          <button 
            onClick={() => setShowParticipants(!showParticipants)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              showParticipants ? 'bg-violet-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Users className="w-4 h-4" />
            {room?.currentParticipants}/{room?.maxParticipants}
          </button>
          <button 
            onClick={() => setShowLeaveConfirm(true)}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-900/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Leave
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 p-4">
          <div 
            ref={callContainerRef} 
            className="w-full h-full bg-neutral-900 rounded-xl overflow-hidden"
          />
        </div>

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-80 bg-neutral-900/80 border-l border-neutral-800 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participants ({participants.length})
            </h3>
            <div className="space-y-3">
              {participants.map((participant) => (
                <div 
                  key={participant._id}
                  className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-xl"
                >
                  <Avatar 
                    src={participant.profilePicture} 
                    alt={participant.displayName || participant.username}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate">
                        {participant.displayName || participant.username}
                      </span>
                      {participant.isHost && (
                        <Crown className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                    <span className="text-sm text-neutral-400">@{participant.username}</span>
                  </div>
                  {isHost && !participant.isHost && participant._id !== user?._id && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => muteParticipant(participant._id, !participant.isMuted)}
                        className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
                      >
                        {participant.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => kickParticipant(participant._id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
