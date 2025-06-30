# Nimbus - Real-time Workout Tracking App

A beautiful, pixel-art styled fitness tracking app that focuses on accurate real-time tracking of distance, speed, and duration for running and walking workouts.

## ✨ Features

- **Real-time Workout Tracking**: Accurate GPS-based tracking of distance, speed, and duration
- **Multiple Workout Types**: Support for outdoor/indoor running and walking
- **Live Metrics Display**: Beautiful real-time display of workout metrics
- **Workout Summary**: Detailed post-workout summary with achievements and XP
- **Leaderboard**: Compare your performance with other runners
- **Goals & Achievements**: Track your progress and earn achievements
- **Character Progression**: Level up your runner and earn skill points

## 🏃‍♂️ Technical Implementation

### Core Components

- **`WorkoutService`** - Singleton service that handles all workout tracking
- **`HealthKitService`** - Service for iOS HealthKit integration (simulated in this version)
- **`useWorkout`** - React hook for easy workout integration in components
- **`WorkoutMetrics`** - Real-time workout data display component

### Key Features

#### Real-time Tracking
- Uses `expo-location` for accurate GPS tracking
- Updates metrics every second
- Calculates distance using the Haversine formula
- Derives pace from speed measurements

#### Minimum Duration Check
- Only saves workouts and awards XP for sessions longer than 3 minutes
- Prevents database clutter from accidental or very short tracking sessions

#### XP Calculation
- Base XP: 10 XP for completing a 3+ minute workout
- Duration XP: 2 XP per minute
- Distance XP: 1 XP per 200m
- Achievement XP: 15 XP per achievement
- Workout type multiplier: 1.2x for outdoor running, 1.1x for indoor running
- Maximum cap of 100 XP per workout

## 📱 Setup Instructions

1. **Clone and Install**
   ```bash
   git clone <repo-url>
   cd nimbus-fitness
   npm install
   ```

2. **Run the App**
   ```bash
   npm run dev
   ```

3. **Grant Permissions**
   - Allow location permissions when prompted
   - For best results, use the app outdoors with good GPS signal

## 🔧 HealthKit Integration

This version includes a simulated HealthKit integration. For full HealthKit integration on iOS:

1. Add the HealthKit dependency:
   ```bash
   npm install @kingstinct/react-native-healthkit
   ```

2. Update app.json with HealthKit permissions:
   ```json
   {
     "ios": {
       "infoPlist": {
         "UIBackgroundModes": ["healthkit"],
         "NSHealthShareUsageDescription": "Nimbus Fitness uses HealthKit to track your workouts and save your fitness data.",
         "NSHealthUpdateUsageDescription": "Nimbus Fitness saves your workout data to HealthKit for a comprehensive view of your fitness."
       },
       "entitlements": {
         "com.apple.developer.healthkit": true,
         "com.apple.developer.healthkit.background-delivery": true
       }
     },
     "plugins": [
       [
         "@kingstinct/react-native-healthkit",
         {
           "NSHealthShareUsageDescription": "Nimbus Fitness uses HealthKit to track your workouts and save your fitness data.",
           "NSHealthUpdateUsageDescription": "Nimbus Fitness saves your workout data to HealthKit for a comprehensive view of your fitness.",
           "background": true
         }
       ]
     ]
   }
   ```

3. Create a development build:
   ```bash
   npx expo prebuild
   npx expo run:ios
   ```

## 🏗 Architecture

### Service Layer
- **WorkoutService**: Singleton pattern for managing workout state
- **HealthKitService**: Handles HealthKit integration (simulated in this version)
- **Location-based tracking**: Uses expo-location for accurate GPS tracking

### UI Components
- **Modular design**: Separate components for workout types, metrics, and controls
- **Pixel art styling**: Consistent with app's retro aesthetic
- **Real-time updates**: Automatic UI refresh during workouts

### State Management
- **React hooks**: Custom hooks for workout integration
- **Local state**: Component-level state for UI interactions
- **Event propagation**: Workout events bubble up through listeners

## 🚀 Usage Examples

### Basic Workout Tracking
```tsx
import { useWorkout } from '@/hooks/useWorkout';
import WorkoutMetrics from '@/components/WorkoutMetrics';

function MyComponent() {
  const { currentSession, isActive, startWorkout, endWorkout } = useWorkout();
  
  return (
    <View>
      {isActive && currentSession && (
        <WorkoutMetrics 
          metrics={currentSession.metrics}
          isActive={isActive}
          isPaused={false}
        />
      )}
      <Button 
        title={isActive ? "End Workout" : "Start Workout"} 
        onPress={isActive ? endWorkout : () => startWorkout('outdoor_run')}
      />
    </View>
  );
}
```

## 🔒 Privacy & Permissions

- **Location permissions**: Required for accurate distance and speed tracking
- **HealthKit permissions**: Optional, for saving workout data to Apple Health
- **Minimal data collection**: Only tracks what's necessary for workout functionality
- **Local processing**: All calculations happen on-device

## 🧪 Testing

### Test Scenarios
1. **Permission Flow**: Test location permission granting
2. **Workout Tracking**: Start, pause, resume, and end workouts
3. **Real-time Data**: Verify metrics update during active workouts
4. **Edge Cases**: Test with poor GPS connectivity, background operation, etc.

## 🐛 Troubleshooting

### Common Issues

1. **"Location permission required"**
   - Go to Settings > Privacy & Security > Location Services > Nimbus Fitness
   - Enable location access

2. **"Inaccurate distance tracking"**
   - Ensure you have a clear view of the sky for better GPS signal
   - Wait a few seconds after starting a workout for GPS to stabilize

3. **"Workout not saving"**
   - Workouts under 3 minutes are not saved by design
   - Check your internet connection for database saving

## 📚 Resources

- [Expo Location Documentation](https://docs.expo.dev/versions/latest/sdk/location/)
- [React Native HealthKit](https://github.com/kingstinct/react-native-healthkit)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)