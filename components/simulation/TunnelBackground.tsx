import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import useGameStore from '../../stores/gameStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TunnelBackground() {
  const progress = useGameStore(state => state.progress);
  const gameState = useGameStore(state => state.gameState);
  
  // Create dust particles
  const dustParticles = Array.from({ length: 50 }, (_, i) => {
    const animX = useRef(new Animated.Value(Math.random())).current;
    const animY = useRef(new Animated.Value(Math.random())).current;
    const animOpacity = useRef(new Animated.Value(Math.random() * 0.5 + 0.2)).current;
    
    useEffect(() => {
      const animateParticle = () => {
        Animated.parallel([
          Animated.loop(
            Animated.sequence([
              Animated.timing(animY, {
                toValue: 1,
                duration: 3000 + Math.random() * 2000,
                useNativeDriver: true,
              }),
              Animated.timing(animY, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }),
            ])
          ),
          Animated.loop(
            Animated.timing(animX, {
              toValue: Math.random(),
              duration: 5000 + Math.random() * 3000,
              useNativeDriver: true,
            })
          ),
        ]).start();
      };
      
      animateParticle();
    }, []);
    
    return {
      id: i,
      animX,
      animY,
      animOpacity,
      size: Math.random() * 2 + 1,
    };
  });
  
  // Emergency lights animation
  const lightAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(lightAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(lightAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  return (
    <View style={styles.container}>
      {/* Base gradient background */}
      <View style={styles.baseGradient} />
      
      {/* Rock wall texture */}
      <View style={styles.rockTexture} />
      
      {/* Rock cracks and fissures */}
      <View style={styles.rockCracks} />
      
      {/* Coal seam layers */}
      <View style={styles.coalSeams} />
      
      {/* Side walls */}
      <View style={styles.leftWall} />
      <View style={styles.rightWall} />
      
      {/* Emergency lights */}
      <Animated.View
        style={[
          styles.emergencyLights,
          {
            opacity: lightAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.15, 0.25],
            }),
          },
        ]}
      >
        <View style={[styles.emergencyLight, { left: '25%' }]} />
        <View style={[styles.emergencyLight, { left: '50%' }]} />
        <View style={[styles.emergencyLight, { left: '75%' }]} />
      </Animated.View>
      
      {/* Dust particles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {dustParticles.map((particle) => (
          <Animated.View
            key={particle.id}
            style={[
              styles.dustParticle,
              {
                width: particle.size,
                height: particle.size,
                opacity: particle.animOpacity,
                transform: [
                  {
                    translateX: particle.animX.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, SCREEN_WIDTH],
                    }),
                  },
                  {
                    translateY: particle.animY.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, SCREEN_HEIGHT],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
      
      {/* Mine floor with rails */}
      <View style={styles.floorContainer}>
        <View style={styles.floorGradient} />
        {/* Rail tracks */}
        <View style={[styles.rail, { bottom: 32 }]} />
        <View style={[styles.rail, { bottom: 8 }]} />
        {/* Wooden sleepers */}
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.sleeper,
              {
                bottom: 8 + i * 30,
                opacity: 0.3 - i * 0.03,
              },
            ]}
          />
        ))}
      </View>
      
      {/* Ceiling darkness */}
      <View style={styles.ceilingDarkness} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  baseGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1510',
  },
  rockTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
    backgroundColor: 'transparent',
  },
  rockCracks: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.25,
    backgroundColor: 'transparent',
  },
  coalSeams: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
    backgroundColor: 'transparent',
  },
  leftWall: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 64,
    backgroundColor: 'rgba(80, 60, 40, 0.3)',
    opacity: 0.3,
  },
  rightWall: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 64,
    backgroundColor: 'rgba(80, 60, 40, 0.3)',
    opacity: 0.3,
  },
  emergencyLights: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  emergencyLight: {
    position: 'absolute',
    top: 40,
    width: 8,
    height: '100%',
    backgroundColor: 'rgba(255, 200, 100, 0.3)',
    shadowColor: 'rgba(255, 200, 100, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
  },
  dustParticle: {
    position: 'absolute',
    backgroundColor: 'rgba(200, 180, 150, 1)',
    borderRadius: 50,
  },
  floorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  floorGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    opacity: 0.9,
  },
  rail: {
    position: 'absolute',
    left: '33%',
    right: '33%',
    height: 4,
    backgroundColor: 'rgba(150, 150, 150, 0.4)',
  },
  sleeper: {
    position: 'absolute',
    left: '30%',
    right: '30%',
    height: 8,
    backgroundColor: 'rgba(139, 92, 46, 0.4)',
  },
  ceilingDarkness: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 128,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
});
