'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface Peer {
  socketId: string;
  _id: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  isHost: boolean;
  isMuted: boolean;
  stream?: MediaStream;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

interface UseWebRTCOptions {
  roomCode: string;
  socket: Socket | null;
  iceServers: RTCIceServer[];
  localUser: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
  };
  isHost: boolean;
}

export function useWebRTC({ roomCode, socket, iceServers, localUser, isHost }: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Initialize local media stream
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err: any) {
      console.error('Failed to get media devices:', err);
      setError(err.message || 'Failed to access camera/microphone');
      return null;
    }
  }, []);

  // Create peer connection for a specific peer
  const createPeerConnection = useCallback((targetSocketId: string, peerInfo: Partial<Peer>) => {
    if (peerConnectionsRef.current.has(targetSocketId)) {
      return peerConnectionsRef.current.get(targetSocketId)!;
    }

    const pc = new RTCPeerConnection({ iceServers });

    // Add local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc:ice-candidate', {
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${targetSocketId}:`, pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        // Attempt to restart ICE
        pc.restartIce();
      }
    };

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('Received remote track from:', targetSocketId);
      const [remoteStream] = event.streams;
      
      setPeers(prev => {
        const updated = new Map(prev);
        const existingPeer = updated.get(targetSocketId);
        updated.set(targetSocketId, {
          socketId: targetSocketId,
          _id: peerInfo._id || '',
          username: peerInfo.username || '',
          displayName: peerInfo.displayName,
          profilePicture: peerInfo.profilePicture,
          isHost: peerInfo.isHost || false,
          isMuted: peerInfo.isMuted || false,
          stream: remoteStream,
          audioEnabled: existingPeer?.audioEnabled ?? true,
          videoEnabled: existingPeer?.videoEnabled ?? true,
        });
        return updated;
      });
    };

    peerConnectionsRef.current.set(targetSocketId, pc);
    return pc;
  }, [iceServers, socket]);

  // Create and send offer
  const createOffer = useCallback(async (targetSocketId: string, peerInfo: Partial<Peer>) => {
    const pc = createPeerConnection(targetSocketId, peerInfo);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (socket) {
        socket.emit('webrtc:offer', {
          targetSocketId,
          offer,
        });
      }
    } catch (err) {
      console.error('Failed to create offer:', err);
    }
  }, [createPeerConnection, socket]);

  // Handle incoming offer
  const handleOffer = useCallback(async (data: { fromSocketId: string; fromUserId: string; offer: RTCSessionDescriptionInit }) => {
    const { fromSocketId, fromUserId, offer } = data;
    
    const pc = createPeerConnection(fromSocketId, { _id: fromUserId });
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      if (socket) {
        socket.emit('webrtc:answer', {
          targetSocketId: fromSocketId,
          answer,
        });
      }
    } catch (err) {
      console.error('Failed to handle offer:', err);
    }
  }, [createPeerConnection, socket]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (data: { fromSocketId: string; answer: RTCSessionDescriptionInit }) => {
    const { fromSocketId, answer } = data;
    const pc = peerConnectionsRef.current.get(fromSocketId);
    
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Failed to set remote description:', err);
      }
    }
  }, []);

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(async (data: { fromSocketId: string; candidate: RTCIceCandidateInit }) => {
    const { fromSocketId, candidate } = data;
    const pc = peerConnectionsRef.current.get(fromSocketId);
    
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Failed to add ICE candidate:', err);
      }
    }
  }, []);

  // Handle peer media state changes
  const handleMediaState = useCallback((data: { socketId: string; audioEnabled: boolean; videoEnabled: boolean }) => {
    const { socketId, audioEnabled, videoEnabled } = data;
    
    setPeers(prev => {
      const updated = new Map(prev);
      const peer = updated.get(socketId);
      if (peer) {
        updated.set(socketId, { ...peer, audioEnabled, videoEnabled });
      }
      return updated;
    });
  }, []);

  // Remove peer connection
  const removePeer = useCallback((socketId: string) => {
    const pc = peerConnectionsRef.current.get(socketId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(socketId);
    }
    
    setPeers(prev => {
      const updated = new Map(prev);
      updated.delete(socketId);
      return updated;
    });
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        
        // Notify peers
        if (socket) {
          socket.emit('webrtc:media-state', {
            roomCode,
            audioEnabled: audioTrack.enabled,
            videoEnabled,
          });
        }
      }
    }
  }, [socket, roomCode, videoEnabled]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        
        // Notify peers
        if (socket) {
          socket.emit('webrtc:media-state', {
            roomCode,
            audioEnabled,
            videoEnabled: videoTrack.enabled,
          });
        }
      }
    }
  }, [socket, roomCode, audioEnabled]);

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen share
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      
      // Replace screen track with camera track in all peer connections
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        peerConnectionsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
      
      setIsScreenSharing(false);
    } else {
      // Start screen share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Replace camera track with screen track in all peer connections
        peerConnectionsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });
        
        // Handle when user stops sharing via browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };
        
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Failed to start screen share:', err);
      }
    }
  }, [isScreenSharing]);

  // Cleanup
  const cleanup = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    
    // Stop screen stream
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    // Close all peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    setPeers(new Map());
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle existing peers when joining
    const handlePeers = async (data: { peers: Peer[] }) => {
      await initializeMedia();
      
      // Create offers to all existing peers
      for (const peer of data.peers) {
        await createOffer(peer.socketId, peer);
      }
    };

    // Handle new peer joining
    const handleParticipantJoined = (data: { socketId: string; user: Partial<Peer> }) => {
      console.log('New participant joined:', data);
      // The new peer will send us an offer, so we just wait
      setPeers(prev => {
        const updated = new Map(prev);
        updated.set(data.socketId, {
          socketId: data.socketId,
          _id: data.user._id || '',
          username: data.user.username || '',
          displayName: data.user.displayName,
          profilePicture: data.user.profilePicture,
          isHost: data.user.isHost || false,
          isMuted: data.user.isMuted || false,
          audioEnabled: true,
          videoEnabled: true,
        });
        return updated;
      });
    };

    // Handle peer leaving
    const handleParticipantLeft = (data: { socketId: string }) => {
      removePeer(data.socketId);
    };

    socket.on('room:peers', handlePeers);
    socket.on('room:participant-joined', handleParticipantJoined);
    socket.on('room:participant-left', handleParticipantLeft);
    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);
    socket.on('webrtc:media-state', handleMediaState);

    return () => {
      socket.off('room:peers', handlePeers);
      socket.off('room:participant-joined', handleParticipantJoined);
      socket.off('room:participant-left', handleParticipantLeft);
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
      socket.off('webrtc:media-state', handleMediaState);
    };
  }, [socket, initializeMedia, createOffer, handleOffer, handleAnswer, handleIceCandidate, handleMediaState, removePeer]);

  return {
    localStream,
    peers: Array.from(peers.values()),
    audioEnabled,
    videoEnabled,
    isScreenSharing,
    error,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    cleanup,
    initializeMedia,
  };
}
