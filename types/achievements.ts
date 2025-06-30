export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  category: 'distance' | 'runs' | 'time' | 'streak' | 'speed' | 'level' | 'special';
  requirementType: 'total_distance' | 'total_runs' | 'total_time' | 'level' | 'streak_days' | 'single_run_distance' | 'average_pace';
  requirementValue: number;
  xpReward: number;
  coinReward: number;
  isHidden: boolean;
  createdAt: Date;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date | null;
  progress: number;
  isCompleted: boolean;
  createdAt: Date;
  achievement?: Achievement; // Populated when joined
}

export interface AchievementProgress {
  achievement: Achievement;
  progress: number;
  isCompleted: boolean;
  unlockedAt: Date | null;
  progressPercentage: number;
}

export interface NewAchievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  rarity: string;
  xpReward: number;
  coinReward: number;
}