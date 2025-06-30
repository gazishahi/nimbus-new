/*
  # Update user_stats table for comprehensive character progression

  1. Schema Updates
    - Add skill_points column for available skill points
    - Add spent_skill_points column to track used points
    - Add path_skills column for JSON storage of skill levels
    - Update character_class to support new path system

  2. Data Migration
    - Ensure all existing users start with proper defaults
    - Reset any existing progression to level 1 for consistency

  3. Indexes
    - Add indexes for better query performance
*/

-- Add new columns to user_stats table
DO $$
BEGIN
  -- Add skill_points column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'skill_points'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN skill_points INTEGER DEFAULT 0;
  END IF;

  -- Add spent_skill_points column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'spent_skill_points'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN spent_skill_points INTEGER DEFAULT 0;
  END IF;

  -- Add path_skills column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'path_skills'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN path_skills TEXT DEFAULT '{}';
  END IF;
END $$;

-- Update existing records to have proper defaults
UPDATE user_stats 
SET 
  skill_points = COALESCE(skill_points, 0),
  spent_skill_points = COALESCE(spent_skill_points, 0),
  path_skills = COALESCE(path_skills, '{}')
WHERE 
  skill_points IS NULL 
  OR spent_skill_points IS NULL 
  OR path_skills IS NULL;

-- Ensure all users start at level 1 with 0 stats for consistency
UPDATE user_stats 
SET 
  level = 1,
  experience = 0,
  total_distance = 0,
  total_runs = 0,
  total_time = 0,
  skill_points = 0,
  spent_skill_points = 0,
  path_skills = '{}'
WHERE level IS NULL OR level = 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS user_stats_skill_points_idx ON user_stats(skill_points);
CREATE INDEX IF NOT EXISTS user_stats_character_class_idx ON user_stats(character_class);

-- Update the handle_new_user function to include new columns
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO user_stats (
    user_id, 
    level, 
    experience, 
    total_distance, 
    total_runs, 
    total_time, 
    character_class,
    skill_points,
    spent_skill_points,
    path_skills
  )
  VALUES (
    NEW.id, 
    1, 
    0, 
    0, 
    0, 
    0, 
    'speed-runner',
    0,
    0,
    '{}'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;