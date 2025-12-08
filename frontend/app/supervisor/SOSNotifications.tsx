import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, MapPin, Phone, User, Shield } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '@/hooks/useRoleStore';
import { 
  getActiveSOSAlerts, 
  acknowledgeSOSAlert, 
  resolveSOSAlert,
  SOSAlert as FirebaseSOSAlert
} from '../../services/sosService';

interface SOSAlert {
  id: string;
  minerName: string;
  minerId: string;
  timestamp: Date;
  location: string;
  status: 'active' | 'acknowledged' | 'resolved';
  heartRate?: number;
  spO2?: number;
  temperature?: number;
  minerPhone?: string;
}

export default function SOSNotifications() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [refreshing, setRefreshing] = useState(false);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      const firebaseAlerts = await getActiveSOSAlerts();
      
      // Convert Firebase alerts to component format
      const formattedAlerts: SOSAlert[] = firebaseAlerts.map((alert: FirebaseSOSAlert) => ({
        id: alert.id || '',
        minerName: alert.minerName,
        minerId: alert.minerId,
        timestamp: alert.timestamp.toDate(),
        location: alert.location?.description || 'Unknown location',
        status: alert.status as 'active' | 'acknowledged' | 'resolved',
        heartRate: alert.helmetData?.heartRate,
        spO2: alert.helmetData?.spo2,
        temperature: alert.helmetData?.temperature,
        minerPhone: alert.minerPhone,
      }));

      setSosAlerts(formattedAlerts);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading SOS alerts:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const handleRespond = async (alertId: string) => {
    try {
      await acknowledgeSOSAlert(alertId, user.id || 'unknown');
      Alert.alert('Success', 'SOS alert acknowledged');
      loadAlerts();
    } catch (error) {
      Alert.alert('Error', 'Failed to acknowledge alert');
    }
  };

  const handleResolve = async (alertId: string) => {
    Alert.alert(
      'Resolve SOS Alert',
      'Mark this emergency as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async () => {
            try {
              await resolveSOSAlert(alertId, user.id || 'unknown', 'Emergency resolved');
              Alert.alert('Success', 'SOS alert marked as resolved');
              loadAlerts();
            } catch (error) {
              Alert.alert('Error', 'Failed to resolve alert');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#EF4444';
      case 'responded':
        return '#F59E0B';
      case 'resolved':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'ACTIVE';
      case 'responded':
        return 'IN PROGRESS';
      case 'resolved':
        return 'RESOLVED';
      default:
        return 'UNKNOWN';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000); // minutes

    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleString();
  };

  const activeAlerts = sosAlerts.filter(a => a.status === 'active');
  const acknowledgedAlerts = sosAlerts.filter(a => a.status === 'acknowledged');
  const resolvedAlerts = sosAlerts.filter(a => a.status === 'resolved');

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: COLORS.textMuted }}>Loading alerts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          backgroundColor: COLORS.card,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <AlertTriangle size={24} color="#EF4444" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text }}>
              SOS Notifications
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
              {activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <View style={{ padding: 16 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: COLORS.text,
                marginBottom: 12,
              }}>
                🚨 Active Emergencies
              </Text>
              {activeAlerts.map(alert => (
                <View
                  key={alert.id}
                  style={{
                    backgroundColor: COLORS.card,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: '#EF4444',
                  }}
                >
                  {/* Header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#EF444420',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <User size={20} color="#EF4444" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.text }}>
                        {alert.minerName}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                        ID: {alert.minerId}
                      </Text>
                    </View>
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: '#EF4444',
                    }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                        {getStatusText(alert.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Location & Time */}
                  <View style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <MapPin size={14} color={COLORS.textMuted} />
                      <Text style={{ fontSize: 13, color: COLORS.text, marginLeft: 6 }}>
                        {alert.location}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Clock size={14} color={COLORS.textMuted} />
                      <Text style={{ fontSize: 13, color: COLORS.textMuted, marginLeft: 6 }}>
                        {formatTimestamp(alert.timestamp)}
                      </Text>
                    </View>
                  </View>

                  {/* Vitals */}
                  <View style={{
                    flexDirection: 'row',
                    backgroundColor: COLORS.background,
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 12,
                    gap: 12,
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2 }}>
                        Heart Rate
                      </Text>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: alert.heartRate && alert.heartRate > 100 ? '#EF4444' : COLORS.text,
                      }}>
                        {alert.heartRate || '--'} BPM
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2 }}>
                        SpO2
                      </Text>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: alert.spO2 && alert.spO2 < 95 ? '#F59E0B' : COLORS.text,
                      }}>
                        {alert.spO2 || '--'}%
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2 }}>
                        Temp
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.text }}>
                        {alert.temperature || '--'}°C
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleRespond(alert.id)}
                      style={{
                        flex: 1,
                        backgroundColor: '#F59E0B',
                        paddingVertical: 10,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
                        Respond
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor: COLORS.background,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Phone size={18} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Acknowledged Alerts */}
          {acknowledgedAlerts.length > 0 && (
            <View style={{ padding: 16, paddingTop: 0 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: COLORS.text,
                marginBottom: 12,
              }}>
                ⏳ Acknowledged
              </Text>
              {acknowledgedAlerts.map(alert => (
                <View
                  key={alert.id}
                  style={{
                    backgroundColor: COLORS.card,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: '#F59E0B',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: 'bold', color: COLORS.text }}>
                        {alert.minerName}
                      </Text>
                      <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                        {alert.location} • {formatTimestamp(alert.timestamp)}
                      </Text>
                    </View>
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: '#F59E0B',
                    }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                        IN PROGRESS
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleResolve(alert.id)}
                    style={{
                      backgroundColor: '#10B981',
                      paddingVertical: 8,
                      borderRadius: 8,
                      alignItems: 'center',
                      marginTop: 8,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                      Mark as Resolved
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Resolved Alerts */}
          {resolvedAlerts.length > 0 && (
            <View style={{ padding: 16, paddingTop: 0 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: COLORS.text,
                marginBottom: 12,
              }}>
                ✓ Resolved
              </Text>
              {resolvedAlerts.map(alert => (
                <View
                  key={alert.id}
                  style={{
                    backgroundColor: COLORS.card,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: '#10B981',
                    opacity: 0.7,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CheckCircle size={20} color="#10B981" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>
                        {alert.minerName}
                      </Text>
                      <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                        {alert.location} • {formatTimestamp(alert.timestamp)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {sosAlerts.length === 0 && (
            <View style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
            }}>
              <CheckCircle size={64} color={COLORS.textMuted} />
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: COLORS.text,
                marginTop: 16,
              }}>
                No SOS Alerts
              </Text>
              <Text style={{
                fontSize: 14,
                color: COLORS.textMuted,
                textAlign: 'center',
                marginTop: 8,
              }}>
                All miners are safe. SOS alerts will appear here when miners press the emergency button.
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
