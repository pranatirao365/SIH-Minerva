import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, ArrowLeft, Shield, CheckCircle, XCircle } from '../../components/Icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function PPEScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);

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
          <Text className="text-foreground text-lg font-bold ml-4">PPE Scan</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Shield size={80} color="#10B981" />
          <Text className="text-foreground text-xl font-bold mt-6 text-center">
            Camera Permission Required
          </Text>
          <Text className="text-neutral-400 text-center mt-2 mb-6">
            We need camera access to verify PPE compliance
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
      const mockResult = {
        helmet: true,
        gloves: true,
        boots: true,
        vest: false,
        overall: 75,
      };
      setResult(mockResult);
    }, 2000);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 flex-row items-center border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-bold ml-4">PPE Scan</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="h-96 bg-neutral-800 items-center justify-center">
          <Shield size={80} color="#10B981" />
          <Text className="text-neutral-400 mt-4 text-center px-6">
            Camera view would appear here{'\n'}
            Position yourself in frame for PPE check
          </Text>
          
          {scanning && (
            <View className="absolute inset-0 items-center justify-center bg-black/50">
              <Text className="text-accent text-lg font-bold">Analyzing PPE...</Text>
            </View>
          )}
        </View>

        {result && (
          <View className="px-6 py-6">
            <View className={`rounded-lg p-6 mb-6 ${
              result.overall >= 80 ? 'bg-accent/20 border border-accent' : 'bg-destructive/20 border border-destructive'
            }`}>
              <Text className={`text-2xl font-bold mb-2 ${
                result.overall >= 80 ? 'text-accent' : 'text-destructive'
              }`}>
                {result.overall >= 80 ? '✓ PPE Compliant' : '✗ PPE Incomplete'}
              </Text>
              <Text className="text-foreground">Compliance Score: {result.overall}%</Text>
            </View>

            <Text className="text-foreground text-lg font-bold mb-4">Equipment Status:</Text>

            {[
              { name: 'Helmet', status: result.helmet },
              { name: 'Gloves', status: result.gloves },
              { name: 'Safety Boots', status: result.boots },
              { name: 'Safety Vest', status: result.vest },
            ].map((item, index) => (
              <View
                key={index}
                className="bg-neutral-900 rounded-lg p-4 mb-2 flex-row items-center justify-between"
              >
                <Text className="text-foreground">{item.name}</Text>
                {item.status ? (
                  <CheckCircle size={20} color="#10B981" />
                ) : (
                  <XCircle size={20} color="#EF4444" />
                )}
              </View>
            ))}
          </View>
        )}

        <View className="px-6 pb-6">
          <TouchableOpacity
            onPress={simulateScan}
            disabled={scanning}
            className="bg-accent rounded-lg p-4 items-center"
          >
            <Text className="text-white text-lg font-bold">
              {scanning ? 'Scanning...' : result ? 'Scan Again' : 'Start PPE Scan'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
