import { ZOMBIE_TRAITS, ZombieType } from '@/config/ZombieTraits';
export type Point = { lat: number; lng: number };
export type RoadSegment = Point[];
/**
 * Calculates the distance between two coordinates in meters.
 * Useing Haversine formula.
 */
export function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusMeters = 6371e3;

  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const deltaLatRad = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLonRad = ((lon2 - lon1) * Math.PI) / 180;

  // Haversine formula
  const haversine =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) *
      Math.sin(deltaLonRad / 2);

  const angularDistance =
    2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusMeters * angularDistance;
}

/**
 * Generate a random coordinate at a specific distance from a start point.
 * Todo- custom location setup
 */
export function generateSafeZone(startLat: number, startLng: number, distanceKm: number) {
  const R = 6371;
  const bearing = Math.random() * 360;
  const d = distanceKm;
  const lat1 = (startLat * Math.PI) / 180;
  const lon1 = (startLng * Math.PI) / 180;
  const brng = (bearing * Math.PI) / 180;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d / R) + Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng));
  const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1), Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2));
  return { lat: (lat2 * 180) / Math.PI, lng: (lon2 * 180) / Math.PI };
}

export async function fetchRoadsInArea(startLat: number, startLng: number, endLat: number, endLng: number): Promise<RoadSegment[]> {
  const pad = 0.004;
  const minLat = Math.min(startLat, endLat) - pad;
  const maxLat = Math.max(startLat, endLat) + pad;
  const minLng = Math.min(startLng, endLng) - pad;
  const maxLng = Math.max(startLng, endLng) + pad;

  const query = `
    [out:json][timeout:10];
    (
      way["highway"](${minLat},${minLng},${maxLat},${maxLng});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Overpass API failed");

    const data = await response.json();
    
    const nodeMap: Record<number, Point> = {};
    data.elements.forEach((el: any) => {
      if (el.type === 'node') nodeMap[el.id] = { lat: el.lat, lng: el.lon };
    });
    const segments: RoadSegment[] = [];
    data.elements.forEach((el: any) => {
      if (el.type === 'way' && el.nodes && el.nodes.length > 1) {
        const path = el.nodes.map((id: number) => nodeMap[id]).filter(Boolean);
        if (path.length > 1) segments.push(path);
      }
    });
    return segments;
  } catch (error) {
    console.warn("Road fetch failed:", error);
    return [];
  }
}

export type ZombieSpawn = { 
  id: string; 
  lat: number; 
  lng: number; 
  segmentId: number; 
  type: ZombieType;
};

export function spawnZombies(
  segments: RoadSegment[], 
  count: number, 
  startLat: number, 
  startLng: number,
  endLat: number,
  endLng: number
): ZombieSpawn[] {
  const zombies: ZombieSpawn[] = [];
  const PLAYER_BUFFER = 50; 
  const SAFE_ZONE_BUFFER = 60;
  
  const typeList = Object.keys(ZOMBIE_TRAITS) as ZombieType[];
  const weightedList: { type: ZombieType; weight: number }[] = typeList.map(t => ({
    type: t,
    weight: ZOMBIE_TRAITS[t].spawnWeight
  }));

  const getRandomType = () => {
    const total = weightedList.reduce((acc, t) => acc + t.weight, 0);
    let random = Math.random() * total;
    for (const t of weightedList) {
      if (random < t.weight) return t.type;
      random -= t.weight;
    }
    return 'WALKER';
  };
  
  if (segments.length > 0) {
    let attempts = 0;
    while (zombies.length < count && attempts < count * 20) {
      attempts++;
      const segIndex = Math.floor(Math.random() * segments.length);
      const segment = segments[segIndex];
      const point = segment[Math.floor(Math.random() * segment.length)];
      
      if (getDistance(startLat, startLng, point.lat, point.lng) < PLAYER_BUFFER) continue;
      if (getDistance(endLat, endLng, point.lat, point.lng) < SAFE_ZONE_BUFFER) continue;
      if (zombies.some(z => z.lat === point.lat && z.lng === point.lng)) continue;

      const type = getRandomType();
      
      // Twins Logic
      if ((type === 'WALKER' || type === 'SPRINTER') && Math.random() < 0.2) {
         zombies.push({ id: `twin-a-${Math.random()}`, lat: point.lat, lng: point.lng, segmentId: segIndex, type });
         zombies.push({ id: `twin-b-${Math.random()}`, lat: point.lat + 0.00005, lng: point.lng + 0.00005, segmentId: segIndex, type });
      } else {
         zombies.push({ id: `z-${Math.random()}`, lat: point.lat, lng: point.lng, segmentId: segIndex, type });
      }
    }
  } 
  else {
    const minLat = Math.min(startLat, endLat);
    const maxLat = Math.max(startLat, endLat);
    const minLng = Math.min(startLng, endLng);
    const maxLng = Math.max(startLng, endLng);

    let attempts = 0;
    while (zombies.length < count && attempts < count * 20) {
      attempts++;
      const lat = minLat + Math.random() * (maxLat - minLat);
      const lng = minLng + Math.random() * (maxLng - minLng);
      
      if (getDistance(startLat, startLng, lat, lng) < PLAYER_BUFFER) continue;
      if (getDistance(endLat, endLng, lat, lng) < SAFE_ZONE_BUFFER) continue;

      const type = getRandomType();
      zombies.push({ id: `z-fallback-${Math.random()}`, lat, lng, segmentId: -1, type });
    }
  }

  return zombies;
}

// PATHFINDING & PHYSICS
export function isPointOnRoad(lat: number, lng: number, roads: RoadSegment[], thresholdMeters: number = 10): boolean {
  for (const road of roads) {
    for (let i = 0; i < road.length - 1; i++) {
      const p1 = road[i];
      const p2 = road[i+1];
      const dist = distanceFromLineSegment(lat, lng, p1.lat, p1.lng, p2.lat, p2.lng);
      if (dist < thresholdMeters) return true;
    }
  }
  return false;
}

export function isLineClear(startLat: number, startLng: number, endLat: number, endLng: number, roads: RoadSegment[]): boolean {
  if (roads.length === 0) return true;
  const dist = getDistance(startLat, startLng, endLat, endLng);
  const steps = Math.ceil(dist / 10);
  
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const lat = startLat + (endLat - startLat) * t;
    const lng = startLng + (endLng - startLng) * t;

    if (!isPointOnRoad(lat, lng, roads, 12)) {
      return false;
    }
  }
  return true;
}

export function snapToNetwork(lat: number, lng: number, roads: RoadSegment[]): { lat: number, lng: number } {
  if (roads.length === 0) return { lat, lng };
  let bestPoint = { lat, lng };
  let minDistance = Infinity;

  for (const road of roads) {
    for (let i = 0; i < road.length - 1; i++) {
      const p1 = road[i];
      const p2 = road[i+1];
      const { point, dist } = nearestPointOnSegment(lat, lng, p1.lat, p1.lng, p2.lat, p2.lng);
      
      if (dist < minDistance) {
        minDistance = dist;
        bestPoint = point;
      }
    }
  }
  return bestPoint;
}

// HELPERS
function distanceFromLineSegment(pLat: number, pLng: number, aLat: number, aLng: number, bLat: number, bLng: number) {
  return nearestPointOnSegment(pLat, pLng, aLat, aLng, bLat, bLng).dist;
}

function nearestPointOnSegment(pLat: number, pLng: number, aLat: number, aLng: number, bLat: number, bLng: number) {

  const x = pLng;
  const y = pLat;
  const x1 = aLng;
  const y1 = aLat;
  const x2 = bLng;
  const y2 = bLat;

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dist = getDistance(pLat, pLng, yy, xx);
  return { point: { lat: yy, lng: xx }, dist };
}