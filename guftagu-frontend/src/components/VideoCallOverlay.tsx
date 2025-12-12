'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, SwitchCamera, X, MoreVertical, Wifi, WifiOff, Loader2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

interface AudioLevels {
  local: number;
  remote: number;
}

type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'reconnecting';
type PipPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// Generate ringback tone using Web Audio API (caller hears this while waiting)
function createRingbackTone(audioContext: AudioContext): { start: () => void; stop: () => void } {
  let isPlaying = false;
  let timeoutId: NodeJS.Timeout | null = null;

  const playTone = (frequency: number, duration: number, startTime: number) => {
    if (!audioContext || audioContext.state === 'closed') return;
    
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.frequency.value = frequency;
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
    gain.gain.linearRampToValueAtTime(0.15, startTime + duration - 0.02);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  const playRingbackPattern = () => {
    if (!isPlaying || !audioContext || audioContext.state === 'closed') return;
    
    const now = audioContext.currentTime;
    
    // Standard ringback tone pattern (2s on, 4s off)
    playTone(440, 1.0, now);  // 440Hz for 1 second
    playTone(480, 1.0, now);  // Dual tone (440 + 480 Hz)
    
    // Repeat after pause
    timeoutId = setTimeout(playRingbackPattern, 4000);
  };

  return {
    start: () => {
      if (isPlaying) return;
      isPlaying = true;
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      playRingbackPattern();
    },
    stop: () => {
      isPlaying = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
  };
}

export default function VideoCallOverlay() {
  const { 
    socket, 
    callStatus, 
    incomingCall, 
    currentCall,
    peerSocketId,
    endCall,
    callType,
    callEndReason,
    startCall,
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
  const [callingDuration, setCallingDuration] = useState(0); // Track how long we've been calling
  
  // New UI states
  const [showControls, setShowControls] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [pipPosition, setPipPosition] = useState<PipPosition>('bottom-right');
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('excellent');
  const [callEnded, setCallEnded] = useState(false);
  const [callEndDuration, setCallEndDuration] = useState(0);
  // Store peer info for "Call Again" feature (persists after currentCall is nulled)
  const [savedPeerInfo, setSavedPeerInfo] = useState<{
    userId: string;
    username: string;
    profilePicture?: string;
    callType: 'voice' | 'video';
  } | null>(null);
  const [isFlippingCamera, setIsFlippingCamera] = useState(false);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  
  // Transition states
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isRequestingCallAgainPermission, setIsRequestingCallAgainPermission] = useState(false);
  const [callAgainPermissionError, setCallAgainPermissionError] = useState<string | null>(null);
  const prevCallStatusRef = useRef<string | null>(null);
  
  // Buffer for ICE candidates received before remote description is set
  const iceCandidateBuffer = useRef<RTCIceCandidateInit[]>([]);
  // Buffer for offer received before peer connection is ready - use STATE to trigger re-render
  const [pendingOffer, setPendingOffer] = useState<{ from: string; offer: RTCSessionDescriptionInit } | null>(null);
  // Track when peer connection is ready (state variable to trigger effects)
  const [isPeerConnectionReady, setIsPeerConnectionReady] = useState(false);
  
  // Ringback tone refs
  const ringbackAudioContextRef = useRef<AudioContext | null>(null);
  const ringbackToneRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  
  // Timer ref for auto-dismiss (so we can cancel it on "Call Again")
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null); // For voice calls - plays remote audio
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

  // Save peer info when call is active (so we can use it for "Call Again" after currentCall is nulled)
  useEffect(() => {
    if (currentCall?.peer) {
      setSavedPeerInfo({
        userId: currentCall.peer.userId,
        username: currentCall.peer.displayName || currentCall.peer.username || 'Unknown',
        profilePicture: currentCall.peer.profilePicture,
        callType: currentCall.callType,
      });
    }
  }, [currentCall]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Manage ringback tone when calling (caller hears this while waiting)
  useEffect(() => {
    if (callStatus === 'calling' && connectionState !== 'connected') {
      // Start ringback tone
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        ringbackAudioContextRef.current = new AudioContextClass();
        ringbackToneRef.current = createRingbackTone(ringbackAudioContextRef.current);
        ringbackToneRef.current.start();
      } catch (e) {
        console.warn('Ringback tone not supported:', e);
      }
    } else {
      // Stop ringback tone
      if (ringbackToneRef.current) {
        ringbackToneRef.current.stop();
      }
      if (ringbackAudioContextRef.current && ringbackAudioContextRef.current.state !== 'closed') {
        ringbackAudioContextRef.current.close().catch(() => {});
        ringbackAudioContextRef.current = null;
      }
    }

    return () => {
      if (ringbackToneRef.current) {
        ringbackToneRef.current.stop();
      }
      if (ringbackAudioContextRef.current && ringbackAudioContextRef.current.state !== 'closed') {
        ringbackAudioContextRef.current.close().catch(() => {});
      }
    };
  }, [callStatus, connectionState]);

  // Track calling duration (how long we've been waiting)
  useEffect(() => {
    if (callStatus === 'calling' && connectionState !== 'connected') {
      setCallingDuration(0);
      const interval = setInterval(() => {
        setCallingDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [callStatus, connectionState]);

  // Handle state transitions with smooth animations
  useEffect(() => {
    const prevStatus = prevCallStatusRef.current;
    const currentStatus = callStatus;
    
    // Reset peer connection ready state when call ends or goes idle
    if (currentStatus === 'idle' || currentStatus === 'ended' || currentStatus === 'disconnected') {
      setIsPeerConnectionReady(false);
      setConnectionState('connecting'); // Also reset connection state for next call
    }
    
    // Reset connection state when a new call is initiated to ensure proper UI display
    if (currentStatus === 'calling' && (prevStatus === 'idle' || prevStatus === 'ended' || prevStatus === 'disconnected' || prevStatus === null)) {
      console.log('[Call] New call initiated, resetting connectionState to connecting');
      setConnectionState('connecting');
    }
    
    if (prevStatus && prevStatus !== currentStatus) {
      setIsTransitioning(true);
      
      if (prevStatus === 'calling' && currentStatus === 'connected') {
        setTransitionMessage('Connecting...');
      } else if (prevStatus === 'connected' && currentStatus === 'idle') {
        setTransitionMessage('Call ended');
      }
      
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setTransitionMessage('');
      }, 500);
      
      return () => clearTimeout(timeout);
    }
    
    prevCallStatusRef.current = callStatus;
  }, [callStatus]);

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
    if (!remoteStream) return;
    
    console.log('[Video] Remote stream changed, video tracks:', remoteStream.getVideoTracks().length, 'audio tracks:', remoteStream.getAudioTracks().length);
    
    // Ensure all remote tracks are enabled
    remoteStream.getTracks().forEach(track => {
      track.enabled = true;
      console.log('[Video] Remote track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState, 'muted:', track.muted);
    });
    
    // Check if we have video tracks
    const videoTracks = remoteStream.getVideoTracks();
    if (videoTracks.length === 0) {
      console.warn('[Video] Remote stream has no video tracks!');
      setRemoteCameraOff(true);
    } else {
      setRemoteCameraOff(false);
      console.log('[Video] Remote video track settings:', videoTracks[0].getSettings());
    }
    
    // Set video element srcObject with delay to ensure element is ready
    const setVideoSource = async () => {
      // Wait a bit for React to finish rendering
      await new Promise(r => setTimeout(r, 100));
      
      if (!remoteVideoRef.current) {
        console.warn('[Video] Remote video ref not available, retrying...');
        setTimeout(setVideoSource, 200);
        return;
      }
      
      console.log('[Video] Setting remote video srcObject');
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Multiple play attempts with longer intervals
      for (let i = 0; i < 5; i++) {
        try {
          // Wait for loadedmetadata event or try to play directly
          if (remoteVideoRef.current.readyState < 2) {
            console.log('[Video] Waiting for video metadata...');
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error('Timeout')), 2000);
              remoteVideoRef.current!.onloadedmetadata = () => {
                clearTimeout(timeout);
                resolve(undefined);
              };
            }).catch(() => console.log('[Video] Metadata timeout, trying play anyway'));
          }
          
          await remoteVideoRef.current.play();
          console.log('[Video] Remote video playing successfully!');
          console.log('[Video] Video dimensions:', remoteVideoRef.current.videoWidth, 'x', remoteVideoRef.current.videoHeight);
          return;
        } catch (e: any) {
          console.log(`[Video] Remote play attempt ${i + 1} failed:`, e.message || e);
          await new Promise(r => setTimeout(r, 500));
        }
      }
      console.error('[Video] All play attempts failed for remote video');
    };
    
    setVideoSource();
  }, [remoteStream, callStatus, connectionState]);

  // Sync remote audio element for voice calls
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      console.log('[Audio] Setting remote audio element srcObject for voice call');
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.volume = 1.0;
      
      // Play the audio
      const playAudio = async () => {
        for (let i = 0; i < 5; i++) {
          try {
            await remoteAudioRef.current?.play();
            console.log('[Audio] Remote audio playing via audio element!');
            return;
          } catch (e) {
            console.log(`[Audio] Remote audio play attempt ${i + 1} failed:`, e);
            await new Promise(r => setTimeout(r, 300));
          }
        }
      };
      playAudio();
    }
  }, [remoteStream]);

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

  // Ref to track if we've already initialized WebRTC for this call
  const webrtcInitializedRef = useRef(false);
  
  // Initialize WebRTC when connected and have peer socket
  // KEY FIX: Don't depend on localStream to prevent re-initialization
  useEffect(() => {
    if (callStatus !== 'connected' || !socket || !peerSocketId) return;
    if (peerConnectionRef.current || webrtcInitializedRef.current) return; // Already have connection

    const initWebRTC = async () => {
      try {
        console.log('[WebRTC] Initializing with peerSocketId:', peerSocketId);
        console.log('[WebRTC] isInitiator:', currentCall?.isInitiator);
        
        // Mark as initialized to prevent re-runs
        webrtcInitializedRef.current = true;

        // Create peer connection IMMEDIATELY
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;
        
        // Mark PC as ready immediately for BOTH initiator and non-initiator
        setIsPeerConnectionReady(true);
        
        // NOTE: Don't add tracks here - let the dedicated effect handle it

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
          
          // Check if we received video tracks
          const hasVideoTracks = stream.getVideoTracks().length > 0;
          const hasAudioTracks = stream.getAudioTracks().length > 0;
          console.log('[WebRTC] Stream has video:', hasVideoTracks, 'audio:', hasAudioTracks);
          
          // Set remote stream state - this will trigger the effects to handle video/audio elements
          setRemoteStream(stream);
          
          // Only set camera off if we have NO video tracks
          if (!hasVideoTracks) {
            console.warn('[WebRTC] No video tracks in remote stream, setting camera off');
            setRemoteCameraOff(true);
          } else {
            console.log('[WebRTC] Video tracks available, enabling video display');
            setRemoteCameraOff(false);
            
            // Log video track details
            const videoTrack = stream.getVideoTracks()[0];
            console.log('[WebRTC] Video track settings:', videoTrack.getSettings());
          }
          
          // Immediately set video element with retry (as backup to the effect)
          const setRemoteVideo = async () => {
            // Small delay to let React render
            await new Promise(r => setTimeout(r, 150));
            
            if (remoteVideoRef.current) {
              console.log('[WebRTC] Setting remote video srcObject directly');
              remoteVideoRef.current.srcObject = stream;
              
              // Wait for metadata before playing
              if (remoteVideoRef.current.readyState < 2) {
                console.log('[WebRTC] Waiting for video loadedmetadata...');
                await new Promise<void>((resolve) => {
                  const timeout = setTimeout(() => resolve(), 3000);
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.onloadedmetadata = () => {
                      clearTimeout(timeout);
                      console.log('[WebRTC] Video metadata loaded');
                      resolve();
                    };
                  }
                });
              }
              
              // Multiple play attempts
              for (let i = 0; i < 5; i++) {
                try {
                  await remoteVideoRef.current.play();
                  console.log('[WebRTC] Remote video playing successfully!');
                  console.log('[WebRTC] Video dimensions:', remoteVideoRef.current.videoWidth, 'x', remoteVideoRef.current.videoHeight);
                  break;
                } catch (e: any) {
                  console.log(`[WebRTC] Remote play attempt ${i + 1} failed:`, e.message || e);
                  await new Promise(r => setTimeout(r, 400));
                }
              }
            } else {
              console.warn('[WebRTC] Remote video ref not available yet, will retry...');
              setTimeout(setRemoteVideo, 300);
            }
          };
          
          setRemoteVideo();
          
          // Also set up audio element for voice calls (ensures audio plays even without video element)
          const setRemoteAudio = async () => {
            if (remoteAudioRef.current) {
              console.log('[WebRTC] Setting remote audio srcObject for voice call');
              remoteAudioRef.current.srcObject = stream;
              remoteAudioRef.current.volume = 1.0;
              
              // Multiple play attempts for audio
              for (let i = 0; i < 3; i++) {
                try {
                  await remoteAudioRef.current.play();
                  console.log('[WebRTC] Remote audio playing successfully!');
                  break;
                } catch (e) {
                  console.log(`[WebRTC] Remote audio play attempt ${i + 1} failed:`, e);
                  await new Promise(r => setTimeout(r, 300));
                }
              }
            } else {
              console.warn('[WebRTC] Remote audio ref not available yet, will retry...');
              setTimeout(setRemoteAudio, 200);
            }
          };
          
          setRemoteAudio();
          
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

        // Offer will be sent by the track addition effect when tracks are ready
        if (currentCall?.isInitiator) {
          console.log('[WebRTC] Initiator PC ready, will send offer when tracks are added...');
        } else {
          console.log('[WebRTC] Non-initiator PC ready, waiting for offer...');
        }

      } catch (error) {
        console.error('[WebRTC] Error:', error);
        setConnectionState('failed');
        webrtcInitializedRef.current = false;
      }
    };

    initWebRTC();
  }, [callStatus, socket, peerSocketId, currentCall, setupAudioAnalyser]);
  
  // Cleanup WebRTC on call end
  useEffect(() => {
    if (callStatus === 'idle' || callStatus === 'ended' || callStatus === 'disconnected') {
      console.log('[WebRTC] Call ended, cleaning up...');
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setIsPeerConnectionReady(false);
      webrtcInitializedRef.current = false;
      iceCandidateBuffer.current = [];
      setPendingOffer(null);
    }
  }, [callStatus]);

  // Add tracks to existing peer connection when local stream becomes available
  useEffect(() => {
    if (!localStream || !peerConnectionRef.current || !socket || !peerSocketId) return;
    
    const pc = peerConnectionRef.current;
    const existingSenders = pc.getSenders();
    
    // Check if we already have tracks added
    if (existingSenders.some(s => s.track !== null)) {
      console.log('[WebRTC] Tracks already added to PC');
      return;
    }
    
    console.log('[WebRTC] Adding tracks to peer connection, stream id:', localStream.id);
    
    // Add tracks with proper handling
    const addTracksAndOffer = async () => {
      try {
        // Add all tracks from local stream
        localStream.getTracks().forEach(track => {
          track.enabled = true;
          console.log('[WebRTC] Adding track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
          pc.addTrack(track, localStream);
        });
        
        // Small delay to ensure tracks are properly registered
        await new Promise(r => setTimeout(r, 100));
        
        // If we're the initiator and haven't sent offer yet, send it now
        if (currentCall?.isInitiator && pc.signalingState === 'stable' && !pc.localDescription) {
          console.log('[WebRTC] Initiator creating and sending offer...');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('friend_call_offer', {
            to: peerSocketId,
            offer: pc.localDescription,
          });
          console.log('[WebRTC] Offer sent to:', peerSocketId);
        } else if (!currentCall?.isInitiator) {
          console.log('[WebRTC] Non-initiator: tracks added, waiting for offer...');
        }
      } catch (e) {
        console.error('[WebRTC] Error in addTracksAndOffer:', e);
      }
    };
    
    addTracksAndOffer();
  }, [localStream, currentCall, peerSocketId, socket]);

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
    if (callStatus === 'idle' || callStatus === 'ended' || callStatus === 'disconnected') {
      trackRefreshedRef.current = false;
    }
  }, [callStatus]);

  // Process pending offer when PC is ready AND we have local stream
  useEffect(() => {
    if (!pendingOffer || !peerConnectionRef.current || !socket || !isPeerConnectionReady || !localStream) {
      if (pendingOffer && !localStream) {
        console.log('[WebRTC] Have pending offer but waiting for localStream...');
      }
      return;
    }
    
    const processPendingOffer = async () => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      
      console.log('[WebRTC] Processing pending offer from:', pendingOffer.from);
      const offerData = pendingOffer;
      setPendingOffer(null);
      
      try {
        // Add local tracks first
        const existingSenders = pc.getSenders();
        if (!existingSenders.some(s => s.track !== null)) {
          console.log('[WebRTC] Adding tracks before processing offer');
          localStream.getTracks().forEach(track => {
            track.enabled = true;
            console.log('[WebRTC] Adding track for offer processing:', track.kind);
            pc.addTrack(track, localStream);
          });
          // Small delay for tracks to register
          await new Promise(r => setTimeout(r, 50));
        }
        
        console.log('[WebRTC] Setting remote description from pending offer...');
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
        
        console.log('[WebRTC] Creating answer...');
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('friend_call_answer', {
          to: offerData.from,
          answer: pc.localDescription,
        });
        console.log('[WebRTC] Sent answer to:', offerData.from);
        
        // Ensure tracks are enabled
        pc.getSenders().forEach(sender => {
          if (sender.track) {
            sender.track.enabled = true;
          }
        });
      } catch (error) {
        console.error('[WebRTC] Error processing pending offer:', error);
      }
    };
    
    processPendingOffer();
  }, [pendingOffer, socket, localStream, isPeerConnectionReady]);

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
      console.log('[WebRTC] localStream exists:', !!localStream);
      
      const pc = peerConnectionRef.current;
      
      // Buffer offer if no PC or no localStream yet
      if (!pc || !localStream) {
        console.log('[WebRTC] Buffering offer - waiting for', !pc ? 'peer connection' : 'localStream');
        setPendingOffer(data);
        return;
      }

      try {
        // Add local tracks if not already added
        const existingSenders = pc.getSenders();
        if (!existingSenders.some(s => s.track !== null)) {
          console.log('[WebRTC] Adding tracks before handling offer');
          localStream.getTracks().forEach(track => {
            track.enabled = true;
            console.log('[WebRTC] Adding track:', track.kind);
            pc.addTrack(track, localStream);
          });
          // Small delay for tracks to register
          await new Promise(r => setTimeout(r, 50));
        }
        
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
  }, [socket, localStream]);

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
    
    // Auto dismiss after 3 seconds (store ref so we can cancel on "Call Again")
    autoDismissTimerRef.current = setTimeout(() => {
      setCallEnded(false);
      endCall();
    }, 3000);
  };

  const handleCallAgain = async () => {
    // Cancel any pending auto-dismiss timer
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
    
    // Use savedPeerInfo since currentCall is already null when call ends
    if (!savedPeerInfo) {
      console.log('[VideoCallOverlay] No saved peer info for Call Again');
      return;
    }
    
    const { userId, username, profilePicture, callType: savedCallType } = savedPeerInfo;
    
    // Request permissions FIRST before re-initiating call
    setIsRequestingCallAgainPermission(true);
    setCallAgainPermissionError(null);
    
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera/microphone not supported on this device');
      }
      
      // Request permissions
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: savedCallType === 'video',
      };
      
      console.log('[VideoCallOverlay] Requesting permissions for call again');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Stop the test stream immediately - new call will request its own
      stream.getTracks().forEach(track => track.stop());
      
      console.log('[VideoCallOverlay] Permission granted, calling again:', userId, username);
      
      setIsRequestingCallAgainPermission(false);
      setCallEnded(false);
      endCall(); // Close current overlay
      
      // Re-initiate call to the same user using saved values
      setTimeout(() => {
        startCall(
          userId,
          {
            username,
            profilePicture
          },
          savedCallType
        );
      }, 500); // Small delay to ensure clean state
    } catch (error: any) {
      console.error('[VideoCallOverlay] Call Again permission error:', error);
      setIsRequestingCallAgainPermission(false);
      
      // Handle specific permission errors
      let errorMessage = 'Failed to access camera/microphone.';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera/microphone permission denied. Please allow access.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera or microphone found.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera/microphone is in use by another app.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setCallAgainPermissionError(errorMessage);
      setTimeout(() => setCallAgainPermissionError(null), 5000);
    }
  };

  const handleCloseEndScreen = () => {
    // Cancel any pending auto-dismiss timer
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
    
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

  // Show overlay when: calling, connected, declined, disconnected, or showing call ended screen
  if (callStatus !== 'connected' && callStatus !== 'calling' && callStatus !== 'declined' && callStatus !== 'disconnected' && !callEnded) {
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

  // PiP position classes - adjusted for mobile safe areas
  const pipPositionClasses = {
    'top-left': isMobile ? 'top-16 left-2 sm:top-20 sm:left-4' : 'top-20 left-4',
    'top-right': isMobile ? 'top-16 right-2 sm:top-20 sm:right-4' : 'top-20 right-4',
    'bottom-left': isMobile ? 'bottom-24 left-2 sm:bottom-28 sm:left-4' : 'bottom-28 left-4',
    'bottom-right': isMobile ? 'bottom-24 right-2 sm:bottom-28 sm:right-4' : 'bottom-28 right-4',
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
      className={`fixed inset-0 z-[100] bg-black flex flex-col transition-opacity duration-300 ${isTransitioning ? 'opacity-90' : 'opacity-100'}`}
      onClick={handleScreenInteraction}
      onMouseMove={handleScreenInteraction}
      style={{ 
        paddingTop: 'env(safe-area-inset-top)', 
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Transition Overlay */}
      {isTransitioning && transitionMessage && (
        <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-3 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-lg">{transitionMessage}</p>
          </div>
        </div>
      )}

      {/* Call Ended Overlay */}
      {callEnded && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
          <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8 text-center w-full max-w-sm shadow-2xl shadow-black/50">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
              <PhoneOff className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Call Ended</h2>
            <p className="text-neutral-400 text-sm sm:text-base mb-4 sm:mb-6">Duration: {formatLongDuration(callEndDuration)}</p>
            
            {/* Permission error message */}
            {callAgainPermissionError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {callAgainPermissionError}
              </div>
            )}
            
            <div className="flex gap-3 sm:gap-4 justify-center">
              <button
                onClick={handleCallAgain}
                disabled={isRequestingCallAgainPermission}
                className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-white text-neutral-900 rounded-full hover:bg-neutral-200 active:bg-neutral-300 transition-all font-medium shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRequestingCallAgainPermission ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  'Call Again'
                )}
              </button>
              <button
                onClick={handleCloseEndScreen}
                disabled={isRequestingCallAgainPermission}
                className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-neutral-800 border border-neutral-700 text-white rounded-full hover:bg-neutral-700 active:bg-neutral-600 transition-all disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Declined Overlay */}
      {callStatus === 'declined' && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
          <div className="bg-neutral-900/90 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center w-full max-w-sm shadow-2xl shadow-red-500/10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-red-900/30 border border-red-500/50 flex items-center justify-center">
              <PhoneOff className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Call Declined</h2>
            <p className="text-neutral-400 text-sm sm:text-base mb-4 sm:mb-6">
              {callEndReason || 'The user declined your call'}
            </p>
            
            {/* Permission error message */}
            {callAgainPermissionError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {callAgainPermissionError}
              </div>
            )}
            
            <div className="flex gap-3 sm:gap-4 justify-center">
              <button
                onClick={handleCallAgain}
                disabled={isRequestingCallAgainPermission}
                className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-white text-neutral-900 rounded-full hover:bg-neutral-200 active:bg-neutral-300 transition-all font-medium shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRequestingCallAgainPermission ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  'Call Again'
                )}
              </button>
              <button
                onClick={handleCloseEndScreen}
                disabled={isRequestingCallAgainPermission}
                className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-neutral-800 border border-neutral-700 text-white rounded-full hover:bg-neutral-700 active:bg-neutral-600 transition-all disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Disconnected Overlay */}
      {callStatus === 'disconnected' && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
          <div className="bg-neutral-900/90 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-8 text-center w-full max-w-sm shadow-2xl shadow-orange-500/10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-orange-900/30 border border-orange-500/50 flex items-center justify-center">
              <WifiOff className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Call Disconnected</h2>
            <p className="text-neutral-400 text-sm sm:text-base mb-4 sm:mb-6">
              {callEndReason || 'The other participant disconnected'}
            </p>
            
            {/* Permission error message */}
            {callAgainPermissionError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {callAgainPermissionError}
              </div>
            )}
            
            <div className="flex gap-3 sm:gap-4 justify-center">
              <button
                onClick={handleCallAgain}
                disabled={isRequestingCallAgainPermission}
                className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-white text-neutral-900 rounded-full hover:bg-neutral-200 active:bg-neutral-300 transition-all font-medium shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRequestingCallAgainPermission ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  'Call Again'
                )}
              </button>
              <button
                onClick={handleCloseEndScreen}
                disabled={isRequestingCallAgainPermission}
                className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-neutral-800 border border-neutral-700 text-white rounded-full hover:bg-neutral-700 active:bg-neutral-600 transition-all disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calling Screen (Outgoing - before connection) */}
      {callStatus === 'calling' && connectionState !== 'connected' && (
        <div className="flex-1 relative bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900 animate-fade-in">
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8 text-center w-full max-w-xs sm:max-w-sm shadow-2xl shadow-black/50">
              <div className="relative mb-6 sm:mb-8">
                {/* Animated rings */}
                <div className="absolute inset-0 flex items-center justify-center -m-4">
                  <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-full border-2 border-white/20 animate-ping" style={{ animationDuration: '2s' }} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center -m-2">
                  <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full border border-white/10 animate-pulse" />
                </div>
                <div className="relative w-24 h-24 sm:w-36 sm:h-36 mx-auto rounded-full overflow-hidden border-3 border-white/20 shadow-lg">
                  <Avatar src={peerInfo?.profilePicture} alt={peerUsername} size="lg" />
                </div>
                {/* Call type badge */}
                <div className="absolute -bottom-1 -right-1 left-1/2 -translate-x-1/2 w-fit mx-auto">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full shadow-lg">
                    {callType === 'video' ? (
                      <Video className="w-3 h-3 text-neutral-900" />
                    ) : (
                      <Phone className="w-3 h-3 text-neutral-900" />
                    )}
                    <span className="text-xs font-medium text-neutral-900">
                      {callType === 'video' ? 'Video' : 'Voice'}
                    </span>
                  </div>
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2 truncate px-4">{peerUsername}</h2>
              
              {/* Loading indicator with spinner */}
              <div className="flex items-center justify-center gap-2 text-neutral-300 mb-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm sm:text-base font-medium">Calling...</span>
              </div>
              
              {/* Calling duration */}
              <div className="flex items-center justify-center gap-2 text-neutral-500 mb-2">
                <span className="text-xs sm:text-sm font-mono bg-neutral-800/50 px-3 py-1 rounded-full">
                  {formatDuration(callingDuration)}
                </span>
              </div>
              
              {/* Connection status */}
              <div className="flex items-center justify-center gap-1.5 text-neutral-500">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs">Ringing on their device</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 flex justify-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <button 
              onClick={handleEndCall} 
              className="p-4 sm:p-5 bg-red-500 rounded-full text-white hover:bg-red-600 active:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-500/30"
            >
              <PhoneOff className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          </div>
        </div>
      )}

      {/* Connected Call Interface */}
      {(callStatus === 'connected' || (callStatus === 'calling' && connectionState === 'connected')) && !callEnded && (
        <>
          {/* Hidden audio element for remote audio playback (voice calls) */}
          <audio 
            ref={remoteAudioRef}
            autoPlay
            playsInline
            style={{ display: 'none' }}
          />
          
          {/* Main Call Area */}
          <div className="flex-1 relative overflow-hidden animate-fade-in">
            {/* Video Call View */}
            {callType === 'video' ? (
              <div className="w-full h-full bg-neutral-950 relative flex items-center justify-center p-4 sm:p-6 md:p-8">
                {/* Centered video container with aspect ratio */}
                <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl shadow-black/50 border border-neutral-800">
                  {/* Remote video element */}
                  <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline
                    muted={false}
                    className={`w-full h-full object-cover ${remoteStream && !remoteCameraOff ? 'block' : 'hidden'}`}
                  />
                  {/* Show placeholder when no remote stream or camera off */}
                  {(!remoteStream || remoteCameraOff) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-neutral-800 to-neutral-900">
                      <div className="text-center">
                        <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-4 rounded-full overflow-hidden border-3 sm:border-4 border-neutral-700">
                          <Avatar src={peerInfo?.profilePicture} alt={peerUsername} size="lg" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-white truncate max-w-[200px] mx-auto">{peerUsername}</h3>
                        {remoteCameraOff ? (
                          <p className="text-neutral-400 text-xs sm:text-sm mt-2 flex items-center justify-center gap-2">
                            <VideoOff className="w-3 h-3 sm:w-4 sm:h-4" /> Camera is off
                          </p>
                        ) : (
                          <div className="mt-3 flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            <p className="text-neutral-400 text-xs sm:text-sm">Connecting video...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Peer name overlay on video */}
                  {remoteStream && !remoteCameraOff && (
                    <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg">
                      <span className="text-white text-sm font-medium">{peerUsername}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Voice Call View */
              <div className="w-full h-full bg-gradient-to-b from-neutral-800/50 via-neutral-900 to-neutral-900 flex items-center justify-center px-4">
                <div className="text-center w-full max-w-xs sm:max-w-sm">
                  <div className="relative mb-4 sm:mb-6">
                    {audioLevels.remote > 15 && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-36 h-36 sm:w-52 sm:h-52 rounded-full border-2 border-white/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-full border border-white/10 animate-pulse" />
                        </div>
                      </>
                    )}
                    <div className="relative w-32 h-32 sm:w-48 sm:h-48 mx-auto rounded-full overflow-hidden border-3 sm:border-4 border-neutral-700">
                      <Avatar src={peerInfo?.profilePicture} alt={peerUsername} size="lg" />
                    </div>
                    {audioLevels.remote > 15 && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-1 bg-white rounded-full text-[10px] sm:text-xs text-neutral-900 flex items-center gap-1 font-medium shadow-lg">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" /> Speaking
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1 truncate">{peerUsername}</h2>
                  <p className="text-neutral-400 text-sm">{formatDuration(callDuration)}</p>
                  <div className="mt-6 sm:mt-8 flex justify-center items-end gap-0.5 sm:gap-1 h-12 sm:h-16">
                    {waveformData.map((height, i) => (
                      <div key={i} className="w-1.5 sm:w-2 bg-gradient-to-t from-white/80 to-white/40 rounded-full" style={{ height: `${Math.min(height, isMobile ? 40 : 64)}px`, transition: 'height 50ms ease-out' }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Top Bar */}
            <div className={`absolute top-0 left-0 right-0 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
              <div className="bg-gradient-to-b from-black/80 to-transparent p-3 sm:p-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <h3 className="text-white font-medium text-sm sm:text-base truncate">{peerUsername}</h3>
                    {remoteMuted && <MicOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <span className="text-white text-xs sm:text-sm font-mono bg-black/30 px-2 py-1 rounded-full">{formatDuration(callDuration)}</span>
                    <QualityBadge />
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            {connectionState !== 'connected' && (
              <div className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-500/20 rounded-full border border-yellow-500/30 backdrop-blur-sm animate-pulse">
                <div className="flex items-center gap-2">
                  {connectionState === 'connecting' && (
                    <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  {connectionState === 'failed' && (
                    <WifiOff className="w-3 h-3 text-red-400" />
                  )}
                  {connectionState === 'disconnected' && (
                    <Wifi className="w-3 h-3 text-yellow-400 animate-pulse" />
                  )}
                  <span className="text-yellow-400 text-xs sm:text-sm">
                    {connectionState === 'connecting' && 'Connecting...'}
                    {connectionState === 'failed' && 'Connection failed'}
                    {connectionState === 'disconnected' && 'Reconnecting...'}
                  </span>
                </div>
              </div>
            )}

            {/* Local Video PiP */}
            {callType === 'video' && (
              <div 
                className={`absolute z-20 ${pipPositionClasses[pipPosition]} ${isMobile ? 'w-[90px] h-[120px]' : 'w-[120px] h-[160px]'} rounded-xl overflow-hidden bg-neutral-800 shadow-xl border-2 border-white/20 transition-all duration-200 ${isFlippingCamera ? 'opacity-50 scale-95' : 'opacity-100 scale-100'} ${showControls ? 'opacity-100' : 'opacity-70'}`}
              >
                {localStream && isVideoEnabled ? (
                  <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'mirror' : ''}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-700">
                    <VideoOff className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-500" />
                  </div>
                )}
                <button 
                  onClick={flipCamera} 
                  className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1 sm:p-1.5 bg-black/50 rounded-full hover:bg-black/70 active:bg-black/90 transition-colors" 
                  disabled={isFlippingCamera}
                >
                  <SwitchCamera className={`w-2.5 h-2.5 sm:w-3 sm:h-3 text-white ${isFlippingCamera ? 'animate-spin' : ''}`} />
                </button>
                {isAudioEnabled && audioLevels.local > 10 && (
                  <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 px-1 sm:px-1.5 py-0.5 bg-green-500/80 rounded-full">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-pulse" />
                  </div>
                )}
                {!isAudioEnabled && (
                  <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 p-0.5 sm:p-1 bg-red-500/80 rounded-full">
                    <MicOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Control Bar */}
          <div 
            className={`bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-center gap-3 sm:gap-4 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
          >
            {/* Flip Camera */}
            {callType === 'video' && isVideoEnabled && (
              <button 
                onClick={flipCamera} 
                className={`p-3 sm:p-4 rounded-full bg-neutral-800 border border-neutral-700 text-white transition-all active:scale-90 hover:bg-neutral-700 ${isFlippingCamera ? 'animate-spin' : ''}`} 
                disabled={isFlippingCamera}
              >
                <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
            {/* Mute */}
            <button 
              onClick={toggleAudio} 
              className={`p-3 sm:p-4 rounded-full transition-all active:scale-90 ${isAudioEnabled ? 'bg-white text-neutral-900 shadow-lg shadow-white/10' : 'bg-red-500 text-white shadow-lg shadow-red-500/30'}`}
            >
              {isAudioEnabled ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
            {/* End Call */}
            <button 
              onClick={handleEndCall} 
              className="p-4 sm:p-5 bg-red-500 rounded-full text-white hover:bg-red-600 active:bg-red-700 active:scale-90 transition-all shadow-lg shadow-red-500/30"
            >
              <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            {/* Camera Toggle */}
            {callType === 'video' && (
              <button 
                onClick={toggleVideo} 
                className={`p-3 sm:p-4 rounded-full transition-all active:scale-90 ${isVideoEnabled ? 'bg-white text-neutral-900 shadow-lg shadow-white/10' : 'bg-neutral-700 text-white border border-neutral-600'}`}
              >
                {isVideoEnabled ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
