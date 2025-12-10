'use client';

import { useSocket } from '@/contexts/SocketContext';
import { Phone, PhoneOff, Video } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

export default function IncomingCallOverlay() {
  const { incomingCall, acceptCall, declineCall, callStatus } = useSocket();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center">
      <div className="bg-zinc-900 rounded-2xl p-8 text-center max-w-sm mx-4 animate-pulse-slow">
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <Avatar
              src={incomingCall.from.profilePicture}
              alt={incomingCall.from.displayName || incomingCall.from.username}
              size="lg"
            />
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-violet-600 rounded-full">
              {incomingCall.callType === 'video' ? (
                <Video className="w-4 h-4 text-white" />
              ) : (
                <Phone className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-1">
          {incomingCall.from.displayName || incomingCall.from.username}
        </h3>
        <p className="text-zinc-400 mb-6">
          Incoming {incomingCall.callType} call...
        </p>

        {/* Ringing animation */}
        <div className="flex justify-center gap-1 mb-6">
          <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        <div className="flex justify-center gap-6">
          <button
            onClick={declineCall}
            className="p-4 bg-red-600 rounded-full text-white hover:bg-red-700 transition-all hover:scale-110 shadow-lg"
            title="Decline"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
          <button
            onClick={acceptCall}
            className="p-4 bg-green-600 rounded-full text-white hover:bg-green-700 transition-all hover:scale-110 shadow-lg animate-pulse"
            title="Accept"
          >
            <Phone className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
