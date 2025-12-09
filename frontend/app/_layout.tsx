import { SupervisorProvider } from '@/contexts/SupervisorContext';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import 'react-native-reanimated';
import '../polyfills';
// Suppress all Alert popups globally - log to console instead
import '../utils/suppressAlerts';

export default function RootLayout() {
  useEffect(() => {
    // Only set up notifications if not in Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';
    
    if (!isExpoGo) {
      // Dynamically import notifications only for production builds
      import('expo-notifications').then((Notifications) => {
        const subscription = Notifications.addNotificationReceivedListener(notification => {
          console.log('Notification received:', notification);
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('Notification response:', response);
        });

        return () => {
          subscription.remove();
          responseSubscription.remove();
        };
      }).catch(err => {
        console.log('Notifications not available in Expo Go');
      });
    }
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
