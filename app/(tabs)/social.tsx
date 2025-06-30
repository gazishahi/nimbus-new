import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChartBar as BarChart3, Medal, Trophy, Users, Zap, Shield, MapPin } from 'lucide-react-native';
import { usePixelFont } from '@/hooks/usePixelFont';
import { Colors } from '@/constants/Colors';

export default function RankScreen() {
  const fontsLoaded = usePixelFont();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'total'>('week');

  if (!fontsLoaded) {
    return null;
  }

  // Mock leaderboard data
  const leaderboardData = [
    {
      userId: '1',
      username: 'CloudRunner',
      level: 12,
      characterClass: {
        id: 'speed-runner',
        name: 'Sky Sprinter',
        color: Colors.classes.speedRunner,
        icon: 'zap',
      },
      weeklyDistance: 25000,
      monthlyDistance: 89000,
      totalDistance: 125000,
      rank: 3,
    },
    {
      userId: '2',
      username: 'StormChaser',
      level: 18,
      characterClass: {
        id: 'endurance-master',
        name: 'Storm Chaser',
        color: Colors.classes.enduranceMaster,
        icon: 'shield',
      },
      weeklyDistance: 42000,
      monthlyDistance: 156000,
      totalDistance: 287000,
      rank: 1,
    },
    {
      userId: '3',
      username: 'CloudWalker',
      level: 15,
      characterClass: {
        id: 'explorer',
        name: 'Cloud Walker',
        color: Colors.classes.explorer,
        icon: 'map-pin',
      },
      weeklyDistance: 31000,
      monthlyDistance: 124000,
      totalDistance: 198000,
      rank: 2,
    },
    {
      userId: '4',
      username: 'WindRider',
      level: 9,
      characterClass: {
        id: 'speed-runner',
        name: 'Sky Sprinter',
        color: Colors.classes.speedRunner,
        icon: 'zap',
      },
      weeklyDistance: 18500,
      monthlyDistance: 67000,
      totalDistance: 89000,
      rank: 4,
    },
    {
      userId: '5',
      username: 'ThunderStep',
      level: 14,
      characterClass: {
        id: 'endurance-master',
        name: 'Storm Chaser',
        color: Colors.classes.enduranceMaster,
        icon: 'shield',
      },
      weeklyDistance: 16000,
      monthlyDistance: 78000,
      totalDistance: 156000,
      rank: 5,
    },
  ];

  const currentUser = leaderboardData.find(entry => entry.userId === '1');
  
  const sortedLeaderboard = [...leaderboardData].sort((a, b) => {
    switch (selectedPeriod) {
      case 'week':
        return b.weeklyDistance - a.weeklyDistance;
      case 'month':
        return b.monthlyDistance - a.monthlyDistance;
      case 'total':
        return b.totalDistance - a.totalDistance;
      default:
        return a.rank - b.rank;
    }
  });

  const getClassIcon = (iconName: string, color: string) => {
    const iconProps = { size: 16, color };
    
    switch (iconName) {
      case 'zap':
        return <Zap {...iconProps} />;
      case 'shield':
        return <Shield {...iconProps} />;
      case 'map-pin':
        return <MapPin {...iconProps} />;
      default:
        return <Zap {...iconProps} />;
    }
  };

  const getRankIcon = (rank: number) => {
    const iconProps = { size: 20 };
    
    switch (rank) {
      case 1:
        return <Trophy {...iconProps} color={Colors.accent.lightning} />;
      case 2:
        return <Medal {...iconProps} color={Colors.gray.silverLining} />;
      case 3:
        return <Trophy {...iconProps} color={Colors.accent.sunset} />;
      default:
        return <Text style={styles.rankNumber}>{rank}</Text>;
    }
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <BarChart3 size={32} color={Colors.primary.skyBlue} />
          <Text style={styles.title}>LEADERBOARD</Text>
          <Text style={styles.subtitle}>Compete with Fellow Runners</Text>
        </View>

        {/* Current User Stats */}
        {currentUser && (
          <View style={styles.currentUserPanel}>
            <Text style={styles.sectionTitle}>YOUR RANKING</Text>
            <View style={styles.currentUserCard}>
              <LinearGradient
                colors={[currentUser.characterClass.color, Colors.background.overcast]}
                style={styles.userGradient}
              >
                <View style={styles.userContent}>
                  <View style={styles.rankContainer}>
                    {getRankIcon(currentUser.rank)}
                  </View>
                  
                  <View style={styles.userInfo}>
                    <View style={styles.userHeader}>
                      <Text style={styles.username}>{currentUser.username}</Text>
                      {getClassIcon(currentUser.characterClass.icon, currentUser.characterClass.color)}
                    </View>
                    <Text style={styles.userLevel}>Level {currentUser.level}</Text>
                    <Text style={styles.className}>{currentUser.characterClass.name}</Text>
                  </View>
                  
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{formatDistance(currentUser.weeklyDistance)}</Text>
                      <Text style={styles.statLabel}>WEEK</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{formatDistance(currentUser.monthlyDistance)}</Text>
                      <Text style={styles.statLabel}>MONTH</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{formatDistance(currentUser.totalDistance)}</Text>
                      <Text style={styles.statLabel}>TOTAL</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Period Selection */}
        <View style={styles.periodContainer}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}>
            <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
              WEEKLY
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}>
            <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
              MONTHLY
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'total' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('total')}>
            <Text style={[styles.periodText, selectedPeriod === 'total' && styles.periodTextActive]}>
              ALL-TIME
            </Text>
          </TouchableOpacity>
        </View>

        {/* Leaderboard */}
        <View style={styles.leaderboardContainer}>
          <Text style={styles.sectionTitle}>
            {selectedPeriod.toUpperCase()} RANKINGS
          </Text>
          
          {sortedLeaderboard.map((entry, index) => {
            const isCurrentUser = entry.userId === '1';
            
            return (
              <View 
                key={entry.userId} 
                style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}
              >
                <LinearGradient
                  colors={isCurrentUser ? 
                    [entry.characterClass.color, Colors.background.overcast] : 
                    [Colors.background.storm, Colors.background.overcast]
                  }
                  style={styles.itemGradient}
                >
                  <View style={styles.itemContent}>
                    <View style={styles.rankContainer}>
                      {getRankIcon(index + 1)}
                    </View>
                    
                    <View style={styles.playerInfo}>
                      <View style={styles.playerHeader}>
                        <Text style={[styles.username, isCurrentUser && styles.currentUserText]}>
                          {entry.username}
                        </Text>
                        {getClassIcon(entry.characterClass.icon, entry.characterClass.color)}
                      </View>
                      <Text style={styles.playerLevel}>Level {entry.level}</Text>
                      <Text style={styles.className}>{entry.characterClass.name}</Text>
                    </View>
                    
                    <View style={styles.statsContainer}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                          {formatDistance(
                            selectedPeriod === 'week' ? entry.weeklyDistance : 
                            selectedPeriod === 'month' ? entry.monthlyDistance : 
                            entry.totalDistance
                          )}
                        </Text>
                        <Text style={styles.statLabel}>
                          {selectedPeriod.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            );
          })}
        </View>

        {/* Community Challenges */}
        <View style={styles.challengesPanel}>
          <Text style={styles.sectionTitle}>COMMUNITY CHALLENGES</Text>
          
          <View style={styles.challengeItem}>
            <LinearGradient
              colors={Colors.difficulty.hard}
              style={styles.challengeGradient}>
              <Text style={styles.challengeTitle}>WEEKEND CHALLENGE</Text>
              <Text style={styles.challengeDescription}>
                Complete 3 runs this weekend to earn bonus energy
              </Text>
              <View style={styles.challengeProgress}>
                <Text style={styles.challengeProgressText}>1/3 Complete</Text>
                <Text style={styles.challengeReward}>+500 Energy Bonus</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.challengeItem}>
            <LinearGradient
              colors={Colors.difficulty.legendary}
              style={styles.challengeGradient}>
              <Text style={styles.challengeTitle}>NIMBUS UNITY</Text>
              <Text style={styles.challengeDescription}>
                Community members run 1000km collectively this month
              </Text>
              <View style={styles.challengeProgress}>
                <Text style={styles.challengeProgressText}>743/1000km</Text>
                <Text style={styles.challengeReward}>Group Rewards</Text>
              </View>
            </LinearGradient>
          </View>
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
    marginBottom: 8,
    marginTop: 8,
  },
  subtitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  currentUserPanel: {
    backgroundColor: Colors.card.background,
    borderWidth: 3,
    borderColor: Colors.primary.skyBlue,
    padding: 16,
    marginBottom: 20,
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: Colors.card.border,
  },
  userGradient: {
    padding: 16,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: Colors.card.border,
    backgroundColor: Colors.background.overcast,
    flex: 1,
    alignItems: 'center',
  },
  periodButtonActive: {
    borderColor: Colors.text.accent,
    backgroundColor: Colors.card.background,
  },
  periodText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
  },
  periodTextActive: {
    color: Colors.text.accent,
  },
  leaderboardContainer: {
    marginBottom: 20,
  },
  leaderboardItem: {
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.card.border,
  },
  currentUserItem: {
    borderColor: Colors.primary.skyBlue,
  },
  itemGradient: {
    padding: 16,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  rankNumber: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.secondary,
  },
  playerInfo: {
    flex: 1,
    marginRight: 16,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
    marginRight: 8,
  },
  currentUserText: {
    color: Colors.primary.skyBlue,
  },
  playerLevel: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  className: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.muted,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 6,
    color: Colors.text.secondary,
  },
  challengesPanel: {
    marginBottom: 20,
  },
  challengeItem: {
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.card.border,
  },
  challengeGradient: {
    padding: 16,
  },
  challengeTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  challengeDescription: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
    lineHeight: 12,
    marginBottom: 12,
  },
  challengeProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeProgressText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.primary,
  },
  challengeReward: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.accent,
  },
  sectionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.accent,
    marginBottom: 16,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
});