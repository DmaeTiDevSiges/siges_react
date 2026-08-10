/**
 * Geographic utility functions (Haversine formula, distance formatting).
 */

/** Calculate distance between two coordinates in meters (Haversine formula) */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/** Format distance in meters to a human-readable string (e.g. "350m" or "2.4km") */
export function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
}

/** Calculate distance from user to a unit with lat/lng. Returns null if unit has no coordinates. */
export function distanceToUnit(
    userLat: number,
    userLng: number,
    unitLat?: number,
    unitLng?: number
): number | null {
    if (unitLat == null || unitLng == null) return null;
    return haversineDistance(userLat, userLng, unitLat, unitLng);
}
