import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, BarChart3, Bell, Shield, Users } from '../../components/Icons';
import { COLORS } from '../../constants/styles';

export default function SupervisorHome() {
  const router = useRouter();

  const features = [
    {
      icon: <AlertTriangle size={32} color="#F59E0B" />,
      title: 'Alert Miners',
      description: 'Send emergency alerts to miners\' helmets',
      route: '/supervisor/AlertMiners',
      color: '#FEF3C7',
      borderColor: '#F59E0B',
    },
    {
      icon: <Bell size={32} color="#EF4444" />,
      title: 'SOS Notifications',
      description: 'View and respond to miner emergencies',
      route: '/supervisor/SOSNotifications',
      color: '#FEE2E2',
      borderColor: '#EF4444',
    },
    {
      icon: <Users size={32} color="#3B82F6" />,
      title: 'Team Monitoring',
      description: 'Real-time team status and location',
      route: '/supervisor/TeamMonitoring',
      color: '#DBEAFE',
      borderColor: '#3B82F6',
    },
    {
      icon: <BarChart3 size={32} color="#10B981" />,
      title: 'Performance Reports',
      description: 'Team productivity and safety metrics',
      route: '/supervisor/Reports',
      color: '#D1FAE5',
      borderColor: '#10B981',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Shield size={28} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Supervisor Dashboard</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>Monitor team performance and manage tasks</Text>

        <View style={styles.grid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.card,
                { backgroundColor: feature.color, borderColor: feature.borderColor },
              ]}
              onPress={() => router.push(feature.route as any)}
            >
              <View style={styles.cardIcon}>{feature.icon}</View>
              <Text style={styles.cardTitle}>{feature.title}</Text>
              <Text style={styles.cardDescription}>{feature.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  grid: {
    gap: 16,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

