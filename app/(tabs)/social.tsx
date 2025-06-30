import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChartBar as BarChart3, Medal, Trophy, Users, Zap, Shield, MapPin, RefreshCw } from 'lucide-react-native';
import { usePixelFont } from '@/hooks/usePixelFont';
import { useAuth } from '@/contexts/AuthContext';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Colors } from '@/constants/Colors';

export default function RankScreen() {
  const fontsLoaded = usePixelFont();
  const { user } = useAuth();
  const { 
    leaderboard, 
    userRank, 
    loading, 
    error, 
    selectedPeriod, 
    setSelectedPeriod, 
    refreshLeaderboard,
    isRefreshing
  } = useLeaderboard();

  if (!fontsLoaded) {
    return null;
  }

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

  // Get character class info
  const getCharacterClassInfo = (classId: string) => {
    switch (classId) {
      case 'speed-runner':
        return {
          id: 'speed-runner',
          name: 'Sky Sprinter',
          color: Colors.classes.speedRunner,
          icon: 'zap',
        };
      case 'endurance-master':
        return {
          id: 'endurance-master',
          name: 'Storm Chaser',
          color: Colors.classes.enduranceMaster,
          icon: 'shield',
        };
      case 'explorer':
        return {
          id: 'explorer',
          name: 'Cloud Walker',
          color: Colors.classes.explorer,
          icon: 'map-pin',
        };
      default:
        return {
          id: 'speed-runner',
          name: 'Sky Sprinter',
          color: Colors.classes.speedRunner,
          icon: 'zap',
        };
    }
  };

  // Find current user in leaderboard
  const currentUserEntry = user ? leaderboard.find(entry => entry.userId === user.id) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshLeaderboard}
            colors={[Colors.primary.skyBlue]}
            tintColor={Colors.primary.skyBlue}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <BarChart3 size={32} color={Colors.primary.skyBlue} />
          <Text style={styles.title}>RANK</Text>
          <Text style={styles.subtitle}>Compete with Fellow Heroes</Text>
        </View>

        {/* Loading State */}
        {loading && !isRefreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.skyBlue} />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={refreshLeaderboard}>
              <RefreshCw size={16} color={Colors.text.primary} />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <>
            {/* Current User Stats */}
            {currentUserEntry && (
              <View style={styles.currentUserPanel}>
                <Text style={styles.sectionTitle}>YOUR RANKING</Text>
                <View style={styles.currentUserCard}>
                  <LinearGradient
                    colors={[getCharacterClassInfo(currentUserEntry.characterClass).color, Colors.background.overcast]}
                    style={styles.userGradient}
                  >
                    <View style={styles.userContent}>
                      <View style={styles.rankContainer}>
                        {getRankIcon(currentUserEntry.rank)}
                      </View>
                      
                      <View style={styles.userInfo}>
                        <View style={styles.userHeader}>
                          <Text style={styles.username}>{currentUserEntry.username}</Text>
                          {getClassIcon(
                            getCharacterClassInfo(currentUserEntry.characterClass).icon, 
                            getCharacterClassInfo(currentUserEntry.characterClass).color
                          )}
                        </View>
                        <Text style={styles.userLevel}>Level {currentUserEntry.level}</Text>
                        <Text style={styles.className}>{getCharacterClassInfo(currentUserEntry.characterClass).name}</Text>
                      </View>
                      
                      <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>
                            {formatDistance(currentUserEntry.value)}
                          </Text>
                          <Text style={styles.statLabel}>
                            {selectedPeriod.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </View>
            )}

            {/* User Rank Display (when not in top entries) */}
            {user && !currentUserEntry && userRank && (
              <View style={styles.userRankPanel}>
                <Text style={styles.userRankTitle}>YOUR CURRENT RANK</Text>
                <Text style={styles.userRankValue}>#{userRank}</Text>
                <Text style={styles.userRankDescription}>
                  Complete more workouts to climb the leaderboard!
                </Text>
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

            {/* Refresh Button */}
            <TouchableOpacity 
              style={styles.refreshButtonContainer} 
              onPress={refreshLeaderboard}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} color={Colors.text.accent} />
              <Text style={styles.refreshButtonText}>
                {isRefreshing ? 'Refreshing...' : 'Refresh Leaderboard'}
              </Text>
            </TouchableOpacity>

            {/* Leaderboard */}
            <View style={styles.leaderboardContainer}>
              <Text style={styles.sectionTitle}>
                {selectedPeriod.toUpperCase()} RANKINGS
              </Text>
              
              {leaderboard.length > 0 ? (
                leaderboard.map((entry) => {
                  const isCurrentUser = user && entry.userId === user.id;
                  const classInfo = getCharacterClassInfo(entry.characterClass);
                  
                  return (
                    <View 
                      key={entry.id} 
                      style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}
                    >
                      <LinearGradient
                        colors={isCurrentUser ? 
                          [classInfo.color, Colors.background.overcast] : 
                          [Colors.background.storm, Colors.background.overcast]
                        }
                        style={styles.itemGradient}
                      >
                        <View style={styles.itemContent}>
                          <View style={styles.rankContainer}>
                            {getRankIcon(entry.rank)}
                          </View>
                          
                          <View style={styles.playerInfo}>
                            <View style={styles.playerHeader}>
                              <Text style={[styles.username, isCurrentUser && styles.currentUserText]}>
                                {entry.username}
                              </Text>
                              {getClassIcon(classInfo.icon, classInfo.color)}
                            </View>
                            <Text style={styles.playerLevel}>Level {entry.level}</Text>
                            <Text style={styles.className}>{classInfo.name}</Text>
                          </View>
                          
                          <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                              <Text style={styles.statValue}>
                                {formatDistance(entry.value)}
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
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <Trophy size={48} color={Colors.text.muted} />
                  <Text style={styles.emptyTitle}>No Rankings Yet</Text>
                  <Text style={styles.emptyText}>
                    Complete workouts to appear on the leaderboard!
                  </Text>
                </View>
              )}
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
    marginBottom: 8,
    marginTop: 8,
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
    backgroundColor: Colors.background.twilight,
    borderWidth: 2,
    borderColor: Colors.card.border,
  },
  errorText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.skyBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  refreshText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
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
  userRankPanel: {
    backgroundColor: Colors.card.background,
    borderWidth: 3,
    borderColor: Colors.primary.skyBlue,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  userRankTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.accent,
    marginBottom: 12,
  },
  userRankValue: {
    fontFamily: 'PressStart2P',
    fontSize: 24,
    color: Colors.primary.skyBlue,
    marginBottom: 12,
  },
  userRankDescription: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
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
  refreshButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 20,
    gap: 8,
  },
  refreshButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
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