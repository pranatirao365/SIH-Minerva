import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from '../../components/Icons';
import PPEDetectionItem from '../../components/PPEDetectionItem';
import SafetyScoreCard from '../../components/SafetyScoreCard';

const API_URL = 'http://172.20.10.2:8000/ppe-scan';

// Backend response format (snake_case keys from API) - Binary presence only
interface PPEResult {
  present: boolean;
}

interface BackendResponse {
  helmet: PPEResult;
  gloves: PPEResult;
  vest: PPEResult;
  eye_protection: PPEResult;
  safety_boots: PPEResult;
  protective_suit: PPEResult;
}

// Our processed PPE element
interface PPEElement {
  name: string;
  icon: string;
  confidence: number;
  isPresent: boolean;
}

// 6 unique PPE elements - Professional minimal icons
const PPE_CONFIG = [
  { name: 'Helmet', icon: '⬢', keywords: ['helmet', 'hardhat', 'hard hat'] },
  { name: 'Vest', icon: '⬣', keywords: ['vest', 'jacket', 'safety vest'] },
  { name: 'Gloves', icon: '✋', keywords: ['gloves', 'glove'] },
  { name: 'Eye Protection', icon: '◉', keywords: ['goggles', 'glasses', 'glass', 'eyewear'] },
  { name: 'Safety Boots', icon: '▣', keywords: ['boots', 'shoes', 'footwear', 'boot', 'shoe'] },
  { name: 'Protective Suit', icon: '◫', keywords: ['suit', 'coverall', 'overall'] },
];

export default function PPEScanScreen() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ppeElements, setPpeElements] = useState<PPEElement[]>([]);
  const [loading, setLoading] = useState(false);

  // Process backend response into 6 unique PPE elements with BINARY SCORING
  // Binary scoring: present = 100 points, missing = 0 points
  const processDetections = (backendResponse: BackendResponse): PPEElement[] => {
    const results: PPEElement[] = [];

    PPE_CONFIG.forEach(config => {
      let isPresent = false;
      let confidence = 0;

      // Map frontend display names to backend snake_case keys
      // PRESERVE EXISTING PRESENT/MISSING DETECTION LOGIC
      switch (config.name) {
        case 'Helmet':
          isPresent = backendResponse.helmet?.present || false;
          confidence = isPresent ? 100 : 0; // Binary: 100 if present, 0 if missing
          break;
        case 'Vest':
          isPresent = backendResponse.vest?.present || false;
          confidence = isPresent ? 100 : 0;
          break;
        case 'Gloves':
          isPresent = backendResponse.gloves?.present || false;
          confidence = isPresent ? 100 : 0;
          break;
        case 'Eye Protection':
          isPresent = backendResponse.eye_protection?.present || false;
          confidence = isPresent ? 100 : 0;
          break;
        case 'Safety Boots':
          isPresent = backendResponse.safety_boots?.present || false;
          confidence = isPresent ? 100 : 0;
          break;
        case 'Protective Suit':
          isPresent = backendResponse.protective_suit?.present || false;
          confidence = isPresent ? 100 : 0;
          break;
      }

      results.push({
        name: config.name,
        icon: config.icon,
        confidence: confidence, // Now 100 or 0 (binary)
        isPresent: isPresent
      });
    });

    return results;
  };

  // Calculate overall safety score using BINARY SCORING
  // Formula: (number_of_present_items / 6) * 100
  // Each present item = 100 points, missing = 0 points
  const calculateSafetyScore = (elements: PPEElement[]): number => {
    const presentCount = elements.filter(e => e.isPresent).length;
    return (presentCount / elements.length) * 100;
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setPpeElements([]);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setPpeElements([]);
    }
  };

  const scanImage = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first');
      return;
    }

    setLoading(true);

    try {
      // First, check if backend is reachable
      console.log('🔍 Checking backend connection...');
      try {
        const healthCheck = await fetch(API_URL.replace('/ppe-scan', '/'), { 
          method: 'GET',
          signal: AbortSignal.timeout(3000) 
        });
        if (healthCheck.ok) {
          console.log('✅ Backend is online');
        }
      } catch {
        console.warn('⚠️ Backend health check failed, proceeding anyway...');
      }

      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);

      console.log('📤 Sending image to:', API_URL);

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to scan image');
      }

      const rawData: any = await response.json();
      
      console.log('📥 RAW Backend Response:', JSON.stringify(rawData, null, 2));
      console.log('📋 Response Keys:', Object.keys(rawData));
      
      // Normalize response - handle both old and new formats, extract presence only
      const data: BackendResponse = {
        helmet: rawData.helmet || rawData.Helmet || { present: false },
        gloves: rawData.gloves || rawData.Gloves || { present: false },
        vest: rawData.vest || rawData.Vest || { present: false },
        eye_protection: rawData.eye_protection || { present: false },
        safety_boots: rawData.safety_boots || rawData.Shoes || { present: false },
        protective_suit: rawData.protective_suit || { present: false }
      };
      
      // Ensure presence boolean is extracted correctly
      data.helmet = { present: data.helmet.present === true };
      data.gloves = { present: data.gloves.present === true };
      data.vest = { present: data.vest.present === true };
      data.eye_protection = { present: data.eye_protection.present === true };
      data.safety_boots = { present: data.safety_boots.present === true };
      data.protective_suit = { present: data.protective_suit.present === true };
      
      console.log('📋 Normalized Structure (Binary Presence - All 6 PPE Categories):');
      console.log('  - helmet:', data.helmet.present ? '✓ PRESENT' : '✗ MISSING');
      console.log('  - gloves:', data.gloves.present ? '✓ PRESENT' : '✗ MISSING');
      console.log('  - vest:', data.vest.present ? '✓ PRESENT' : '✗ MISSING');
      console.log('  - eye_protection:', data.eye_protection.present ? '✓ PRESENT' : '✗ MISSING');
      console.log('  - safety_boots:', data.safety_boots.present ? '✓ PRESENT' : '✗ MISSING');
      console.log('  - protective_suit:', data.protective_suit.present ? '✓ PRESENT' : '✗ MISSING')
      
      // Process the backend response into 6 PPE elements
      const processedElements = processDetections(data);
      setPpeElements(processedElements);
      
      console.log('✅ Processed PPE Elements:', processedElements);
      
      const detectedCount = processedElements.filter(e => e.isPresent).length;
      console.log(`📊 Detection Summary: ${detectedCount}/6 PPE items detected`);
    } catch (error: any) {
      let errorMessage = 'Failed to scan image. Please try again.';
      
      if (error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and backend server.';
      } else if (error.message?.includes('Invalid response')) {
        errorMessage = 'Backend returned invalid data. Please check the API.';
      }
      
      Alert.alert('Error', errorMessage);
      console.error('❌ Scan error:', error);
      console.error('Error details:', error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const safetyScore = ppeElements.length > 0 ? calculateSafetyScore(ppeElements) : 0;
  const presentCount = ppeElements.filter(e => e.isPresent).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color="#E5E5E5" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>PPE Detection</Text>
          <Text style={styles.headerSubtitle}>Safety Compliance Scanner</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionLabel}>Image Source</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <View style={styles.buttonIconContainer}>
                <Text style={styles.buttonIcon}>□</Text>
              </View>
              <Text style={styles.buttonText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={takePhoto}
              activeOpacity={0.8}
            >
              <View style={styles.buttonIconContainer}>
                <Text style={styles.buttonIcon}>○</Text>
              </View>
              <Text style={styles.buttonText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Preview Section */}
        {selectedImage && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionLabel}>Selected Image</Text>
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.image} />
            </View>
            <TouchableOpacity
              style={[styles.scanButton, loading && styles.scanButtonDisabled]}
              onPress={scanImage}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.scanButtonContent}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.scanButtonText}>Processing Image</Text>
                </View>
              ) : (
                <View style={styles.scanButtonContent}>
                  <Text style={styles.scanButtonText}>Start Analysis</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Results Section */}
        {ppeElements.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Analysis Results</Text>
              <Text style={styles.resultsSubtitle}>Safety compliance assessment</Text>
            </View>
            
            {/* Safety Score Card */}
            <SafetyScoreCard 
              safetyScore={safetyScore}
              totalItems={ppeElements.length}
              presentItems={presentCount}
            />

            {/* Individual PPE Items */}
            <View style={styles.detectionsList}>
              <Text style={styles.listHeader}>Equipment Detected</Text>
              {ppeElements.map((element, index) => (
                <PPEDetectionItem
                  key={index}
                  name={element.name}
                  icon={element.icon}
                  confidence={element.confidence}
                  isPresent={element.isPresent}
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!selectedImage && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Text style={styles.emptyStateIcon}>◈</Text>
            </View>
            <Text style={styles.emptyStateTitle}>Ready to Scan</Text>
            <Text style={styles.emptyStateText}>
              Select an image source above to begin PPE safety analysis
            </Text>
            <View style={styles.emptyStateDivider} />
            <Text style={styles.emptyStateHint}>Powered by AI Detection</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  placeholder: {
    width: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  actionSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 14,
  },
  button: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  primaryButton: {
    backgroundColor: '#1E1E1E',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  secondaryButton: {
    backgroundColor: '#181818',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  buttonIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  buttonIcon: {
    fontSize: 22,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  previewSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  imageContainer: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  image: {
    width: '100%',
    height: 280,
    backgroundColor: '#000000',
  },
  scanButton: {
    backgroundColor: '#28C76F',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#28C76F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  scanButtonDisabled: {
    opacity: 0.5,
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  resultsSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
  },
  resultsHeader: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  resultsSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.3,
  },
  detectionsList: {
    marginTop: 20,
  },
  listHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingVertical: 80,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  emptyStateIcon: {
    fontSize: 36,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  emptyStateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  emptyStateDivider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 24,
  },
  emptyStateHint: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
