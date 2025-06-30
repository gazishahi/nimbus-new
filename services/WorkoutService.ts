import { WorkoutSession, WorkoutType, WorkoutMetrics, WorkoutSummary } from '@/types/workout';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';

export class WorkoutService {
  private static instance: WorkoutService;
  private currentSession: WorkoutSession | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: ((session: WorkoutSession | null) => void)[] = [];
  private locationSubscription: Location.LocationSubscription | null = null;
  private lastUpdateTime: number = 0;
  private routePoints: any[] = [];
  private stepCount: number = 0;
  private lastStepUpdateTime: number = 0;
  private isIndoorWorkout: boolean = false;

  private constructor() {}

  static getInstance(): WorkoutService {
    if (!WorkoutService.instance) {
      WorkoutService.instance = new WorkoutService();
    }
    return WorkoutService.instance;
  }

  // Start a new workout session
  async startWorkout(workoutType: WorkoutType['id']): Promise<WorkoutSession> {
    if (this.currentSession?.isActive) {
      throw new Error('A workout is already in progress');
    }

    console.log('🏃‍♂️ Starting workout:', workoutType);

    // Check if this is an indoor workout
    this.isIndoorWorkout = workoutType.includes('indoor');
    
    // Request location permissions for outdoor workouts
    if (!this.isIndoorWorkout && Platform.OS !== 'web') {
      console.log('📱 Requesting location permissions for outdoor workout...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('📱 Location permission status:', status);
      
      if (status !== 'granted') {
        console.error('❌ Location permission denied');
        throw new Error('Location permission is required for outdoor tracking');
      }
      
      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      console.log('📱 Location services enabled:', enabled);
      
      if (!enabled) {
        console.warn('⚠️ Location services are disabled on the device');
        // We'll continue anyway, but log the warning
      }
    }

    const session: WorkoutSession = {
      id: `workout-${Date.now()}`,
      type: workoutType,
      startTime: new Date(),
      isActive: true,
      isPaused: false,
      metrics: {
        duration: 0,
        distance: 0,
        pace: 0,
        speed: 0,
        calories: 0,
        maxSpeed: 0,
      },
      route: [],
    };

    this.currentSession = session;
    this.lastUpdateTime = Date.now();
    this.routePoints = [];
    this.stepCount = 0;
    this.lastStepUpdateTime = Date.now();
    this.startTracking();
    this.notifyListeners();

    console.log('✅ Workout started successfully:', workoutType);
    return session;
  }

  // Pause the current workout
  pauseWorkout(): void {
    if (!this.currentSession?.isActive) return;

    // Create a new session object with isPaused set to true
    this.currentSession = {
      ...this.currentSession,
      isPaused: true
    };
    
    this.stopTracking();
    this.notifyListeners();
    console.log('⏸️ Workout paused');
  }

  // Resume the current workout
  resumeWorkout(): void {
    if (!this.currentSession?.isActive || !this.currentSession.isPaused) return;

    // Create a new session object with isPaused set to false
    this.currentSession = {
      ...this.currentSession,
      isPaused: false
    };
    
    this.lastUpdateTime = Date.now();
    this.lastStepUpdateTime = Date.now();
    this.startTracking();
    this.notifyListeners();
    console.log('▶️ Workout resumed');
  }

  // End the current workout
  async endWorkout(): Promise<WorkoutSummary | null> {
    if (!this.currentSession) {
      console.warn('No active workout session to end');
      return null;
    }

    console.log('🏁 Ending workout session:', this.currentSession.id);

    // Create a new session object with isActive set to false and endTime set
    this.currentSession = {
      ...this.currentSession,
      isActive: false,
      endTime: new Date()
    };
    
    this.stopTracking();

    // Generate summary with current session data
    const summary = await this.generateWorkoutSummary(this.currentSession);
    
    console.log('📊 Generated workout summary:', summary);

    // Only save workouts that are at least 3 minutes long
    if (summary.session.metrics.duration >= 180) {
      // Save workout to database and update user stats
      await this.saveWorkoutAndUpdateStats(this.currentSession, summary);
    } else {
      console.log('⏱️ Workout too short (< 3 minutes), not saving to database');
    }

    const completedSession = this.currentSession;
    this.currentSession = null;
    this.notifyListeners();

    console.log('✅ Workout completed successfully');
    return summary;
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

  // Start tracking workout metrics
  private startTracking(): void {
    if (this.intervalId) return;

    console.log('📊 Starting workout metrics tracking');

    // Update metrics every second for real-time updates
    this.intervalId = setInterval(() => {
      if (this.currentSession && this.currentSession.isActive && !this.currentSession.isPaused) {
        this.updateMetrics();
      }
    }, 1000);

    // Start location tracking for outdoor workouts
    if (!this.isIndoorWorkout && Platform.OS !== 'web') {
      this.startLocationTracking();
    } else if (this.isIndoorWorkout) {
      console.log('🏠 Indoor workout detected, using step-based distance estimation');
    }
  }

  // Stop tracking
  private stopTracking(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('📊 Stopped workout metrics tracking');
    }

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
      console.log('📍 Stopped location tracking');
    }
  }

  // Update workout metrics
  private updateMetrics(): void {
    if (!this.currentSession) return;

    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // seconds since last update
    this.lastUpdateTime = now;

    // Calculate total elapsed time (excluding paused time)
    const totalElapsed = (now - this.currentSession.startTime.getTime()) / 1000;
    
    // Create a new metrics object with updated duration
    const updatedMetrics: WorkoutMetrics = {
      ...this.currentSession.metrics,
      duration: totalElapsed,
      timestamp: new Date()
    };
    
    // For indoor workouts, estimate distance based on time and workout type
    if (this.isIndoorWorkout) {
      const updatedIndoorMetrics = this.updateIndoorWorkoutMetrics(deltaTime, updatedMetrics);
      updatedMetrics.distance = updatedIndoorMetrics.distance;
      updatedMetrics.speed = updatedIndoorMetrics.speed;
      updatedMetrics.pace = updatedIndoorMetrics.pace;
      updatedMetrics.maxSpeed = updatedIndoorMetrics.maxSpeed;
    }
    
    // Create a new session object with the updated metrics
    this.currentSession = {
      ...this.currentSession,
      metrics: updatedMetrics
    };
    
    // Notify listeners
    this.notifyListeners();

    // Debug logging every 5 seconds
    if (Math.floor(totalElapsed) % 5 === 0) {
      console.log('📊 Metrics update:', {
        duration: Math.round(this.currentSession.metrics.duration),
        distance: Math.round(this.currentSession.metrics.distance),
        speed: this.currentSession.metrics.speed.toFixed(1),
        pace: this.currentSession.metrics.pace.toFixed(2),
        routePoints: this.routePoints.length,
        isIndoor: this.isIndoorWorkout,
      });
    }
  }

  // Update indoor workout metrics using time-based estimation
  private updateIndoorWorkoutMetrics(deltaTime: number, currentMetrics: WorkoutMetrics): WorkoutMetrics {
    // Time since last step update in seconds
    const timeSinceLastStepUpdate = (Date.now() - this.lastStepUpdateTime) / 1000;
    
    // Only update every 0.5 seconds to avoid too frequent updates
    if (timeSinceLastStepUpdate < 0.5) return currentMetrics;
    
    this.lastStepUpdateTime = Date.now();
    
    // Estimate speed based on workout type
    let estimatedSpeed = 0; // km/h
    
    if (this.currentSession?.type === 'indoor_run') {
      // Average running speed: 8-12 km/h
      // Add some variation to make it look realistic
      const baseSpeed = 10; // km/h
      const variation = Math.sin(Date.now() / 5000) * 2; // Varies between -2 and 2 over time
      estimatedSpeed = baseSpeed + variation;
    } else if (this.currentSession?.type === 'indoor_walk') {
      // Average walking speed: 4-6 km/h
      const baseSpeed = 5; // km/h
      const variation = Math.sin(Date.now() / 8000) * 1; // Varies between -1 and 1 over time
      estimatedSpeed = baseSpeed + variation;
    }
    
    // Ensure speed is positive
    estimatedSpeed = Math.max(0, estimatedSpeed);
    
    // Calculate pace (min/km) from speed
    const pace = estimatedSpeed > 0 ? 60 / estimatedSpeed : 0;
    
    // Calculate distance increment for this update
    // speed (km/h) * time (h) = distance (km)
    // Convert to meters: * 1000
    const distanceIncrement = (estimatedSpeed * (deltaTime / 3600)) * 1000;
    
    // Create a new metrics object with updated values
    const updatedMetrics: WorkoutMetrics = {
      ...currentMetrics,
      speed: estimatedSpeed,
      pace: pace,
      distance: currentMetrics.distance + distanceIncrement,
      maxSpeed: Math.max(estimatedSpeed, currentMetrics.maxSpeed || 0)
    };
    
    console.log('🏠 Indoor workout update:', {
      estimatedSpeed: estimatedSpeed.toFixed(1),
      distanceIncrement: distanceIncrement.toFixed(2),
      totalDistance: updatedMetrics.distance.toFixed(2),
      deltaTime: deltaTime.toFixed(2),
    });
    
    return updatedMetrics;
  }

  // Start location tracking
  private async startLocationTracking(): Promise<void> {
    try {
      console.log('📍 Starting location tracking with high accuracy settings');
      
      // Get current location first to check if we can get a position
      try {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation
        });
        console.log('📍 Initial location acquired:', {
          lat: currentLocation.coords.latitude.toFixed(6),
          lng: currentLocation.coords.longitude.toFixed(6),
          accuracy: currentLocation.coords.accuracy ? `${currentLocation.coords.accuracy.toFixed(1)}m` : 'unknown'
        });
      } catch (locError) {
        console.error('❌ Failed to get initial location:', locError);
      }
      
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Update every second
          distanceInterval: 1, // Update every meter
        },
        (location) => {
          console.log('📍 handleLocationUpdate called with new location data');
          this.handleLocationUpdate(location);
        }
      );
      
      console.log('✅ Location tracking started successfully');
    } catch (error) {
      console.error('❌ Failed to start location tracking:', error);
    }
  }

  // Handle location updates
  private handleLocationUpdate(location: Location.LocationObject): void {
    console.log('📍 Location update received:', {
      lat: location.coords.latitude.toFixed(6),
      lng: location.coords.longitude.toFixed(6),
      accuracy: location.coords.accuracy ? `${location.coords.accuracy.toFixed(1)}m` : 'unknown',
      speed: location.coords.speed !== null ? `${location.coords.speed.toFixed(2)} m/s` : 'null',
      altitude: location.coords.altitude !== null ? `${location.coords.altitude.toFixed(1)}m` : 'null',
      timestamp: new Date(location.timestamp).toISOString()
    });
    
    if (!this.currentSession || !this.currentSession.isActive || this.currentSession.isPaused) {
      console.log('📍 Ignoring location update - workout inactive or paused');
      return;
    }

    const locationPoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: new Date(),
      altitude: location.coords.altitude || undefined,
      speed: location.coords.speed || undefined,
    };

    // Create a new array with the new point added
    const newRoutePoints = [...this.routePoints, locationPoint];
    this.routePoints = newRoutePoints;
    
    console.log(`📍 Added point to route, now have ${this.routePoints.length} points`);

    // Get current metrics to update
    let updatedMetrics = { ...this.currentSession.metrics };

    // Calculate distance if we have a previous location
    if (this.routePoints.length > 1) {
      const previousPoint = this.routePoints[this.routePoints.length - 2];
      console.log('📏 Calculating distance between:', {
        prev: {
          lat: previousPoint.latitude.toFixed(6),
          lng: previousPoint.longitude.toFixed(6)
        },
        current: {
          lat: locationPoint.latitude.toFixed(6),
          lng: locationPoint.longitude.toFixed(6)
        }
      });
      
      const distance = this.calculateDistance(
        previousPoint.latitude,
        previousPoint.longitude,
        locationPoint.latitude,
        locationPoint.longitude
      );
      
      console.log(`📏 Calculated distance: ${distance.toFixed(2)}m`);
      
      // Only add distance if it's reasonable (to filter out GPS jumps)
      if (distance < 50) { // Max 50 meters per second (180 km/h)
        updatedMetrics.distance += distance;
        console.log(`📏 Updated total distance: ${updatedMetrics.distance.toFixed(2)}m`);
      } else {
        console.log(`⚠️ Distance jump detected (${distance.toFixed(2)}m), ignoring`);
      }
    }

    // Update speed directly from GPS if available
    if (location.coords.speed !== null && location.coords.speed >= 0) {
      // Convert m/s to km/h for display
      const speedKmh = location.coords.speed * 3.6;
      console.log(`🏎️ Speed from GPS: ${location.coords.speed.toFixed(2)} m/s = ${speedKmh.toFixed(2)} km/h`);
      
      updatedMetrics.speed = speedKmh;
      
      // Update max speed
      if (speedKmh > (updatedMetrics.maxSpeed || 0)) {
        updatedMetrics.maxSpeed = speedKmh;
        console.log(`🏎️ New max speed: ${speedKmh.toFixed(2)} km/h`);
      }
      
      // Calculate pace (min/km) from speed
      if (speedKmh > 0) {
        // 60 / speed(km/h) = pace(min/km)
        const pace = 60 / speedKmh;
        updatedMetrics.pace = pace;
        console.log(`⏱️ Calculated pace: ${pace.toFixed(2)} min/km`);
      } else {
        console.log('⏱️ Speed is zero or negative, cannot calculate pace');
      }
    } else {
      console.log('⚠️ No speed data available from GPS');
    }

    // Create a new session object with updated metrics and route
    this.currentSession = {
      ...this.currentSession,
      metrics: updatedMetrics,
      route: [...newRoutePoints]
    };

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

  // Generate workout summary
  private async generateWorkoutSummary(session: WorkoutSession): Promise<WorkoutSummary> {
    console.log('📋 Generating workout summary for session:', session.id);
    
    // Ensure we have valid metrics
    const metrics = session.metrics || {
      duration: 0,
      distance: 0,
      pace: 0,
      speed: 0,
      calories: 0,
    };

    // Calculate achievements and XP
    const achievements: string[] = [];
    let xpGained = 0;

    // MINIMUM DURATION CHECK: Only award XP for workouts 3 minutes or longer
    const minimumDuration = 180; // 3 minutes in seconds
    if (metrics.duration < minimumDuration) {
      console.log(`⏱️ Workout too short (${Math.round(metrics.duration)}s < ${minimumDuration}s), no XP awarded`);
      
      return {
        session: {
          ...session,
          metrics: {
            ...metrics,
            duration: Math.max(0, metrics.duration),
            distance: Math.max(0, metrics.distance),
            pace: Math.max(0, metrics.pace),
            speed: Math.max(0, metrics.speed),
            calories: 0, // Set to 0 since we're not tracking calories
          }
        },
        achievements: [],
        xpGained: 0, // No XP for short workouts
        questsCompleted: 0,
        personalBests: [],
      };
    }

    // Distance achievements (only for meaningful distances)
    if (metrics.distance >= 1000) achievements.push('1K Completed');
    if (metrics.distance >= 2000) achievements.push('2K Warrior');
    if (metrics.distance >= 5000) achievements.push('5K Champion');
    if (metrics.distance >= 10000) achievements.push('10K Legend');

    // Duration achievements
    if (metrics.duration >= 600) achievements.push('10 Minute Runner');
    if (metrics.duration >= 1800) achievements.push('30 Minute Endurance');
    if (metrics.duration >= 3600) achievements.push('1 Hour Marathon');

    // Speed achievements
    if (metrics.maxSpeed && metrics.maxSpeed >= 12) achievements.push('Speed Demon');
    if (metrics.maxSpeed && metrics.maxSpeed >= 15) achievements.push('Lightning Runner');
    if (metrics.maxSpeed && metrics.maxSpeed >= 18) achievements.push('Sonic Boom');

    // IMPROVED XP CALCULATION - Based only on distance and duration
    const durationMinutes = metrics.duration / 60;
    
    // Base XP: 10 XP for completing a 3+ minute workout
    const baseXP = 10;
    
    // Duration XP: 2 XP per minute
    const durationXP = Math.round(durationMinutes * 2);
    
    // Distance bonus: 1 XP per 200m
    const distanceXP = Math.round(metrics.distance / 200);
    
    // Achievement bonus: 15 XP per achievement
    const achievementXP = achievements.length * 15;
    
    // Workout type multiplier
    let typeMultiplier = 1.0;
    switch (session.type) {
      case 'outdoor_run':
        typeMultiplier = 1.2; // 20% bonus for outdoor running
        break;
      case 'indoor_run':
        typeMultiplier = 1.1; // 10% bonus for indoor running
        break;
      case 'outdoor_walk':
        typeMultiplier = 1.0; // Base rate for walking
        break;
      case 'indoor_walk':
        typeMultiplier = 0.9; // 10% reduction for indoor walking
        break;
    }
    
    // Calculate total XP with type multiplier
    const rawXP = baseXP + durationXP + distanceXP + achievementXP;
    xpGained = Math.round(rawXP * typeMultiplier);
    
    // Cap XP to prevent excessive gains (max 100 XP per workout)
    xpGained = Math.min(xpGained, 100);

    console.log('🧮 XP Calculation:', {
      duration: `${durationMinutes.toFixed(1)} min`,
      baseXP,
      durationXP,
      distanceXP,
      achievementXP,
      typeMultiplier,
      rawXP,
      finalXP: xpGained,
      achievements: achievements.length
    });

    // Calculate calories (simple estimate based on distance)
    // Average calorie burn is roughly 60-70 calories per km for running
    const estimatedCalories = Math.round(metrics.distance / 1000 * 65);

    const summary: WorkoutSummary = {
      session: {
        ...session,
        metrics: {
          ...metrics,
          // Ensure all metrics have valid values
          duration: Math.max(0, metrics.duration),
          distance: Math.max(0, metrics.distance),
          pace: Math.max(0, metrics.pace),
          speed: Math.max(0, metrics.speed),
          calories: estimatedCalories,
          maxSpeed: metrics.maxSpeed || 0,
        }
      },
      achievements,
      xpGained,
      questsCompleted: Math.floor(metrics.distance / 1000), // 1 quest per 1km
      personalBests: [], // Would compare with historical data
    };

    console.log('✅ Generated summary:', {
      duration: `${(summary.session.metrics.duration / 60).toFixed(1)} min`,
      distance: `${(summary.session.metrics.distance / 1000).toFixed(2)} km`,
      xpGained: summary.xpGained,
      achievements: summary.achievements.length,
      meetsMinimum: summary.session.metrics.duration >= minimumDuration
    });

    return summary;
  }

  // Save workout to database and update user stats
  private async saveWorkoutAndUpdateStats(session: WorkoutSession, summary: WorkoutSummary): Promise<void> {
    try {
      console.log('💾 Saving workout and updating user stats');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user, skipping database save');
        return;
      }

      // Only save to database and update stats if workout meets minimum duration
      if (summary.xpGained === 0) {
        console.log('⏱️ Workout too short, skipping database save and stat updates');
        return;
      }

      // Save workout session to database
      const { data: workoutData, error: workoutError } = await supabase
        .rpc('save_workout_session', {
          p_user_id: user.id,
          p_start_time: session.startTime.toISOString(),
          p_end_time: session.endTime?.toISOString() || new Date().toISOString(),
          p_workout_type: session.type,
          p_total_distance: Math.round(session.metrics.distance),
          p_total_duration: Math.round(session.metrics.duration),
          p_average_pace: session.metrics.pace || null,
          p_max_speed: session.metrics.maxSpeed || null,
          p_calories_burned: session.metrics.calories
        });

      if (workoutError) {
        console.error('Error saving workout session:', workoutError);
      } else {
        console.log('✅ Workout session saved to database');
      }

      // Update user stats with XP and workout data
      const { data: currentStats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsError) {
        console.error('Error fetching current stats:', statsError);
        return;
      }

      if (currentStats) {
        // Calculate new totals
        const newTotalDistance = currentStats.total_distance + Math.round(session.metrics.distance);
        const newTotalRuns = currentStats.total_runs + 1;
        const newTotalTime = currentStats.total_time + Math.round(session.metrics.duration);
        const newExperience = currentStats.experience + summary.xpGained;

        // Check for level up
        const { newLevel, skillPointsGained } = this.calculateLevelUp(currentStats.level, newExperience);

        // Update user stats
        const { error: updateError } = await supabase
          .from('user_stats')
          .update({
            total_distance: newTotalDistance,
            total_runs: newTotalRuns,
            total_time: newTotalTime,
            experience: newExperience,
            level: newLevel,
            skill_points: currentStats.skill_points + skillPointsGained,
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating user stats:', updateError);
        } else {
          console.log('✅ User stats updated:', {
            xpGained: summary.xpGained,
            newLevel: newLevel,
            skillPointsGained: skillPointsGained,
            totalDistance: newTotalDistance,
            totalRuns: newTotalRuns
          });
        }

        // Check for new achievements
        try {
          // First check general achievements
          const { data: generalAchievements, error: generalError } = await supabase
            .rpc('check_and_award_achievements', { p_user_id: user.id });

          if (generalError) {
            console.error('Error checking general achievements:', generalError);
          } else if (generalAchievements && generalAchievements.length > 0) {
            console.log('🏆 New general achievements unlocked:', generalAchievements.length);
          }
          
          // Then check single-run achievements
          const { data: singleRunAchievements, error: singleRunError } = await supabase
            .rpc('check_single_run_achievements', { 
              p_user_id: user.id, 
              p_distance: Math.round(session.metrics.distance) 
            });

          if (singleRunError) {
            console.error('Error checking single-run achievements:', singleRunError);
          } else if (singleRunAchievements && singleRunAchievements.length > 0) {
            console.log('🏆 New single-run achievements unlocked:', singleRunAchievements.length);
          }
          
        } catch (achievementError) {
          console.error('Error in achievement check:', achievementError);
        }
      }

    } catch (error) {
      console.error('Error saving workout and updating stats:', error);
    }
  }

  // Calculate level progression
  private calculateLevelUp(currentLevel: number, newExperience: number): { newLevel: number; skillPointsGained: number } {
    let level = currentLevel;
    let skillPointsGained = 0;

    // Experience required for each level (exponential growth)
    const getExpForLevel = (lvl: number) => Math.floor(100 * Math.pow(1.5, lvl - 1));

    while (true) {
      const expRequired = getExpForLevel(level + 1);
      if (newExperience >= expRequired) {
        level++;
        skillPointsGained += 2; // 2 skill points per level
      } else {
        break;
      }
    }

    return { newLevel: level, skillPointsGained };
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

export default WorkoutService;