'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import IncomingCallOverlay from '@/components/IncomingCallOverlay';
import VideoCallOverlay from '@/components/VideoCallOverlay';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <IncomingCallOverlay />
          <VideoCallOverlay />
          {children}
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
