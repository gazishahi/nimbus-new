import { useState, useEffect, useCallback } from 'react';
import { LiveQuest, LiveQuestSession } from '@/types/quests';
import { RunMetrics } from '@/types/stats';
import { LiveQuestService } from '@/services/LiveQuestService';

export interface UseLiveQuestsReturn {
  currentSession: LiveQuestSession | null;
  activeQuests: LiveQuest[];
  completedQuests: LiveQuest[];
  totalXpEarned: number;
  totalCoinsEarned: number;
  isSessionActive: boolean;
  startQuestSession: (workoutId: string) => void;
  endQuestSession: () => LiveQuestSession | null;
  updateQuestProgress: (metrics: RunMetrics) => void;
}

export function useLiveQuests(): UseLiveQuestsReturn {
  const [currentSession, setCurrentSession] = useState<LiveQuestSession | null>(null);
  const liveQuestService = LiveQuestService.getInstance();

  // Session listener to update state when session changes
  const handleSessionUpdate = useCallback((session: LiveQuestSession) => {
    console.log('🎯 Hook: Session updated:', {
      sessionId: session.id,
      activeQuests: session.activeQuests.length,
      completedQuests: session.completedQuests.length,
      isActive: session.isActive
    });
    setCurrentSession({ ...session });
  }, []);

  useEffect(() => {
    console.log('🎯 Hook: Setting up session listener');
    
    // Add listener for session updates
    liveQuestService.addSessionListener(handleSessionUpdate);

    // Get current session if any
    const existingSession = liveQuestService.getCurrentSession();
    if (existingSession) {
      console.log('🎯 Hook: Found existing session:', existingSession);
      setCurrentSession(existingSession);
    }

    return () => {
      console.log('🎯 Hook: Removing session listener');
      liveQuestService.removeSessionListener(handleSessionUpdate);
    };
  }, [liveQuestService, handleSessionUpdate]);

  const startQuestSession = useCallback((workoutId: string) => {
    console.log('🎯 Hook: Starting quest session for workout:', workoutId);
    const session = liveQuestService.startQuestSession(workoutId);
    setCurrentSession(session);
    return session;
  }, [liveQuestService]);

  const endQuestSession = useCallback(() => {
    console.log('🎯 Hook: Ending quest session');
    const finalSession = liveQuestService.endQuestSession();
    setCurrentSession(null);
    return finalSession;
  }, [liveQuestService]);

  const updateQuestProgress = useCallback((metrics: RunMetrics) => {
    if (currentSession?.isActive) {
      console.log('🎯 Hook: Updating quest progress');
      liveQuestService.updateQuestProgress(metrics);
    }
  }, [liveQuestService, currentSession]);

  console.log('🎯 Hook: Current state:', {
    hasSession: !!currentSession,
    isActive: currentSession?.isActive,
    activeQuests: currentSession?.activeQuests.length || 0,
    completedQuests: currentSession?.completedQuests.length || 0
  });

  return {
    currentSession,
    activeQuests: currentSession?.activeQuests || [],
    completedQuests: currentSession?.completedQuests || [],
    totalXpEarned: currentSession?.totalXpEarned || 0,
    totalCoinsEarned: currentSession?.totalCoinsEarned || 0,
    isSessionActive: currentSession?.isActive || false,
    startQuestSession,
    endQuestSession,
    updateQuestProgress,
  };
}