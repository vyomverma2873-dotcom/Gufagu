'use client';

import { useState } from 'react';
import { X, Copy, Check, Link2, MessageCircle, Users } from 'lucide-react';
import Button from '@/components/ui/Button';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  roomName: string;
}

export default function InviteModal({
  isOpen,
  onClose,
  roomCode,
  roomName,
}: InviteModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const roomLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/room/${roomCode}` 
    : `/room/${roomCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `Join my room "${roomName}" on Guftagu!\n\nRoom Code: ${roomCode}\nLink: ${roomLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `Join my Guftagu room: ${roomName}`;
    const body = `Hey!

I'd like you to join my video chat room on Guftagu.

Room Name: ${roomName}
Room Code: ${roomCode}
Direct Link: ${roomLink}

See you there!`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-neutral-900/95 border border-neutral-800 rounded-2xl w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Invite People</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Room Code */}
          <div>
            <label className="block text-sm text-neutral-400 mb-2">Room Code</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-4 py-3 font-mono text-lg text-white tracking-wider">
                {roomCode}
              </div>
              <button
                onClick={handleCopyCode}
                className={`p-3 rounded-xl transition-all ${
                  copiedCode 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                }`}
              >
                {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Room Link */}
          <div>
            <label className="block text-sm text-neutral-400 mb-2">Share Link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-4 py-3 text-sm text-neutral-300 truncate">
                {roomLink}
              </div>
              <button
                onClick={handleCopyLink}
                className={`p-3 rounded-xl transition-all ${
                  copiedLink 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                }`}
              >
                {copiedLink ? <Check className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Share via */}
          <div>
            <label className="block text-sm text-neutral-400 mb-3">Or share via</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-xl transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </button>
              <button
                onClick={handleShareEmail}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
