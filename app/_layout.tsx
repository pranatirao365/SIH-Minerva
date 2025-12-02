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
        <Stack.Screen name="miner" />
        <Stack.Screen name="supervisor" />
        <Stack.Screen name="safety-officer" />
        <Stack.Screen name="engineer" />
        <Stack.Screen name="admin" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
