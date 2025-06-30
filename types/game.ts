export interface User {
  id: string;
  username: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  characterClass: CharacterClass;
  totalDistance: number;
  totalRuns: number;
  totalTime: number;
  createdAt: Date;
}

export interface CharacterClass {
  id: 'speed-runner' | 'endurance-master' | 'explorer';
  name: string;
  description: string;
  color: string;
  icon: string;
  bonuses: {
    speedBonus: number;
    enduranceBonus: number;
    explorationBonus: number;
  };
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  requirements: QuestRequirement;
  rewards: QuestReward;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  isActive: boolean;
  timeRemaining?: number;
  locationBased: boolean;
}

export type QuestType = 
  | 'sprint-challenge'
  | 'distance-goal'
  | 'exploration'
  | 'time-challenge'
  | 'pace-maintenance'
  | 'elevation-challenge';

export interface QuestRequirement {
  distance?: number;
  time?: number;
  pace?: number;
  speed?: number;
  elevation?: number;
  newRoutes?: number;
}

export interface QuestReward {
  experience: number;
  coins: number;
  items?: Item[];
  achievements?: Achievement[];
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'equipment' | 'consumable' | 'cosmetic';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  effects?: ItemEffect[];
}

export interface ItemEffect {
  type: 'speed-boost' | 'endurance-boost' | 'xp-multiplier';
  value: number;
  duration: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
}

export interface RunSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  distance: number;
  duration: number;
  averagePace: number;
  maxSpeed: number;
  elevationGain: number;
  calories: number;
  activeQuests: Quest[];
  completedQuests: Quest[];
  experienceGained: number;
  route: RoutePoint[];
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  altitude?: number;
  speed?: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  level: number;
  characterClass: CharacterClass;
  weeklyDistance: number;
  monthlyDistance: number;
  totalDistance: number;
  rank: number;
}