import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MapPin, Zap, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { WorkoutSession, RealTimeMetrics } from '@/types/health';

interface WorkoutDisplayProps {
  workout: WorkoutSession | null;
  metrics: RealTimeMetrics | null;
}

export default function WorkoutDisplay({ workout, metrics }: WorkoutDisplayProps) {
  if (!workout) {
    return null;
  }

  const formatTime = (startTime: Date) => {
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)}km`;
    }
    return `${meters.toFixed(0)}m`;
  };

  const formatPace = (pace: number) => {
    if (!pace || pace === Infinity) return '--:--';
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  const formatHeartRate = (bpm: number) => {
    return `${Math.round(bpm)} BPM`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary.skyBlue, Colors.primary.deepNimbus]}
        style={styles.header}
      >
        <Heart size={24} color={Colors.text.primary} />
        <Text style={styles.headerTitle}>LIVE WORKOUT</Text>
        <View style={styles.workoutStatus}>
          <View style={[styles.statusDot, { backgroundColor: workout.isActive ? '#00ff00' : '#ff0000' }]} />
          <Text style={styles.statusText}>{workout.isActive ? 'ACTIVE' : 'COMPLETED'}</Text>
        </View>
      </LinearGradient>

      <View style={styles.metricsGrid}>
        {/* Duration */}
        <View style={styles.metricCard}>
          <Clock size={20} color={Colors.text.accent} />
          <Text style={styles.metricValue}>{formatTime(workout.startTime)}</Text>
          <Text style={styles.metricLabel}>TIME</Text>
        </View>

        {/* Distance */}
        <View style={styles.metricCard}>
          <MapPin size={20} color={Colors.text.accent} />
          <Text style={styles.metricValue}>
            {formatDistance(metrics?.distance || workout.totalDistance)}
          </Text>
          <Text style={styles.metricLabel}>DISTANCE</Text>
        </View>

        {/* Heart Rate */}
        <View style={styles.metricCard}>
          <Heart size={20} color={Colors.accent.sunset} />
          <Text style={styles.metricValue}>
            {metrics?.heartRate ? formatHeartRate(metrics.heartRate) : '--'}
          </Text>
          <Text style={styles.metricLabel}>HEART RATE</Text>
        </View>

        {/* Pace */}
        <View style={styles.metricCard}>
          <Zap size={20} color={Colors.text.accent} />
          <Text style={styles.metricValue}>
            {formatPace(metrics?.pace || 0)}
          </Text>
          <Text style={styles.metricLabel}>PACE</Text>
        </View>
      </View>

      {workout.isActive && (
        <View style={styles.liveIndicator}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveText}>LIVE DATA FROM APPLE WATCH</Text>
        </View>
      )}

      {metrics && (
        <View style={styles.lastUpdate}>
          <Text style={styles.lastUpdateText}>
            Last update: {metrics.timestamp.toLocaleTimeString()}
          </Text>
        </View>
      )}

      {/* Debug Information */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text style={styles.debugText}>
          Workout ID: {workout.id}{'\n'}
          Type: {workout.type}{'\n'}
          Active: {workout.isActive ? 'Yes' : 'No'}{'\n'}
          Start: {workout.startTime.toLocaleTimeString()}{'\n'}
          Metrics Count: {workout.metrics.length}{'\n'}
          Has Heart Rate: {metrics?.heartRate ? 'Yes' : 'No'}{'\n'}
          Has Distance: {metrics?.distance ? 'Yes' : 'No'}{'\n'}
          Raw Distance: {metrics?.distance || 'none'}{'\n'}
          Raw HR: {metrics?.heartRate || 'none'}
        </Text>
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
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  workoutStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 80,
    backgroundColor: Colors.background.overcast,
    borderWidth: 2,
    borderColor: Colors.card.border,
    padding: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: Colors.text.primary,
    marginVertical: 8,
    textAlign: 'center',
  },
  metricLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: Colors.background.twilight,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff00',
    marginRight: 8,
  },
  liveText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.primary,
  },
  lastUpdate: {
    padding: 8,
    alignItems: 'center',
  },
  lastUpdateText: {
    fontFamily: 'PressStart2P',
    fontSize: 7,
    color: Colors.text.muted,
  },
  debugContainer: {
    backgroundColor: Colors.background.storm,
    borderWidth: 1,
    borderColor: Colors.card.border,
    padding: 8,
    margin: 8,
  },
  debugTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.accent,
    marginBottom: 4,
  },
  debugText: {
    fontFamily: 'PressStart2P',
    fontSize: 6,
    color: Colors.text.muted,
    lineHeight: 10,
  },
});