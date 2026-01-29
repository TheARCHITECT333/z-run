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

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d / R) +
    Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng)
  );

  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1),
    Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (lon2 * 180) / Math.PI,
  };
}