import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, MapPin, Phone, User } from '../../components/Icons';
import { COLORS } from '../../constants/styles';

interface SOSAlert {
  id: string;
  minerName: string;
  minerId: string;
  helmetId: string;
  timestamp: Date;
  location: string;
  status: 'active' | 'responded' | 'resolved';
  heartRate?: number;
  spO2?: number;
  temperature?: number;
}

export default function SOSNotifications() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  
  // Mock SOS alerts - in production, fetch from backend API
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([
    {
      id: '1',
      minerName: 'Rajesh Kumar',
      minerId: 'M-001',
      helmetId: 'ESP32-001',
      timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      location: 'Tunnel A - Section 12',
      status: 'active',
      heartRate: 110,
      spO2: 92,
      temperature: 32.5,
    },
    {
      id: '2',
      minerName: 'Amit Singh',
      minerId: 'M-003',
      helmetId: 'ESP32-003',
      timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
      location: 'Shaft B - Level 3',
      status: 'responded',
      heartRate: 95,
      spO2: 94,
      temperature: 30.2,
    },
    {
      id: '3',
      minerName: 'Priya Sharma',
      minerId: 'M-005',
      helmetId: 'ESP32-005',
      timestamp: new Date(Date.now() - 45 * 60000), // 45 minutes ago
      location: 'Tunnel C - Section 8',
      status: 'resolved',
      heartRate: 78,
      spO2: 96,
      temperature: 28.8,
    },
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      console.log('Refreshed SOS alerts');
    }, 1500);
  };

  const handleRespond = (alertId: string) => {
    setSosAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, status: 'responded' as const } : alert
      )
    );
  };

  const handleResolve = (alertId: string) => {
    setSosAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, status: 'resolved' as const } : alert
      )
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
  const respondedAlerts = sosAlerts.filter(a => a.status === 'responded');
  const resolvedAlerts = sosAlerts.filter(a => a.status === 'resolved');

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
                        ID: {alert.minerId} • {alert.helmetId}
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

          {/* Responded Alerts */}
          {respondedAlerts.length > 0 && (
            <View style={{ padding: 16, paddingTop: 0 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: COLORS.text,
                marginBottom: 12,
              }}>
                ⏳ In Progress
              </Text>
              {respondedAlerts.map(alert => (
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
