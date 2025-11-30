import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, ArrowLeft, Bell, BellOff, Users } from '../../components/Icons';
import { getWebSocketURL } from '../../config/smartHelmetConfig';
import { COLORS } from '../../constants/styles';

interface Miner {
  id: string;
  name: string;
  helmetId: string;
  status: 'online' | 'offline';
}

export default function AlertMiners() {
  const router = useRouter();
  const [wsConnected, setWsConnected] = useState(false);
  const [buzzerActive, setBuzzerActive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Mock miner data - in production, fetch from API
  const [miners] = useState<Miner[]>([
    { id: '1', name: 'Rajesh Kumar', helmetId: 'ESP32-001', status: 'online' },
    { id: '2', name: 'Amit Singh', helmetId: 'ESP32-002', status: 'online' },
    { id: '3', name: 'Priya Sharma', helmetId: 'ESP32-003', status: 'offline' },
  ]);

  // WebSocket Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket(getWebSocketURL());
        
        ws.onopen = () => {
          console.log('✓ Alert System WebSocket connected');
          setWsConnected(true);
        };

        ws.onerror = (error) => {
          console.warn('WebSocket connection error - ESP32 helmet may be offline');
          setWsConnected(false);
        };

        ws.onclose = () => {
          console.log('✗ WebSocket disconnected - will retry in 5 seconds');
          setWsConnected(false);
          
          // Retry connection after delay
          reconnectTimeout = setTimeout(() => {
            connectWebSocket();
          }, 5000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.warn('Failed to create WebSocket connection:', error);
        setWsConnected(false);
        
        // Retry after delay
        reconnectTimeout = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const activateAlert = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send('ALERT_MINER');
      setBuzzerActive(true);
      console.log('🚨 Miner alert activated');
      
      // Auto-reset after 5 seconds
      setTimeout(() => {
        setBuzzerActive(false);
        console.log('✓ Alert auto-reset after 5 seconds');
      }, 5000);
      
      Alert.alert(
        '🚨 Alert Activated',
        'All online miners have been alerted via helmet buzzer. Use this for blasting warnings, evacuation orders, or emergency situations.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Connection Error',
        'Cannot connect to helmet system. Check network connection.',
        [{ text: 'OK' }]
      );
    }
  };

  const deactivateAlert = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send('ALERT_MINER_STOP');
      setBuzzerActive(false);
      console.log('✓ Miner alert deactivated');
      
      Alert.alert(
        '✓ Alert Stopped',
        'Helmet buzzers have been turned off.',
        [{ text: 'OK' }]
      );
    }
  };

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
          <AlertTriangle size={24} color="#F59E0B" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text, flex: 1 }}>
            Alert Miners
          </Text>
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: wsConnected ? '#10B981' : '#EF4444',
          }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
              {wsConnected ? 'Connected' : 'Offline'}
            </Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1, padding: 16 }}>
          {/* Main Alert Section */}
          <View style={{
            backgroundColor: buzzerActive ? '#FEF3C7' : '#FEE2E2',
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            borderWidth: 2,
            borderColor: buzzerActive ? '#F59E0B' : '#EF4444',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <AlertTriangle size={32} color={buzzerActive ? '#F59E0B' : '#EF4444'} />
              <Text style={{
                fontSize: 22,
                fontWeight: 'bold',
                color: buzzerActive ? '#92400E' : '#991B1B',
                marginLeft: 12,
              }}>
                Emergency Alert System
              </Text>
            </View>
            
            <Text style={{
              fontSize: 14,
              color: buzzerActive ? '#92400E' : '#991B1B',
              marginBottom: 20,
              lineHeight: 20,
            }}>
              Use this to alert all miners about:
              {'\n'}• Blasting operations
              {'\n'}• Evacuation orders
              {'\n'}• Gas leaks or hazardous conditions
              {'\n'}• Emergency situations
            </Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={activateAlert}
                disabled={!wsConnected || buzzerActive}
                style={{
                  flex: 1,
                  backgroundColor: (!wsConnected || buzzerActive) ? '#9CA3AF' : '#F59E0B',
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: (!wsConnected || buzzerActive) ? 0.5 : 1,
                }}
              >
                <Bell size={28} color="#FFFFFF" />
                <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 8, fontSize: 16 }}>
                  ACTIVATE ALERT
                </Text>
                <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
                  (5 seconds)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={deactivateAlert}
                disabled={!wsConnected || !buzzerActive}
                style={{
                  flex: 1,
                  backgroundColor: (!wsConnected || !buzzerActive) ? '#9CA3AF' : '#10B981',
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: (!wsConnected || !buzzerActive) ? 0.5 : 1,
                }}
              >
                <BellOff size={28} color="#FFFFFF" />
                <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 8, fontSize: 16 }}>
                  STOP ALERT
                </Text>
                <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
                  (Stop early)
                </Text>
              </TouchableOpacity>
            </View>

            {buzzerActive && (
              <View style={{
                marginTop: 16,
                backgroundColor: '#FCD34D',
                padding: 12,
                borderRadius: 8,
              }}>
                <Text style={{ color: '#92400E', textAlign: 'center', fontWeight: 'bold' }}>
                  🔔 Alert is currently active (will auto-stop after 5s)
                </Text>
              </View>
            )}
          </View>

          {/* Miner Status List */}
          <View style={{
            backgroundColor: COLORS.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Users size={24} color={COLORS.primary} />
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: COLORS.text,
                marginLeft: 8,
              }}>
                Connected Miners
              </Text>
            </View>

            {miners.map((miner) => (
              <View
                key={miner.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.border,
                }}
              >
                <View style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: miner.status === 'online' ? '#10B981' : '#6B7280',
                  marginRight: 12,
                }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>
                    {miner.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    {miner.helmetId}
                  </Text>
                </View>
                <Text style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: miner.status === 'online' ? '#10B981' : '#6B7280',
                }}>
                  {miner.status.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>

          {/* Warning Notice */}
          <View style={{
            backgroundColor: '#FEF3C7',
            borderRadius: 8,
            padding: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#F59E0B',
          }}>
            <Text style={{ fontSize: 12, color: '#92400E', lineHeight: 18 }}>
              ⚠️ <Text style={{ fontWeight: 'bold' }}>Important:</Text> Use emergency alerts responsibly. 
              False alarms can cause panic and reduce trust in the system. Always verify the situation 
              before activating an alert.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
