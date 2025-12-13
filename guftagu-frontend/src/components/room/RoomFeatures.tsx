'use client';

import { Video, Mic, Monitor } from 'lucide-react';

interface RoomFeaturesProps {
  videoEnabled: boolean;
  audioEnabled: boolean;
  screenShareEnabled: boolean;
}

export default function RoomFeatures({
  videoEnabled,
  audioEnabled,
  screenShareEnabled,
}: RoomFeaturesProps) {
  const features = [
    {
      id: 'video',
      icon: <Video className="w-6 h-6" />,
      label: 'Video',
      enabled: videoEnabled,
      color: 'from-blue-500 to-cyan-500',
      glowColor: 'blue',
    },
    {
      id: 'audio',
      icon: <Mic className="w-6 h-6" />,
      label: 'Audio',
      enabled: audioEnabled,
      color: 'from-purple-500 to-pink-500',
      glowColor: 'purple',
    },
    {
      id: 'screen',
      icon: <Monitor className="w-6 h-6" />,
      label: 'Screen Share',
      enabled: screenShareEnabled,
      color: 'from-emerald-500 to-teal-500',
      glowColor: 'emerald',
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-neutral-300">Room Features (All Enabled by Default)</p>
      <div className="grid grid-cols-3 gap-3">
        {features.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>
    </div>
  );
}

interface FeatureCardProps {
  feature: {
    id: string;
    icon: React.ReactNode;
    label: string;
    enabled: boolean;
    color: string;
    glowColor: string;
  };
}

function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <div className="relative">
      <style jsx>{`
        @keyframes pulse-glow {
          0% {
            box-shadow: 0 0 8px rgba(${
              feature.glowColor === 'blue'
                ? '59, 130, 246'
                : feature.glowColor === 'purple'
                  ? '168, 85, 247'
                  : '16, 185, 129'
            }, 0.4), inset 0 0 8px rgba(${
              feature.glowColor === 'blue'
                ? '59, 130, 246'
                : feature.glowColor === 'purple'
                  ? '168, 85, 247'
                  : '16, 185, 129'
            }, 0.15);
          }
          50% {
            box-shadow: 0 0 24px rgba(${
              feature.glowColor === 'blue'
                ? '59, 130, 246'
                : feature.glowColor === 'purple'
                  ? '168, 85, 247'
                  : '16, 185, 129'
            }, 1), inset 0 0 24px rgba(${
              feature.glowColor === 'blue'
                ? '59, 130, 246'
                : feature.glowColor === 'purple'
                  ? '168, 85, 247'
                  : '16, 185, 129'
            }, 0.4);
          }
          100% {
            box-shadow: 0 0 8px rgba(${
              feature.glowColor === 'blue'
                ? '59, 130, 246'
                : feature.glowColor === 'purple'
                  ? '168, 85, 247'
                  : '16, 185, 129'
            }, 0.4), inset 0 0 8px rgba(${
              feature.glowColor === 'blue'
                ? '59, 130, 246'
                : feature.glowColor === 'purple'
                  ? '168, 85, 247'
                  : '16, 185, 129'
            }, 0.15);
          }
        }

        @keyframes scale-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes border-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .glow-pulse {
          animation: pulse-glow 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .scale-pulse {
          animation: scale-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .feature-card {
          position: relative;
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          background: linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(40, 40, 40, 0.6) 100%);
          border: 2px solid transparent;
          background-clip: padding-box;
          transition: all 0.3s ease;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 12px;
          padding: 2px;
          background: linear-gradient(
            135deg,
            ${
              feature.glowColor === 'blue'
                ? 'rgb(59, 130, 246) 0%, rgb(6, 182, 212) 100%'
                : feature.glowColor === 'purple'
                  ? 'rgb(168, 85, 247) 0%, rgb(236, 72, 153) 100%'
                  : 'rgb(16, 185, 129) 0%, rgb(20, 184, 166) 100%'
            }
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.7;
          animation: border-shift 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .feature-icon {
          position: relative;
          z-index: 1;
          animation: scale-pulse 2.5s ease-in-out infinite;
        }
      `}</style>

      <div className={`feature-card glow-pulse`}>
        <div className="feature-icon text-white">
          {feature.icon}
        </div>
        <span className="text-xs font-semibold text-white text-center">
          {feature.label}
        </span>
        <div className="text-xs text-green-400 font-medium">✓ Active</div>
      </div>
    </div>
  );
}
