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
  
  const frameRef = useRef<number>(0);
  const targetRef = useRef<Position>(DEFAULT_START);

  useEffect(() => {
    if (useDebug) return;

    if (!navigator.geolocation) {
      console.error("Geolocation is not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
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
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [useDebug]);

  useEffect(() => {
    const update = () => {
      if (targetRef.current && smoothPosition) {
        const lerpFactor = 0.1;
        const newLat = smoothPosition.lat + (targetRef.current.lat - smoothPosition.lat) * lerpFactor;
        const newLng = smoothPosition.lng + (targetRef.current.lng - smoothPosition.lng) * lerpFactor;
        
        setSmoothPosition({
          ...targetRef.current,
          lat: newLat,
          lng: newLng,
        });
      }
      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameRef.current!);
  }, [smoothPosition]);

  return { 
    position: smoothPosition, 
    rawPosition, 
    setManualPosition: (pos: Position) => {
      targetRef.current = pos;
    }
  };
}