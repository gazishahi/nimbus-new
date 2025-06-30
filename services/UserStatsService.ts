import { supabase } from '@/lib/supabase';
import { UserStats, CharacterPath, SkillNode, RunData } from '@/types/stats';
import { AchievementsService } from '@/services/AchievementsService';

export class UserStatsService {
  private static instance: UserStatsService;
  private achievementsService: AchievementsService;

  private constructor() {
    this.achievementsService = AchievementsService.getInstance();
  }

  static getInstance(): UserStatsService {
    if (!UserStatsService.instance) {
      UserStatsService.instance = new UserStatsService();
    }
    return UserStatsService.instance;
  }

  // Helper method to safely parse JSON with fallback
  private safeJsonParse(jsonString: any, fallback: any = {}): any {
    if (!jsonString) return fallback;
    
    // If it's already an object, return it
    if (typeof jsonString === 'object') return jsonString;
    
    // If it's not a string, return fallback
    if (typeof jsonString !== 'string') return fallback;
    
    try {
      const parsed = JSON.parse(jsonString);
      return parsed;
    } catch (error) {
      console.warn('Failed to parse JSON, using fallback:', error);
      return fallback;
    }
  }

  // Get user stats from database
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user stats:', error);
        return null;
      }

      // Safely parse path_skills with fallback to empty object
      const pathSkills = this.safeJsonParse(data.path_skills, {});

      return {
        id: data.id,
        userId: data.user_id,
        level: data.level,
        experience: data.experience,
        totalDistance: data.total_distance,
        totalRuns: data.total_runs,
        totalTime: data.total_time,
        characterPath: data.character_class as CharacterPath,
        skillPoints: data.skill_points || 0,
        spentSkillPoints: data.spent_skill_points || 0,
        pathSkills: pathSkills,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error in getUserStats:', error);
      return null;
    }
  }

  // Create initial user stats for new users
  async createUserStats(userId: string): Promise<UserStats | null> {
    try {
      const initialStats = {
        user_id: userId,
        level: 1,
        experience: 0,
        total_distance: 0,
        total_runs: 0,
        total_time: 0,
        character_class: 'speed-runner' as CharacterPath,
        skill_points: 0,
        spent_skill_points: 0,
        path_skills: JSON.stringify({}),
      };

      const { data, error } = await supabase
        .from('user_stats')
        .insert(initialStats)
        .select()
        .single();

      if (error) {
        console.error('Error creating user stats:', error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        level: data.level,
        experience: data.experience,
        totalDistance: data.total_distance,
        totalRuns: data.total_runs,
        totalTime: data.total_time,
        characterPath: data.character_class as CharacterPath,
        skillPoints: data.skill_points,
        spentSkillPoints: data.spent_skill_points,
        pathSkills: this.safeJsonParse(data.path_skills, {}),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error in createUserStats:', error);
      return null;
    }
  }

  // Update user stats after a run
  async updateStatsAfterRun(userId: string, runData: RunData): Promise<{ 
    updatedStats: UserStats | null; 
    newAchievements: any[];
  }> {
    try {
      // Get current stats
      const currentStats = await this.getUserStats(userId);
      if (!currentStats) {
        console.error('No current stats found for user');
        return { updatedStats: null, newAchievements: [] };
      }

      // Calculate experience gained based on run performance
      const experienceGained = this.calculateExperienceGained(runData);
      
      // Calculate new totals
      const newTotalDistance = currentStats.totalDistance + runData.distance;
      const newTotalRuns = currentStats.totalRuns + 1;
      const newTotalTime = currentStats.totalTime + runData.duration;
      const newExperience = currentStats.experience + experienceGained;

      // Check for level up
      const { newLevel, skillPointsGained } = this.calculateLevelUp(currentStats.level, newExperience);
      const newSkillPoints = currentStats.skillPoints + skillPointsGained;

      // Update database
      const { data, error } = await supabase
        .from('user_stats')
        .update({
          level: newLevel,
          experience: newExperience,
          total_distance: newTotalDistance,
          total_runs: newTotalRuns,
          total_time: newTotalTime,
          skill_points: newSkillPoints,
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user stats:', error);
        return { updatedStats: null, newAchievements: [] };
      }

      const updatedStats: UserStats = {
        id: data.id,
        userId: data.user_id,
        level: data.level,
        experience: data.experience,
        totalDistance: data.total_distance,
        totalRuns: data.total_runs,
        totalTime: data.total_time,
        characterPath: data.character_class as CharacterPath,
        skillPoints: data.skill_points,
        spentSkillPoints: data.spent_skill_points,
        pathSkills: this.safeJsonParse(data.path_skills, {}),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      // Check for achievements after stats update
      const [generalAchievements, singleRunAchievements] = await Promise.all([
        this.achievementsService.checkAndAwardAchievements(userId),
        this.achievementsService.checkSingleRunAchievements(userId, runData.distance),
      ]);

      const allNewAchievements = [...generalAchievements, ...singleRunAchievements];

      // Return level up info if applicable
      if (skillPointsGained > 0) {
        console.log(`Level up! New level: ${newLevel}, Skill points gained: ${skillPointsGained}`);
      }

      if (allNewAchievements.length > 0) {
        console.log(`New achievements unlocked: ${allNewAchievements.length}`);
      }

      return { updatedStats, newAchievements: allNewAchievements };
    } catch (error) {
      console.error('Error in updateStatsAfterRun:', error);
      return { updatedStats: null, newAchievements: [] };
    }
  }

  // Change character path
  async changeCharacterPath(userId: string, newPath: CharacterPath): Promise<boolean> {
    try {
      // Reset path-specific skills when changing paths
      const { error } = await supabase
        .from('user_stats')
        .update({
          character_class: newPath,
          path_skills: JSON.stringify({}),
          spent_skill_points: 0, // Reset spent points to allow redistribution
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error changing character path:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in changeCharacterPath:', error);
      return false;
    }
  }

  // Upgrade a skill
  async upgradeSkill(userId: string, skillId: string): Promise<boolean> {
    try {
      const currentStats = await this.getUserStats(userId);
      if (!currentStats) return false;

      const skillData = this.getSkillData(currentStats.characterPath, skillId);
      if (!skillData) return false;

      const currentLevel = currentStats.pathSkills[skillId] || 0;
      
      // Check if skill can be upgraded
      if (currentLevel >= skillData.maxLevel) return false;
      if (currentStats.skillPoints < skillData.cost) return false;

      // Update skill level and spend points
      const newPathSkills = {
        ...currentStats.pathSkills,
        [skillId]: currentLevel + 1,
      };

      const { error } = await supabase
        .from('user_stats')
        .update({
          path_skills: JSON.stringify(newPathSkills),
          skill_points: currentStats.skillPoints - skillData.cost,
          spent_skill_points: currentStats.spentSkillPoints + skillData.cost,
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error upgrading skill:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in upgradeSkill:', error);
      return false;
    }
  }

  // Fix corrupted path_skills data in database
  async fixCorruptedPathSkills(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_stats')
        .update({
          path_skills: JSON.stringify({}),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error fixing corrupted path_skills:', error);
        return false;
      }

      console.log('Successfully fixed corrupted path_skills data');
      return true;
    } catch (error) {
      console.error('Error in fixCorruptedPathSkills:', error);
      return false;
    }
  }

  // Calculate experience gained from a run
  private calculateExperienceGained(runData: RunData): number {
    let baseExp = 0;

    // Base experience from distance (1 XP per 100m)
    baseExp += Math.floor(runData.distance / 100);

    // Bonus experience from duration (1 XP per minute)
    baseExp += Math.floor(runData.duration / 60);

    // Bonus for maintaining good pace
    if (runData.averagePace && runData.averagePace < 6) { // Under 6 min/km
      baseExp += Math.floor(baseExp * 0.2); // 20% bonus
    }

    // Bonus for elevation gain
    if (runData.elevationGain && runData.elevationGain > 50) {
      baseExp += Math.floor(runData.elevationGain / 10); // 1 XP per 10m elevation
    }

    // Minimum 10 XP per run
    return Math.max(baseExp, 10);
  }

  // Calculate level progression and skill points
  private calculateLevelUp(currentLevel: number, newExperience: number): { newLevel: number; skillPointsGained: number } {
    let level = currentLevel;
    let skillPointsGained = 0;

    // Experience required for each level (exponential growth)
    const getExpForLevel = (lvl: number) => Math.floor(100 * Math.pow(1.5, lvl - 1));

    while (true) {
      const expRequired = getExpForLevel(level + 1);
      if (newExperience >= expRequired) {
        level++;
        skillPointsGained += 2; // 2 skill points per level
      } else {
        break;
      }
    }

    return { newLevel: level, skillPointsGained };
  }

  // Get experience required for next level
  getExperienceForNextLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level));
  }

  // Get skill data for a specific path and skill
  private getSkillData(path: CharacterPath, skillId: string): { cost: number; maxLevel: number } | null {
    const skillTrees = this.getSkillTrees();
    const pathSkills = skillTrees[path];
    
    for (const tier of pathSkills) {
      const skill = tier.find(s => s.id === skillId);
      if (skill) {
        return { cost: skill.cost, maxLevel: skill.maxLevel };
      }
    }
    
    return null;
  }

  // Get all skill trees for all paths
  getSkillTrees(): Record<CharacterPath, SkillNode[][]> {
    return {
      'speed-runner': [
        // Tier 1 - Basic Skills
        [
          {
            id: 'wind-walker',
            name: 'Wind Walker',
            description: 'Increases sprint speed by 5% per level',
            maxLevel: 5,
            cost: 1,
            tier: 1,
            prerequisites: [],
          },
          {
            id: 'quick-recovery',
            name: 'Quick Recovery',
            description: 'Reduces fatigue between sprints',
            maxLevel: 3,
            cost: 1,
            tier: 1,
            prerequisites: [],
          },
        ],
        // Tier 2 - Intermediate Skills
        [
          {
            id: 'lightning-step',
            name: 'Lightning Step',
            description: 'Burst of speed for 10 seconds',
            maxLevel: 3,
            cost: 2,
            tier: 2,
            prerequisites: ['wind-walker'],
          },
          {
            id: 'endurance-boost',
            name: 'Endurance Boost',
            description: 'Increases stamina for longer runs',
            maxLevel: 4,
            cost: 2,
            tier: 2,
            prerequisites: ['quick-recovery'],
          },
        ],
        // Tier 3 - Advanced Skills
        [
          {
            id: 'storm-runner',
            name: 'Storm Runner',
            description: 'Master of speed - ultimate sprint ability',
            maxLevel: 1,
            cost: 5,
            tier: 3,
            prerequisites: ['lightning-step', 'endurance-boost'],
          },
        ],
      ],
      'endurance-master': [
        // Tier 1
        [
          {
            id: 'iron-lungs',
            name: 'Iron Lungs',
            description: 'Increases oxygen efficiency by 10% per level',
            maxLevel: 5,
            cost: 1,
            tier: 1,
            prerequisites: [],
          },
          {
            id: 'steady-pace',
            name: 'Steady Pace',
            description: 'Maintains consistent speed over long distances',
            maxLevel: 3,
            cost: 1,
            tier: 1,
            prerequisites: [],
          },
        ],
        // Tier 2
        [
          {
            id: 'marathon-master',
            name: 'Marathon Master',
            description: 'Bonus experience for runs over 10km',
            maxLevel: 3,
            cost: 2,
            tier: 2,
            prerequisites: ['iron-lungs'],
          },
          {
            id: 'pain-tolerance',
            name: 'Pain Tolerance',
            description: 'Reduces impact of fatigue',
            maxLevel: 4,
            cost: 2,
            tier: 2,
            prerequisites: ['steady-pace'],
          },
        ],
        // Tier 3
        [
          {
            id: 'ultra-endurance',
            name: 'Ultra Endurance',
            description: 'Legendary stamina - can run indefinitely',
            maxLevel: 1,
            cost: 5,
            tier: 3,
            prerequisites: ['marathon-master', 'pain-tolerance'],
          },
        ],
      ],
      'explorer': [
        // Tier 1
        [
          {
            id: 'pathfinder',
            name: 'Pathfinder',
            description: 'Discovers new routes 20% more often per level',
            maxLevel: 5,
            cost: 1,
            tier: 1,
            prerequisites: [],
          },
          {
            id: 'terrain-master',
            name: 'Terrain Master',
            description: 'Bonus experience from elevation changes',
            maxLevel: 3,
            cost: 1,
            tier: 1,
            prerequisites: [],
          },
        ],
        // Tier 2
        [
          {
            id: 'route-memory',
            name: 'Route Memory',
            description: 'Remembers optimal paths for efficiency bonuses',
            maxLevel: 3,
            cost: 2,
            tier: 2,
            prerequisites: ['pathfinder'],
          },
          {
            id: 'adventure-seeker',
            name: 'Adventure Seeker',
            description: 'Unlocks special exploration challenges',
            maxLevel: 4,
            cost: 2,
            tier: 2,
            prerequisites: ['terrain-master'],
          },
        ],
        // Tier 3
        [
          {
            id: 'master-explorer',
            name: 'Master Explorer',
            description: 'Ultimate navigation - discovers legendary routes',
            maxLevel: 1,
            cost: 5,
            tier: 3,
            prerequisites: ['route-memory', 'adventure-seeker'],
          },
        ],
      ],
    };
  }

  // Get character path bonuses
  getPathBonuses(path: CharacterPath): { speedBonus: number; enduranceBonus: number; explorationBonus: number } {
    const bonuses = {
      'speed-runner': { speedBonus: 1.2, enduranceBonus: 1.0, explorationBonus: 0.9 },
      'endurance-master': { speedBonus: 0.9, enduranceBonus: 1.3, explorationBonus: 1.0 },
      'explorer': { speedBonus: 1.0, enduranceBonus: 1.0, explorationBonus: 1.4 },
    };

    return bonuses[path];
  }

  // Get path information
  getPathInfo(path: CharacterPath): { name: string; description: string; color: string; icon: string } {
    const pathInfo = {
      'speed-runner': {
        name: 'Sky Sprinter',
        description: 'Masters of swift movement and agility. Excels at sprint challenges and pace quests.',
        color: '#3b82f6',
        icon: 'zap',
      },
      'endurance-master': {
        name: 'Storm Chaser',
        description: 'Champions of long-distance running. Specializes in time and distance challenges.',
        color: '#6366f1',
        icon: 'shield',
      },
      'explorer': {
        name: 'Cloud Walker',
        description: 'Seekers of new paths and hidden routes. Masters of exploration and adventure.',
        color: '#10b981',
        icon: 'map-pin',
      },
    };

    return pathInfo[path];
  }
}

export default UserStatsService;