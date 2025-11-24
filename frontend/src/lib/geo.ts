export function toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

export function toDeg(radians: number): number {
    return (radians * 180) / Math.PI;
}

export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export function calculateBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δλ = toRad(lon2 - lon1);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
        Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);

    return (toDeg(θ) + 360) % 360;
}

export function movePoint(
    lat: number,
    lon: number,
    bearing: number,
    distance: number
): { lat: number; lon: number } {
    const R = 6371e3; // Earth radius in meters
    const δ = distance / R;
    const θ = toRad(bearing);
    const φ1 = toRad(lat);
    const λ1 = toRad(lon);

    const φ2 = Math.asin(
        Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
    );
    const λ2 =
        λ1 +
        Math.atan2(
            Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
            Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
        );

    return {
        lat: toDeg(φ2),
        lon: toDeg(λ2),
    };
}
