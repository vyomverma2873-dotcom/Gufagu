'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Users, Lock, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import { roomsApi } from '@/lib/api';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RoomPreview {
  roomCode: string;
  roomName: string;
  host: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
  };
  maxParticipants: number;
  currentParticipants: number;
  hasPassword: boolean;
}

export default function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'code' | 'preview' | 'password'>('code');
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomPreview, setRoomPreview] = useState<RoomPreview | null>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow alphanumeric characters, max 8
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    setRoomCode(value);
    setError(null);
  };

  const handleLookup = async () => {
    if (roomCode.length !== 8) {
      setError('Room code must be 8 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await roomsApi.getRoomDetails(roomCode);
      setRoomPreview(response.data.room);
      setStep('preview');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Room not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!roomPreview) return;

    setIsLoading(true);
    setError(null);

    try {
      await roomsApi.joinRoom(roomCode, password || undefined);
      router.push(`/room/${roomCode}`);
      handleClose();
    } catch (err: any) {
      if (err.response?.data?.requiresPassword) {
        setStep('password');
      } else {
        setError(err.response?.data?.error || 'Failed to join room');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('code');
    setRoomCode('');
    setPassword('');
    setError(null);
    setRoomPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-neutral-900/95 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="text-xl font-semibold text-white">
            {step === 'code' && 'Join a Room'}
            {step === 'preview' && 'Room Preview'}
            {step === 'password' && 'Password Required'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {step === 'code' && (
            <>
              <p className="text-neutral-400 mb-4">
                Enter the 8-character room code to join a video call.
              </p>
              
              <div className="mb-4">
                <input
                  type="text"
                  value={roomCode}
                  onChange={handleCodeChange}
                  placeholder="Enter room code"
                  className="w-full px-4 py-4 text-center text-2xl font-mono tracking-[0.3em] bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500 uppercase"
                  autoFocus
                />
                <p className="text-xs text-neutral-500 text-center mt-2">
                  {roomCode.length}/8 characters
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-800/50 rounded-lg mb-4">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}
            </>
          )}

          {step === 'preview' && roomPreview && (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🎥</div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  {roomPreview.roomName}
                </h3>
                <div className="flex items-center justify-center gap-2 text-neutral-400">
                  <Avatar
                    src={roomPreview.host.profilePicture}
                    alt={roomPreview.host.displayName || roomPreview.host.username}
                    size="xs"
                  />
                  <span>Hosted by {roomPreview.host.displayName || roomPreview.host.username}</span>
                </div>
              </div>

              <div className="bg-neutral-800/50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Users className="w-4 h-4" />
                    <span>Participants</span>
                  </div>
                  <span className="text-white font-medium">
                    {roomPreview.currentParticipants}/{roomPreview.maxParticipants}
                  </span>
                </div>
                {roomPreview.hasPassword && (
                  <div className="flex items-center gap-2 text-amber-400 mt-3 pt-3 border-t border-neutral-700">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm">Password protected</span>
                  </div>
                )}
              </div>

              {roomPreview.currentParticipants >= roomPreview.maxParticipants && (
                <div className="p-3 bg-yellow-900/30 border border-yellow-800/50 rounded-lg mb-4">
                  <p className="text-yellow-400 text-sm text-center">
                    This room is currently full
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-800/50 rounded-lg mb-4">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}
            </>
          )}

          {step === 'password' && (
            <>
              <div className="text-center mb-4">
                <div className="inline-flex p-3 bg-amber-900/30 rounded-full mb-3">
                  <Lock className="w-6 h-6 text-amber-400" />
                </div>
                <p className="text-neutral-400">
                  This room requires a password to join.
                </p>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
                autoFocus
              />

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-800/50 rounded-lg mb-4">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-800">
          {step === 'code' && (
            <>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleLookup} 
                isLoading={isLoading} 
                disabled={roomCode.length !== 8}
                className="flex-1"
              >
                {!isLoading && (
                  <>
                    Find Room
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
                {isLoading && 'Finding...'}
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setStep('code')} 
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleJoin} 
                isLoading={isLoading}
                disabled={roomPreview ? roomPreview.currentParticipants >= roomPreview.maxParticipants : false}
                className="flex-1"
              >
                Join Room
              </Button>
            </>
          )}

          {step === 'password' && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setStep('preview')} 
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleJoin} 
                isLoading={isLoading}
                disabled={!password}
                className="flex-1"
              >
                Join Room
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
