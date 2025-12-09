import { useRootNavigationState, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Text, Image, Animated } from 'react-native';
import { COLORS } from '../constants/styles';
import { useRoleStore } from '../hooks/useRoleStore';
import { testFirebaseSetup } from '../services/testFirebaseSetup';

export default function Index() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { isAuthenticated, user, languagePreferenceSet } = useRoleStore();
  const [showLanding, setShowLanding] = useState(true);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Show landing screen animation
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

    // Hide landing screen after 5 seconds
    const landingTimeout = setTimeout(() => {
      setShowLanding(false);
    }, 5000);

    return () => clearTimeout(landingTimeout);
  }, []);

  useEffect(() => {
    // Don't navigate while landing screen is showing
    if (showLanding) return;

    // Wait for navigation to be ready
    if (!rootNavigationState?.key) return;

    // Small delay to ensure layout is mounted
    const timeout = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace('/auth/PhoneLogin');
      } else {
        // Navigate to appropriate home based on role
        const routes: Record<string, string> = {
          'miner': '/miner/MinerHome',
          'supervisor': '/supervisor/SupervisorHome',
          'safety-officer': '/safety-officer/SafetyOfficerHome',
          'engineer': '/engineer/EngineerHome',
          'admin': '/admin/AdminHome',
        };
        
        // Special handling for miners: check language preference
        if (user.role === 'miner' && !languagePreferenceSet) {
          router.replace('/miner/MinerHome' as any);
          return;
        }
        
        const route = routes[user.role || 'miner'];
        router.replace(route as any);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [rootNavigationState?.key, showLanding]);

  // Show landing screen
  if (showLanding) {
    return (
      <View style={styles.landingContainer}>
        <Animated.View
          style={[
            styles.landingContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Logo - Using MinerVa logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/minerva-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>
      </View>
    );
  }

  // Show loading after landing screen
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landingContainer: {
    flex: 1,
    backgroundColor: '#fcf6ef', // Updated background color
    alignItems: 'center',
    justifyContent: 'center',
  },
  landingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 300,
    height: 300,
  },
});
