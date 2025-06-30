import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, Eye, EyeOff, Database } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { LoginCredentials, RegisterCredentials } from '@/types/auth';
import PixelButton from './PixelButton';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (credentials: LoginCredentials | RegisterCredentials) => Promise<boolean>;
  onModeChange: (mode: 'login' | 'register') => void;
  isLoading: boolean;
  error: string | null;
}

export default function AuthForm({ mode, onSubmit, onModeChange, isLoading, error }: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Username validation for register mode
    if (mode === 'register') {
      if (!formData.username) {
        errors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        errors.username = 'Username can only contain letters, numbers, and underscores';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const credentials = mode === 'login' 
      ? { email: formData.email, password: formData.password }
      : { 
          email: formData.email, 
          password: formData.password, 
          username: formData.username,
          displayName: formData.displayName || formData.username
        };

    await onSubmit(credentials);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary.skyBlue, Colors.primary.deepNimbus]}
        style={styles.header}
      >
        <Database size={24} color={Colors.text.primary} />
        <Text style={styles.headerTitle}>
          {mode === 'login' ? 'WELCOME BACK' : 'JOIN NIMBUS'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {mode === 'login' 
            ? 'Sign in with your Supabase account' 
            : 'Create your Supabase account to start running'
          }
        </Text>
      </LinearGradient>

      <View style={styles.form}>
        {/* Email Field */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Mail size={20} color={Colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, validationErrors.email && styles.inputError]}
              placeholder="Email"
              placeholderTextColor={Colors.text.muted}
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {validationErrors.email && (
            <Text style={styles.errorText}>{validationErrors.email}</Text>
          )}
        </View>

        {/* Username Field (Register only) */}
        {mode === 'register' && (
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <User size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, validationErrors.username && styles.inputError]}
                placeholder="Username"
                placeholderTextColor={Colors.text.muted}
                value={formData.username}
                onChangeText={(value) => updateField('username', value)}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {validationErrors.username && (
              <Text style={styles.errorText}>{validationErrors.username}</Text>
            )}
          </View>
        )}

        {/* Display Name Field (Register only) */}
        {mode === 'register' && (
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <User size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Display Name (Optional)"
                placeholderTextColor={Colors.text.muted}
                value={formData.displayName}
                onChangeText={(value) => updateField('displayName', value)}
                autoCorrect={false}
              />
            </View>
          </View>
        )}

        {/* Password Field */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Lock size={20} color={Colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput, validationErrors.password && styles.inputError]}
              placeholder="Password"
              placeholderTextColor={Colors.text.muted}
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color={Colors.text.secondary} />
              ) : (
                <Eye size={20} color={Colors.text.secondary} />
              )}
            </TouchableOpacity>
          </View>
          {validationErrors.password && (
            <Text style={styles.errorText}>{validationErrors.password}</Text>
          )}
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.globalErrorContainer}>
            <Text style={styles.globalErrorText}>{error}</Text>
          </View>
        )}

        {/* Submit Button */}
        <PixelButton
          title={isLoading ? 'PROCESSING...' : (mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT')}
          onPress={handleSubmit}
          variant="primary"
          size="large"
          disabled={isLoading}
          style={styles.submitButton}
        />

        {/* Mode Switch */}
        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
          </Text>
          <TouchableOpacity
            onPress={() => onModeChange(mode === 'login' ? 'register' : 'login')}
            disabled={isLoading}
          >
            <Text style={styles.switchLink}>
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Supabase Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>🚀 Powered by Supabase</Text>
          <Text style={styles.infoText}>
            Your account is securely stored in Supabase, a modern backend-as-a-service platform.
          </Text>
          {mode === 'register' && (
            <Text style={styles.infoText}>
              After registration, you may need to verify your email address depending on your Supabase configuration.
            </Text>
          )}
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
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.overcast,
    borderWidth: 2,
    borderColor: Colors.card.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.primary,
    paddingVertical: 8,
  },
  passwordInput: {
    paddingRight: 40,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  inputError: {
    borderColor: Colors.status.error,
  },
  errorText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.status.error,
    marginTop: 4,
    marginLeft: 4,
  },
  globalErrorContainer: {
    backgroundColor: Colors.status.error + '20',
    borderWidth: 2,
    borderColor: Colors.status.error,
    padding: 12,
    marginBottom: 16,
  },
  globalErrorText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.status.error,
    textAlign: 'center',
    lineHeight: 14,
  },
  submitButton: {
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    marginRight: 8,
  },
  switchLink: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.primary.skyBlue,
    textDecorationLine: 'underline',
  },
  infoContainer: {
    backgroundColor: Colors.background.twilight,
    borderWidth: 2,
    borderColor: Colors.card.border,
    padding: 12,
  },
  infoTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.accent,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
    lineHeight: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
});