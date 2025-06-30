/*
  # Leaderboard Functions

  1. New Functions
    - `update_leaderboards()` - Updates all leaderboard entries
    - `get_user_rank()` - Gets a user's rank for a specific leaderboard
    
  2. Scheduled Updates
    - Leaderboards are updated after each workout completion
    - Weekly leaderboards reset every Sunday
    - Monthly leaderboards reset on the 1st of each month
*/

-- Function to update leaderboards
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
  
  -- Update weekly distance leaderboard
  INSERT INTO public.leaderboards (user_id, leaderboard_type, period_start, period_end, value)
  SELECT 
    us.user_id,
    'weekly_distance',
    current_week_start,
    current_week_end,
    COALESCE(SUM(ws.total_distance), 0)
  FROM public.user_stats us
  LEFT JOIN public.workout_sessions ws ON us.user_id = ws.user_id 
    AND ws.start_time >= current_week_start 
    AND ws.start_time <= current_week_end
    AND ws.is_completed = true
  GROUP BY us.user_id
  ON CONFLICT (user_id, leaderboard_type, period_start) 
  DO UPDATE SET 
    value = EXCLUDED.value,
    period_end = EXCLUDED.period_end;
  
  -- Update monthly distance leaderboard
  INSERT INTO public.leaderboards (user_id, leaderboard_type, period_start, period_end, value)
  SELECT 
    us.user_id,
    'monthly_distance',
    current_month_start,
    current_month_end,
    COALESCE(SUM(ws.total_distance), 0)
  FROM public.user_stats us
  LEFT JOIN public.workout_sessions ws ON us.user_id = ws.user_id 
    AND ws.start_time >= current_month_start 
    AND ws.start_time <= current_month_end
    AND ws.is_completed = true
  GROUP BY us.user_id
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
  ON CONFLICT (user_id, leaderboard_type, period_start) 
  DO UPDATE SET 
    value = EXCLUDED.value,
    period_end = EXCLUDED.period_end;
  
  -- Update rankings for weekly distance
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
  
  -- Update rankings for monthly distance
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
  
  -- Update rankings for level ranking
  WITH ranked_level AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY leaderboard_type, period_start ORDER BY value DESC) as new_rank
    FROM public.leaderboards 
    WHERE leaderboard_type = 'level_ranking' AND period_start = CURRENT_DATE
  )
  UPDATE public.leaderboards 
  SET rank_position = ranked_level.new_rank
  FROM ranked_level 
  WHERE public.leaderboards.id = ranked_level.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a user's rank for a specific leaderboard type
CREATE OR REPLACE FUNCTION public.get_user_rank(
  p_user_id UUID,
  p_leaderboard_type TEXT
)
RETURNS INTEGER AS $$
DECLARE
  user_rank INTEGER;
  current_period_start DATE;
BEGIN
  -- Determine the current period start based on leaderboard type
  IF p_leaderboard_type = 'weekly_distance' THEN
    current_period_start := date_trunc('week', CURRENT_DATE);
  ELSIF p_leaderboard_type = 'monthly_distance' THEN
    current_period_start := date_trunc('month', CURRENT_DATE);
  ELSE
    current_period_start := CURRENT_DATE;
  END IF;
  
  -- Get the user's rank
  SELECT rank_position INTO user_rank
  FROM public.leaderboards
  WHERE user_id = p_user_id
    AND leaderboard_type = p_leaderboard_type
    AND period_start = current_period_start;
  
  RETURN user_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to update leaderboards after workout completion
CREATE OR REPLACE FUNCTION public.update_leaderboards_after_workout()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update leaderboards for completed workouts
  IF NEW.is_completed = true THEN
    PERFORM public.update_leaderboards();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on workout_sessions
DROP TRIGGER IF EXISTS update_leaderboards_after_workout_trigger ON public.workout_sessions;
CREATE TRIGGER update_leaderboards_after_workout_trigger
  AFTER INSERT OR UPDATE OF is_completed
  ON public.workout_sessions
  FOR EACH ROW
  WHEN (NEW.is_completed = true)
  EXECUTE FUNCTION public.update_leaderboards_after_workout();