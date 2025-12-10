'use client';

import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { Phone, PhoneOff, Video } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

export default function IncomingCallOverlay() {
  const { incomingCall, acceptCall, declineCall, callStatus } = useSocket();

  // Play ringtone when incoming call
  useEffect(() => {
    if (!incomingCall) return;
    
    // Try to play a notification sound
    try {
      const audio = new Audio('/sounds/ringtone.mp3');
      audio.loop = true;
      audio.volume = 0.5;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented - silent fail
        });
      }
      
      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    } catch (e) {
      // Audio not available - silent fail
    }
  }, [incomingCall]);

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
            onClick={declineCall}
            className="p-4 bg-red-500 rounded-full text-white hover:bg-red-600 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-red-500/30"
            title="Decline"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
          <button
            onClick={acceptCall}
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
