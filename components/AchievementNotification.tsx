import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Star, Award, Crown, Gem } from 'lucide-react-native';
import { NewAchievement } from '@/types/achievements';
import { Colors } from '@/constants/Colors';

interface AchievementNotificationProps {
  achievement: NewAchievement | null;
  onComplete?: () => void;
}

export default function AchievementNotification({ achievement, onComplete }: AchievementNotificationProps) {
  const [slideAnim] = useState(new Animated.Value(-200));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (achievement) {
      // Slide in and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 20,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 4 seconds
      const timer = setTimeout(() => {
        hideNotification();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [achievement]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete?.();
    });
  };

  const getRarityColors = (rarity: string): [string, string] => {
    switch (rarity) {
      case 'bronze':
        return [Colors.accent.sunset, '#8b4513'];
      case 'silver':
        return [Colors.gray.silverLining, Colors.background.storm];
      case 'gold':
        return [Colors.accent.lightning, '#b8860b'];
      case 'platinum':
        return [Colors.accent.thunder, Colors.primary.deepNimbus];
      case 'legendary':
        return [Colors.accent.dawn, '#7c2d12'];
      default:
        return [Colors.accent.sunset, '#8b4513'];
    }
  };

  const getRarityIcon = (rarity: string) => {
    const iconSize = 24;
    const iconColor = Colors.text.primary;

    switch (rarity) {
      case 'bronze':
        return <Trophy size={iconSize} color={iconColor} />;
      case 'silver':
        return <Star size={iconSize} color={iconColor} />;
      case 'gold':
        return <Award size={iconSize} color={iconColor} />;
      case 'platinum':
        return <Crown size={iconSize} color={iconColor} />;
      case 'legendary':
        return <Gem size={iconSize} color={iconColor} />;
      default:
        return <Trophy size={iconSize} color={iconColor} />;
    }
  };

  if (!achievement) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        }
      ]}
    >
      <LinearGradient
        colors={getRarityColors(achievement.rarity)}
        style={styles.notification}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              {getRarityIcon(achievement.rarity)}
            </View>
            <Text style={styles.achievementUnlocked}>ACHIEVEMENT UNLOCKED!</Text>
          </View>
          
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.description}>{achievement.description}</Text>
          
          <View style={styles.rewards}>
            <Text style={styles.rewardText}>+{achievement.xpReward} XP</Text>
            {achievement.coinReward > 0 && (
              <Text style={styles.rewardText}>+{achievement.coinReward} Coins</Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  notification: {
    borderWidth: 3,
    borderColor: Colors.text.primary,
    borderRadius: 0,
    shadowOffset: { width: 3, height: 3 },
    shadowColor: Colors.card.shadow,
    shadowOpacity: 0.8,
    elevation: 10,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 8,
  },
  achievementUnlocked: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
    flex: 1,
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  description: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: Colors.text.secondary,
    lineHeight: 14,
    marginBottom: 12,
  },
  rewards: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  rewardText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.status.success,
  },
});