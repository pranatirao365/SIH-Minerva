import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, XCircle, Shield, User, AlertTriangle, Filter, Bell, RefreshCw, X } from '@/components/Icons';
import { COLORS } from '@/constants/styles';

interface PPEItem {
  present: boolean;
  confidence: number | null;
  raw_class: string | null;
}

interface MinerPPEResults {
  helmet: PPEItem;
  no_helmet: PPEItem;
  vest: PPEItem;
  no_vest: PPEItem;
  gloves: PPEItem;
  goggles: PPEItem;
  shoes: PPEItem;
  suit: PPEItem;
}

interface MinerData {
  id: string;
  name: string;
  shift: string;
  location: string;
  ppeResults: MinerPPEResults;
  timestamp: number;
  imageUrl?: string;
}

interface PPEParameter {
  id: string;
  name: string;
  required: boolean;
  description: string;
}

const PPE_PARAMETERS: PPEParameter[] = [
  { id: 'helmet', name: 'Safety Helmet', required: true, description: 'Hard hat or safety helmet' },
  { id: 'vest', name: 'Safety Vest', required: true, description: 'High-visibility safety vest' },
  { id: 'gloves', name: 'Safety Gloves', required: true, description: 'Protective hand gloves' },
  { id: 'goggles', name: 'Safety Goggles', required: false, description: 'Eye protection goggles' },
  { id: 'shoes', name: 'Safety Shoes', required: true, description: 'Steel-toed safety boots' },
  { id: 'suit', name: 'Protective Suit', required: false, description: 'Full protective suit' },
];

// Mock data for demonstration
const mockMinerData: MinerData[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    shift: 'Morning',
    location: 'Section A - Level 3',
    timestamp: Date.now() - 1000 * 60 * 15, // 15 minutes ago
    ppeResults: {
      helmet: { present: true, confidence: 0.95, raw_class: 'helmet' },
      no_helmet: { present: false, confidence: null, raw_class: null },
      vest: { present: true, confidence: 0.88, raw_class: 'vest' },
      no_vest: { present: false, confidence: null, raw_class: null },
      gloves: { present: true, confidence: 0.92, raw_class: 'gloves' },
      goggles: { present: false, confidence: null, raw_class: null },
      shoes: { present: true, confidence: 0.85, raw_class: 'shoes' },
      suit: { present: false, confidence: null, raw_class: null },
    },
  },
  {
    id: '2',
    name: 'Amit Singh',
    shift: 'Morning',
    location: 'Section B - Level 2',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    ppeResults: {
      helmet: { present: false, confidence: null, raw_class: null },
      no_helmet: { present: true, confidence: 0.78, raw_class: 'no_helmet' },
      vest: { present: true, confidence: 0.91, raw_class: 'vest' },
      no_vest: { present: false, confidence: null, raw_class: null },
      gloves: { present: false, confidence: null, raw_class: null },
      goggles: { present: false, confidence: null, raw_class: null },
      shoes: { present: true, confidence: 0.87, raw_class: 'shoes' },
      suit: { present: false, confidence: null, raw_class: null },
    },
  },
  {
    id: '3',
    name: 'Suresh Patel',
    shift: 'Afternoon',
    location: 'Section A - Level 1',
    timestamp: Date.now() - 1000 * 60 * 45, // 45 minutes ago
    ppeResults: {
      helmet: { present: true, confidence: 0.89, raw_class: 'helmet' },
      no_helmet: { present: false, confidence: null, raw_class: null },
      vest: { present: true, confidence: 0.94, raw_class: 'vest' },
      no_vest: { present: false, confidence: null, raw_class: null },
      gloves: { present: true, confidence: 0.96, raw_class: 'gloves' },
      goggles: { present: true, confidence: 0.82, raw_class: 'goggles' },
      shoes: { present: true, confidence: 0.90, raw_class: 'shoes' },
      suit: { present: false, confidence: null, raw_class: null },
    },
  },
];

export default function PPEConfigManager() {
  const router = useRouter();
  const [miners, setMiners] = useState<MinerData[]>(mockMinerData);
  const [selectedParameters, setSelectedParameters] = useState<string[]>(
    PPE_PARAMETERS.filter(p => p.required).map(p => p.id)
  );
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [complianceFilter, setComplianceFilter] = useState<'all' | 'safe' | 'unsafe'>('all');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'Morning' | 'Afternoon' | 'Night'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ppeParameterFilter, setPpeParameterFilter] = useState<string>('all'); // New PPE parameter filter

  // Notification modal
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [selectedMinerForNotification, setSelectedMinerForNotification] = useState<MinerData | null>(null);

  const checkMinerCompliance = (miner: MinerData): boolean => {
    if (ppeParameterFilter === 'all') {
      // Check all required parameters
      return selectedParameters.every(paramId => {
        const result = miner.ppeResults[paramId as keyof MinerPPEResults];
        return result?.present === true;
      });
    } else {
      // Check specific parameter
      const result = miner.ppeResults[ppeParameterFilter as keyof MinerPPEResults];
      return result?.present === true;
    }
  };

  // Filtered miners based on current filters
  const filteredMiners = useMemo(() => {
    return miners.filter(miner => {
      // PPE Parameter filter - if specific parameter selected, only show miners missing it
      if (ppeParameterFilter !== 'all') {
        const result = miner.ppeResults[ppeParameterFilter as keyof MinerPPEResults];
        const isMissingParameter = !result?.present;
        if (!isMissingParameter) return false; // Only show miners missing the selected parameter
      }

      // Compliance filter (only applies when 'all' PPE parameters selected)
      if (ppeParameterFilter === 'all') {
        const isCompliant = checkMinerCompliance(miner);
        if (complianceFilter === 'safe' && !isCompliant) return false;
        if (complianceFilter === 'unsafe' && isCompliant) return false;
      }

      // Shift filter
      if (shiftFilter !== 'all' && miner.shift !== shiftFilter) return false;

      // Location filter
      if (locationFilter !== 'all' && !miner.location.includes(locationFilter)) return false;

      // Search filter
      if (searchQuery && !miner.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      return true;
    });
  }, [miners, complianceFilter, shiftFilter, locationFilter, searchQuery, selectedParameters, ppeParameterFilter]);

  // Get unique locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locations = miners.map(miner => miner.location.split(' - ')[0]);
    return [...new Set(locations)];
  }, [miners]);

  const sendNotification = (miner: MinerData, message: string) => {
    // In a real app, this would send a notification to the miner's device
    Alert.alert(
      'Notification Sent',
      `Safety alert sent to ${miner.name}: "${message}"`,
      [{ text: 'OK' }]
    );
    setShowNotificationModal(false);
    setNotificationMessage('');
    setSelectedMinerForNotification(null);
  };

  const notifyUnsafeMiners = () => {
    if (filteredMiners.length === 0) {
      Alert.alert('No miners to notify', 'No miners match the current filter criteria.');
      return;
    }

    const unsafeMiners = filteredMiners.filter(miner => !checkMinerCompliance(miner));
    if (unsafeMiners.length === 0) {
      Alert.alert('All Filtered Miners Compliant', 'All miners in the current filter are compliant with PPE requirements.');
      return;
    }

    const parameterName = ppeParameterFilter === 'all' ? 'PPE requirements' :
      PPE_PARAMETERS.find(p => p.id === ppeParameterFilter)?.name || 'selected PPE item';

    Alert.alert(
      'Send Safety Alerts',
      `Send alerts to ${unsafeMiners.length} miner(s) missing ${parameterName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alerts',
          onPress: () => {
            // In a real app, this would send notifications to filtered unsafe miners
            Alert.alert(
              'Alerts Sent',
              `Safety alerts sent to ${unsafeMiners.length} miners regarding ${parameterName}.`
            );
          }
        }
      ]
    );
  };

  const resetFilters = () => {
    setComplianceFilter('all');
    setShiftFilter('all');
    setLocationFilter('all');
    setSearchQuery('');
    setPpeParameterFilter('all');
  };

  const toggleParameter = (paramId: string) => {
    setSelectedParameters(prev =>
      prev.includes(paramId)
        ? prev.filter(id => id !== paramId)
        : [...prev, paramId]
    );
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Refreshed', 'PPE scan data has been updated');
    }, 1000);
  };

  const renderPPEStatus = (miner: MinerData) => {
    const isCompliant = checkMinerCompliance(miner);

    return (
      <View style={[styles.statusContainer, isCompliant ? styles.safeStatus : styles.unsafeStatus]}>
        {isCompliant ? (
          <CheckCircle size={16} color="#FFFFFF" />
        ) : (
          <XCircle size={16} color="#FFFFFF" />
        )}
        <Text style={styles.statusText}>
          {isCompliant ? 'Safe to Proceed' : 'PPE Incomplete'}
        </Text>
      </View>
    );
  };

  const renderPPEItems = (miner: MinerData) => {
    return PPE_PARAMETERS.map(param => {
      const result = miner.ppeResults[param.id as keyof MinerPPEResults];
      const isPresent = result?.present === true;
      const isSelected = selectedParameters.includes(param.id);

      return (
        <View key={param.id} style={[styles.ppeItem, !isSelected && styles.ppeItemDisabled]}>
          <View style={styles.ppeItemHeader}>
            <Text style={[styles.ppeItemName, !isSelected && styles.ppeItemNameDisabled]}>
              {param.name}
            </Text>
            {isPresent ? (
              <CheckCircle size={16} color={isSelected ? COLORS.primary : COLORS.textMuted} />
            ) : (
              <XCircle size={16} color={COLORS.destructive} />
            )}
          </View>
          {result?.confidence && (
            <Text style={[styles.confidenceText, !isSelected && styles.confidenceTextDisabled]}>
              {Math.round(result.confidence * 100)}% confidence
            </Text>
          )}
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PPE Config Manager</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={notifyUnsafeMiners} style={styles.notifyButton}>
            <Bell size={20} color={COLORS.destructive} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <RefreshCw size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filters Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Filters & Search</Text>
            <TouchableOpacity
              style={styles.filterToggle}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} color={COLORS.primary} />
              <Text style={styles.filterToggleText}>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search miners by name..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {showFilters && (
            <View style={styles.filtersContainer}>
              {/* PPE Parameter Filter */}
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>PPE Parameter:</Text>
                <View style={styles.filterButtons}>
                  <TouchableOpacity
                    style={[
                      styles.filterOptionButton,
                      ppeParameterFilter === 'all' && styles.filterOptionButtonActive,
                    ]}
                    onPress={() => setPpeParameterFilter('all')}
                  >
                    <Text
                      style={[
                        styles.filterOptionButtonText,
                        ppeParameterFilter === 'all' && styles.filterOptionButtonTextActive,
                      ]}
                    >
                      All Parameters
                    </Text>
                  </TouchableOpacity>
                  {PPE_PARAMETERS.map((param) => (
                    <TouchableOpacity
                      key={param.id}
                      style={[
                        styles.filterOptionButton,
                        ppeParameterFilter === param.id && styles.filterOptionButtonActive,
                      ]}
                      onPress={() => setPpeParameterFilter(param.id)}
                    >
                      <Text
                        style={[
                          styles.filterOptionButtonText,
                          ppeParameterFilter === param.id && styles.filterOptionButtonTextActive,
                        ]}
                      >
                        Missing {param.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Compliance Filter - only show when 'all' parameters selected */}
              {ppeParameterFilter === 'all' && (
                <View style={styles.filterRow}>
                  <Text style={styles.filterLabel}>Compliance Status:</Text>
                  <View style={styles.filterButtons}>
                    {[
                      { label: 'All', value: 'all' },
                      { label: 'Safe', value: 'safe' },
                      { label: 'Unsafe', value: 'unsafe' },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.filterOptionButton,
                          complianceFilter === option.value && styles.filterOptionButtonActive,
                        ]}
                        onPress={() => setComplianceFilter(option.value as any)}
                      >
                        <Text
                          style={[
                            styles.filterOptionButtonText,
                            complianceFilter === option.value && styles.filterOptionButtonTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Shift Filter */}
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Shift:</Text>
                <View style={styles.filterButtons}>
                  {[
                    { label: 'All', value: 'all' },
                    { label: 'Morning', value: 'Morning' },
                    { label: 'Afternoon', value: 'Afternoon' },
                    { label: 'Night', value: 'Night' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOptionButton,
                        shiftFilter === option.value && styles.filterOptionButtonActive,
                      ]}
                      onPress={() => setShiftFilter(option.value as any)}
                    >
                      <Text
                        style={[
                          styles.filterOptionButtonText,
                          shiftFilter === option.value && styles.filterOptionButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Location Filter */}
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Location:</Text>
                <View style={styles.filterButtons}>
                  <TouchableOpacity
                    style={[
                      styles.filterOptionButton,
                      locationFilter === 'all' && styles.filterOptionButtonActive,
                    ]}
                    onPress={() => setLocationFilter('all')}
                  >
                    <Text
                      style={[
                        styles.filterOptionButtonText,
                        locationFilter === 'all' && styles.filterOptionButtonTextActive,
                      ]}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  {uniqueLocations.map((location) => (
                    <TouchableOpacity
                      key={location}
                      style={[
                        styles.filterOptionButton,
                        locationFilter === location && styles.filterOptionButtonActive,
                      ]}
                      onPress={() => setLocationFilter(location)}
                    >
                      <Text
                        style={[
                          styles.filterOptionButtonText,
                          locationFilter === location && styles.filterOptionButtonTextActive,
                        ]}
                      >
                        {location}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Reset Filters */}
              <TouchableOpacity style={styles.resetFiltersButton} onPress={resetFilters}>
                <Text style={styles.resetFiltersText}>Reset All Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Miners PPE Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Miner PPE Status</Text>
            <Text style={styles.resultsCount}>
              {filteredMiners.length} of {miners.length} miners
            </Text>
          </View>
          <Text style={styles.sectionSubtitle}>Real-time PPE compliance monitoring</Text>

          {filteredMiners.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Shield size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No miners found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your filters or search criteria
              </Text>
            </View>
          ) : (
            filteredMiners.map(miner => {
              const isCompliant = checkMinerCompliance(miner);
              const missingParameter = ppeParameterFilter !== 'all' ?
                PPE_PARAMETERS.find(p => p.id === ppeParameterFilter)?.name : null;

              return (
                <View key={miner.id} style={[
                  styles.minerListItem, 
                  isCompliant ? styles.safeCard : styles.unsafeCard
                ]}>
                  {/* Miner Info Section */}
                  <View style={styles.minerListInfo}>
                    <View style={styles.minerNameRow}>
                      <User size={20} color="#FFFFFF" />
                      <Text style={[styles.minerName, isCompliant ? styles.safeText : styles.unsafeText]}>{miner.name}</Text>
                    </View>
                    <Text style={[styles.minerDetails, isCompliant ? styles.safeText : styles.unsafeText]}>
                      {miner.shift} Shift • {miner.location}
                    </Text>
                    <Text style={[styles.scanTime, isCompliant ? styles.safeText : styles.unsafeText]}>Scanned at {formatTime(miner.timestamp)}</Text>
                    {missingParameter && (
                      <Text style={styles.missingParameterText}>
                        Missing: {missingParameter}
                      </Text>
                    )}
                  </View>

                  {/* Notify button for unsafe cards */}
                  {!isCompliant && (
                    <View style={styles.minerListActions}>
                      <TouchableOpacity
                        style={styles.notifyMinerButton}
                        onPress={() => {
                          setSelectedMinerForNotification(miner);
                          setShowNotificationModal(true);
                        }}
                      >
                        <Bell size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Notification Modal */}
      <Modal
        visible={showNotificationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Safety Notification</Text>
              <TouchableOpacity
                onPress={() => setShowNotificationModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Send notification to {selectedMinerForNotification?.name}
            </Text>

            <TextInput
              style={styles.notificationInput}
              placeholder="Enter notification message..."
              placeholderTextColor={COLORS.textMuted}
              value={notificationMessage}
              onChangeText={setNotificationMessage}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowNotificationModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton]}
                onPress={() => {
                  if (selectedMinerForNotification && notificationMessage.trim()) {
                    sendNotification(selectedMinerForNotification, notificationMessage);
                  }
                }}
              >
                <Text style={styles.sendButtonText}>Send Notification</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  notifyButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: COLORS.card,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: COLORS.card,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  parameterItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  parameterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  parameterName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  parameterDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  requiredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.destructive,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requiredText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  minerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  minerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  minerInfo: {
    flex: 1,
  },
  minerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  minerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  minerDetails: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  scanTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  safeStatus: {
    backgroundColor: COLORS.primary,
  },
  unsafeStatus: {
    backgroundColor: COLORS.destructive,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ppeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ppeItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ppeItemDisabled: {
    opacity: 0.5,
  },
  ppeItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ppeItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  ppeItemNameDisabled: {
    color: COLORS.textMuted,
  },
  confidenceText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  confidenceTextDisabled: {
    color: COLORS.textMuted,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterToggleText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filtersContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOptionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  filterOptionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterOptionButtonText: {
    fontSize: 14,
    color: COLORS.text,
  },
  filterOptionButtonTextActive: {
    color: '#FFFFFF',
  },
  resetFiltersButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  resetFiltersText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  resultsCount: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  minerActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
  },
  notificationInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: COLORS.primary,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  minerListItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 80,
  },
  minerListInfo: {
    flex: 1,
  },
  minerListActions: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  missingParameterText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 4,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  safeButton: {
    backgroundColor: '#10B981', // Green for safe
  },
  unsafeButton: {
    backgroundColor: COLORS.destructive, // Red for unsafe
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  notifyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  statusActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  safeCard: {
    backgroundColor: '#1A1D2E', // Dark background like unsafe cards
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  unsafeCard: {
    backgroundColor: '#1A1D2E', // Dark background like the image
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  safeText: {
    color: '#FFFFFF', // White text for both safe and unsafe
  },
  unsafeText: {
    color: '#FFFFFF', // White text for both safe and unsafe
  },
  notifyMinerButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#1A1D2E', // Dark background like the cards
    borderWidth: 1.5,
    borderColor: '#F59E0B', // Amber/orange border
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
