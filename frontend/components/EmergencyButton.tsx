import React from 'react';
import { TouchableOpacity, Text, Animated, View, StyleSheet } from 'react-native';
import { AlertTriangle } from './Icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export const EmergencyButton: React.FC = () => {
  const router = useRouter();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const glowAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Pulsing scale animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    // Glowing ring animation
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, []);

  const handlePress = () => {
    router.push('/miner/EmergencySOS');
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  return (
    <View style={styles.container}>
      {/* Outer pulsing glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Main SOS Button */}
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          style={styles.button}
        >
          <LinearGradient
            colors={['#DC2626', '#B91C1C', '#991B1B']}
            style={styles.gradient}
          >
            {/* Inner glow effect */}
            <View style={styles.innerGlow} />
            
            {/* Icon and Text */}
            <AlertTriangle size={24} color="#FFFFFF" style={styles.icon} />
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.emergencyText}>EMERGENCY</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    display: 'none', // Hidden
  },
  glowRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  innerGlow: {
    position: 'absolute',
    top: 6,
    width: 35,
    height: 15,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    opacity: 0.15,
  },
  icon: {
    marginBottom: 1,
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emergencyText: {
    color: '#FFFFFF',
    fontSize: 6,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: -1,
    opacity: 0.9,
  },
});
