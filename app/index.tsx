import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useRoleStore } from '../hooks/useRoleStore';
import { COLORS } from '../constants/styles';

export default function Index() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { isAuthenticated, user } = useRoleStore();

  useEffect(() => {
    // Wait for navigation to be ready
    if (!rootNavigationState?.key) return;

    // Small delay to ensure layout is mounted
    const timeout = setTimeout(() => {
      // Check authentication status
      if (!isAuthenticated) {
        router.replace('/auth/LanguageSelect');
      } else {
        // Navigate to appropriate home based on role
        const routes: Record<string, string> = {
          'miner': '/miner/MinerHome',
          'supervisor': '/supervisor/SupervisorHome',
          'safety-officer': '/safety-officer/SafetyOfficerHome',
          'engineer': '/engineer/EngineerHome',
        };
        
        const route = routes[user.role || 'miner'];
        router.replace(route as any);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [rootNavigationState?.key]);

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
});
