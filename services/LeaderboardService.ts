import { supabase } from '@/lib/supabase';

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  displayName?: string;
  level: number;
  characterClass: string;
  value: number;
  rank: number;
  period: 'week' | 'month' | 'total';
}

export class LeaderboardService {
  private static instance: LeaderboardService;

  private constructor() {}

  static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  /**
   * Fetch leaderboard data for a specific period
   */
  async getLeaderboard(period: 'week' | 'month' | 'total'): Promise<LeaderboardEntry[]> {
    try {
      console.log('🏆 Fetching leaderboard data for period:', period);
      
      // Determine which leaderboard type to query based on selected period
      const leaderboardType = period === 'week' 
        ? 'weekly_distance' 
        : period === 'month' 
        ? 'monthly_distance' 
        : 'level_ranking';
      
      // Get current date periods
      const now = new Date();
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      currentWeekStart.setHours(0, 0, 0, 0);
      
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Query the appropriate leaderboard data
      let { data: leaderboardEntries, error: leaderboardError } = await supabase
        .from('leaderboards')
        .select(`
          id,
          user_id,
          value,
          rank_position,
          profiles:user_id(
            username,
            display_name
          ),
          user_stats:user_id(
            level,
            character_class,
            total_distance
          )
        `)
        .eq('leaderboard_type', leaderboardType)
        .order('rank_position', { ascending: true })
        .limit(20);
      
      if (leaderboardError) {
        console.error('Error fetching leaderboard:', leaderboardError);
        throw new Error('Failed to load leaderboard data');
      }
      
      // If we're looking for total distance but don't have a specific leaderboard for it,
      // we can use the user_stats table directly
      if (period === 'total' && (!leaderboardEntries || leaderboardEntries.length === 0)) {
        console.log('🏆 No total leaderboard found, querying user_stats directly');
        
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select(`
            user_id,
            level,
            character_class,
            total_distance,
            profiles:user_id(
              username,
              display_name
            )
          `)
          .order('total_distance', { ascending: false })
          .limit(20);
        
        if (statsError) {
          console.error('Error fetching user stats:', statsError);
          throw new Error('Failed to load leaderboard data');
        }
        
        // Transform stats data to match leaderboard format
        leaderboardEntries = statsData.map((entry, index) => ({
          id: `total-${entry.user_id}`,
          user_id: entry.user_id,
          value: entry.total_distance,
          rank_position: index + 1,
          profiles: entry.profiles,
          user_stats: {
            level: entry.level,
            character_class: entry.character_class,
            total_distance: entry.total_distance
          }
        }));
      }
      
      // If we still don't have data, return empty array
      if (!leaderboardEntries || leaderboardEntries.length === 0) {
        console.log('🏆 No leaderboard data found');
        return [];
      }
      
      // Transform the data into our LeaderboardEntry format
      const transformedData: LeaderboardEntry[] = leaderboardEntries.map(entry => {
        return {
          id: entry.id,
          userId: entry.user_id,
          username: entry.profiles?.username || entry.profiles?.display_name || 'Unknown Runner',
          displayName: entry.profiles?.display_name,
          level: entry.user_stats?.level || 1,
          characterClass: entry.user_stats?.character_class || 'speed-runner',
          value: entry.value || 0,
          rank: entry.rank_position || 0,
          period
        };
      });
      
      console.log(`🏆 Fetched ${transformedData.length} leaderboard entries`);
      return transformedData;
      
    } catch (err) {
      console.error('Error in getLeaderboard:', err);
      throw err;
    }
  }

  /**
   * Update leaderboards with latest data
   * This would typically be called by a cron job or after workouts are completed
   */
  async updateLeaderboards(): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('update_leaderboards');
      
      if (error) {
        console.error('Error updating leaderboards:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error in updateLeaderboards:', err);
      return false;
    }
  }

  /**
   * Get user's rank for a specific period
   */
  async getUserRank(userId: string, period: 'week' | 'month' | 'total'): Promise<number | null> {
    try {
      const leaderboardType = period === 'week' 
        ? 'weekly_distance' 
        : period === 'month' 
        ? 'monthly_distance' 
        : 'level_ranking';
      
      const { data, error } = await supabase
        .from('leaderboards')
        .select('rank_position')
        .eq('leaderboard_type', leaderboardType)
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No record found
          return null;
        }
        console.error('Error fetching user rank:', error);
        throw new Error('Failed to load user rank');
      }
      
      return data?.rank_position || null;
    } catch (err) {
      console.error('Error in getUserRank:', err);
      return null;
    }
  }
}

export default LeaderboardService;