'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Video, Mic, Monitor, Lock, Copy, Check, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';
import { roomsApi } from '@/lib/api';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RoomSettings {
  videoEnabled: boolean;
  audioEnabled: boolean;
  screenShareEnabled: boolean;
}

export default function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'create' | 'success'>('create');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [roomName, setRoomName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [password, setPassword] = useState('');
  const [enablePassword, setEnablePassword] = useState(false);
  const [settings, setSettings] = useState<RoomSettings>({
    videoEnabled: true,
    audioEnabled: true,
    screenShareEnabled: true,
  });
  const [error, setError] = useState('');

  // Success state
  const [createdRoom, setCreatedRoom] = useState<{
    roomCode: string;
    roomName: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCreate = async () => {
    // Validate room name
    if (!roomName.trim()) {
      setError('Room name is required');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await roomsApi.createRoom({
        roomName: roomName.trim(),
        maxParticipants,
        password: enablePassword ? password : undefined,
        settings,
      });

      setCreatedRoom({
        roomCode: response.data.room.roomCode,
        roomName: response.data.room.roomName,
      });
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    if (createdRoom) {
      navigator.clipboard.writeText(createdRoom.roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyLink = () => {
    if (createdRoom) {
      const link = `${window.location.origin}/room/${createdRoom.roomCode}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const joinRoom = () => {
    if (createdRoom) {
      // Don't close modal - let room page handle the modal state
      router.push(`/room/${createdRoom.roomCode}`);
    }
  };

  const handleClose = () => {
    setStep('create');
    setRoomName('');
    setMaxParticipants(5);
    setPassword('');
    setEnablePassword(false);
    setSettings({
      videoEnabled: true,
      audioEnabled: true,
      screenShareEnabled: true,
    });
    setError('');
    setCreatedRoom(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-neutral-900/95 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="text-xl font-semibold text-white">
            {step === 'create' ? 'Create a New Room' : 'Room Created!'}
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
          {step === 'create' ? (
            <>
              {/* Room Name */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Room Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => {
                    setRoomName(e.target.value);
                    if (error === 'Room name is required') setError('');
                  }}
                  placeholder="Enter room name"
                  className={`w-full px-4 py-3 bg-neutral-800/50 border rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                    error === 'Room name is required' ? 'border-red-500' : 'border-neutral-700/50'
                  }`}
                />
                {error === 'Room name is required' && (
                  <p className="text-red-400 text-sm mt-1">Room name is required</p>
                )}
              </div>

              {/* Max Participants */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Max Participants: {maxParticipants}
                </label>
                <input
                  type="range"
                  min="2"
                  max="5"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                  className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between text-xs text-neutral-500 mt-1">
                  <span>2</span>
                  <span>5</span>
                </div>
              </div>

              {/* Room Settings */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-neutral-300 mb-3">
                  Room Settings
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <SettingToggle
                    icon={<Video className="w-4 h-4" />}
                    label="Video"
                    checked={settings.videoEnabled}
                    onChange={(v) => setSettings({ ...settings, videoEnabled: v })}
                  />
                  <SettingToggle
                    icon={<Mic className="w-4 h-4" />}
                    label="Audio"
                    checked={settings.audioEnabled}
                    onChange={(v) => setSettings({ ...settings, audioEnabled: v })}
                  />
                  <SettingToggle
                    icon={<Monitor className="w-4 h-4" />}
                    label="Screen Share"
                    checked={settings.screenShareEnabled}
                    onChange={(v) => setSettings({ ...settings, screenShareEnabled: v })}
                  />
                </div>
              </div>

              {/* General Error Display */}
              {error && error !== 'Room name is required' && (
                <div className="mb-5 p-3 bg-red-900/30 border border-red-800/50 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Password */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePassword}
                    onChange={(e) => setEnablePassword(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-violet-500 focus:ring-violet-500"
                  />
                  <Lock className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm text-neutral-300">Password Protection</span>
                </label>
                {enablePassword && (
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full mt-3 px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                )}
              </div>
            </>
          ) : (
            /* Success State */
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {createdRoom?.roomName}
              </h3>
              
              <div className="bg-neutral-800/50 rounded-xl p-4 mb-4">
                <p className="text-sm text-neutral-400 mb-2">Room Code</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-mono font-bold text-white tracking-wider">
                    {createdRoom?.roomCode}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    {copiedCode ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={copyLink}
                className="flex items-center justify-center gap-2 w-full py-3 text-neutral-400 hover:text-white border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors mb-4"
              >
                {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <ExternalLink className="w-4 h-4" />}
                {copiedLink ? 'Link Copied!' : 'Copy Room Link'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-800">
          {step === 'create' ? (
            <>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreate} isLoading={isLoading} className="flex-1">
                Create Room
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Close
              </Button>
              <Button onClick={joinRoom} className="flex-1">
                Join Room Now
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Setting Toggle Component
function SettingToggle({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors ${
        checked
          ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400'
          : 'bg-neutral-800/50 border-neutral-700/50 text-neutral-500'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}
