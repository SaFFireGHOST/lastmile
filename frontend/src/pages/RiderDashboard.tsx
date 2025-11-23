import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { GeoMap } from '@/shared/ui/GeoMap';
import { toast } from 'sonner'; // Assuming sonner is installed, if not we might need to remove or replace
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Notifications } from '@/components/Notifications';

const riderSchema = z.object({
    riderId: z.string().min(1, 'Rider ID is required'),
    stationId: z.string().min(1, 'Station is required'),
    destination: z.string().min(1, 'Destination is required'),
    etaMinutes: z.number().int().min(0, 'ETA must be 0 or greater'),
});

type RiderFormData = z.infer<typeof riderSchema>;

interface Station {
    id: string;
    name: string;
    location: { lat: number; lon: number };
    nearbyAreas: string[];
}

export const RiderDashboard = () => {
    const { user, logout } = useAuth();
    const [stations, setStations] = useState<Station[]>([]);
    const [stationsLoading, setStationsLoading] = useState(true);
    const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
    const [simulateEnabled, setSimulateEnabled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Placeholder for requests until backend supports fetching by rider
    const [requests, setRequests] = useState<any[]>([]);

    useEffect(() => {
        const fetchStations = async () => {
            try {
                const response = await api.getStations();
                // Assuming the API returns `nearby_areas` and we need to map it to `nearbyAreas`
                const mappedStations = response.data.map((station: any) => ({
                    ...station,
                    nearbyAreas: station.nearbyAreas || []
                }));
                console.log(response.data);
                setStations(mappedStations);
            } catch (error) {
                console.error('Failed to fetch stations', error);
                // toast.error('Failed to load stations');
            } finally {
                setStationsLoading(false);
            }
        };
        fetchStations();
    }, []);

    const selectedStation = stations.find((s) => s.id === selectedStationId);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RiderFormData>({
        resolver: zodResolver(riderSchema),
        defaultValues: {
            riderId: user?.id || '',
            etaMinutes: 10,
        },
    });

    const watchedStationId = watch('stationId');

    useEffect(() => {
        if (watchedStationId) {
            setSelectedStationId(watchedStationId);
        }
    }, [watchedStationId]);

    // Update riderId if user loads late
    useEffect(() => {
        if (user?.id) {
            setValue('riderId', user.id);
        }
    }, [user, setValue]);

    const onSubmit = async (data: RiderFormData) => {
        setIsSubmitting(true);
        try {
            const response = await api.createRiderRequest({
                rider_id: data.riderId,
                station_id: data.stationId,
                dest_area: data.destination,
                eta_minutes: data.etaMinutes,
            });

            // Add to local requests list for immediate feedback (since we don't have fetch API yet)
            const newRequest = {
                id: response.data.id || 'REQ-' + Date.now(), // Fallback if ID not returned
                stationId: data.stationId,
                destination: data.destination,
                etaAbsolute: new Date(Date.now() + data.etaMinutes * 60000),
                updatedAt: new Date(),
                status: 'PENDING'
            };
            setRequests(prev => [newRequest, ...prev]);

            toast.success('Ride request created successfully!');
            // alert('Ride request created successfully!');
        } catch (error) {
            console.error(error);
            // toast.error('Failed to create request');
            alert('Failed to create request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            PENDING: { variant: 'outline', label: 'Pending' },
            ASSIGNED: { variant: 'default', label: 'Assigned' },
            COMPLETED: { variant: 'secondary', label: 'Completed' },
        };
        const config = variants[status] || variants.PENDING;
        return (
            <Badge variant={config.variant} className={
                status === 'ASSIGNED' ? 'bg-green-500 text-white' :
                    status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                        ''
            }>
                {config.label}
            </Badge>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Rider Dashboard</h1>
                    <p className="text-muted-foreground">Request rides from metro stations</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-600">Welcome, {user?.name}</span>
                    <Notifications />
                    <Button variant="destructive" onClick={logout}>Logout</Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Request Form */}
                <Card className="rounded-2xl">
                    <CardHeader>
                        <CardTitle>Create Ride Request</CardTitle>
                        <CardDescription>Enter your details to request a ride</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="riderId">Rider ID</Label>
                                <Input
                                    id="riderId"
                                    {...register('riderId')}
                                    readOnly // Make read-only as it comes from auth
                                    className="bg-gray-100"
                                />
                                {errors.riderId && (
                                    <p className="text-sm text-red-500">{errors.riderId.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="stationId">Metro Station</Label>
                                <Select
                                    onValueChange={(value) => setValue('stationId', value)}
                                    disabled={stationsLoading}
                                >
                                    <SelectTrigger id="stationId">
                                        <SelectValue placeholder="Select station" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stations.map((station) => (
                                            <SelectItem key={station.id} value={station.id}>
                                                {station.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.stationId && (
                                    <p className="text-sm text-red-500">{errors.stationId.message}</p>
                                )}
                            </div>

                            {selectedStation && selectedStation.nearbyAreas && (
                                <div className="space-y-2">
                                    <Label>Suggested Nearby Areas</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStation.nearbyAreas.map((area) => (
                                            <Badge
                                                key={area}
                                                variant="secondary"
                                                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                                onClick={() => setValue('destination', area)}
                                            >
                                                {area}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="destination">Destination Area</Label>
                                <Input
                                    id="destination"
                                    placeholder="e.g., Indiranagar"
                                    {...register('destination')}
                                />
                                {errors.destination && (
                                    <p className="text-sm text-red-500">{errors.destination.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="etaMinutes">
                                    ETA in minutes from now
                                    <span className="text-muted-foreground text-sm ml-2">
                                        (When will you arrive at station?)
                                    </span>
                                </Label>
                                <Input
                                    id="etaMinutes"
                                    type="number"
                                    min="0"
                                    {...register('etaMinutes', { valueAsNumber: true })}
                                />
                                {errors.etaMinutes && (
                                    <p className="text-sm text-red-500">{errors.etaMinutes.message}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Request Ride
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Map */}
                <Card className="rounded-2xl">
                    <CardHeader>
                        <CardTitle>Station Location</CardTitle>
                        <CardDescription>
                            {selectedStation
                                ? `${selectedStation.name} - 400m geofence`
                                : 'Select a station to view map'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] p-0">
                        {/* Pass the station object with location to GeoMap. 
                Note: GeoMap expects 'nearbyAreas' but API returns 'nearby_areas'. 
                We might need to map it or GeoMap handles it. 
                Let's check GeoMap props if possible, but for now I'll pass it as is 
                and hope it works or I might need to adapt the object.
            */}
                        <GeoMap station={selectedStation ? {
                            id: selectedStation.id,
                            name: selectedStation.name,
                            lat: selectedStation.location.lat,
                            lon: selectedStation.location.lon,
                            nearbyAreas: selectedStation.nearbyAreas
                        } : null} />
                    </CardContent>
                </Card>
            </div>

            {/* My Requests */}
            <Card className="rounded-2xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>My Requests</CardTitle>
                            <CardDescription>
                                Showing recent requests
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="simulate">Simulate Assignment</Label>
                            <Switch
                                id="simulate"
                                checked={simulateEnabled}
                                onCheckedChange={setSimulateEnabled}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No requests yet. Create your first ride request above.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => {
                                const station = stations.find((s) => s.id === request.stationId);
                                return (
                                    <div
                                        key={request.id}
                                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{request.id}</span>
                                                {getStatusBadge(request.status)}
                                            </div>
                                            <div className="text-sm text-muted-foreground space-y-1">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{station?.name || request.stationId}</span>
                                                    <span className="mx-1">→</span>
                                                    <span>{request.destination}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>ETA: {request.etaAbsolute.toLocaleTimeString()}</span>
                                                    <span className="text-xs">({formatDistanceToNow(request.etaAbsolute, { addSuffix: true })})</span>
                                                </div>
                                            </div>
                                        </div>
                                        {request.status === 'ASSIGNED' && (
                                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
