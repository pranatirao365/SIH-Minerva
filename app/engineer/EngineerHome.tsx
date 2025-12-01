import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AlertTriangle,
    Bell,
    Cloud,
    RadioWaves,
    Thermometer,
    User,
    Wind,
    Zap
} from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';

export default function EngineerHome() {
  const router = useRouter();
  const { user } = useRoleStore();

  const iotStats = [
    { value: '127', label: 'Sensors' },
    { value: '98%', label: 'Uptime' },
    { value: '2', label: 'Alerts' },
    { value: '5', label: 'Risks' },
  ];

  const activeAlerts = [
    { id: 1, title: 'Vibration spike detected', location: 'Sector D-3', severity: 'high' },
    { id: 2, title: 'Temperature rising', location: 'Sector B-2', severity: 'medium' },
  ];

  const environmentalData = [
    { 
      icon: Thermometer, 
      label: 'Temperature', 
      value: '32°C', 
      max: 'Max: 40°C', 
      color: '#86EFAC',
      status: 'normal'
    },
    { 
      icon: Cloud, 
      label: 'Gas Levels', 
      value: '2.0%', 
      max: 'Max: 5.0%', 
      color: '#86EFAC',
      status: 'normal'
    },
    { 
      icon: RadioWaves, 
      label: 'Vibration', 
      value: '2.1 Hz', 
      max: '', 
      color: '#FDE047',
      status: 'warning'
    },
    { 
      icon: Wind, 
      label: 'Air Quality', 
      value: '95%', 
      max: '', 
      color: '#86EFAC',
      status: 'normal'
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.roleText}>Welcome back,</Text>
              <Text style={styles.userName}>Engineer</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                onPress={() => router.push('/engineer/NotificationsScreen' as any)}
                style={styles.headerIconButton}
              >
                <Bell size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => router.push('/profile' as any)}
                style={styles.headerIconButton}
              >
                <User size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* IoT Network Card */}
          <View style={styles.iotCard}>
            <View style={styles.iotHeader}>
              <View style={styles.iotTitleRow}>
                <Zap size={20} color="#86EFAC" />
                <Text style={styles.iotTitle}>IoT Network</Text>
              </View>
              <View style={styles.onlineStatus}>
                <Text style={styles.onlineText}>Online</Text>
              </View>
            </View>

            <View style={styles.iotStatsRow}>
              {iotStats.map((stat, index) => (
                <View key={index} style={styles.iotStat}>
                  <Text style={styles.iotStatValue}>{stat.value}</Text>
                  <Text style={styles.iotStatLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Active Alerts */}
        <View style={styles.section}>
          <View style={styles.alertsCardWrapper}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Alerts</Text>
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>2</Text>
              </View>
            </View>

            {activeAlerts.map((alert) => (
              <TouchableOpacity 
                key={alert.id} 
                style={[
                  styles.alertCard,
                  alert.severity === 'high' ? styles.alertCardHigh : styles.alertCardMedium
                ]}
              >
                <AlertTriangle 
                  size={24} 
                  color={alert.severity === 'high' ? '#DC2626' : '#F59E0B'} 
                />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertLocation}>{alert.location}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Alerts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Environmental Monitoring */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environmental Monitoring</Text>

          <View style={styles.envGrid}>
            {environmentalData.map((item, index) => {
              const Icon = item.icon;
              return (
                <View key={index} style={styles.envCard}>
                  <View style={styles.envCardHeader}>
                    <View style={[styles.envIconContainer, { backgroundColor: item.color + '30' }]}>
                      <Icon size={24} color={item.color} />
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: item.color }]} />
                  </View>
                  <Text style={styles.envLabel}>{item.label}</Text>
                  <Text style={styles.envValue}>{item.value}</Text>
                  {item.max && <Text style={styles.envMax}>{item.max}</Text>}
                </View>
              );
            })}
          </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2C3E50',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  roleText: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iotCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    marginTop: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iotTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  onlineStatus: {
    backgroundColor: '#86EFAC',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  onlineText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
  },
  iotStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  iotStat: {
    alignItems: 'center',
  },
  iotStatValue: {
    fontSize: 32,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  iotStatLabel: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  section: {
    padding: 24,
    backgroundColor: COLORS.background,
  },
  alertsCardWrapper: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  alertBadge: {
    backgroundColor: '#EF4444',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: COLORS.card,
  },
  alertCardHigh: {
    borderColor: '#EF4444',
  },
  alertCardMedium: {
    borderColor: '#F59E0B',
  },
  alertContent: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  alertLocation: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  envGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  envCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  envCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  envIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  envLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  envValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  envMax: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
