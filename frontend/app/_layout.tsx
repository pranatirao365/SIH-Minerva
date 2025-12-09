import { SupervisorProvider } from '@/contexts/SupervisorContext';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';
import '../polyfills';
// Suppress all Alert popups globally - log to console instead
import '../utils/suppressAlerts';

export default function RootLayout() {
  useEffect(() => {
    // Set up notification handler
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification tap - could navigate to relevant screen
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return (
    <SupervisorProvider>
      <ThemeProvider value={DarkTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/PhoneLogin" />
          <Stack.Screen name="auth/OTPVerification" />
          <Stack.Screen name="auth/RoleSelection" />
          <Stack.Screen name="miner" />
          <Stack.Screen name="supervisor" />
          <Stack.Screen name="safety-officer" />
          <Stack.Screen name="engineer" />
          <Stack.Screen name="admin" />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </SupervisorProvider>
  );
}
