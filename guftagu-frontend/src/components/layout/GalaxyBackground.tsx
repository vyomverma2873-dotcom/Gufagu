'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamically import Galaxy to avoid SSR issues with WebGL
const Galaxy = dynamic(() => import('@/components/ui/Galaxy'), {
  ssr: false,
  loading: () => null,
});

export default function GalaxyBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 pointer-events-auto">
        <Galaxy
          mouseRepulsion={true}
          mouseInteraction={true}
          density={1.5}
          glowIntensity={0.5}
          saturation={0.8}
          hueShift={240}
          transparent={false}
          speed={0.8}
          twinkleIntensity={0.4}
          rotationSpeed={0.05}
        />
      </div>
      {/* Subtle overlay to ensure text readability */}
      <div className="absolute inset-0 bg-zinc-950/30 pointer-events-none" />
    </div>
  );
}
