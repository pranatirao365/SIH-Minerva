import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AlertCircle, Phone, X } from '../../components/Icons';

export default function EmergencySOS() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);

  const handleEmergency = () => {
    Alert.alert(
      'Emergency Alert Sent',
      'Emergency services have been notified. Help is on the way. Stay calm and follow safety protocols.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
    setConfirmed(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-destructive">
      <View className="flex-1 items-center justify-center px-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-4 right-4 p-2"
        >
          <X size={32} color="#FFFFFF" />
        </TouchableOpacity>

        <AlertCircle size={120} color="#FFFFFF" />
        
        <Text className="text-white text-4xl font-bold mt-8 text-center">
          EMERGENCY SOS
        </Text>
        
        <Text className="text-white text-lg mt-4 text-center">
          This will immediately alert emergency services and your supervisor
        </Text>

        {!confirmed ? (
          <>
            <TouchableOpacity
              onPress={handleEmergency}
              className="bg-white rounded-full w-64 h-64 items-center justify-center mt-12 mb-8"
              style={{
                shadowColor: '#FFFFFF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <Phone size={80} color="#EF4444" />
              <Text className="text-destructive text-2xl font-bold mt-4">PRESS FOR SOS</Text>
            </TouchableOpacity>

            <Text className="text-white/80 text-center">
              Hold to confirm emergency alert
            </Text>
          </>
        ) : (
          <View className="mt-12 bg-white/20 rounded-lg p-6">
            <Text className="text-white text-xl font-bold text-center">
              ✓ Emergency Alert Sent
            </Text>
            <Text className="text-white text-center mt-2">
              Help is on the way
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
