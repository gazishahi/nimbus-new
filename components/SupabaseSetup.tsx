import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Database, ExternalLink, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import PixelButton from './PixelButton';
import DatabaseSetup from './DatabaseSetup';

interface SupabaseSetupProps {
  onComplete?: () => void;
}

export default function SupabaseSetup({ onComplete }: SupabaseSetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showDatabaseSetup, setShowDatabaseSetup] = useState(false);
  const totalSteps = 4;

  const steps = [
    {
      title: 'Create Supabase Project',
      description: 'Sign up for Supabase and create a new project',
      action: 'Go to Supabase',
      url: 'https://supabase.com/dashboard',
    },
    {
      title: 'Get Project Credentials',
      description: 'Copy your project URL and anon key from Settings > API',
      action: 'Open Settings',
      url: 'https://supabase.com/dashboard/project/_/settings/api',
    },
    {
      title: 'Update Environment Variables',
      description: 'Add your Supabase credentials to the .env file',
      action: 'View Instructions',
      url: null,
    },
    {
      title: 'Set Up Database Tables',
      description: 'Create the required tables for user profiles and stats',
      action: 'Setup Database',
      url: null,
    },
  ];

  const handleStepAction = (step: number, url?: string) => {
    if (url) {
      Linking.openURL(url);
    }
    
    if (step === 4) {
      // Show database setup component
      setShowDatabaseSetup(true);
    } else if (step < totalSteps) {
      setCurrentStep(step + 1);
    } else {
      onComplete?.();
    }
  };

  const handleDatabaseSetupComplete = () => {
    setShowDatabaseSetup(false);
    setCurrentStep(totalSteps + 1);
    onComplete?.();
  };

  if (showDatabaseSetup) {
    return <DatabaseSetup onComplete={handleDatabaseSetupComplete} />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary.skyBlue, Colors.primary.deepNimbus]}
        style={styles.header}
      >
        <Database size={32} color={Colors.text.primary} />
        <Text style={styles.headerTitle}>SUPABASE SETUP</Text>
        <Text style={styles.headerSubtitle}>
          Connect your app to Supabase for real authentication
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Step {currentStep} of {totalSteps}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(currentStep / totalSteps) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <View 
              key={stepNumber}
              style={[
                styles.stepContainer,
                isActive && styles.stepActive,
                isCompleted && styles.stepCompleted
              ]}
            >
              <View style={styles.stepHeader}>
                <View style={[
                  styles.stepNumber,
                  isActive && styles.stepNumberActive,
                  isCompleted && styles.stepNumberCompleted
                ]}>
                  {isCompleted ? (
                    <CheckCircle size={16} color={Colors.status.success} />
                  ) : (
                    <Text style={styles.stepNumberText}>{stepNumber}</Text>
                  )}
                </View>
                <Text style={[
                  styles.stepTitle,
                  isActive && styles.stepTitleActive
                ]}>
                  {step.title}
                </Text>
              </View>
              
              <Text style={styles.stepDescription}>
                {step.description}
              </Text>

              {isActive && (
                <View style={styles.stepActions}>
                  {stepNumber === 3 && (
                    <View style={styles.envInstructions}>
                      <Text style={styles.envTitle}>Update your .env file:</Text>
                      <View style={styles.envCode}>
                        <Text style={styles.envCodeText}>
                          EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co{'\n'}
                          EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
                        </Text>
                      </View>
                      <Text style={styles.envNote}>
                        Replace the placeholder values with your actual Supabase project URL and anon key from step 2.
                      </Text>
                    </View>
                  )}

                  <PixelButton
                    title={step.action}
                    onPress={() => handleStepAction(stepNumber, step.url)}
                    variant="primary"
                    size="medium"
                    style={styles.stepButton}
                  />
                </View>
              )}
            </View>
          );
        })}

        {currentStep > totalSteps && (
          <View style={styles.completedContainer}>
            <CheckCircle size={48} color={Colors.status.success} />
            <Text style={styles.completedTitle}>Setup Complete!</Text>
            <Text style={styles.completedText}>
              Your Nimbus app is now connected to Supabase. You can create accounts and sign in with real users.
            </Text>
          </View>
        )}

        <View style={styles.helpContainer}>
          <AlertCircle size={16} color={Colors.status.warning} />
          <Text style={styles.helpText}>
            Need help? Check the Supabase documentation or contact support.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://supabase.com/docs')}
            style={styles.helpLink}
          >
            <ExternalLink size={16} color={Colors.primary.skyBlue} />
            <Text style={styles.helpLinkText}>View Docs</Text>
          </TouchableOpacity>
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
  progressContainer: {
    marginBottom: 24,
  },
  progressText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.accent,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: Colors.progress.background,
    borderWidth: 2,
    borderColor: Colors.background.storm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.progress.success,
  },
  stepContainer: {
    backgroundColor: Colors.background.overcast,
    borderWidth: 2,
    borderColor: Colors.card.border,
    padding: 16,
    marginBottom: 12,
  },
  stepActive: {
    borderColor: Colors.primary.skyBlue,
    backgroundColor: Colors.background.twilight,
  },
  stepCompleted: {
    borderColor: Colors.status.success,
    opacity: 0.7,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background.storm,
    borderWidth: 2,
    borderColor: Colors.card.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberActive: {
    borderColor: Colors.primary.skyBlue,
    backgroundColor: Colors.primary.skyBlue,
  },
  stepNumberCompleted: {
    borderColor: Colors.status.success,
    backgroundColor: Colors.status.success,
  },
  stepNumberText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.primary,
  },
  stepTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.primary,
    flex: 1,
  },
  stepTitleActive: {
    color: Colors.primary.skyBlue,
  },
  stepDescription: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  stepActions: {
    gap: 12,
  },
  stepButton: {
    alignSelf: 'flex-start',
  },
  envInstructions: {
    backgroundColor: Colors.background.nightSky,
    borderWidth: 2,
    borderColor: Colors.card.border,
    padding: 12,
  },
  envTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.accent,
    marginBottom: 8,
  },
  envCode: {
    backgroundColor: Colors.background.storm,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.card.border,
    marginBottom: 8,
  },
  envCodeText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.primary,
    lineHeight: 12,
  },
  envNote: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
    lineHeight: 12,
  },
  completedContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.status.success + '20',
    borderWidth: 2,
    borderColor: Colors.status.success,
  },
  completedTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: Colors.status.success,
    marginTop: 12,
    marginBottom: 8,
  },
  completedText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.twilight,
    borderWidth: 2,
    borderColor: Colors.status.warning,
    padding: 12,
    marginTop: 20,
  },
  helpText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
    flex: 1,
    marginLeft: 8,
    lineHeight: 12,
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  helpLinkText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.primary.skyBlue,
    marginLeft: 4,
  },
});