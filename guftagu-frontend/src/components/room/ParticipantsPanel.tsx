'use client';

import { cn } from '@/lib/utils';
import {
  X,
  Crown,
  Mic,
  MicOff,
  Video,
  VideoOff,
  UserPlus,
  UserMinus,
  Users,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

interface Participant {
  socketId: string;
  _id: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  isHost: boolean;
  isMuted: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

interface ParticipantsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  localUser: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
  };
  isLocalHost: boolean;
  localAudioEnabled: boolean;
  localVideoEnabled: boolean;
  maxParticipants: number;
  onMuteParticipant?: (userId: string, mute: boolean) => void;
  onKickParticipant?: (userId: string) => void;
  onAddFriend?: (username: string) => void;
  onInvite?: () => void;
  currentUserId: string;
}

export default function ParticipantsPanel({
  isOpen,
  onClose,
  participants,
  localUser,
  isLocalHost,
  localAudioEnabled,
  localVideoEnabled,
  maxParticipants,
  onMuteParticipant,
  onKickParticipant,
  onAddFriend,
  onInvite,
  currentUserId,
}: ParticipantsPanelProps) {
  const totalParticipants = participants.length + 1; // +1 for local user

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div 
        className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 lg:w-80 bg-neutral-900/95 backdrop-blur-sm border-l border-neutral-800 z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
            <h2 className="text-base sm:text-lg font-semibold text-white">
              Participants ({totalParticipants}/{maxParticipants})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Local User (You) */}
        <div className="p-3 rounded-xl bg-neutral-800/50 mb-2">
          <div className="flex items-center gap-3">
            <Avatar
              src={localUser.profilePicture}
              alt={localUser.displayName || localUser.username}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isLocalHost && (
                  <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                )}
                <span className="text-white font-medium truncate">
                  {localUser.displayName || localUser.username}
                </span>
                <span className="text-neutral-500 text-sm">(You)</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {localAudioEnabled ? (
                  <span className="text-green-400 flex items-center gap-1 text-xs">
                    <Mic className="w-3 h-3" /> Audio
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1 text-xs">
                    <MicOff className="w-3 h-3" /> Muted
                  </span>
                )}
                {localVideoEnabled ? (
                  <span className="text-green-400 flex items-center gap-1 text-xs">
                    <Video className="w-3 h-3" /> Video
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1 text-xs">
                    <VideoOff className="w-3 h-3" /> Off
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Other Participants */}
        {participants.map((participant) => (
          <div
            key={participant.socketId}
            className="p-3 rounded-xl hover:bg-neutral-800/50 transition-colors mb-2 group"
          >
            <div className="flex items-center gap-3">
              <Avatar
                src={participant.profilePicture}
                alt={participant.displayName || participant.username}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {participant.isHost && (
                    <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  )}
                  <span className="text-white font-medium truncate">
                    {participant.displayName || participant.username}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {participant.audioEnabled && !participant.isMuted ? (
                    <span className="text-green-400 flex items-center gap-1 text-xs">
                      <Mic className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1 text-xs">
                      <MicOff className="w-3 h-3" /> {participant.isMuted ? 'Muted' : 'Off'}
                    </span>
                  )}
                  {participant.videoEnabled ? (
                    <span className="text-green-400 flex items-center gap-1 text-xs">
                      <Video className="w-3 h-3" /> Video
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1 text-xs">
                      <VideoOff className="w-3 h-3" /> Off
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Add Friend - Available to all users */}
                {onAddFriend && participant._id !== currentUserId && (
                  <button
                    onClick={() => onAddFriend(participant.username)}
                    className="p-2 hover:bg-violet-600 text-neutral-400 hover:text-white rounded-lg transition-colors"
                    title="Add Friend"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}

                {/* Host Controls */}
                {isLocalHost && !participant.isHost && (
                  <>
                    {/* Mute/Unmute */}
                    {onMuteParticipant && (
                      <button
                        onClick={() => onMuteParticipant(participant._id, !participant.isMuted)}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          participant.isMuted
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40'
                            : 'hover:bg-neutral-700 text-neutral-400 hover:text-white'
                        )}
                        title={participant.isMuted ? 'Unmute' : 'Mute'}
                      >
                        {participant.isMuted ? (
                          <MicOff className="w-4 h-4" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {/* Kick */}
                    {onKickParticipant && (
                      <button
                        onClick={() => onKickParticipant(participant._id)}
                        className="p-2 hover:bg-red-500/30 text-neutral-400 hover:text-red-400 rounded-lg transition-colors"
                        title="Remove from room"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Invite More Button */}
      {onInvite && (
        <div className="p-4 border-t border-neutral-800">
          <button
            onClick={onInvite}
            className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Invite More
          </button>
        </div>
      )}
    </div>
    </>
  );
}
