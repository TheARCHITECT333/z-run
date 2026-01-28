'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useGeolocation } from '@/hooks/useGeolocation';
import DebugJoystick from '../UI/DebugJoystick';

// Marker
const survivorIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-10 h-10 bg-blue-500/20 rounded-full animate-ping"></div>
      <div class="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] relative z-10"></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Camera 
function MapController({ position }: { position: { lat: number, lng: number } }) {
  const map = useMap();
  const boundsSet = useRef(false);

  useEffect(() => {
    map.panTo([position.lat, position.lng], { animate: true, duration: 0.5 });

    if (!boundsSet.current) {
      map.setMinZoom(14);
      map.setMaxZoom(18);
      
      const buffer = 0.15;
      const southWest = L.latLng(position.lat - buffer, position.lng - buffer);
      const northEast = L.latLng(position.lat + buffer, position.lng + buffer);
      const bounds = L.latLngBounds(southWest, northEast);

      map.setMaxBounds(bounds);
      map.options.maxBoundsViscosity = 1.0;
      
      boundsSet.current = true;
    }
  }, [position, map]);

  return null;
}

export default function GameComponent() {
  const [debugMode, setDebugMode] = useState(true);
  const { position, setManualPosition } = useGeolocation(debugMode);

  return (
    <div className="h-full w-full relative bg-zinc-950">
      {position && (
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={16} // Default starting zoom
          zoomControl={false}
          className="h-full w-full"
          style={{ background: '#09090b' }}
        >
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <MapController position={position} />

          <Marker position={[position.lat, position.lng]} icon={survivorIcon} />
          
          <Circle 
            center={[position.lat, position.lng]} 
            radius={position.accuracy || 15} 
            pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.15, color: '#3b82f6', weight: 1, opacity: 0.3 }} 
          />
        </MapContainer>
      )}

      {/* Debug Toggle */}
      <div className="absolute top-6 right-6 z-[1000]">
        <button 
          onClick={() => setDebugMode(!debugMode)}
          className={`px-4 py-2 rounded-lg backdrop-blur-md border transition-all text-[10px] font-bold tracking-widest uppercase ${
            debugMode 
              ? 'bg-orange-500/20 border-orange-500 text-orange-500' 
              : 'bg-zinc-900/50 border-zinc-700 text-zinc-500'
          }`}
        >
          Dev Mode: {debugMode ? 'ON' : 'OFF'}
        </button>
      </div>

      {debugMode && position && (
        <DebugJoystick 
          currentPosition={position} 
          onMove={(newPos) => setManualPosition(newPos)} 
        />
      )}

      {/* Connection Status Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full border border-zinc-800 backdrop-blur-sm">
        <div className={`w-2 h-2 rounded-full ${debugMode ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}></div>
        <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider">
          {debugMode ? 'SIMULATED SIGNAL' : 'LIVE GPS LINK'}
        </span>
      </div>
    </div>
  );
}