/*
  # Leaderboard Integration with Profiles

  1. Schema Updates
    - Add weekly_distance, monthly_distance, and all_time_distance to profiles table
    - Create function to update profile distance metrics
    - Create trigger to update profile metrics when workouts are completed

  2. Leaderboard Improvements
    - Enhance leaderboard update function to use profile metrics
    - Add function to get user rankings directly from profiles

  3. Security
    - Ensure all functions are security definer for proper permissions
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
  
  -- Calculate weekly distance
  SELECT COALESCE(SUM(total_distance), 0) INTO weekly_total
  FROM public.workout_sessions
  WHERE user_id = p_user_id
    AND start_time >= current_week_start
    AND is_completed = true;
  
  -- Calculate monthly distance
  SELECT COALESCE(SUM(total_distance), 0) INTO monthly_total
  FROM public.workout_sessions
  WHERE user_id = p_user_id
    AND start_time >= current_month_start
    AND is_completed = true;
  
  -- Calculate all-time distance
  SELECT COALESCE(SUM(total_distance), 0) INTO all_time_total
  FROM public.workout_sessions
  WHERE user_id = p_user_id
    AND is_completed = true;
  
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

-- Enhance leaderboard update function to use profile metrics
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
  
  -- Update all-time distance leaderboard
  INSERT INTO public.leaderboards (user_id, leaderboard_type, period_start, period_end, value)
  SELECT 
    p.id,
    'total_distance',
    '2000-01-01'::date, -- Fixed start date for all-time
    CURRENT_DATE,
    p.all_time_distance
  FROM public.profiles p
  WHERE p.all_time_distance > 0
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

-- Function to get user rankings directly from profiles
CREATE OR REPLACE FUNCTION public.get_user_rankings(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  weekly_rank INTEGER;
  monthly_rank INTEGER;
  total_rank INTEGER;
  level_rank INTEGER;
  result JSON;
BEGIN
  -- Get weekly rank
  SELECT rank_position INTO weekly_rank
  FROM public.leaderboards
  WHERE user_id = p_user_id
    AND leaderboard_type = 'weekly_distance'
    AND period_start = date_trunc('week', CURRENT_DATE);
  
  -- Get monthly rank
  SELECT rank_position INTO monthly_rank
  FROM public.leaderboards
  WHERE user_id = p_user_id
    AND leaderboard_type = 'monthly_distance'
    AND period_start = date_trunc('month', CURRENT_DATE);
  
  -- Get total rank
  SELECT rank_position INTO total_rank
  FROM public.leaderboards
  WHERE user_id = p_user_id
    AND leaderboard_type = 'total_distance'
    AND period_start = '2000-01-01'::date;
  
  -- Get level rank
  SELECT rank_position INTO level_rank
  FROM public.leaderboards
  WHERE user_id = p_user_id
    AND leaderboard_type = 'level_ranking'
    AND period_start = CURRENT_DATE;
  
  -- Build result JSON
  SELECT json_build_object(
    'weekly_rank', weekly_rank,
    'monthly_rank', monthly_rank,
    'total_rank', total_rank,
    'level_rank', level_rank
  ) INTO result;
  
  RETURN result;
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