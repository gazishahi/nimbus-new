import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';
import { usePixelFont } from '@/hooks/usePixelFont';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Database } from 'lucide-react-native';
import PixelButton from '@/components/PixelButton';
import AuthForm from '@/components/AuthForm';
import UserProfile from '@/components/UserProfile';
import SupabaseSetup from '@/components/SupabaseSetup';
import CharacterProgression from '@/components/CharacterProgression';
import { Colors } from '@/constants/Colors';
import { LoginCredentials, RegisterCredentials } from '@/types/auth';

export default function CharacterScreen() {
  const fontsLoaded = usePixelFont();
  const { user, isAuthenticated, isLoading, error, login, register, logout } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showSupabaseSetup, setShowSupabaseSetup] = useState(false);

  if (!fontsLoaded) {
    return null;
  }

  // Check if Supabase is configured
  const isSupabaseConfigured = process.env.EXPO_PUBLIC_SUPABASE_URL && 
                               process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
                               process.env.EXPO_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url' &&
                               process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key';

  // Show Supabase setup if not configured
  if (!isSupabaseConfigured || showSupabaseSetup) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <SupabaseSetup onComplete={() => setShowSupabaseSetup(false)} />
          
          {isSupabaseConfigured && (
            <View style={styles.setupActions}>
              <PixelButton
                title="CONTINUE TO AUTH"
                onPress={() => setShowSupabaseSetup(false)}
                variant="primary"
                size="large"
              />
            </View>
          )}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show authentication form if not logged in
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Database size={32} color={Colors.primary.skyBlue} />
            <Text style={styles.title}>NIMBUS PROFILE</Text>
            <Text style={styles.subtitle}>Sign in to access your cloud runner character</Text>
          </View>

          <AuthForm
            mode={authMode}
            onSubmit={authMode === 'login' ? login : register}
            onModeChange={setAuthMode}
            isLoading={isLoading}
            error={error}
          />

          <View style={styles.setupLinkContainer}>
            <Text style={styles.setupLinkText}>Need to configure Supabase?</Text>
            <PixelButton
              title="SETUP GUIDE"
              onPress={() => setShowSupabaseSetup(true)}
              variant="secondary"
              size="small"
            />
          </View>

          {/* Black Circle Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={require('@/assets/images/black_circle_360x360.png')}
            style={styles.circleImage}
            resizeMode="contain"
          />
        </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show character profile and progression when authenticated
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>HERO</Text>
          <Text style={styles.subtitle}>Your Cloud Running Journey</Text>
        </View>

        {/* User Profile Component */}
        <UserProfile user={user!} onLogout={logout} />

        {/* Character Progression Component */}
        <CharacterProgression />

        {/* Black Circle Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={require('@/assets/images/black_circle_360x360.png')}
            style={styles.circleImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.subtitle}>Supabase Organization Slug</Text>
        <Text style={styles.subtitle}>uaisldekqkaansgnbfgs</Text>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.nightSky,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 2,
    borderBottomColor: Colors.background.overcast,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 18,
    color: Colors.primary.skyBlue,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  setupActions: {
    padding: 20,
  },
  setupLinkContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background.twilight,
    borderWidth: 2,
    borderColor: Colors.card.border,
    marginVertical: 8,
  },
  setupLinkText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 0,
    marginTop: 0,
  },
  circleImage: {
    width: 100,
    height: 100,
  },
  bottomSpacing: {
    height: 100,
  },
});