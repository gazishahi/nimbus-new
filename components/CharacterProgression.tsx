import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Shield, MapPin, Star, Plus, Lock, CircleCheck as CheckCircle } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useUserStats } from '@/hooks/useUserStats';
import { CharacterPath, SkillNode } from '@/types/stats';
import PixelButton from './PixelButton';

interface CharacterProgressionProps {
  onPathChange?: (newPath: CharacterPath) => void;
}

export default function CharacterProgression({ onPathChange }: CharacterProgressionProps) {
  const { 
    stats, 
    isLoading, 
    changeCharacterPath, 
    upgradeSkill, 
    getExperienceForNextLevel,
    getSkillTrees,
    getPathBonuses,
    getPathInfo 
  } = useUserStats();
  
  const [selectedPath, setSelectedPath] = useState<CharacterPath | null>(null);

  if (isLoading || !stats) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading character data...</Text>
      </View>
    );
  }

  const experienceToNextLevel = getExperienceForNextLevel();
  const levelProgress = experienceToNextLevel > 0 ? (stats.experience / experienceToNextLevel) * 100 : 0;
  const skillTrees = getSkillTrees();
  const currentPathInfo = getPathInfo(stats.characterPath);
  const currentPathBonuses = getPathBonuses(stats.characterPath);

  const handlePathChange = async (newPath: CharacterPath) => {
    if (newPath === stats.characterPath) return;

    Alert.alert(
      'Change Character Path',
      `Are you sure you want to change to ${getPathInfo(newPath).name}? This will reset all your skill points and allow you to redistribute them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change Path',
          style: 'destructive',
          onPress: async () => {
            const success = await changeCharacterPath(newPath);
            if (success) {
              onPathChange?.(newPath);
              Alert.alert('Success', 'Character path changed successfully!');
            } else {
              Alert.alert('Error', 'Failed to change character path. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSkillUpgrade = async (skillId: string) => {
    const success = await upgradeSkill(skillId);
    if (success) {
      Alert.alert('Skill Upgraded!', 'Your skill has been improved.');
    } else {
      Alert.alert('Upgrade Failed', 'Unable to upgrade skill. Check if you have enough skill points.');
    }
  };

  const renderSkillNode = (skill: SkillNode, currentLevel: number) => {
    const isMaxLevel = currentLevel >= skill.maxLevel;
    const canUpgrade = stats.skillPoints >= skill.cost && !isMaxLevel;
    const hasPrerequisites = skill.prerequisites.every(prereq => 
      (stats.pathSkills[prereq] || 0) > 0
    );
    const isUnlocked = skill.prerequisites.length === 0 || hasPrerequisites;

    return (
      <View key={skill.id} style={[
        styles.skillNode,
        isUnlocked ? styles.skillNodeUnlocked : styles.skillNodeLocked,
        isMaxLevel && styles.skillNodeMaxed
      ]}>
        <View style={styles.skillHeader}>
          <View style={styles.skillIconContainer}>
            {isMaxLevel ? (
              <CheckCircle size={16} color={Colors.status.success} />
            ) : isUnlocked ? (
              <Star size={16} color={Colors.text.accent} />
            ) : (
              <Lock size={16} color={Colors.tabBar.inactive} />
            )}
          </View>
          <Text style={[
            styles.skillTitle,
            { color: isUnlocked ? Colors.text.primary : Colors.tabBar.inactive }
          ]}>
            {skill.name}
          </Text>
          {canUpgrade && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => handleSkillUpgrade(skill.id)}
            >
              <Plus size={16} color={Colors.status.success} />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={[
          styles.skillDescription,
          { color: isUnlocked ? Colors.text.secondary : Colors.text.muted }
        ]}>
          {skill.description}
        </Text>
        
        <View style={styles.skillProgress}>
          <Text style={[
            styles.skillLevel,
            { color: isUnlocked ? Colors.text.accent : Colors.tabBar.inactive }
          ]}>
            Level {currentLevel}/{skill.maxLevel}
          </Text>
          {!isMaxLevel && (
            <Text style={styles.skillCost}>
              Cost: {skill.cost} pts
            </Text>
          )}
        </View>

        {skill.prerequisites.length > 0 && (
          <View style={styles.prerequisites}>
            <Text style={styles.prerequisitesLabel}>Requires:</Text>
            {skill.prerequisites.map(prereq => (
              <Text key={prereq} style={styles.prerequisiteItem}>
                • {prereq.replace('-', ' ')}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderPathOption = (path: CharacterPath) => {
    const pathInfo = getPathInfo(path);
    const pathBonuses = getPathBonuses(path);
    const isActive = path === stats.characterPath;

    return (
      <TouchableOpacity
        key={path}
        style={[styles.pathOption, isActive && styles.pathOptionActive]}
        onPress={() => handlePathChange(path)}
      >
        <LinearGradient
          colors={isActive ? [pathInfo.color, Colors.background.overcast] : [Colors.background.storm, Colors.background.overcast]}
          style={styles.pathGradient}
        >
          <View style={styles.pathContent}>
            <View style={styles.pathIcon}>
              {path === 'speed-runner' && <Zap size={24} color="#fff" />}
              {path === 'endurance-master' && <Shield size={24} color="#fff" />}
              {path === 'explorer' && <MapPin size={24} color="#fff" />}
            </View>
            <View style={styles.pathInfo}>
              <Text style={styles.pathName}>{pathInfo.name}</Text>
              <Text style={styles.pathDescription}>{pathInfo.description}</Text>
              <View style={styles.pathBonuses}>
                <Text style={styles.bonusText}>Speed: x{pathBonuses.speedBonus}</Text>
                <Text style={styles.bonusText}>Endurance: x{pathBonuses.enduranceBonus}</Text>
                <Text style={styles.bonusText}>Discovery: x{pathBonuses.explorationBonus}</Text>
              </View>
            </View>
          </View>
          {isActive && (
            <View style={styles.activeIndicator}>
              <Text style={styles.activeText}>ACTIVE</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Character Header */}
      <LinearGradient
        colors={[currentPathInfo.color, Colors.background.overcast]}
        style={styles.characterHeader}
      >
        <View style={styles.characterInfo}>
          <Text style={styles.characterLevel}>LEVEL {stats.level}</Text>
          <Text style={styles.characterPath}>{currentPathInfo.name}</Text>
          <Text style={styles.skillPointsAvailable}>
            {stats.skillPoints} Skill Points Available
          </Text>
        </View>
        <View style={styles.characterIcon}>
          {stats.characterPath === 'speed-runner' && <Zap size={48} color="#fff" />}
          {stats.characterPath === 'endurance-master' && <Shield size={48} color="#fff" />}
          {stats.characterPath === 'explorer' && <MapPin size={48} color="#fff" />}
        </View>
      </LinearGradient>

      {/* Experience Progress */}
      <View style={styles.experiencePanel}>
        <Text style={styles.sectionTitle}>EXPERIENCE PROGRESS</Text>
        <View style={styles.xpBar}>
          <View style={[styles.xpFill, { width: `${levelProgress}%` }]} />
        </View>
        <Text style={styles.xpText}>
          {stats.experience} / {experienceToNextLevel} XP
        </Text>
        <Text style={styles.nextLevelText}>
          {experienceToNextLevel - stats.experience} XP to Level {stats.level + 1}
        </Text>
      </View>

      {/* Character Stats */}
      <View style={styles.statsPanel}>
        <Text style={styles.sectionTitle}>RUNNING STATISTICS</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalRuns}</Text>
            <Text style={styles.statLabel}>TOTAL RUNS</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {(stats.totalDistance / 1000).toFixed(1)}km
            </Text>
            <Text style={styles.statLabel}>DISTANCE</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.floor(stats.totalTime / 3600)}h {Math.floor((stats.totalTime % 3600) / 60)}m
            </Text>
            <Text style={styles.statLabel}>TIME</Text>
          </View>
        </View>
      </View>

      {/* Skill Tree */}
      <View style={styles.skillPanel}>
        <Text style={styles.sectionTitle}>NIMBUS ABILITIES</Text>
        <Text style={styles.skillDescription}>
          Upgrade your abilities to become a master cloud runner
        </Text>
        
        {skillTrees[stats.characterPath].map((tier, tierIndex) => (
          <View key={tierIndex} style={styles.skillTier}>
            <Text style={styles.tierTitle}>Tier {tierIndex + 1}</Text>
            {tier.map(skill => renderSkillNode(skill, stats.pathSkills[skill.id] || 0))}
          </View>
        ))}
      </View>

      {/* Path Selection */}
      <View style={styles.pathPanel}>
        <Text style={styles.sectionTitle}>CHARACTER PATHS</Text>
        <Text style={styles.pathPanelDescription}>
          Choose your specialization. Changing paths will reset your skill points.
        </Text>
        
        {(['speed-runner', 'endurance-master', 'explorer'] as CharacterPath[]).map(renderPathOption)}
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.nightSky,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.nightSky,
  },
  loadingText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.secondary,
  },
  characterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    marginVertical: 16,
    marginHorizontal: 16,
    borderWidth: 3,
    borderColor: Colors.card.border,
  },
  characterInfo: {
    flex: 1,
  },
  characterLevel: {
    fontFamily: 'PressStart2P',
    fontSize: 18,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  characterPath: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  skillPointsAvailable: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.accent,
  },
  characterIcon: {
    padding: 16,
  },
  experiencePanel: {
    backgroundColor: Colors.card.background,
    borderWidth: 3,
    borderColor: Colors.card.border,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  xpBar: {
    height: 20,
    backgroundColor: Colors.progress.background,
    borderWidth: 2,
    borderColor: Colors.background.storm,
    marginBottom: 8,
  },
  xpFill: {
    height: '100%',
    backgroundColor: Colors.progress.success,
  },
  xpText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  nextLevelText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  statsPanel: {
    backgroundColor: Colors.card.background,
    borderWidth: 3,
    borderColor: Colors.card.border,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  skillPanel: {
    backgroundColor: Colors.card.background,
    borderWidth: 3,
    borderColor: Colors.card.border,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  skillDescription: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16,
  },
  skillTier: {
    marginBottom: 20,
  },
  tierTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.accent,
    marginBottom: 12,
    textAlign: 'center',
  },
  skillNode: {
    padding: 12,
    borderWidth: 2,
    backgroundColor: Colors.background.overcast,
    marginBottom: 12,
  },
  skillNodeUnlocked: {
    borderColor: Colors.text.accent,
  },
  skillNodeLocked: {
    borderColor: Colors.background.storm,
    opacity: 0.6,
  },
  skillNodeMaxed: {
    borderColor: Colors.status.success,
    backgroundColor: Colors.status.success + '20',
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillIconContainer: {
    marginRight: 8,
  },
  skillTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: Colors.status.success,
    borderWidth: 1,
    borderColor: Colors.button.success.border,
    padding: 4,
  },
  skillDescription: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    lineHeight: 12,
    marginBottom: 8,
  },
  skillProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillLevel: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
  },
  skillCost: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.status.warning,
  },
  prerequisites: {
    backgroundColor: Colors.background.storm,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  prerequisitesLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.accent,
    marginBottom: 4,
  },
  prerequisiteItem: {
    fontFamily: 'PressStart2P',
    fontSize: 7,
    color: Colors.text.muted,
    lineHeight: 10,
  },
  pathPanel: {
    backgroundColor: Colors.card.background,
    borderWidth: 3,
    borderColor: Colors.card.border,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  pathPanelDescription: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 12,
  },
  pathOption: {
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.card.border,
  },
  pathOptionActive: {
    borderColor: Colors.text.accent,
  },
  pathGradient: {
    padding: 16,
  },
  pathContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pathIcon: {
    marginRight: 16,
  },
  pathInfo: {
    flex: 1,
  },
  pathName: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  pathDescription: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
    lineHeight: 12,
    marginBottom: 8,
  },
  pathBonuses: {
    flexDirection: 'row',
    gap: 8,
  },
  bonusText: {
    fontFamily: 'PressStart2P',
    fontSize: 7,
    color: Colors.text.muted,
  },
  activeIndicator: {
    backgroundColor: Colors.status.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.button.success.border,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  activeText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.primary,
  },
  sectionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.accent,
    marginBottom: 12,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
});