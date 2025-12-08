import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import useGameStore from '../../stores/gameStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MinerCharacter() {
  const characterState = useGameStore((state: any) => state.characterState);
  const progress = useGameStore((state: any) => state.progress);
  const totalDistance = useGameStore((state: any) => state.totalDistance);
  
  const walkAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const torchAnim = useRef(new Animated.Value(0)).current;
  
  // Walking animation
  useEffect(() => {
    if (characterState === 'walking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(walkAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(walkAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      walkAnim.setValue(0);
    }
  }, [characterState]);
  
  // Danger pulsing animation
  useEffect(() => {
    if (characterState === 'danger') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [characterState]);
  
  // Torch light animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(torchAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(torchAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  // Calculate horizontal position - start from leftmost edge to rightmost
  // At progress 0m, miner is at far left (accounting for 280px container width)
  // At progress 250m, miner is at far right
  const horizontalPosition = (progress / totalDistance) * 90;
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: `${horizontalPosition}%`,
          marginLeft: -100, // Offset to position character at true start
          transform: [
            { scale: scaleAnim },
            {
              translateY: walkAnim.interpolate({
                inputRange: [0, 0.25, 0.5, 0.75, 1],
                outputRange: [0, -6, -12, -6, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Torch light beam */}
      <Animated.View
        style={[
          styles.torchLight,
          {
            opacity: torchAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 0.7],
            }),
          },
        ]}
      >
        {/* Main light cone */}
        <View style={styles.lightCone} />
        
        {/* Bright center beam */}
        <View style={styles.lightBeam} />
        
        {/* Light particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.lightParticle,
              {
                left: `${45 + Math.random() * 10}%`,
                top: `${15 + i * 7}%`,
              },
            ]}
          />
        ))}
      </Animated.View>
      
      {/* Miner character image */}
      <Animated.Image
        source={require('../../assets/images/miner.png')}
        style={[
          styles.minerImage,
          {
            transform: [
              {
                rotate: walkAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: ['-1deg', '1deg', '-1deg'],
                }),
              },
            ],
          },
        ]}
        resizeMode="contain"
      />
      
      {/* Danger indicator */}
      {(characterState === 'alert' || characterState === 'danger') && (
        <View style={styles.dangerIndicator}>
          <Text style={styles.dangerEmoji}>⚠</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: '18%',
    width: 280,
    height: 300,
    zIndex: 20,
  },
  torchLight: {
    position: 'absolute',
    top: -80,
    left: '50%',
    width: 400,
    height: 400,
    marginLeft: -200,
    pointerEvents: 'none',
  },
  lightCone: {
    position: 'absolute',
    top: '20%',
    left: '45%',
    width: '10%',
    height: '80%',
    backgroundColor: 'rgba(255, 230, 120, 0.4)',
    transform: [
      { translateX: -20 },
      { skewY: '10deg' },
    ],
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  lightBeam: {
    position: 'absolute',
    top: '20%',
    left: '47%',
    width: '6%',
    height: '60%',
    backgroundColor: 'rgba(255, 255, 200, 0.6)',
    transform: [
      { translateX: -12 },
    ],
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  lightParticle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 200, 0.8)',
    shadowColor: 'rgba(255, 255, 200, 0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  minerImage: {
    width: '100%',
    height: '100%',
  },
  dangerIndicator: {
    position: 'absolute',
    top: -20,
    right: 20,
  },
  dangerEmoji: {
    fontSize: 24,
  },
});
