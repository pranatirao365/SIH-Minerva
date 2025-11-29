import React from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import useGameStore from '../../stores/gameStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GameIntro() {
  const startGame = useGameStore((state: any) => state.startGame);
  
  // Animated particles
  const particles = Array.from({ length: 20 }, (_, i) => {
    const anim = new Animated.Value(0);
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 4000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    return { anim, id: i };
  });
  
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/mine-location1.jpeg')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Dark Overlay */}
        <View style={styles.overlay} />
        
        {/* Animated Particles */}
        <View style={StyleSheet.absoluteFill}>
          {particles.map((particle) => (
            <Animated.View
              key={particle.id}
              style={[
                styles.particle,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: particle.anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.3, 0],
                  }),
                  transform: [
                    {
                      scale: particle.anim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1, 0],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
        
        {/* Content */}
        <ScrollView 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Logo/Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.emoji}>⛏️</Text>
              <Text style={styles.title}>Coal Mine</Text>
              <Text style={styles.subtitle}>Safety Simulation</Text>
            </View>
            
            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>
                Navigate through a realistic underground coal mine environment while learning
                crucial safety protocols.
              </Text>
              
              <View style={styles.featuresContainer}>
                <View style={styles.featureChip}>
                  <Text style={styles.featureEmoji}>💨</Text>
                  <Text style={styles.featureText}>Smoke Hazards</Text>
                </View>
                <View style={styles.featureChip}>
                  <Text style={styles.featureEmoji}>🔥</Text>
                  <Text style={styles.featureText}>Fire Events</Text>
                </View>
                <View style={styles.featureChip}>
                  <Text style={styles.featureEmoji}>🚧</Text>
                  <Text style={styles.featureText}>Blockages</Text>
                </View>
                <View style={styles.featureChip}>
                  <Text style={styles.featureEmoji}>☠️</Text>
                  <Text style={styles.featureText}>Gas Leaks</Text>
                </View>
              </View>
            </View>
            
            {/* Instructions */}
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>How to Play:</Text>
              
              <View style={styles.instructionRow}>
                <Text style={styles.instructionNumber}>1️⃣</Text>
                <Text style={styles.instructionText}>
                  Click "Move Forward" to walk through the tunnel
                </Text>
              </View>
              
              <View style={styles.instructionRow}>
                <Text style={styles.instructionNumber}>2️⃣</Text>
                <Text style={styles.instructionText}>
                  Hazards will appear as you progress forward
                </Text>
              </View>
              
              <View style={styles.instructionRow}>
                <Text style={styles.instructionNumber}>3️⃣</Text>
                <Text style={styles.instructionText}>
                  Read safety instructions carefully
                </Text>
              </View>
              
              <View style={styles.instructionRow}>
                <Text style={styles.instructionNumber}>4️⃣</Text>
                <Text style={styles.instructionText}>
                  Complete the 250-meter tunnel safely
                </Text>
              </View>
            </View>
            
            {/* Start Button */}
            <TouchableOpacity
              onPress={startGame}
              style={styles.startButton}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonIcon}>🚀</Text>
              <Text style={styles.startButtonText}>Start Simulation</Text>
              <Text style={styles.startButtonArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 200, 100, 0.6)',
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  descriptionContainer: {
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 500,
    marginBottom: 24,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsCard: {
    backgroundColor: 'rgba(40, 40, 40, 0.9)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    marginBottom: 32,
    width: '100%',
    maxWidth: 500,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 8,
  },
  instructionNumber: {
    fontSize: 20,
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    gap: 12,
  },
  startButtonIcon: {
    fontSize: 24,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  startButtonArrow: {
    fontSize: 24,
    color: '#FFFFFF',
  },
});
