'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { Phone, PhoneOff, Video } from 'lucide-react';
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

  // Handle accept/decline to stop ringtone
  const handleAccept = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.stop();
    }
    acceptCall();
  }, [acceptCall]);

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

        <div className="flex justify-center gap-8">
          <button
            onClick={handleDecline}
            className="p-4 bg-red-500 rounded-full text-white hover:bg-red-600 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-red-500/30"
            title="Decline"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
          <button
            onClick={handleAccept}
            className="p-4 bg-green-500 rounded-full text-white hover:bg-green-600 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-green-500/30 animate-pulse"
            title="Accept"
          >
            <Phone className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
