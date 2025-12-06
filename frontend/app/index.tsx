import { useRootNavigationState, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/styles';
import { useRoleStore } from '../hooks/useRoleStore';
import { testFirebaseSetup } from '../services/testFirebaseSetup';

export default function Index() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { isAuthenticated, user } = useRoleStore();

  useEffect(() => {
    // Test Firebase connection on app start (development only)
    if (__DEV__) {
      console.log('\n🚀 Starting Firebase connection test...');
      testFirebaseSetup().then(results => {
        console.log('\n✅ Firebase test completed\n');
      }).catch(err => {
        console.error('❌ Firebase test failed:', err);
      });
    }

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
          'admin': '/admin/AdminHome',
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
