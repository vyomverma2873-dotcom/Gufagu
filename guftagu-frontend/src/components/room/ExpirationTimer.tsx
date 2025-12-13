'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface ExpirationTimerProps {
  expiresAt: string | Date;
  onExpired?: () => void;
}

export default function ExpirationTimer({ expiresAt, onExpired }: ExpirationTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expirationDate = new Date(expiresAt);
      const now = new Date();
      const difference = expirationDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        onExpired?.();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, total: difference });
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpired]);

  // Format time with leading zeros
  const formatTime = (value: number) => value.toString().padStart(2, '0');

  // Determine urgency level for styling
  const isUrgent = timeLeft.total <= 30 * 60 * 1000; // Less than 30 minutes
  const isWarning = timeLeft.total <= 60 * 60 * 1000; // Less than 1 hour
  const isCritical = timeLeft.total <= 5 * 60 * 1000; // Less than 5 minutes

  if (timeLeft.total <= 0) {
    return (
      <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/20 border border-red-500/50 rounded-lg animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
        <span className="text-xs sm:text-sm font-medium text-red-400">Expired</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors ${
        isCritical
          ? 'bg-red-500/20 border border-red-500/50 animate-pulse'
          : isUrgent
          ? 'bg-orange-500/20 border border-orange-500/50'
          : isWarning
          ? 'bg-yellow-500/20 border border-yellow-500/50'
          : 'bg-neutral-800/50 border border-neutral-700/50'
      }`}
    >
      <Clock
        className={`w-3.5 h-3.5 ${
          isCritical
            ? 'text-red-400'
            : isUrgent
            ? 'text-orange-400'
            : isWarning
            ? 'text-yellow-400'
            : 'text-neutral-400'
        }`}
      />
      <span
        className={`text-xs sm:text-sm font-mono font-medium ${
          isCritical
            ? 'text-red-400'
            : isUrgent
            ? 'text-orange-400'
            : isWarning
            ? 'text-yellow-400'
            : 'text-neutral-300'
        }`}
      >
        {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
      </span>
      <span className="hidden lg:inline text-xs text-neutral-500">left</span>
    </div>
  );
}
