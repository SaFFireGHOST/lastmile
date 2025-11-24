export interface Station {
    id: string;
    name: string;
    lat: number;
    lon: number;
    nearbyAreas: string[];
}

export interface RiderRequest {
    id: string;
    riderId: string;
    stationId: string;
    destination: string;
    etaMinutes: number;
    etaAbsolute: Date;
    status: 'PENDING' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
    createdAt: Date;
    updatedAt: Date;
}
