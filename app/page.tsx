'use client';

import dynamic from 'next/dynamic';

const MapWrapper = dynamic(() => import('@/components/Map/MapWrapper'), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-xl font-black italic text-red-600 animate-pulse tracking-widest">
          INITIALIZING RADAR...
        </div>
      </div>
    </div>
  )
});

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950">
      <MapWrapper />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.6)] z-[500]" />
    </main>
  );
}