import { Stack } from 'expo-router';

export default function SupervisorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0E27' },
      }}
    >
      <Stack.Screen name="SupervisorHome" />
      <Stack.Screen name="SOSNotifications" />
      <Stack.Screen name="AlertMiners" />
      <Stack.Screen name="PPEComplianceMonitor" />
      <Stack.Screen name="TeamTaskStatus" />
      <Stack.Screen name="HealthMonitoring" />
      <Stack.Screen name="HazardZoneHeatMap" />
      <Stack.Screen name="PerformanceTracking" />
      <Stack.Screen name="VideoLibrary" />
      <Stack.Screen name="VideoProgressDashboard" />
      <Stack.Screen name="TeamPerformance" />
      <Stack.Screen name="WorkerManagement" />
      <Stack.Screen name="IncidentDashboard" />
      <Stack.Screen name="TaskAssignment" />
      <Stack.Screen name="AuditTracker" />
      <Stack.Screen name="ShiftPlanning" />
      <Stack.Screen name="VideoGenerationModule" />
    </Stack>
  );
}
