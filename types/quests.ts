export interface LiveQuest {
  id: string;
  title: string;
  description: string;
  type: LiveQuestType;
  difficulty: 'easy' | 'medium' | 'hard';
  target: number;
  progress: number;
  isCompleted: boolean;
  isActive: boolean;
  timeLimit?: number; // seconds
  startTime?: Date;
  completedAt?: Date;
  rewards: {
    xp: number;
    coins: number;
  };
  icon: string;
}

export type LiveQuestType = 
  | 'distance_sprint' // Run X meters in Y seconds
  | 'pace_maintain' // Maintain pace for X seconds
  | 'heart_rate_zone' // Stay in heart rate zone for X seconds
  | 'speed_burst' // Reach target speed for X seconds
  | 'endurance_test' // Run continuously for X minutes
  | 'interval_challenge'; // Complete X intervals of high intensity

export interface QuestProgress {
  questId: string;
  currentValue: number;
  targetValue: number;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface LiveQuestSession {
  id: string;
  workoutId: string;
  startTime: Date;
  activeQuests: LiveQuest[];
  completedQuests: LiveQuest[];
  totalXpEarned: number;
  totalCoinsEarned: number;
  isActive: boolean;
}