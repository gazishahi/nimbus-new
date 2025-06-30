import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Shield, Watch } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import PixelButton from './PixelButton';
import { useHealthKit } from '@/hooks/useHealthKit';

interface HealthKitSetupProps {
  onSetupComplete?: () => void;
}

export default function HealthKitSetup({ onSetupComplete }: HealthKitSetupProps) {
  const { isInitialized, isInitializing, initializeHealthKit, error } = useHealthKit();
  const [hasAttemptedSetup, setHasAttemptedSetup] = useState(false);

  const handleInitialize = async () => {
    setHasAttemptedSetup(true);
    
    try {
      const success = await initializeHealthKit();
      
      if (success) {
        Alert.alert(
          '✅ HealthKit Connected!',
          'Great! HealthKit permissions are granted. Start a running workout on your Apple Watch to test the connection. You should receive a notification within 30 seconds.',
          [
            {
              text: 'Test it now!',
              onPress: onSetupComplete,
            },
          ]
        );
      } else {
        Alert.alert(
          '❌ Permission Required',
          'HealthKit permissions are needed for workout detection. Please grant ALL health permissions when prompted, or check your Health app settings.',
          [
            {
              text: 'Try Again',
              onPress: () => setHasAttemptedSetup(false),
            },
            {
              text: 'Open Settings',
              onPress: () => {
                // User can manually check settings
                setHasAttemptedSetup(false);
              },
            },
          ]
        );
      }
    } catch (err) {
      console.error('HealthKit setup error:', err);
      Alert.alert(
        '❌ Setup Error',
        'An error occurred during setup. Make sure you\'re on iOS and try again.',
        [
          {
            text: 'Try Again',
            onPress: () => setHasAttemptedSetup(false),
          },
        ]
      );
    }
  };

  if (isInitialized) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary.skyBlue, Colors.primary.deepNimbus]}
          style={styles.header}
        >
          <Heart size={24} color={Colors.text.primary} />
          <Text style={styles.headerTitle}>HEALTHKIT CONNECTED</Text>
          <Shield size={20} color="#00ff00" />
        </LinearGradient>
        
        <View style={styles.content}>
          <Text style={styles.successText}>
            ✅ Ready to detect Apple Watch workouts!
          </Text>
          <Text style={styles.instructionText}>
            Start a running workout on your Apple Watch and Nimbus will automatically detect it and show live data.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary.skyBlue, Colors.primary.deepNimbus]}
        style={styles.header}
      >
        <Watch size={24} color={Colors.text.primary} />
        <Text style={styles.headerTitle}>APPLE WATCH SETUP</Text>
      </LinearGradient>
      
      <View style={styles.content}>
        <Text style={styles.title}>Connect Your Apple Watch</Text>
        
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Auto-detect running workouts</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Real-time heart rate & pace</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Live distance tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Instant workout notifications</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Setup Instructions:</Text>
          <Text style={styles.instructionText}>
            1. Tap "Connect HealthKit" below{'\n'}
            2. When iOS asks for permissions, tap "Allow" for ALL health data types{'\n'}
            3. Don't tap "Don't Allow" - this will break the connection{'\n'}
            4. Start a running workout on your Apple Watch{'\n'}
            5. You should get a notification within 30 seconds{'\n'}
            6. Open Nimbus to see live data!
          </Text>
        </View>

        <PixelButton
          title={isInitializing ? "CONNECTING..." : "CONNECT HEALTHKIT"}
          onPress={handleInitialize}
          variant="primary"
          size="large"
          disabled={isInitializing}
          style={styles.setupButton}
        />

        {hasAttemptedSetup && !isInitialized && !isInitializing && (
          <View style={styles.troubleshootContainer}>
            <Text style={styles.retryText}>
              Having trouble? Check these:
            </Text>
            <Text style={styles.troubleshootText}>
              • You're on an iPhone (not simulator){'\n'}
              • You tapped "Allow" for ALL health data{'\n'}
              • You didn't tap "Don't Allow" on any permission{'\n'}
              • Your Apple Watch is paired and syncing{'\n'}
              • Go to Settings > Privacy & Security > Health > Nimbus{'\n'}
              • Turn ON all data types if any are disabled
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card.background,
    borderWidth: 3,
    borderColor: Colors.card.border,
    marginVertical: 8,
    shadowOffset: { width: 3, height: 3 },
    shadowColor: Colors.card.shadow,
    shadowOpacity: 0.5,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  headerTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.primary,
  },
  content: {
    padding: 20,
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  featureList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureBullet: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.primary.skyBlue,
    marginRight: 8,
    marginTop: 2,
  },
  featureText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 16,
  },
  instructions: {
    backgroundColor: Colors.background.overcast,
    borderWidth: 2,
    borderColor: Colors.card.border,
    padding: 16,
    marginBottom: 20,
  },
  instructionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.accent,
    marginBottom: 12,
  },
  instructionText: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: Colors.text.secondary,
    lineHeight: 14,
  },
  setupButton: {
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: Colors.accent.sunset + '20',
    borderWidth: 2,
    borderColor: Colors.accent.sunset,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: Colors.accent.sunset,
    textAlign: 'center',
  },
  successText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: '#00ff00',
    textAlign: 'center',
    marginBottom: 16,
  },
  troubleshootContainer: {
    backgroundColor: Colors.background.overcast,
    borderWidth: 1,
    borderColor: Colors.card.border,
    padding: 12,
    marginTop: 12,
  },
  retryText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.accent,
    textAlign: 'center',
    marginBottom: 8,
  },
  troubleshootText: {
    fontFamily: 'PressStart2P',
    fontSize: 7,
    color: Colors.text.muted,
    lineHeight: 12,
  },
});