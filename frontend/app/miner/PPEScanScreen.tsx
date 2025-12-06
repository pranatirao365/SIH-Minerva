import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
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
import { getPPEApiUrl } from '../../config/apiConfig';
import { db } from '../../config/firebase';
import { useRoleStore } from '../../hooks/useRoleStore';

const API_BASE_URL = getPPEApiUrl();
const API_URL = `${API_BASE_URL}/ppe-scan`;

// Backend response format (snake_case keys from API) - Department-specific
interface PPEResult {
  required: boolean;
  present: boolean;
}

interface BackendResponse {
  department: string;
  ppe_set: string;
  ppe_items: {
    [key: string]: PPEResult;
  };
  compliance: {
    is_compliant: boolean;
    percentage: number;
    items_present: number;
    items_required: number;
  };
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
  const { user } = useRoleStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ppeElements, setPpeElements] = useState<PPEElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [department, setDepartment] = useState<string>('Loading...');

  // Process backend response - ONLY department-specific PPE items
  // Binary scoring: present = 100 points, missing = 0 points
  const processDetections = (backendResponse: BackendResponse): PPEElement[] => {
    const results: PPEElement[] = [];
    const ppeItems = backendResponse.ppe_items;

    // Only process items that are required for this department
    Object.keys(ppeItems).forEach(itemKey => {
      const item = ppeItems[itemKey];
      
      // Find matching config
      const config = PPE_CONFIG.find(c => {
        const mappedKey = c.name.toLowerCase().replace(' ', '_');
        return itemKey === mappedKey || 
               (itemKey === 'helmet' && c.name === 'Helmet') ||
               (itemKey === 'vest' && c.name === 'Vest') ||
               (itemKey === 'gloves' && c.name === 'Gloves') ||
               (itemKey === 'eye_protection' && c.name === 'Eye Protection') ||
               (itemKey === 'safety_boots' && c.name === 'Safety Boots') ||
               (itemKey === 'protective_suit' && c.name === 'Protective Suit');
      });

      if (config) {
        results.push({
          name: config.name,
          icon: config.icon,
          confidence: item.present ? 100 : 0,
          isPresent: item.present
        });
      }
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

  // Fetch user's department on mount
  React.useEffect(() => {
    const fetchDepartment = async () => {
      if (user?.id) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.id));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userDept = userData.department || 'mining_operations';
            // Format department name for display
            const formatted = userDept
              .split('_')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            setDepartment(formatted);
          } else {
            setDepartment('Unknown');
          }
        } catch (error) {
          console.error('Error fetching department:', error);
          setDepartment('Error');
        }
      }
    };
    fetchDepartment();
  }, [user]);

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

      // Get user's department from Firebase
      let department = 'mining_operations'; // Default fallback
      if (user?.id) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.id));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            department = userData.department || 'mining_operations';
            console.log('✅ User department:', department);
          }
        } catch (error) {
          console.warn('⚠️ Could not fetch user department, using default:', error);
        }
      }

      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
      formData.append('department', department);

      console.log('📤 Sending image to:', API_URL);
      console.log('📊 Department:', department);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(API_URL, {
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
          console.error('❌ Backend error:', errorText);
          throw new Error(`Backend error: ${response.status}`);
        }

        const data: BackendResponse = await response.json();
        
        console.log('📥 Backend Response:', JSON.stringify(data, null, 2));
        console.log('📊 Department:', data.department);
        console.log('📋 PPE Set:', data.ppe_set);
        console.log('✅ Compliance:', data.compliance.percentage + '%');
        console.log('🔍 Required Items:', Object.keys(data.ppe_items).join(', '));
        
        // Process only department-specific PPE items
        const processedElements = processDetections(data);
        setPpeElements(processedElements);
        
        console.log('✅ Processed PPE Elements:', processedElements);
        
        const detectedCount = processedElements.filter(e => e.isPresent).length;
        const totalRequired = processedElements.length;
        console.log(`📊 Detection Summary: ${detectedCount}/${totalRequired} department-specific PPE items detected`);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Handle abort/timeout specifically
        if (fetchError.name === 'AbortError') {
          Alert.alert('Timeout', 'Request timed out. Please check if the backend server is running and try again.');
          console.error('❌ Request timeout after 30 seconds');
        } else {
          throw fetchError;
        }
      }
    } catch (error: any) {
      let errorMessage = 'Failed to scan image. Please try again.';
      
      if (error.message?.includes('Network') || error.name === 'TypeError') {
        errorMessage = `Cannot reach backend server. Please check:\n• Backend is running on ${API_BASE_URL}\n• Device is on same network\n• No firewall blocking connection`;
      } else if (error.message?.includes('Backend error')) {
        errorMessage = `Backend error: ${error.message}`;
      } else if (error.message?.includes('Invalid response')) {
        errorMessage = 'Backend returned invalid data. Please check the API.';
      }
      
      Alert.alert('Error', errorMessage);
      console.error('❌ Scan error:', error);
      console.error('Error details:', error.message || error);
      console.error('API URL:', API_URL);
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
          <Text style={styles.departmentBadge}>🏭 {department}</Text>
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
  departmentBadge: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B00',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
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
