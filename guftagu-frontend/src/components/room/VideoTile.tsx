'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Crown, 
  UserPlus, 
  UserMinus,
  Loader2,
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
  isCurrentUserHost?: boolean;
  onMute?: () => void;
  onKick?: () => void;
  onAddFriend?: () => void;
  isAddingFriend?: boolean;
  isMuting?: boolean;
  isKicking?: boolean;
  className?: string;
}

function VideoTile({
  stream,
  username,
  displayName,
  profilePicture,
  isHost,
  isMuted,
  audioEnabled,
  videoEnabled,
  isLocal,
  isCurrentUserHost = false,
  onMute,
  onKick,
  onAddFriend,
  isAddingFriend = false,
  isMuting = false,
  isKicking = false,
  className,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Attach stream to video element - keep video element always mounted
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && stream) {
      // Always set srcObject when stream exists
      videoElement.srcObject = stream;
      
      // Handle video ready state
      const handleCanPlay = () => {
        setIsVideoReady(true);
      };
      
      videoElement.addEventListener('canplay', handleCanPlay);
      
      // Handle video play
      const playVideo = async () => {
        try {
          await videoElement.play();
        } catch (err) {
          console.log('Video autoplay prevented, user interaction may be needed');
        }
      };
      
      playVideo();
      
      return () => {
        videoElement.removeEventListener('canplay', handleCanPlay);
      };
    } else {
      setIsVideoReady(false);
    }
    
    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [stream]);

  const name = displayName || username;

  // Determine if we should show any hover actions
  const hasActions = !isLocal && (onAddFriend || (isCurrentUserHost && !isHost && (onMute || onKick)));

  return (
    <div
      className={cn(
        'participant-card relative bg-neutral-900 rounded-xl overflow-hidden aspect-video group',
        'border border-neutral-800/50 shadow-lg',
        'transform-gpu', // Hardware acceleration
        className
      )}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      {/* Video element - ALWAYS mounted to prevent black screen on toggle */}
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={cn(
            'absolute inset-0 w-full h-full object-contain bg-neutral-900',
            'transition-opacity duration-300 ease-out',
            (!videoEnabled || !isVideoReady) && 'opacity-0'
          )}
        />
      )}
      
      {/* Avatar placeholder when video is off or not ready */}
      <div 
        className={cn(
          'absolute inset-0 flex items-center justify-center bg-neutral-800',
          'transition-opacity duration-300 ease-out',
          (stream && videoEnabled && isVideoReady) ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        <Avatar
          src={profilePicture}
          alt={name}
          size="xl"
          className="w-16 h-16 sm:w-24 sm:h-24 text-2xl sm:text-3xl"
        />
      </div>

      {/* Full overlay on hover (groupcall.md spec lines 223-236) */}
      {hasActions && showOverlay && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in">
          {/* User Info */}
          <div className="text-center mb-4">
            <Avatar
              src={profilePicture}
              alt={name}
              size="lg"
              className="w-16 h-16 mx-auto mb-2"
            />
            <div className="flex items-center justify-center gap-2 mb-1">
              {isHost && <Crown className="w-4 h-4 text-yellow-400" />}
              <span className="text-white font-semibold">{name}</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-xs">
              <span className={audioEnabled && !isMuted ? 'text-green-400' : 'text-red-400'}>
                {audioEnabled && !isMuted ? (
                  <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> Audio: ON</span>
                ) : (
                  <span className="flex items-center gap-1"><MicOff className="w-3 h-3" /> Audio: OFF</span>
                )}
              </span>
              <span className={videoEnabled ? 'text-green-400' : 'text-red-400'}>
                {videoEnabled ? (
                  <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Video: ON</span>
                ) : (
                  <span className="flex items-center gap-1"><VideoOff className="w-3 h-3" /> Video: OFF</span>
                )}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 w-full max-w-[180px]">
            {/* Add Friend - Available to ALL users */}
            {onAddFriend && (
              <button
                onClick={onAddFriend}
                disabled={isAddingFriend}
                className="w-full py-2 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                {isAddingFriend ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {isAddingFriend ? 'Sending...' : 'Add Friend'}
              </button>
            )}

            {/* Host Controls - Only visible to host for non-host participants */}
            {isCurrentUserHost && !isHost && (
              <>
                {onMute && (
                  <button
                    onClick={onMute}
                    disabled={isMuting}
                    className={cn(
                      'w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:cursor-not-allowed',
                      isMuted
                        ? 'bg-yellow-500/20 hover:bg-yellow-500/30 disabled:bg-yellow-500/10 text-yellow-400'
                        : 'bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-700/50 text-white'
                    )}
                  >
                    {isMuting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isMuted ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                    {isMuting ? 'Processing...' : isMuted ? 'Unmute' : 'Mute'}
                  </button>
                )}
                {onKick && (
                  <button
                    onClick={onKick}
                    disabled={isKicking}
                    className="w-full py-2 px-4 bg-red-500/20 hover:bg-red-500/30 disabled:bg-red-500/10 disabled:cursor-not-allowed text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {isKicking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserMinus className="w-4 h-4" />
                    )}
                    {isKicking ? 'Removing...' : 'Kick'}
                  </button>
                )}
              </>
            )}
          </div>
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
          {(!audioEnabled || isMuted) && (
            <span className="p-1.5 bg-red-500/20 text-red-400 rounded-full">
              <MicOff className="w-3.5 h-3.5" />
            </span>
          )}
          {!videoEnabled && (
            <span className="p-1.5 bg-red-500/20 text-red-400 rounded-full">
              <VideoOff className="w-3.5 h-3.5" />
            </span>
          )}
          {audioEnabled && !isMuted && (
            <span className="p-1.5 bg-green-500/20 text-green-400 rounded-full">
              <Mic className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

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

// Export memoized component for performance
export default memo(VideoTile);
