'use client';

import { useState, useEffect, useRef } from 'react';

export interface Position {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
}

// HSR Layout
const DEFAULT_START: Position = {
  lat: 12.9121,
  lng: 77.6446,
  accuracy: 10,
  heading: 0
};

export function useGeolocation(useDebug: boolean = false) {
  const [rawPosition, setRawPosition] = useState<Position>(DEFAULT_START);
  const [smoothPosition, setSmoothPosition] = useState<Position>(DEFAULT_START);
  const targetRef = useRef<Position>(DEFAULT_START);
  const currentSmoothRef = useRef<Position>(DEFAULT_START); 
  const frameRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (useDebug) return;

    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < 2000) return;
        lastUpdateRef.current = now;

        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading ?? 0,
        };
        setRawPosition(newPos);
        targetRef.current = newPos;
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [useDebug]);

  useEffect(() => {
    const update = () => {
      const target = targetRef.current;
      const current = currentSmoothRef.current;

      if (target && current) {
        const lerpFactor = 0.05; 
        
        const newLat = current.lat + (target.lat - current.lat) * lerpFactor;
        const newLng = current.lng + (target.lng - current.lng) * lerpFactor;
        
        const dLat = Math.abs(newLat - current.lat);
        const dLng = Math.abs(newLng - current.lng);

        if (dLat > 0.0000001 || dLng > 0.0000001) {
             const newPos = { ...target, lat: newLat, lng: newLng };
             currentSmoothRef.current = newPos;
             setSmoothPosition(newPos);
        }
      }
      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameRef.current!);
  }, []);

  return { 
    position: smoothPosition, 
    rawPosition, 
    setManualPosition: (pos: Position) => {
      targetRef.current = pos;
    }
  };
}