import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Database, Play, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Copy } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import PixelButton from './PixelButton';
import { supabase } from '@/lib/supabase';

interface DatabaseSetupProps {
  onComplete?: () => void;
}

export default function DatabaseSetup({ onComplete }: DatabaseSetupProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sqlScript = `-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  weekly_distance INTEGER DEFAULT 0,
  monthly_distance INTEGER DEFAULT 0,
  all_time_distance INTEGER DEFAULT 0
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_distance INTEGER DEFAULT 0,
  total_runs INTEGER DEFAULT 0,
  total_time INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  character_class TEXT DEFAULT 'speed-runner',
  skill_points INTEGER DEFAULT 0,
  spent_skill_points INTEGER DEFAULT 0,
  path_skills JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workout_sessions table
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  workout_type TEXT DEFAULT 'running' CHECK (workout_type IN ('running', 'walking', 'cycling', 'other')),
  total_distance INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  average_pace NUMERIC(5,2),
  max_speed NUMERIC(5,2),
  average_heart_rate INTEGER,
  max_heart_rate INTEGER,
  calories_burned INTEGER DEFAULT 0,
  elevation_gain INTEGER DEFAULT 0,
  weather_conditions TEXT,
  notes TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('weekly_distance', 'monthly_distance', 'weekly_runs', 'monthly_runs', 'level_ranking')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  value INTEGER NOT NULL,
  rank_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, leaderboard_type, period_start)
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('bronze', 'silver', 'gold', 'platinum', 'legendary')),
  category TEXT NOT NULL CHECK (category IN ('distance', 'runs', 'time', 'streak', 'speed', 'level', 'special')),
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('total_distance', 'total_runs', 'total_time', 'level', 'streak_days', 'single_run_distance', 'average_pace')),
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 0 NOT NULL,
  coin_reward INTEGER DEFAULT 0 NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for user_stats
CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for workout_sessions
CREATE POLICY "Users can view own workout sessions" ON workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions" ON workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions" ON workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for leaderboards
CREATE POLICY "Anyone can view leaderboards" ON leaderboards
  FOR SELECT USING (true);

-- Create policies for achievements
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (true);

-- Create policies for user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER workout_sessions_updated_at
  BEFORE UPDATE ON workout_sessions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create function to update profile after workout
CREATE OR REPLACE FUNCTION update_profile_after_workout()
RETURNS TRIGGER AS $$
DECLARE
  current_week_start DATE;
  current_month_start DATE;
BEGIN
  -- Only process completed workouts
  IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
    current_week_start := date_trunc('week', NEW.end_time)::date;
    current_month_start := date_trunc('month', NEW.end_time)::date;
    
    -- Update profile distances
    UPDATE profiles 
    SET 
      all_time_distance = all_time_distance + NEW.total_distance,
      weekly_distance = CASE 
        WHEN date_trunc('week', updated_at)::date = current_week_start 
        THEN weekly_distance + NEW.total_distance
        ELSE NEW.total_distance
      END,
      monthly_distance = CASE 
        WHEN date_trunc('month', updated_at)::date = current_month_start 
        THEN monthly_distance + NEW.total_distance
        ELSE NEW.total_distance
      END,
      updated_at = NOW()
    WHERE id = NEW.user_id;
    
    -- Update user stats
    UPDATE user_stats 
    SET 
      total_distance = total_distance + NEW.total_distance,
      total_runs = total_runs + 1,
      total_time = total_time + NEW.total_duration,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update leaderboards after workout
CREATE OR REPLACE FUNCTION update_leaderboards_after_workout()
RETURNS TRIGGER AS $$
DECLARE
  current_week_start DATE;
  current_month_start DATE;
BEGIN
  -- Only process completed workouts
  IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
    current_week_start := date_trunc('week', NEW.end_time)::date;
    current_month_start := date_trunc('month', NEW.end_time)::date;
    
    -- Update weekly distance leaderboard
    INSERT INTO leaderboards (user_id, leaderboard_type, period_start, period_end, value)
    VALUES (
      NEW.user_id, 
      'weekly_distance', 
      current_week_start, 
      current_week_start + interval '6 days',
      NEW.total_distance
    )
    ON CONFLICT (user_id, leaderboard_type, period_start)
    DO UPDATE SET 
      value = leaderboards.value + NEW.total_distance;
    
    -- Update monthly distance leaderboard
    INSERT INTO leaderboards (user_id, leaderboard_type, period_start, period_end, value)
    VALUES (
      NEW.user_id, 
      'monthly_distance', 
      current_month_start, 
      (current_month_start + interval '1 month' - interval '1 day')::date,
      NEW.total_distance
    )
    ON CONFLICT (user_id, leaderboard_type, period_start)
    DO UPDATE SET 
      value = leaderboards.value + NEW.total_distance;
    
    -- Update weekly runs leaderboard
    INSERT INTO leaderboards (user_id, leaderboard_type, period_start, period_end, value)
    VALUES (
      NEW.user_id, 
      'weekly_runs', 
      current_week_start, 
      current_week_start + interval '6 days',
      1
    )
    ON CONFLICT (user_id, leaderboard_type, period_start)
    DO UPDATE SET 
      value = leaderboards.value + 1;
    
    -- Update monthly runs leaderboard
    INSERT INTO leaderboards (user_id, leaderboard_type, period_start, period_end, value)
    VALUES (
      NEW.user_id, 
      'monthly_runs', 
      current_month_start, 
      (current_month_start + interval '1 month' - interval '1 day')::date,
      1
    )
    ON CONFLICT (user_id, leaderboard_type, period_start)
    DO UPDATE SET 
      value = leaderboards.value + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for workout completion
CREATE TRIGGER update_profile_after_workout_trigger
  AFTER INSERT OR UPDATE OF is_completed ON workout_sessions
  FOR EACH ROW
  WHEN (NEW.is_completed = true)
  EXECUTE FUNCTION update_profile_after_workout();

CREATE TRIGGER update_leaderboards_after_workout_trigger
  AFTER INSERT OR UPDATE OF is_completed ON workout_sessions
  FOR EACH ROW
  WHEN (NEW.is_completed = true)
  EXECUTE FUNCTION update_leaderboards_after_workout();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  SET search_path = public;
  
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
CREATE INDEX IF NOT EXISTS profiles_weekly_distance_idx ON profiles(weekly_distance);
CREATE INDEX IF NOT EXISTS profiles_monthly_distance_idx ON profiles(monthly_distance);
CREATE INDEX IF NOT EXISTS profiles_all_time_distance_idx ON profiles(all_time_distance);

CREATE INDEX IF NOT EXISTS user_stats_user_id_idx ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS user_stats_level_idx ON user_stats(level);
CREATE INDEX IF NOT EXISTS user_stats_experience_idx ON user_stats(experience);

CREATE INDEX IF NOT EXISTS workout_sessions_user_id_idx ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS workout_sessions_start_time_idx ON workout_sessions(start_time);

CREATE INDEX IF NOT EXISTS leaderboards_type_period_idx ON leaderboards(leaderboard_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS leaderboards_type_period_rank_idx ON leaderboards(leaderboard_type, period_start, rank_position);
CREATE INDEX IF NOT EXISTS leaderboards_user_type_period_idx ON leaderboards(user_id, leaderboard_type, period_start);
CREATE INDEX IF NOT EXISTS leaderboards_rank_idx ON leaderboards(leaderboard_type, period_start, rank_position);

CREATE INDEX IF NOT EXISTS achievements_key_idx ON achievements(key);
CREATE INDEX IF NOT EXISTS achievements_category_idx ON achievements(category);

CREATE INDEX IF NOT EXISTS user_achievements_user_id_idx ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS user_achievements_achievement_id_idx ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS user_achievements_completed_idx ON user_achievements(is_completed);`;

  const checkTablesExist = async (): Promise<boolean> => {
    try {
      // Try to query the profiles table
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      return !error || !error.message.includes('does not exist');
    } catch (error) {
      return false;
    }
  };

  const createTables = async () => {
    setIsCreating(true);
    setError(null);

    try {
      // Check if tables already exist
      const tablesExist = await checkTablesExist();
      if (tablesExist) {
        setIsComplete(true);
        setIsCreating(false);
        Alert.alert('Success', 'Database tables already exist and are ready to use!');
        onComplete?.();
        return;
      }

      // Execute the SQL script
      const { error } = await supabase.rpc('exec_sql', { sql: sqlScript });

      if (error) {
        console.error('Database creation error:', error);
        setError(`Failed to create tables: ${error.message}`);
      } else {
        setIsComplete(true);
        Alert.alert(
          'Success!', 
          'Database tables created successfully. You can now sign up and sign in with real users.',
          [{ text: 'Continue', onPress: onComplete }]
        );
      }
    } catch (error) {
      console.error('Database setup error:', error);
      setError('Failed to create database tables. Please run the SQL manually in Supabase.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = () => {
    // In a real app, you'd use a clipboard library
    Alert.alert(
      'SQL Script',
      'Copy this SQL script and run it in your Supabase SQL Editor:\n\n' + sqlScript.substring(0, 200) + '...',
      [
        { text: 'OK' }
      ]
    );
  };

  if (isComplete) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.status.success, Colors.primary.deepNimbus]}
          style={styles.header}
        >
          <CheckCircle size={32} color={Colors.text.primary} />
          <Text style={styles.headerTitle}>DATABASE READY</Text>
          <Text style={styles.headerSubtitle}>
            Your Supabase database is configured and ready for authentication
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.successText}>
            ✅ All database tables have been created successfully!
          </Text>
          <Text style={styles.instructionText}>
            You can now create user accounts and sign in. The app will automatically create user profiles and game stats.
          </Text>
          
          {onComplete && (
            <PixelButton
              title="CONTINUE TO AUTH"
              onPress={onComplete}
              variant="success"
              size="large"
              style={styles.continueButton}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary.skyBlue, Colors.primary.deepNimbus]}
        style={styles.header}
      >
        <Database size={32} color={Colors.text.primary} />
        <Text style={styles.headerTitle}>DATABASE SETUP</Text>
        <Text style={styles.headerSubtitle}>
          Create the required database tables for user authentication
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <AlertCircle size={20} color={Colors.status.warning} />
          <Text style={styles.infoText}>
            The profiles table doesn't exist yet. Click the button below to automatically create all required database tables.
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.actionContainer}>
          <PixelButton
            title={isCreating ? "CREATING TABLES..." : "CREATE DATABASE TABLES"}
            onPress={createTables}
            variant="primary"
            size="large"
            disabled={isCreating}
            style={styles.createButton}
          />

          <Text style={styles.orText}>OR</Text>

          <TouchableOpacity style={styles.manualButton} onPress={copyToClipboard}>
            <Copy size={16} color={Colors.text.secondary} />
            <Text style={styles.manualButtonText}>Copy SQL Script</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Manual Setup Instructions:</Text>
          <Text style={styles.instructionsText}>
            1. Go to your Supabase project dashboard{'\n'}
            2. Navigate to SQL Editor{'\n'}
            3. Copy and paste the SQL script{'\n'}
            4. Run the script to create tables{'\n'}
            5. Return to the app and try signing up
          </Text>
        </View>

        <View style={styles.tablesInfo}>
          <Text style={styles.tablesTitle}>Tables to be created:</Text>
          <View style={styles.tableItem}>
            <Text style={styles.tableName}>• profiles</Text>
            <Text style={styles.tableDesc}>User profile information</Text>
          </View>
          <View style={styles.tableItem}>
            <Text style={styles.tableName}>• user_stats</Text>
            <Text style={styles.tableDesc}>Game statistics and progress</Text>
          </View>
          <View style={styles.tableItem}>
            <Text style={styles.tableName}>• workout_sessions</Text>
            <Text style={styles.tableDesc}>Workout tracking and history</Text>
          </View>
          <View style={styles.tableItem}>
            <Text style={styles.tableName}>• leaderboards</Text>
            <Text style={styles.tableDesc}>Rankings and competitions</Text>
          </View>
          <View style={styles.tableItem}>
            <Text style={styles.tableName}>• achievements</Text>
            <Text style={styles.tableDesc}>Achievement definitions</Text>
          </View>
          <View style={styles.tableItem}>
            <Text style={styles.tableName}>• user_achievements</Text>
            <Text style={styles.tableDesc}>User achievement progress</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card.background,
    borderWidth: 3,
    borderColor: Colors.card.border,
    marginVertical: 8,
    shadowOffset: { width: 3, height: 3 },
    shadowColor: Colors.card.shadow,
    shadowOpacity: 0.5,
    elevation: 5,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  content: {
    padding: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.status.warning + '20',
    borderWidth: 2,
    borderColor: Colors.status.warning,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    lineHeight: 16,
    marginLeft: 8,
    flex: 1,
  },
  errorContainer: {
    backgroundColor: Colors.status.error + '20',
    borderWidth: 2,
    borderColor: Colors.status.error,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.status.error,
    textAlign: 'center',
    lineHeight: 14,
  },
  actionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  createButton: {
    width: '100%',
    marginBottom: 16,
  },
  orText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.muted,
    marginBottom: 16,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.overcast,
    borderWidth: 2,
    borderColor: Colors.card.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  manualButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
  },
  instructionsContainer: {
    backgroundColor: Colors.background.twilight,
    borderWidth: 2,
    borderColor: Colors.card.border,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.accent,
    marginBottom: 12,
  },
  instructionsText: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: Colors.text.secondary,
    lineHeight: 14,
  },
  tablesInfo: {
    backgroundColor: Colors.background.overcast,
    borderWidth: 2,
    borderColor: Colors.card.border,
    padding: 16,
  },
  tablesTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.accent,
    marginBottom: 12,
  },
  tableItem: {
    marginBottom: 8,
  },
  tableName: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  tableDesc: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
    marginLeft: 12,
  },
  successText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.status.success,
    textAlign: 'center',
    marginBottom: 16,
  },
  instructionText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
  continueButton: {
    width: '100%',
  },
});