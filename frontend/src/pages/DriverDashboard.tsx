import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, Play, Square, Navigation } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDriverSimulator } from '@/hooks/useDriverSimulator';
import { GeoMap } from '@/shared/ui/GeoMap';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Notifications } from '@/components/Notifications';

const driverSchema = z.object({
    driverId: z.string().min(1, 'Driver ID is required'),
    routeId: z.string().optional(),
    destinationArea: z.string().min(1, 'Destination area is required'),
    seatsTotal: z.number().int().min(1, 'Must have at least 1 seat'),
    seatsFree: z.number().int().min(0),
    stationIds: z.array(z.string()).min(1, 'Select at least one station'),
    minutesBeforeEtaMatch: z.number().int().min(0, 'Must be 0 or greater'),
}).refine((data) => data.seatsFree <= data.seatsTotal, {
    message: 'Free seats cannot exceed total seats',
    path: ['seatsFree'],
});

type DriverFormData = z.infer<typeof driverSchema>;

interface Station {
    id: string;
    name: string;
    location: { lat: number; lon: number };
    nearbyAreas: string[];
}

export const DriverDashboard = () => {
    const { user, logout } = useAuth();
    const [stations, setStations] = useState<Station[]>([]);
    const [selectedStations, setSelectedStations] = useState<string[]>([]);
    const [existingRoute, setExistingRoute] = useState<DriverFormData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchStations = async () => {
            try {
                const response = await api.getStations();
                // Map nearby_areas to nearbyAreas
                const mappedStations = response.data.map((station: any) => ({
                    ...station,
                    nearbyAreas: station.nearbyAreas || []
                }));
                setStations(mappedStations);
            } catch (error) {
                console.error('Failed to fetch stations', error);
            }
        };
        fetchStations();
    }, []);

    const firstStation = stations.find((s) => s.id === selectedStations[0]);

    // Adapt station for simulator (needs lat/lon at top level)
    const simulatorStation = firstStation ? {
        ...firstStation,
        lat: firstStation.location.lat,
        lon: firstStation.location.lon,
        nearbyAreas: firstStation.nearbyAreas
    } : null;

    const { isRunning, position, distanceToStation, etaMinutes, insideGeofence, start, stop } =
        useDriverSimulator(simulatorStation);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<DriverFormData>({
        resolver: zodResolver(driverSchema),
        defaultValues: {
            driverId: user?.id || '',
            seatsTotal: 4,
            seatsFree: 4,
            minutesBeforeEtaMatch: 10,
            stationIds: [],
        },
    });

    // Update driverId if user loads late
    useEffect(() => {
        if (user?.id) {
            setValue('driverId', user.id);
        }
    }, [user, setValue]);

    const watchedSeatsTotal = watch('seatsTotal');

    useEffect(() => {
        if (insideGeofence && isRunning) {
            toast.success('Entered geofence—matching would trigger now (mock)', {
                icon: <Navigation className="h-4 w-4" />,
            });
        }
    }, [insideGeofence, isRunning]);

    // Send location updates when position changes
    useEffect(() => {
        if (isRunning && position && existingRoute && user?.id) {
            api.updateDriverLocation({
                driver_id: user.id,
                route_id: existingRoute.routeId || '',
                lat: position.lat,
                lon: position.lon
            }).catch(err => console.error("Failed to update location", err));
        }
    }, [isRunning, position, existingRoute, user]);

    const onSubmit = async (data: DriverFormData) => {
        setIsSubmitting(true);
        try {
            const response = await api.registerDriverRoute({
                driver_id: data.driverId,
                route_id: data.routeId, // Optional
                dest_area: data.destinationArea,
                seats_total: data.seatsTotal,
                seats_free: data.seatsFree, // Backend might not use this yet but good to send
                stations: data.stationIds,
                // minutes_before_eta_match: data.minutesBeforeEtaMatch // Backend might not support this yet
            });

            // Capture the route ID from the backend response if available
            const registeredRouteId = response.data.routeId || response.data.id || data.routeId;

            setExistingRoute({
                ...data,
                routeId: registeredRouteId
            });
            // toast.success('Route registered successfully!');
            alert('Route registered successfully!');
        } catch (error) {
            console.error(error);
            // toast.error('Failed to save route');
            alert('Failed to save route');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStation = (stationId: string) => {
        const newStations = selectedStations.includes(stationId)
            ? selectedStations.filter((id) => id !== stationId)
            : [...selectedStations, stationId];
        setSelectedStations(newStations);
        setValue('stationIds', newStations);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Driver Dashboard</h1>
                    <p className="text-muted-foreground">Manage your route and offer rides</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-600">Welcome, {user?.name}</span>
                    <Notifications />
                    <Button variant="destructive" onClick={logout}>Logout</Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Route Form */}
                <Card className="rounded-2xl">
                    <CardHeader>
                        <CardTitle>Register / Update Route</CardTitle>
                        <CardDescription>Set up your route and availability</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="driverId">Driver ID</Label>
                                    <Input
                                        id="driverId"
                                        {...register('driverId')}
                                        readOnly
                                        className="bg-gray-100"
                                    />
                                    {errors.driverId && (
                                        <p className="text-sm text-red-500">{errors.driverId.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="routeId">Route ID (Optional)</Label>
                                    <Input
                                        id="routeId"
                                        placeholder="e.g., RT-123"
                                        {...register('routeId')}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="destinationArea">Destination Area</Label>
                                <Input
                                    id="destinationArea"
                                    placeholder="e.g., Indiranagar"
                                    {...register('destinationArea')}
                                />
                                {errors.destinationArea && (
                                    <p className="text-sm text-red-500">{errors.destinationArea.message}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="seatsTotal">Total Seats</Label>
                                    <Input
                                        id="seatsTotal"
                                        type="number"
                                        min="1"
                                        {...register('seatsTotal', { valueAsNumber: true })}
                                    />
                                    {errors.seatsTotal && (
                                        <p className="text-sm text-red-500">{errors.seatsTotal.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="seatsFree">Seats Available</Label>
                                    <Input
                                        id="seatsFree"
                                        type="number"
                                        min="0"
                                        max={watchedSeatsTotal}
                                        {...register('seatsFree', { valueAsNumber: true })}
                                    />
                                    {errors.seatsFree && (
                                        <p className="text-sm text-red-500">{errors.seatsFree.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Stations (Select multiple)</Label>
                                <div className="flex flex-wrap gap-2">
                                    {stations.map((station) => (
                                        <Badge
                                            key={station.id}
                                            variant={selectedStations.includes(station.id) ? 'default' : 'outline'}
                                            className={`cursor-pointer ${selectedStations.includes(station.id) ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                                            onClick={() => toggleStation(station.id)}
                                        >
                                            {station.name}
                                        </Badge>
                                    ))}
                                </div>
                                {errors.stationIds && (
                                    <p className="text-sm text-red-500">{errors.stationIds.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="minutesBeforeEtaMatch">
                                    Minutes Before ETA to Match
                                    <span className="text-muted-foreground text-sm ml-2">
                                        (How early to start matching?)
                                    </span>
                                </Label>
                                <Input
                                    id="minutesBeforeEtaMatch"
                                    type="number"
                                    min="0"
                                    {...register('minutesBeforeEtaMatch', { valueAsNumber: true })}
                                />
                                {errors.minutesBeforeEtaMatch && (
                                    <p className="text-sm text-red-500">
                                        {errors.minutesBeforeEtaMatch.message}
                                    </p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Route'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Active Route Summary */}
                {existingRoute && (
                    <Card className="rounded-2xl bg-blue-50 border-blue-200">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Car className="h-5 w-5 text-blue-600" />
                                <CardTitle>Active Route</CardTitle>
                            </div>
                            <CardDescription>Your current route configuration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Driver ID:</span>
                                    <p className="font-semibold">{existingRoute.driverId}</p>
                                </div>
                                {existingRoute.routeId && (
                                    <div>
                                        <span className="text-muted-foreground">Route ID:</span>
                                        <p className="font-semibold">{existingRoute.routeId}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-muted-foreground">Destination:</span>
                                    <p className="font-semibold">{existingRoute.destinationArea}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Seats:</span>
                                    <p className="font-semibold">
                                        {existingRoute.seatsFree} / {existingRoute.seatsTotal} available
                                    </p>
                                </div>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-sm">Stations:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {existingRoute.stationIds.map((id) => {
                                        const station = stations.find((s) => s.id === id);
                                        return (
                                            <Badge key={id} variant="secondary">
                                                {station?.name || id}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Simulator */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="rounded-2xl">
                    <CardHeader>
                        <CardTitle>Driver Movement Simulator</CardTitle>
                        <CardDescription>
                            Simulate driving to the first station in your route
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Button
                                onClick={start}
                                disabled={isRunning || !firstStation}
                                className="flex-1"
                            >
                                <Play className="mr-2 h-4 w-4" />
                                Start Simulation
                            </Button>
                            <Button onClick={stop} disabled={!isRunning} variant="destructive" className="flex-1">
                                <Square className="mr-2 h-4 w-4" />
                                Stop
                            </Button>
                        </div>

                        {!firstStation && (
                            <p className="text-sm text-muted-foreground text-center">
                                Select at least one station in your route to enable simulation
                            </p>
                        )}

                        {position && (
                            <div className="space-y-3 p-4 bg-gray-100 rounded-lg">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Current Position:</span>
                                        <p className="font-mono text-xs">
                                            {position.lat.toFixed(6)}, {position.lon.toFixed(6)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Distance to Station:</span>
                                        <p className="font-semibold">
                                            {distanceToStation ? `${Math.round(distanceToStation)}m` : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">ETA:</span>
                                        <p className="font-semibold">{etaMinutes ? `${etaMinutes} min` : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Geofence Status:</span>
                                        <Badge variant={insideGeofence ? 'default' : 'secondary'} className={insideGeofence ? 'bg-green-500 text-white' : ''}>
                                            {insideGeofence ? 'Inside' : 'Outside'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Map */}
                <Card className="rounded-2xl">
                    <CardHeader>
                        <CardTitle>Live Position</CardTitle>
                        <CardDescription>
                            {firstStation
                                ? `Tracking movement to ${firstStation.name}`
                                : 'Select a station to view map'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] p-0">
                        <GeoMap station={simulatorStation} driverPosition={position} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
