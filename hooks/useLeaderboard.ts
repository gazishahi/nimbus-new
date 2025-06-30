import { useState, useEffect, useCallback } from 'react';
import { LeaderboardService, LeaderboardEntry } from '@/services/LeaderboardService';
import { useAuth } from '@/contexts/AuthContext';

export interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  userRank: number | null;
  loading: boolean;
  error: string | null;
  selectedPeriod: 'week' | 'month' | 'total';
  setSelectedPeriod: (period: 'week' | 'month' | 'total') => void;
  refreshLeaderboard: () => Promise<void>;
}

export function useLeaderboard(): UseLeaderboardReturn {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'total'>('week');
  
  const leaderboardService = LeaderboardService.getInstance();

  const fetchLeaderboard = useCallback(async () => {
    if (!user) {
      setLeaderboard([]);
      setUserRank(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch leaderboard data
      const data = await leaderboardService.getLeaderboard(selectedPeriod);
      setLeaderboard(data);
      
      // Find user's rank in the fetched data
      const userEntry = data.find(entry => entry.userId === user.id);
      if (userEntry) {
        setUserRank(userEntry.rank);
      } else {
        // If user not in top entries, fetch their specific rank
        const rank = await leaderboardService.getUserRank(user.id, selectedPeriod);
        setUserRank(rank);
      }
      
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  }, [user, selectedPeriod, leaderboardService]);

  // Fetch leaderboard when user or period changes
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const refreshLeaderboard = useCallback(async () => {
    try {
      // First update the leaderboards
      await leaderboardService.updateLeaderboards();
      
      // Then fetch the updated data
      await fetchLeaderboard();
    } catch (err) {
      console.error('Error refreshing leaderboard:', err);
      setError('Failed to refresh leaderboard');
    }
  }, [fetchLeaderboard, leaderboardService]);

  return {
    leaderboard,
    userRank,
    loading,
    error,
    selectedPeriod,
    setSelectedPeriod,
    refreshLeaderboard
  };
}