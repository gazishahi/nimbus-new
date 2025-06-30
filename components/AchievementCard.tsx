import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AchievementProgress } from '@/types/achievements';
import { 
  Trophy, Star, Target, MapPin, Clock, Zap, Medal, Crown, 
  Play, Repeat, Cloud, Wind, Battery, Infinity, TrendingUp,
  Footprints, Award, Mountain, Gem, Timer
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

interface AchievementCardProps {
  achievement: AchievementProgress;
  showProgress?: boolean;
}

export default function AchievementCard({ achievement, showProgress = true }: AchievementCardProps) {
  const { achievement: ach, progress, isCompleted, unlockedAt, progressPercentage } = achievement;

  const getRarityColors = (): [string, string] => {
    switch (ach.rarity) {
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

  const getIcon = () => {
    const iconColor = isCompleted ? Colors.text.primary : Colors.tabBar.inactive;
    const iconSize = 24;

    switch (ach.icon) {
      case 'trophy': return <Trophy size={iconSize} color={iconColor} />;
      case 'star': return <Star size={iconSize} color={iconColor} />;
      case 'target': return <Target size={iconSize} color={iconColor} />;
      case 'map-pin': return <MapPin size={iconSize} color={iconColor} />;
      case 'clock': return <Clock size={iconSize} color={iconColor} />;
      case 'zap': return <Zap size={iconSize} color={iconColor} />;
      case 'medal': return <Medal size={iconSize} color={iconColor} />;
      case 'crown': return <Crown size={iconSize} color={iconColor} />;
      case 'play': return <Play size={iconSize} color={iconColor} />;
      case 'repeat': return <Repeat size={iconSize} color={iconColor} />;
      case 'cloud': return <Cloud size={iconSize} color={iconColor} />;
      case 'wind': return <Wind size={iconSize} color={iconColor} />;
      case 'battery': return <Battery size={iconSize} color={iconColor} />;
      case 'infinity': return <Infinity size={iconSize} color={iconColor} />;
      case 'trending-up': return <TrendingUp size={iconSize} color={iconColor} />;
      case 'footprints': return <Footprints size={iconSize} color={iconColor} />;
      case 'award': return <Award size={iconSize} color={iconColor} />;
      case 'mountain': return <Mountain size={iconSize} color={iconColor} />;
      case 'gem': return <Gem size={iconSize} color={iconColor} />;
      case 'timer': return <Timer size={iconSize} color={iconColor} />;
      default: return <Trophy size={iconSize} color={iconColor} />;
    }
  };

  const formatProgress = () => {
    switch (ach.requirementType) {
      case 'total_distance':
      case 'single_run_distance':
        if (ach.requirementValue >= 1000) {
          return `${(progress / 1000).toFixed(1)}/${(ach.requirementValue / 1000).toFixed(1)}km`;
        }
        return `${progress}/${ach.requirementValue}m`;
      case 'total_time':
        const progressHours = Math.floor(progress / 3600);
        const progressMins = Math.floor((progress % 3600) / 60);
        const reqHours = Math.floor(ach.requirementValue / 3600);
        const reqMins = Math.floor((ach.requirementValue % 3600) / 60);
        
        if (reqHours > 0) {
          return `${progressHours}h ${progressMins}m / ${reqHours}h ${reqMins}m`;
        }
        return `${progressMins}m / ${reqMins}m`;
      case 'total_runs':
      case 'level':
      default:
        return `${progress}/${ach.requirementValue}`;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={[styles.container, !isCompleted && styles.containerLocked]}>
      <LinearGradient
        colors={isCompleted ? getRarityColors() : [Colors.background.storm, Colors.background.overcast]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          <Text style={[styles.rarity, !isCompleted && styles.lockedText]}>
            {ach.rarity.toUpperCase()}
          </Text>
        </View>
      </LinearGradient>
      
      <View style={styles.content}>
        <Text style={[styles.title, !isCompleted && styles.lockedText]}>
          {ach.title}
        </Text>
        <Text style={[styles.description, !isCompleted && styles.lockedText]}>
          {ach.description}
        </Text>
        
        {showProgress && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, !isCompleted && styles.progressBarLocked]}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(progressPercentage, 100)}%` },
                  !isCompleted && styles.progressFillLocked
                ]} 
              />
            </View>
            <Text style={[styles.progressText, !isCompleted && styles.lockedText]}>
              {formatProgress()}
            </Text>
          </View>
        )}
        
        <View style={styles.rewardsContainer}>
          <Text style={[styles.rewardText, !isCompleted && styles.lockedText]}>
            +{ach.xpReward} XP
          </Text>
          {ach.coinReward > 0 && (
            <Text style={[styles.rewardText, !isCompleted && styles.lockedText]}>
              +{ach.coinReward} Coins
            </Text>
          )}
        </View>
        
        {isCompleted && unlockedAt && (
          <View style={styles.unlockedIndicator}>
            <Text style={styles.unlockedText}>
              UNLOCKED • {formatDate(unlockedAt)}
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
    marginBottom: 16,
    shadowOffset: { width: 3, height: 3 },
    shadowColor: Colors.card.shadow,
    shadowOpacity: 0.5,
    elevation: 5,
  },
  containerLocked: {
    opacity: 0.6,
  },
  header: {
    padding: 12,
    borderBottomWidth: 2,
    borderBottomColor: Colors.card.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    padding: 4,
  },
  rarity: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
  },
  content: {
    padding: 16,
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  description: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    lineHeight: 16,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    backgroundColor: Colors.progress.background,
    borderWidth: 2,
    borderColor: Colors.background.storm,
    marginBottom: 4,
  },
  progressBarLocked: {
    backgroundColor: Colors.background.overcast,
    borderColor: Colors.background.storm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.skyBlue,
  },
  progressFillLocked: {
    backgroundColor: Colors.tabBar.inactive,
  },
  progressText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  rewardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  rewardText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.status.success,
  },
  unlockedIndicator: {
    backgroundColor: Colors.status.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.button.success.border,
    alignSelf: 'center',
  },
  unlockedText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.primary,
  },
  lockedText: {
    color: Colors.tabBar.inactive,
  },
});