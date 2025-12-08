import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from '../../components/Icons';
import { saveHazardScan } from '../../services/hazardScanService';
import { useRoleStore } from '../../hooks/useRoleStore';

// Backend API URL - automatically uses correct address for web/mobile
const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:8080'
  : `http://${process.env.EXPO_PUBLIC_IP_ADDRESS || '172.16.58.80'}:8080`; // Your PC's IP from .env

type HazardType = 'crack' | 'leakage' | 'fire' | 'obstruction';

interface BackendResponse {
  hazard_type: string;
  severity_label?: string;
  severity_percent?: number;
  processed_image?: string;
  extra_outputs?: any;
  message?: string;
}

interface ScanResult {
  hazardType: string;
  severity: string;
  severityPercent: number;
  processedImage: string;
  extraOutputs?: any;
  message?: string;
}

export default function HazardScan() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [selectedHazard, setSelectedHazard] = useState<HazardType>('crack');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonScales = useRef({
    crack: new Animated.Value(1),
    fire: new Animated.Value(1),
    leakage: new Animated.Value(1),
    obstruction: new Animated.Value(1),
  }).current;
  const scanPulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation for scan button when ready
  useEffect(() => {
    if (imageUri && !loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanPulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scanPulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanPulseAnim.setValue(1);
    }
  }, [imageUri, loading, scanPulseAnim]);

  // Animate results when they appear
  useEffect(() => {
    if (result) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [result, fadeAnim, scaleAnim]);

  // Bounce animation for hazard button selection
  const animateButtonPress = (type: HazardType) => {
    setSelectedHazard(type);
    setResult(null); // Clear results when hazard type changes
    Animated.sequence([
      Animated.spring(buttonScales[type], {
        toValue: 0.92,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.spring(buttonScales[type], {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleUploadImage = async (fromCamera: boolean) => {
    try {
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant camera/gallery permission');
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            quality: 1,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            quality: 1,
          });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Clear previous result immediately
        setResult(null);
        // Set image URI for instant display
        setImageUri(asset.uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const callModel = async (imageUri: string): Promise<BackendResponse> => {
    const formData = new FormData();
    
    // Append image file
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('file', {
      uri: imageUri,
      name: `hazard.${fileType}`,
      type: `image/${fileType}`,
    } as any);
    
    // Map frontend hazard types to backend types
    const hazardMapping: { [key: string]: string } = {
      'crack': 'crack',
      'fire': 'fire',
      'leakage': 'gas',
      'obstruction': 'obstruction'
    };
    
    const backendHazardType = hazardMapping[selectedHazard] || selectedHazard;
    formData.append('hazard_type', backendHazardType);

    try {
      // Add timeout for network request (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(
          `Request timed out after 30 seconds.\n\n` +
          `The backend may be processing slowly or unreachable.\n` +
          `Try a smaller image or check the connection.`
        );
      }
      if (error.message === 'Network request failed') {
        throw new Error(
          `Cannot connect to backend at ${API_URL}.\n\n` +
          `Ensure:\n` +
          `1. Backend is running (python hazard_detection_api.py)\n` +
          `2. Phone and PC are on same network (IP: ${process.env.EXPO_PUBLIC_IP_ADDRESS || '172.16.58.x'})\n` +
          `3. Check if PC firewall is blocking port 8001`
        );
      }
      throw error;
    }
  };

  const handleScanHazard = async () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Please upload or capture an image first');
      return;
    }

    setLoading(true);
    setResult(null); // Clear previous results

    try {
      const backendResponse = await callModel(imageUri);
      
      // Debug: Log the full response
      console.log('✓ Backend Response:', JSON.stringify(backendResponse, null, 2));

      // Check if model is under development
      if (backendResponse.message && !backendResponse.severity_label) {
        Alert.alert(
          'Model Under Development', 
          `${backendResponse.message}\n\nThis hazard detection model is still in development.`
        );
        return;
      }

      // Validate response has required fields
      if (!backendResponse.hazard_type) {
        console.error('✗ Missing hazard_type in response');
        Alert.alert('Invalid Response', 'Backend did not return hazard type. Please try again.');
        return;
      }

      if (!backendResponse.severity_label) {
        console.error('✗ Missing severity_label in response');
        Alert.alert(
          'No Detection', 
          `No ${selectedHazard} hazards were detected in this image.`
        );
        return;
      }

      // Set the result with the backend response
      const newResult: ScanResult = {
        hazardType: backendResponse.hazard_type,
        severity: backendResponse.severity_label,
        severityPercent: backendResponse.severity_percent || 0,
        processedImage: backendResponse.processed_image || '',
        extraOutputs: backendResponse.extra_outputs,
      };

      console.log('✓ Setting result:', JSON.stringify(newResult, null, 2));
      setResult(newResult);

      // Save to Firebase with actual ML predictions
      if (user?.id && imageUri) {
        try {
          // Convert image URI to blob
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const imageFile = new File([blob], `hazard_${Date.now()}.jpg`, { type: 'image/jpeg' });

          // Save with real ML prediction data
          const scanId = await saveHazardScan(
            imageFile,
            newResult.hazardType,
            newResult.severityPercent,
            `${newResult.severity} severity detected`,
            user.id
          );
          console.log('✓ Saved hazard scan to Firebase:', scanId);
        } catch (firebaseError) {
          console.error('Firebase save error:', firebaseError);
          // Don't block the UI if Firebase save fails
        }
      }

    } catch (error: any) {
      console.error('Scan error:', error);
      Alert.alert('Scan Failed', error.message || 'An error occurred during scanning');
      setResult(null); // Ensure result is cleared on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HazardScan AI</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        {/* Hazard Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detection Mode</Text>
          <View style={styles.hazardGrid}>
            {(['crack', 'fire', 'leakage', 'obstruction'] as HazardType[]).map((type) => {
              const labels = { 
                crack: 'Cracks', 
                fire: 'Fire', 
                leakage: 'Leakage', 
                obstruction: 'Obstruction' 
              };
              const isSelected = selectedHazard === type;
              return (
                <Animated.View
                  key={type}
                  style={[
                    styles.hazardWrapper,
                    { transform: [{ scale: buttonScales[type] }] }
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.hazardCard,
                      isSelected && styles.hazardCardSelected,
                    ]}
                    onPress={() => animateButtonPress(type)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.hazardText,
                      isSelected && styles.hazardTextSelected
                    ]}>
                      {labels[type]}
                    </Text>
                    {isSelected && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Image Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Image Source</Text>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={[styles.inputButton, imageUri && styles.inputButtonActive]}
              onPress={() => handleUploadImage(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.inputButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.inputButton, imageUri && styles.inputButtonActive]}
              onPress={() => handleUploadImage(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.inputButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Preview */}
        {imageUri && (
          <View style={styles.section}>
            <View style={styles.imagePreviewCard}>
              <Image 
                source={{ uri: imageUri }} 
                style={styles.imagePreview} 
                resizeMode="cover"
                progressiveRenderingEnabled
                fadeDuration={0}
              />
              <View style={styles.imageBadge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>READY</Text>
              </View>
            </View>
          </View>
        )}

        {/* Scan Button */}
        <Animated.View style={[styles.section, { transform: [{ scale: imageUri && !loading ? scanPulseAnim : 1 }] }]}>
          <TouchableOpacity
            style={[styles.scanButton, (!imageUri || loading) && styles.scanButtonDisabled]}
            onPress={handleScanHazard}
            disabled={!imageUri || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 10 }} />
                <Text style={styles.scanButtonText}>ANALYZING</Text>
              </>
            ) : (
              <Text style={styles.scanButtonText}>RUN DETECTION</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Results */}
        {result && result.hazardType && result.severity && (
          <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.sectionTitle}>Detection Results</Text>
            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Hazard Type</Text>
                <Text style={styles.resultValue}>{result.hazardType.toUpperCase()}</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Severity Level</Text>
                <Text style={[styles.resultValue, styles.severityText]}>{result.severity.toUpperCase()}</Text>
              </View>
            </View>
          </Animated.View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 107, 0, 0.15)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Section
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  
  // Hazard Selection
  hazardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  hazardWrapper: {
    flex: 1,
    minWidth: '47%',
  },
  hazardCard: {
    backgroundColor: '#0D0D0D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  hazardCardSelected: {
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    borderColor: '#FF6B00',
    borderWidth: 1.5,
  },
  hazardText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#808080',
    letterSpacing: 0.3,
  },
  hazardTextSelected: {
    color: '#FF6B00',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B00',
  },
  
  // Input Buttons
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputButton: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputButtonActive: {
    borderColor: '#FF6B00',
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
  },
  inputButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  
  // Image Preview
  imagePreviewCard: {
    backgroundColor: '#0D0D0D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 220,
  },
  imageBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.8,
  },
  
  // Scan Button
  scanButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  scanButtonDisabled: {
    backgroundColor: '#1A1A1A',
    shadowOpacity: 0,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  
  // Results
  resultCard: {
    backgroundColor: '#0D0D0D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 20,
  },
  resultRow: {
    paddingVertical: 14,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#999999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  resultDivider: {
    height: 1,
    backgroundColor: '#1A1A1A',
  },
  severityText: {
    color: '#FF6B00',
  },
  

});
