import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Square, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

interface WorkoutControlsProps {
  isActive: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  disabled?: boolean;
}

export default function WorkoutControls({
  isActive,
  isPaused,
  onPause,
  onResume,
  onEnd,
  disabled = false,
}: WorkoutControlsProps) {
  const handleEndWorkout = () => {
    Alert.alert(
      'End Workout',
      'Are you sure you want to end this workout? Your progress will be saved.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Workout',
          style: 'destructive',
          onPress: onEnd,
        },
      ]
    );
  };

  if (!isActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary.skyBlue, Colors.primary.deepNimbus]}
        style={styles.controlsPanel}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.title}>WORKOUT CONTROLS</Text>
        
        <View style={styles.controlsRow}>
          {/* Pause/Resume Button */}
          <TouchableOpacity
            style={[styles.controlButton, styles.primaryButton, disabled && styles.disabledButton]}
            onPress={isPaused ? onResume : onPause}
            disabled={disabled}
          >
            <LinearGradient
              colors={isPaused ? [Colors.status.success, '#059669'] : [Colors.status.warning, '#d97706']}
              style={styles.buttonGradient}
            >
              {isPaused ? (
                <Play size={24} color={Colors.text.primary} />
              ) : (
                <Pause size={24} color={Colors.text.primary} />
              )}
              <Text style={styles.buttonText}>
                {isPaused ? 'RESUME' : 'PAUSE'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* End Workout Button */}
          <TouchableOpacity
            style={[styles.controlButton, styles.secondaryButton, disabled && styles.disabledButton]}
            onPress={handleEndWorkout}
            disabled={disabled}
          >
            <LinearGradient
              colors={[Colors.status.error, '#b91c1c']}
              style={styles.buttonGradient}
            >
              <Square size={24} color={Colors.text.primary} />
              <Text style={styles.buttonText}>END</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* More Options Button */}
          <TouchableOpacity
            style={[styles.controlButton, styles.tertiaryButton, disabled && styles.disabledButton]}
            onPress={() => {
              // Could open a modal with more options
              Alert.alert('More Options', 'Additional workout options coming soon!');
            }}
            disabled={disabled}
          >
            <View style={styles.tertiaryButtonContent}>
              <MoreHorizontal size={24} color={Colors.text.secondary} />
            </View>
          </TouchableOpacity>
        </View>

        {isPaused && (
          <View style={styles.pausedIndicator}>
            <Text style={styles.pausedText}>⏸️ WORKOUT PAUSED</Text>
            <Text style={styles.pausedSubtext}>Tap RESUME to continue tracking</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  controlsPanel: {
    padding: 20,
    borderWidth: 3,
    borderColor: Colors.primary.skyBlue,
    shadowOffset: { width: 3, height: 3 },
    shadowColor: Colors.card.shadow,
    shadowOpacity: 0.5,
    elevation: 5,
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  controlButton: {
    flex: 1,
    maxWidth: 120,
    borderWidth: 2,
    borderColor: Colors.card.border,
  },
  primaryButton: {
    borderColor: Colors.status.success,
  },
  secondaryButton: {
    borderColor: Colors.status.error,
  },
  tertiaryButton: {
    borderColor: Colors.card.border,
    backgroundColor: Colors.background.overcast,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  tertiaryButtonContent: {
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
  },
  pausedIndicator: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 2,
    borderColor: Colors.status.warning,
    alignItems: 'center',
  },
  pausedText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.status.warning,
    marginBottom: 4,
  },
  pausedSubtext: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
  },
});