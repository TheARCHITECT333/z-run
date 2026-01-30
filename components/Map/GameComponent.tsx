'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useGeolocation, Position } from '@/hooks/useGeolocation';
import { useZombieAI } from '@/hooks/useZombieAI';
import DebugJoystick from '../UI/DebugJoystick';
import GameOverlay, { GameState } from '../UI/GameOverlay';
import { generateSafeZone, fetchRoadsInArea, spawnZombies, getDistance, RoadSegment } from '@/hooks/geo';

const ENABLE_DEBUG_MODE = true; 

// Marker
const survivorIcon = L.divIcon({
  className: 'bg-transparent',
  html: `
    <div class="w-full h-full relative flex items-center justify-center">
      <div class="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
      <div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg relative z-10"></div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

const createZombieIcon = (heading: number, state: 'IDLE' | 'CHASE' | 'SEARCHING') => {
  let color = 'bg-zinc-700';
  let arrowColor = 'border-b-zinc-700';
  let pulse = '';

  if (state === 'CHASE') {
    color = 'bg-red-600';
    arrowColor = 'border-b-red-600';
    pulse = '<div class="absolute w-full h-full bg-red-500/40 rounded-full animate-ping"></div>';
  } else if (state === 'SEARCHING') {
    color = 'bg-orange-500';
    arrowColor = 'border-b-orange-500';
    pulse = '<div class="absolute w-full h-full bg-orange-500/20 rounded-full animate-[ping_1.5s_infinite]"></div>';
  }

  return L.divIcon({
    className: 'bg-transparent transition-all duration-100 linear',
    html: `
      <div class="w-full h-full relative flex items-center justify-center">
        <div style="transform: rotate(${heading}deg); width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          
          ${pulse}

          <!-- Direction Arrow -->
          <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] ${arrowColor} mb-[2px]"></div>

          <!-- Body -->
          <div class="w-4 h-4 ${color} rounded-full border border-white/20 shadow-sm z-10"></div>
          
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

function MapController({ position, safeZone, isFollowing, setIsFollowing }: any) {
  const map = useMap();
  const lastSafeZone = useRef<Position | null>(null);
  const isFirstLoad = useRef(true);

  useMapEvents({
    dragstart: () => setIsFollowing(false),
    zoomstart: () => setIsFollowing(false), 
  });

  useEffect(() => {

    if (isFirstLoad.current) {
      map.setMinZoom(12);
      map.setMaxZoom(18);
      isFirstLoad.current = false;
    }

    if (safeZone && safeZone !== lastSafeZone.current) {
      const bounds = L.latLngBounds(
        [position.lat, position.lng],
        [safeZone.lat, safeZone.lng]
      );
      map.fitBounds(bounds, { padding: [80, 80], animate: true, duration: 1.5 });
      setIsFollowing(false);
      lastSafeZone.current = safeZone;
    } 
    
    else if (isFollowing) {
      map.panTo([position.lat, position.lng], { animate: true, duration: 0.8 });
    }
  }, [position, safeZone, map, isFollowing]);
  return null;
}

export default function GameComponent() {
  const { position, setManualPosition } = useGeolocation(ENABLE_DEBUG_MODE);
  
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [safeZone, setSafeZone] = useState<Position | null>(null);
  const [initialSpawns, setInitialSpawns] = useState<any[]>([]);
  const [roadData, setRoadData] = useState<RoadSegment[]>([]);
  const [isFollowing, setIsFollowing] = useState(true);

  const handleGameOver = useCallback(() => {
    setGameState((prev) => (prev === 'RUNNING' ? 'GAME_OVER' : prev));
  }, []);

  const liveZombies = useZombieAI(initialSpawns, roadData, position, safeZone, gameState, handleGameOver);

  const startGame = async (distanceKm: number) => {
    if (!position) return;
    setGameState('LOADING');

    const target = generateSafeZone(position.lat, position.lng, distanceKm);
    
    const roads = await fetchRoadsInArea(position.lat, position.lng, target.lat, target.lng);
    
    // Density: roughly 40 per km
    const zombieCount = Math.floor(distanceKm * 40);
    const spawns = spawnZombies(
      roads, 
      zombieCount, 
      position.lat, 
      position.lng,
      target.lat,
      target.lng
    );

    setSafeZone({ ...target, accuracy: 0, heading: 0 });
    setInitialSpawns(spawns);
    setGameState('RUNNING');
  };

  const resetGame = () => {
    setGameState('IDLE');
    setSafeZone(null);
    setInitialSpawns([]);
    setRoadData([]);
    setIsFollowing(true);
  };

  useEffect(() => {
    if (gameState === 'RUNNING' && position && safeZone) {
      const dist = getDistance(position.lat, position.lng, safeZone.lat, safeZone.lng);
      if (dist < 50) setGameState('WON');
    }
  }, [position, safeZone, gameState]);

  const distanceToTarget = (position && safeZone) 
    ? getDistance(position.lat, position.lng, safeZone.lat, safeZone.lng) 
    : 0;

  return (
    <div className="h-full w-full relative bg-zinc-950">
      
      <GameOverlay 
        gameState={gameState} 
        distanceToTarget={distanceToTarget}
        onStart={startGame}
        onReset={resetGame}
      />

      {position && (
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={16}
          zoomControl={false}
          className="h-full w-full"
          style={{ background: '#09090b' }}
        >
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <MapController 
            position={position} 
            safeZone={safeZone} 
            isFollowing={isFollowing}
            setIsFollowing={setIsFollowing}
          />

          <Marker position={[position.lat, position.lng]} icon={survivorIcon} />
          
          {(gameState === 'RUNNING' || gameState === 'GAME_OVER') && liveZombies.map((z) => (
            <Marker 
              key={z.id} 
              position={[z.lat, z.lng]} 
              icon={createZombieIcon(z.heading, z.state)} 
              zIndexOffset={z.state === 'CHASE' ? 1000 : 0} 
            />
          ))}
          
          {safeZone && (gameState === 'RUNNING' || gameState === 'WON' || gameState === 'GAME_OVER') && (
            <>
              <Circle 
                center={[safeZone.lat, safeZone.lng]} 
                radius={50} 
                pathOptions={{ 
                  fillColor: '#22c55e', 
                  fillOpacity: 0.2, 
                  color: '#22c55e', 
                  weight: 2 }}
              />
              {ENABLE_DEBUG_MODE && gameState !== 'WON' && (
                 <Polyline 
                   positions={[[position.lat, position.lng], [safeZone.lat, safeZone.lng]]} 
                   pathOptions={{ color: 'rgba(255,255,255,0.05)', weight: 1, dashArray: '5, 5' }} 
                 />
              )}
            </>
          )}

        </MapContainer>
      )}

      {/* RECENTER BUTTON */}
      {!isFollowing && position && (
        <div className="absolute bottom-8 right-6 z-[1000] animate-in fade-in duration-200">
           <button 
             onClick={() => setIsFollowing(true)}
             className="w-14 h-14 bg-zinc-900/90 backdrop-blur-md text-white rounded-full flex items-center justify-center shadow-2xl border border-zinc-700 active:scale-95 transition-all"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
             </svg>
           </button>
        </div>
      )}

      {/* JOYSTICK */}
      {ENABLE_DEBUG_MODE && position && gameState === 'RUNNING' && (
        <DebugJoystick 
          currentPosition={position} 
          onMove={(newPos) => setManualPosition(newPos)} 
        />
      )}
    </div>
  );
}