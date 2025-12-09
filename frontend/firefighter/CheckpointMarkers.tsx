import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CHECKPOINT_POSITIONS, GAME_CONFIG } from './types';

interface CheckpointMarkersProps {
  currentCheckpointIndex: number;
  totalCheckpoints: number;
}

export default function CheckpointMarkers({ 
  currentCheckpointIndex, 
  totalCheckpoints 
}: CheckpointMarkersProps) {
  
  const getCheckpointStatus = (index: number) => {
    if (index < currentCheckpointIndex) {
      return 'completed'; // Already passed
    } else if (index === currentCheckpointIndex) {
      return 'current'; // Current checkpoint
    } else {
      return 'upcoming'; // Not reached yet
    }
  };

  const getCheckpointIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅'; // Green checkmark
      case 'current':
        return '🔥'; // Current fire hazard
      case 'upcoming':
        return '🚧'; // Upcoming checkpoint
      default:
        return '🚧';
    }
  };

  const getCheckpointColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981'; // Green
      case 'current':
        return '#EF4444'; // Red
      case 'upcoming':
        return '#6B7280'; // Gray
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      {/* No separate START marker - game starts at CP1 */}
      
      {/* Checkpoint markers */}
      {CHECKPOINT_POSITIONS.map((position, index) => {
        const status = getCheckpointStatus(index);
        const icon = getCheckpointIcon(status);
        const color = getCheckpointColor(status);
        
        // Show START label only for first checkpoint when at beginning
        const isStartingCheckpoint = index === 0 && currentCheckpointIndex === 0;

        return (
          <View
            key={`checkpoint-${index}`}
            style={[
              styles.marker,
              { left: `${position}%` },
              status === 'current' && styles.currentMarker
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
              <Text style={styles.icon}>{icon}</Text>
            </View>
            <Text style={[styles.label, { color }]}>
              {isStartingCheckpoint ? '🏁 START' : `CP${index + 1}`}
            </Text>
          </View>
        );
      })}

      {/* Safe zone marker */}
      <View style={[styles.marker, { left: '95%' }]}>
        <Text style={styles.safeZoneIcon}>🏠</Text>
        <Text style={styles.safeZoneLabel}>SAFE</Text>
      </View>

      {/* Progress line */}
      <View style={styles.progressLine}>
        {currentCheckpointIndex > 0 && (
          <View
            style={[
              styles.progressFill,
              {
                width: `${CHECKPOINT_POSITIONS[currentCheckpointIndex - 1] || 0}%`,
              }
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    height: 60,
    paddingHorizontal: 10,
  },
  progressLine: {
    position: 'absolute',
    top: 25,
    left: 0, // Start from left edge
    right: '5%', // End near safe zone
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -20 }], // Center the marker
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 4,
  },
  currentMarker: {
    transform: [{ translateX: -20 }, { scale: 1.2 }],
  },
  icon: {
    fontSize: 18,
  },
  startIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  safeZoneIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  safeZoneLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#10B981',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
