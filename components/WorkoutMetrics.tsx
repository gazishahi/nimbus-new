import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, MapPin, Zap, TrendingUp, Activity } from 'lucide-react-native';
import { WorkoutMetrics as WorkoutMetricsType } from '@/types/workout';
import { Colors } from '@/constants/Colors';

interface WorkoutMetricsProps {
  metrics: WorkoutMetricsType | null | undefined;
  isActive: boolean;
  isPaused: boolean;
}

// Default metrics to prevent crashes
const defaultMetrics: WorkoutMetricsType = {
  duration: 0,
  distance: 0,
  pace: 0,
  speed: 0,
  calories: 0,
  maxSpeed: 0,
  elevationGain: 0,
};

export default function WorkoutMetrics({ metrics, isActive, isPaused }: WorkoutMetricsProps) {
  // Use default metrics if none provided, or merge with provided metrics
  const [displayMetrics, setDisplayMetrics] = useState<WorkoutMetricsType>(() => {
    if (!metrics) return defaultMetrics;
    return { ...defaultMetrics, ...metrics };
  });

  // Update display metrics when props change
  useEffect(() => {
    if (metrics) {
      setDisplayMetrics(prevMetrics => ({ ...defaultMetrics, ...metrics }));
    } else {
      setDisplayMetrics(defaultMetrics);
    }
  }, [metrics]);

  const formatTime = (seconds: number): string => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = Math.floor(safeSeconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): string => {
    const safeMeters = Math.max(0, Number(meters) || 0);
    if (safeMeters >= 1000) {
      return `${(safeMeters / 1000).toFixed(2)}km`;
    }
    return `${safeMeters.toFixed(0)}m`;
  };

  const formatPace = (pace: number): string => {
    const safePace = Number(pace) || 0;
    if (safePace === 0 || !isFinite(safePace)) return '--:--';
    const minutes = Math.floor(safePace);
    const seconds = Math.round((safePace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatSpeed = (speed: number): string => {
    const safeSpeed = Math.max(0, Number(speed) || 0);
    return `${safeSpeed.toFixed(1)} km/h`;
  };

  // Ensure we have valid metrics before rendering
  const safeMetrics = displayMetrics || defaultMetrics;

  // Check if we should show secondary metrics (explicitly check for values > 0)
  const hasMaxSpeed = safeMetrics.maxSpeed && Number(safeMetrics.maxSpeed) > 0;
  const showSecondaryMetrics = hasMaxSpeed;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.card.background, Colors.background.overcast]}
        style={styles.metricsPanel}
      >
        <View style={styles.header}>
          <Text style={styles.title}>LIVE METRICS</Text>
          <View style={[styles.statusIndicator, isPaused && styles.pausedIndicator]}>
            <View style={[styles.statusDot, isPaused && styles.pausedDot]} />
            <Text style={styles.statusText}>
              {isPaused ? 'PAUSED' : isActive ? 'ACTIVE' : 'STOPPED'}
            </Text>
          </View>
        </View>

        {/* Primary Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Duration */}
          <View style={styles.metricCard}>
            <Clock size={20} color={Colors.text.accent} />
            <Text style={styles.metricValue}>
              {formatTime(safeMetrics.duration)}
            </Text>
            <Text style={styles.metricLabel}>TIME</Text>
          </View>

          {/* Distance */}
          <View style={styles.metricCard}>
            <MapPin size={20} color={Colors.text.accent} />
            <Text style={styles.metricValue}>
              {formatDistance(safeMetrics.distance)}
            </Text>
            <Text style={styles.metricLabel}>DISTANCE</Text>
          </View>

          {/* Pace */}
          <View style={styles.metricCard}>
            <Zap size={20} color={Colors.text.accent} />
            <Text style={styles.metricValue}>
              {formatPace(safeMetrics.pace)}
            </Text>
            <Text style={styles.metricLabel}>PACE</Text>
          </View>

          {/* Speed */}
          <View style={styles.metricCard}>
            <TrendingUp size={20} color={Colors.text.accent} />
            <Text style={styles.metricValue}>
              {formatSpeed(safeMetrics.speed)}
            </Text>
            <Text style={styles.metricLabel}>SPEED</Text>
          </View>
        </View>

        {/* Secondary Metrics - Fixed conditional rendering */}
        {showSecondaryMetrics ? (
          <View style={styles.secondaryMetrics}>
            <Text style={styles.secondaryTitle}>PERFORMANCE</Text>
            <View style={styles.secondaryGrid}>
              {hasMaxSpeed && (
                <View style={styles.secondaryMetric}>
                  <Activity size={16} color={Colors.text.accent} />
                  <Text style={styles.secondaryValue}>
                    {formatSpeed(safeMetrics.maxSpeed)}
                  </Text>
                  <Text style={styles.secondaryLabel}>MAX SPEED</Text>
                </View>
              )}
            </View>
          </View>
        ) : null}

        {/* Real-time Update Indicator */}
        <View style={styles.updateIndicator}>
          <View style={[styles.updateDot, isActive && !isPaused && styles.updateDotActive]} />
          <Text style={styles.updateText}>
            {isActive && !isPaused ? 'UPDATING LIVE' : 'TRACKING PAUSED'}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  metricsPanel: {
    padding: 20,
    borderWidth: 3,
    borderColor: Colors.card.border,
    shadowOffset: { width: 3, height: 3 },
    shadowColor: Colors.card.shadow,
    shadowOpacity: 0.5,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.accent,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pausedIndicator: {
    opacity: 0.7,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff00',
  },
  pausedDot: {
    backgroundColor: Colors.status.warning,
  },
  statusText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: Colors.background.overcast,
    borderWidth: 2,
    borderColor: Colors.background.storm,
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
  secondaryMetrics: {
    marginBottom: 16,
  },
  secondaryTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.accent,
    textAlign: 'center',
    marginBottom: 12,
  },
  secondaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  secondaryMetric: {
    alignItems: 'center',
    flex: 1,
  },
  secondaryValue: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.primary,
    marginVertical: 6,
  },
  secondaryLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 7,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  updateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.background.storm,
  },
  updateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.text.muted,
    marginRight: 8,
  },
  updateDotActive: {
    backgroundColor: '#00ff00',
  },
  updateText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.muted,
  },
});