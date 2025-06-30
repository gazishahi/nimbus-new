import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Target, Star, Award, Medal, Crown } from 'lucide-react-native';
import { usePixelFont } from '@/hooks/usePixelFont';
import { Colors } from '@/constants/Colors';

export default function AchievementsScreen() {
  const fontsLoaded = usePixelFont();

  if (!fontsLoaded) {
    return null;
  }

  const goals = [
    {
      id: 1,
      title: 'Weekly Runner',
      description: 'Complete 3 workouts this week',
      progress: 2,
      target: 3,
      type: 'weekly',
      icon: Target,
      color: Colors.status.warning,
    },
    {
      id: 2,
      title: '5K Challenge',
      description: 'Run 5 kilometers in a single workout',
      progress: 3.2,
      target: 5,
      type: 'distance',
      icon: Trophy,
      color: Colors.primary.skyBlue,
    },
    {
      id: 3,
      title: 'Consistency Master',
      description: 'Workout 5 days in a row',
      progress: 3,
      target: 5,
      type: 'streak',
      icon: Star,
      color: Colors.accent.lightning,
    },
  ];

  const achievements = [
    {
      id: 1,
      title: 'First Steps',
      description: 'Complete your first workout',
      unlocked: true,
      rarity: 'bronze',
      icon: Award,
    },
    {
      id: 2,
      title: '1K Runner',
      description: 'Run 1 kilometer',
      unlocked: true,
      rarity: 'bronze',
      icon: Medal,
    },
    {
      id: 3,
      title: 'Speed Demon',
      description: 'Achieve a pace under 5:00/km',
      unlocked: false,
      rarity: 'silver',
      icon: Trophy,
    },
    {
      id: 4,
      title: 'Marathon Master',
      description: 'Complete a 42.2km run',
      unlocked: false,
      rarity: 'gold',
      icon: Crown,
    },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'bronze': return Colors.accent.sunset;
      case 'silver': return Colors.gray.silverLining;
      case 'gold': return Colors.accent.lightning;
      case 'platinum': return Colors.primary.skyBlue;
      default: return Colors.text.muted;
    }
  };

  const formatProgress = (progress: number, target: number, type: string) => {
    if (type === 'distance') {
      return `${progress.toFixed(1)}/${target}km`;
    }
    return `${progress}/${target}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Trophy size={32} color={Colors.primary.skyBlue} />
          <Text style={styles.title}>GOALS & ACHIEVEMENTS</Text>
          <Text style={styles.subtitle}>Track Your Fitness Milestones</Text>
        </View>

        {/* Active Goals */}
        <View style={styles.goalsSection}>
          <Text style={styles.sectionTitle}>ACTIVE GOALS</Text>
          
          {goals.map((goal) => {
            const IconComponent = goal.icon;
            const progressPercentage = (goal.progress / goal.target) * 100;
            
            return (
              <View key={goal.id} style={styles.goalCard}>
                <LinearGradient
                  colors={[goal.color, Colors.background.overcast]}
                  style={styles.goalHeader}
                >
                  <IconComponent size={24} color={Colors.text.primary} />
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

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>ACHIEVEMENTS</Text>
          
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => {
              const IconComponent = achievement.icon;
              const rarityColor = getRarityColor(achievement.rarity);
              
              return (
                <View 
                  key={achievement.id} 
                  style={[
                    styles.achievementCard,
                    !achievement.unlocked && styles.achievementLocked
                  ]}
                >
                  <LinearGradient
                    colors={achievement.unlocked ? [rarityColor, Colors.background.overcast] : [Colors.background.storm, Colors.background.overcast]}
                    style={styles.achievementHeader}
                  >
                    <IconComponent 
                      size={32} 
                      color={achievement.unlocked ? Colors.text.primary : Colors.text.muted} 
                    />
                  </LinearGradient>
                  
                  <View style={styles.achievementContent}>
                    <Text style={[
                      styles.achievementTitle,
                      !achievement.unlocked && styles.lockedText
                    ]}>
                      {achievement.title}
                    </Text>
                    <Text style={[
                      styles.achievementDescription,
                      !achievement.unlocked && styles.lockedText
                    ]}>
                      {achievement.description}
                    </Text>
                    <Text style={[
                      styles.achievementRarity,
                      { color: rarityColor },
                      !achievement.unlocked && styles.lockedText
                    ]}>
                      {achievement.rarity.toUpperCase()}
                    </Text>
                  </View>
                  
                  {achievement.unlocked && (
                    <View style={styles.unlockedBadge}>
                      <Text style={styles.unlockedText}>UNLOCKED</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Progress Summary */}
        <View style={styles.summarySection}>
          <LinearGradient
            colors={[Colors.primary.skyBlue, Colors.primary.deepNimbus]}
            style={styles.summaryPanel}
          >
            <Text style={styles.summaryTitle}>PROGRESS SUMMARY</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>2</Text>
                <Text style={styles.summaryLabel}>UNLOCKED</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>2</Text>
                <Text style={styles.summaryLabel}>LOCKED</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>50%</Text>
                <Text style={styles.summaryLabel}>COMPLETE</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

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
  achievementRarity: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    textAlign: 'center',
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
  bottomSpacing: {
    height: 100,
  },
});