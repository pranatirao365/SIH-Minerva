import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/LanguageSelect" />
        <Stack.Screen name="auth/PhoneLogin" />
        <Stack.Screen name="auth/OTPVerification" />
        <Stack.Screen name="auth/RoleSelection" />
        <Stack.Screen name="miner/MinerHome" />
        <Stack.Screen name="supervisor/SupervisorHome" />
        <Stack.Screen name="safety-officer/SafetyOfficerHome" />
        <Stack.Screen name="engineer/EngineerHome" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
