import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  coin_reward: number;
  is_hidden: boolean;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  is_completed: boolean;
  unlocked_at: string | null;
}

export interface AchievementWithProgress {
  achievement: Achievement;
  progress: number;
  is_completed: boolean;
  unlocked_at: string | null;
  percentage: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  type: string;
  icon: string;
  color: string;
}

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAchievements: 0,
    unlockedAchievements: 0,
    completionPercentage: 0
  });

  const fetchAchievements = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch all achievements and user progress in a single query
      const { data, error } = await supabase
        .from('achievements')
        .select(`
          *,
          user_achievements!left (
            id,
            progress,
            is_completed,
            unlocked_at
          )
        `)
        .eq('user_achievements.user_id', user.id)
        .order('requirement_value', { ascending: true });
      
      if (error) {
        console.error('Error fetching achievements:', error);
        setError('Failed to load achievements');
        return;
      }
      
      // Process the data to combine achievements with user progress
      const achievementsWithProgress: AchievementWithProgress[] = data.map(item => {
        const userAchievement = item.user_achievements?.[0];
        const progress = userAchievement?.progress || 0;
        const percentage = item.requirement_value > 0 
          ? Math.min(100, (progress / item.requirement_value) * 100) 
          : 0;
        
        return {
          achievement: {
            id: item.id,
            key: item.key,
            title: item.title,
            description: item.description,
            icon: item.icon,
            rarity: item.rarity,
            category: item.category,
            requirement_type: item.requirement_type,
            requirement_value: item.requirement_value,
            xp_reward: item.xp_reward,
            coin_reward: item.coin_reward,
            is_hidden: item.is_hidden
          },
          progress,
          is_completed: userAchievement?.is_completed || false,
          unlocked_at: userAchievement?.unlocked_at || null,
          percentage
        };
      });
      
      setAchievements(achievementsWithProgress);
      
      // Calculate stats
      const unlockedCount = achievementsWithProgress.filter(a => a.is_completed).length;
      setStats({
        totalAchievements: achievementsWithProgress.length,
        unlockedAchievements: unlockedCount,
        completionPercentage: achievementsWithProgress.length > 0 
          ? (unlockedCount / achievementsWithProgress.length) * 100 
          : 0
      });
      
      // Generate active goals from in-progress achievements
      const activeGoals: Goal[] = achievementsWithProgress
        .filter(a => !a.is_completed && a.progress > 0)
        .slice(0, 3) // Limit to 3 active goals
        .map(a => ({
          id: a.achievement.id,
          title: a.achievement.title,
          description: a.achievement.description,
          progress: a.progress,
          target: a.achievement.requirement_value,
          type: a.achievement.requirement_type,
          icon: a.achievement.icon,
          color: getRarityColor(a.achievement.rarity)
        }));
      
      // If we have fewer than 3 active goals, add some from unstarted achievements
      if (activeGoals.length < 3) {
        const unstarted = achievementsWithProgress
          .filter(a => !a.is_completed && a.progress === 0)
          .slice(0, 3 - activeGoals.length);
          
        unstarted.forEach(a => {
          activeGoals.push({
            id: a.achievement.id,
            title: a.achievement.title,
            description: a.achievement.description,
            progress: 0,
            target: a.achievement.requirement_value,
            type: a.achievement.requirement_type,
            icon: a.achievement.icon,
            color: getRarityColor(a.achievement.rarity)
          });
        });
      }
      
      setGoals(activeGoals);
      
    } catch (err) {
      console.error('Error in fetchAchievements:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Helper function to get color based on rarity
  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'bronze': return '#cd7f32';
      case 'silver': return '#c0c0c0';
      case 'gold': return '#ffd700';
      case 'platinum': return '#e5e4e2';
      case 'legendary': return '#ff6b6b';
      default: return '#cd7f32';
    }
  };

  // Fetch achievements when user changes
  useEffect(() => {
    fetchAchievements();
    
    // Set up a refresh interval (every 60 seconds)
    const interval = setInterval(() => {
      fetchAchievements();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [fetchAchievements]);

  return {
    achievements,
    goals,
    loading,
    error,
    stats,
    refreshAchievements: fetchAchievements
  };
}