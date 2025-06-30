import { useState, useEffect, useCallback } from 'react';
import { WorkoutSession } from '@/types/healthkit';
import { HealthKitService } from '@/services/HealthKitService';

export interface UseHealthKitReturn {
  currentSession: WorkoutSession | null;
  isActive: boolean;
  startWorkout: (type: 'running' | 'walking' | 'cycling' | 'other') => Promise<void>;
  endWorkout: () => Promise<WorkoutSession | null>;
  error: string | null;
  isInitialized: boolean;
}

export function useHealthKit(): UseHealthKitReturn {
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const healthKitService = HealthKitService.getInstance();

  // Initialize HealthKit on mount
  useEffect(() => {
    const initializeHealthKit = async () => {
      try {
        const initialized = await healthKitService.initialize();
        setIsInitialized(initialized);
      } catch (err) {
        setError('Failed to initialize HealthKit');
        console.error('HealthKit initialization error:', err);
      }
    };

    initializeHealthKit();
  }, [healthKitService]);

  // Listen to workout updates
  useEffect(() => {
    const handleWorkoutUpdate = (session: WorkoutSession | null) => {
      setCurrentSession(session);
    };

    healthKitService.addListener(handleWorkoutUpdate);

    // Get current session on mount
    setCurrentSession(healthKitService.getCurrentSession());

    return () => {
      healthKitService.removeListener(handleWorkoutUpdate);
    };
  }, [healthKitService]);

  const startWorkout = useCallback(async (type: 'running' | 'walking' | 'cycling' | 'other') => {
    try {
      setError(null);
      await healthKitService.startWorkout(type);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start workout';
      setError(errorMessage);
      console.error('Error starting workout:', err);
    }
  }, [healthKitService]);

  const endWorkout = useCallback(async (): Promise<WorkoutSession | null> => {
    try {
      setError(null);
      return await healthKitService.endWorkout();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end workout';
      setError(errorMessage);
      console.error('Error ending workout:', err);
      return null;
    }
  }, [healthKitService]);

  return {
    currentSession,
    isActive: currentSession?.isActive || false,
    startWorkout,
    endWorkout,
    error,
    isInitialized,
  };
}