/*
  # Enhanced Nimbus Database Schema

  1. New Tables
    - `workout_sessions` - Track individual workout sessions
    - `quest_sessions` - Track live quest sessions and results
    - `leaderboards` - Weekly/monthly leaderboards
    - `social_connections` - Friend connections between users
    - `challenges` - Community challenges and events

  2. Enhancements
    - Add workout history tracking
    - Improve quest result persistence
    - Add social features foundation
    - Create leaderboard system
*/

-- Create workout_sessions table for detailed workout tracking
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  workout_type TEXT DEFAULT 'running' CHECK (workout_type IN ('running', 'walking', 'cycling', 'other')),
  total_distance INTEGER DEFAULT 0, -- meters
  total_duration INTEGER DEFAULT 0, -- seconds
  average_pace DECIMAL(5,2), -- min/km
  max_speed DECIMAL(5,2), -- km/h
  average_heart_rate INTEGER,
  max_heart_rate INTEGER,
  calories_burned INTEGER DEFAULT 0,
  elevation_gain INTEGER DEFAULT 0,
  weather_conditions TEXT,
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quest_sessions table for live quest tracking
CREATE TABLE IF NOT EXISTS public.quest_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  total_quests_completed INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  total_coins_earned INTEGER DEFAULT 0,
  quest_data JSONB DEFAULT '[]', -- Store completed quest details
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leaderboards table for competitive features
CREATE TABLE IF NOT EXISTS public.leaderboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('weekly_distance', 'monthly_distance', 'weekly_runs', 'monthly_runs', 'level_ranking')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  value INTEGER NOT NULL, -- distance in meters, run count, or level
  rank_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, leaderboard_type, period_start)
);

-- Create social_connections table for friend system
CREATE TABLE IF NOT EXISTS public.social_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- Create challenges table for community events
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('distance', 'runs', 'time', 'community')),
  target_value INTEGER NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  reward_xp INTEGER DEFAULT 0,
  reward_coins INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create challenge_participants table
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for workout_sessions
CREATE POLICY "Users can view own workout sessions" ON public.workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions" ON public.workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions" ON public.workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for quest_sessions
CREATE POLICY "Users can view own quest sessions" ON public.quest_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quest sessions" ON public.quest_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quest sessions" ON public.quest_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for leaderboards (read-only for users)
CREATE POLICY "Anyone can view leaderboards" ON public.leaderboards
  FOR SELECT TO public USING (true);

-- Create policies for social_connections
CREATE POLICY "Users can view own connections" ON public.social_connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create connections" ON public.social_connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own connections" ON public.social_connections
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Create policies for challenges
CREATE POLICY "Anyone can view active challenges" ON public.challenges
  FOR SELECT USING (is_active = true);

-- Create policies for challenge_participants
CREATE POLICY "Users can view challenge participants" ON public.challenge_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join challenges" ON public.challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON public.challenge_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS workout_sessions_user_id_idx ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS workout_sessions_start_time_idx ON public.workout_sessions(start_time);
CREATE INDEX IF NOT EXISTS quest_sessions_user_id_idx ON public.quest_sessions(user_id);
CREATE INDEX IF NOT EXISTS quest_sessions_workout_id_idx ON public.quest_sessions(workout_session_id);
CREATE INDEX IF NOT EXISTS leaderboards_type_period_idx ON public.leaderboards(leaderboard_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS leaderboards_rank_idx ON public.leaderboards(leaderboard_type, period_start, rank_position);
CREATE INDEX IF NOT EXISTS social_connections_users_idx ON public.social_connections(requester_id, addressee_id);
CREATE INDEX IF NOT EXISTS challenges_active_dates_idx ON public.challenges(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS challenge_participants_challenge_idx ON public.challenge_participants(challenge_id);

-- Create triggers for updated_at
CREATE TRIGGER workout_sessions_updated_at
  BEFORE UPDATE ON public.workout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER social_connections_updated_at
  BEFORE UPDATE ON public.social_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to update leaderboards
CREATE OR REPLACE FUNCTION public.update_leaderboards()
RETURNS void AS $$
DECLARE
  current_week_start DATE;
  current_month_start DATE;
BEGIN
  -- Calculate current week and month starts
  current_week_start := date_trunc('week', CURRENT_DATE);
  current_month_start := date_trunc('month', CURRENT_DATE);
  
  -- Update weekly distance leaderboard
  INSERT INTO public.leaderboards (user_id, leaderboard_type, period_start, period_end, value)
  SELECT 
    us.user_id,
    'weekly_distance',
    current_week_start,
    current_week_start + INTERVAL '6 days',
    COALESCE(SUM(ws.total_distance), 0)
  FROM public.user_stats us
  LEFT JOIN public.workout_sessions ws ON us.user_id = ws.user_id 
    AND ws.start_time >= current_week_start 
    AND ws.start_time < current_week_start + INTERVAL '7 days'
    AND ws.is_completed = true
  GROUP BY us.user_id
  ON CONFLICT (user_id, leaderboard_type, period_start) 
  DO UPDATE SET value = EXCLUDED.value;
  
  -- Update monthly distance leaderboard
  INSERT INTO public.leaderboards (user_id, leaderboard_type, period_start, period_end, value)
  SELECT 
    us.user_id,
    'monthly_distance',
    current_month_start,
    (current_month_start + INTERVAL '1 month' - INTERVAL '1 day'),
    COALESCE(SUM(ws.total_distance), 0)
  FROM public.user_stats us
  LEFT JOIN public.workout_sessions ws ON us.user_id = ws.user_id 
    AND ws.start_time >= current_month_start 
    AND ws.start_time < current_month_start + INTERVAL '1 month'
    AND ws.is_completed = true
  GROUP BY us.user_id
  ON CONFLICT (user_id, leaderboard_type, period_start) 
  DO UPDATE SET value = EXCLUDED.value;
  
  -- Update rankings
  WITH ranked_weekly AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY leaderboard_type, period_start ORDER BY value DESC) as new_rank
    FROM public.leaderboards 
    WHERE leaderboard_type = 'weekly_distance' AND period_start = current_week_start
  )
  UPDATE public.leaderboards 
  SET rank_position = ranked_weekly.new_rank
  FROM ranked_weekly 
  WHERE public.leaderboards.id = ranked_weekly.id;
  
  WITH ranked_monthly AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY leaderboard_type, period_start ORDER BY value DESC) as new_rank
    FROM public.leaderboards 
    WHERE leaderboard_type = 'monthly_distance' AND period_start = current_month_start
  )
  UPDATE public.leaderboards 
  SET rank_position = ranked_monthly.new_rank
  FROM ranked_monthly 
  WHERE public.leaderboards.id = ranked_monthly.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save workout session
CREATE OR REPLACE FUNCTION public.save_workout_session(
  p_user_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_total_distance INTEGER,
  p_total_duration INTEGER,
  p_average_pace DECIMAL DEFAULT NULL,
  p_max_speed DECIMAL DEFAULT NULL,
  p_average_heart_rate INTEGER DEFAULT NULL,
  p_max_heart_rate INTEGER DEFAULT NULL,
  p_calories_burned INTEGER DEFAULT 0,
  p_elevation_gain INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  workout_id UUID;
BEGIN
  INSERT INTO public.workout_sessions (
    user_id, start_time, end_time, total_distance, total_duration,
    average_pace, max_speed, average_heart_rate, max_heart_rate,
    calories_burned, elevation_gain, is_completed
  )
  VALUES (
    p_user_id, p_start_time, p_end_time, p_total_distance, p_total_duration,
    p_average_pace, p_max_speed, p_average_heart_rate, p_max_heart_rate,
    p_calories_burned, p_elevation_gain, true
  )
  RETURNING id INTO workout_id;
  
  RETURN workout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save quest session results
CREATE OR REPLACE FUNCTION public.save_quest_session(
  p_user_id UUID,
  p_workout_session_id UUID,
  p_session_start TIMESTAMPTZ,
  p_session_end TIMESTAMPTZ,
  p_total_quests_completed INTEGER,
  p_total_xp_earned INTEGER,
  p_total_coins_earned INTEGER,
  p_quest_data JSONB
)
RETURNS UUID AS $$
DECLARE
  quest_session_id UUID;
BEGIN
  INSERT INTO public.quest_sessions (
    user_id, workout_session_id, session_start, session_end,
    total_quests_completed, total_xp_earned, total_coins_earned,
    quest_data, is_active
  )
  VALUES (
    p_user_id, p_workout_session_id, p_session_start, p_session_end,
    p_total_quests_completed, p_total_xp_earned, p_total_coins_earned,
    p_quest_data, false
  )
  RETURNING id INTO quest_session_id;
  
  RETURN quest_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;