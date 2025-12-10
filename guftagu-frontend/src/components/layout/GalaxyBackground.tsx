'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamically import LightRays to avoid SSR issues with WebGL
const LightRays = dynamic(() => import('@/components/ui/LightRays'), {
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
    <div className="fixed inset-0 z-0" style={{ backgroundColor: '#000000' }}>
      <LightRays
        raysOrigin="top-center"
        raysColor="#00ffff"
        raysSpeed={1.5}
        lightSpread={0.8}
        rayLength={1.2}
        followMouse={true}
        mouseInfluence={0.1}
        noiseAmount={0.1}
        distortion={0.05}
      />
    </div>
  );
}
