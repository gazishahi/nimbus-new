import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LiveQuest } from '@/types/quests';
import { Zap, Target, Heart, TrendingUp, Clock, Timer, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

interface LiveQuestCardProps {
  quest: LiveQuest;
  showTimer?: boolean;
}

export default function LiveQuestCard({ quest, showTimer = true }: LiveQuestCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!quest.timeLimit || !quest.startTime || quest.isCompleted) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const elapsed = (Date.now() - quest.startTime!.getTime()) / 1000;
      const remaining = Math.max(0, quest.timeLimit! - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setTimeRemaining(0);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [quest.timeLimit, quest.startTime, quest.isCompleted]);

  const getDifficultyColors = (): [string, string] => {
    switch (quest.difficulty) {
      case 'easy':
        return [Colors.status.success, '#059669'];
      case 'medium':
        return [Colors.status.warning, '#d97706'];
      case 'hard':
        return [Colors.status.error, '#b91c1c'];
      default:
        return [Colors.status.success, '#059669'];
    }
  };

  const getIcon = () => {
    const iconSize = 20;
    const iconColor = Colors.text.primary;

    switch (quest.type) {
      case 'distance_sprint':
        return <Zap size={iconSize} color={iconColor} />;
      case 'pace_maintain':
        return <Target size={iconSize} color={iconColor} />;
      case 'heart_rate_zone':
        return <Heart size={iconSize} color={iconColor} />;
      case 'speed_burst':
        return <TrendingUp size={iconSize} color={iconColor} />;
      case 'endurance_test':
        return <Clock size={iconSize} color={iconColor} />;
      default:
        return <Target size={iconSize} color={iconColor} />;
    }
  };

  const formatProgress = () => {
    switch (quest.type) {
      case 'distance_sprint':
        return `${Math.round(quest.progress)}/${quest.target}m`;
      case 'pace_maintain':
      case 'heart_rate_zone':
      case 'speed_burst':
      case 'endurance_test':
        return `${Math.round(quest.progress)}/${quest.target}s`;
      default:
        return `${Math.round(quest.progress)}/${quest.target}`;
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = Math.min((quest.progress / quest.target) * 100, 100);
  const isExpired = timeRemaining === 0;
  const isUrgent = timeRemaining !== null && timeRemaining < 30;

  return (
    <View style={[
      styles.container,
      quest.isCompleted && styles.completedContainer,
      isExpired && styles.expiredContainer
    ]}>
      <LinearGradient
        colors={quest.isCompleted 
          ? [Colors.status.success, '#059669']
          : isExpired 
          ? [Colors.status.error, '#b91c1c']
          : getDifficultyColors()
        }
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            {quest.isCompleted ? (
              <CheckCircle size={20} color={Colors.text.primary} />
            ) : isExpired ? (
              <XCircle size={20} color={Colors.text.primary} />
            ) : (
              getIcon()
            )}
          </View>
          <Text style={styles.difficulty}>
            {quest.isCompleted ? 'COMPLETED' : isExpired ? 'EXPIRED' : quest.difficulty.toUpperCase()}
          </Text>
          {showTimer && timeRemaining !== null && !quest.isCompleted && (
            <View style={[styles.timerContainer, isUrgent && styles.urgentTimer]}>
              <Timer size={16} color={Colors.text.primary} />
              <Text style={[styles.timerText, isUrgent && styles.urgentTimerText]}>
                {formatTimeRemaining(timeRemaining)}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
      
      <View style={styles.content}>
        <Text style={[
          styles.title,
          quest.isCompleted && styles.completedText,
          isExpired && styles.expiredText
        ]}>
          {quest.title}
        </Text>
        <Text style={[
          styles.description,
          quest.isCompleted && styles.completedText,
          isExpired && styles.expiredText
        ]}>
          {quest.description}
        </Text>
        
        {!isExpired && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progressPercentage}%` },
                  quest.isCompleted && styles.completedProgressFill
                ]} 
              />
            </View>
            <Text style={[
              styles.progressText,
              quest.isCompleted && styles.completedText
            ]}>
              {formatProgress()}
            </Text>
          </View>
        )}
        
        <View style={styles.rewardsContainer}>
          <Text style={[
            styles.rewardText,
            quest.isCompleted && styles.completedRewardText,
            isExpired && styles.expiredText
          ]}>
            +{quest.rewards.xp} XP
          </Text>
          <Text style={[
            styles.rewardText,
            quest.isCompleted && styles.completedRewardText,
            isExpired && styles.expiredText
          ]}>
            +{quest.rewards.coins} Coins
          </Text>
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
    marginBottom: 12,
    shadowOffset: { width: 3, height: 3 },
    shadowColor: Colors.card.shadow,
    shadowOpacity: 0.5,
    elevation: 5,
  },
  completedContainer: {
    borderColor: Colors.status.success,
  },
  expiredContainer: {
    borderColor: Colors.status.error,
    opacity: 0.7,
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
    marginRight: 8,
  },
  difficulty: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urgentTimer: {
    backgroundColor: Colors.status.error,
  },
  timerText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.primary,
    marginLeft: 4,
  },
  urgentTimerText: {
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
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.skyBlue,
  },
  completedProgressFill: {
    backgroundColor: Colors.status.success,
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
  },
  rewardText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.status.warning,
  },
  completedText: {
    color: Colors.status.success,
  },
  completedRewardText: {
    color: Colors.status.success,
  },
  expiredText: {
    color: Colors.status.error,
  },
});