import { useState, useEffect, useRef } from 'react';
import { getDistance, RoadSegment, snapToNetwork, isLineClear, ZombieSpawn } from '@/hooks/geo';
import { getBearing, movePoint, isTargetInSight } from '@/hooks/ai';
import { ZOMBIE_TRAITS, ZombieType } from '@/config/ZombieTraits';

export interface ZombieState extends ZombieSpawn {
  heading: number; 
  state: 'IDLE' | 'CHASE' | 'SEARCHING' | 'SCREAMING' | 'FROZEN';
  speed: number;
  targetWaypoint: { lat: number, lng: number } | null;
  lastKnownPos: { lat: number, lng: number } | null;
  internalTimer: number; 
  stamina: number; 
}

export function useZombieAI(
  initialZombies: ZombieSpawn[], 
  roadData: RoadSegment[],
  playerPos: { lat: number, lng: number } | null, 
  safeZone: { lat: number, lng: number } | null,
  gameState: string,
  onGameOver: () => void 
) {
  const [zombies, setZombies] = useState<ZombieState[]>([]);
  
  const playerPosRef = useRef(playerPos);
  const lastPlayerPosRef = useRef(playerPos);
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
        speed: ZOMBIE_TRAITS[z.type].baseSpeed,
        targetWaypoint: null,
        lastKnownPos: null,
        internalTimer: Math.random() * 5,
        stamina: 100
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
        const lastPlayer = lastPlayerPosRef.current;
        const currentSafeZone = safeZoneRef.current;
        const currentRoads = roadsRef.current;

        let playerSpeed = 0;
        if (currentPlayer && lastPlayer) {
           playerSpeed = getDistance(currentPlayer.lat, currentPlayer.lng, lastPlayer.lat, lastPlayer.lng) / deltaTime;
        }

        if (currentPlayer) {
          // HORDE ALERT SYSTEM
          const activeScreamers: {lat: number, lng: number}[] = [];
          zombiesRef.current.forEach(z => {
             if (z.type === 'SCREAMER' && z.state === 'SCREAMING') {
                activeScreamers.push({ lat: z.lat, lng: z.lng });
             }
          });

          const updatedZombies = zombiesRef.current.map(z => {
            let { lat, lng, heading, state, type, speed, targetWaypoint, segmentId, lastKnownPos, internalTimer, stamina } = z;
            
            const traits = ZOMBIE_TRAITS[type];
            const distToPlayer = getDistance(lat, lng, currentPlayer.lat, currentPlayer.lng);

            const bearingToPlayer = getBearing(lat, lng, currentPlayer.lat, currentPlayer.lng);
            let angleDiff = Math.abs(bearingToPlayer - heading);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;

            const inProximity = distToPlayer < traits.proximityRange; 
            const inVisionCone = distToPlayer < traits.detectionRange && angleDiff < (traits.fov / 2);
            
            let hasLineOfSight = false;
            if (inVisionCone) {
              hasLineOfSight = isLineClear(lat, lng, currentPlayer.lat, currentPlayer.lng, currentRoads);
            }

            const canSensePlayer = inProximity || hasLineOfSight;

            if (state === 'IDLE' && type !== 'SCREAMER') {
              for (const screamerPos of activeScreamers) {
                const distToScreamer = getDistance(lat, lng, screamerPos.lat, screamerPos.lng);
                if (distToScreamer < 1000) {
                  state = 'SEARCHING';
                  targetWaypoint = { ...currentPlayer };
                  break;
                }
              }
            }

            if (state !== 'CHASE' && state !== 'SCREAMING' && canSensePlayer) {
              if (type === 'SCREAMER') {
                state = 'SCREAMING';
                speed = 0; 
              } else {
                state = 'CHASE';
              }
            }
            else if (state === 'CHASE') {
              if (type === 'ENDURANCE') {
                 if (!canSensePlayer && distToPlayer > 150) state = 'IDLE'; 
                 else lastKnownPos = { ...currentPlayer };
              } else {
                 if (!canSensePlayer) {
                   state = 'SEARCHING';
                   targetWaypoint = { ...currentPlayer }; 
                 } else {
                   lastKnownPos = { ...currentPlayer };
                 }
              }
            }
            else if (state === 'SEARCHING') {
               if (canSensePlayer) {
                 state = 'CHASE';
               }
               else if (targetWaypoint && getDistance(lat, lng, targetWaypoint.lat, targetWaypoint.lng) < 5) {
                 state = 'IDLE'; 
                 targetWaypoint = null;
               }
            }

            internalTimer += deltaTime;

            if (type === 'BURST') {
              const cycle = internalTimer % 4;
              if (cycle < 2) state = 'FROZEN';
              else if (state === 'FROZEN') state = 'IDLE'; 
            }

            if (type === 'SPRINTER' && state === 'CHASE') {
               if (stamina > 0) {
                 speed = traits.chaseSpeed; 
                 stamina -= deltaTime * 30; 
               } else {
                 speed = 1.5; 
                 stamina -= deltaTime * 5; 
                 if (stamina < -20) stamina = 100; 
               }
            } else if (type === 'SPRINTER') {
               stamina = 100;
            }

            if (type === 'STAGGERER') {
               if (Math.floor(internalTimer * 2) > Math.floor((internalTimer - deltaTime) * 2)) {
                  speed = 0.5 + Math.random() * traits.chaseSpeed;
               }
            }

            if (type === 'SYNC') {
               if (playerSpeed < 0.5) speed = 0;
               else speed = traits.chaseSpeed;
            }

            let desiredHeading = heading;
            let moveSpeed = speed;

            if (!['SPRINTER', 'BURST', 'STAGGERER', 'SYNC'].includes(type)) {
               moveSpeed = state === 'CHASE' ? traits.chaseSpeed : traits.baseSpeed;
            }
            if (state === 'SCREAMING' || state === 'FROZEN') moveSpeed = 0;

            if (state === 'CHASE') {
              desiredHeading = getBearing(lat, lng, currentPlayer.lat, currentPlayer.lng);
            } else if (state === 'SEARCHING' && targetWaypoint) {
              desiredHeading = getBearing(lat, lng, targetWaypoint.lat, targetWaypoint.lng);
              if (moveSpeed < traits.chaseSpeed * 0.7) moveSpeed = traits.chaseSpeed * 0.7;
            } else if (state === 'IDLE') {
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
            const maxTurn = traits.turnRate * deltaTime;
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

            return { ...z, lat: snappedPos.lat, lng: snappedPos.lng, heading, state, speed: moveSpeed, targetWaypoint, lastKnownPos, segmentId, internalTimer, stamina };
          });

          zombiesRef.current = updatedZombies;
          setZombies(updatedZombies);
          lastPlayerPosRef.current = currentPlayer;
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