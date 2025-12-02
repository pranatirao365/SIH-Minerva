import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, AlertTriangle, ArrowLeft, Heart, Thermometer } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { getMinerVitals, updateFitnessStatus } from '../../services/supervisorEnhancements';

interface MinerVitals {
  id: string;
  minerId: string;
  minerName: string;
  heartRate: number;
  spO2: number;
  temperature: number;
  fitnessStatus: 'fit' | 'monitor' | 'unfit';
  lastUpdate: string;
  trend: 'stable' | 'improving' | 'declining';
}

export default function HealthMonitoring() {
  const router = useRouter();
  const [miners, setMiners] = useState<MinerVitals[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'fit' | 'monitor' | 'unfit'>('all');

  // Mock data
  const mockMiners: MinerVitals[] = [
    {
      id: '1',
      minerId: 'M001',
      minerName: 'Rajesh Kumar',
      heartRate: 78,
      spO2: 98,
      temperature: 36.8,
      fitnessStatus: 'fit',
      lastUpdate: '2 mins ago',
      trend: 'stable',
    },
    {
      id: '2',
      minerId: 'M002',
      minerName: 'Amit Sharma',
      heartRate: 110,
      spO2: 92,
      temperature: 38.2,
      fitnessStatus: 'monitor',
      lastUpdate: '5 mins ago',
      trend: 'declining',
    },
    {
      id: '3',
      minerId: 'M003',
      minerName: 'Vikram Singh',
      heartRate: 125,
      spO2: 87,
      temperature: 39.5,
      fitnessStatus: 'unfit',
      lastUpdate: '1 min ago',
      trend: 'declining',
    },
    {
      id: '4',
      minerId: 'M004',
      minerName: 'Suresh Patel',
      heartRate: 82,
      spO2: 96,
      temperature: 37.1,
      fitnessStatus: 'fit',
      lastUpdate: '3 mins ago',
      trend: 'stable',
    },
  ];

  useEffect(() => {
    loadMiners();
  }, []);

  const loadMiners = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        console.error('Supervisor ID not found');
        setMiners([]);
        return;
      }

      // Load only miners assigned to this supervisor
      const { getMinersBySupervisor } = await import('@/services/minerService');
      const assignedMiners = await getMinersBySupervisor(user.id);

      // Transform to MinerVitals format
      const minerVitals: MinerVitals[] = assignedMiners.map((miner) => ({
        id: miner.id,
        name: miner.name || 'Unknown',
        heartRate: 0, // Would fetch real data from IoT devices
        oxygenLevel: 0,
        temperature: 0,
        status: 'normal' as const,
        lastUpdate: new Date().toISOString(),
        location: miner.department || 'Unknown',
      }));

      setMiners(minerVitals);
      console.log(`✅ Loaded ${minerVitals.length} miners for supervisor ${user.id}`);
    } catch (error) {
      console.error('Error loading miner vitals:', error);
      setMiners([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMiners();
    setRefreshing(false);
  };

  const updateMinerFitness = (minerId: string, minerName: string, currentStatus: string) => {
    Alert.alert(
      'Update Fitness Status',
      `Update fitness status for ${minerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Fit',
          onPress: async () => {
            try {
              await updateFitnessStatus(minerId, 'fit');
              Alert.alert('Success', 'Fitness status updated to Fit');
              loadMiners();
            } catch (error) {
              Alert.alert('Error', 'Failed to update fitness status');
            }
          },
        },
        {
          text: 'Mark Monitor',
          onPress: async () => {
            try {
              await updateFitnessStatus(minerId, 'monitor');
              Alert.alert('Success', 'Fitness status updated to Monitor');
              loadMiners();
            } catch (error) {
              Alert.alert('Error', 'Failed to update fitness status');
            }
          },
        },
        {
          text: 'Mark Unfit',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateFitnessStatus(minerId, 'unfit', 'Marked unfit by supervisor');
              Alert.alert('Success', 'Fitness status updated to Unfit');
              loadMiners();
            } catch (error) {
              Alert.alert('Error', 'Failed to update fitness status');
            }
          },
        },
      ]
    );
  };

  const filteredMiners = miners.filter(miner =>
    filter === 'all' ? true : miner.fitnessStatus === filter
  );

  const fitCount = miners.filter(m => m.fitnessStatus === 'fit').length;
  const monitorCount = miners.filter(m => m.fitnessStatus === 'monitor').length;
  const unfitCount = miners.filter(m => m.fitnessStatus === 'unfit').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fit':
        return '#10B981';
      case 'monitor':
        return '#F59E0B';
      case 'unfit':
        return '#EF4444';
      default:
        return COLORS.textMuted;
    }
  };

  const getVitalStatus = (type: 'hr' | 'spo2' | 'temp', value: number) => {
    if (type === 'hr') {
      if (value < 60 || value > 100) return '#EF4444';
      return '#10B981';
    } else if (type === 'spo2') {
      if (value < 90) return '#EF4444';
      if (value < 95) return '#F59E0B';
      return '#10B981';
    } else if (type === 'temp') {
      if (value > 38.5 || value < 36) return '#EF4444';
      if (value > 37.5) return '#F59E0B';
      return '#10B981';
    }
    return COLORS.textMuted;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading health data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Monitoring</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{fitCount}</Text>
            <Text style={styles.statLabel}>Fit for Duty</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{monitorCount}</Text>
            <Text style={styles.statLabel}>Monitor</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{unfitCount}</Text>
            <Text style={styles.statLabel}>Unfit</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'fit', 'monitor', 'unfit'] as const).map((filterOption) => (
            <TouchableOpacity
              key={filterOption}
              style={[
                styles.filterTab,
                filter === filterOption && styles.filterTabActive,
              ]}
              onPress={() => setFilter(filterOption)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === filterOption && styles.filterTextActive,
                ]}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Miners List */}
        <View style={styles.minersList}>
          {filteredMiners.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No miners found</Text>
            </View>
          ) : (
            filteredMiners.map((miner) => (
              <View key={miner.id} style={styles.minerCard}>
                <View style={styles.minerHeader}>
                  <View style={styles.minerHeaderLeft}>
                    <Activity size={24} color={getStatusColor(miner.fitnessStatus)} />
                    <View style={styles.minerInfo}>
                      <Text style={styles.minerName}>{miner.minerName}</Text>
                      <Text style={styles.minerId}>{miner.minerId}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(miner.fitnessStatus) + '20' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(miner.fitnessStatus) }]}>
                      {miner.fitnessStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.vitalsContainer}>
                  <View style={styles.vitalCard}>
                    <Heart size={20} color={getVitalStatus('hr', miner.heartRate)} />
                    <Text style={styles.vitalLabel}>Heart Rate</Text>
                    <Text style={[styles.vitalValue, { color: getVitalStatus('hr', miner.heartRate) }]}>
                      {miner.heartRate} BPM
                    </Text>
                  </View>

                  <View style={styles.vitalCard}>
                    <Activity size={20} color={getVitalStatus('spo2', miner.spO2)} />
                    <Text style={styles.vitalLabel}>SpO2</Text>
                    <Text style={[styles.vitalValue, { color: getVitalStatus('spo2', miner.spO2) }]}>
                      {miner.spO2}%
                    </Text>
                  </View>

                  <View style={styles.vitalCard}>
                    <Thermometer size={20} color={getVitalStatus('temp', miner.temperature)} />
                    <Text style={styles.vitalLabel}>Temperature</Text>
                    <Text style={[styles.vitalValue, { color: getVitalStatus('temp', miner.temperature) }]}>
                      {miner.temperature}°C
                    </Text>
                  </View>
                </View>

                <View style={styles.minerFooter}>
                  <Text style={styles.lastUpdate}>Updated: {miner.lastUpdate}</Text>
                  <TouchableOpacity
                    style={styles.updateButton}
                    onPress={() => updateMinerFitness(miner.minerId, miner.minerName, miner.fitnessStatus)}
                  >
                    <Text style={styles.updateButtonText}>Update Status</Text>
                  </TouchableOpacity>
                </View>

                {miner.fitnessStatus === 'unfit' && (
                  <View style={styles.alertBanner}>
                    <AlertTriangle size={16} color="#EF4444" />
                    <Text style={styles.alertText}>Unfit for duty - Restrict assignments</Text>
                  </View>
                )}
              </View>
            ))
          )}
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
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  minersList: {
    padding: 16,
    paddingTop: 0,
  },
  minerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  minerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  minerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  minerInfo: {
    gap: 4,
  },
  minerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  minerId: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  vitalsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  minerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastUpdate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  updateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '20',
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#EF4444' + '20',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  alertText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
});
