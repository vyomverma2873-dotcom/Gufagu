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
import DeviceConflictModal from '@/components/room/DeviceConflictModal';
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
  const [isLeaving, setIsLeaving] = useState(false);
  const [kickCooldown, setKickCooldown] = useState(0); // Remaining cooldown seconds
  const [wasKicked, setWasKicked] = useState(false); // Track if user was in cooldown
  const [showDeviceConflict, setShowDeviceConflict] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [friendRequestToast, setFriendRequestToast] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
    const [exitMessage, setExitMessage] = useState<string | null>(null);
    
    // Loading states for action buttons
    const [loadingActions, setLoadingActions] = useState<{
      addingFriend: Set<string>;
      muting: Set<string>;
      kicking: Set<string>;
    }>({
      addingFriend: new Set(),
      muting: new Set(),
      kicking: new Set(),
    });

  // Generate or retrieve a unique session ID for this device/browser
  useEffect(() => {
    let id = localStorage.getItem('guftagu_session_id');
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('guftagu_session_id', id);
    }
    setSessionId(id);
  }, []);

  // Smooth transition to home page
  const navigateToHome = useCallback((message?: string) => {
    if (isLeaving) return; // Prevent multiple calls
    
    // Show exit message as in-app notification (no browser alert)
    if (message) {
      setExitMessage(message);
      // Keep message visible for 3 seconds, then start fade-out and redirect
      setTimeout(() => {
        setIsLeaving(true);
        setTimeout(() => {
          router.push('/');
        }, 500); // 500ms for fade-out animation
      }, 3000); // 3 seconds to read the message
    } else {
      // No message - immediate smooth transition
      setIsLeaving(true);
      setTimeout(() => {
        router.push('/');
      }, 300);
    }
  }, [isLeaving, router]);

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
    if (room && readyToJoin && !hasJoined && !isJoining && !showPassword && !passwordAttempted && !error && kickCooldown === 0) {
      // If room requires password, show password prompt directly (no API call needed)
      if (room.hasPassword) {
        setShowPassword(true);
        setPasswordAttempted(true);
      } else {
        // Non-password rooms: join directly
        joinRoom();
      }
    }
  }, [room, readyToJoin, hasJoined, isJoining, showPassword, passwordAttempted, error, kickCooldown]);

  // Hide header/footer when in room (full-screen mode)
  useEffect(() => {
    if (hasJoined) {
      document.body.classList.add('video-chat-active');
    }
    return () => {
      document.body.classList.remove('video-chat-active');
    };
  }, [hasJoined]);

  // Kick cooldown countdown timer
  useEffect(() => {
    if (kickCooldown <= 0) return;

    const timer = setInterval(() => {
      setKickCooldown(prev => {
        if (prev <= 1) {
          // Cooldown expired, try to join again
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [kickCooldown]);

  // Auto-retry join when cooldown expires (only if user was actually kicked)
  useEffect(() => {
    if (kickCooldown === 0 && wasKicked && room && !hasJoined && !isJoining && !error) {
      // Reset wasKicked flag and retry joining
      setWasKicked(false);
      // Small delay before retrying
      const retryTimer = setTimeout(() => {
        joinRoom();
      }, 500);
      return () => clearTimeout(retryTimer);
    }
  }, [kickCooldown, wasKicked, room, hasJoined, isJoining, error]);

  // Join room
  const joinRoom = async () => {
    if (!room) return;

    setIsJoining(true);
    setPasswordError(null);
    try {
      const response = await roomsApi.joinRoom(code, password, sessionId);
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
      if (err.response?.data?.deviceConflict) {
        // User is already in room on another device
        setShowDeviceConflict(true);
      } else if (err.response?.data?.requiresPassword) {
        setShowPassword(true);
        setPasswordAttempted(true);
      } else if (err.response?.data?.error === 'Invalid password') {
        setPasswordError('Incorrect password. Please try again.');
        setPassword('');
        setPasswordAttempted(true);
      } else if (err.response?.data?.kickCooldown) {
        // User was kicked and needs to wait
        console.log('[Room Join] Kick cooldown detected:', err.response.data.cooldownSeconds);
        setKickCooldown(err.response.data.cooldownSeconds || 30);
        setWasKicked(true);
      } else {
        setError(err.response?.data?.error || 'Failed to join room');
      }
    } finally {
      setIsJoining(false);
    }
  };

  // Force join - disconnect from other device and join here
  const handleForceJoin = async () => {
    if (!room) return;

    setIsJoining(true);
    setShowDeviceConflict(false);

    try {
      const response = await roomsApi.forceJoinRoom(code, password, sessionId);
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
      setError(err.response?.data?.error || 'Failed to join room');
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
        
        // Simple message without warnings - just redirect home
        navigateToHome('You have been kicked from the room');
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
        webrtc.cleanup();
        navigateToHome('Room was closed by the host');
      }
    };

    const handleForceDisconnect = (data: any) => {
      if (data.roomCode === code && data.userId === user?._id) {
        // Disconnected because user joined from another device
        webrtc.cleanup();
        if (socket) {
          socket.emit('room:leave', { roomCode: code });
        }
        navigateToHome(data.message || 'You have been disconnected because you joined from another device');
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
    socket.on('room:force-disconnect', handleForceDisconnect);
    socket.on('room:participant-joined', handleParticipantUpdate);
    socket.on('room:participant-left', handleParticipantUpdate);

    return () => {
      socket.off('room:host-action', handleHostAction);
      socket.off('room:closed', handleRoomClosed);
      socket.off('room:force-disconnect', handleForceDisconnect);
      socket.off('room:participant-joined', handleParticipantUpdate);
      socket.off('room:participant-left', handleParticipantUpdate);
    };
  }, [socket, hasJoined, code, router, webrtc, user?._id]);

  // Leave room
  const handleLeave = useCallback(async () => {
    if (isLeaving) return;
    
    try {
      webrtc.cleanup();
      await roomsApi.leaveRoom(code);
      
      if (socket) {
        socket.emit('room:leave', { roomCode: code });
      }
      
      navigateToHome();
    } catch (err) {
      console.error('Error leaving room:', err);
      navigateToHome();
    }
  }, [code, socket, webrtc, isLeaving, navigateToHome]);

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
    
    // Set loading state
    setLoadingActions(prev => ({
      ...prev,
      kicking: new Set(prev.kicking).add(userId)
    }));
    
    try {
      await roomsApi.kickParticipant(code, userId);
      // Also emit socket event for immediate UI update
      if (socket) {
        socket.emit('room:host-kick', { roomCode: code, targetUserId: userId });
      }
    } catch (err) {
      console.error('Failed to remove participant');
    } finally {
      setLoadingActions(prev => {
        const newKicking = new Set(prev.kicking);
        newKicking.delete(userId);
        return { ...prev, kicking: newKicking };
      });
    }
  };

  // Mute participant (host only)
  const muteParticipant = async (userId: string, mute: boolean) => {
    if (!isHost) return;
    
    // Set loading state
    setLoadingActions(prev => ({
      ...prev,
      muting: new Set(prev.muting).add(userId)
    }));
    
    try {
      await roomsApi.muteParticipant(code, userId, mute);
      // Also emit socket event for immediate UI update
      if (socket) {
        socket.emit('room:host-mute', { roomCode: code, targetUserId: userId, mute });
      }
    } catch (err) {
      console.error('Failed to mute participant');
    } finally {
      setLoadingActions(prev => {
        const newMuting = new Set(prev.muting);
        newMuting.delete(userId);
        return { ...prev, muting: newMuting };
      });
    }
  };

  // Add friend
  const addFriend = async (username: string) => {
    // Find participant by username to get their _id for loading state
    const participant = webrtc.peers.find(p => p.username === username);
    const participantId = participant?._id || username;
    
    // Set loading state
    setLoadingActions(prev => ({
      ...prev,
      addingFriend: new Set(prev.addingFriend).add(participantId)
    }));
    
    try {
      await friendsApi.sendRequest(username);
      setFriendRequestToast({
        show: true,
        message: `Friend request sent to ${username}`,
        type: 'success'
      });
      // Auto-hide after 3 seconds
      setTimeout(() => setFriendRequestToast(prev => ({...prev, show: false})), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to send friend request';
      setFriendRequestToast({
        show: true,
        message: errorMessage,
        type: 'error'
      });
      setTimeout(() => setFriendRequestToast(prev => ({...prev, show: false})), 3000);
      console.error('Failed to send friend request:', errorMessage);
    } finally {
      setLoadingActions(prev => {
        const newAddingFriend = new Set(prev.addingFriend);
        newAddingFriend.delete(participantId);
        return { ...prev, addingFriend: newAddingFriend };
      });
    }
  };

  // Show connecting state for any loading/joining phase (before joined)
  // Don't show if we're about to or currently showing password prompt or kick cooldown
  // Also show when isJoining is true (API call in progress) to prevent footer flash
  if ((authLoading || isLoading || isJoining || (readyToJoin && !hasJoined && !passwordAttempted)) && !error && !webrtc.error && !showPassword && kickCooldown === 0) {
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

  // Kick cooldown view - show countdown timer
  if (kickCooldown > 0) {
    return (
      <div className={`transition-all duration-300 ease-out ${
        isLeaving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
        <GalaxyBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="bg-neutral-900/70 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-white mb-2">Temporarily Blocked</h2>
            <p className="text-neutral-400 mb-6">
              You were kicked from this room. Please wait before rejoining.
            </p>
            
            {/* Countdown Timer */}
            <div className="mb-6">
              <div className="text-6xl font-mono font-bold text-violet-400 mb-2">
                {kickCooldown}
              </div>
              <p className="text-sm text-neutral-500">seconds remaining</p>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-neutral-800 rounded-full h-2 mb-6 overflow-hidden">
              <div 
                className="bg-violet-500 h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(kickCooldown / 30) * 100}%` }}
              />
            </div>
            
            <Button variant="outline" onClick={() => navigateToHome()} className="w-full">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error || webrtc.error) {
    return (
      <div className={`transition-all duration-300 ease-out ${
        isLeaving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
        <GalaxyBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
            <p className="text-neutral-400 mb-6">{error || webrtc.error}</p>
            <Button onClick={() => navigateToHome()}>Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  // Password prompt
  if (showPassword && !hasJoined) {
    return (
      <div className={`transition-all duration-300 ease-out ${
        isLeaving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
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
              <Button variant="outline" onClick={() => navigateToHome()} className="flex-1">
                Cancel
              </Button>
              <Button onClick={joinRoom} isLoading={isJoining} className="flex-1">
                Join Room
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // In-call view with custom WebRTC UI
  return (
    <div className={`fixed inset-0 flex flex-col bg-neutral-950 transition-all duration-300 ease-out ${
      isLeaving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
    }`}>
      {/* Muted by host notification */}
      {(mutedByHost || webrtc.mutedByHost) && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 px-4 py-2 rounded-xl animate-fade-in">
          You were muted by the host - You cannot unmute yourself
        </div>
      )}

      {/* Friend request toast notification */}
      {friendRequestToast.show && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl animate-fade-in transition-all duration-300 ${
          friendRequestToast.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/50 text-green-400'
            : 'bg-red-500/20 border border-red-500/50 text-red-400'
        }`}>
          {friendRequestToast.message}
        </div>
      )}

      {/* Exit message overlay (kick, room closed, etc.) */}
      {exitMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 max-w-md mx-4 text-center animate-scale-in">
            <div className="text-4xl mb-4">👋</div>
            <p className="text-white text-lg font-medium mb-2">{exitMessage}</p>
            <p className="text-neutral-400 text-sm">Redirecting to home...</p>
          </div>
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
                navigateToHome('This room has expired and will be closed.');
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
          loadingActions={loadingActions}
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
        loadingActions={loadingActions}
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

      {/* Device Conflict Modal */}
      <DeviceConflictModal
        isOpen={showDeviceConflict}
        onDisconnectOther={handleForceJoin}
        onCancel={() => setShowDeviceConflict(false)}
        isLoading={isJoining}
      />
    </div>
  );
}
