import { Quest, User, QuestType } from '@/types/game';

interface QuestGenerationParams {
  user: User;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'windy';
  completedQuests: Quest[];
}

export class QuestGenerator {
  static generateDailyQuests(params: QuestGenerationParams): Quest[] {
    const quests: Quest[] = [];
    const { user, timeOfDay, weather, completedQuests } = params;

    // Generate 3-5 quests based on user level and preferences
    const questCount = Math.min(5, Math.max(3, Math.floor(user.level / 5) + 3));

    for (let i = 0; i < questCount; i++) {
      const quest = this.generateSingleQuest(params, i);
      if (quest && !this.isDuplicateQuest(quest, quests)) {
        quests.push(quest);
      }
    }

    return quests;
  }

  private static generateSingleQuest(params: QuestGenerationParams, index: number): Quest | null {
    const { user, timeOfDay, weather } = params;
    const questTypes: QuestType[] = [
      'sprint-challenge',
      'distance-goal',
      'exploration',
      'time-challenge',
      'pace-maintenance',
      'elevation-challenge',
    ];

    const selectedType = questTypes[index % questTypes.length];
    const difficulty = this.determineDifficulty(user.level, index);

    switch (selectedType) {
      case 'sprint-challenge':
        return this.generateSprintQuest(user, difficulty, timeOfDay);
      case 'distance-goal':
        return this.generateDistanceQuest(user, difficulty);
      case 'exploration':
        return this.generateExplorationQuest(user, difficulty);
      case 'time-challenge':
        return this.generateTimeQuest(user, difficulty);
      case 'pace-maintenance':
        return this.generatePaceQuest(user, difficulty);
      case 'elevation-challenge':
        return this.generateElevationQuest(user, difficulty);
      default:
        return null;
    }
  }

  private static generateSprintQuest(
    user: User, 
    difficulty: 'easy' | 'medium' | 'hard' | 'legendary',
    timeOfDay: string
  ): Quest {
    const sprintDurations = {
      easy: 15,
      medium: 30,
      hard: 45,
      legendary: 60,
    };

    const narratives = {
      morning: [
        'Outrun the rising sun\'s blazing rays!',
        'Sprint past the morning mist spirits!',
        'Race against the dawn chorus!',
      ],
      afternoon: [
        'Escape the shadow wolves chasing you!',
        'Sprint to deliver an urgent message!',
        'Outrun the approaching storm clouds!',
      ],
      evening: [
        'Sprint home before the night creatures awaken!',
        'Race against the setting sun!',
        'Flee from the gathering darkness!',
      ],
      night: [
        'Sprint through the moonlit forest!',
        'Escape the nocturnal hunters!',
        'Race under the starlit sky!',
      ],
    };

    const selectedNarrative = narratives[timeOfDay as keyof typeof narratives];
    const title = selectedNarrative[Math.floor(Math.random() * selectedNarrative.length)];

    return {
      id: `sprint-${Date.now()}-${Math.random()}`,
      title: `Sprint Challenge: ${title}`,
      description: `Sprint at maximum speed for ${sprintDurations[difficulty]} seconds to complete this challenge!`,
      type: 'sprint-challenge',
      difficulty,
      requirements: {
        time: sprintDurations[difficulty],
        speed: 12 + (user.level * 0.5), // Adjusted based on user level
      },
      rewards: {
        experience: difficulty === 'easy' ? 50 : difficulty === 'medium' ? 100 : difficulty === 'hard' ? 200 : 350,
        coins: difficulty === 'easy' ? 25 : difficulty === 'medium' ? 50 : difficulty === 'hard' ? 100 : 200,
      },
      progress: 0,
      maxProgress: sprintDurations[difficulty],
      isCompleted: false,
      isActive: false,
      locationBased: false,
    };
  }

  private static generateDistanceQuest(
    user: User, 
    difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  ): Quest {
    const baseDistance = Math.max(1000, user.totalDistance / user.totalRuns || 2000);
    const distanceMultipliers = {
      easy: 0.5,
      medium: 1.0,
      hard: 1.5,
      legendary: 2.5,
    };

    const targetDistance = Math.round(baseDistance * distanceMultipliers[difficulty]);

    const narratives = [
      'Journey to the Ancient Temple',
      'Reach the Mystic Portal',
      'Travel to the Lost City',
      'Find the Hidden Treasure',
      'Discover the Sacred Grove',
      'Locate the Dragon\'s Lair',
    ];

    const title = narratives[Math.floor(Math.random() * narratives.length)];

    return {
      id: `distance-${Date.now()}-${Math.random()}`,
      title: `Epic Journey: ${title}`,
      description: `Travel ${(targetDistance/1000).toFixed(1)}km to reach your destination and claim your reward!`,
      type: 'distance-goal',
      difficulty,
      requirements: {
        distance: targetDistance,
      },
      rewards: {
        experience: Math.round(targetDistance * 0.1),
        coins: Math.round(targetDistance * 0.05),
      },
      progress: 0,
      maxProgress: targetDistance,
      isCompleted: false,
      isActive: false,
      locationBased: true,
    };
  }

  private static generateExplorationQuest(
    user: User, 
    difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  ): Quest {
    const explorationTargets = {
      easy: 1,
      medium: 2,
      hard: 3,
      legendary: 5,
    };

    const narratives = [
      'Map the Uncharted Territories',
      'Scout New Trade Routes',
      'Discover Hidden Pathways',
      'Explore the Forbidden Zones',
      'Chart the Mysterious Lands',
    ];

    const title = narratives[Math.floor(Math.random() * narratives.length)];

    return {
      id: `exploration-${Date.now()}-${Math.random()}`,
      title: `Explorer\'s Quest: ${title}`,
      description: `Discover ${explorationTargets[difficulty]} new route${explorationTargets[difficulty] > 1 ? 's' : ''} you haven\'t run before!`,
      type: 'exploration',
      difficulty,
      requirements: {
        newRoutes: explorationTargets[difficulty],
      },
      rewards: {
        experience: explorationTargets[difficulty] * 75,
        coins: explorationTargets[difficulty] * 40,
      },
      progress: 0,
      maxProgress: explorationTargets[difficulty],
      isCompleted: false,
      isActive: false,
      locationBased: true,
    };
  }

  private static generateTimeQuest(
    user: User, 
    difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  ): Quest {
    const baseDuration = Math.max(600, user.totalTime / user.totalRuns || 1200); // 10 minutes minimum
    const durationMultipliers = {
      easy: 0.75,
      medium: 1.0,
      hard: 1.25,
      legendary: 1.75,
    };

    const targetDuration = Math.round(baseDuration * durationMultipliers[difficulty]);

    const narratives = [
      'Endure the Trial of Stamina',
      'Survive the Endurance Challenge',
      'Complete the Marathon Quest',
      'Conquer the Time Trial',
      'Master the Duration Test',
    ];

    const title = narratives[Math.floor(Math.random() * narratives.length)];

    return {
      id: `time-${Date.now()}-${Math.random()}`,
      title: `Endurance Trial: ${title}`,
      description: `Run continuously for ${Math.round(targetDuration/60)} minutes to prove your endurance!`,
      type: 'time-challenge',
      difficulty,
      requirements: {
        time: targetDuration,
      },
      rewards: {
        experience: Math.round(targetDuration * 0.5),
        coins: Math.round(targetDuration * 0.25),
      },
      progress: 0,
      maxProgress: targetDuration,
      isCompleted: false,
      isActive: false,
      locationBased: false,
    };
  }

  private static generatePaceQuest(
    user: User, 
    difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  ): Quest {
    const targetPaces = {
      easy: 8.0,  // 8 min/km
      medium: 6.5, // 6.5 min/km
      hard: 5.0,   // 5 min/km
      legendary: 4.0, // 4 min/km
    };

    const durations = {
      easy: 300,   // 5 minutes
      medium: 600, // 10 minutes
      hard: 900,   // 15 minutes
      legendary: 1200, // 20 minutes
    };

    const narratives = [
      'Maintain the Rhythm of Power',
      'Keep the Sacred Pace',
      'Hold the Steady Cadence',
      'Sustain the Ancient Tempo',
    ];

    const title = narratives[Math.floor(Math.random() * narratives.length)];

    return {
      id: `pace-${Date.now()}-${Math.random()}`,
      title: `Pace Master: ${title}`,
      description: `Maintain a pace of ${targetPaces[difficulty]} min/km for ${durations[difficulty]/60} minutes!`,
      type: 'pace-maintenance',
      difficulty,
      requirements: {
        pace: targetPaces[difficulty],
        time: durations[difficulty],
      },
      rewards: {
        experience: durations[difficulty] * 0.3,
        coins: durations[difficulty] * 0.15,
      },
      progress: 0,
      maxProgress: durations[difficulty],
      isCompleted: false,
      isActive: false,
      locationBased: false,
    };
  }

  private static generateElevationQuest(
    user: User, 
    difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  ): Quest {
    const targetElevations = {
      easy: 50,    // 50m elevation gain
      medium: 100, // 100m elevation gain
      hard: 200,   // 200m elevation gain
      legendary: 350, // 350m elevation gain
    };

    const narratives = [
      'Climb to the Mountain Peak',
      'Ascend the Tower of Trials',
      'Scale the Fortress Walls',
      'Reach the Sky Temple',
      'Conquer the Highland Peaks',
    ];

    const title = narratives[Math.floor(Math.random() * narratives.length)];

    return {
      id: `elevation-${Date.now()}-${Math.random()}`,
      title: `Mountain Challenge: ${title}`,
      description: `Gain ${targetElevations[difficulty]}m of elevation during your run to complete this mountain quest!`,
      type: 'elevation-challenge',
      difficulty,
      requirements: {
        elevation: targetElevations[difficulty],
      },
      rewards: {
        experience: targetElevations[difficulty] * 2,
        coins: targetElevations[difficulty] * 1,
      },
      progress: 0,
      maxProgress: targetElevations[difficulty],
      isCompleted: false,
      isActive: false,
      locationBased: true,
    };
  }

  private static determineDifficulty(userLevel: number, questIndex: number): 'easy' | 'medium' | 'hard' | 'legendary' {
    // Higher level users get more difficult quests
    const baseChance = Math.random();
    const levelModifier = userLevel * 0.02;
    
    if (questIndex === 0) {
      // First quest is usually easier
      return baseChance < 0.7 ? 'easy' : 'medium';
    }
    
    const adjustedChance = baseChance + levelModifier;
    
    if (adjustedChance < 0.4) return 'easy';
    if (adjustedChance < 0.7) return 'medium';
    if (adjustedChance < 0.9) return 'hard';
    return 'legendary';
  }

  private static isDuplicateQuest(newQuest: Quest, existingQuests: Quest[]): boolean {
    return existingQuests.some(quest => 
      quest.type === newQuest.type && 
      quest.difficulty === newQuest.difficulty &&
      JSON.stringify(quest.requirements) === JSON.stringify(newQuest.requirements)
    );
  }
}