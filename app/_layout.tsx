import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, Text, View } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { usePixelFont } from '@/hooks/usePixelFont';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  const fontsLoaded = usePixelFont();
  
  // Call framework ready hook directly
  useFrameworkReady();

  // Show loading state while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <Text style={{ color: '#16537e', fontSize: 16 }}>Loading Nimbus...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}