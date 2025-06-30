import { useState, useEffect, useCallback } from 'react';
import { AchievementProgress, NewAchievement } from '@/types/achievements';
import { AchievementsService } from '@/services/AchievementsService';
import { useAuth } from '@/contexts/AuthContext';

export interface UseAchievementsReturn {
  achievements: AchievementProgress[];
  completedAchievements: AchievementProgress[];
  isLoading: boolean;
  error: string | null;
  stats: {
    totalAchievements: number;
    completedAchievements: number;
    completionPercentage: number;
    totalXpEarned: number;
    totalCoinsEarned: number;
    rarityBreakdown: Record<string, number>;
  };
  refreshAchievements: () => Promise<void>;
  checkAndAwardAchievements: () => Promise<NewAchievement[]>;
  checkSingleRunAchievements: (distance: number) => Promise<NewAchievement[]>;
  getAchievementsByCategory: (category: string) => AchievementProgress[];
  getRecentAchievements: (days?: number) => Promise<AchievementProgress[]>;
}

export function useAchievements(): UseAchievementsReturn {
  const { user, isAuthenticated } = useAuth();
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAchievements: 0,
    completedAchievements: 0,
    completionPercentage: 0,
    totalXpEarned: 0,
    totalCoinsEarned: 0,
    rarityBreakdown: {},
  });

  const achievementsService = AchievementsService.getInstance();

  const refreshAchievements = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setAchievements([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [userAchievements, achievementStats] = await Promise.all([
        achievementsService.getUserAchievements(user.id),
        achievementsService.getAchievementStats(user.id),
      ]);

      setAchievements(userAchievements);
      setStats(achievementStats);
    } catch (err) {
      console.error('Error refreshing achievements:', err);
      setError('Failed to load achievements');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, achievementsService]);

  const checkAndAwardAchievements = useCallback(async (): Promise<NewAchievement[]> => {
    if (!user) return [];

    try {
      const newAchievements = await achievementsService.checkAndAwardAchievements(user.id);
      if (newAchievements.length > 0) {
        // Refresh achievements to get updated progress
        await refreshAchievements();
      }
      return newAchievements;
    } catch (err) {
      console.error('Error checking achievements:', err);
      return [];
    }
  }, [user, achievementsService, refreshAchievements]);

  const checkSingleRunAchievements = useCallback(async (distance: number): Promise<NewAchievement[]> => {
    if (!user) return [];

    try {
      const newAchievements = await achievementsService.checkSingleRunAchievements(user.id, distance);
      if (newAchievements.length > 0) {
        // Refresh achievements to get updated progress
        await refreshAchievements();
      }
      return newAchievements;
    } catch (err) {
      console.error('Error checking single run achievements:', err);
      return [];
    }
  }, [user, achievementsService, refreshAchievements]);

  const getAchievementsByCategory = useCallback((category: string): AchievementProgress[] => {
    return achievements.filter(achievement => achievement.achievement.category === category);
  }, [achievements]);

  const getRecentAchievements = useCallback(async (days: number = 30): Promise<AchievementProgress[]> => {
    if (!user) return [];

    try {
      return await achievementsService.getRecentAchievements(user.id, days);
    } catch (err) {
      console.error('Error getting recent achievements:', err);
      return [];
    }
  }, [user, achievementsService]);

  // Load achievements when user changes
  useEffect(() => {
    refreshAchievements();
  }, [refreshAchievements]);

  const completedAchievements = achievements.filter(a => a.isCompleted);

  return {
    achievements,
    completedAchievements,
    isLoading,
    error,
    stats,
    refreshAchievements,
    checkAndAwardAchievements,
    checkSingleRunAchievements,
    getAchievementsByCategory,
    getRecentAchievements,
  };
}