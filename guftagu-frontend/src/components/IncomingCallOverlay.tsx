'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { Phone, PhoneOff, Video, Loader2, AlertCircle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

// Generate ringtone using Web Audio API (works across all browsers)
function createRingtone(audioContext: AudioContext): { start: () => void; stop: () => void } {
  let oscillator: OscillatorNode | null = null;
  let gainNode: GainNode | null = null;
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
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
    gain.gain.linearRampToValueAtTime(0.3, startTime + duration - 0.02);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  const playRingPattern = () => {
    if (!isPlaying || !audioContext || audioContext.state === 'closed') return;
    
    const now = audioContext.currentTime;
    
    // Play two-tone ring pattern (similar to phone ringtone)
    playTone(440, 0.4, now);        // A4
    playTone(480, 0.4, now + 0.4);  // B4
    playTone(440, 0.4, now + 0.8);  // A4
    
    // Repeat after pause
    timeoutId = setTimeout(playRingPattern, 2500);
  };

  return {
    start: () => {
      if (isPlaying) return;
      isPlaying = true;
      
      // Resume audio context if suspended (required for autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      playRingPattern();
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

export default function IncomingCallOverlay() {
  const { incomingCall, acceptCall, declineCall, callStatus } = useSocket();
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Initialize and play ringtone when incoming call
  useEffect(() => {
    if (!incomingCall) {
      // Stop ringtone when call is no longer incoming
      if (ringtoneRef.current) {
        ringtoneRef.current.stop();
      }
      return;
    }
    
    // Create audio context and ringtone
    try {
      // Use webkitAudioContext for Safari compatibility
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      ringtoneRef.current = createRingtone(audioContextRef.current);
      ringtoneRef.current.start();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
    
    return () => {
      // Cleanup
      if (ringtoneRef.current) {
        ringtoneRef.current.stop();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [incomingCall]);

  // Handle accept - request camera/mic permission first
  const handleAccept = useCallback(async () => {
    if (!incomingCall) return;
    
    setIsRequestingPermission(true);
    setPermissionError(null);
    
    try {
      // Request camera/mic permissions BEFORE accepting the call
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: incomingCall.callType === 'video',
      };
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera/microphone not supported on this device');
      }
      
      // Request permissions - this will show the browser permission prompt
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Stop the test stream immediately - VideoCallOverlay will request its own
      stream.getTracks().forEach(track => track.stop());
      
      // Permission granted - stop ringtone and accept call
      if (ringtoneRef.current) {
        ringtoneRef.current.stop();
      }
      
      setIsRequestingPermission(false);
      acceptCall();
    } catch (error: any) {
      console.error('[IncomingCall] Permission error:', error);
      setIsRequestingPermission(false);
      
      // Handle specific permission errors
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionError('Camera/microphone permission denied. Please allow access to answer the call.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setPermissionError('No camera or microphone found on this device.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setPermissionError('Camera/microphone is already in use by another application.');
      } else {
        setPermissionError(error.message || 'Failed to access camera/microphone.');
      }
      
      // Clear error after 5 seconds
      setTimeout(() => setPermissionError(null), 5000);
    }
  }, [acceptCall, incomingCall]);

  const handleDecline = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.stop();
    }
    declineCall();
  }, [declineCall]);

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl shadow-black/50">
        {/* Pulse ring animation */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            {/* Animated rings */}
            <div className="absolute inset-0 -m-4">
              <div className="w-24 h-24 rounded-full border-2 border-white/20 animate-ping" />
            </div>
            <div className="absolute inset-0 -m-2">
              <div className="w-20 h-20 rounded-full border border-white/30 animate-pulse" />
            </div>
            <Avatar
              src={incomingCall.from.profilePicture}
              alt={incomingCall.from.displayName || incomingCall.from.username}
              size="lg"
            />
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-lg">
              {incomingCall.callType === 'video' ? (
                <Video className="w-4 h-4 text-neutral-900" />
              ) : (
                <Phone className="w-4 h-4 text-neutral-900" />
              )}
            </div>
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-1">
          {incomingCall.from.displayName || incomingCall.from.username}
        </h3>
        <p className="text-neutral-400 mb-6">
          Incoming {incomingCall.callType} call...
        </p>

        {/* Ringing animation */}
        <div className="flex justify-center gap-1.5 mb-6">
          <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Permission error message */}
        {permissionError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{permissionError}</span>
          </div>
        )}

        <div className="flex justify-center gap-8">
          <button
            onClick={handleDecline}
            disabled={isRequestingPermission}
            className="p-4 bg-red-500 rounded-full text-white hover:bg-red-600 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="Decline"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
          <button
            onClick={handleAccept}
            disabled={isRequestingPermission}
            className="p-4 bg-green-500 rounded-full text-white hover:bg-green-600 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-green-500/30 animate-pulse disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none disabled:hover:scale-100"
            title="Accept"
          >
            {isRequestingPermission ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Phone className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Permission request hint */}
        {isRequestingPermission && (
          <p className="mt-4 text-neutral-500 text-sm">
            Please allow camera/microphone access...
          </p>
        )}
      </div>
    </div>
  );
}
