import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';

export default function LandingScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Fade in and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after 3 seconds
    const timeout = setTimeout(() => {
      router.replace('/');
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo Image - You'll need to add the minerva-logo.png to assets/images */}
        <Image
          source={require('../assets/images/minerva-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        {/* App Name */}
        <Text style={styles.appName}>MinerVa</Text>
        
        {/* Tagline */}
        <Text style={styles.tagline}>Safety First, Always</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1E8', // Cream/beige background from the image
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#F59E0B', // Orange color matching the logo
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: '#1F2937', // Dark navy matching the pickaxes
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
