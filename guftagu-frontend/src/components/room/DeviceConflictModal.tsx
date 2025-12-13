'use client';

import { AlertTriangle, Monitor, Smartphone, X } from 'lucide-react';

interface DeviceConflictModalProps {
  isOpen: boolean;
  onDisconnectOther: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function DeviceConflictModal({
  isOpen,
  onDisconnectOther,
  onCancel,
  isLoading = false,
}: DeviceConflictModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-full">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-white">Already Connected</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-300">
            You're already in this room on another device. You can only be in one device at a time.
          </p>

          {/* Device illustration */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                <Monitor className="w-8 h-8 text-red-400" />
              </div>
              <span className="text-sm text-gray-400">Device 1</span>
              <span className="text-xs text-red-400">Connected</span>
            </div>
            
            <div className="text-gray-600 text-2xl">→</div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                <Smartphone className="w-8 h-8 text-gray-400" />
              </div>
              <span className="text-sm text-gray-400">This Device</span>
              <span className="text-xs text-gray-500">Waiting</span>
            </div>
          </div>

          <p className="text-sm text-gray-400 text-center">
            Would you like to disconnect from the other device and connect here instead?
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-xl font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onDisconnectOther}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              'Disconnect & Join Here'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
