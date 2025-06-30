import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

interface PixelButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function PixelButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
}: PixelButtonProps) {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}>
      <Text style={buttonTextStyle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 3,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    elevation: 3,
  },
  
  // Variants
  primary: {
    backgroundColor: Colors.button.primary.background,
    borderColor: Colors.button.primary.border,
    shadowColor: Colors.button.primary.shadow,
  },
  secondary: {
    backgroundColor: Colors.button.secondary.background,
    borderColor: Colors.button.secondary.border,
    shadowColor: Colors.button.secondary.shadow,
  },
  danger: {
    backgroundColor: Colors.button.danger.background,
    borderColor: Colors.button.danger.border,
    shadowColor: Colors.button.danger.shadow,
  },
  success: {
    backgroundColor: Colors.button.success.background,
    borderColor: Colors.button.success.border,
    shadowColor: Colors.button.success.shadow,
  },
  disabled: {
    backgroundColor: Colors.background.storm,
    borderColor: Colors.background.overcast,
    shadowColor: Colors.background.twilight,
  },
  
  // Sizes
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 56,
  },
  
  // Text styles
  text: {
    fontFamily: 'PressStart2P',
    textAlign: 'center',
  },
  primaryText: {
    color: Colors.button.primary.text,
  },
  secondaryText: {
    color: Colors.button.secondary.text,
  },
  dangerText: {
    color: Colors.button.danger.text,
  },
  successText: {
    color: Colors.button.success.text,
  },
  disabledText: {
    color: Colors.text.muted,
  },
  
  // Text sizes
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
});