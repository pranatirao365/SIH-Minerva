import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface GameOverScreenProps {
  isVictory: boolean;
  score: number;
  onRestart: () => void;
  onExit: () => void;
}

export default function GameOverScreen({ isVictory, score, onRestart, onExit }: GameOverScreenProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.emoji}>{isVictory ? '🎉' : '💥'}</Text>
        
        <Text style={styles.title}>
          {isVictory ? 'You Reached the Safe Zone!' : 'Game Over'}
        </Text>
        
        <Text style={styles.message}>
          {isVictory 
            ? 'Great job! You successfully navigated through all fire hazards!' 
            : 'Better luck next time! Practice makes perfect.'}
        </Text>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Final Score</Text>
          <Text style={styles.scoreValue}>⭐ {score} points</Text>
        </View>
        
        {isVictory && (
          <View style={styles.achievementContainer}>
            <Text style={styles.achievementText}>🏆 Fire Safety Expert!</Text>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.restartButton]}
            onPress={onRestart}
          >
            <Text style={styles.buttonText}>🔄 Play Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.exitButton]}
            onPress={onExit}
          >
            <Text style={styles.buttonText}>🏠 Exit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B00',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  scoreContainer: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFA500',
  },
  achievementContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  achievementText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restartButton: {
    backgroundColor: '#FF6B00',
  },
  exitButton: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#666',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
