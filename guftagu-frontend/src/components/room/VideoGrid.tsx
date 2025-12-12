'use client';

import { useEffect, useRef } from 'react';
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

  // Calculate grid layout based on participant count
  const getGridClass = () => {
    switch (totalParticipants) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-3';
      case 4:
        return 'grid-cols-2 grid-rows-2';
      case 5:
      case 6:
        return 'grid-cols-3 grid-rows-2';
      case 7:
      case 8:
      case 9:
        return 'grid-cols-3 grid-rows-3';
      default:
        return 'grid-cols-4';
    }
  };

  // Get tile size class
  const getTileClass = () => {
    if (totalParticipants === 1) {
      return 'max-w-4xl max-h-[80vh]';
    }
    return '';
  };

  return (
    <div className="w-full h-full p-4 flex items-center justify-center">
      <div
        className={cn(
          'grid gap-3 w-full h-full',
          getGridClass(),
          totalParticipants === 1 && 'place-items-center'
        )}
      >
        {/* Local user video tile */}
        <VideoTile
          stream={localStream}
          username={localUser.username}
          displayName={localUser.displayName}
          profilePicture={localUser.profilePicture}
          isHost={isHost}
          isMuted={!audioEnabled}
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          isLocal={true}
          className={getTileClass()}
        />

        {/* Remote participant video tiles */}
        {participants.map((participant) => (
          <VideoTile
            key={participant.socketId}
            stream={participant.stream}
            username={participant.username}
            displayName={participant.displayName}
            profilePicture={participant.profilePicture}
            isHost={participant.isHost}
            isMuted={participant.isMuted}
            audioEnabled={participant.audioEnabled}
            videoEnabled={participant.videoEnabled}
            isLocal={false}
            showControls={isHost && !participant.isHost}
            onMute={onMuteParticipant ? () => onMuteParticipant(participant._id, !participant.isMuted) : undefined}
            onKick={onKickParticipant ? () => onKickParticipant(participant._id) : undefined}
            onAddFriend={onAddFriend ? () => onAddFriend(participant._id) : undefined}
            className={getTileClass()}
          />
        ))}
      </div>
    </div>
  );
}
