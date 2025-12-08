/**
 * EXAMPLE USAGE: Integrating Firebase Saving into HazardScan Component
 * 
 * This shows how to plug the Firebase saving code after your hazard detection completes
 */

import React, { useState } from 'react';
import { View, Button, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { saveHazardScan } from '../services/hazardScanService';
import { useRoleStore } from '../hooks/useRoleStore';

export default function HazardScanExample() {
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const { user } = useRoleStore();

  // Your existing hazard detection function
  const detectHazard = async (imageFile: any) => {
    // Your existing ML detection code here
    // This returns hazard detection results
    
    // Example mock result (replace with your actual detection):
    return {
      hazardType: 'crack',
      confidence: 85.5,
      severity: 'medium',
      description: 'Wall crack detected with high confidence',
      processedImage: imageFile, // or base64 string
    };
  };

  // Main scan function - integrates detection + Firebase saving
  const handleHazardScan = async () => {
    if (!imageUri || !user?.id) {
      Alert.alert('Error', 'Please select an image and ensure you are logged in');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Convert image URI to Blob/File
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const imageFile = new File([blob], 'hazard_scan.jpg', { type: 'image/jpeg' });

      // Step 2: Run your existing hazard detection
      console.log('🔍 Running hazard detection...');
      const detectionResult = await detectHazard(imageFile);
      console.log('✅ Detection complete:', detectionResult);

      // Step 3: Save results to Firebase (NEW CODE - just plug this in!)
      console.log('💾 Saving to Firebase...');
      const saveResult = await saveHazardScan(
        imageFile,
        detectionResult.hazardType,
        detectionResult.confidence,
        detectionResult.description,
        user.id,
        {
          severity: detectionResult.severity,
          metadata: {
            deviceInfo: 'React Native App',
            networkType: 'WiFi',
            processingTime: 2.5, // seconds
          },
        }
      );

      if (saveResult.success) {
        console.log('✅ Saved to Firebase successfully!');
        console.log('📊 Scan ID:', saveResult.scanId);
        console.log('🖼️ Image URL:', saveResult.imageUrl);

        Alert.alert(
          'Success',
          `Hazard scan saved!\nType: ${detectionResult.hazardType}\nConfidence: ${detectionResult.confidence}%\nScan ID: ${saveResult.scanId}`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(saveResult.error || 'Failed to save');
      }
    } catch (error: any) {
      console.error('❌ Error during hazard scan:', error);
      Alert.alert('Error', error.message || 'Failed to process hazard scan');
    } finally {
      setLoading(false);
    }
  };

  // Pick image from camera or gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Pick Image" onPress={pickImage} />
      
      {imageUri && (
        <Image source={{ uri: imageUri }} style={{ width: 300, height: 300, marginVertical: 20 }} />
      )}
      
      <Button 
        title={loading ? 'Processing...' : 'Scan Hazard & Save'} 
        onPress={handleHazardScan}
        disabled={!imageUri || loading}
      />
      
      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}
    </View>
  );
}

// =====================================================
// ALTERNATIVE: Save after existing detection completes
// =====================================================

/**
 * If you already have a working HazardScan component,
 * just add this code block AFTER your detection completes:
 */

// Inside your existing component, after detection finishes:
const saveToFirebase = async (detectionResult: any, imageFile: File | Blob) => {
  const { user } = useRoleStore();
  
  if (!user?.id) {
    console.warn('⚠️ No user ID, skipping Firebase save');
    return;
  }

  try {
    const saveResult = await saveHazardScan(
      imageFile,
      detectionResult.hazardType || 'unknown',
      detectionResult.confidence || 0,
      detectionResult.description || 'No description',
      user.id,
      {
        severity: detectionResult.severity,
        location: detectionResult.location, // if you have GPS coordinates
        metadata: {
          deviceInfo: Platform.OS,
          processingTime: detectionResult.processingTime,
        },
      }
    );

    if (saveResult.success) {
      console.log('✅ Hazard scan saved to Firebase!');
      console.log('Scan ID:', saveResult.scanId);
      console.log('Image URL:', saveResult.imageUrl);
      return saveResult;
    } else {
      console.error('❌ Failed to save:', saveResult.error);
    }
  } catch (error) {
    console.error('❌ Error saving to Firebase:', error);
  }
};

// Then call it after your detection:
// const detectionResult = await runHazardDetection(image);
// await saveToFirebase(detectionResult, imageFile);
