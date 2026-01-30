export function getBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

export function movePoint(lat: number, lng: number, distanceMeters: number, bearing: number) {
  const R = 6371e3;
  const angDist = distanceMeters / R;
  const lat1 = lat * Math.PI / 180;
  const lng1 = lng * Math.PI / 180;
  const brng = bearing * Math.PI / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angDist) +
    Math.cos(lat1) * Math.sin(angDist) * Math.cos(brng)
  );

  const lng2 = lng1 + Math.atan2(
    Math.sin(brng) * Math.sin(angDist) * Math.cos(lat1),
    Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    lat: lat2 * 180 / Math.PI,
    lng: lng2 * 180 / Math.PI
  };
}

export function isTargetInSight(
  sourceLat: number, 
  sourceLng: number, 
  sourceHeading: number, 
  targetLat: number, 
  targetLng: number, 
  distance: number,
  fovAngle: number = 90
): boolean {

  const angleToTarget = getBearing(sourceLat, sourceLng, targetLat, targetLng);
  let diff = Math.abs(angleToTarget - sourceHeading);
  
  if (diff > 180) diff = 360 - diff;
  return diff <= (fovAngle / 2);
}