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
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

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
CREATE INDEX IF NOT EXISTS user_stats_user_id_idx ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS user_stats_level_idx ON user_stats(level);
CREATE INDEX IF NOT EXISTS user_stats_experience_idx ON user_stats(experience);`;

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