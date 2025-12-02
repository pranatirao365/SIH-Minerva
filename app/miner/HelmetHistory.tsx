import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    Clock
} from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';

interface SessionData {
  id: string;
  date: string;
  duration: number; // minutes
  avgHeartRate: number;
  avgSpo2: number;
  avgTemp: number;
  alerts: number;
  location: string;
}

export default function HelmetHistory() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadHistory();
  }, [timeRange]);

  const loadHistory = async () => {
    try {
      const key = `helmet_history_${user.id}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (stored) {
        setSessions(JSON.parse(stored));
      } else {
        // Generate sample history
        const sampleSessions: SessionData[] = [];
        const now = new Date();
        
        for (let i = 0; i < 14; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          
          sampleSessions.push({
            id: `session_${i}`,
            date: date.toISOString().split('T')[0],
            duration: 480 + Math.floor(Math.random() * 60), // 8-9 hours
            avgHeartRate: 70 + Math.floor(Math.random() * 15),
            avgSpo2: 96 + Math.floor(Math.random() * 3),
            avgTemp: 30 + Math.random() * 4,
            alerts: Math.floor(Math.random() * 3),
            location: ['Section A', 'Section B', 'Section C'][Math.floor(Math.random() * 3)],
          });
        }
        
        await AsyncStorage.setItem(key, JSON.stringify(sampleSessions));
        setSessions(sampleSessions);
      }
    } catch (error) {
      console.error('Error loading helmet history:', error);
    }
  };

  const filteredSessions = timeRange === 'week' ? sessions.slice(0, 7) : sessions;
  
  const chartData = {
    labels: filteredSessions.slice(0, 7).reverse().map((s) => {
      const date = new Date(s.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }),
    datasets: [
      {
        data: filteredSessions.slice(0, 7).reverse().map(s => s.avgHeartRate),
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const totalHours = filteredSessions.reduce((sum, s) => sum + s.duration, 0) / 60;
  const avgHeartRate = Math.round(
    filteredSessions.reduce((sum, s) => sum + s.avgHeartRate, 0) / filteredSessions.length
  );
  const totalAlerts = filteredSessions.reduce((sum, s) => sum + s.alerts, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Helmet Usage History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Time Range */}
        <View style={styles.timeRangeContainer}>
          <TouchableOpacity
            style={[styles.timeRangeButton, timeRange === 'week' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('week')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'week' && styles.timeRangeTextActive]}>
              Last 7 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeRangeButton, timeRange === 'month' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('month')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'month' && styles.timeRangeTextActive]}>
              Last 30 Days
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Clock size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{Math.round(totalHours)}h</Text>
            <Text style={styles.statLabel}>Total Usage</Text>
          </View>
          <View style={styles.statCard}>
            <Activity size={24} color="#EF4444" />
            <Text style={styles.statValue}>{avgHeartRate}</Text>
            <Text style={styles.statLabel}>Avg Heart Rate</Text>
          </View>
          <View style={styles.statCard}>
            <AlertTriangle size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{totalAlerts}</Text>
            <Text style={styles.statLabel}>Total Alerts</Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Heart Rate Trend</Text>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 40}
            height={200}
            chartConfig={{
              backgroundColor: COLORS.card,
              backgroundGradientFrom: COLORS.card,
              backgroundGradientTo: COLORS.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#EF4444',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Session History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session History</Text>
          {filteredSessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View>
                  <Text style={styles.sessionDate}>
                    {new Date(session.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.sessionLocation}>📍 {session.location}</Text>
                </View>
                <View style={styles.sessionDuration}>
                  <Clock size={16} color={COLORS.textMuted} />
                  <Text style={styles.sessionDurationText}>
                    {Math.floor(session.duration / 60)}h {session.duration % 60}m
                  </Text>
                </View>
              </View>

              <View style={styles.sessionStats}>
                <View style={styles.sessionStat}>
                  <Text style={styles.sessionStatLabel}>Heart Rate</Text>
                  <Text style={styles.sessionStatValue}>{session.avgHeartRate} BPM</Text>
                </View>
                <View style={styles.sessionStat}>
                  <Text style={styles.sessionStatLabel}>SpO2</Text>
                  <Text style={styles.sessionStatValue}>{session.avgSpo2}%</Text>
                </View>
                <View style={styles.sessionStat}>
                  <Text style={styles.sessionStatLabel}>Temp</Text>
                  <Text style={styles.sessionStatValue}>{session.avgTemp.toFixed(1)}°C</Text>
                </View>
              </View>

              {session.alerts > 0 && (
                <View style={styles.alertsBadge}>
                  <AlertTriangle size={14} color="#F59E0B" />
                  <Text style={styles.alertsText}>{session.alerts} alerts</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    margin: 20,
    gap: 12,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeRangeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  chartSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  section: {
    padding: 20,
  },
  sessionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  sessionLocation: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  sessionDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sessionDurationText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  sessionStat: {
    alignItems: 'center',
  },
  sessionStatLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  sessionStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  alertsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
});
