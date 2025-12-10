'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, SwitchCamera, X, MoreVertical, Wifi, WifiOff } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

interface AudioLevels {
  local: number;
  remote: number;
}

type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'reconnecting';
type PipPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export default function VideoCallOverlay() {
  const { 
    socket, 
    callStatus, 
    incomingCall, 
    currentCall,
    peerSocketId,
    endCall,
    callType,
  } = useSocket();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [audioLevels, setAudioLevels] = useState<AudioLevels>({ local: 0, remote: 0 });
  const [waveformData, setWaveformData] = useState<number[]>(Array(12).fill(8));
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState<string>('connecting');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [micStatus, setMicStatus] = useState<'checking' | 'working' | 'silent' | 'error'>('checking');
  
  // New UI states
  const [showControls, setShowControls] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [pipPosition, setPipPosition] = useState<PipPosition>('bottom-right');
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('excellent');
  const [callEnded, setCallEnded] = useState(false);
  const [callEndDuration, setCallEndDuration] = useState(0);
  const [isFlippingCamera, setIsFlippingCamera] = useState(false);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  
  // Buffer for ICE candidates received before remote description is set
  const iceCandidateBuffer = useRef<RTCIceCandidateInit[]>([]);
  // Buffer for offer received before peer connection is ready - use STATE to trigger re-render
  const [pendingOffer, setPendingOffer] = useState<{ from: string; offer: RTCSessionDescriptionInit } | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localAudioAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAudioAnalyserRef = useRef<AnalyserNode | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pipRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      // Free TURN servers for NAT traversal
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ],
    iceCandidatePoolSize: 10,
  };

  // Store audio level from ScriptProcessor (Safari fallback)
  const audioLevelRef = useRef({ local: 0, remote: 0 });

  // Setup audio level monitoring with Safari compatibility
  const setupAudioAnalyser = useCallback((stream: MediaStream, isLocal: boolean) => {
    try {
      // Check if stream has audio tracks
      const audioTracks = stream.getAudioTracks();
      console.log('[Audio] Stream audio tracks:', audioTracks.length, audioTracks.map(t => ({ enabled: t.enabled, muted: t.muted, label: t.label })));
      
      if (audioTracks.length === 0) {
        console.warn('[Audio] No audio tracks in stream!');
        return;
      }
      
      // Safari compatibility: use webkitAudioContext if available
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.error('[Audio] AudioContext not supported!');
        return;
      }
      
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContextClass();
        console.log('[Audio] Created new AudioContext, state:', audioContextRef.current.state);
      }
      
      const audioContext = audioContextRef.current;
      
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        console.log('[Audio] AudioContext suspended, resuming...');
        audioContext.resume().then(() => {
          console.log('[Audio] AudioContext resumed, state:', audioContext.state);
        });
      }
      
      // Clone the stream to avoid issues with some browsers
      const audioOnlyStream = new MediaStream(stream.getAudioTracks());
      const source = audioContext.createMediaStreamSource(audioOnlyStream);
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      // Connect source -> analyser
      source.connect(analyser);
      
      // Safari workaround: Use ScriptProcessorNode to keep audio flowing
      // This is deprecated but necessary for Safari compatibility
      const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);
      
      // Calculate audio level in the script processor
      scriptProcessor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < input.length; i++) {
          sum += input[i] * input[i];
        }
        const rms = Math.sqrt(sum / input.length);
        const level = Math.min(100, rms * 300);
        
        if (isLocal) {
          audioLevelRef.current.local = level;
        } else {
          audioLevelRef.current.remote = level;
        }
      };
      
      if (isLocal) {
        localAudioAnalyserRef.current = analyser;
        setAudioEnabled(true);
        console.log('[Audio] Local analyser setup complete with silent output');
      } else {
        remoteAudioAnalyserRef.current = analyser;
        console.log('[Audio] Remote analyser setup complete');
      }
    } catch (error) {
      console.error('[Audio] Failed to setup analyser:', error);
    }
  }, []);

  // Update audio levels for visualization using requestAnimationFrame
  useEffect(() => {
    if (callStatus !== 'connected' && callStatus !== 'calling') return;

    let frameCount = 0;
    const updateLevels = () => {
      // Use ScriptProcessor levels primarily (more reliable in Safari)
      let localLevel = audioLevelRef.current.local;
      let remoteLevel = audioLevelRef.current.remote;
      
      // Fallback to analyser if ScriptProcessor gives 0
      if (localLevel === 0 && localAudioAnalyserRef.current) {
        const dataArray = new Uint8Array(localAudioAnalyserRef.current.fftSize);
        localAudioAnalyserRef.current.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const value = (dataArray[i] - 128) / 128;
          sum += value * value;
        }
        localLevel = Math.min(100, Math.sqrt(sum / dataArray.length) * 200);
      }
      
      if (remoteLevel === 0 && remoteAudioAnalyserRef.current) {
        const dataArray = new Uint8Array(remoteAudioAnalyserRef.current.fftSize);
        remoteAudioAnalyserRef.current.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const value = (dataArray[i] - 128) / 128;
          sum += value * value;
        }
        remoteLevel = Math.min(100, Math.sqrt(sum / dataArray.length) * 200);
      }
      
      // Log every 60 frames (~1s)
      if (frameCount % 60 === 0) {
        console.log('[Audio] Levels - local:', localLevel.toFixed(1), 'remote:', remoteLevel.toFixed(1));
      }
      
      setAudioLevels({
        local: localLevel,
        remote: remoteLevel,
      });
      
      // Generate waveform data based on audio level
      const generateWaveform = (level: number): number[] => {
        const result: number[] = [];
        for (let i = 0; i < 12; i++) {
          const variation = 0.8 + Math.sin(Date.now() / 100 + i) * 0.2 + Math.random() * 0.1;
          const barHeight = Math.max(8, (level / 100) * 64 * variation);
          result.push(barHeight);
        }
        return result;
      };
      
      // Use the higher level for waveform display
      const displayLevel = remoteStream ? remoteLevel : localLevel;
      setWaveformData(generateWaveform(displayLevel));

      frameCount++;
      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    console.log('[Audio] Starting animation loop, localStream:', !!localStream, 'remoteStream:', !!remoteStream);
    animationFrameRef.current = requestAnimationFrame(updateLevels);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [callStatus, localStream, remoteStream]);

  // Sync video elements with streams - aggressive approach
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log('[Video] Setting local video srcObject, tracks:', localStream.getVideoTracks().length);
      localVideoRef.current.srcObject = localStream;
      // Force play and ensure tracks are enabled
      localStream.getVideoTracks().forEach(track => {
        track.enabled = true;
      });
      localVideoRef.current.play().catch(e => console.log('[Video] Local play error:', e));
    }
  }, [localStream, callStatus, isVideoEnabled]);

  // Separate effect for remote video with retry mechanism
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('[Video] Setting remote video srcObject, tracks:', remoteStream.getVideoTracks().length);
      
      // Ensure all remote tracks are enabled
      remoteStream.getTracks().forEach(track => {
        track.enabled = true;
        console.log('[Video] Remote track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
      });
      
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Retry play multiple times to handle browser restrictions
      const tryPlay = async (attempts = 3) => {
        for (let i = 0; i < attempts; i++) {
          try {
            await remoteVideoRef.current?.play();
            console.log('[Video] Remote video playing successfully');
            break;
          } catch (e) {
            console.log(`[Video] Remote play attempt ${i + 1} failed:`, e);
            await new Promise(r => setTimeout(r, 500));
          }
        }
      };
      
      tryPlay();
      
      // Clear remoteCameraOff if we have video tracks
      if (remoteStream.getVideoTracks().length > 0) {
        setRemoteCameraOff(false);
      }
    }
  }, [remoteStream, callStatus, connectionState]);

  // Auto-hide controls after 3 seconds of inactivity
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (callStatus === 'connected') {
        setShowControls(false);
      }
    }, 3000);
  }, [callStatus]);

  useEffect(() => {
    if (callStatus === 'connected') {
      resetControlsTimeout();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [callStatus, resetControlsTimeout]);

  // Handle screen interaction to show controls
  const handleScreenInteraction = () => {
    resetControlsTimeout();
  };

  // Monitor connection quality from peer connection stats
  useEffect(() => {
    if (!peerConnectionRef.current || connectionState !== 'connected') return;
    
    const checkQuality = async () => {
      try {
        const stats = await peerConnectionRef.current?.getStats();
        if (!stats) return;
        
        let packetsLost = 0;
        let packetsReceived = 0;
        let roundTripTime = 0;
        
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            packetsLost = report.packetsLost || 0;
            packetsReceived = report.packetsReceived || 0;
          }
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            roundTripTime = report.currentRoundTripTime || 0;
          }
        });
        
        const lossRate = packetsReceived > 0 ? packetsLost / (packetsLost + packetsReceived) : 0;
        
        if (lossRate > 0.1 || roundTripTime > 0.5) {
          setConnectionQuality('poor');
        } else if (lossRate > 0.05 || roundTripTime > 0.2) {
          setConnectionQuality('good');
        } else {
          setConnectionQuality('excellent');
        }
      } catch (error) {
        console.error('[WebRTC] Error getting stats:', error);
      }
    };
    
    const interval = setInterval(checkQuality, 5000);
    return () => clearInterval(interval);
  }, [connectionState]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      setCallDuration(0);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callStatus]);

  // Helper function to wait for tracks to be truly active
  const waitForTracksReady = useCallback(async (stream: MediaStream): Promise<boolean> => {
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];
    
    console.log('[Media] Waiting for tracks to be ready...');
    
    // Wait for video track to produce frames (if present)
    if (videoTrack) {
      // Check if track is live and not muted
      let attempts = 0;
      while (attempts < 10 && (videoTrack.muted || videoTrack.readyState !== 'live')) {
        console.log(`[Media] Video track not ready, attempt ${attempts + 1}, muted:`, videoTrack.muted, 'readyState:', videoTrack.readyState);
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
      
      // Additional wait for video to actually produce frames
      await new Promise(r => setTimeout(r, 300));
      console.log('[Media] Video track ready check complete, muted:', videoTrack.muted, 'readyState:', videoTrack.readyState);
    }
    
    // Same for audio
    if (audioTrack) {
      let attempts = 0;
      while (attempts < 10 && (audioTrack.muted || audioTrack.readyState !== 'live')) {
        console.log(`[Media] Audio track not ready, attempt ${attempts + 1}`);
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
      console.log('[Media] Audio track ready check complete, muted:', audioTrack.muted, 'readyState:', audioTrack.readyState);
    }
    
    return true;
  }, []);

  // Initialize local media early (when call starts or connects)
  useEffect(() => {
    console.log('[VideoCallOverlay] Media effect triggered, callStatus:', callStatus, 'callType:', callType, 'localStream:', !!localStream);
    
    if (callStatus !== 'connected' && callStatus !== 'calling') {
      console.log('[VideoCallOverlay] Skipping - not in call state');
      return;
    }
    if (localStream) {
      console.log('[VideoCallOverlay] Skipping - already have stream');
      return;
    }

    const initLocalMedia = async () => {
      try {
        console.log('[Media] Requesting getUserMedia, callType:', callType);
        
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error('[Media] getUserMedia not available!');
          setMicStatus('error');
          return;
        }
        
        // Request media with proper constraints
        const constraints: MediaStreamConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: callType === 'video' ? {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          } : false,
        };
        
        console.log('[Media] Requesting with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        console.log('[Media] getUserMedia success, stream:', stream.id);
        console.log('[Media] Video tracks:', stream.getVideoTracks().length);
        console.log('[Media] Audio tracks:', stream.getAudioTracks().length);
        
        // Explicitly enable all tracks
        stream.getTracks().forEach(track => {
          track.enabled = true;
          console.log('[Media] Track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
        });
        
        // Wait for tracks to be truly active before proceeding
        await waitForTracksReady(stream);
        
        // Log video track details
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          console.log('[Media] Video track settings:', videoTrack.getSettings());
          console.log('[Media] Video track enabled:', videoTrack.enabled, 'muted:', videoTrack.muted, 'readyState:', videoTrack.readyState);
          // Ensure video is enabled
          videoTrack.enabled = true;
          setIsVideoEnabled(true);
        }
        
        // Set video element BEFORE setting state to ensure it's ready
        if (localVideoRef.current && callType === 'video') {
          console.log('[Media] Setting local video element srcObject');
          localVideoRef.current.srcObject = stream;
          try {
            await localVideoRef.current.play();
            console.log('[Media] Local video playing');
          } catch (e) {
            console.log('[Media] Local video play error:', e);
          }
        }
        
        // Setup audio analyser for local stream
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          console.log('[Media] Audio track settings:', audioTrack.getSettings());
          console.log('[Media] Audio track enabled:', audioTrack.enabled, 'muted:', audioTrack.muted, 'readyState:', audioTrack.readyState);
          // Ensure audio is enabled
          audioTrack.enabled = true;
          setIsAudioEnabled(true);
          
          // List all available audio devices
          navigator.mediaDevices.enumerateDevices().then(devices => {
            const audioInputs = devices.filter(d => d.kind === 'audioinput');
            console.log('[Media] Available microphones:', audioInputs.map(d => ({ label: d.label, deviceId: d.deviceId })));
          });
        }
        setupAudioAnalyser(stream, true);
        
        // NOW set the stream state - this triggers WebRTC init
        setLocalStream(stream);
        
        // Test microphone after a short delay
        setTimeout(() => {
          if (localAudioAnalyserRef.current) {
            const testData = new Uint8Array(localAudioAnalyserRef.current.fftSize);
            localAudioAnalyserRef.current.getByteTimeDomainData(testData);
            const hasAudio = testData.some(v => v !== 128);
            setMicStatus(hasAudio ? 'working' : 'silent');
            console.log('[Media] Mic test:', hasAudio ? 'WORKING' : 'SILENT - check your microphone!');
          }
        }, 2000);
        console.log('[Media] Local stream ready with', stream.getTracks().length, 'tracks');
      } catch (error) {
        console.error('[Media] Failed to get local stream:', error);
        // If video fails, try audio only
        if (callType === 'video') {
          console.log('[Media] Retrying with audio only...');
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            await waitForTracksReady(audioStream);
            setLocalStream(audioStream);
            setIsVideoEnabled(false);
            setupAudioAnalyser(audioStream, true);
          } catch (audioError) {
            console.error('[Media] Audio-only fallback also failed:', audioError);
          }
        }
      }
    };

    initLocalMedia();
  }, [callStatus, callType, localStream, setupAudioAnalyser, waitForTracksReady]);

  // Initialize WebRTC when connected and have peer socket
  useEffect(() => {
    if (callStatus !== 'connected' || !socket || !peerSocketId || !localStream) return;
    if (peerConnectionRef.current) return; // Already have connection

    const initWebRTC = async () => {
      try {
        console.log('[WebRTC] Initializing with peerSocketId:', peerSocketId);

        // Create peer connection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Ensure all local tracks are enabled before adding
        localStream.getTracks().forEach(track => {
          track.enabled = true;
          console.log('[WebRTC] Enabling track before add:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
        });

        // Add local tracks to connection with proper sender handling
        const senders: RTCRtpSender[] = [];
        console.log('[WebRTC] Adding', localStream.getTracks().length, 'local tracks');
        localStream.getTracks().forEach(track => {
          console.log('[WebRTC] Adding track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
          const sender = pc.addTrack(track, localStream);
          senders.push(sender);
        });

        // Handle incoming tracks
        pc.ontrack = (event) => {
          console.log('[WebRTC] ====== RECEIVED REMOTE TRACK ======');
          console.log('[WebRTC] Track kind:', event.track.kind);
          console.log('[WebRTC] Track enabled:', event.track.enabled);
          console.log('[WebRTC] Track readyState:', event.track.readyState);
          console.log('[WebRTC] Track muted:', event.track.muted);
          console.log('[WebRTC] Streams count:', event.streams.length);
          
          if (event.streams.length === 0) {
            console.error('[WebRTC] No streams in ontrack event!');
            return;
          }
          
          const [stream] = event.streams;
          console.log('[WebRTC] Remote stream ID:', stream.id);
          console.log('[WebRTC] Remote stream tracks:', stream.getTracks().map(t => ({ 
            kind: t.kind, 
            enabled: t.enabled, 
            readyState: t.readyState,
            muted: t.muted,
            id: t.id
          })));
          
          // Ensure all tracks in the stream are enabled
          stream.getTracks().forEach(track => {
            track.enabled = true;
            console.log('[WebRTC] Enabled remote track:', track.kind);
          });
          
          // Set remote stream state
          setRemoteStream(stream);
          setRemoteCameraOff(false);
          
          // Immediately set video element with retry
          const setRemoteVideo = async () => {
            if (remoteVideoRef.current) {
              console.log('[WebRTC] Setting remote video srcObject');
              remoteVideoRef.current.srcObject = stream;
              
              // Multiple play attempts
              for (let i = 0; i < 3; i++) {
                try {
                  await remoteVideoRef.current.play();
                  console.log('[WebRTC] Remote video playing successfully!');
                  break;
                } catch (e) {
                  console.log(`[WebRTC] Remote play attempt ${i + 1} failed:`, e);
                  await new Promise(r => setTimeout(r, 300));
                }
              }
            } else {
              console.warn('[WebRTC] Remote video ref not available yet, will retry...');
              // Retry after a short delay
              setTimeout(setRemoteVideo, 200);
            }
          };
          
          setRemoteVideo();
          
          // Setup audio analyser for remote stream
          setupAudioAnalyser(stream, false);
          
          // Listen for track ended
          event.track.onended = () => {
            console.log('[WebRTC] Remote track ended:', event.track.kind);
          };
          
          event.track.onmute = () => {
            console.log('[WebRTC] Remote track muted:', event.track.kind);
          };
          
          event.track.onunmute = () => {
            console.log('[WebRTC] Remote track unmuted:', event.track.kind);
          };
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('[WebRTC] Sending ICE candidate:', event.candidate.candidate?.substring(0, 50));
            socket.emit('friend_call_ice_candidate', {
              to: peerSocketId,
              candidate: event.candidate,
            });
          } else {
            console.log('[WebRTC] ICE gathering complete');
          }
        };
        
        // Monitor ICE connection state (critical for debugging)
        pc.oniceconnectionstatechange = () => {
          console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
          if (pc.iceConnectionState === 'failed') {
            console.error('[WebRTC] ICE connection failed! Attempting ICE restart...');
            // Try to restart ICE
            pc.restartIce();
          }
          if (pc.iceConnectionState === 'disconnected') {
            console.warn('[WebRTC] ICE disconnected, may recover automatically');
          }
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            console.log('[WebRTC] ICE connected! Media should flow now.');
          }
        };
        
        // Monitor ICE gathering state
        pc.onicegatheringstatechange = () => {
          console.log('[WebRTC] ICE gathering state:', pc.iceGatheringState);
        };
        
        // Monitor signaling state
        pc.onsignalingstatechange = () => {
          console.log('[WebRTC] Signaling state:', pc.signalingState);
        };

        // Monitor connection state
        pc.onconnectionstatechange = () => {
          console.log('[WebRTC] Connection state:', pc.connectionState);
          setConnectionState(pc.connectionState);
          
          // When connected, verify tracks are transmitting and refresh if needed
          if (pc.connectionState === 'connected') {
            console.log('[WebRTC] Connected! Verifying and refreshing senders...');
            pc.getSenders().forEach(async (sender) => {
              if (sender.track) {
                console.log('[WebRTC] Sender track:', sender.track.kind, 'enabled:', sender.track.enabled, 'readyState:', sender.track.readyState, 'muted:', sender.track.muted);
                // Ensure track is enabled
                sender.track.enabled = true;
                
                // If video track appears inactive, refresh it
                if (sender.track.kind === 'video' && (sender.track.muted || sender.track.readyState !== 'live')) {
                  console.log('[WebRTC] Video track appears inactive, attempting refresh...');
                  try {
                    const newStream = await navigator.mediaDevices.getUserMedia({
                      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                      audio: false
                    });
                    const newTrack = newStream.getVideoTracks()[0];
                    if (newTrack) {
                      newTrack.enabled = true;
                      await sender.replaceTrack(newTrack);
                      console.log('[WebRTC] Video track refreshed successfully');
                      // Update local stream and video element
                      if (localStream) {
                        const oldTrack = localStream.getVideoTracks()[0];
                        if (oldTrack) {
                          localStream.removeTrack(oldTrack);
                          oldTrack.stop();
                        }
                        localStream.addTrack(newTrack);
                        if (localVideoRef.current) {
                          localVideoRef.current.srcObject = localStream;
                          localVideoRef.current.play().catch(() => {});
                        }
                      }
                    }
                  } catch (e) {
                    console.error('[WebRTC] Failed to refresh video track:', e);
                  }
                }
                
                // Same for audio
                if (sender.track.kind === 'audio' && (sender.track.muted || sender.track.readyState !== 'live')) {
                  console.log('[WebRTC] Audio track appears inactive, attempting refresh...');
                  try {
                    const newStream = await navigator.mediaDevices.getUserMedia({
                      audio: { echoCancellation: true, noiseSuppression: true },
                      video: false
                    });
                    const newTrack = newStream.getAudioTracks()[0];
                    if (newTrack) {
                      newTrack.enabled = true;
                      await sender.replaceTrack(newTrack);
                      console.log('[WebRTC] Audio track refreshed successfully');
                      // Update local stream
                      if (localStream) {
                        const oldTrack = localStream.getAudioTracks()[0];
                        if (oldTrack) {
                          localStream.removeTrack(oldTrack);
                          oldTrack.stop();
                        }
                        localStream.addTrack(newTrack);
                      }
                    }
                  } catch (e) {
                    console.error('[WebRTC] Failed to refresh audio track:', e);
                  }
                }
              }
            });
          }
        };
        
        // Monitor negotiation needed
        pc.onnegotiationneeded = async () => {
          console.log('[WebRTC] Negotiation needed');
          // Only initiator handles renegotiation
          if (currentCall?.isInitiator && pc.signalingState === 'stable') {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('friend_call_offer', {
                to: peerSocketId,
                offer: pc.localDescription,
              });
              console.log('[WebRTC] Sent renegotiation offer');
            } catch (e) {
              console.error('[WebRTC] Renegotiation error:', e);
            }
          }
        };

        // Only initiator sends offer immediately
        if (currentCall?.isInitiator) {
          console.log('[WebRTC] Creating offer...');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('friend_call_offer', {
            to: peerSocketId,
            offer: pc.localDescription,
          });
          console.log('[WebRTC] Sent offer to:', peerSocketId);
        } else {
          console.log('[WebRTC] Non-initiator waiting for offer...');
        }

      } catch (error) {
        console.error('[WebRTC] Error:', error);
        setConnectionState('failed');
      }
    };

    initWebRTC();

    return () => {
      // Cleanup
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [callStatus, socket, peerSocketId, currentCall, localStream, setupAudioAnalyser]);

  // Track refresh flag to prevent multiple refreshes
  const trackRefreshedRef = useRef(false);
  
  // Proactive track refresh after connection - fallback mechanism
  useEffect(() => {
    // Only run once when connected for the first time with a peer connection
    if (connectionState !== 'connected' || !peerConnectionRef.current || !localStream || trackRefreshedRef.current) {
      return;
    }
    
    // Mark as refreshed to prevent running again
    trackRefreshedRef.current = true;
    
    console.log('[WebRTC] Proactive track refresh - ensuring media is flowing');
    
    // Delay refresh slightly to ensure connection is stable
    const refreshTimer = setTimeout(async () => {
      const pc = peerConnectionRef.current;
      if (!pc || pc.connectionState !== 'connected') return;
      
      console.log('[WebRTC] Executing proactive track refresh...');
      
      // Refresh video track regardless of state (force fresh stream)
      if (callType === 'video') {
        const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (videoSender) {
          try {
            console.log('[WebRTC] Refreshing video sender track...');
            const newStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: false
            });
            const newVideoTrack = newStream.getVideoTracks()[0];
            if (newVideoTrack) {
              newVideoTrack.enabled = true;
              
              // Wait for track to be truly ready
              await new Promise(r => setTimeout(r, 200));
              
              await videoSender.replaceTrack(newVideoTrack);
              console.log('[WebRTC] Video sender track replaced');
              
              // Update local stream
              const oldVideoTrack = localStream.getVideoTracks()[0];
              if (oldVideoTrack) {
                localStream.removeTrack(oldVideoTrack);
                oldVideoTrack.stop();
              }
              localStream.addTrack(newVideoTrack);
              
              // Update video element
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
                await localVideoRef.current.play().catch(() => {});
              }
            }
          } catch (e) {
            console.error('[WebRTC] Proactive video refresh error:', e);
          }
        }
      }
      
      // Refresh audio track regardless of state
      const audioSender = pc.getSenders().find(s => s.track?.kind === 'audio');
      if (audioSender) {
        try {
          console.log('[WebRTC] Refreshing audio sender track...');
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: false
          });
          const newAudioTrack = newStream.getAudioTracks()[0];
          if (newAudioTrack) {
            newAudioTrack.enabled = isAudioEnabled;
            
            await audioSender.replaceTrack(newAudioTrack);
            console.log('[WebRTC] Audio sender track replaced');
            
            // Update local stream
            const oldAudioTrack = localStream.getAudioTracks()[0];
            if (oldAudioTrack) {
              localStream.removeTrack(oldAudioTrack);
              oldAudioTrack.stop();
            }
            localStream.addTrack(newAudioTrack);
            
            // Update audio analyser
            setupAudioAnalyser(localStream, true);
          }
        } catch (e) {
          console.error('[WebRTC] Proactive audio refresh error:', e);
        }
      }
      
      console.log('[WebRTC] Proactive track refresh complete');
    }, 1000); // Wait 1 second after connection before refreshing
    
    return () => clearTimeout(refreshTimer);
  }, [connectionState, localStream, callType, facingMode, isAudioEnabled, setupAudioAnalyser]);

  // Reset refresh flag when call ends
  useEffect(() => {
    if (callStatus === 'idle' || callStatus === 'ended') {
      trackRefreshedRef.current = false;
    }
  }, [callStatus]);

  // Process pending offer when PC is ready (separate effect to avoid race conditions)
  useEffect(() => {
    if (!pendingOffer || !peerConnectionRef.current || !socket) return;
    
    const processPendingOffer = async () => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      
      console.log('[WebRTC] Processing pending offer from:', pendingOffer.from);
      const offerData = pendingOffer;
      setPendingOffer(null);
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offerData.offer));
        
        // Flush buffered ICE candidates
        console.log('[WebRTC] Flushing', iceCandidateBuffer.current.length, 'buffered ICE candidates');
        for (const candidate of iceCandidateBuffer.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('[WebRTC] Error adding buffered ICE candidate:', e);
          }
        }
        iceCandidateBuffer.current = [];
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('friend_call_answer', {
          to: offerData.from,
          answer: pc.localDescription,
        });
        console.log('[WebRTC] Sent answer to:', offerData.from);
      } catch (error) {
        console.error('[WebRTC] Error processing pending offer:', error);
      }
    };
    
    processPendingOffer();
  }, [pendingOffer, socket]);

  // Handle WebRTC signaling messages
  useEffect(() => {
    if (!socket) return;

    const flushIceCandidates = async (pc: RTCPeerConnection) => {
      console.log('[WebRTC] Flushing', iceCandidateBuffer.current.length, 'buffered ICE candidates');
      for (const candidate of iceCandidateBuffer.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('[WebRTC] Error adding buffered ICE candidate:', error);
        }
      }
      iceCandidateBuffer.current = [];
    };

    const handleOffer = async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] ====== RECEIVED OFFER ======');
      console.log('[WebRTC] From socket:', data.from);
      console.log('[WebRTC] Offer type:', data.offer?.type);
      console.log('[WebRTC] PC exists:', !!peerConnectionRef.current);
      
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.log('[WebRTC] No peer connection yet, buffering offer');
        setPendingOffer(data);
        return;
      }

      try {
        console.log('[WebRTC] Setting remote description (offer)...');
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        console.log('[WebRTC] Remote description set successfully');
        
        await flushIceCandidates(pc);
        
        // Verify local tracks are added and enabled before answering
        console.log('[WebRTC] Senders before answer:', pc.getSenders().map(s => ({ kind: s.track?.kind, enabled: s.track?.enabled })));
        
        console.log('[WebRTC] Creating answer...');
        const answer = await pc.createAnswer();
        console.log('[WebRTC] Answer created, setting local description...');
        await pc.setLocalDescription(answer);
        
        console.log('[WebRTC] Sending answer to:', data.from);
        socket.emit('friend_call_answer', {
          to: data.from,
          answer: pc.localDescription,
        });
        console.log('[WebRTC] Answer sent successfully');
        
        // Re-enable tracks after answer is sent
        pc.getSenders().forEach(sender => {
          if (sender.track) {
            sender.track.enabled = true;
            console.log('[WebRTC] Re-enabled sender track:', sender.track.kind);
          }
        });
      } catch (error) {
        console.error('[WebRTC] Error handling offer:', error);
      }
    };

    const handleAnswer = async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] ====== RECEIVED ANSWER ======');
      console.log('[WebRTC] From socket:', data.from);
      console.log('[WebRTC] Answer type:', data.answer?.type);
      
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error('[WebRTC] No peer connection for answer!');
        return;
      }
      
      try {
        console.log('[WebRTC] Current signaling state:', pc.signalingState);
        console.log('[WebRTC] Setting remote description (answer)...');
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log('[WebRTC] Remote description (answer) set successfully');
        
        await flushIceCandidates(pc);
        console.log('[WebRTC] Answer processed successfully');
        
        // Ensure all sender tracks are enabled after answer
        pc.getSenders().forEach(sender => {
          if (sender.track) {
            sender.track.enabled = true;
            console.log('[WebRTC] Enabled sender track after answer:', sender.track.kind);
          }
        });
        
        // Log connection details
        console.log('[WebRTC] Senders:', pc.getSenders().map(s => ({ kind: s.track?.kind, enabled: s.track?.enabled, readyState: s.track?.readyState })));
        console.log('[WebRTC] Receivers:', pc.getReceivers().map(r => ({ kind: r.track?.kind, enabled: r.track?.enabled, readyState: r.track?.readyState })));
        console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
        console.log('[WebRTC] Connection state:', pc.connectionState);
      } catch (error) {
        console.error('[WebRTC] Error handling answer:', error);
      }
    };

    const handleIceCandidate = async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      console.log('[WebRTC] ====== RECEIVED ICE CANDIDATE ======');
      console.log('[WebRTC] From:', data.from);
      console.log('[WebRTC] Candidate:', data.candidate?.candidate?.substring(0, 60));
      
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.log('[WebRTC] No peer connection, buffering ICE candidate');
        iceCandidateBuffer.current.push(data.candidate);
        return;
      }
      
      // Check if remote description is set
      if (!pc.remoteDescription) {
        console.log('[WebRTC] Remote description not set, buffering ICE candidate');
        iceCandidateBuffer.current.push(data.candidate);
        return;
      }
      
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('[WebRTC] ICE candidate added successfully');
      } catch (error) {
        console.error('[WebRTC] Error adding ICE candidate:', error);
      }
    };

    socket.on('friend_call_offer', handleOffer);
    socket.on('friend_call_answer', handleAnswer);
    socket.on('friend_call_ice_candidate', handleIceCandidate);

    return () => {
      socket.off('friend_call_offer', handleOffer);
      socket.off('friend_call_answer', handleAnswer);
      socket.off('friend_call_ice_candidate', handleIceCandidate);
    };
  }, [socket]);

  // Cleanup streams on unmount or call end
  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      remoteStream?.getTracks().forEach(track => track.stop());
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [localStream, remoteStream]);

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const flipCamera = async () => {
    if (!localStream || isFlippingCamera) return;
    
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    console.log('[Camera] Flipping to:', newFacingMode);
    
    // Start flip animation
    setIsFlippingCamera(true);
    
    try {
      // Stop current video track
      const currentVideoTrack = localStream.getVideoTracks()[0];
      if (currentVideoTrack) {
        currentVideoTrack.stop();
      }
      
      // Wait for fade out animation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Get new video stream with different camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });
      
      const newVideoTrack = newStream.getVideoTracks()[0];
      
      // Replace the track in the peer connection
      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current.getSenders().find(
          s => s.track?.kind === 'video'
        );
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }
      
      // Update local stream
      localStream.removeTrack(currentVideoTrack);
      localStream.addTrack(newVideoTrack);
      
      // Update local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      
      setFacingMode(newFacingMode);
      console.log('[Camera] Successfully flipped to:', newFacingMode);
      
      // Wait for fade in animation
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('[Camera] Failed to flip camera:', error);
    } finally {
      setIsFlippingCamera(false);
    }
  };

  const handleEndCall = () => {
    // Store duration before ending
    setCallEndDuration(callDuration);
    setCallEnded(true);
    
    localStream?.getTracks().forEach(track => track.stop());
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setCallEnded(false);
      endCall();
    }, 3000);
  };

  const handleCallAgain = () => {
    setCallEnded(false);
    // Trigger a new call - this would need socket integration
    // For now, just close and user can initiate new call
    endCall();
  };

  const handleCloseEndScreen = () => {
    setCallEnded(false);
    endCall();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Debug logging
  console.log('[VideoCallOverlay] Render check - callStatus:', callStatus, 'currentCall:', !!currentCall, 'incomingCall:', !!incomingCall);

  // Only show when in calling or connected state (or call ended screen)
  if (callStatus !== 'connected' && callStatus !== 'calling' && !callEnded) {
    return null;
  }
  
  console.log('[VideoCallOverlay] Rendering overlay');

  const peerInfo = currentCall?.peer || incomingCall?.from;
  const myUsername = 'You';
  const peerUsername = peerInfo?.displayName || peerInfo?.username || 'Caller';

  // Connection quality badge
  const QualityBadge = () => {
    const colors = {
      excellent: 'bg-green-500',
      good: 'bg-yellow-500',
      poor: 'bg-red-500',
      reconnecting: 'bg-orange-500 animate-pulse',
    };
    const labels = {
      excellent: 'HD',
      good: 'SD',
      poor: 'Low',
      reconnecting: '...',
    };
    return (
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${colors[connectionQuality]}`} />
        <span className="text-xs text-white">{labels[connectionQuality]}</span>
      </div>
    );
  };

  // PiP position classes
  const pipPositionClasses = {
    'top-left': 'top-20 left-4',
    'top-right': 'top-20 right-4',
    'bottom-left': 'bottom-28 left-4',
    'bottom-right': 'bottom-28 right-4',
  };

  // Format duration for end screen
  const formatLongDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} seconds`;
    return `${mins} minute${mins !== 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      onClick={handleScreenInteraction}
      onMouseMove={handleScreenInteraction}
    >
      {/* Call Ended Overlay */}
      {callEnded && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800 flex items-center justify-center">
              <PhoneOff className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Call Ended</h2>
            <p className="text-zinc-400 mb-8">Duration: {formatLongDuration(callEndDuration)}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleCallAgain}
                className="px-6 py-3 border border-violet-500 text-violet-400 rounded-full hover:bg-violet-500/10 transition-all"
              >
                Call Again
              </button>
              <button
                onClick={handleCloseEndScreen}
                className="px-6 py-3 bg-zinc-700 text-white rounded-full hover:bg-zinc-600 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calling Screen (Outgoing - before connection) */}
      {callStatus === 'calling' && connectionState !== 'connected' && (
        <div className="flex-1 relative bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full border-2 border-violet-500/30 animate-ping" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full border border-violet-500/20 animate-pulse" />
                </div>
                <div className="relative w-36 h-36 mx-auto rounded-full overflow-hidden">
                  <Avatar src={peerInfo?.profilePicture} alt={peerUsername} size="lg" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">{peerUsername}</h2>
              <p className="text-zinc-400">Calling...</p>
              <p className="text-sm text-zinc-500 mt-2">{callType === 'video' ? 'Video Call' : 'Voice Call'}</p>
            </div>
          </div>
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <button onClick={handleEndCall} className="p-5 bg-red-600 rounded-full text-white hover:bg-red-700 transition-all shadow-lg">
              <PhoneOff className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}

      {/* Connected Call Interface */}
      {(callStatus === 'connected' || (callStatus === 'calling' && connectionState === 'connected')) && !callEnded && (
        <>
          {/* Main Call Area */}
          <div className="flex-1 relative">
            {/* Video Call View */}
            {callType === 'video' ? (
              <div className="w-full h-full bg-zinc-900 relative">
                {/* Always render video element, hide when no stream */}
                <video 
                  ref={remoteVideoRef} 
                  autoPlay 
                  playsInline 
                  className={`w-full h-full object-cover ${remoteStream && !remoteCameraOff ? 'block' : 'hidden'}`}
                />
                {/* Show placeholder when no remote stream or camera off */}
                {(!remoteStream || remoteCameraOff) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-900">
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-zinc-700">
                        <Avatar src={peerInfo?.profilePicture} alt={peerUsername} size="lg" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">{peerUsername}</h3>
                      {remoteCameraOff ? (
                        <p className="text-zinc-400 text-sm mt-2 flex items-center justify-center gap-2">
                          <VideoOff className="w-4 h-4" /> Camera is off
                        </p>
                      ) : (
                        <p className="text-zinc-400 text-sm mt-2">Connecting video...</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Voice Call View */
              <div className="w-full h-full bg-gradient-to-b from-violet-900/50 via-zinc-900 to-zinc-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="relative mb-6">
                    {audioLevels.remote > 15 && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-52 h-52 rounded-full border-2 border-violet-500/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-56 h-56 rounded-full border border-violet-500/20 animate-pulse" />
                        </div>
                      </>
                    )}
                    <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-zinc-700">
                      <Avatar src={peerInfo?.profilePicture} alt={peerUsername} size="lg" />
                    </div>
                    {audioLevels.remote > 15 && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 rounded-full text-xs text-white flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> Speaking
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-1">{peerUsername}</h2>
                  <p className="text-zinc-400 text-sm">{formatDuration(callDuration)}</p>
                  <div className="mt-8 flex justify-center items-end gap-1 h-16">
                    {waveformData.map((height, i) => (
                      <div key={i} className="w-2 bg-gradient-to-t from-violet-600 to-violet-400 rounded-full" style={{ height: `${height}px`, transition: 'height 50ms ease-out' }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Top Bar */}
            <div className={`absolute top-0 left-0 right-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="bg-gradient-to-b from-black/70 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-medium">{peerUsername}</h3>
                    {remoteMuted && <MicOff className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white text-sm font-mono">{formatDuration(callDuration)}</span>
                    <QualityBadge />
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            {connectionState !== 'connected' && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                <span className="text-yellow-400 text-sm">
                  {connectionState === 'connecting' && 'Connecting...'}
                  {connectionState === 'failed' && 'Connection failed'}
                  {connectionState === 'disconnected' && 'Reconnecting...'}
                </span>
              </div>
            )}

            {/* Local Video PiP */}
            {callType === 'video' && (
              <div className={`absolute ${pipPositionClasses[pipPosition]} w-[120px] h-[160px] rounded-xl overflow-hidden bg-zinc-800 shadow-xl border-2 border-white/20 transition-all duration-200 ${isFlippingCamera ? 'opacity-50' : 'opacity-100'}`}>
                {localStream && isVideoEnabled ? (
                  <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'mirror' : ''}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-700">
                    <VideoOff className="w-8 h-8 text-zinc-500" />
                  </div>
                )}
                <button onClick={flipCamera} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors" disabled={isFlippingCamera}>
                  <SwitchCamera className="w-3 h-3 text-white" />
                </button>
                {isAudioEnabled && audioLevels.local > 10 && (
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-green-500/80 rounded-full">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  </div>
                )}
                {!isAudioEnabled && (
                  <div className="absolute bottom-2 left-2 p-1 bg-red-500/80 rounded-full">
                    <MicOff className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Control Bar */}
          <div className={`bg-zinc-900/95 px-6 py-4 flex items-center justify-center gap-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            {/* Flip Camera */}
            {callType === 'video' && isVideoEnabled && (
              <button onClick={flipCamera} className={`p-4 rounded-full bg-white/20 text-white transition-all ${isFlippingCamera ? 'animate-spin' : ''}`} disabled={isFlippingCamera}>
                <SwitchCamera className="w-6 h-6" />
              </button>
            )}
            {/* Mute */}
            <button onClick={toggleAudio} className={`p-4 rounded-full transition-all ${isAudioEnabled ? 'bg-white text-zinc-900' : 'bg-red-600 text-white'}`}>
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>
            {/* End Call */}
            <button onClick={handleEndCall} className="p-5 bg-red-600 rounded-full text-white hover:bg-red-700 transition-all">
              <PhoneOff className="w-7 h-7" />
            </button>
            {/* Camera Toggle */}
            {callType === 'video' && (
              <button onClick={toggleVideo} className={`p-4 rounded-full transition-all ${isVideoEnabled ? 'bg-white text-zinc-900' : 'bg-zinc-600 text-white'}`}>
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
