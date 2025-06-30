import { supabase } from '@/lib/supabase';
import { Achievement, UserAchievement, AchievementProgress, NewAchievement } from '@/types/achievements';

export class AchievementsService {
  private static instance: AchievementsService;

  private constructor() {}

  static getInstance(): AchievementsService {
    if (!AchievementsService.instance) {
      AchievementsService.instance = new AchievementsService();
    }
    return AchievementsService.instance;
  }

  // Get all achievements with user progress
  async getUserAchievements(userId: string): Promise<AchievementProgress[]> {
    try {
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
        .eq('user_achievements.user_id', userId)
        .order('requirement_value', { ascending: true });

      if (error) {
        console.error('Error fetching user achievements:', error);
        return [];
      }

      return data.map(achievement => {
        const userAchievement = achievement.user_achievements?.[0];
        const progress = userAchievement?.progress || 0;
        const progressPercentage = Math.min((progress / achievement.requirement_value) * 100, 100);

        return {
          achievement: {
            id: achievement.id,
            key: achievement.key,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            rarity: achievement.rarity,
            category: achievement.category,
            requirementType: achievement.requirement_type,
            requirementValue: achievement.requirement_value,
            xpReward: achievement.xp_reward,
            coinReward: achievement.coin_reward,
            isHidden: achievement.is_hidden,
            createdAt: new Date(achievement.created_at),
          },
          progress,
          isCompleted: userAchievement?.is_completed || false,
          unlockedAt: userAchievement?.unlocked_at ? new Date(userAchievement.unlocked_at) : null,
          progressPercentage,
        };
      });
    } catch (error) {
      console.error('Error in getUserAchievements:', error);
      return [];
    }
  }

  // Get only completed achievements for a user
  async getCompletedAchievements(userId: string): Promise<AchievementProgress[]> {
    try {
      const allAchievements = await this.getUserAchievements(userId);
      return allAchievements.filter(achievement => achievement.isCompleted);
    } catch (error) {
      console.error('Error in getCompletedAchievements:', error);
      return [];
    }
  }

  // Check and award achievements after stats update
  async checkAndAwardAchievements(userId: string): Promise<NewAchievement[]> {
    try {
      const { data, error } = await supabase.rpc('check_and_award_achievements', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error checking achievements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in checkAndAwardAchievements:', error);
      return [];
    }
  }

  // Check single run achievements (for distance-based achievements)
  async checkSingleRunAchievements(userId: string, distance: number): Promise<NewAchievement[]> {
    try {
      const { data, error } = await supabase.rpc('check_single_run_achievements', {
        p_user_id: userId,
        p_distance: distance
      });

      if (error) {
        console.error('Error checking single run achievements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in checkSingleRunAchievements:', error);
      return [];
    }
  }

  // Get achievement statistics for a user
  async getAchievementStats(userId: string): Promise<{
    totalAchievements: number;
    completedAchievements: number;
    completionPercentage: number;
    totalXpEarned: number;
    totalCoinsEarned: number;
    rarityBreakdown: Record<string, number>;
  }> {
    try {
      const achievements = await this.getUserAchievements(userId);
      const completed = achievements.filter(a => a.isCompleted);
      
      const totalXpEarned = completed.reduce((sum, a) => sum + a.achievement.xpReward, 0);
      const totalCoinsEarned = completed.reduce((sum, a) => sum + a.achievement.coinReward, 0);
      
      const rarityBreakdown = completed.reduce((breakdown, a) => {
        breakdown[a.achievement.rarity] = (breakdown[a.achievement.rarity] || 0) + 1;
        return breakdown;
      }, {} as Record<string, number>);

      return {
        totalAchievements: achievements.length,
        completedAchievements: completed.length,
        completionPercentage: (completed.length / achievements.length) * 100,
        totalXpEarned,
        totalCoinsEarned,
        rarityBreakdown,
      };
    } catch (error) {
      console.error('Error in getAchievementStats:', error);
      return {
        totalAchievements: 0,
        completedAchievements: 0,
        completionPercentage: 0,
        totalXpEarned: 0,
        totalCoinsEarned: 0,
        rarityBreakdown: {},
      };
    }
  }

  // Get achievements by category
  async getAchievementsByCategory(userId: string, category: string): Promise<AchievementProgress[]> {
    try {
      const allAchievements = await this.getUserAchievements(userId);
      return allAchievements.filter(achievement => achievement.achievement.category === category);
    } catch (error) {
      console.error('Error in getAchievementsByCategory:', error);
      return [];
    }
  }

  // Get recent achievements (last 30 days)
  async getRecentAchievements(userId: string, days: number = 30): Promise<AchievementProgress[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const allAchievements = await this.getUserAchievements(userId);
      return allAchievements.filter(achievement => 
        achievement.isCompleted && 
        achievement.unlockedAt && 
        achievement.unlockedAt >= cutoffDate
      );
    } catch (error) {
      console.error('Error in getRecentAchievements:', error);
      return [];
    }
  }
}

export default AchievementsService;