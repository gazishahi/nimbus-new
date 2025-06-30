import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Footprints } from 'lucide-react-native';
import { WorkoutType } from '@/types/workout';
import { Colors } from '@/constants/Colors';

interface WorkoutTypeSelectorProps {
  onSelectType: (type: WorkoutType['id']) => void;
  disabled?: boolean;
}

const workoutTypes: WorkoutType[] = [
  {
    id: 'outdoor_run',
    name: 'Outdoor Run',
    description: 'GPS tracking with route mapping',
    icon: 'map-pin',
    color: Colors.primary.skyBlue,
  },
  {
    id: 'outdoor_walk',
    name: 'Outdoor Walk',
    description: 'Leisurely walk with GPS tracking',
    icon: 'footprints',
    color: Colors.accent.rainGreen,
  },
];

export default function WorkoutTypeSelector({ onSelectType, disabled = false }: WorkoutTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<WorkoutType['id']>('outdoor_run');

  const getIcon = (iconName: string, color: string) => {
    const iconProps = { size: 32, color: Colors.text.primary };
    
    switch (iconName) {
      case 'map-pin':
        return <MapPin {...iconProps} />;
      case 'footprints':
        return <Footprints {...iconProps} />;
      default:
        return <MapPin {...iconProps} />;
    }
  };

  const handleSelectType = (type: WorkoutType['id']) => {
    setSelectedType(type);
    onSelectType(type);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SELECT WORKOUT TYPE</Text>
      <Text style={styles.subtitle}>Choose your training mode</Text>
      
      <View style={styles.typesGrid}>
        {workoutTypes.map((type) => {
          const isSelected = selectedType === type.id;
          
          return (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard, 
                disabled && styles.typeCardDisabled,
                isSelected && styles.typeCardSelected
              ]}
              onPress={() => !disabled && handleSelectType(type.id)}
              disabled={disabled}
            >
              <LinearGradient
                colors={[type.color, Colors.background.overcast]}
                style={styles.typeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.typeContent}>
                  <View style={styles.typeIcon}>
                    {getIcon(type.icon, type.color)}
                  </View>
                  <Text style={styles.typeName}>{type.name}</Text>
                  <Text style={styles.typeDescription}>{type.description}</Text>
                  
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedText}>SELECTED</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: Colors.text.accent,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 0,
  },
  typeCard: {
    flex: 1,
    minWidth: 150,
    borderWidth: 3,
    borderColor: Colors.card.border,
    shadowOffset: { width: 3, height: 3 },
    shadowColor: Colors.card.shadow,
    shadowOpacity: 0.5,
    elevation: 5,
  },
  typeCardDisabled: {
    opacity: 0.5,
  },
  typeCardSelected: {
    borderColor: Colors.status.success,
    borderWidth: 4,
  },
  typeGradient: {
    padding: 20,
    alignItems: 'center',
  },
  typeContent: {
    alignItems: 'center',
  },
  typeIcon: {
    marginBottom: 12,
  },
  typeName: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  typeDescription: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 12,
  },
  selectedIndicator: {
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.status.success,
    borderWidth: 1,
    borderColor: Colors.button.success.border,
  },
  selectedText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: Colors.text.primary,
  },
  infoPanel: {
    backgroundColor: Colors.card.background,
    borderWidth: 3,
    borderColor: Colors.card.border,
    padding: 16,
  },
  infoTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: Colors.text.accent,
    textAlign: 'center',
    marginBottom: 16,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
});