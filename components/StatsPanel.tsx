import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { UserStats } from '@/types/stats';

interface StatsPanelProps {
  stats: UserStats | null;
  isLoading?: boolean;
}

export default function StatsPanel({ stats, isLoading = false }: StatsPanelProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.username}>Loading...</Text>
          <Text style={styles.className}>Cloud Runner</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>LEVEL --</Text>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: '0%' }]} />
            </View>
            <Text style={styles.xpText}>-- / -- XP</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>RUNS</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>DISTANCE</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>TIME</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.username}>Guest Runner</Text>
          <Text style={styles.className}>Cloud Walker</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>LEVEL 1</Text>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: '0%' }]} />
            </View>
            <Text style={styles.xpText}>0 / 100 XP</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>RUNS</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0.0km</Text>
              <Text style={styles.statLabel}>DISTANCE</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0m</Text>
              <Text style={styles.statLabel}>TIME</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Calculate level progress
  const experienceForNextLevel = Math.floor(100 * Math.pow(1.5, stats.level));
  const levelProgress = (stats.experience / experienceForNextLevel) * 100;

  // Get character class info
  const getCharacterClassInfo = () => {
    switch (stats.characterPath) {
      case 'speed-runner':
        return {
          name: 'Sky Sprinter',
          color: Colors.classes.speedRunner,
        };
      case 'endurance-master':
        return {
          name: 'Storm Chaser',
          color: Colors.classes.enduranceMaster,
        };
      case 'explorer':
        return {
          name: 'Cloud Walker',
          color: Colors.classes.explorer,
        };
      default:
        return {
          name: 'Cloud Runner',
          color: Colors.primary.skyBlue,
        };
    }
  };

  const characterClass = getCharacterClassInfo();

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[characterClass.color, Colors.background.overcast]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <Text style={styles.username}>Level {stats.level} Runner</Text>
        <Text style={styles.className}>{characterClass.name}</Text>
      </LinearGradient>
      
      <View style={styles.content}>
        <View style={styles.levelContainer}>
          <Text style={styles.levelText}>LEVEL {stats.level}</Text>
          <View style={styles.xpBar}>
            <View 
              style={[styles.xpFill, { width: `${Math.min(levelProgress, 100)}%` }]} 
            />
          </View>
          <Text style={styles.xpText}>
            {stats.experience} / {experienceForNextLevel} XP
          </Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalRuns}</Text>
            <Text style={styles.statLabel}>RUNS</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDistance(stats.totalDistance)}</Text>
            <Text style={styles.statLabel}>DISTANCE</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(stats.totalTime)}</Text>
            <Text style={styles.statLabel}>TIME</Text>
          </View>
        </View>

        {/* Additional Stats */}
        <View style={styles.additionalStats}>
          <View style={styles.additionalStatItem}>
            <Text style={styles.additionalStatLabel}>Available Skill Points:</Text>
            <Text style={styles.additionalStatValue}>{stats.skillPoints}</Text>
          </View>
          {stats.totalRuns > 0 && (
            <View style={styles.additionalStatItem}>
              <Text style={styles.additionalStatLabel}>Average Distance:</Text>
              <Text style={styles.additionalStatValue}>
                {formatDistance(Math.round(stats.totalDistance / stats.totalRuns))}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card.background,
    borderWidth: 3,
    borderColor: Colors.card.border,
    marginBottom: 20,
    shadowOffset: { width: 3, height: 3 },
    shadowColor: Colors.card.shadow,
    shadowOpacity: 0.5,
    elevation: 5,
  },
  header: {
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: Colors.card.border,
  },
  username: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  className: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
  },
  content: {
    padding: 16,
  },
  levelContainer: {
    marginBottom: 20,
  },
  levelText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.accent,
    textAlign: 'center',
    marginBottom: 8,
  },
  xpBar: {
    height: 16,
    backgroundColor: Colors.progress.background,
    borderWidth: 2,
    borderColor: Colors.background.storm,
    marginBottom: 4,
  },
  xpFill: {
    height: '100%',
    backgroundColor: Colors.progress.success,
  },
  xpText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
  },
  additionalStats: {
    borderTopWidth: 2,
    borderTopColor: Colors.background.storm,
    paddingTop: 16,
    gap: 8,
  },
  additionalStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  additionalStatLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: Colors.text.secondary,
  },
  additionalStatValue: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: Colors.text.accent,
  },
});