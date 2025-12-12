'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface IncomingCall {
  callId: string;
  from: {
    userId: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
  };
  callType: 'voice' | 'video';
}

interface CurrentCall {
  callId: string;
  peer?: {
    userId: string;
    username?: string;
    displayName?: string;
    socketId?: string;
    profilePicture?: string;
  };
  callType: 'voice' | 'video';
  isInitiator: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineCount: number;
  incomingCall: IncomingCall | null;
  currentCall: CurrentCall | null;
  peerSocketId: string | null;
  callType: 'voice' | 'video' | null;
  acceptCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  startCall: (friendId: string, friendInfo: { username: string; profilePicture?: string }, type: 'voice' | 'video') => void;
  callStatus: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'declined' | 'disconnected';
  callEndReason: string | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [currentCall, setCurrentCall] = useState<CurrentCall | null>(null);
  const [peerSocketId, setPeerSocketId] = useState<string | null>(null);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'declined' | 'disconnected'>('idle');
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [callEndReason, setCallEndReason] = useState<string | null>(null);
  const { token } = useAuth();
  
  // Refs to track status reset timers (so we can cancel them on new call)
  const callEndedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callDeclinedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callDisconnectedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial socket setup
  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected, socket id:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('authenticated', (data: any) => {
      console.log('[Socket] Authentication successful:', data);
    });

    socketInstance.on('auth_error', (data: any) => {
      console.error('[Socket] Authentication error:', data);
    });

    socketInstance.on('dm_receive', (data: any) => {
      console.log('[Socket Global] dm_receive event received:', data);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    socketInstance.on('user_count_update', (data: { count: number }) => {
      setOnlineCount(data.count);
    });

    // Connect socket
    if (!socketInstance.connected) {
      console.log('[Socket] Initiating connection...');
      socketInstance.connect();
    }

    // Heartbeat
    const heartbeatInterval = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit('heartbeat');
      }
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('user_count_update');
      socketInstance.off('authenticated');
      socketInstance.off('auth_error');
      socketInstance.off('dm_receive');
    };
  }, []); // Only run once on mount

  // Authenticate when token becomes available or changes
  useEffect(() => {
    if (socket && socket.connected && token) {
      console.log('[Socket] Token available, sending authenticate');
      socket.emit('authenticate', { token });
    }
  }, [socket, token]);

  // Re-authenticate on reconnect
  useEffect(() => {
    if (socket && isConnected && token) {
      console.log('[Socket] Reconnected, re-authenticating');
      socket.emit('authenticate', { token });
    }
  }, [socket, isConnected, token]);

  // Global call event listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: any) => {
      console.log('[Socket Global] Incoming call:', data);
      setIncomingCall({
        callId: data.callId,
        from: data.from,
        callType: data.callType,
      });
      setCallType(data.callType);
      setCallStatus('ringing');
    };

    const handleCallAccepted = (data: any) => {
      console.log('[Socket Global] Call accepted:', data);
      setPeerSocketId(data.by?.socketId || null);
      setCurrentCall(prev => prev ? {
        ...prev,
        peer: data.by,
      } : null);
      setCallStatus('connected');
    };

    const handleCallConnected = (data: any) => {
      console.log('[Socket Global] Call connected:', data);
      setPeerSocketId(data.peer?.socketId || null);
      setCurrentCall({
        callId: data.callId,
        peer: data.peer,
        callType: callType || 'voice',
        isInitiator: false,
      });
      setCallStatus('connected');
    };

    const handleCallDeclined = (data: any) => {
      console.log('[Socket Global] Call declined:', data);
      setCallStatus('declined');
      setCallEndReason(data.reason || 'Call was declined');
      setIncomingCall(null);
      setCurrentCall(null);
      setCurrentCallId(null);
      setPeerSocketId(null);
      setCallType(null);
      // Store timer ref so it can be cancelled if user starts new call
      callDeclinedTimerRef.current = setTimeout(() => {
        setCallStatus('idle');
        setCallEndReason(null);
        callDeclinedTimerRef.current = null;
      }, 5000);
    };

    const handleCallEnded = (data: any) => {
      console.log('[Socket Global] Call ended:', data);
      setCallStatus('ended');
      setCallEndReason(data.reason || null);
      setIncomingCall(null);
      setCurrentCall(null);
      setCurrentCallId(null);
      setPeerSocketId(null);
      setCallType(null);
      // Store timer ref so it can be cancelled if user starts new call
      callEndedTimerRef.current = setTimeout(() => {
        setCallStatus('idle');
        setCallEndReason(null);
        callEndedTimerRef.current = null;
      }, 2000);
    };

    const handleCallDisconnected = (data: any) => {
      console.log('[Socket Global] Call disconnected:', data);
      setCallStatus('disconnected');
      setCallEndReason(data.reason || 'Partner disconnected');
      setIncomingCall(null);
      setCurrentCall(null);
      setCurrentCallId(null);
      setPeerSocketId(null);
      setCallType(null);
      // Store timer ref so it can be cancelled if user starts new call
      callDisconnectedTimerRef.current = setTimeout(() => {
        setCallStatus('idle');
        setCallEndReason(null);
        callDisconnectedTimerRef.current = null;
      }, 3000);
    };

    const handleCallError = (data: any) => {
      console.error('[Socket Global] Call error:', data);
      setCallStatus('idle');
      setIncomingCall(null);
      setCurrentCall(null);
      setCurrentCallId(null);
      setPeerSocketId(null);
      setCallType(null);
    };

    const handleCallInitiated = (data: any) => {
      console.log('[Socket Global] Call initiated:', data);
      setCurrentCallId(data.callId);
      setCallType(data.callType);
      setCurrentCall({
        callId: data.callId,
        peer: data.to,
        callType: data.callType,
        isInitiator: true,
      });
      setCallStatus('calling');
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_connected', handleCallConnected);
    socket.on('call_declined', handleCallDeclined);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_disconnected', handleCallDisconnected);
    socket.on('call_error', handleCallError);
    socket.on('call_initiated', handleCallInitiated);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_connected', handleCallConnected);
      socket.off('call_declined', handleCallDeclined);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_disconnected', handleCallDisconnected);
      socket.off('call_error', handleCallError);
      socket.off('call_initiated', handleCallInitiated);
    };
  }, [socket, callType]);

  // Call action handlers
  const acceptCall = useCallback(() => {
    if (!socket || !incomingCall) return;
    console.log('[Socket] Accepting call:', incomingCall.callId);
    socket.emit('accept_call', {
      callId: incomingCall.callId,
      callerId: incomingCall.from.userId,
    });
    setCurrentCallId(incomingCall.callId);
    setCurrentCall({
      callId: incomingCall.callId,
      peer: incomingCall.from,
      callType: incomingCall.callType,
      isInitiator: false,
    });
    setCallType(incomingCall.callType);
    // Don't set 'connected' yet - wait for call_connected event with peer socket ID
    setCallStatus('calling');
    setIncomingCall(null);
  }, [socket, incomingCall]);

  const declineCall = useCallback(() => {
    if (!socket || !incomingCall) return;
    console.log('[Socket] Declining call:', incomingCall.callId);
    socket.emit('decline_call', {
      callId: incomingCall.callId,
      callerId: incomingCall.from.userId,
    });
    setIncomingCall(null);
    setCallType(null);
    setCallStatus('idle');
  }, [socket, incomingCall]);

  const endCall = useCallback(() => {
    if (!socket) return;
    console.log('[Socket] Ending call:', currentCallId);
    socket.emit('end_friend_call', { 
      callId: currentCallId,
      friendId: currentCall?.peer?.userId,
    });
    setCallStatus('idle');
    setCurrentCallId(null);
    setCurrentCall(null);
    setIncomingCall(null);
    setPeerSocketId(null);
    setCallType(null);
  }, [socket, currentCallId, currentCall]);

  // Start a call - immediately shows calling screen
  const startCall = useCallback((friendId: string, friendInfo: { username: string; profilePicture?: string }, type: 'voice' | 'video') => {
    if (!socket) {
      console.log('[Socket] Cannot start call - no socket');
      return;
    }
    
    // Clear any pending status reset timers from previous calls
    if (callEndedTimerRef.current) {
      clearTimeout(callEndedTimerRef.current);
      callEndedTimerRef.current = null;
    }
    if (callDeclinedTimerRef.current) {
      clearTimeout(callDeclinedTimerRef.current);
      callDeclinedTimerRef.current = null;
    }
    if (callDisconnectedTimerRef.current) {
      clearTimeout(callDisconnectedTimerRef.current);
      callDisconnectedTimerRef.current = null;
    }
    
    console.log('[Socket] Starting', type, 'call to', friendInfo.username);
    
    // Set calling state IMMEDIATELY for instant UI feedback
    setCallType(type);
    setCurrentCall({
      callId: `temp-${Date.now()}`, // Temporary ID until server responds
      peer: {
        userId: friendId,
        username: friendInfo.username,
        profilePicture: friendInfo.profilePicture,
      },
      callType: type,
      isInitiator: true,
    });
    setCallStatus('calling');
    
    // Emit to server
    socket.emit('call_friend', {
      friendId,
      callType: type,
    });
  }, [socket]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      onlineCount,
      incomingCall,
      currentCall,
      peerSocketId,
      callType,
      acceptCall,
      declineCall,
      endCall,
      startCall,
      callStatus,
      callEndReason,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
