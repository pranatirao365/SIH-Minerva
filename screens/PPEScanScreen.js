// screens/PPEScanScreen.js
// Complete PPE Scan module with camera and API integration

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Camera } from 'expo-camera';
import PPEPredictionCard from '../components/PPEPredictionCard';
import { uploadImageForPPEDetection } from '../services/ppeApi';

const PPEScanScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const cameraRef = useRef(null);

  // Request camera permissions
  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Handle camera flip
  const flipCamera = () => {
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  // Capture photo and send to backend
  const scanPPE = async () => {
    if (!cameraRef.current) return;

    try {
      setLoading(true);
      setPredictions(null);

      // Take picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });

      setCapturedImage(photo.uri);

      // Upload to backend
      const result = await uploadImageForPPEDetection(photo.uri);

      // Set predictions
      setPredictions(result.detections || []);

    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert(
        'Scan Failed',
        error.message || 'Could not process image. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
      setCapturedImage(null);
    } finally {
      setLoading(false);
    }
  };

  // Reset to camera view
  const resetScan = () => {
    setCapturedImage(null);
    setPredictions(null);
  };

  // Handle permission states
  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>📷</Text>
        <Text style={styles.errorTitle}>Camera Access Required</Text>
        <Text style={styles.errorText}>
          Please enable camera permissions in your device settings to use PPE scanning.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PPE Scanner</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Camera or Captured Image */}
      {!capturedImage ? (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.instructionText}>
                📸 Position PPE equipment in frame
              </Text>
            </View>
          </Camera>
        </View>
      ) : (
        <View style={styles.imageContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
        </View>
      )}

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>🔍 Analyzing PPE...</Text>
        </View>
      )}

      {/* Predictions */}
      {predictions && !loading && (
        <PPEPredictionCard detections={predictions} />
      )}

      {/* Control Buttons */}
      <View style={styles.controls}>
        {!capturedImage ? (
          <>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={flipCamera}
              disabled={loading}
            >
              <Text style={styles.flipButtonText}>🔄 Flip Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.scanButton}
              onPress={scanPPE}
              disabled={loading}
            >
              <Text style={styles.scanButtonText}>📸 Scan PPE</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetScan}
            disabled={loading}
          >
            <Text style={styles.resetButtonText}>🔄 Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 300,
    height: 300,
    borderWidth: 3,
    borderColor: '#10B981',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  controls: {
    padding: 20,
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  flipButton: {
    backgroundColor: '#374151',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  flipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default PPEScanScreen;
