import { LiveQuest, LiveQuestType, LiveQuestSession, QuestProgress } from '@/types/quests';
import { RunMetrics } from '@/types/stats';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export class LiveQuestService {
  private static instance: LiveQuestService;
  private currentSession: LiveQuestSession | null = null;
  private questCheckInterval: NodeJS.Timeout | null = null;
  private firstQuestTimer: NodeJS.Timeout | null = null;
  private listeners: ((session: LiveQuestSession) => void)[] = [];

  private constructor() {}

  static getInstance(): LiveQuestService {
    if (!LiveQuestService.instance) {
      LiveQuestService.instance = new LiveQuestService();
    }
    return LiveQuestService.instance;
  }

  // Start a live quest session when workout begins
  startQuestSession(workoutId: string): LiveQuestSession {
    console.log('🎯 Starting live quest session for workout:', workoutId);
    
    this.currentSession = {
      id: `quest-session-${Date.now()}`,
      workoutId,
      startTime: new Date(),
      activeQuests: [],
      completedQuests: [],
      totalXpEarned: 0,
      totalCoinsEarned: 0,
      isActive: true,
    };

    // Start quest generation with 3-minute delay
    this.startQuestGeneration();

    this.notifyListeners();
    return this.currentSession;
  }

  // Start generating and checking quests with 3-minute delay
  private startQuestGeneration(): void {
    if (!this.currentSession?.isActive) return;

    console.log('🎯 Starting quest generation with 3-minute delay');
    
    // Set timer for first quest (3 minutes = 180,000 milliseconds)
    this.firstQuestTimer = setTimeout(() => {
      console.log('🎯 3 minutes elapsed, generating first quest');
      
      // Generate first quest
      this.generateNewQuest();
      
      // Start regular quest checking and generation
      this.questCheckInterval = setInterval(() => {
        this.checkQuestProgress();
        this.maybeGenerateNewQuest();
      }, 10000); // 10 seconds for responsive quest generation
      
    }, 60000); // 3 minutes delay
  }

  // Generate a new quest based on current workout state
  private generateNewQuest(): void {
    if (!this.currentSession?.isActive) return;
    if (this.currentSession.activeQuests.length >= 2) return; // Max 2 active quests

    const questTypes: LiveQuestType[] = [
      'distance_sprint',
      'pace_maintain',
      'speed_burst',
      'endurance_test',
    ];

    const randomType = questTypes[Math.floor(Math.random() * questTypes.length)];
    const quest = this.createQuestByType(randomType);

    if (quest) {
      quest.isActive = true;
      quest.startTime = new Date();
      this.currentSession.activeQuests.push(quest);
      
      console.log('🎯 New quest generated:', quest.title);
      this.sendQuestNotification(quest);
      this.notifyListeners();
    }
  }

  // Create a quest based on type
  private createQuestByType(type: LiveQuestType): LiveQuest | null {
    const difficulty = this.getRandomDifficulty();
    const questId = `quest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    switch (type) {
      case 'distance_sprint':
        return {
          id: questId,
          title: 'Lightning Sprint',
          description: `Sprint ${difficulty === 'easy' ? '200' : difficulty === 'medium' ? '400' : '600'}m in the next 2 minutes!`,
          type,
          difficulty,
          target: difficulty === 'easy' ? 200 : difficulty === 'medium' ? 400 : 600,
          progress: 0,
          isCompleted: false,
          isActive: false,
          timeLimit: 120, // 2 minutes
          rewards: {
            xp: difficulty === 'easy' ? 20 : difficulty === 'medium' ? 35 : 50,
            coins: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30,
          },
          icon: 'zap',
        };

      case 'pace_maintain':
        return {
          id: questId,
          title: 'Steady Rhythm',
          description: `Maintain a consistent pace for ${difficulty === 'easy' ? '60' : difficulty === 'medium' ? '90' : '120'} seconds`,
          type,
          difficulty,
          target: difficulty === 'easy' ? 60 : difficulty === 'medium' ? 90 : 120,
          progress: 0,
          isCompleted: false,
          isActive: false,
          rewards: {
            xp: difficulty === 'easy' ? 15 : difficulty === 'medium' ? 30 : 45,
            coins: difficulty === 'easy' ? 8 : difficulty === 'medium' ? 15 : 25,
          },
          icon: 'target',
        };

      case 'speed_burst':
        return {
          id: questId,
          title: 'Speed Demon',
          description: `Reach and maintain 12+ km/h for ${difficulty === 'easy' ? '30' : difficulty === 'medium' ? '45' : '60'} seconds`,
          type,
          difficulty,
          target: difficulty === 'easy' ? 30 : difficulty === 'medium' ? 45 : 60,
          progress: 0,
          isCompleted: false,
          isActive: false,
          rewards: {
            xp: difficulty === 'easy' ? 25 : difficulty === 'medium' ? 40 : 50,
            coins: difficulty === 'easy' ? 12 : difficulty === 'medium' ? 20 : 30,
          },
          icon: 'trending-up',
        };

      case 'endurance_test':
        return {
          id: questId,
          title: 'Endurance Master',
          description: `Run continuously without stopping for ${difficulty === 'easy' ? '3' : difficulty === 'medium' ? '5' : '7'} minutes`,
          type,
          difficulty,
          target: difficulty === 'easy' ? 180 : difficulty === 'medium' ? 300 : 420, // seconds
          progress: 0,
          isCompleted: false,
          isActive: false,
          rewards: {
            xp: difficulty === 'easy' ? 30 : difficulty === 'medium' ? 45 : 50,
            coins: difficulty === 'easy' ? 15 : difficulty === 'medium' ? 25 : 30,
          },
          icon: 'clock',
        };

      default:
        return null;
    }
  }

  // Check progress of active quests
  private checkQuestProgress(): void {
    if (!this.currentSession?.isActive) return;

    this.currentSession.activeQuests.forEach(quest => {
      if (quest.isCompleted || !quest.isActive) return;

      // Check if quest has timed out
      if (quest.timeLimit && quest.startTime) {
        const elapsed = (Date.now() - quest.startTime.getTime()) / 1000;
        if (elapsed > quest.timeLimit) {
          this.failQuest(quest);
          return;
        }
      }
    });
  }

  // Update quest progress with real-time metrics
  updateQuestProgress(metrics: RunMetrics): void {
    if (!this.currentSession?.isActive) return;

    console.log('🎯 Updating quest progress with metrics:', metrics);

    let progressMade = false;

    this.currentSession.activeQuests.forEach(quest => {
      if (quest.isCompleted || !quest.isActive) return;

      let progressIncrement = 0;

      switch (quest.type) {
        case 'distance_sprint':
          // Use speed to calculate distance covered in the last 10 seconds
          if (metrics.speed > 0) {
            progressIncrement = metrics.speed * 10; // distance = speed * time (10 seconds)
            quest.progress = Math.min(quest.progress + progressIncrement, quest.target);
          }
          break;

        case 'pace_maintain':
          // Check if pace is consistent and reasonable (between 3-10 min/km)
          if (metrics.pace > 0 && metrics.pace >= 3 && metrics.pace <= 10) {
            quest.progress += 10; // 10 seconds of good pace
          }
          break;

        case 'speed_burst':
          // Check if speed is above 12 km/h (3.33 m/s)
          if (metrics.speed > 3.33) {
            quest.progress += 10; // 10 seconds at target speed
          }
          break;

        case 'endurance_test':
          // Check if still running (speed > 1 m/s)
          if (metrics.speed > 1) {
            quest.progress += 10; // 10 seconds of continuous running
          } else {
            // Reset progress if stopped running for endurance test
            quest.progress = Math.max(0, quest.progress - 5);
          }
          break;
      }

      // Check if quest is completed
      if (quest.progress >= quest.target) {
        this.completeQuest(quest);
        progressMade = true;
      }
    });

    if (progressMade) {
      this.notifyListeners();
    }
  }

  // Complete a quest
  private completeQuest(quest: LiveQuest): void {
    if (!this.currentSession) return;

    quest.isCompleted = true;
    quest.completedAt = new Date();
    
    // Move from active to completed
    this.currentSession.activeQuests = this.currentSession.activeQuests.filter(q => q.id !== quest.id);
    this.currentSession.completedQuests.push(quest);
    
    // Add rewards
    this.currentSession.totalXpEarned += quest.rewards.xp;
    this.currentSession.totalCoinsEarned += quest.rewards.coins;

    console.log('🎯 Quest completed:', quest.title, `+${quest.rewards.xp} XP`);
    this.sendQuestCompletionNotification(quest);
    this.notifyListeners();
  }

  // Fail a quest (timeout or other failure)
  private failQuest(quest: LiveQuest): void {
    if (!this.currentSession) return;

    console.log('🎯 Quest failed:', quest.title);
    this.currentSession.activeQuests = this.currentSession.activeQuests.filter(q => q.id !== quest.id);
    this.sendQuestFailureNotification(quest);
    this.notifyListeners();
  }

  // Maybe generate a new quest
  private maybeGenerateNewQuest(): void {
    if (!this.currentSession?.isActive) return;
    if (this.currentSession.activeQuests.length >= 2) return;

    // Generate new quest every 1-2 minutes
    const timeSinceLastQuest = this.getTimeSinceLastQuest();
    const shouldGenerate = timeSinceLastQuest > (60 + Math.random() * 60) * 1000; // 1-2 minutes

    if (shouldGenerate) {
      this.generateNewQuest();
    }
  }

  // Get time since last quest was generated
  private getTimeSinceLastQuest(): number {
    if (!this.currentSession) return Infinity;
    
    const allQuests = [...this.currentSession.activeQuests, ...this.currentSession.completedQuests];
    if (allQuests.length === 0) return Infinity;

    const lastQuest = allQuests.reduce((latest, quest) => {
      const questTime = quest.startTime?.getTime() || 0;
      const latestTime = latest.startTime?.getTime() || 0;
      return questTime > latestTime ? quest : latest;
    });

    return Date.now() - (lastQuest.startTime?.getTime() || 0);
  }

  // End quest session
  endQuestSession(): LiveQuestSession | null {
    if (!this.currentSession) return null;

    console.log('🎯 Ending quest session');
    this.currentSession.isActive = false;

    // Clear both timers
    if (this.firstQuestTimer) {
      clearTimeout(this.firstQuestTimer);
      this.firstQuestTimer = null;
    }

    if (this.questCheckInterval) {
      clearInterval(this.questCheckInterval);
      this.questCheckInterval = null;
    }

    const session = this.currentSession;
    this.currentSession = null;

    // Send final summary notification
    if (session.completedQuests.length > 0) {
      this.sendSessionSummaryNotification(session);
    }

    return session;
  }

  // Get current session
  getCurrentSession(): LiveQuestSession | null {
    return this.currentSession;
  }

  // Random difficulty
  private getRandomDifficulty(): 'easy' | 'medium' | 'hard' {
    const rand = Math.random();
    if (rand < 0.5) return 'easy';
    if (rand < 0.8) return 'medium';
    return 'hard';
  }

  // Send quest notification
  private async sendQuestNotification(quest: LiveQuest): Promise<void> {
    if (Platform.OS === 'web') return;
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 New Quest Available!',
          body: `${quest.title}: ${quest.description}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type: 'quest_available',
            questId: quest.id,
          },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending quest notification:', error);
    }
  }

  // Send quest completion notification
  private async sendQuestCompletionNotification(quest: LiveQuest): Promise<void> {
    if (Platform.OS === 'web') return;
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏆 Quest Completed!',
          body: `${quest.title} completed! +${quest.rewards.xp} XP, +${quest.rewards.coins} coins`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type: 'quest_completed',
            questId: quest.id,
          },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending quest completion notification:', error);
    }
  }

  // Send quest failure notification
  private async sendQuestFailureNotification(quest: LiveQuest): Promise<void> {
    if (Platform.OS === 'web') return;
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Quest Expired',
          body: `${quest.title} has expired. Keep running for new challenges!`,
          sound: false,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          data: {
            type: 'quest_failed',
            questId: quest.id,
          },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending quest failure notification:', error);
    }
  }

  // Send session summary notification
  private async sendSessionSummaryNotification(session: LiveQuestSession): Promise<void> {
    if (Platform.OS === 'web') return;
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Quest Session Complete!',
          body: `Completed ${session.completedQuests.length} quests! Total: +${session.totalXpEarned} XP, +${session.totalCoinsEarned} coins`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type: 'session_summary',
            sessionId: session.id,
          },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending session summary notification:', error);
    }
  }

  // Add listener for session updates
  addSessionListener(listener: (session: LiveQuestSession) => void): void {
    this.listeners.push(listener);
  }

  // Remove listener
  removeSessionListener(listener: (session: LiveQuestSession) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Notify all listeners
  private notifyListeners(): void {
    if (this.currentSession) {
      console.log('🔔 Notifying listeners of session update:', {
        activeQuests: this.currentSession.activeQuests.length,
        completedQuests: this.currentSession.completedQuests.length,
        isActive: this.currentSession.isActive
      });
      
      this.listeners.forEach(listener => {
        try {
          listener(this.currentSession!);
        } catch (error) {
          console.error('Error in quest session listener:', error);
        }
      });
    }
  }
}

export default LiveQuestService;