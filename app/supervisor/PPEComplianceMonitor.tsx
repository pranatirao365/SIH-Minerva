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
import { ArrowLeft, CheckCircle, Clock, XCircle } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { getPPEScanResults, requestReScan as requestReScanAPI } from '../../services/supervisorEnhancements';

interface PPEScan {
  id: string;
  minerId: string;
  minerName: string;
  timestamp: string;
  status: 'pass' | 'fail' | 'pending';
  details: string[];
  confidenceScore: number;
  resultImageUrl?: string;
}

export default function PPEComplianceMonitor() {
  const router = useRouter();
  
  // Mock data - Replace with Firebase integration
  const mockScans: PPEScan[] = [
    {
      id: '1',
      minerId: 'M001',
      minerName: 'Rajesh Kumar',
      timestamp: '2 hours ago',
      status: 'pass',
      details: ['All PPE items detected'],
      confidenceScore: 98,
    },
    {
      id: '2',
      minerId: 'M002',
      minerName: 'Amit Sharma',
      timestamp: '1 hour ago',
      status: 'fail',
      details: ['Missing: Safety Gloves', 'Missing: Eye Protection'],
      confidenceScore: 87,
    },
    {
      id: '3',
      minerId: 'M003',
      minerName: 'Vikram Singh',
      timestamp: '30 mins ago',
      status: 'pass',
      details: ['All PPE items detected'],
      confidenceScore: 95,
    },
    {
      id: '4',
      minerId: 'M004',
      minerName: 'Suresh Patel',
      timestamp: 'Just now',
      status: 'pending',
      details: ['Scan in progress...'],
      confidenceScore: 0,
    },
  ];

  const [scans, setScans] = useState<PPEScan[]>(mockScans);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pass' | 'fail' | 'pending'>('all');

  const loadScans = async () => {
    try {
      // Set a timeout for the API call (3 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network request timed out')), 3000)
      );
      
      const data = await Promise.race([
        getPPEScanResults(),
        timeoutPromise
      ]) as any;
      setScans(data);
    } catch (error: any) {
      console.log('Error loading PPE scans, using mock data:', error.message);
      // Keep using mock data on error
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScans();
    setRefreshing(false);
  };

  const requestRescan = async (scanId: string, minerName: string) => {
    Alert.alert(
      'Request Re-scan',
      `Send re-scan request to ${minerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: async () => {
            try {
              await requestReScanAPI(scanId);
              Alert.alert('Success', 'Re-scan request sent');
              loadScans();
            } catch (error) {
              Alert.alert('Error', 'Failed to send re-scan request');
            }
          },
        },
      ]
    );
  };

  const filteredScans = scans.filter(scan =>
    filter === 'all' ? true : scan.status === filter
  );

  const passCount = scans.filter(s => s.status === 'pass').length;
  const failCount = scans.filter(s => s.status === 'fail').length;
  const pendingCount = scans.filter(s => s.status === 'pending').length;
  const complianceRate = scans.length > 0 ? Math.round((passCount / scans.length) * 100) : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle size={24} color="#10B981" />;
      case 'fail':
        return <XCircle size={24} color="#EF4444" />;
      case 'pending':
        return <Clock size={24} color="#F59E0B" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return '#10B981';
      case 'fail':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return COLORS.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PPE Compliance Monitor</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Compliance Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{complianceRate}%</Text>
            <Text style={styles.statLabel}>Compliance Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{passCount}</Text>
            <Text style={styles.statLabel}>Passed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{failCount}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'pass', 'fail', 'pending'] as const).map((filterOption) => (
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

        {/* Scan Results */}
        <View style={styles.scansList}>
          {filteredScans.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No {filter !== 'all' ? filter : ''} scans found</Text>
            </View>
          ) : (
            filteredScans.map((scan) => (
              <View key={scan.id} style={styles.scanCard}>
                <View style={styles.scanHeader}>
                  <View style={styles.scanHeaderLeft}>
                    {getStatusIcon(scan.status)}
                    <View style={styles.scanHeaderInfo}>
                      <Text style={styles.minerName}>{scan.minerName}</Text>
                      <Text style={styles.minerId}>{scan.minerId}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(scan.status) + '20' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(scan.status) }]}>
                      {scan.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.scanDetails}>
                  <Text style={styles.timestamp}>📅 {scan.timestamp}</Text>
                  {scan.confidenceScore > 0 && (
                    <Text style={styles.confidence}>
                      🎯 Confidence: {scan.confidenceScore}%
                    </Text>
                  )}
                </View>

                <View style={styles.detailsList}>
                  {scan.details.map((detail, index) => (
                    <Text key={index} style={styles.detailItem}>
                      • {detail}
                    </Text>
                  ))}
                </View>

                <View style={styles.scanActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      Alert.alert('Scan Details', `Detailed view for ${scan.minerName}`);
                    }}
                  >
                    <Text style={styles.actionButtonText}>View Details</Text>
                  </TouchableOpacity>
                  {scan.status === 'fail' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rescanButton]}
                      onPress={() => requestRescan(scan.id, scan.minerName)}
                    >
                      <Text style={[styles.actionButtonText, styles.rescanButtonText]}>
                        Request Re-scan
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
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
    padding: 12,
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
  scansList: {
    padding: 16,
    paddingTop: 0,
  },
  scanCard: {
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
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scanHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scanHeaderInfo: {
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
  scanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timestamp: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  confidence: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  detailsList: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  detailItem: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  scanActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  rescanButton: {
    backgroundColor: '#EF4444' + '20',
  },
  rescanButtonText: {
    color: '#EF4444',
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
