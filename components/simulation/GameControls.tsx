import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import useGameStore from '../../stores/gameStore';

export default function GameControls() {
  const gameState = useGameStore(state => state.gameState);
  const isPaused = useGameStore(state => state.isPaused);
  const progress = useGameStore(state => state.progress);
  const totalDistance = useGameStore(state => state.totalDistance);
  const updateProgress = useGameStore(state => state.updateProgress);
  const pauseGame = useGameStore(state => state.pauseGame);
  const resumeGame = useGameStore(state => state.resumeGame);
  const resetGame = useGameStore(state => state.resetGame);
  
  if (gameState === 'intro' || gameState === 'completed' || gameState === 'event') {
    return null;
  }
  
  const handleMoveForward = () => {
    if (!isPaused && progress < totalDistance) {
      // Move forward 5 meters each click
      updateProgress(5);
    }
  };
  
  const canMove = !isPaused && progress < totalDistance;
  
  return (
    <View style={styles.container}>
      <View style={styles.controlsCard}>
        {/* MAIN ACTION: Move Forward Button */}
        <TouchableOpacity
          onPress={handleMoveForward}
          disabled={!canMove}
          style={[
            styles.moveButton,
            !canMove && styles.moveButtonDisabled,
          ]}
          activeOpacity={0.8}
        >
          <Text style={styles.moveButtonEmoji}>🚶</Text>
          <Text style={styles.moveButtonText}>Move Forward</Text>
          <Text style={styles.moveButtonArrow}>→</Text>
        </TouchableOpacity>
        
        <View style={styles.secondaryButtons}>
          {/* Pause/Resume Button */}
          <TouchableOpacity
            onPress={isPaused ? resumeGame : pauseGame}
            style={styles.secondaryButton}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonEmoji}>
              {isPaused ? '▶️' : '⏸️'}
            </Text>
            <Text style={styles.secondaryButtonText}>
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>
          
          {/* Reset Button */}
          <TouchableOpacity
            onPress={resetGame}
            style={[styles.secondaryButton, styles.resetButton]}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonEmoji}>🔄</Text>
            <Text style={styles.secondaryButtonText}>Restart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    zIndex: 30,
    paddingHorizontal: 8,
  },
  controlsCard: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  moveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  moveButtonDisabled: {
    backgroundColor: '#525252',
    opacity: 0.5,
  },
  moveButtonEmoji: {
    fontSize: 24,
  },
  moveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  moveButtonArrow: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  resetButton: {
    backgroundColor: '#EF4444',
  },
  secondaryButtonEmoji: {
    fontSize: 18,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
