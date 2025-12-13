'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp,
  MonitorOff,
  Settings,
  PhoneOff,
} from 'lucide-react';

interface ControlsBarProps {
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onOpenSettings?: () => void;
  onLeave: () => void;
}

export default function ControlsBar({
  audioEnabled,
  videoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onOpenSettings,
  onLeave,
}: ControlsBarProps) {
  const [screenShareSupported, setScreenShareSupported] = useState(true);
  const [showUnsupportedMessage, setShowUnsupportedMessage] = useState(false);

  // Check if screen sharing is supported
  useEffect(() => {
    const checkScreenShareSupport = () => {
      // Check if getDisplayMedia is available
      const hasGetDisplayMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
      
      // Check if it's a mobile device (screen share often fails on mobile even if API exists)
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // iOS Safari doesn't support screen sharing at all
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      setScreenShareSupported(hasGetDisplayMedia && !isIOS);
    };
    
    checkScreenShareSupport();
  }, []);

  const handleScreenShare = () => {
    if (!screenShareSupported) {
      setShowUnsupportedMessage(true);
      setTimeout(() => setShowUnsupportedMessage(false), 3000);
      return;
    }
    onToggleScreenShare();
  };
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 z-30 safe-area-bottom">
      {/* Screen share not supported message */}
      {showUnsupportedMessage && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-2 bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded-xl text-sm whitespace-nowrap animate-fade-in">
          Screen sharing is not supported on this device
        </div>
      )}
      
      <div className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 px-3 sm:px-6">
        {/* Microphone toggle */}
        <button
          onClick={onToggleAudio}
          onTouchEnd={(e) => {
            e.preventDefault();
            onToggleAudio();
          }}
          className={cn(
            'p-3 sm:p-4 rounded-full transition-all duration-200 touch-manipulation active:scale-95',
            audioEnabled
              ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          )}
          title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {audioEnabled ? (
            <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </button>

        {/* Camera toggle */}
        <button
          onClick={onToggleVideo}
          onTouchEnd={(e) => {
            e.preventDefault();
            onToggleVideo();
          }}
          className={cn(
            'p-3 sm:p-4 rounded-full transition-all duration-200 touch-manipulation active:scale-95',
            videoEnabled
              ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          )}
          title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {videoEnabled ? (
            <Video className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </button>

        {/* Screen share toggle */}
        <button
          onClick={handleScreenShare}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleScreenShare();
          }}
          className={cn(
            'p-3 sm:p-4 rounded-full transition-all duration-200 touch-manipulation active:scale-95',
            !screenShareSupported
              ? 'bg-neutral-800/50 text-neutral-500 cursor-not-allowed'
              : isScreenSharing
                ? 'bg-violet-600 hover:bg-violet-700 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-white'
          )}
          title={!screenShareSupported ? 'Screen sharing not supported on this device' : isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          {isScreenSharing ? (
            <MonitorOff className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <MonitorUp className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </button>

        {/* Settings - Hidden on mobile */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="hidden sm:flex p-3 sm:p-4 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-all duration-200"
            title="Settings"
          >
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Divider - Hidden on mobile */}
        <div className="hidden sm:block w-px h-10 bg-neutral-700 mx-2" />

        {/* Leave call button */}
        <button
          onClick={onLeave}
          onTouchEnd={(e) => {
            e.preventDefault();
            onLeave();
          }}
          className="px-4 sm:px-6 py-3 sm:py-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 flex items-center gap-2 touch-manipulation active:scale-95"
          title="Leave room"
        >
          <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="font-medium text-sm sm:text-base">Leave</span>
        </button>
      </div>
    </div>
  );
}
