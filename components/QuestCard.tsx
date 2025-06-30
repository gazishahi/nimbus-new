import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Quest } from '@/types/game';
import { Zap, Target, MapPin, Clock, TrendingUp, Mountain } from 'lucide-react-native';
import PixelButton from './PixelButton';
import { Colors } from '@/constants/Colors';

interface QuestCardProps {
  quest: Quest;
  onAccept?: () => void;
  onComplete?: () => void;
  showActions?: boolean;
}

export default function QuestCard({ 
  quest, 
  onAccept, 
  onComplete, 
  showActions = true 
}: QuestCardProps) {
  const getQuestIcon = () => {
    switch (quest.type) {
      case 'sprint-challenge':
        return <Zap size={20} color="#fff" />;
      case 'distance-goal':
        return <Target size={20} color="#fff" />;
      case 'exploration':
        return <MapPin size={20} color="#fff" />;
      case 'time-challenge':
        return <Clock size={20} color="#fff" />;
      case 'pace-maintenance':
        return <TrendingUp size={20} color="#fff" />;
      case 'elevation-challenge':
        return <Mountain size={20} color="#fff" />;
      default:
        return <Target size={20} color="#fff" />;
    }
  };

  const getDifficultyColors = () => {
    switch (quest.difficulty) {
      case 'easy':
        return Colors.difficulty.easy;
      case 'medium':
        return Colors.difficulty.medium;
      case 'hard':
        return Colors.difficulty.hard;
      case 'legendary':
        return Colors.difficulty.legendary;
      default:
        return Colors.difficulty.easy;
    }
  };

  const progressPercentage = (quest.progress / quest.maxProgress) * 100;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getDifficultyColors()}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}>
        <View style={styles.headerContent}>
          {getQuestIcon()}
          <Text style={styles.difficulty}>{quest.difficulty.toUpperCase()}</Text>
        </View>
      </LinearGradient>
      
      <View style={styles.content}>
        <Text style={styles.title}>{quest.title}</Text>
        <Text style={styles.description}>{quest.description}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {quest.progress}/{quest.maxProgress}
          </Text>
        </View>
        
        <View style={styles.rewardsContainer}>
          <Text style={styles.rewardsTitle}>REWARDS:</Text>
          <Text style={styles.rewardText}>
            +{quest.rewards.experience} XP
          </Text>
          <Text style={styles.rewardText}>
            +{quest.rewards.coins} Coins
          </Text>
        </View>
        
        {showActions && (
          <View style={styles.actions}>
            {!quest.isActive && !quest.isCompleted && onAccept && (
              <PixelButton 
                title="ACCEPT QUEST" 
                onPress={onAccept}
                variant="primary"
                size="medium"
              />
            )}
            {quest.isCompleted && onComplete && (
              <PixelButton 
                title="CLAIM REWARD" 
                onPress={onComplete}
                variant="success"
                size="medium"
              />
            )}
            {quest.isActive && !quest.isCompleted && (
              <View style={styles.activeIndicator}>
                <Text style={styles.activeText}>QUEST ACTIVE</Text>
              </View>
            )}
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
  difficulty: {
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
    marginBottom: 16,
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
  progressText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  rewardsContainer: {
    marginBottom: 16,
  },
  rewardsTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.accent,
    marginBottom: 8,
  },
  rewardText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.status.success,
    marginBottom: 4,
  },
  actions: {
    alignItems: 'center',
  },
  activeIndicator: {
    backgroundColor: Colors.status.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: Colors.button.success.border,
  },
  activeText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
  },
});