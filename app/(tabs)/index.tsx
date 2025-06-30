import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Alert, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, MapPin, Clock, Zap, TrendingUp, Info, X } from 'lucide-react-native';
import { usePixelFont } from '@/hooks/usePixelFont';
import { useWorkout } from '@/hooks/useWorkout';
import { Colors } from '@/constants/Colors';
import PixelButton from '@/components/PixelButton';
import WorkoutTypeSelector from '@/components/WorkoutTypeSelector';
import WorkoutMetrics from '@/components/WorkoutMetrics';
import WorkoutControls from '@/components/WorkoutControls';
import { WorkoutType } from '@/types/workout';

export default function RunScreen() {
  const fontsLoaded = usePixelFont();
  const { 
    currentSession, 
    isActive, 
    isPaused, 
    startWorkout, 
    pauseWorkout, 
    resumeWorkout, 
    endWorkout, 
    error 
  } = useWorkout();
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<WorkoutType['id']>('outdoor_run');
  const [workoutSummary, setWorkoutSummary] = useState<any>(null);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);

  useEffect(() => {
    if (error) {
      Alert.alert('Workout Error', error);
    }
  }, [error]);

  const handleStartWorkout = async () => {
    try {
      await startWorkout(selectedWorkoutType);
    } catch (err) {
      console.error('Failed to start workout:', err);
    }
  };

  const handleEndWorkout = async () => {
    const summary = await endWorkout();
    if (summary) {
      setWorkoutSummary(summary);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>NIMBUS</Text>
          <Text style={styles.subtitle}>Real-time Workout Tracking</Text>
        </View>

        {!isActive ? (
          <>
            {/* Workout Type Selection */}
            <WorkoutTypeSelector 
              onSelectType={setSelectedWorkoutType} 
              disabled={isActive}
            />

            {/* Start Workout */}
            <View style={styles.startSection}>
              <LinearGradient
                colors={[Colors.primary.skyBlue, Colors.primary.deepNimbus]}
                style={styles.startPanel}
              >
                <Play size={48} color={Colors.text.primary} />
                <Text style={styles.startTitle}>START WORKOUT</Text>
                <Text style={styles.startSubtitle}>
                  Track your {selectedWorkoutType.replace('_', ' ')} with real-time metrics
                </Text>
                <PixelButton
                  title="BEGIN TRACKING"
                  onPress={handleStartWorkout}
                  variant="success"
                  size="large"
                  style={styles.startButton}
                />
              </LinearGradient>
            </View>

            {/* Info Button */}
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => setShowFeaturesModal(true)}
            >
              <Info size={20} color={Colors.text.accent} />
              <Text style={styles.infoButtonText}>View Features</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Active Workout Display */}
            <WorkoutMetrics 
              metrics={currentSession?.metrics}
              isActive={isActive}
              isPaused={isPaused}
            />

            {/* Workout Controls */}
            <WorkoutControls
              isActive={isActive}
              isPaused={isPaused}
              onPause={pauseWorkout}
              onResume={resumeWorkout}
              onEnd={handleEndWorkout}
            />

            {/* Performance Stats */}
            <View style={styles.performanceSection}>
              <Text style={styles.sectionTitle}>PERFORMANCE</Text>
              <View style={styles.performanceGrid}>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceLabel}>AVG SPEED</Text>
                  <Text style={styles.performanceValue}>
                    {currentSession?.metrics.speed ? currentSession.metrics.speed.toFixed(1) : '0.0'} km/h
                  </Text>
                </View>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceLabel}>MAX SPEED</Text>
                  <Text style={styles.performanceValue}>
                    {currentSession?.metrics.maxSpeed ? currentSession.metrics.maxSpeed.toFixed(1) : '0.0'} km/h
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Workout Summary (if available) */}
        {workoutSummary && !isActive && (
          <View style={styles.summarySection}>
            <LinearGradient
              colors={[Colors.primary.deepNimbus, Colors.background.overcast]}
              style={styles.summaryPanel}
            >
              <Text style={styles.summaryTitle}>WORKOUT COMPLETE!</Text>
              
              <View style={styles.summaryStats}>
                <View style={styles.summaryStat}>
                  <MapPin size={16} color={Colors.text.accent} />
                  <Text style={styles.summaryValue}>
                    {(workoutSummary.session.metrics.distance / 1000).toFixed(2)}km
                  </Text>
                  <Text style={styles.summaryLabel}>DISTANCE</Text>
                </View>
                
                <View style={styles.summaryStat}>
                  <Clock size={16} color={Colors.text.accent} />
                  <Text style={styles.summaryValue}>
                    {formatDuration(workoutSummary.session.metrics.duration)}
                  </Text>
                  <Text style={styles.summaryLabel}>TIME</Text>
                </View>
                
                <View style={styles.summaryStat}>
                  <Zap size={16} color={Colors.text.accent} />
                  <Text style={styles.summaryValue}>
                    {workoutSummary.session.metrics.pace ? formatDuration(workoutSummary.session.metrics.pace) : '--:--'}
                  </Text>
                  <Text style={styles.summaryLabel}>PACE</Text>
                </View>
                
                <View style={styles.summaryStat}>
                  <TrendingUp size={16} color={Colors.text.accent} />
                  <Text style={styles.summaryValue}>
                    {workoutSummary.session.metrics.maxSpeed ? workoutSummary.session.metrics.maxSpeed.toFixed(1) : '0.0'} km/h
                  </Text>
                  <Text style={styles.summaryLabel}>MAX SPEED</Text>
                </View>
              </View>
              
              {workoutSummary.xpGained > 0 && (
                <View style={styles.xpContainer}>
                  <Text style={styles.xpText}>+{workoutSummary.xpGained} XP EARNED</Text>
                </View>
              )}
              
              {workoutSummary.achievements.length > 0 && (
                <View style={styles.achievementsContainer}>
                  <Text style={styles.achievementsTitle}>ACHIEVEMENTS UNLOCKED</Text>
                  {workoutSummary.achievements.map((achievement: string, index: number) => (
                    <Text key={index} style={styles.achievementItem}>• {achievement}</Text>
                  ))}
                </View>
              )}
              
              <PixelButton
                title="START NEW WORKOUT"
                onPress={() => setWorkoutSummary(null)}
                variant="primary"
                size="medium"
                style={styles.newWorkoutButton}
              />
            </LinearGradient>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Features Modal */}
      <Modal
        visible={showFeaturesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFeaturesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[Colors.background.twilight, Colors.background.nightSky]}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>NIMBUS FEATURES</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowFeaturesModal(false)}
                >
                  <X size={20} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                {/* Tracking Features */}
                <View style={styles.featureSection}>
                  <Text style={styles.featureSectionTitle}>TRACKING FEATURES</Text>
                  <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                      <MapPin size={16} color={Colors.accent.lightning} />
                      <Text style={styles.featureText}>GPS Distance & Route Tracking</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Clock size={16} color={Colors.accent.sunset} />
                      <Text style={styles.featureText}>Real-time Duration & Pace</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Zap size={16} color={Colors.accent.rainGreen} />
                      <Text style={styles.featureText}>Speed & Performance Metrics</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <TrendingUp size={16} color={Colors.primary.skyBlue} />
                      <Text style={styles.featureText}>Accurate GPS-based Measurements</Text>
                    </View>
                  </View>
                </View>

                {/* Workout Features */}
                <View style={styles.featureSection}>
                  <Text style={styles.featureSectionTitle}>WORKOUT FEATURES</Text>
                  <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                      <Play size={16} color={Colors.accent.lightning} />
                      <Text style={styles.featureText}>Multiple workout types (run/walk)</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Zap size={16} color={Colors.accent.sunset} />
                      <Text style={styles.featureText}>XP rewards for completed workouts</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <TrendingUp size={16} color={Colors.accent.rainGreen} />
                      <Text style={styles.featureText}>Achievement tracking system</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Clock size={16} color={Colors.primary.skyBlue} />
                      <Text style={styles.featureText}>Detailed workout summaries</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              <PixelButton
                title="CLOSE"
                onPress={() => setShowFeaturesModal(false)}
                variant="primary"
                size="medium"
                style={styles.closeModalButton}
              />
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.nightSky,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 2,
    borderBottomColor: Colors.background.overcast,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 20,
    color: Colors.primary.skyBlue,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  startSection: {
    marginVertical: 24,
  },
  startPanel: {
    padding: 32,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary.skyBlue,
  },
  startTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  startSubtitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    minWidth: 200,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: Colors.background.twilight,
    borderWidth: 2,
    borderColor: Colors.card.border,
    marginBottom: 24,
    alignSelf: 'center',
  },
  infoButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.accent,
    marginLeft: 8,
  },
  performanceSection: {
    marginVertical: 16,
  },
  performanceGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  performanceItem: {
    flex: 1,
    backgroundColor: Colors.card.background,
    borderWidth: 2,
    borderColor: Colors.card.border,
    padding: 16,
    alignItems: 'center',
  },
  performanceLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  performanceValue: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.primary,
  },
  summarySection: {
    marginVertical: 24,
  },
  summaryPanel: {
    padding: 24,
    borderWidth: 3,
    borderColor: Colors.primary.skyBlue,
  },
  summaryTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  summaryStat: {
    flex: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  summaryValue: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.primary,
    marginVertical: 8,
  },
  summaryLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
  },
  xpContainer: {
    backgroundColor: Colors.status.success + '20',
    borderWidth: 2,
    borderColor: Colors.status.success,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  xpText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.status.success,
  },
  achievementsContainer: {
    backgroundColor: Colors.background.twilight,
    borderWidth: 2,
    borderColor: Colors.card.border,
    padding: 16,
    marginBottom: 20,
  },
  achievementsTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.accent,
    marginBottom: 12,
  },
  achievementItem: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: Colors.text.secondary,
    marginBottom: 6,
    lineHeight: 14,
  },
  newWorkoutButton: {
    alignSelf: 'center',
  },
  sectionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.accent,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    borderWidth: 3,
    borderColor: Colors.primary.skyBlue,
    backgroundColor: Colors.background.nightSky,
    shadowOffset: { width: 0, height: 4 },
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: Colors.card.border,
  },
  modalTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: Colors.primary.skyBlue,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 400,
  },
  featureSection: {
    marginBottom: 24,
  },
  featureSectionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.accent,
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card.background,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.card.border,
  },
  featureText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    marginLeft: 12,
  },
  closeModalButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
});