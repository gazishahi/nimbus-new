import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, LogOut, Settings, Calendar, Trophy } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { User as UserType } from '@/types/auth';
import PixelButton from './PixelButton';

interface UserProfileProps {
  user: UserType;
  onLogout: () => void;
}

export default function UserProfile({ user, onLogout }: UserProfileProps) {
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <LinearGradient
        colors={[Colors.primary.skyBlue, Colors.primary.deepNimbus]}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(user.displayName || user.username)}
            </Text>
          </View>
        </View>
        <Text style={styles.displayName}>
          {user.displayName || user.username}
        </Text>
        <Text style={styles.username}>@{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </LinearGradient>

      {/* Profile Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Calendar size={20} color={Colors.text.accent} />
          <Text style={styles.statLabel}>JOINED</Text>
          <Text style={styles.statValue}>{formatDate(user.createdAt)}</Text>
        </View>
        <View style={styles.statItem}>
          <Trophy size={20} color={Colors.text.accent} />
          <Text style={styles.statLabel}>LAST LOGIN</Text>
          <Text style={styles.statValue}>{formatDate(user.lastLoginAt)}</Text>
        </View>
      </View>

      {/* Profile Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Settings size={20} color={Colors.text.secondary} />
          <Text style={styles.actionText}>Account Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <User size={20} color={Colors.text.secondary} />
          <Text style={styles.actionText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Trophy size={20} color={Colors.text.secondary} />
          <Text style={styles.actionText}>Privacy Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <PixelButton
          title="SIGN OUT"
          onPress={handleLogout}
          variant="danger"
          size="large"
          style={styles.logoutButton}
        />
      </View>

      {/* Account Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>ACCOUNT INFORMATION</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>User ID:</Text>
          <Text style={styles.infoValue}>{user.id}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Account Type:</Text>
          <Text style={styles.infoValue}>Cloud Runner</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={[styles.infoValue, { color: Colors.status.success }]}>Active</Text>
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
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background.overcast,
    borderWidth: 3,
    borderColor: Colors.text.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'PressStart2P',
    fontSize: 20,
    color: Colors.text.primary,
  },
  displayName: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  username: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  email: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.muted,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: Colors.card.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: Colors.card.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background.overcast,
    borderWidth: 2,
    borderColor: Colors.card.border,
    marginBottom: 12,
  },
  actionText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    marginLeft: 12,
  },
  logoutContainer: {
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: Colors.card.border,
  },
  logoutButton: {
    width: '100%',
  },
  infoContainer: {
    padding: 20,
  },
  infoTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.accent,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.storm,
  },
  infoLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
  },
  infoValue: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
});