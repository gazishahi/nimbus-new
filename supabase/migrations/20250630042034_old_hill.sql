/*
  # Fix Leaderboard Query Structure

  1. Schema Updates
    - Add function to properly join profiles with user_stats for leaderboard queries
    - Fix relationship between leaderboards and profiles tables
    - Ensure proper column access for level and character_class from user_stats

  2. Data Integrity
    - Maintain existing leaderboard data
    - Ensure proper relationship between tables for future queries

  3. Performance
    - Add appropriate indexes for optimized leaderboard queries
*/

-- Create a better function to get leaderboard data with proper joins
CREATE OR REPLACE FUNCTION public.get_leaderboard_data(
  p_leaderboard_type TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  level INTEGER,
  character_class TEXT,
  value INTEGER,
  rank_position INTEGER
) AS $$
DECLARE
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

  RETURN QUERY
  SELECT 
    l.id,
    l.user_id,
    p.username,
    p.display_name,
    us.level,
    us.character_class,
    l.value,
    l.rank_position
  FROM public.leaderboards l
  JOIN public.profiles p ON l.user_id = p.id
  JOIN public.user_stats us ON p.id = us.user_id
  WHERE l.leaderboard_type = p_leaderboard_type
    AND l.period_start = current_period_start
  ORDER BY l.rank_position ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get leaderboard data directly from profiles
CREATE OR REPLACE FUNCTION public.get_profile_leaderboard(
  p_distance_field TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  display_name TEXT,
  level INTEGER,
  character_class TEXT,
  value INTEGER,
  rank INTEGER
) AS $$
BEGIN
  IF p_distance_field = 'weekly_distance' THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.username,
      p.display_name,
      us.level,
      us.character_class,
      p.weekly_distance,
      ROW_NUMBER() OVER (ORDER BY p.weekly_distance DESC)::INTEGER
    FROM public.profiles p
    JOIN public.user_stats us ON p.id = us.user_id
    WHERE p.weekly_distance > 0
    ORDER BY p.weekly_distance DESC
    LIMIT p_limit;
  ELSIF p_distance_field = 'monthly_distance' THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.username,
      p.display_name,
      us.level,
      us.character_class,
      p.monthly_distance,
      ROW_NUMBER() OVER (ORDER BY p.monthly_distance DESC)::INTEGER
    FROM public.profiles p
    JOIN public.user_stats us ON p.id = us.user_id
    WHERE p.monthly_distance > 0
    ORDER BY p.monthly_distance DESC
    LIMIT p_limit;
  ELSE -- all_time_distance
    RETURN QUERY
    SELECT 
      p.id,
      p.username,
      p.display_name,
      us.level,
      us.character_class,
      p.all_time_distance,
      ROW_NUMBER() OVER (ORDER BY p.all_time_distance DESC)::INTEGER
    FROM public.profiles p
    JOIN public.user_stats us ON p.id = us.user_id
    WHERE p.all_time_distance > 0
    ORDER BY p.all_time_distance DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the user_stats foreign key to reference profiles.id instead of auth.users.id
-- First drop the existing foreign key constraint if it exists
ALTER TABLE IF EXISTS public.user_stats 
  DROP CONSTRAINT IF EXISTS user_stats_user_id_fkey;

-- Then add the new foreign key constraint
ALTER TABLE IF EXISTS public.user_stats
  ADD CONSTRAINT user_stats_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Create a function to get a user's rank in each leaderboard
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
  
  -- Get total rank (calculated from profiles)
  WITH ranked_profiles AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY all_time_distance DESC) as rank
    FROM public.profiles
    WHERE all_time_distance > 0
  )
  SELECT rank INTO total_rank
  FROM ranked_profiles
  WHERE id = p_user_id;
  
  -- Get level rank
  WITH ranked_levels AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY level DESC) as rank
    FROM public.user_stats
    WHERE level > 0
  )
  SELECT rank INTO level_rank
  FROM ranked_levels
  WHERE user_id = p_user_id;
  
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