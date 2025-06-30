import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { WorkoutSession, RealTimeMetrics, LocationPoint } from '@/types/healthkit';

export class HealthKitService {
  private static instance: HealthKitService;
  private currentSession: WorkoutSession | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private listeners: ((session: WorkoutSession | null) => void)[] = [];
  private lastLocationUpdate: Date = new Date();
  private routePoints: LocationPoint[] = [];

  private constructor() {}

  static getInstance(): HealthKitService {
    if (!HealthKitService.instance) {
      HealthKitService.instance = new HealthKitService();
    }
    return HealthKitService.instance;
  }

  // Initialize HealthKit permissions (iOS only)
  async initialize(): Promise<boolean> {
    console.log('🏥 Initializing HealthKit service');
    
    if (Platform.OS !== 'ios') {
      console.log('ℹ️ HealthKit is only available on iOS, using location-based tracking instead');
      return true; // Return true to allow the app to function on non-iOS platforms
    }

    try {
      // In a real implementation with native HealthKit, we would initialize permissions here
      // For now, we'll simulate successful initialization
      console.log('✅ HealthKit initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize HealthKit:', error);
      return false;
    }
  }

  // Start a new workout session
  async startWorkout(type: 'running' | 'walking' | 'cycling' | 'other'): Promise<WorkoutSession> {
    if (this.currentSession?.isActive) {
      throw new Error('A workout is already in progress');
    }

    console.log('🏃‍♂️ Starting workout:', type);

    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission is required for accurate tracking');
    }

    // Reset route points
    this.routePoints = [];

    // Create new session
    const session: WorkoutSession = {
      id: `workout-${Date.now()}`,
      type,
      startTime: new Date(),
      isActive: true,
      metrics: {
        distance: 0,
        speed: 0,
        pace: 0,
        duration: 0,
        timestamp: new Date(),
      },
      route: [],
      totalDistance: 0,
      maxSpeed: 0,
    };

    this.currentSession = session;
    this.startLocationTracking();
    this.startMetricsTracking();
    this.notifyListeners();

    console.log('✅ Workout started successfully:', type);
    return session;
  }

  // End the current workout
  async endWorkout(): Promise<WorkoutSession | null> {
    if (!this.currentSession) {
      return null;
    }

    console.log('🏁 Ending workout session');
    
    this.currentSession.isActive = false;
    this.currentSession.endTime = new Date();
    
    this.stopLocationTracking();
    this.stopMetricsTracking();

    // Calculate final metrics
    const duration = (this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()) / 1000;
    
    // Only calculate average speed if we have a meaningful duration to avoid division by zero
    if (duration > 0) {
      this.currentSession.averageSpeed = this.currentSession.totalDistance / duration;
    }

    // Save workout to HealthKit (iOS only)
    if (Platform.OS === 'ios') {
      await this.saveWorkoutToHealthKit(this.currentSession);
    }

    const completedSession = { ...this.currentSession };
    this.currentSession = null;
    this.notifyListeners();

    console.log('✅ Workout ended. Total distance:', completedSession.totalDistance.toFixed(2), 'meters');
    return completedSession;
  }

  // Get current workout session
  getCurrentSession(): WorkoutSession | null {
    return this.currentSession;
  }

  // Add listener for workout updates
  addListener(listener: (session: WorkoutSession | null) => void): void {
    this.listeners.push(listener);
  }

  // Remove listener
  removeListener(listener: (session: WorkoutSession | null) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Start location tracking
  private async startLocationTracking(): Promise<void> {
    try {
      console.log('📍 Starting location tracking');
      
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Update every second
          distanceInterval: 1, // Update every meter
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );
      
      console.log('✅ Location tracking started');
    } catch (error) {
      console.error('❌ Failed to start location tracking:', error);
    }
  }

  // Stop location tracking
  private stopLocationTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
      console.log('📍 Location tracking stopped');
    }
  }

  // Start metrics tracking
  private startMetricsTracking(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 1000); // Update every second
    
    console.log('📊 Metrics tracking started');
  }

  // Stop metrics tracking
  private stopMetricsTracking(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
      console.log('📊 Metrics tracking stopped');
    }
  }

  // Handle location updates
  private handleLocationUpdate(location: Location.LocationObject): void {
    if (!this.currentSession) return;

    const now = new Date();
    
    // Create location point
    const locationPoint: LocationPoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: now,
      altitude: location.coords.altitude || undefined,
      speed: location.coords.speed || undefined,
    };

    // Add to route
    this.routePoints.push(locationPoint);
    this.currentSession.route = [...this.routePoints];

    // Calculate distance if we have a previous location
    if (this.routePoints.length > 1) {
      const previousPoint = this.routePoints[this.routePoints.length - 2];
      const distance = this.calculateDistance(
        previousPoint.latitude,
        previousPoint.longitude,
        locationPoint.latitude,
        locationPoint.longitude
      );
      
      // Only add distance if it's reasonable (to filter out GPS jumps)
      if (distance < 50) { // Max 50 meters per second (180 km/h)
        this.currentSession.totalDistance += distance;
        this.currentSession.metrics.distance = this.currentSession.totalDistance;
      }
    }

    // Update speed directly from GPS if available
    if (location.coords.speed !== null && location.coords.speed >= 0) {
      // Convert m/s to km/h for display
      const speedKmh = location.coords.speed * 3.6;
      this.currentSession.metrics.speed = speedKmh;
      
      // Update max speed
      if (speedKmh > this.currentSession.maxSpeed) {
        this.currentSession.maxSpeed = speedKmh;
      }
      
      // Calculate pace (min/km) from speed
      if (speedKmh > 0) {
        // 60 / speed(km/h) = pace(min/km)
        this.currentSession.metrics.pace = 60 / speedKmh;
      }
    }

    this.lastLocationUpdate = now;
    
    // Log location update every 5 seconds
    const secondsSinceStart = (now.getTime() - this.currentSession.startTime.getTime()) / 1000;
    if (Math.floor(secondsSinceStart) % 5 === 0) {
      console.log('📍 Location update:', {
        lat: locationPoint.latitude.toFixed(6),
        lng: locationPoint.longitude.toFixed(6),
        speed: location.coords.speed ? `${(location.coords.speed * 3.6).toFixed(1)} km/h` : 'unknown',
        accuracy: location.coords.accuracy ? `${location.coords.accuracy.toFixed(1)}m` : 'unknown',
        totalDistance: `${this.currentSession.totalDistance.toFixed(2)}m`
      });
    }
    
    this.notifyListeners();
  }

  // Update metrics
  private updateMetrics(): void {
    if (!this.currentSession) return;

    const now = new Date();
    
    // Calculate duration
    const duration = (now.getTime() - this.currentSession.startTime.getTime()) / 1000;
    this.currentSession.metrics.duration = duration;
    
    // Update timestamp
    this.currentSession.metrics.timestamp = now;
    
    // Notify listeners
    this.notifyListeners();
  }

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  }

  // Save workout to HealthKit (iOS only - placeholder implementation)
  private async saveWorkoutToHealthKit(session: WorkoutSession): Promise<void> {
    if (Platform.OS !== 'ios') return;

    try {
      // In a real implementation with native HealthKit, we would save the workout here
      console.log('💾 Saving workout to HealthKit:', {
        type: session.type,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString(),
        duration: session.metrics.duration,
        distance: session.totalDistance,
        averageSpeed: session.averageSpeed,
        maxSpeed: session.maxSpeed
      });
      
      console.log('ℹ️ Note: This is a simulated HealthKit save. For actual HealthKit integration, you need to add @kingstinct/react-native-healthkit to your project and configure native permissions.');
    } catch (error) {
      console.error('❌ Failed to save workout to HealthKit:', error);
    }
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentSession);
      } catch (error) {
        console.error('Error in workout listener:', error);
      }
    });
  }
}

export default HealthKitService;