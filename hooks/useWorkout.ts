import { useState, useEffect, useCallback } from 'react';
import { WorkoutSession, WorkoutType, WorkoutSummary } from '@/types/workout';
import { WorkoutService } from '@/services/WorkoutService';

export interface UseWorkoutReturn {
  currentSession: WorkoutSession | null;
  isActive: boolean;
  isPaused: boolean;
  startWorkout: (type: WorkoutType['id']) => Promise<void>;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  endWorkout: () => Promise<WorkoutSummary | null>;
  error: string | null;
}

export function useWorkout(): UseWorkoutReturn {
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const workoutService = WorkoutService.getInstance();

  // Listen to workout updates
  useEffect(() => {
    const handleWorkoutUpdate = (session: WorkoutSession | null) => {
      setCurrentSession(session);
    };

    workoutService.addListener(handleWorkoutUpdate);

    // Get current session on mount
    setCurrentSession(workoutService.getCurrentSession());

    return () => {
      workoutService.removeListener(handleWorkoutUpdate);
    };
  }, [workoutService]);

  const startWorkout = useCallback(async (type: WorkoutType['id']) => {
    try {
      setError(null);
      await workoutService.startWorkout(type);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start workout';
      setError(errorMessage);
      console.error('Error starting workout:', err);
    }
  }, [workoutService]);

  const pauseWorkout = useCallback(() => {
    try {
      setError(null);
      workoutService.pauseWorkout();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause workout';
      setError(errorMessage);
      console.error('Error pausing workout:', err);
    }
  }, [workoutService]);

  const resumeWorkout = useCallback(() => {
    try {
      setError(null);
      workoutService.resumeWorkout();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume workout';
      setError(errorMessage);
      console.error('Error resuming workout:', err);
    }
  }, [workoutService]);

  const endWorkout = useCallback(async (): Promise<WorkoutSummary | null> => {
    try {
      setError(null);
      return await workoutService.endWorkout();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end workout';
      setError(errorMessage);
      console.error('Error ending workout:', err);
      return null;
    }
  }, [workoutService]);

  return {
    currentSession,
    isActive: currentSession?.isActive || false,
    isPaused: currentSession?.isPaused || false,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    endWorkout,
    error,
  };
}