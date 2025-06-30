import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Target, Star, Award, Medal, Crown, Zap, MapPin, Clock, Footprints } from 'lucide-react-native';
import { usePixelFont } from '@/hooks/usePixelFont';
import { useAchievements, AchievementWithProgress } from '@/hooks/useAchievements';
import { Colors } from '@/constants/Colors';

export default function AchievementsScreen() {
  const fontsLoaded = usePixelFont();
  const { achievements, goals, loading, error, stats, refreshAchievements } = useAchievements();
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  if (!fontsLoaded) {
    return null;
  }

  const getIcon = (iconName: string, size: number, color: string) => {
    switch (iconName) {
      case 'trophy': return <Trophy size={size} color={color} />;
      case 'star': return <Star size={size} color={color} />;
      case 'award': return <Award size={size} color={color} />;
      case 'medal': return <Medal size={size} color={color} />;
      case 'crown': return <Crown size={size} color={color} />;
      case 'zap': return <Zap size={size} color={color} />;
      case 'map-pin': return <MapPin size={size} color={color} />;
      case 'clock': return <Clock size={size} color={color} />;
      case 'target': return <Target size={size} color={color} />;
      case 'footprints': return <Footprints size={size} color={color} />;
      default: return <Trophy size={size} color={color} />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'bronze': return Colors.accent.sunset;
      case 'silver': return Colors.gray.silverLining;
      case 'gold': return Colors.accent.lightning;
      case 'platinum': return Colors.primary.skyBlue;
      case 'legendary': return Colors.accent.dawn;
      default: return Colors.text.muted;
    }
  };

  const formatProgress = (progress: number, target: number, type: string) => {
    switch (type) {
      case 'total_distance':
      case 'single_run_distance':
        if (target >= 1000) {
          return `${(progress / 1000).toFixed(1)}/${(target / 1000).toFixed(1)}km`;
        }
        return `${progress}/${target}m`;
      case 'total_time':
        const progressMinutes = Math.floor(progress / 60);
        const targetMinutes = Math.floor(target / 60);
        return `${progressMinutes}/${targetMinutes}min`;
      default:
        return `${progress}/${target}`;
    }
  };

  const filteredAchievements = achievements.filter(a => {
    if (filter === 'unlocked') return a.is_completed;
    if (filter === 'locked') return !a.is_completed;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Trophy size={32} color={Colors.primary.skyBlue} />
          <Text style={styles.title}>GOALS & ACHIEVEMENTS</Text>
          <Text style={styles.subtitle}>Track Your Fitness Milestones</Text>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.skyBlue} />
            <Text style={styles.loadingText}>Loading achievements...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshAchievements}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <>
            {/* Progress Summary */}
            <View style={styles.summarySection}>
              <LinearGradient
                colors={[Colors.primary.skyBlue, Colors.primary.deepNimbus]}
                style={styles.summaryPanel}
              >
                <Text style={styles.summaryTitle}>PROGRESS SUMMARY</Text>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>{stats.unlockedAchievements}</Text>
                    <Text style={styles.summaryLabel}>UNLOCKED</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>{stats.totalAchievements - stats.unlockedAchievements}</Text>
                    <Text style={styles.summaryLabel}>LOCKED</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>{stats.completionPercentage.toFixed(0)}%</Text>
                    <Text style={styles.summaryLabel}>COMPLETE</Text>
                  </View>
                </View>
                
                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${stats.completionPercentage}%` }
                      ]} 
                    />
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Active Goals */}
            {goals.length > 0 && (
              <View style={styles.goalsSection}>
                <Text style={styles.sectionTitle}>ACTIVE GOALS</Text>
                
                {goals.map((goal) => {
                  const progressPercentage = (goal.progress / goal.target) * 100;
                  
                  return (
                    <View key={goal.id} style={styles.goalCard}>
                      <LinearGradient
                        colors={[goal.color, Colors.background.overcast]}
                        style={styles.goalHeader}
                      >
                        {getIcon(goal.icon, 24, Colors.text.primary)}
                        <Text style={styles.goalTitle}>{goal.title}</Text>
                      </LinearGradient>
                      
                      <View style={styles.goalContent}>
                        <Text style={styles.goalDescription}>{goal.description}</Text>
                        
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill, 
                                { width: `${Math.min(progressPercentage, 100)}%`, backgroundColor: goal.color }
                              ]} 
                            />
                          </View>
                          <Text style={styles.progressText}>
                            {formatProgress(goal.progress, goal.target, goal.type)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
                onPress={() => setFilter('all')}>
                <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                  ALL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filter === 'unlocked' && styles.filterButtonActive]}
                onPress={() => setFilter('unlocked')}>
                <Text style={[styles.filterText, filter === 'unlocked' && styles.filterTextActive]}>
                  UNLOCKED
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filter === 'locked' && styles.filterButtonActive]}
                onPress={() => setFilter('locked')}>
                <Text style={[styles.filterText, filter === 'locked' && styles.filterTextActive]}>
                  LOCKED
                </Text>
              </TouchableOpacity>
            </View>

            {/* Achievements */}
            <View style={styles.achievementsSection}>
              <Text style={styles.sectionTitle}>ACHIEVEMENTS</Text>
              
              {filteredAchievements.length > 0 ? (
                <View style={styles.achievementsGrid}>
                  {filteredAchievements.map((item) => {
                    const { achievement } = item;
                    const rarityColor = getRarityColor(achievement.rarity);
                    
                    return (
                      <View 
                        key={achievement.id} 
                        style={[
                          styles.achievementCard,
                          !item.is_completed && styles.achievementLocked
                        ]}
                      >
                        <LinearGradient
                          colors={item.is_completed ? [rarityColor, Colors.background.overcast] : [Colors.background.storm, Colors.background.overcast]}
                          style={styles.achievementHeader}
                        >
                          {getIcon(
                            achievement.icon, 
                            32, 
                            item.is_completed ? Colors.text.primary : Colors.text.muted
                          )}
                        </LinearGradient>
                        
                        <View style={styles.achievementContent}>
                          <Text style={[
                            styles.achievementTitle,
                            !item.is_completed && styles.lockedText
                          ]}>
                            {achievement.title}
                          </Text>
                          <Text style={[
                            styles.achievementDescription,
                            !item.is_completed && styles.lockedText
                          ]}>
                            {achievement.description}
                          </Text>
                          
                          {!item.is_completed && item.progress > 0 && (
                            <View style={styles.achievementProgress}>
                              <View style={styles.achievementProgressBar}>
                                <View 
                                  style={[
                                    styles.achievementProgressFill, 
                                    { width: `${item.percentage}%` }
                                  ]} 
                                />
                              </View>
                              <Text style={styles.achievementProgressText}>
                                {formatProgress(item.progress, achievement.requirement_value, achievement.requirement_type)}
                              </Text>
                            </View>
                          )}
                          
                          <Text style={[
                            styles.achievementRarity,
                            { color: rarityColor },
                            !item.is_completed && styles.lockedText
                          ]}>
                            {achievement.rarity.toUpperCase()}
                          </Text>
                          
                          {item.is_completed && (
                            <View style={styles.rewardContainer}>
                              <Text style={styles.rewardText}>+{achievement.xp_reward} XP</Text>
                            </View>
                          )}
                        </View>
                        
                        {item.is_completed && (
                          <View style={styles.unlockedBadge}>
                            <Text style={styles.unlockedText}>UNLOCKED</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Trophy size={48} color={Colors.text.muted} />
                  <Text style={styles.emptyTitle}>No Achievements Found</Text>
                  <Text style={styles.emptyText}>
                    {filter === 'unlocked' 
                      ? 'Complete workouts to unlock achievements!'
                      : filter === 'locked'
                      ? 'All achievements have been unlocked!'
                      : 'Start your fitness journey to earn achievements!'}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    fontSize: 16,
    color: Colors.primary.skyBlue,
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 16,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: Colors.status.error + '20',
    borderWidth: 2,
    borderColor: Colors.status.error,
  },
  errorText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.status.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.status.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
  },
  summarySection: {
    marginBottom: 24,
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
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryValue: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
  },
  progressBarContainer: {
    paddingHorizontal: 8,
  },
  progressBar: {
    height: 16,
    backgroundColor: Colors.progress.background,
    borderWidth: 2,
    borderColor: Colors.background.storm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.status.success,
  },
  goalsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.accent,
    textAlign: 'center',
    marginBottom: 16,
  },
  goalCard: {
    backgroundColor: Colors.card.background,
    borderWidth: 3,
    borderColor: Colors.card.border,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  goalTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.primary,
  },
  goalContent: {
    padding: 16,
  },
  goalDescription: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    marginBottom: 16,
    lineHeight: 16,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: Colors.progress.background,
    borderWidth: 2,
    borderColor: Colors.background.storm,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: Colors.card.border,
    backgroundColor: Colors.background.overcast,
  },
  filterButtonActive: {
    borderColor: Colors.text.accent,
    backgroundColor: Colors.card.background,
  },
  filterText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
  },
  filterTextActive: {
    color: Colors.text.accent,
  },
  achievementsSection: {
    marginBottom: 24,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: Colors.card.background,
    borderWidth: 3,
    borderColor: Colors.card.border,
    position: 'relative',
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementHeader: {
    padding: 20,
    alignItems: 'center',
  },
  achievementContent: {
    padding: 16,
    alignItems: 'center',
  },
  achievementTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementDescription: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 12,
    marginBottom: 8,
  },
  achievementProgress: {
    width: '100%',
    marginBottom: 8,
  },
  achievementProgressBar: {
    height: 8,
    backgroundColor: Colors.progress.background,
    borderWidth: 1,
    borderColor: Colors.background.storm,
    marginBottom: 4,
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary.skyBlue,
  },
  achievementProgressText: {
    fontFamily: 'PressStart2P',
    fontSize: 7,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  achievementRarity: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    textAlign: 'center',
  },
  rewardContainer: {
    marginTop: 8,
    backgroundColor: Colors.status.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rewardText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.status.success,
  },
  lockedText: {
    color: Colors.text.muted,
  },
  unlockedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.status.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.button.success.border,
  },
  unlockedText: {
    fontFamily: 'PressStart2P',
    fontSize: 6,
    color: Colors.text.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.card.background,
    borderWidth: 3,
    borderColor: Colors.card.border,
  },
  emptyTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  bottomSpacing: {
    height: 100,
  },
});