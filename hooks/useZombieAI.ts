import { useState, useEffect, useRef } from 'react';
import { getDistance, RoadSegment, snapToNetwork, isLineClear } from '@/hooks/geo';
import { getBearing, movePoint } from '@/hooks/ai';

export interface ZombieState {
  id: number;
  lat: number;
  lng: number;
  heading: number; 
  state: 'IDLE' | 'CHASE' | 'SEARCHING';
  type: 'WALKER' | 'RUNNER'; 
  speed: number;
  segmentId: number; 
  targetWaypoint: { lat: number, lng: number } | null;
  lastKnownPos: { lat: number, lng: number } | null;
}

// Zombie
const VISION_RANGE = 250;
const PROXIMITY_RANGE = 100;
const VISION_FOV = 90;
const TURN_RATE = 150;

export function useZombieAI(
  initialZombies: any[], 
  roadData: RoadSegment[],
  playerPos: { lat: number, lng: number } | null, 
  safeZone: { lat: number, lng: number } | null,
  gameState: string,
  onGameOver: () => void 
) {
  const [zombies, setZombies] = useState<ZombieState[]>([]);
  
  const playerPosRef = useRef(playerPos);
  const safeZoneRef = useRef(safeZone);
  const roadsRef = useRef(roadData);
  const zombiesRef = useRef<ZombieState[]>([]); 
  const lastTimeRef = useRef<number>(0);
  const requestRef = useRef<number>(0);

  useEffect(() => { playerPosRef.current = playerPos; }, [playerPos]);
  useEffect(() => { safeZoneRef.current = safeZone; }, [safeZone]);
  useEffect(() => { roadsRef.current = roadData; }, [roadData]);

  useEffect(() => {
    if (initialZombies.length > 0) {
      const enhanced: ZombieState[] = initialZombies.map(z => ({
        ...z,
        heading: Math.random() * 360,
        state: 'IDLE',
        type: Math.random() > 0.8 ? 'RUNNER' : 'WALKER',
        speed: Math.random() > 0.8 ? 5.2 : 2.4,
        targetWaypoint: null,
        lastKnownPos: null
      }));
      setZombies(enhanced);
      zombiesRef.current = enhanced;
    } else {
        setZombies([]);
        zombiesRef.current = [];
    }
  }, [initialZombies]);

  useEffect(() => {
    if (gameState !== 'RUNNING') return;

    const animate = (time: number) => {
      if (lastTimeRef.current !== 0) {
        const deltaTime = (time - lastTimeRef.current) / 1000;
        const currentPlayer = playerPosRef.current;
        const currentSafeZone = safeZoneRef.current;
        const currentRoads = roadsRef.current;

        if (currentPlayer) {
          const updatedZombies = zombiesRef.current.map(z => {
            let { lat, lng, heading, state, type, speed, targetWaypoint, segmentId, lastKnownPos } = z;
            
            const distToPlayer = getDistance(lat, lng, currentPlayer.lat, currentPlayer.lng);

            const bearingToPlayer = getBearing(lat, lng, currentPlayer.lat, currentPlayer.lng);
            let angleDiff = Math.abs(bearingToPlayer - heading);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;

            const inProximity = distToPlayer < PROXIMITY_RANGE; 
            const inVisionCone = distToPlayer < VISION_RANGE && angleDiff < (VISION_FOV / 2);
            
            let hasLineOfSight = false;
            if (inVisionCone) {
              hasLineOfSight = isLineClear(lat, lng, currentPlayer.lat, currentPlayer.lng, currentRoads);
            }

            const canSensePlayer = inProximity || hasLineOfSight;

            if (state !== 'CHASE' && canSensePlayer) {
              state = 'CHASE';
              speed = type === 'RUNNER' ? 50.0 : 10.0; // Aggro speed
            }
            else if (state === 'CHASE') {
              if (!canSensePlayer) {
                state = 'SEARCHING';
                targetWaypoint = { ...currentPlayer }; 
              } else {
                 lastKnownPos = { ...currentPlayer };
              }
            }
            else if (state === 'SEARCHING') {
               if (targetWaypoint && getDistance(lat, lng, targetWaypoint.lat, targetWaypoint.lng) < 5) {
                 state = 'IDLE';
                 targetWaypoint = null;
               }
            }
            
            let desiredHeading = heading;
            let moveSpeed = speed;

            if (state === 'CHASE') {
              desiredHeading = getBearing(lat, lng, currentPlayer.lat, currentPlayer.lng);
            } 
            else if (state === 'SEARCHING' && targetWaypoint) {
              desiredHeading = getBearing(lat, lng, targetWaypoint.lat, targetWaypoint.lng);
              moveSpeed = type === 'RUNNER' ? 3.5 : 1.5; 
            } 
            else {
               moveSpeed = type === 'RUNNER' ? 2.0 : 0.8; 
               if (!targetWaypoint || getDistance(lat, lng, targetWaypoint.lat, targetWaypoint.lng) < 3) {
                 if (currentRoads[segmentId]) {
                   const road = currentRoads[segmentId];
                   targetWaypoint = road[Math.floor(Math.random() * road.length)];
                 } else {
                   targetWaypoint = movePoint(lat, lng, 15, Math.random() * 360);
                 }
               }
               desiredHeading = getBearing(lat, lng, targetWaypoint.lat, targetWaypoint.lng);
            }

            let deltaAngle = desiredHeading - heading;
            if (deltaAngle > 180) deltaAngle -= 360;
            if (deltaAngle < -180) deltaAngle += 360;
            const maxTurn = TURN_RATE * deltaTime;
            if (Math.abs(deltaAngle) < maxTurn) heading = desiredHeading;
            else heading += Math.sign(deltaAngle) * maxTurn;
            heading = (heading + 360) % 360;

            if (distToPlayer < 15) onGameOver();

            const moveDist = moveSpeed * deltaTime;
            const rawNextPos = movePoint(lat, lng, moveDist, heading);

            let snappedPos = rawNextPos;

            if (currentRoads.length > 0) {
               snappedPos = snapToNetwork(rawNextPos.lat, rawNextPos.lng, currentRoads);

               if (getDistance(rawNextPos.lat, rawNextPos.lng, snappedPos.lat, snappedPos.lng) > 5) {
                  snappedPos = { lat, lng }; 
               }
            }

            if (currentSafeZone) {
              const distToSafe = getDistance(snappedPos.lat, snappedPos.lng, currentSafeZone.lat, currentSafeZone.lng);
              if (distToSafe < 60) {
                 heading = (heading + 180) % 360;
                 state = 'IDLE';
                 targetWaypoint = null;
                 snappedPos = movePoint(lat, lng, moveDist, heading); 
              }
            }

            return { ...z, lat: snappedPos.lat, lng: snappedPos.lng, heading, state, speed: moveSpeed, targetWaypoint, lastKnownPos, segmentId };
          });

          zombiesRef.current = updatedZombies;
          setZombies(updatedZombies);
        }
      }
      
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [gameState]);

  return zombies;
}