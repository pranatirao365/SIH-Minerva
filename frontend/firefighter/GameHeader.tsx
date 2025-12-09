import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GAME_CONFIG } from './types';

interface GameHeaderProps {
  lives: number;
  score: number;
  timeRemaining: number;
}

export default function GameHeader({ lives, score, timeRemaining }: GameHeaderProps) {
  const maxLives = GAME_CONFIG.INITIAL_LIVES;
  const hearts = Array(maxLives).fill(0).map((_, i) => i < lives ? '❤️' : '🖤');
  
  // Dynamic time color based on thresholds
  const getTimeColor = () => {
    if (timeRemaining < GAME_CONFIG.MIN_TIME_WARNING) return '#EF4444'; // Red - critical
    if (timeRemaining < GAME_CONFIG.MEDIUM_TIME_WARNING) return '#F59E0B'; // Yellow - warning
    return '#10B981'; // Green - safe
  };
  
  const timeColor = getTimeColor();
  const isTimeCritical = timeRemaining < GAME_CONFIG.MIN_TIME_WARNING;
  
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>LIVES</Text>
        <Text style={styles.value}>{hearts.join(' ')}</Text>
      </View>
      
      <View style={[styles.section, styles.centerSection]}>
        <Text style={styles.label}>TIME</Text>
        <Text style={[
          styles.value, 
          styles.timeValue, 
          { color: timeColor },
          isTimeCritical && styles.timeValueCritical
        ]}>
          ⏳ {timeRemaining}s
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>SCORE</Text>
        <Text style={styles.value}>⭐ {score}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B00',
  },
  section: {
    alignItems: 'center',
    flex: 1,
  },
  centerSection: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeValue: {
    fontSize: 20,
  },
  timeValueCritical: {
    fontWeight: '900',
    textShadowColor: '#EF4444',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
