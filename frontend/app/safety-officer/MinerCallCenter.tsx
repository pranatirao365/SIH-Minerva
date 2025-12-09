import { ArrowLeft, Phone, Users, CheckCircle, AlertCircle } from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../config/firebase';
import { useRoleStore } from '../../hooks/useRoleStore';

interface Miner {
  id: string;
  name: string;
  phoneNumber: string;
  department?: string;
  shift?: string;
  empId?: string;
}

interface CallStatus {
  minerId: string;
  status: 'idle' | 'calling' | 'success' | 'failed';
  message?: string;
}

const TOLL_FREE_API_URL = process.env.EXPO_PUBLIC_IP_ADDRESS
  ? `http://${process.env.EXPO_PUBLIC_IP_ADDRESS}:5000/alert`
  : 'http://172.16.58.154:5000/alert';

export default function MinerCallCenter() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [miners, setMiners] = useState<Miner[]>([]);
  const [selectedMiners, setSelectedMiners] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calling, setCalling] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [callStatuses, setCallStatuses] = useState<Map<string, CallStatus>>(new Map());

  const fetchMiners = useCallback(async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'miner'));
      const querySnapshot = await getDocs(q);

      const minersList: Miner[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        minersList.push({
          id: doc.id,
          name: data.name || 'Unknown',
          phoneNumber: data.phoneNumber || '',
          department: data.department,
          shift: data.shift,
          empId: data.empId,
        });
      });

      // Sort by name
      minersList.sort((a, b) => a.name.localeCompare(b.name));
      setMiners(minersList);
    } catch (error) {
      console.error('Error fetching miners:', error);
      Alert.alert('Error', 'Failed to fetch miners list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMiners();
  }, [fetchMiners]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMiners();
  }, [fetchMiners]);

  const toggleMinerSelection = (minerId: string) => {
    const newSelection = new Set(selectedMiners);
    if (newSelection.has(minerId)) {
      newSelection.delete(minerId);
    } else {
      newSelection.add(minerId);
    }
    setSelectedMiners(newSelection);
  };

  const selectAllMiners = () => {
    const filteredIds = filteredMiners.map(m => m.id);
    setSelectedMiners(new Set(filteredIds));
  };

  const deselectAllMiners = () => {
    setSelectedMiners(new Set());
  };

  const makeCallToMiners = async () => {
    if (selectedMiners.size === 0) {
      Alert.alert('No Selection', 'Please select at least one miner to call');
      return;
    }

    Alert.alert(
      'Confirm Call',
      `Make automated safety call to ${selectedMiners.size} miner(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: async () => {
            setCalling(true);
            const newStatuses = new Map<string, CallStatus>();

            // Initialize all as calling
            selectedMiners.forEach(minerId => {
              newStatuses.set(minerId, { minerId, status: 'calling' });
            });
            setCallStatuses(newStatuses);

            try {
              // Get phone numbers of selected miners
              const selectedMinersList = miners.filter(m => selectedMiners.has(m.id));
              const phoneNumbers = selectedMinersList
                .map(m => m.phoneNumber)
                .filter(phone => phone && phone.startsWith('+'));

              if (phoneNumbers.length === 0) {
                Alert.alert('Error', 'No valid phone numbers found for selected miners');
                setCalling(false);
                return;
              }

              console.log('🔔 Making calls to:', phoneNumbers);
              console.log('🌐 API URL:', TOLL_FREE_API_URL);

              // Call the toll-free API with timeout
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

              try {
                const response = await fetch(TOLL_FREE_API_URL, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    phoneNumbers,
                    message: 'Safety briefing from safety officer',
                  }),
                  signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                  const result = await response.json();
                  console.log('✅ Calls initiated:', result);

                  // Update all to success
                  selectedMiners.forEach(minerId => {
                    newStatuses.set(minerId, {
                      minerId,
                      status: 'success',
                      message: 'Call initiated successfully',
                    });
                  });
                  setCallStatuses(new Map(newStatuses));

                  Alert.alert(
                    'Success',
                    `Automated calls successfully sent to ${phoneNumbers.length} miner(s)!`,
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          // Clear selection and statuses after a delay
                          setTimeout(() => {
                            setSelectedMiners(new Set());
                            setCallStatuses(new Map());
                          }, 3000);
                        },
                      },
                    ]
                  );
                } else {
                  clearTimeout(timeoutId);
                  throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                }
              } catch (fetchError: any) {
                clearTimeout(timeoutId);
                console.error('❌ Fetch error:', fetchError);
                
                let errorMessage = 'Connection failed';
                if (fetchError.name === 'AbortError') {
                  errorMessage = 'Request timeout - Server not responding';
                } else if (fetchError.message.includes('Network request failed')) {
                  errorMessage = 'Network error - Check if server is running';
                } else {
                  errorMessage = fetchError.message;
                }
                
                throw new Error(errorMessage);
              }
            } catch (error: any) {
              console.error('❌ Error making calls:', error);

              // Update all to failed
              selectedMiners.forEach(minerId => {
                newStatuses.set(minerId, {
                  minerId,
                  status: 'failed',
                  message: error.message || 'Call failed',
                });
              });
              setCallStatuses(new Map(newStatuses));

              Alert.alert(
                'Connection Error',
                `${error.message}\n\n` +
                `Troubleshooting:\n` +
                `1. Start toll-free server:\n` +
                `   cd "Toll free"\n` +
                `   node server.js\n\n` +
                `2. Check server is running on:\n` +
                `   ${TOLL_FREE_API_URL}\n\n` +
                `3. Verify IP address in .env matches your network`
              );
            } finally {
              setCalling(false);
            }
          },
        },
      ]
    );
  };

  const filteredMiners = miners.filter(
    (miner) =>
      miner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      miner.phoneNumber.includes(searchQuery) ||
      miner.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMinerItem = ({ item }: { item: Miner }) => {
    const isSelected = selectedMiners.has(item.id);
    const callStatus = callStatuses.get(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.minerCard,
          isSelected && styles.minerCardSelected,
          callStatus?.status === 'calling' && styles.minerCardCalling,
          callStatus?.status === 'success' && styles.minerCardSuccess,
          callStatus?.status === 'failed' && styles.minerCardFailed,
        ]}
        onPress={() => !calling && toggleMinerSelection(item.id)}
        disabled={calling}
      >
        <View style={styles.minerInfo}>
          <View style={styles.minerHeader}>
            <Text style={styles.minerName}>{item.name}</Text>
            {callStatus && (
              <View style={styles.statusBadge}>
                {callStatus.status === 'calling' && (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                )}
                {callStatus.status === 'success' && (
                  <CheckCircle size={16} color="#10B981" />
                )}
                {callStatus.status === 'failed' && (
                  <AlertCircle size={16} color="#EF4444" />
                )}
              </View>
            )}
          </View>
          <Text style={styles.minerPhone}>{item.phoneNumber}</Text>
          {item.department && (
            <Text style={styles.minerDepartment}>{item.department}</Text>
          )}
          {item.shift && (
            <Text style={styles.minerShift}>Shift: {item.shift}</Text>
          )}
        </View>
        <View style={styles.selectionIndicator}>
          {isSelected && <CheckCircle size={24} color={COLORS.primary} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Miner Call Center</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Phone size={24} color={COLORS.primary} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.infoTitle}>Toll-Free Automated Calls</Text>
          <Text style={styles.infoText}>
            Select miners to send automated safety briefing calls via toll-free system
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, or department..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Selection Controls */}
      <View style={styles.selectionControls}>
        <View style={styles.selectionInfo}>
          <Users size={20} color={COLORS.primary} />
          <Text style={styles.selectionText}>
            {selectedMiners.size} of {filteredMiners.length} selected
          </Text>
        </View>
        <View style={styles.selectionButtons}>
          <TouchableOpacity onPress={selectAllMiners} style={styles.selectButton}>
            <Text style={styles.selectButtonText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={deselectAllMiners} style={styles.selectButton}>
            <Text style={styles.selectButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Miners List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading miners...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMiners}
          renderItem={renderMinerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No miners found</Text>
            </View>
          }
        />
      )}

      {/* Call Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.callButton,
            (selectedMiners.size === 0 || calling) && styles.callButtonDisabled,
          ]}
          onPress={makeCallToMiners}
          disabled={selectedMiners.size === 0 || calling}
        >
          {calling ? (
            <>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.callButtonText}>Making Calls...</Text>
            </>
          ) : (
            <>
              <Phone size={24} color="#FFFFFF" />
              <Text style={styles.callButtonText}>
                Call {selectedMiners.size > 0 ? `${selectedMiners.size} Miner(s)` : 'Miners'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '15',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  selectionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '20',
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  minerCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  minerCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  minerCardCalling: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  minerCardSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  minerCardFailed: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  minerInfo: {
    flex: 1,
  },
  minerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  minerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusBadge: {
    marginLeft: 8,
  },
  minerPhone: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  minerDepartment: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  minerShift: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  selectionIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  callButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  callButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
