import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LiveQuestSession } from '@/types/quests';
import { Colors } from '@/constants/Colors';
import LiveQuestCard from './LiveQuestCard';
import { Trophy, Target, Zap } from 'lucide-react-native';

interface LiveQuestPanelProps {
  session: LiveQuestSession | null;
  isVisible: boolean;
}

export default function LiveQuestPanel({ session, isVisible }: LiveQuestPanelProps) {
  if (!isVisible || !session) {
    return null;
  }

  const hasActiveQuests = session.activeQuests.length > 0;
  const hasCompletedQuests = session.completedQuests.length > 0;

  return (
    <View style={styles.container}>
      {/* Session Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>LIVE QUEST SESSION</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Target size={16} color={Colors.text.accent} />
            <Text style={styles.statValue}>{session.activeQuests.length}</Text>
            <Text style={styles.statLabel}>ACTIVE</Text>
          </View>
          <View style={styles.statItem}>
            <Trophy size={16} color={Colors.text.accent} />
            <Text style={styles.statValue}>{session.completedQuests.length}</Text>
            <Text style={styles.statLabel}>COMPLETED</Text>
          </View>
          <View style={styles.statItem}>
            <Zap size={16} color={Colors.text.accent} />
            <Text style={styles.statValue}>{session.totalXpEarned}</Text>
            <Text style={styles.statLabel}>XP EARNED</Text>
          </View>
        </View>
      </View>

      {/* Active Quests */}
      {hasActiveQuests && (
        <View style={styles.questSection}>
          <Text style={styles.questSectionTitle}>ACTIVE CHALLENGES</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.questScroll}
          >
            {session.activeQuests.map(quest => (
              <View key={quest.id} style={styles.questCardContainer}>
                <LiveQuestCard quest={quest} showTimer={true} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recently Completed Quests */}
      {hasCompletedQuests && (
        <View style={styles.questSection}>
          <Text style={styles.questSectionTitle}>RECENTLY COMPLETED</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.questScroll}
          >
            {session.completedQuests.slice(-3).map(quest => (
              <View key={quest.id} style={styles.questCardContainer}>
                <LiveQuestCard quest={quest} showTimer={false} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* No Active Quests Message */}
      {!hasActiveQuests && !hasCompletedQuests && (
        <View style={styles.emptyState}>
          <Target size={32} color={Colors.text.muted} />
          <Text style={styles.emptyTitle}>Quests Starting Soon</Text>
          <Text style={styles.emptyText}>
            Keep running! Live quests will appear after 3 minutes of activity.
          </Text>
        </View>
      )}

      {!hasActiveQuests && hasCompletedQuests && (
        <View style={styles.waitingState}>
          <Text style={styles.waitingText}>
            🎯 Keep running for new challenges!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card.background,
    borderWidth: 3,
    borderColor: Colors.card.border,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 3, height: 3 },
    shadowColor: Colors.card.shadow,
    shadowOpacity: 0.5,
    elevation: 5,
  },
  statsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.accent,
    textAlign: 'center',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: Colors.text.primary,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
  },
  questSection: {
    marginBottom: 16,
  },
  questSectionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.accent,
    marginBottom: 12,
  },
  questScroll: {
    flexDirection: 'row',
  },
  questCardContainer: {
    width: 280,
    marginRight: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background.overcast,
    borderWidth: 2,
    borderColor: Colors.card.border,
  },
  emptyTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  waitingState: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background.twilight,
    borderWidth: 2,
    borderColor: Colors.card.border,
  },
  waitingText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.accent,
    textAlign: 'center',
  },
});