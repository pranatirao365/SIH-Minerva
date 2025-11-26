import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, ArrowLeft, ScanLine } from '../../components/Icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function HazardScan() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 py-4 flex-row items-center border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-foreground text-lg font-bold ml-4">Hazard Scan</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Camera size={80} color="#FF6B00" />
          <Text className="text-foreground text-xl font-bold mt-6 text-center">
            Camera Permission Required
          </Text>
          <Text className="text-neutral-400 text-center mt-2 mb-6">
            We need camera access to scan for hazards
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            className="bg-primary rounded-lg px-8 py-3"
          >
            <Text className="text-white font-bold">Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const simulateScan = () => {
    setScanning(true);
    
    setTimeout(() => {
      setScanning(false);
      Alert.alert(
        'Hazard Detected',
        'Gas Leak - Confidence: 87%\nLocation: Shaft B\nSeverity: High',
        [{ text: 'OK' }]
      );
    }, 2000);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 flex-row items-center border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-bold ml-4">Hazard Scan</Text>
      </View>

      <View className="flex-1">
        <View className="flex-1 bg-neutral-800 items-center justify-center">
          <Camera size={80} color="#FF6B00" />
          <Text className="text-neutral-400 mt-4 text-center px-6">
            Camera view would appear here{'\n'}
            Point camera at potential hazards
          </Text>
          
          {scanning && (
            <View className="absolute inset-0 items-center justify-center bg-black/50">
              <ScanLine size={100} color="#FF6B00" />
              <Text className="text-primary text-lg font-bold mt-4">Scanning...</Text>
            </View>
          )}
        </View>

        <View className="px-6 py-6">
          <TouchableOpacity
            onPress={simulateScan}
            disabled={scanning}
            className="bg-primary rounded-lg p-4 items-center"
          >
            <Text className="text-white text-lg font-bold">
              {scanning ? 'Scanning...' : 'Scan for Hazards'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
