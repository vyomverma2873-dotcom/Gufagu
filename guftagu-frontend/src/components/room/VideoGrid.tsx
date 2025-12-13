'use client';

import { useMemo, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import VideoTile from './VideoTile';

interface Participant {
  socketId: string;
  _id: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  isHost: boolean;
  isMuted: boolean;
  stream?: MediaStream;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

interface VideoGridProps {
  localStream: MediaStream | null;
  localUser: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
  };
  isHost: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  participants: Participant[];
  onMuteParticipant?: (userId: string, mute: boolean) => void;
  onKickParticipant?: (userId: string) => void;
  onAddFriend?: (userId: string) => void;
  currentUserId: string;
}

// Memoized VideoTile wrapper for performance
const MemoizedVideoTile = memo(VideoTile);

export default function VideoGrid({
  localStream,
  localUser,
  isHost,
  audioEnabled,
  videoEnabled,
  participants,
  onMuteParticipant,
  onKickParticipant,
  onAddFriend,
  currentUserId,
}: VideoGridProps) {
  // Total count includes local user
  const totalParticipants = participants.length + 1;

  // Optimized grid layout calculation using CSS Grid
  const gridStyles = useMemo(() => {
    // Define optimal layouts for each participant count
    const layouts: Record<number, { columns: number; rows: number; mobileColumns: number }> = {
      1: { columns: 1, rows: 1, mobileColumns: 1 },
      2: { columns: 2, rows: 1, mobileColumns: 1 },
      3: { columns: 3, rows: 1, mobileColumns: 1 },
      4: { columns: 2, rows: 2, mobileColumns: 2 },
      5: { columns: 3, rows: 2, mobileColumns: 2 }, // 3 on top, 2 centered on bottom
    };

    const layout = layouts[Math.min(totalParticipants, 5)] || layouts[5];
    
    return {
      '--grid-cols': layout.columns,
      '--grid-rows': layout.rows,
      '--mobile-cols': layout.mobileColumns,
    } as React.CSSProperties;
  }, [totalParticipants]);

  // Calculate container and tile classes based on participant count
  const containerClass = useMemo(() => {
    const baseClass = 'video-grid-container grid gap-3 sm:gap-4 w-full h-full place-items-center';
    
    // Custom grid templates for different counts
    switch (totalParticipants) {
      case 1:
        return cn(baseClass, 'grid-cols-1 grid-rows-1');
      case 2:
        return cn(baseClass, 'grid-cols-1 sm:grid-cols-2 grid-rows-2 sm:grid-rows-1');
      case 3:
        return cn(baseClass, 'grid-cols-1 sm:grid-cols-3 grid-rows-3 sm:grid-rows-1');
      case 4:
        return cn(baseClass, 'grid-cols-2 grid-rows-2');
      case 5:
        return cn(baseClass, 'grid-cols-2 sm:grid-cols-3 grid-rows-3 sm:grid-rows-2');
      default:
        return cn(baseClass, 'grid-cols-2 sm:grid-cols-3 grid-rows-3 sm:grid-rows-2');
    }
  }, [totalParticipants]);

  // Calculate individual tile sizing based on count
  const tileClass = useMemo(() => {
    const baseClass = 'video-tile-wrapper w-full h-full max-h-full';
    
    switch (totalParticipants) {
      case 1:
        return cn(baseClass, 'max-w-[90vw] sm:max-w-4xl aspect-video');
      case 2:
        return cn(baseClass, 'aspect-video');
      case 3:
        return cn(baseClass, 'aspect-video');
      case 4:
        return cn(baseClass, 'aspect-video');
      case 5:
        return cn(baseClass, 'aspect-video');
      default:
        return cn(baseClass, 'aspect-video');
    }
  }, [totalParticipants]);

  // Special styling for 5-participant layout (3 on top, 2 centered on bottom)
  const getSpecialTileStyle = useCallback((index: number) => {
    if (totalParticipants === 5 && index >= 3) {
      // Center the last 2 tiles on the bottom row for desktop
      return {
        gridColumn: index === 3 ? '1 / 2' : '2 / 3',
      };
    }
    return {};
  }, [totalParticipants]);

  // Memoized callback handlers
  const handleMuteParticipant = useCallback(
    (userId: string, isMuted: boolean) => {
      onMuteParticipant?.(userId, !isMuted);
    },
    [onMuteParticipant]
  );

  const handleKickParticipant = useCallback(
    (userId: string) => {
      onKickParticipant?.(userId);
    },
    [onKickParticipant]
  );

  const handleAddFriend = useCallback(
    (userId: string) => {
      onAddFriend?.(userId);
    },
    [onAddFriend]
  );

  return (
    <div className="video-grid-root absolute inset-0 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <style jsx global>{`
        /* Smooth grid transition animations */
        .video-grid-container {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Individual tile animations */
        .video-tile-wrapper {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: tileEnter 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        @keyframes tileEnter {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        /* Smooth size transitions for video tiles */
        .participant-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Responsive grid adjustments for 5 participants */
        @media (min-width: 640px) {
          .video-grid-container.five-participants {
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(2, 1fr);
          }
          
          .video-grid-container.five-participants .video-tile-wrapper:nth-child(4) {
            grid-column: 1 / 2;
            justify-self: end;
            width: 90%;
          }
          
          .video-grid-container.five-participants .video-tile-wrapper:nth-child(5) {
            grid-column: 2 / 3;
            justify-self: start;
            width: 90%;
          }
        }
        
        /* Ensure videos maintain aspect ratio and don't crop */
        .video-tile-wrapper video {
          object-fit: contain;
          background: #1a1a1a;
        }
        
        /* Hardware acceleration for smooth animations */
        .video-tile-wrapper,
        .participant-card {
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
      
      <div
        className={cn(
          containerClass,
          totalParticipants === 5 && 'five-participants'
        )}
        style={gridStyles}
      >
        {/* Local user video tile */}
        <div className={tileClass} style={getSpecialTileStyle(0)}>
          <MemoizedVideoTile
            stream={localStream}
            username={localUser.username}
            displayName={localUser.displayName}
            profilePicture={localUser.profilePicture}
            isHost={isHost}
            isMuted={!audioEnabled}
            audioEnabled={audioEnabled}
            videoEnabled={videoEnabled}
            isLocal={true}
          />
        </div>

        {/* Remote participant video tiles */}
        {participants.map((participant, index) => (
          <div
            key={participant.socketId}
            className={tileClass}
            style={getSpecialTileStyle(index + 1)}
          >
            <MemoizedVideoTile
              stream={participant.stream}
              username={participant.username}
              displayName={participant.displayName}
              profilePicture={participant.profilePicture}
              isHost={participant.isHost}
              isMuted={participant.isMuted}
              audioEnabled={participant.audioEnabled}
              videoEnabled={participant.videoEnabled}
              isLocal={false}
              isCurrentUserHost={isHost}
              onMute={() => handleMuteParticipant(participant._id, participant.isMuted)}
              onKick={() => handleKickParticipant(participant._id)}
              onAddFriend={() => handleAddFriend(participant._id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
