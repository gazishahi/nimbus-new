/*
  # Add workout sessions table

  1. New Table
    - `workout_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz, nullable)
      - `workout_type` (text, check constraint for valid types)
      - `total_distance` (integer, default 0)
      - `total_duration` (integer, default 0)
      - `average_pace` (decimal, nullable)
      - `max_speed` (decimal, nullable)
      - `calories_burned` (integer, default 0)
      - `is_completed` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on the table
    - Add policies for users to manage their own workout sessions

  3. Indexes
    - Create indexes for better query performance
*/

-- Create workout_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  workout_type TEXT DEFAULT 'outdoor_run' CHECK (workout_type IN ('outdoor_run', 'outdoor_walk')),
  total_distance INTEGER DEFAULT 0, -- meters
  total_duration INTEGER DEFAULT 0, -- seconds
  average_pace DECIMAL(5,2), -- min/km
  max_speed DECIMAL(5,2), -- km/h
  calories_burned INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for workout_sessions
CREATE POLICY "Users can view own workout sessions" ON public.workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions" ON public.workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions" ON public.workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS workout_sessions_updated_at ON public.workout_sessions;
CREATE TRIGGER workout_sessions_updated_at
  BEFORE UPDATE ON public.workout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS workout_sessions_user_id_idx ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS workout_sessions_start_time_idx ON public.workout_sessions(start_time);
CREATE INDEX IF NOT EXISTS workout_sessions_workout_type_idx ON public.workout_sessions(workout_type);

-- Function to save workout session
CREATE OR REPLACE FUNCTION public.save_workout_session(
  p_user_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_workout_type TEXT,
  p_total_distance INTEGER,
  p_total_duration INTEGER,
  p_average_pace DECIMAL DEFAULT NULL,
  p_max_speed DECIMAL DEFAULT NULL,
  p_calories_burned INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  workout_id UUID;
BEGIN
  INSERT INTO public.workout_sessions (
    user_id, start_time, end_time, workout_type, total_distance, total_duration,
    average_pace, max_speed, calories_burned, is_completed
  )
  VALUES (
    p_user_id, p_start_time, p_end_time, p_workout_type, p_total_distance, p_total_duration,
    p_average_pace, p_max_speed, p_calories_burned, TRUE
  )
  RETURNING id INTO workout_id;
  
  RETURN workout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;