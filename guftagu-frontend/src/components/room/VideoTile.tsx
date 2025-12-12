'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Crown, 
  UserPlus, 
  X,
  MoreVertical 
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

interface VideoTileProps {
  stream?: MediaStream | null;
  username: string;
  displayName?: string;
  profilePicture?: string;
  isHost: boolean;
  isMuted: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isLocal: boolean;
  showControls?: boolean;
  onMute?: () => void;
  onKick?: () => void;
  onAddFriend?: () => void;
  className?: string;
}

export default function VideoTile({
  stream,
  username,
  displayName,
  profilePicture,
  isHost,
  isMuted,
  audioEnabled,
  videoEnabled,
  isLocal,
  showControls = false,
  onMute,
  onKick,
  onAddFriend,
  className,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showMenu, setShowMenu] = useState(false);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const name = displayName || username;

  return (
    <div
      className={cn(
        'relative bg-neutral-900 rounded-xl overflow-hidden aspect-video group',
        'border border-neutral-800/50 shadow-lg',
        'transition-all duration-300',
        className
      )}
    >
      {/* Video element */}
      {stream && videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Mute local video to prevent echo
          className="w-full h-full object-cover"
        />
      ) : (
        /* Avatar placeholder when video is off */
        <div className="w-full h-full flex items-center justify-center bg-neutral-800">
          <Avatar
            src={profilePicture}
            alt={name}
            size="xl"
            className="w-24 h-24 text-3xl"
          />
        </div>
      )}

      {/* Gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* User info bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Host badge */}
          {isHost && (
            <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Host
            </span>
          )}
          
          {/* Name */}
          <span className="text-white font-medium text-sm truncate max-w-[120px]">
            {name}
            {isLocal && ' (You)'}
          </span>
        </div>

        {/* Audio/Video indicators */}
        <div className="flex items-center gap-1.5">
          {!audioEnabled && (
            <span className="p-1.5 bg-red-500/20 text-red-400 rounded-full">
              <MicOff className="w-3.5 h-3.5" />
            </span>
          )}
          {!videoEnabled && (
            <span className="p-1.5 bg-red-500/20 text-red-400 rounded-full">
              <VideoOff className="w-3.5 h-3.5" />
            </span>
          )}
          {audioEnabled && (
            <span className="p-1.5 bg-green-500/20 text-green-400 rounded-full">
              <Mic className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Host controls overlay - visible on hover */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-end gap-1">
            {onAddFriend && (
              <button
                onClick={onAddFriend}
                className="p-2 bg-neutral-900/80 hover:bg-violet-600 text-white rounded-lg transition-colors"
                title="Add Friend"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            )}
            {onMute && (
              <button
                onClick={onMute}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isMuted 
                    ? 'bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400' 
                    : 'bg-neutral-900/80 hover:bg-neutral-700 text-white'
                )}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            {onKick && (
              <button
                onClick={onKick}
                className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                title="Remove from room"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Local indicator */}
      {isLocal && (
        <div className="absolute top-2 left-2">
          <span className="bg-violet-600/80 text-white px-2 py-0.5 rounded text-xs font-medium">
            You
          </span>
        </div>
      )}
    </div>
  );
}
