export interface WorkoutType {
  id: 'outdoor_run' | 'indoor_run' | 'outdoor_walk' | 'indoor_walk';
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface WorkoutSession {
  id: string;
  type: WorkoutType['id'];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  isPaused: boolean;
  metrics: WorkoutMetrics;
  route?: RoutePoint[];
  notes?: string;
}

export interface WorkoutMetrics {
  duration: number; // seconds
  distance: number; // meters
  pace: number; // min/km
  speed: number; // km/h
  calories: number; // estimated calories
  maxSpeed?: number; // km/h
  elevationGain?: number; // meters
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  altitude?: number;
  speed?: number;
}

export interface WorkoutSummary {
  session: WorkoutSession;
  achievements: string[];
  xpGained: number;
  questsCompleted: number;
  personalBests: string[];
}