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
        : 'total_distance';
      
      // Get current date periods
      const now = new Date();
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      currentWeekStart.setHours(0, 0, 0, 0);
      
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // For total distance, we use a fixed start date
      const totalPeriodStart = period === 'total' ? '2000-01-01' : undefined;
      
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
            display_name,
            weekly_distance,
            monthly_distance,
            all_time_distance
          )
        `)
        .eq('leaderboard_type', leaderboardType)
        .order('rank_position', { ascending: true })
        .limit(50);
      
      if (leaderboardError) {
        console.error('Error fetching leaderboard:', leaderboardError);
        
        // If the leaderboard doesn't exist yet, try to get data directly from profiles
        if (leaderboardError.code === 'PGRST116') {
          return this.getLeaderboardFromProfiles(period);
        }
        
        throw new Error('Failed to load leaderboard data');
      }
      
      // If we don't have data, try to get it from profiles
      if (!leaderboardEntries || leaderboardEntries.length === 0) {
        console.log('🏆 No leaderboard entries found, trying profiles table');
        return this.getLeaderboardFromProfiles(period);
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
   * Get leaderboard data directly from profiles table
   * This is a fallback when the leaderboards table doesn't have data
   */
  private async getLeaderboardFromProfiles(period: 'week' | 'month' | 'total'): Promise<LeaderboardEntry[]> {
    try {
      console.log('🏆 Fetching leaderboard data from profiles for period:', period);
      
      // Determine which field to sort by
      const distanceField = period === 'week' 
        ? 'weekly_distance' 
        : period === 'month' 
        ? 'monthly_distance' 
        : 'all_time_distance';
      
      // Query profiles with user_stats join
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          weekly_distance,
          monthly_distance,
          all_time_distance,
          user_stats:id(
            level,
            character_class
          )
        `)
        .order(distanceField, { ascending: false })
        .gt(distanceField, 0)
        .limit(50);
      
      if (error) {
        console.error('Error fetching profiles for leaderboard:', error);
        throw new Error('Failed to load leaderboard data from profiles');
      }
      
      if (!data || data.length === 0) {
        console.log('🏆 No profile data found with distance > 0');
        return [];
      }
      
      // Transform the data into our LeaderboardEntry format
      const transformedData: LeaderboardEntry[] = data.map((profile, index) => {
        // Get the appropriate distance value based on period
        const value = period === 'week' 
          ? profile.weekly_distance 
          : period === 'month' 
          ? profile.monthly_distance 
          : profile.all_time_distance;
        
        return {
          id: `${period}-${profile.id}`,
          userId: profile.id,
          username: profile.username || profile.display_name || 'Unknown Runner',
          displayName: profile.display_name,
          level: profile.user_stats?.level || 1,
          characterClass: profile.user_stats?.character_class || 'speed-runner',
          value: value || 0,
          rank: index + 1, // Rank based on the order returned from the query
          period
        };
      });
      
      console.log(`🏆 Fetched ${transformedData.length} profile entries for leaderboard`);
      return transformedData;
      
    } catch (err) {
      console.error('Error in getLeaderboardFromProfiles:', err);
      return [];
    }
  }

  /**
   * Update leaderboards with latest data
   * This would typically be called by a cron job or after workouts are completed
   */
  async updateLeaderboards(): Promise<boolean> {
    try {
      console.log('🔄 Updating leaderboards...');
      const { error } = await supabase.rpc('update_leaderboards');
      
      if (error) {
        console.error('Error updating leaderboards:', error);
        return false;
      }
      
      console.log('✅ Leaderboards updated successfully');
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
      console.log('🔍 Getting rank for user:', userId, 'period:', period);
      
      const leaderboardType = period === 'week' 
        ? 'weekly_distance' 
        : period === 'month' 
        ? 'monthly_distance' 
        : 'total_distance';
      
      // First try to get rank from leaderboards table
      const { data, error } = await supabase
        .from('leaderboards')
        .select('rank_position')
        .eq('leaderboard_type', leaderboardType)
        .eq('user_id', userId)
        .single();
      
      if (!error && data) {
        console.log('✅ Found user rank in leaderboards table:', data.rank_position);
        return data.rank_position;
      }
      
      // If not found in leaderboards table, try to calculate it from profiles
      console.log('🔄 Calculating user rank from profiles...');
      
      // Get the user's distance value
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select(period === 'week' ? 'weekly_distance' : period === 'month' ? 'monthly_distance' : 'all_time_distance')
        .eq('id', userId)
        .single();
      
      if (userError || !userProfile) {
        console.error('Error getting user profile:', userError);
        return null;
      }
      
      const userDistance = period === 'week' 
        ? userProfile.weekly_distance 
        : period === 'month' 
        ? userProfile.monthly_distance 
        : userProfile.all_time_distance;
      
      // If user has no distance, they're unranked
      if (!userDistance || userDistance === 0) {
        console.log('⚠️ User has no distance for this period, unranked');
        return null;
      }
      
      // Count how many users have more distance than this user
      const distanceField = period === 'week' 
        ? 'weekly_distance' 
        : period === 'month' 
        ? 'monthly_distance' 
        : 'all_time_distance';
      
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt(distanceField, userDistance);
      
      if (countError) {
        console.error('Error counting users with more distance:', countError);
        return null;
      }
      
      // Rank is count + 1 (number of users with more distance, plus one)
      const calculatedRank = (count || 0) + 1;
      console.log('✅ Calculated user rank from profiles:', calculatedRank);
      
      return calculatedRank;
    } catch (err) {
      console.error('Error in getUserRank:', err);
      return null;
    }
  }

  /**
   * Get comprehensive rankings for a user
   */
  async getUserRankings(userId: string): Promise<{
    weekly: { rank: number | null; value: number };
    monthly: { rank: number | null; value: number };
    total: { rank: number | null; value: number };
    level: { rank: number | null; value: number };
  }> {
    try {
      console.log('🔍 Getting all rankings for user:', userId);
      
      // Try to get rankings from the database function
      const { data, error } = await supabase
        .rpc('get_user_rankings', { p_user_id: userId });
      
      if (!error && data) {
        console.log('✅ Got user rankings from database function:', data);
        
        // Get the user's profile to get distance values
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('weekly_distance, monthly_distance, all_time_distance')
          .eq('id', userId)
          .single();
          
        if (profileError) {
          console.error('Error getting user profile:', profileError);
          return {
            weekly: { rank: data.weekly_rank, value: 0 },
            monthly: { rank: data.monthly_rank, value: 0 },
            total: { rank: data.total_rank, value: 0 },
            level: { rank: data.level_rank, value: 0 }
          };
        }
        
        // Get the user's level
        const { data: userStats, error: statsError } = await supabase
          .from('user_stats')
          .select('level')
          .eq('user_id', userId)
          .single();
          
        const level = statsError ? 1 : (userStats?.level || 1);
        
        return {
          weekly: { rank: data.weekly_rank, value: profile?.weekly_distance || 0 },
          monthly: { rank: data.monthly_rank, value: profile?.monthly_distance || 0 },
          total: { rank: data.total_rank, value: profile?.all_time_distance || 0 },
          level: { rank: data.level_rank, value: level }
        };
      }
      
      // If the function fails, calculate rankings manually
      console.log('⚠️ Database function failed, calculating rankings manually');
      
      const weeklyRank = await this.getUserRank(userId, 'week');
      const monthlyRank = await this.getUserRank(userId, 'month');
      const totalRank = await this.getUserRank(userId, 'total');
      
      // Get the user's profile to get distance values
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('weekly_distance, monthly_distance, all_time_distance')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.error('Error getting user profile:', profileError);
        return {
          weekly: { rank: weeklyRank, value: 0 },
          monthly: { rank: monthlyRank, value: 0 },
          total: { rank: totalRank, value: 0 },
          level: { rank: null, value: 1 }
        };
      }
      
      // Get the user's level
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('level')
        .eq('user_id', userId)
        .single();
        
      const level = statsError ? 1 : (userStats?.level || 1);
      
      // Get level rank
      const { count: levelCount, error: levelCountError } = await supabase
        .from('user_stats')
        .select('user_id', { count: 'exact', head: true })
        .gt('level', level);
        
      const levelRank = levelCountError ? null : (levelCount || 0) + 1;
      
      return {
        weekly: { rank: weeklyRank, value: profile?.weekly_distance || 0 },
        monthly: { rank: monthlyRank, value: profile?.monthly_distance || 0 },
        total: { rank: totalRank, value: profile?.all_time_distance || 0 },
        level: { rank: levelRank, value: level }
      };
    } catch (err) {
      console.error('Error in getUserRankings:', err);
      return {
        weekly: { rank: null, value: 0 },
        monthly: { rank: null, value: 0 },
        total: { rank: null, value: 0 },
        level: { rank: null, value: 1 }
      };
    }
  }
}

export default LeaderboardService;