import { useState, useEffect, useCallback } from 'react';
import { UserStats, RunData, CharacterPath } from '@/types/stats';
import { UserStatsService } from '@/services/UserStatsService';
import { useAuth } from '@/contexts/AuthContext';

export interface UseUserStatsReturn {
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  updateStatsAfterRun: (runData: RunData) => Promise<{ 
    updatedStats: UserStats | null; 
    newAchievements: any[];
  }>;
  changeCharacterPath: (newPath: CharacterPath) => Promise<boolean>;
  upgradeSkill: (skillId: string) => Promise<boolean>;
  getExperienceForNextLevel: () => number;
  getSkillTrees: () => any;
  getPathBonuses: (path: CharacterPath) => any;
  getPathInfo: (path: CharacterPath) => any;
}

export function useUserStats(): UseUserStatsReturn {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userStatsService = UserStatsService.getInstance();

  const refreshStats = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setStats(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Refreshing user stats for user:', user.id);
      let userStats = await userStatsService.getUserStats(user.id);
      
      // If no stats exist, create them
      if (!userStats) {
        console.log('📝 No stats found, creating initial stats...');
        userStats = await userStatsService.createUserStats(user.id);
      }

      setStats(userStats);
      console.log('✅ User stats refreshed:', userStats);
    } catch (err) {
      console.error('❌ Error refreshing stats:', err);
      setError('Failed to load user stats');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, userStatsService]);

  const updateStatsAfterRun = useCallback(async (runData: RunData): Promise<{ 
    updatedStats: UserStats | null; 
    newAchievements: any[];
  }> => {
    if (!user) return { updatedStats: null, newAchievements: [] };

    try {
      console.log('🏃‍♂️ Updating stats after run:', runData);
      const result = await userStatsService.updateStatsAfterRun(user.id, runData);
      if (result.updatedStats) {
        setStats(result.updatedStats);
        console.log('✅ Stats updated successfully:', result.updatedStats);
      }
      return result;
    } catch (err) {
      console.error('❌ Error updating stats after run:', err);
      setError('Failed to update stats');
      return { updatedStats: null, newAchievements: [] };
    }
  }, [user, userStatsService]);

  const changeCharacterPath = useCallback(async (newPath: CharacterPath): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = await userStatsService.changeCharacterPath(user.id, newPath);
      if (success) {
        await refreshStats(); // Refresh to get updated data
      }
      return success;
    } catch (err) {
      console.error('Error changing character path:', err);
      setError('Failed to change character path');
      return false;
    }
  }, [user, userStatsService, refreshStats]);

  const upgradeSkill = useCallback(async (skillId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = await userStatsService.upgradeSkill(user.id, skillId);
      if (success) {
        await refreshStats(); // Refresh to get updated data
      }
      return success;
    } catch (err) {
      console.error('Error upgrading skill:', err);
      setError('Failed to upgrade skill');
      return false;
    }
  }, [user, userStatsService, refreshStats]);

  const getExperienceForNextLevel = useCallback((): number => {
    if (!stats) return 0;
    return userStatsService.getExperienceForNextLevel(stats.level);
  }, [stats, userStatsService]);

  const getSkillTrees = useCallback(() => {
    return userStatsService.getSkillTrees();
  }, [userStatsService]);

  const getPathBonuses = useCallback((path: CharacterPath) => {
    return userStatsService.getPathBonuses(path);
  }, [userStatsService]);

  const getPathInfo = useCallback((path: CharacterPath) => {
    return userStatsService.getPathInfo(path);
  }, [userStatsService]);

  // Load stats when user changes
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Set up periodic refresh to catch external updates (like from workout completion)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(() => {
      refreshStats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, user, refreshStats]);

  return {
    stats,
    isLoading,
    error,
    refreshStats,
    updateStatsAfterRun,
    changeCharacterPath,
    upgradeSkill,
    getExperienceForNextLevel,
    getSkillTrees,
    getPathBonuses,
    getPathInfo,
  };
}