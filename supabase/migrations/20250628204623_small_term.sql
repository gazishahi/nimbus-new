/*
  # Achievements System

  1. New Tables
    - `achievements` - Master list of all available achievements
    - `user_achievements` - Track which achievements users have unlocked
    
  2. Achievement Types
    - Distance milestones (first 1km, 5km, 10km, marathon, etc.)
    - Run count milestones (first run, 10 runs, 50 runs, etc.)
    - Time milestones (first hour, 10 hours, 100 hours)
    - Streak achievements (consecutive days)
    - Speed achievements (pace milestones)
    - Special achievements (level ups, skill unlocks)
    
  3. Security
    - Enable RLS on both tables
    - Users can view all achievements but only their own progress
    - Only system can insert achievements, users can't modify them
*/

-- Create achievements master table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL, -- Unique identifier for code reference
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('bronze', 'silver', 'gold', 'platinum', 'legendary')),
  category TEXT NOT NULL CHECK (category IN ('distance', 'runs', 'time', 'streak', 'speed', 'level', 'special')),
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('total_distance', 'total_runs', 'total_time', 'level', 'streak_days', 'single_run_distance', 'average_pace')),
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  coin_reward INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE, -- Hidden until unlocked
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user achievements tracking table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0, -- Current progress towards achievement
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for achievements (everyone can read, only system can modify)
CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT TO public USING (true);

-- Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON public.user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_achievements_user_id_idx ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS user_achievements_achievement_id_idx ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS user_achievements_completed_idx ON public.user_achievements(is_completed);
CREATE INDEX IF NOT EXISTS achievements_category_idx ON public.achievements(category);
CREATE INDEX IF NOT EXISTS achievements_key_idx ON public.achievements(key);

-- Insert default achievements
INSERT INTO public.achievements (key, title, description, icon, rarity, category, requirement_type, requirement_value, xp_reward, coin_reward) VALUES
-- Distance Achievements
('first_steps', 'First Steps', 'Complete your first run of any distance', 'footprints', 'bronze', 'distance', 'total_distance', 1, 50, 25),
('kilometer_club', '1K Club', 'Run a total of 1 kilometer', 'target', 'bronze', 'distance', 'total_distance', 1000, 100, 50),
('five_k_warrior', '5K Warrior', 'Run a total of 5 kilometers', 'zap', 'silver', 'distance', 'total_distance', 5000, 250, 125),
('ten_k_champion', '10K Champion', 'Run a total of 10 kilometers', 'award', 'silver', 'distance', 'total_distance', 10000, 500, 250),
('half_marathon_hero', 'Half Marathon Hero', 'Run a total of 21.1 kilometers', 'medal', 'gold', 'distance', 'total_distance', 21100, 1000, 500),
('marathon_legend', 'Marathon Legend', 'Run a total of 42.2 kilometers', 'crown', 'gold', 'distance', 'total_distance', 42200, 2000, 1000),
('ultra_runner', 'Ultra Runner', 'Run a total of 50 kilometers', 'mountain', 'platinum', 'distance', 'total_distance', 50000, 3000, 1500),
('century_runner', 'Century Runner', 'Run a total of 100 kilometers', 'star', 'platinum', 'distance', 'total_distance', 100000, 5000, 2500),

-- Run Count Achievements
('first_flight', 'First Flight', 'Complete your first journey', 'play', 'bronze', 'runs', 'total_runs', 1, 50, 25),
('frequent_flyer', 'Frequent Flyer', 'Complete 10 journeys', 'repeat', 'bronze', 'runs', 'total_runs', 10, 200, 100),
('cloud_hopper', 'Cloud Hopper', 'Complete 25 journeys', 'cloud', 'silver', 'runs', 'total_runs', 25, 500, 250),
('sky_dancer', 'Sky Dancer', 'Complete 50 journeys', 'wind', 'silver', 'runs', 'total_runs', 50, 1000, 500),
('storm_chaser', 'Storm Chaser', 'Complete 100 journeys', 'zap', 'gold', 'runs', 'total_runs', 100, 2000, 1000),
('nimbus_master', 'Nimbus Master', 'Complete 250 journeys', 'crown', 'platinum', 'runs', 'total_runs', 250, 5000, 2500),

-- Time Achievements
('first_hour', 'First Hour', 'Run for a total of 1 hour', 'clock', 'bronze', 'time', 'total_time', 3600, 100, 50),
('time_keeper', 'Time Keeper', 'Run for a total of 10 hours', 'timer', 'silver', 'time', 'total_time', 36000, 500, 250),
('endurance_master', 'Endurance Master', 'Run for a total of 50 hours', 'battery', 'gold', 'time', 'total_time', 180000, 2000, 1000),
('time_lord', 'Time Lord', 'Run for a total of 100 hours', 'infinity', 'platinum', 'time', 'total_time', 360000, 5000, 2500),

-- Level Achievements
('level_up', 'Level Up!', 'Reach level 5', 'trending-up', 'bronze', 'level', 'level', 5, 200, 100),
('rising_star', 'Rising Star', 'Reach level 10', 'star', 'silver', 'level', 'level', 10, 500, 250),
('cloud_runner', 'Cloud Runner', 'Reach level 20', 'cloud', 'gold', 'level', 'level', 20, 1000, 500),
('sky_master', 'Sky Master', 'Reach level 50', 'crown', 'platinum', 'level', 'level', 50, 3000, 1500),
('nimbus_legend', 'Nimbus Legend', 'Reach level 100', 'gem', 'legendary', 'level', 'level', 100, 10000, 5000),

-- Single Run Distance Achievements
('sprint_master', 'Sprint Master', 'Complete a 1km run in a single session', 'zap', 'bronze', 'distance', 'single_run_distance', 1000, 100, 50),
('distance_runner', 'Distance Runner', 'Complete a 5km run in a single session', 'target', 'silver', 'distance', 'single_run_distance', 5000, 300, 150),
('long_hauler', 'Long Hauler', 'Complete a 10km run in a single session', 'map-pin', 'gold', 'distance', 'single_run_distance', 10000, 750, 375),
('ultra_distance', 'Ultra Distance', 'Complete a 21km run in a single session', 'mountain', 'platinum', 'distance', 'single_run_distance', 21000, 2000, 1000);

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id UUID)
RETURNS TABLE(new_achievements JSON) AS $$
DECLARE
  user_stats_record RECORD;
  achievement_record RECORD;
  user_achievement_record RECORD;
  new_achievement_ids UUID[] := '{}';
  result_json JSON;
BEGIN
  -- Get user stats
  SELECT * INTO user_stats_record 
  FROM public.user_stats 
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT '[]'::JSON;
    RETURN;
  END IF;
  
  -- Check all achievements
  FOR achievement_record IN 
    SELECT * FROM public.achievements 
    ORDER BY requirement_value ASC
  LOOP
    -- Check if user already has this achievement
    SELECT * INTO user_achievement_record
    FROM public.user_achievements
    WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
    
    -- Skip if already completed
    IF FOUND AND user_achievement_record.is_completed THEN
      CONTINUE;
    END IF;
    
    -- Check if achievement should be awarded
    DECLARE
      should_award BOOLEAN := FALSE;
      current_progress INTEGER := 0;
    BEGIN
      CASE achievement_record.requirement_type
        WHEN 'total_distance' THEN
          current_progress := user_stats_record.total_distance;
          should_award := user_stats_record.total_distance >= achievement_record.requirement_value;
        WHEN 'total_runs' THEN
          current_progress := user_stats_record.total_runs;
          should_award := user_stats_record.total_runs >= achievement_record.requirement_value;
        WHEN 'total_time' THEN
          current_progress := user_stats_record.total_time;
          should_award := user_stats_record.total_time >= achievement_record.requirement_value;
        WHEN 'level' THEN
          current_progress := user_stats_record.level;
          should_award := user_stats_record.level >= achievement_record.requirement_value;
        ELSE
          should_award := FALSE;
      END CASE;
      
      -- Insert or update user achievement
      IF NOT FOUND THEN
        -- Insert new achievement tracking
        INSERT INTO public.user_achievements (user_id, achievement_id, progress, is_completed)
        VALUES (p_user_id, achievement_record.id, current_progress, should_award);
      ELSE
        -- Update existing achievement tracking
        UPDATE public.user_achievements 
        SET progress = current_progress, is_completed = should_award, unlocked_at = CASE WHEN should_award AND NOT is_completed THEN NOW() ELSE unlocked_at END
        WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
      END IF;
      
      -- If newly awarded, add to results and update user stats
      IF should_award AND (NOT FOUND OR NOT user_achievement_record.is_completed) THEN
        new_achievement_ids := array_append(new_achievement_ids, achievement_record.id);
        
        -- Award XP and coins
        UPDATE public.user_stats 
        SET 
          experience = experience + achievement_record.xp_reward,
          updated_at = NOW()
        WHERE user_id = p_user_id;
      END IF;
    END;
  END LOOP;
  
  -- Return newly awarded achievements
  SELECT json_agg(
    json_build_object(
      'id', a.id,
      'key', a.key,
      'title', a.title,
      'description', a.description,
      'icon', a.icon,
      'rarity', a.rarity,
      'xp_reward', a.xp_reward,
      'coin_reward', a.coin_reward
    )
  ) INTO result_json
  FROM public.achievements a
  WHERE a.id = ANY(new_achievement_ids);
  
  RETURN QUERY SELECT COALESCE(result_json, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check single run achievements
CREATE OR REPLACE FUNCTION public.check_single_run_achievements(p_user_id UUID, p_distance INTEGER)
RETURNS TABLE(new_achievements JSON) AS $$
DECLARE
  achievement_record RECORD;
  user_achievement_record RECORD;
  new_achievement_ids UUID[] := '{}';
  result_json JSON;
BEGIN
  -- Check single run distance achievements
  FOR achievement_record IN 
    SELECT * FROM public.achievements 
    WHERE requirement_type = 'single_run_distance' AND requirement_value <= p_distance
    ORDER BY requirement_value DESC
  LOOP
    -- Check if user already has this achievement
    SELECT * INTO user_achievement_record
    FROM public.user_achievements
    WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
    
    -- Skip if already completed
    IF FOUND AND user_achievement_record.is_completed THEN
      CONTINUE;
    END IF;
    
    -- Award the achievement
    IF NOT FOUND THEN
      INSERT INTO public.user_achievements (user_id, achievement_id, progress, is_completed)
      VALUES (p_user_id, achievement_record.id, p_distance, TRUE);
    ELSE
      UPDATE public.user_achievements 
      SET progress = GREATEST(progress, p_distance), is_completed = TRUE, unlocked_at = NOW()
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
    END IF;
    
    new_achievement_ids := array_append(new_achievement_ids, achievement_record.id);
    
    -- Award XP and coins
    UPDATE public.user_stats 
    SET 
      experience = experience + achievement_record.xp_reward,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END LOOP;
  
  -- Return newly awarded achievements
  SELECT json_agg(
    json_build_object(
      'id', a.id,
      'key', a.key,
      'title', a.title,
      'description', a.description,
      'icon', a.icon,
      'rarity', a.rarity,
      'xp_reward', a.xp_reward,
      'coin_reward', a.coin_reward
    )
  ) INTO result_json
  FROM public.achievements a
  WHERE a.id = ANY(new_achievement_ids);
  
  RETURN QUERY SELECT COALESCE(result_json, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;