import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AlertTriangle,
    ArrowLeft,
    Droplets,
    Heart,
    Thermometer,
    TrendingDown,
    TrendingUp
} from '../../components/Icons';
import { PulseWaveform } from '../../components/PulseWaveform';
import { getWebSocketURL } from '../../config/smartHelmetConfig';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';

interface VitalReading {
  timestamp: number;
  heartRate: number;
  spo2: number;
  temperature: number;
  humidity: number;
}

interface HealthStats {
  avgHeartRate: number;
  avgSpo2: number;
  avgTemp: number;
  trend: 'up' | 'down' | 'stable';
}

export default function HealthMonitoring() {
  const router = useRouter();
  const { user } = useRoleStore();
  const ws = useRef<WebSocket | null>(null);
  
  // Real-time data from smart helmet
  const [heartRate, setHeartRate] = useState<number>(0);
  const [spo2, setSpo2] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(0);
  const [humidity, setHumidity] = useState<number>(0);
  const [connected, setConnected] = useState(false);
  
  // Historical data
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [stats, setStats] = useState<HealthStats>({
    avgHeartRate: 0,
    avgSpo2: 0,
    avgTemp: 0,
    trend: 'stable',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '4h' | '8h' | '24h'>('1h');

  useEffect(() => {
    loadHistoricalData();
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      const wsUrl = getWebSocketURL();
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('Health monitoring WebSocket connected');
        setConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Update real-time vitals
          if (data.pulse) {
            setHeartRate(data.pulse.bpm || 0);
            setSpo2(data.pulse.spo2 || 0);
          }
          
          if (data.env) {
            setTemperature(data.env.temp || 0);
            setHumidity(data.env.hum || 0);
          }

          // Save reading to history
          const newReading: VitalReading = {
            timestamp: Date.now(),
            heartRate: data.pulse?.bpm || 0,
            spo2: data.pulse?.spo2 || 0,
            temperature: data.env?.temp || 0,
            humidity: data.env?.hum || 0,
          };

          saveReading(newReading);
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };

      ws.current.onclose = () => {
        console.log('WebSocket closed');
        setConnected(false);
        
        // Try to reconnect after 5 seconds
        setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      setConnected(false);
    }
  };

  const loadHistoricalData = async () => {
    try {
      const key = `health_readings_${user.id}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (stored) {
        const parsedReadings: VitalReading[] = JSON.parse(stored);
        setReadings(parsedReadings);
        calculateStats(parsedReadings);
      } else {
        // Generate sample historical data for demo
        const sampleReadings = generateSampleData();
        setReadings(sampleReadings);
        calculateStats(sampleReadings);
        await AsyncStorage.setItem(key, JSON.stringify(sampleReadings));
      }
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  };

  const saveReading = async (reading: VitalReading) => {
    try {
      const updated = [...readings, reading].slice(-500); // Keep last 500 readings
      setReadings(updated);
      calculateStats(updated);
      
      const key = `health_readings_${user.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving reading:', error);
    }
  };

  const generateSampleData = (): VitalReading[] => {
    const now = Date.now();
    const data: VitalReading[] = [];
    
    for (let i = 24; i >= 0; i--) {
      data.push({
        timestamp: now - i * 60 * 60 * 1000, // Every hour for 24 hours
        heartRate: 70 + Math.random() * 20,
        spo2: 95 + Math.random() * 4,
        temperature: 28 + Math.random() * 5,
        humidity: 50 + Math.random() * 20,
      });
    }
    
    return data;
  };

  const calculateStats = (data: VitalReading[]) => {
    if (data.length === 0) return;

    const recent = data.slice(-10); // Last 10 readings
    const avgHR = recent.reduce((sum, r) => sum + r.heartRate, 0) / recent.length;
    const avgSpo2 = recent.reduce((sum, r) => sum + r.spo2, 0) / recent.length;
    const avgTemp = recent.reduce((sum, r) => sum + r.temperature, 0) / recent.length;

    // Determine trend
    const oldAvgHR = data.slice(-20, -10).reduce((sum, r) => sum + r.heartRate, 0) / 10;
    const trend = avgHR > oldAvgHR + 2 ? 'up' : avgHR < oldAvgHR - 2 ? 'down' : 'stable';

    setStats({
      avgHeartRate: Math.round(avgHR),
      avgSpo2: Math.round(avgSpo2),
      avgTemp: Math.round(avgTemp * 10) / 10,
      trend,
    });
  };

  const getFilteredReadings = () => {
    const now = Date.now();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '8h': 8 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    };
    
    return readings.filter(r => r.timestamp >= now - ranges[timeRange]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistoricalData();
    setRefreshing(false);
  };

  const getHealthStatus = (metric: 'hr' | 'spo2' | 'temp') => {
    if (metric === 'hr') {
      if (heartRate < 60) return { status: 'Low', color: '#F59E0B' };
      if (heartRate > 100) return { status: 'High', color: '#EF4444' };
      return { status: 'Normal', color: '#10B981' };
    }
    
    if (metric === 'spo2') {
      if (spo2 < 95) return { status: 'Low', color: '#EF4444' };
      if (spo2 < 97) return { status: 'Fair', color: '#F59E0B' };
      return { status: 'Good', color: '#10B981' };
    }
    
    if (metric === 'temp') {
      if (temperature > 35) return { status: 'Hot', color: '#EF4444' };
      if (temperature > 32) return { status: 'Warm', color: '#F59E0B' };
      return { status: 'Normal', color: '#10B981' };
    }
    
    return { status: 'Unknown', color: COLORS.textMuted };
  };

  const filteredReadings = getFilteredReadings();
  const chartData = {
    labels: filteredReadings.slice(-6).map((_, i) => `${i * 10}m`),
    datasets: [
      {
        data: filteredReadings.slice(-6).map(r => r.heartRate),
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const hrStatus = getHealthStatus('hr');
  const spo2Status = getHealthStatus('spo2');
  const tempStatus = getHealthStatus('temp');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Monitoring</Text>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusDot, { backgroundColor: connected ? '#10B981' : '#EF4444' }]} />
          <Text style={styles.statusText}>{connected ? 'Live' : 'Offline'}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Real-Time Vitals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Real-Time Vitals</Text>
          
          <View style={styles.vitalsGrid}>
            {/* Heart Rate */}
            <View style={styles.vitalCard}>
              <View style={styles.vitalHeader}>
                <Heart size={24} color="#EF4444" />
                <Text style={styles.vitalLabel}>Heart Rate</Text>
              </View>
              <Text style={styles.vitalValue}>{heartRate || '--'}</Text>
              <Text style={styles.vitalUnit}>BPM</Text>
              <View style={[styles.statusBadge, { backgroundColor: hrStatus.color }]}>
                <Text style={styles.statusText}>{hrStatus.status}</Text>
              </View>
            </View>

            {/* SpO2 */}
            <View style={styles.vitalCard}>
              <View style={styles.vitalHeader}>
                <Droplets size={24} color="#3B82F6" />
                <Text style={styles.vitalLabel}>Blood Oxygen</Text>
              </View>
              <Text style={styles.vitalValue}>{spo2 || '--'}</Text>
              <Text style={styles.vitalUnit}>%</Text>
              <View style={[styles.statusBadge, { backgroundColor: spo2Status.color }]}>
                <Text style={styles.statusText}>{spo2Status.status}</Text>
              </View>
            </View>

            {/* Temperature */}
            <View style={styles.vitalCard}>
              <View style={styles.vitalHeader}>
                <Thermometer size={24} color="#F59E0B" />
                <Text style={styles.vitalLabel}>Temperature</Text>
              </View>
              <Text style={styles.vitalValue}>{temperature.toFixed(1) || '--'}</Text>
              <Text style={styles.vitalUnit}>°C</Text>
              <View style={[styles.statusBadge, { backgroundColor: tempStatus.color }]}>
                <Text style={styles.statusText}>{tempStatus.status}</Text>
              </View>
            </View>

            {/* Humidity */}
            <View style={styles.vitalCard}>
              <View style={styles.vitalHeader}>
                <Droplets size={24} color="#10B981" />
                <Text style={styles.vitalLabel}>Humidity</Text>
              </View>
              <Text style={styles.vitalValue}>{humidity.toFixed(0) || '--'}</Text>
              <Text style={styles.vitalUnit}>%</Text>
              <View style={[styles.statusBadge, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.statusText}>Monitor</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pulse Waveform */}
        {connected && heartRate > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pulse Waveform</Text>
            <View style={styles.waveformCard}>
              <PulseWaveform bpm={heartRate} />
            </View>
          </View>
        )}

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Statistics</Text>
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Average Heart Rate</Text>
              <View style={styles.statValueContainer}>
                <Text style={styles.statValue}>{stats.avgHeartRate} BPM</Text>
                {stats.trend === 'up' && <TrendingUp size={16} color="#EF4444" />}
                {stats.trend === 'down' && <TrendingDown size={16} color="#10B981" />}
              </View>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Average SpO2</Text>
              <Text style={styles.statValue}>{stats.avgSpo2}%</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Average Temperature</Text>
              <Text style={styles.statValue}>{stats.avgTemp}°C</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Readings Collected</Text>
              <Text style={styles.statValue}>{readings.length}</Text>
            </View>
          </View>
        </View>

        {/* Time Range Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historical Data</Text>
          <View style={styles.timeRangeContainer}>
            {(['1h', '4h', '8h', '24h'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[styles.timeRangeButton, timeRange === range && styles.timeRangeButtonActive]}
                onPress={() => setTimeRange(range)}
              >
                <Text style={[styles.timeRangeText, timeRange === range && styles.timeRangeTextActive]}>
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredReadings.length > 0 && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Heart Rate Trend</Text>
              <LineChart
                data={chartData}
                width={Dimensions.get('window').width - 60}
                height={200}
                chartConfig={{
                  backgroundColor: COLORS.card,
                  backgroundGradientFrom: COLORS.card,
                  backgroundGradientTo: COLORS.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
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
          )}
        </View>

        {/* Health Alerts */}
        {(hrStatus.status !== 'Normal' || spo2Status.status === 'Low') && (
          <View style={styles.section}>
            <View style={styles.alertCard}>
              <AlertTriangle size={24} color="#F59E0B" />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Health Alert</Text>
                <Text style={styles.alertText}>
                  {hrStatus.status !== 'Normal' && `Heart rate is ${hrStatus.status.toLowerCase()}. `}
                  {spo2Status.status === 'Low' && `Blood oxygen level is low. `}
                  Please monitor your condition and inform supervisor if symptoms persist.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Medical Test Records */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Medical Tests</Text>
          
          <TouchableOpacity style={styles.testReportCard}>
            <View style={styles.testReportHeader}>
              <View>
                <Text style={styles.testReportTitle}>Complete Blood Count (CBC)</Text>
                <Text style={styles.testReportDate}>Nov 28, 2025</Text>
              </View>
              <View style={[styles.testReportBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.testReportBadgeText}>Normal</Text>
              </View>
            </View>
            <View style={styles.testReportDetails}>
              <View style={styles.testReportRow}>
                <Text style={styles.testReportLabel}>Hemoglobin</Text>
                <Text style={styles.testReportValue}>14.5 g/dL</Text>
                <Text style={styles.testReportNormal}>(13-17)</Text>
              </View>
              <View style={styles.testReportRow}>
                <Text style={styles.testReportLabel}>WBC Count</Text>
                <Text style={styles.testReportValue}>7,200 /μL</Text>
                <Text style={styles.testReportNormal}>(4,000-11,000)</Text>
              </View>
              <View style={styles.testReportRow}>
                <Text style={styles.testReportLabel}>Platelet Count</Text>
                <Text style={styles.testReportValue}>250,000 /μL</Text>
                <Text style={styles.testReportNormal}>(150,000-400,000)</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testReportCard}>
            <View style={styles.testReportHeader}>
              <View>
                <Text style={styles.testReportTitle}>Lung Function Test (PFT)</Text>
                <Text style={styles.testReportDate}>Nov 25, 2025</Text>
              </View>
              <View style={[styles.testReportBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.testReportBadgeText}>Normal</Text>
              </View>
            </View>
            <View style={styles.testReportDetails}>
              <View style={styles.testReportRow}>
                <Text style={styles.testReportLabel}>FEV1</Text>
                <Text style={styles.testReportValue}>92%</Text>
                <Text style={styles.testReportNormal}>(≥80%)</Text>
              </View>
              <View style={styles.testReportRow}>
                <Text style={styles.testReportLabel}>FVC</Text>
                <Text style={styles.testReportValue}>95%</Text>
                <Text style={styles.testReportNormal}>(≥80%)</Text>
              </View>
              <View style={styles.testReportRow}>
                <Text style={styles.testReportLabel}>FEV1/FVC Ratio</Text>
                <Text style={styles.testReportValue}>0.85</Text>
                <Text style={styles.testReportNormal}>(≥0.70)</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testReportCard}>
            <View style={styles.testReportHeader}>
              <View>
                <Text style={styles.testReportTitle}>Chest X-Ray</Text>
                <Text style={styles.testReportDate}>Nov 20, 2025</Text>
              </View>
              <View style={[styles.testReportBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.testReportBadgeText}>Clear</Text>
              </View>
            </View>
            <View style={styles.testReportAnalysis}>
              <Text style={styles.testReportAnalysisTitle}>Analysis:</Text>
              <Text style={styles.testReportAnalysisText}>
                • No signs of pneumoconiosis or silicosis{'\n'}
                • Lung fields are clear bilaterally{'\n'}
                • Heart size within normal limits{'\n'}
                • No evidence of occupational lung disease
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testReportCard}>
            <View style={styles.testReportHeader}>
              <View>
                <Text style={styles.testReportTitle}>Audiometry Test</Text>
                <Text style={styles.testReportDate}>Nov 15, 2025</Text>
              </View>
              <View style={[styles.testReportBadge, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.testReportBadgeText}>Monitor</Text>
              </View>
            </View>
            <View style={styles.testReportDetails}>
              <View style={styles.testReportRow}>
                <Text style={styles.testReportLabel}>Right Ear (500-4000 Hz)</Text>
                <Text style={styles.testReportValue}>18 dB</Text>
                <Text style={styles.testReportNormal}>(&lt;25 dB)</Text>
              </View>
              <View style={styles.testReportRow}>
                <Text style={styles.testReportLabel}>Left Ear (500-4000 Hz)</Text>
                <Text style={styles.testReportValue}>22 dB</Text>
                <Text style={styles.testReportNormal}>(&lt;25 dB)</Text>
              </View>
            </View>
            <View style={styles.testReportAnalysis}>
              <Text style={styles.testReportAnalysisText}>
                Mild threshold shift detected. Continue using hearing protection consistently.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Health Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Recommendations</Text>
          <View style={styles.recommendationsCard}>
            <View style={styles.recommendationItem}>
              <View style={styles.recommendationIcon}>
                <Text style={styles.recommendationEmoji}>✓</Text>
              </View>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>Overall Health Status: Good</Text>
                <Text style={styles.recommendationText}>
                  All major health parameters are within normal range. Continue following safety protocols.
                </Text>
              </View>
            </View>
            
            <View style={styles.recommendationItem}>
              <View style={styles.recommendationIcon}>
                <Text style={styles.recommendationEmoji}>👂</Text>
              </View>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>Hearing Protection</Text>
                <Text style={styles.recommendationText}>
                  Ensure consistent use of earplugs in high-noise areas. Schedule follow-up audiometry in 6 months.
                </Text>
              </View>
            </View>

            <View style={styles.recommendationItem}>
              <View style={styles.recommendationIcon}>
                <Text style={styles.recommendationEmoji}>💧</Text>
              </View>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>Stay Hydrated</Text>
                <Text style={styles.recommendationText}>
                  Drink at least 3-4 liters of water during shift, especially in high-temperature zones.
                </Text>
              </View>
            </View>

            <View style={styles.recommendationItem}>
              <View style={styles.recommendationIcon}>
                <Text style={styles.recommendationEmoji}>📅</Text>
              </View>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>Next Checkup</Text>
                <Text style={styles.recommendationText}>
                  Routine health screening scheduled for December 15, 2025. Don't miss your appointment.
                </Text>
              </View>
            </View>
          </View>
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
    flex: 1,
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vitalCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  vitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vitalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  vitalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  vitalUnit: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  waveformCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
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
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B20',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  testReportCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  testReportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  testReportDate: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  testReportBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  testReportBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  testReportDetails: {
    gap: 12,
  },
  testReportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  testReportLabel: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  testReportValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 8,
  },
  testReportNormal: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  testReportAnalysis: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  testReportAnalysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  testReportAnalysisText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  recommendationsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationEmoji: {
    fontSize: 20,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
