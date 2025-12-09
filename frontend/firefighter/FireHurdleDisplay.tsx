import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { FireHurdle } from './types';

interface FireHurdleDisplayProps {
  hurdle: FireHurdle;
  isCleared?: boolean;
  horizontalPosition?: number; // 0-100 percentage
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function FireHurdleDisplay({ 
  hurdle, 
  isCleared,
  horizontalPosition = 50 // Default to center if not provided
}: FireHurdleDisplayProps) {
  const flameAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const positionAnim = useRef(new Animated.Value(horizontalPosition)).current;
  
  // Animate to new horizontal position when it changes
  useEffect(() => {
    Animated.spring(positionAnim, {
      toValue: horizontalPosition,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [horizontalPosition]);
  
  // Reset animations when hurdle changes (new fire appears)
  useEffect(() => {
    // Reset to full visibility and scale for new hurdle
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
    flameAnim.setValue(0);
    console.log('🔥 New fire hurdle displayed:', hurdle.type, hurdle.id);
  }, [hurdle.id]); // Reset when hurdle ID changes
  
  useEffect(() => {
    if (!isCleared) {
      // Flame flicker animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(flameAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(flameAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Clear animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isCleared]);
  
  const flameScale = flameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });
  
  const flameOpacity = flameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });
  
  // Fixed at center - no horizontal movement
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
          ],
        }
      ]}
    >
      <View style={styles.fireContainer}>
        <Animated.Text
          style={[
            styles.flame,
            {
              transform: [{ scale: flameScale }],
              opacity: flameOpacity,
            }
          ]}
        >
          🔥
        </Animated.Text>
        <View style={styles.glow} />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.description}>{hurdle.description}</Text>
        <Text style={styles.instruction}>Choose the correct extinguisher!</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: '50%', // Center horizontally
    top: '35%', // Vertical center of game area
    marginLeft: -60, // Offset for centering (approximate flame width/2)
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  flame: {
    fontSize: 120,
    textAlign: 'center',
  },
  glow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 100,
    height: 100,
    marginLeft: -50,
    marginTop: -50,
    backgroundColor: '#FF6B00',
    borderRadius: 50,
    opacity: 0.3,
    zIndex: -1,
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6B00',
    alignItems: 'center',
  },
  description: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  instruction: {
    fontSize: 14,
    color: '#FFA500',
    fontStyle: 'italic',
  },
});
