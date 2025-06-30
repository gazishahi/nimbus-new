import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import HealthKitServiceClass from '@/services/HealthKitService';

interface SystemStatusProps {
  onClose?: () => void;
}

interface SystemCheck {
  name: string;
  status: 'checking' | 'success' | 'warning' | 'error';
  message: string;
}

export default function SystemStatus({ onClose }: SystemStatusProps) {
  const [checks, setChecks] = useState<SystemCheck[]>([
    { name: 'Platform', status: 'checking', message: 'Detecting platform...' },
    { name: 'HealthKit', status: 'checking', message: 'Checking availability...' },
    { name: 'Permissions', status: 'checking', message: 'Verifying permissions...' },
    { name: 'Service', status: 'checking', message: 'Testing service...' },
  ]);

  useEffect(() => {
    runSystemChecks();
  }, []);

  const runSystemChecks = async () => {
    // Platform check
    updateCheck('Platform', 'success', `Running on ${Platform.OS} (v${Platform.Version})`);

    // HealthKit availability check
    try {
      if (Platform.OS === 'ios') {
        const healthKitService = HealthKitServiceClass.getInstance();
        const isAvailable = healthKitService.isHealthKitInitialized();
        
        if (isAvailable) {
          updateCheck('HealthKit', 'success', 'HealthKit is available');
          
          // Permissions check
          try {
            const isInitialized = healthKitService.isHealthKitInitialized();
            if (isInitialized) {
              updateCheck('Permissions', 'success', 'HealthKit permissions granted');
              
              // Service test
              try {
                const metrics = await healthKitService.getCurrentMetrics();
                if (metrics) {
                  updateCheck('Service', 'success', 'HealthKit service operational');
                } else {
                  updateCheck('Service', 'warning', 'Service available but no data');
                }
              } catch (serviceError) {
                updateCheck('Service', 'warning', 'Service error: ' + String(serviceError));
              }
            } else {
              updateCheck('Permissions', 'warning', 'HealthKit permissions not granted');
              updateCheck('Service', 'warning', 'Skipped due to permissions');
            }
          } catch (permError) {
            updateCheck('Permissions', 'error', 'Permission check failed: ' + String(permError));
            updateCheck('Service', 'warning', 'Skipped due to permission error');
          }
        } else {
          updateCheck('HealthKit', 'warning', 'HealthKit not available');
          updateCheck('Permissions', 'warning', 'Skipped - HealthKit unavailable');
          updateCheck('Service', 'warning', 'Skipped - HealthKit unavailable');
        }
      } else {
        updateCheck('HealthKit', 'warning', 'iOS only feature');
        updateCheck('Permissions', 'warning', 'iOS only feature');
        updateCheck('Service', 'warning', 'iOS only feature');
      }
    } catch (error) {
      updateCheck('HealthKit', 'error', 'Check failed: ' + String(error));
      updateCheck('Permissions', 'error', 'Skipped due to HealthKit error');
      updateCheck('Service', 'error', 'Skipped due to HealthKit error');
    }
  };

  const updateCheck = (name: string, status: SystemCheck['status'], message: string) => {
    setChecks(prev => prev.map(check => 
      check.name === name ? { ...check, status, message } : check
    ));
  };

  const getStatusColor = (status: SystemCheck['status']) => {
    switch (status) {
      case 'checking': return Colors.accent.lightning;
      case 'success': return Colors.status.success;
      case 'warning': return Colors.status.warning;
      case 'error': return Colors.status.error;
      default: return Colors.text.muted;
    }
  };

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'checking': return '🔄';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const allChecksComplete = checks.every(check => check.status !== 'checking');
  const hasErrors = checks.some(check => check.status === 'error');
  const hasWarnings = checks.some(check => check.status === 'warning');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Status</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.checksContainer}>
        {checks.map((check, index) => (
          <View key={index} style={styles.checkItem}>
            <View style={styles.checkHeader}>
              <Text style={styles.checkIcon}>{getStatusIcon(check.status)}</Text>
              <Text style={styles.checkName}>{check.name}</Text>
            </View>
            <Text style={[styles.checkMessage, { color: getStatusColor(check.status) }]}>
              {check.message}
            </Text>
          </View>
        ))}
      </View>

      {allChecksComplete && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Summary</Text>
          {!hasErrors && !hasWarnings && (
            <Text style={[styles.summaryText, { color: Colors.status.success }]}>
              🎉 All systems operational!
            </Text>
          )}
          {hasWarnings && !hasErrors && (
            <Text style={[styles.summaryText, { color: Colors.status.warning }]}>
              ⚠️ Some features may be limited
            </Text>
          )}
          {hasErrors && (
            <Text style={[styles.summaryText, { color: Colors.status.error }]}>
              ❌ Some systems need attention
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.retryButton}
        onPress={runSystemChecks}
      >
        <Text style={styles.retryButtonText}>Run Checks Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.twilight,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 2,
    borderColor: Colors.card.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary.skyBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checksContainer: {
    marginBottom: 16,
  },
  checkItem: {
    backgroundColor: Colors.background.overcast,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  checkName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  checkMessage: {
    fontSize: 14,
    marginLeft: 24,
    lineHeight: 18,
  },
  summary: {
    backgroundColor: Colors.background.storm,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: Colors.primary.skyBlue,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});