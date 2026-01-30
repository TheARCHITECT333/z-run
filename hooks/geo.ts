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

export async function fetchRoadsInArea(startLat: number, startLng: number, endLat: number, endLng: number) {
  const pad = 0.002;
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
    
    const nodeMap: Record<number, { lat: number, lng: number }> = {};
    data.elements.forEach((el: any) => {
      if (el.type === 'node') nodeMap[el.id] = { lat: el.lat, lng: el.lon };
    });
    const validCoords: { lat: number, lng: number }[] = [];
    data.elements.forEach((el: any) => {
      if (el.type === 'way' && el.nodes) {
        el.nodes.forEach((nodeId: number) => {
          if (nodeMap[nodeId]) validCoords.push(nodeMap[nodeId]);
        });
      }
    });

    return validCoords;
  } catch (error) {
    console.warn("Road fetch failed, using fallback:", error);
    return []; 
  }
}

/**
 * Places zombies on specific road coordinates.
 * Fallback: If no roads found (API error), scatters them randomly.
 */
export function spawnZombies(
  roadCoords: { lat: number, lng: number }[], 
  count: number, 
  startLat: number, 
  startLng: number,
  endLat: number,
  endLng: number
) {
  const zombies: { id: any; lat: any; lng: any; }[] = [];
  
  if (roadCoords.length > 0) {
    let attempts = 0;
    while (zombies.length < count && attempts < count * 10) {
      attempts++;
      const point = roadCoords[Math.floor(Math.random() * roadCoords.length)];
      
      if (getDistance(startLat, startLng, point.lat, point.lng) < 50) continue;
      
      if (zombies.some(z => z.lat === point.lat && z.lng === point.lng)) continue;

      zombies.push({ id: Math.random(), lat: point.lat, lng: point.lng });
    }
  } 
  
  else {
    const minLat = Math.min(startLat, endLat);
    const maxLat = Math.max(startLat, endLat);
    const minLng = Math.min(startLng, endLng);
    const maxLng = Math.max(startLng, endLng);

    while (zombies.length < count) {
      const lat = minLat + Math.random() * (maxLat - minLat);
      const lng = minLng + Math.random() * (maxLng - minLng);
      if (getDistance(startLat, startLng, lat, lng) < 50) continue;
      zombies.push({ id: Math.random(), lat, lng });
    }
  }

  return zombies;
}