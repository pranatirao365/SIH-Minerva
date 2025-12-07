import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import PPEStatusList from '../components/PPEStatusList';

interface PPEResult {
  present: boolean;
}

interface PPEResults {
  Helmet: PPEResult;
  Gloves: PPEResult;
  Vest: PPEResult;
  Shoes: PPEResult;
  Goggles: PPEResult;
  Suit: PPEResult;
  'No-Helmet': PPEResult;
  'No-Vest': PPEResult;
}

const API_URL = `http://${process.env.EXPO_PUBLIC_IP_ADDRESS || '172.16.85.150'}:8888/ppe-scan`;

export default function PPEScanScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [results, setResults] = useState<PPEResults | null>(null);
  const [loading, setLoading] = useState(false);

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
      setResults(null);
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
      setResults(null);
    }
  };

  const scanImage = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);

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

      const data: PPEResults = await response.json();
      setResults(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to scan image. Please try again.');
      console.error('Scan error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>PPE Detection Scanner</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Pick Image</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>

        {selectedImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.image} />
            <TouchableOpacity
              style={[styles.button, styles.scanButton]}
              onPress={scanImage}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Scan for PPE</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {results && <PPEStatusList results={results} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 15,
  },
  scanButton: {
    width: '100%',
  },
});
