import { useState, useEffect, useCallback, useRef } from 'react';
import { Station } from '@/lib/types';
import { calculateDistance, calculateBearing, movePoint } from '@/lib/geo';

interface SimulatorState {
  isRunning: boolean;
  position: { lat: number; lon: number } | null;
  distanceToStation: number | null;
  etaMinutes: number | null;
  insideGeofence: boolean;
}

const GEOFENCE_RADIUS = 400; // meters
const SPEED_MPS = 5; // 5 meters per second (~18 km/h)
const UPDATE_INTERVAL = 1000; // Update every second

export function useDriverSimulator(targetStation: Station | null) {
  const [state, setState] = useState<SimulatorState>({
    isRunning: false,
    position: null,
    distanceToStation: null,
    etaMinutes: null,
    insideGeofence: false,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedGeofenceRef = useRef(false);
  
  const start = useCallback(() => {
    if (!targetStation) return;
    
    // Start 1 km away from station
    const startDistance = 1000; // meters
    const bearing = Math.random() * 360; // Random direction
    const startPos = movePoint(
      targetStation.lat,
      targetStation.lon,
      bearing,
      startDistance
    );
    
    setState({
      isRunning: true,
      position: startPos,
      distanceToStation: startDistance,
      etaMinutes: Math.ceil(startDistance / SPEED_MPS / 60),
      insideGeofence: false,
    });
    
    notifiedGeofenceRef.current = false;
  }, [targetStation]);
  
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState({
      isRunning: false,
      position: null,
      distanceToStation: null,
      etaMinutes: null,
      insideGeofence: false,
    });
    notifiedGeofenceRef.current = false;
  }, []);
  
  useEffect(() => {
    if (!state.isRunning || !state.position || !targetStation) return;
    
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev.position || !targetStation) return prev;
        
        const distance = calculateDistance(
          prev.position.lat,
          prev.position.lon,
          targetStation.lat,
          targetStation.lon
        );
        
        // Check if arrived
        if (distance < 10) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return {
            ...prev,
            isRunning: false,
            distanceToStation: 0,
            etaMinutes: 0,
            insideGeofence: true,
          };
        }
        
        // Move towards station
        const bearing = calculateBearing(
          prev.position.lat,
          prev.position.lon,
          targetStation.lat,
          targetStation.lon
        );
        
        const newPos = movePoint(
          prev.position.lat,
          prev.position.lon,
          bearing,
          SPEED_MPS
        );
        
        const newDistance = calculateDistance(
          newPos.lat,
          newPos.lon,
          targetStation.lat,
          targetStation.lon
        );
        
        const insideGeofence = newDistance <= GEOFENCE_RADIUS;
        
        // Notify when entering geofence
        if (insideGeofence && !notifiedGeofenceRef.current) {
          notifiedGeofenceRef.current = true;
          // This will be picked up by the component
        }
        
        return {
          ...prev,
          position: newPos,
          distanceToStation: newDistance,
          etaMinutes: Math.ceil(newDistance / SPEED_MPS / 60),
          insideGeofence,
        };
      });
    }, UPDATE_INTERVAL);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, targetStation]);
  
  return {
    ...state,
    start,
    stop,
  };
}
