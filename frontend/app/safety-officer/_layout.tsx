import { Stack } from 'expo-router';

export default function SafetyOfficerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0E27' },
      }}
    >
      <Stack.Screen name="SafetyOfficerHome" />
      <Stack.Screen name="AlertMiners" />
      <Stack.Screen name="VideoGenerationModule" />
      <Stack.Screen name="VideoLibrary" />
      <Stack.Screen name="HazardZoneHeatMap" />
      <Stack.Screen name="AnalyticsDashboard" />
      <Stack.Screen name="EmergencyProtocols" />
      <Stack.Screen name="ComplianceTracker" />
      <Stack.Screen name="PPEConfigManager" />
      <Stack.Screen name="VideoRequestHandler" />
      <Stack.Screen name="TestimonialReview" />
      <Stack.Screen name="SOSNotifications" />
      <Stack.Screen name="VideoCreator" />
    </Stack>
  );
}
