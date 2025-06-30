import { Tabs } from 'expo-router';
import { Activity, Trophy, ChartBar as BarChart3, User } from 'lucide-react-native';
import { usePixelFont } from '@/hooks/usePixelFont';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  const fontsLoaded = usePixelFont();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background.nightSky,
          borderTopColor: Colors.card.border,
          borderTopWidth: 2,
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary.skyBlue,
        tabBarInactiveTintColor: Colors.text.muted,
        tabBarLabelStyle: {
          fontFamily: 'PressStart2P',
          fontSize: 10,
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Run',
          tabBarIcon: ({ size, color }) => (
            <Activity size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Goals',
          tabBarIcon: ({ size, color }) => (
            <Trophy size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Rank',
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="character"
        options={{
          title: 'Hero',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}