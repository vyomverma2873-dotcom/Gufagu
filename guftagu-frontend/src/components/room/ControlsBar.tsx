'use client';

import { cn } from '@/lib/utils';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp,
  MonitorOff,
  MessageSquare,
  Settings,
  PhoneOff,
  MoreHorizontal
} from 'lucide-react';

interface ControlsBarProps {
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
  chatEnabled?: boolean;
  showChat?: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat?: () => void;
  onOpenSettings?: () => void;
  onLeave: () => void;
}

export default function ControlsBar({
  audioEnabled,
  videoEnabled,
  isScreenSharing,
  chatEnabled = true,
  showChat = false,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onOpenSettings,
  onLeave,
}: ControlsBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-neutral-900/90 backdrop-blur-sm border-t border-neutral-800">
      <div className="flex items-center justify-center gap-2 py-4 px-6">
        {/* Microphone toggle */}
        <button
          onClick={onToggleAudio}
          className={cn(
            'p-4 rounded-full transition-all duration-200',
            audioEnabled
              ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          )}
          title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {audioEnabled ? (
            <Mic className="w-6 h-6" />
          ) : (
            <MicOff className="w-6 h-6" />
          )}
        </button>

        {/* Camera toggle */}
        <button
          onClick={onToggleVideo}
          className={cn(
            'p-4 rounded-full transition-all duration-200',
            videoEnabled
              ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          )}
          title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {videoEnabled ? (
            <Video className="w-6 h-6" />
          ) : (
            <VideoOff className="w-6 h-6" />
          )}
        </button>

        {/* Screen share toggle */}
        <button
          onClick={onToggleScreenShare}
          className={cn(
            'p-4 rounded-full transition-all duration-200',
            isScreenSharing
              ? 'bg-violet-600 hover:bg-violet-700 text-white'
              : 'bg-neutral-800 hover:bg-neutral-700 text-white'
          )}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          {isScreenSharing ? (
            <MonitorOff className="w-6 h-6" />
          ) : (
            <MonitorUp className="w-6 h-6" />
          )}
        </button>

        {/* Chat toggle */}
        {chatEnabled && onToggleChat && (
          <button
            onClick={onToggleChat}
            className={cn(
              'p-4 rounded-full transition-all duration-200',
              showChat
                ? 'bg-violet-600 hover:bg-violet-700 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-white'
            )}
            title={showChat ? 'Close chat' : 'Open chat'}
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        )}

        {/* Settings */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-4 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-all duration-200"
            title="Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
        )}

        {/* Divider */}
        <div className="w-px h-10 bg-neutral-700 mx-2" />

        {/* Leave call button */}
        <button
          onClick={onLeave}
          className="px-6 py-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 flex items-center gap-2"
          title="Leave room"
        >
          <PhoneOff className="w-6 h-6" />
          <span className="font-medium">Leave</span>
        </button>
      </div>
    </div>
  );
}
