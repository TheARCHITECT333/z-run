'use client';

import { Position } from '@/hooks/useGeolocation';
import { useEffect, useRef, useState } from 'react';

interface Props {
  currentPosition: Position;
  onMove: (pos: Position) => void;
}

type Direction = 'N' | 'S' | 'E' | 'W' | null;

export default function DebugJoystick({ currentPosition, onMove }: Props) {
  const [activeDirection, setActiveDirection] = useState<Direction>(null);
  const requestRef = useRef<number>(0);

  const SPEED = 0.000008;

  useEffect(() => {
    const moveLoop = () => {
      if (activeDirection) {
        let dLat = 0;
        let dLng = 0;

        switch (activeDirection) {
          case 'N': dLat = SPEED; break;
          case 'S': dLat = -SPEED; break;
          case 'E': dLng = SPEED; break;
          case 'W': dLng = -SPEED; break;
        }

        onMove({
          lat: currentPosition.lat + dLat,
          lng: currentPosition.lng + dLng,
          accuracy: 5,
        });
      }
      requestRef.current = requestAnimationFrame(moveLoop);
    };

    requestRef.current = requestAnimationFrame(moveLoop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [currentPosition, onMove, activeDirection]);

  const ControlButton = ({ dir, label, className }: { dir: Direction, label: string, className: string }) => (
    <button
      onMouseDown={() => setActiveDirection(dir)}
      onMouseUp={() => setActiveDirection(null)}
      onMouseLeave={() => setActiveDirection(null)}
      onTouchStart={(e) => { e.preventDefault(); setActiveDirection(dir); }}
      onTouchEnd={() => setActiveDirection(null)}
      className={`
        w-12 h-12 flex items-center justify-center rounded-lg 
        bg-zinc-800/80 border border-zinc-700 active:bg-red-600 
        active:border-red-400 transition-colors shadow-lg
        text-white font-bold select-none touch-none
        ${className}
      `}
    >
      {label}
    </button>
  );

  return (
    <div className="absolute bottom-10 left-10 z-[3000] flex flex-col items-center gap-1">
      {/* North */}
      <ControlButton dir="N" label="▲" className="" />
      
      <div className="flex gap-1">
        {/* West */}
        <ControlButton dir="W" label="◀" className="" />
        
        {/* Center/Indicator */}
        <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-zinc-900/40 border border-zinc-800/50">
          <div className={`w-2 h-2 rounded-full ${activeDirection ? 'bg-red-500 animate-ping' : 'bg-zinc-700'}`} />
        </div>

        {/* East */}
        <ControlButton dir="E" label="▶" className="" />
      </div>

      {/* South */}
      <ControlButton dir="S" label="▼" className="" />
      
      <div className="mt-2 text-[9px] text-zinc-500 font-mono tracking-widest uppercase">
        Manual Override
      </div>
    </div>
  );
}