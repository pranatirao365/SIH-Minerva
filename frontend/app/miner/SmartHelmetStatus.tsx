import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, AlertTriangle, ArrowLeft, CheckCircle } from '../../components/Icons';
import { PulseWaveform } from '../../components/PulseWaveform';
import { ESP32_CONFIG, getWebSocketURL } from '../../config/smartHelmetConfig';
import { COLORS } from '../../constants/styles';

// ============================================
// CONFIGURATION - UPDATE IN config/smartHelmetConfig.ts
// ============================================
const ESP32_IP = ESP32_CONFIG.IP;
const WEBSOCKET_PORT = ESP32_CONFIG.WS_PORT;

interface EnvData {
  temp: number | null;
  hum: number | null;
}

interface GasData {
  detected: boolean;
}

interface HelmetDetection {
  worn: boolean;
}

interface PulseData {
  bpm: number;
  spo2: number;
  signal?: number;  // Optional, not used with MAX30100
}

interface HelmetData {
  env: EnvData;
  gas: GasData;
  helmet: HelmetDetection;
  pulse: PulseData;
  emergency: boolean;
}

export default function SmartHelmetStatus() {
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [connected, setConnected] = useState(false);
  const [helmetData, setHelmetData] = useState<HelmetData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Initialize WebSocket connection
  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(getWebSocketURL());
      
      ws.onopen = () => {
        setConnected(true);
        setReconnectAttempts(0);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as HelmetData;
          setHelmetData(data);
          setLastUpdate(new Date());
        } catch (error) {
          // Silent error handling
        }
      };

      ws.onerror = (error) => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
        
        // Attempt to reconnect silently
        if (reconnectAttempts < ESP32_CONFIG.MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket();
          }, ESP32_CONFIG.RECONNECT_DELAY);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      setConnected(false);
    }
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const getStatusColor = (type: 'safe' | 'warning' | 'danger') => {
    switch (type) {
      case 'safe': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'danger': return '#F44336';
    }
  };

  const getConnectionStatus = () => {
    if (connected) {
      return { text: 'Connected', color: '#4CAF50', icon: CheckCircle };
    } else {
      return { text: `Disconnected (Attempt ${reconnectAttempts})`, color: '#F44336', icon: AlertTriangle };
    }
  };

  const connectionStatus = getConnectionStatus();
  const StatusIcon = connectionStatus.icon;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Helmet Status</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Connection Status */}
      <View style={[styles.connectionBanner, { backgroundColor: connectionStatus.color + '20' }]}>
        <StatusIcon size={20} color={connectionStatus.color} />
        <Text style={[styles.connectionText, { color: connectionStatus.color }]}>
          {connectionStatus.text}
        </Text>
        {lastUpdate && (
          <Text style={styles.lastUpdateText}>
            Updated: {lastUpdate.toLocaleTimeString()}
          </Text>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!helmetData ? (
          <View style={styles.noDataContainer}>
            <Activity size={48} color={COLORS.primary} />
            <Text style={styles.noDataText}>
              {connected ? 'Waiting for helmet data...' : 'Cannot connect to Smart Helmet'}
            </Text>
            <Text style={styles.configText}>ESP32 IP: {ESP32_IP}:{WEBSOCKET_PORT}</Text>
            
            {!connected && (
              <View style={styles.troubleshootBox}>
                <Text style={styles.troubleshootTitle}>⚠️ Connection Failed</Text>
                <Text style={styles.troubleshootText}>
                  1. Check ESP32 is powered on{'\n'}
                  2. Verify ESP32 WiFi is connected{'\n'}
                  3. Ensure phone is on same WiFi network{'\n'}
                  4. Check IP address is correct: {ESP32_IP}{'\n'}
                  5. Restart ESP32 and check Serial Monitor for IP
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Emergency Status */}
            {helmetData.emergency && (
              <View style={[styles.card, styles.emergencyCard]}>
                <AlertTriangle size={32} color="#F44336" />
                <Text style={styles.emergencyTitle}>🚨 EMERGENCY ACTIVE</Text>
                <Text style={styles.emergencySubtext}>Emergency button has been pressed!</Text>
              </View>
            )}

            {/* Helmet Detection & Safety Sensors */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Helmet Detection</Text>
                {helmetData.helmet.worn ? (
                  <CheckCircle size={24} color="#4CAF50" />
                ) : (
                  <AlertTriangle size={24} color="#FF9800" />
                )}
              </View>
              <View style={[styles.statusBadge, { 
                backgroundColor: helmetData.helmet.worn ? '#4CAF50' : '#FF9800' 
              }]}>
                <Text style={styles.statusText}>
                  {helmetData.helmet.worn ? '✓ Helmet Worn' : '⚠️ Helmet Not Worn'}
                </Text>
              </View>
              {!helmetData.helmet.worn && (
                <View style={styles.warningBox}>
                  <AlertTriangle size={16} color="#FF9800" />
                  <Text style={styles.warningText}>Please wear your helmet for safety</Text>
                </View>
              )}
            </View>

            {/* Environment Data */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Environment (Helmet Area)</Text>
              
              <View style={styles.sensorRow}>
                <Text style={styles.sensorLabel}>Temperature</Text>
                <Text style={[styles.sensorValue, { 
                  color: helmetData.env.temp && helmetData.env.temp > ESP32_CONFIG.THRESHOLDS.HIGH_TEMP_C ? '#F44336' : '#fff' 
                }]}>
                  {helmetData.env.temp !== null ? `${helmetData.env.temp.toFixed(1)} °C` : 'N/A'}
                </Text>
              </View>

              <View style={styles.sensorRow}>
                <Text style={styles.sensorLabel}>Humidity</Text>
                <Text style={styles.sensorValue}>
                  {helmetData.env.hum !== null ? `${helmetData.env.hum.toFixed(1)} %` : 'N/A'}
                </Text>
              </View>

              {helmetData.env.temp && helmetData.env.temp > ESP32_CONFIG.THRESHOLDS.HIGH_TEMP_C && (
                <View style={styles.warningBox}>
                  <AlertTriangle size={16} color="#FF9800" />
                  <Text style={styles.warningText}>High temperature detected</Text>
                </View>
              )}
            </View>

            {/* Additional Sensor Placeholders */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Heart Rate Monitor</Text>
              
              {/* Real-time Pulse Waveform */}
              <View style={styles.waveformSection}>
                <PulseWaveform
                  bpm={helmetData.pulse.bpm}
                  signal={helmetData.pulse.signal || 0}
                  width={350}
                  height={150}
                  lineColor="#ff4757"
                  showBPM={true}
                />
              </View>

              <View style={styles.sensorRow}>
                <Text style={styles.sensorLabel}>Blood Oxygen (SpO2)</Text>
                <Text style={[styles.sensorValue, { 
                  color: helmetData.pulse.spo2 === 0 ? '#888' : 
                         helmetData.pulse.spo2 < 90 ? '#F44336' : 
                         helmetData.pulse.spo2 < 95 ? '#FF9800' : '#4CAF50'
                }]}>
                  {helmetData.pulse.spo2 > 0 ? `${helmetData.pulse.spo2}%` : 'No Signal'}
                </Text>
              </View>

              {helmetData.pulse.spo2 > 0 && helmetData.pulse.spo2 < 90 && (
                <View style={styles.warningBox}>
                  <AlertTriangle size={16} color="#F44336" />
                  <Text style={[styles.warningText, { color: '#F44336' }]}>
                    Critical: Low blood oxygen level - seek medical attention
                  </Text>
                </View>
              )}

              {helmetData.pulse.spo2 >= 90 && helmetData.pulse.spo2 < 95 && (
                <View style={styles.warningBox}>
                  <AlertTriangle size={16} color="#FF9800" />
                  <Text style={styles.warningText}>
                    Borderline blood oxygen level - monitor closely
                  </Text>
                </View>
              )}

              <View style={styles.sensorRow}>
                <Text style={styles.sensorLabel}>Heart Rate Status</Text>
                <Text style={[styles.sensorValue, { 
                  color: helmetData.pulse.bpm === 0 ? '#888' : 
                         (helmetData.pulse.bpm < 60 || helmetData.pulse.bpm > 100) ? '#F44336' : '#4CAF50' 
                }]}>
                  {helmetData.pulse.bpm > 0 ? `${helmetData.pulse.bpm} BPM` : 'No Signal'}
                </Text>
              </View>

              {helmetData.pulse.bpm > 0 && (helmetData.pulse.bpm < 60 || helmetData.pulse.bpm > 100) && (
                <View style={styles.warningBox}>
                  <AlertTriangle size={16} color="#FF9800" />
                  <Text style={styles.warningText}>
                    {helmetData.pulse.bpm < 60 ? 'Low heart rate detected' : 'High heart rate detected'}
                  </Text>
                </View>
              )}
            </View>

            {/* Other Sensors */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Additional Sensors</Text>

              <View style={styles.sensorRow}>
                <Text style={styles.sensorLabel}>Blood Oxygen (SpO2)</Text>
                <Text style={styles.placeholderText}>Not Connected</Text>
              </View>

              <View style={styles.sensorRow}>
                <Text style={styles.sensorLabel}>GPS Location</Text>
                <Text style={styles.placeholderText}>Not Connected</Text>
              </View>

              <View style={styles.sensorRow}>
                <Text style={styles.sensorLabel}>Light Sensor</Text>
                <Text style={styles.placeholderText}>Not Connected</Text>
              </View>
            </View>

            {/* System Info */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>System Information</Text>
              
              <View style={styles.sensorRow}>
                <Text style={styles.sensorLabel}>ESP32 IP</Text>
                <Text style={styles.sensorValue}>{ESP32_IP}</Text>
              </View>

              <View style={styles.sensorRow}>
                <Text style={styles.sensorLabel}>WebSocket Port</Text>
                <Text style={styles.sensorValue}>{WEBSOCKET_PORT}</Text>
              </View>

              <View style={styles.sensorRow}>
                <Text style={styles.sensorLabel}>Update Interval</Text>
                <Text style={styles.sensorValue}>{ESP32_CONFIG.UPDATE_INTERVAL}ms</Text>
              </View>

              <View style={styles.sensorRow}>
                <Text style={styles.sensorLabel}>Connection Status</Text>
                <Text style={[styles.sensorValue, { color: connected ? '#4CAF50' : '#F44336' }]}>
                  {connected ? 'Active' : 'Disconnected'}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 34,
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  configText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  emergencyCard: {
    backgroundColor: '#F44336',
    alignItems: 'center',
    padding: 20,
  },
  emergencyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  emergencySubtext: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  statusBadge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  sensorGroup: {
    marginBottom: 16,
  },
  sensorLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  tripleValue: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
  },
  axisValue: {
    alignItems: 'center',
  },
  axisLabel: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  axisNumber: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'monospace',
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sensorValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800' + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
  waveformSection: {
    alignItems: 'center',
    marginVertical: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
  },
  troubleshootBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  troubleshootTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 12,
  },
  troubleshootText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
  },
});
