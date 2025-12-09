import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

interface MinerCharacterProps {
  isRunning: boolean;
  position?: number; // 0-100 percentage across screen
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function MinerCharacter({ isRunning, position = 0 }: MinerCharacterProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const armAnim = useRef(new Animated.Value(0)).current;
  const positionAnim = useRef(new Animated.Value(position)).current;
  
  // Animate position changes smoothly
  useEffect(() => {
    Animated.spring(positionAnim, {
      toValue: position,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [position]);
  
  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(armAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(armAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      bounceAnim.setValue(0);
      armAnim.setValue(0);
    }
  }, [isRunning]);
  
  const armRotate = armAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '30deg'],
  });
  
  // Fixed at center - no horizontal movement
  
  return (
    <Animated.View style={styles.container}>
      <Animated.View
        style={[
          styles.character,
          { transform: [{ translateY: bounceAnim }] }
        ]}
      >
        <Text style={styles.helmet}>⛑️</Text>
        <View style={styles.body}>
          <Text style={styles.vest}>🦺</Text>
          <View style={styles.limbs}>
            <Animated.Text
              style={[
                styles.arm,
                { transform: [{ rotate: armRotate }] }
              ]}
            >
              💪
            </Animated.Text>
          </View>
        </View>
        <Text style={styles.boots}>🥾</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: '50%', // Center horizontally
    marginLeft: -50, // Offset for centering (approximate character width/2)
    alignItems: 'center',
  },
  character: {
    alignItems: 'center',
  },
  helmet: {
    fontSize: 32,
    marginBottom: -8,
  },
  body: {
    alignItems: 'center',
    position: 'relative',
  },
  vest: {
    fontSize: 36,
  },
  limbs: {
    position: 'absolute',
    right: -20,
    top: 10,
  },
  arm: {
    fontSize: 20,
  },
  boots: {
    fontSize: 24,
    marginTop: -8,
  },
  dustContainer: {
    position: 'absolute',
    bottom: 0,
    left: -20,
  }
});
