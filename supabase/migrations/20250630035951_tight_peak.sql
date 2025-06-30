/*
  # Leaderboard Integration with Profiles

  1. Schema Updates
    - Add distance tracking fields to profiles table
    - Create functions to update profile distance metrics
    - Create triggers to automatically update metrics after workouts
    - Update leaderboard functions to use profile metrics

  2. Functions
    - update_profile_distance_metrics: Updates weekly, monthly, and all-time distance for a user
    - update_profile_after_workout: Trigger function to update metrics after workout completion
    - update_leaderboards: Enhanced function to populate leaderboards from profile metrics
    - get_user_rankings: Function to get user rankings across all leaderboard types

  3. Indexes
    - Add indexes for new profile distance columns for efficient querying
*/

-- Add distance tracking fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_distance INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_distance INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS all_time_distance INTEGER DEFAULT 0;

-- Create function to update profile distance metrics
CREATE OR REPLACE FUNCTION public.update_profile_distance_metrics(p_user_id UUID)
RETURNS void AS $$
DECLARE
  current_week_start DATE;
  current_month_start DATE;
  weekly_total INTEGER;
  monthly_total INTEGER;
  all_time_total INTEGER;
BEGIN
  -- Calculate current week and month starts
  current_week_start := date_trunc('week', CURRENT_DATE);
  current_month_start := date_trunc('month', CURRENT_DATE);
  
  -- Calculate weekly distance from workout_sessions
  SELECT COALESCE(SUM(total_distance), 0) INTO weekly_total
  FROM public.workout_sessions
  WHERE user_id = p_user_id
    AND start_time >= current_week_start
    AND is_completed = true;
  
  -- Calculate monthly distance from workout_sessions
  SELECT COALESCE(SUM(total_distance), 0) INTO monthly_total
  FROM public.workout_sessions
  WHERE user_id = p_user_id
    AND start_time >= current_month_start
    AND is_completed = true;
  
  -- Calculate all-time distance from user_stats (more reliable for total)
  SELECT COALESCE(total_distance, 0) INTO all_time_total
  FROM public.user_stats
  WHERE user_id = p_user_id;
  
  -- Update profile with new distance metrics
  UPDATE public.profiles
  SET 
    weekly_distance = weekly_total,
    monthly_distance = monthly_total,
    all_time_distance = all_time_total,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to update profile metrics after workout completion
CREATE OR REPLACE FUNCTION public.update_profile_after_workout()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update metrics for completed workouts
  IF NEW.is_completed = true THEN
    PERFORM public.update_profile_distance_metrics(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on workout_sessions
DROP TRIGGER IF EXISTS update_profile_after_workout_trigger ON public.workout_sessions;
CREATE TRIGGER update_profile_after_workout_trigger
  AFTER INSERT OR UPDATE OF is_completed
  ON public.workout_sessions
  FOR EACH ROW
  WHEN (NEW.is_completed = true)
  EXECUTE FUNCTION public.update_profile_after_workout();

-- Enhanced leaderboard update function using profile metrics
CREATE OR REPLACE FUNCTION public.update_leaderboards()
RETURNS void AS $$
DECLARE
  current_week_start DATE;
  current_month_start DATE;
  current_week_end DATE;
  current_month_end DATE;
BEGIN
  -- Calculate current week and month starts/ends
  current_week_start := date_trunc('week', CURRENT_DATE);
  current_month_start := date_trunc('month', CURRENT_DATE);
  current_week_end := current_week_start + INTERVAL '6 days';
  current_month_end := (current_month_start + INTERVAL '1 month') - INTERVAL '1 day';
  
  -- Update weekly distance leaderboard using profile metrics
  INSERT INTO public.leaderboards (user_id, leaderboard_type, period_start, period_end, value)
  SELECT 
    p.id,
    'weekly_distance',
    current_week_start,
    current_week_end,
    p.weekly_distance
  FROM public.profiles p
  WHERE p.weekly_distance > 0
  ON CONFLICT (user_id, leaderboard_type, period_start) 
  DO UPDATE SET 
    value = EXCLUDED.value,
    period_end = EXCLUDED.period_end;
  
  -- Update monthly distance leaderboard using profile metrics
  INSERT INTO public.leaderboards (user_id, leaderboard_type, period_start, period_end, value)
  SELECT 
    p.id,
    'monthly_distance',
    current_month_start,
    current_month_end,
    p.monthly_distance
  FROM public.profiles p
  WHERE p.monthly_distance > 0
  ON CONFLICT (user_id, leaderboard_type, period_start) 
  DO UPDATE SET 
    value = EXCLUDED.value,
    period_end = EXCLUDED.period_end;
  
  -- Update weekly runs leaderboard
  INSERT INTO public.leaderboards (user_id, leaderboard_type, period_start, period_end, value)
  SELECT 
    ws.user_id,
    'weekly_runs',
    current_week_start,
    current_week_end,
    COUNT(*)
  FROM public.workout_sessions ws
  WHERE ws.start_time >= current_week_start
    AND ws.is_completed = true
  GROUP BY ws.user_id
  HAVING COUNT(*) > 0
  ON CONFLICT (user_id, leaderboard_type, period_start) 
  DO UPDATE SET 
    value = EXCLUDED.value,
    period_end = EXCLUDED.period_end;
  
  -- Update monthly runs leaderboard
  INSERT INTO public.leaderboards (user_id, leaderboard_type, period_start, period_end, value)
  SELECT 
    ws.user_id,
    'monthly_runs',
    current_month_start,
    current_month_end,
    COUNT(*)
  FROM public.workout_sessions ws
  WHERE ws.start_time >= current_month_start
    AND ws.is_completed = true
  GROUP BY ws.user_id
  HAVING COUNT(*) > 0
  ON CONFLICT (user_id, leaderboard_type, period_start) 
  DO UPDATE SET 
    value = EXCLUDED.value,
    period_end = EXCLUDED.period_end;
  
  -- Update level ranking leaderboard
  INSERT INTO public.leaderboards (user_id, leaderboard_type, period_start, period_end, value)
  SELECT 
    user_id,
    'level_ranking',
    CURRENT_DATE,
    CURRENT_DATE,
    level
  FROM public.user_stats
  WHERE level > 1
  ON CONFLICT (user_id, leaderboard_type, period_start) 
  DO UPDATE SET 
    value = EXCLUDED.value,
    period_end = EXCLUDED.period_end;
  
  -- Update rankings for all leaderboard types
  WITH ranked_entries AS (
    SELECT 
      id,
      leaderboard_type,
      period_start,
      ROW_NUMBER() OVER (
        PARTITION BY leaderboard_type, period_start 
        ORDER BY value DESC
      ) as new_rank
    FROM public.leaderboards 
  )
  UPDATE public.leaderboards 
  SET rank_position = ranked_entries.new_rank
  FROM ranked_entries 
  WHERE public.leaderboards.id = ranked_entries.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user rankings directly from leaderboards
CREATE OR REPLACE FUNCTION public.get_user_rankings(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  weekly_distance_rank INTEGER;
  monthly_distance_rank INTEGER;
  weekly_runs_rank INTEGER;
  monthly_runs_rank INTEGER;
  level_rank INTEGER;
  result JSON;
BEGIN
  -- Get weekly distance rank
  SELECT rank_position INTO weekly_distance_rank
  FROM public.leaderboards
  WHERE user_id = p_user_id
    AND leaderboard_type = 'weekly_distance'
    AND period_start = date_trunc('week', CURRENT_DATE);
  
  -- Get monthly distance rank
  SELECT rank_position INTO monthly_distance_rank
  FROM public.leaderboards
  WHERE user_id = p_user_id
    AND leaderboard_type = 'monthly_distance'
    AND period_start = date_trunc('month', CURRENT_DATE);
  
  -- Get weekly runs rank
  SELECT rank_position INTO weekly_runs_rank
  FROM public.leaderboards
  WHERE user_id = p_user_id
    AND leaderboard_type = 'weekly_runs'
    AND period_start = date_trunc('week', CURRENT_DATE);
  
  -- Get monthly runs rank
  SELECT rank_position INTO monthly_runs_rank
  FROM public.leaderboards
  WHERE user_id = p_user_id
    AND leaderboard_type = 'monthly_runs'
    AND period_start = date_trunc('month', CURRENT_DATE);
  
  -- Get level rank
  SELECT rank_position INTO level_rank
  FROM public.leaderboards
  WHERE user_id = p_user_id
    AND leaderboard_type = 'level_ranking'
    AND period_start = CURRENT_DATE;
  
  -- Build result JSON
  SELECT json_build_object(
    'weekly_distance_rank', weekly_distance_rank,
    'monthly_distance_rank', monthly_distance_rank,
    'weekly_runs_rank', weekly_runs_rank,
    'monthly_runs_rank', monthly_runs_rank,
    'level_rank', level_rank
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leaderboard data with profile information
CREATE OR REPLACE FUNCTION public.get_leaderboard_with_profiles(
  p_leaderboard_type TEXT,
  p_period_start DATE,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  value INTEGER,
  rank_position INTEGER,
  level INTEGER,
  character_class TEXT,
  weekly_distance INTEGER,
  monthly_distance INTEGER,
  all_time_distance INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    l.value,
    l.rank_position,
    us.level,
    us.character_class,
    p.weekly_distance,
    p.monthly_distance,
    p.all_time_distance
  FROM public.leaderboards l
  JOIN public.profiles p ON l.user_id = p.id
  LEFT JOIN public.user_stats us ON l.user_id = us.user_id
  WHERE l.leaderboard_type = p_leaderboard_type
    AND l.period_start = p_period_start
  ORDER BY l.rank_position ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update all existing profiles with correct distance metrics
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM public.profiles
  LOOP
    PERFORM public.update_profile_distance_metrics(user_record.id);
  END LOOP;
END $$;

-- Update leaderboards with new data
SELECT public.update_leaderboards();

-- Create indexes for new profile columns
CREATE INDEX IF NOT EXISTS profiles_weekly_distance_idx ON public.profiles(weekly_distance);
CREATE INDEX IF NOT EXISTS profiles_monthly_distance_idx ON public.profiles(monthly_distance);
CREATE INDEX IF NOT EXISTS profiles_all_time_distance_idx ON public.profiles(all_time_distance);

-- Create additional indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS leaderboards_type_period_rank_idx ON public.leaderboards(leaderboard_type, period_start, rank_position);
CREATE INDEX IF NOT EXISTS leaderboards_user_type_period_idx ON public.leaderboards(user_id, leaderboard_type, period_start);