import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { RunSession, RoutePoint } from '@/types/game';

interface RunningTrackerState {
  isRunning: boolean;
  currentSession: RunSession | null;
  distance: number;
  duration: number;
  pace: number;
  speed: number;
  hasPermissions: boolean;
}

export function useRunningTracker() {
  const [state, setState] = useState<RunningTrackerState>({
    isRunning: false,
    currentSession: null,
    distance: 0,
    duration: 0,
    pace: 0,
    speed: 0,
    hasPermissions: false,
  });

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const accelerometerSubscription = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocation = useRef<Location.LocationObject | null>(null);
  const routePoints = useRef<RoutePoint[]>([]);

  useEffect(() => {
    requestPermissions();
    setupAccelerometer();
    
    return () => {
      cleanup();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      setState(prev => ({ ...prev, hasPermissions: true }));
      return;
    }

    try {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (locationStatus === 'granted') {
        setState(prev => ({ ...prev, hasPermissions: true }));
      }
    } catch (error) {
      console.warn('Permission request failed:', error);
    }
  };

  const setupAccelerometer = () => {
    if (Platform.OS === 'web') return;

    Accelerometer.setUpdateInterval(1000);
    
    accelerometerSubscription.current = Accelerometer.addListener(({ x, y, z }) => {
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      
      // Detect running motion (simplified algorithm)
      if (acceleration > 1.2 && !state.isRunning) {
        // Auto-start run detection after consistent movement
        setTimeout(() => {
          if (!state.isRunning) {
            startRun();
          }
        }, 5000);
      }
    });
  };

  const startRun = async () => {
    if (!state.hasPermissions) {
      await requestPermissions();
      return;
    }

    const newSession: RunSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      distance: 0,
      duration: 0,
      averagePace: 0,
      maxSpeed: 0,
      elevationGain: 0,
      calories: 0,
      activeQuests: [],
      completedQuests: [],
      experienceGained: 0,
      route: [],
    };

    setState(prev => ({
      ...prev,
      isRunning: true,
      currentSession: newSession,
      distance: 0,
      duration: 0,
      pace: 0,
      speed: 0,
    }));

    routePoints.current = [];
    
    // Start location tracking
    if (Platform.OS !== 'web') {
      try {
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          handleLocationUpdate
        );
      } catch (error) {
        console.warn('Location tracking failed:', error);
      }
    }

    // Start duration timer
    intervalRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        duration: prev.duration + 1,
      }));
    }, 1000) as any;
  };

  const handleLocationUpdate = (location: Location.LocationObject) => {
    const newPoint: RoutePoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: new Date(),
      altitude: location.coords.altitude || undefined,
      speed: location.coords.speed || undefined,
    };

    routePoints.current.push(newPoint);

    if (lastLocation.current) {
      const distance = calculateDistance(
        lastLocation.current.coords.latitude,
        lastLocation.current.coords.longitude,
        location.coords.latitude,
        location.coords.longitude
      );

      setState(prev => {
        const newDistance = prev.distance + distance;
        const newSpeed = location.coords.speed || 0;
        const newPace = newSpeed > 0 ? 1000 / (newSpeed * 60) : 0; // min/km

        return {
          ...prev,
          distance: newDistance,
          speed: newSpeed,
          pace: newPace,
          currentSession: prev.currentSession ? {
            ...prev.currentSession,
            distance: newDistance,
            duration: prev.duration,
            maxSpeed: Math.max(prev.currentSession.maxSpeed, newSpeed),
            route: [...routePoints.current],
          } : null,
        };
      });
    }

    lastLocation.current = location;
  };

  const stopRun = () => {
    cleanup();
    
    setState(prev => ({
      ...prev,
      isRunning: false,
      currentSession: prev.currentSession ? {
        ...prev.currentSession,
        endTime: new Date(),
        duration: prev.duration,
        distance: prev.distance,
        averagePace: prev.duration > 0 ? prev.distance / (prev.duration / 60) : 0,
        calories: Math.round(prev.distance * 0.75), // Rough calculation
      } : null,
    }));
  };

  const pauseRun = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  const resumeRun = async () => {
    if (Platform.OS !== 'web' && state.hasPermissions) {
      try {
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          handleLocationUpdate
        );
      } catch (error) {
        console.warn('Location tracking failed:', error);
      }
    }

    intervalRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        duration: prev.duration + 1,
      }));
    }, 1000) as any;
  };

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    
    if (accelerometerSubscription.current) {
      accelerometerSubscription.current.remove();
      accelerometerSubscription.current = null;
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  return {
    ...state,
    startRun,
    stopRun,
    pauseRun,
    resumeRun,
  };
}