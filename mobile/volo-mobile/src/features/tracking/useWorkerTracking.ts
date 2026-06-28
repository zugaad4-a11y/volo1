import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { pushWorkerLocation } from '@/api/tracking';

/**
 * Custom hook to track worker location and send periodic updates to the server.
 * Used when a worker is on an active job shift.
 */
export function useWorkerTracking(active: boolean, intervalMs: number = 15000) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let watchId: any = null;
    let timerId: any = null;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location tracking permission denied.');
          return;
        }

        // 1. Initial position
        const currentLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        setCoords({
          lat: currentLoc.coords.latitude,
          lng: currentLoc.coords.longitude,
        });

        // 2. Watch position for active UI feedback
        watchId = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10, // Update state if moved 10 meters
          },
          (newLoc) => {
            setCoords({
              lat: newLoc.coords.latitude,
              lng: newLoc.coords.longitude,
            });
          }
        );

        // 3. Periodic upload to server
        timerId = setInterval(async () => {
          if (!active) return;
          try {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });

            await pushWorkerLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              accuracy: loc.coords.accuracy ?? undefined,
              speed: loc.coords.speed ?? undefined,
              heading: loc.coords.heading ?? undefined,
              deviceType: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
            });
          } catch (err) {
            console.warn('[Tracking] Failed to upload location:', err);
          }
        }, intervalMs);

      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to initialize tracking.');
      }
    };

    if (active) {
      startTracking();
    }

    return () => {
      if (watchId) {
        watchId.remove();
      }
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [active, intervalMs]);

  return { coords, errorMsg };
}
