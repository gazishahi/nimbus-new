export interface HealthKitPermissions {
  read: string[];
  write: string[];
}

export interface WorkoutData {
  id: string;
  type: 'running' | 'walking' | 'cycling' | 'other';
  startDate: Date;
  endDate?: Date;
  duration: number; // seconds
  distance?: number; // meters
  isActive: boolean;
}

export interface RealTimeMetrics {
  distance: number; // meters
  speed: number; // km/h
  pace: number; // min/km
  duration: number; // seconds
  timestamp: Date;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  altitude?: number;
  speed?: number;
}

export interface WorkoutSession {
  id: string;
  type: 'running' | 'walking' | 'cycling' | 'other';
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  metrics: RealTimeMetrics;
  route: LocationPoint[];
  totalDistance: number;
  maxSpeed: number;
  averageSpeed?: number;
}