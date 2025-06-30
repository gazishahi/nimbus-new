export type CharacterPath = 'speed-runner' | 'endurance-master' | 'explorer';

export interface UserStats {
  id: string;
  userId: string;
  level: number;
  experience: number;
  totalDistance: number; // in meters
  totalRuns: number;
  totalTime: number; // in seconds
  characterPath: CharacterPath;
  skillPoints: number;
  spentSkillPoints: number;
  pathSkills: Record<string, number>; // skillId -> level
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  cost: number;
  tier: number;
  prerequisites: string[];
}

export interface RunData {
  distance: number; // meters
  duration: number; // seconds
  averagePace?: number; // min/km
  elevationGain?: number; // meters
  calories?: number;
}

export interface LevelUpResult {
  levelsGained: number;
  skillPointsGained: number;
  newLevel: number;
  experienceGained: number;
}

export interface RunMetrics {
  distance: number; // meters
  duration: number; // seconds
  pace: number; // min/km
  speed: number; // m/s
  heartRate?: number; // BPM (optional, from HealthKit if available)
}