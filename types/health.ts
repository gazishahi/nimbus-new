export interface WorkoutData {
  workoutType: string;
  startDate: Date;
  endDate?: Date;
  duration: number; // seconds
  totalDistance?: number; // meters
  totalEnergyBurned?: number; // calories
  isActive: boolean;
}

export interface RealTimeMetrics {
  heartRate?: number; // BPM
  distance?: number; // meters
  speed?: number; // m/s
  pace?: number; // min/km
  calories?: number;
  timestamp: Date;
}

export interface WorkoutSession {
  id: string;
  type: 'running' | 'walking' | 'cycling' | 'other';
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  metrics: RealTimeMetrics[];
  totalDistance: number;
  totalCalories: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
}

export interface HealthKitPermissions {
  read: string[];
  write: string[];
}

export interface WorkoutEvent {
  type: 'workout_started' | 'workout_ended' | 'workout_paused' | 'workout_resumed';
  workout: WorkoutData;
  timestamp: Date;
}