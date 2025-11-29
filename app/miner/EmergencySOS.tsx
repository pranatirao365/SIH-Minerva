import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, Phone, X } from '../../components/Icons';
import { useRoleStore } from '../../hooks/useRoleStore';

export default function EmergencySOS() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const { user } = useRoleStore();

  const handleEmergency = () => {
    // Send SOS notification to supervisors and safety officers
    // In a real app, this would call an API to notify supervisors
    console.log(`🚨 SOS Alert from ${user?.name || 'Miner'} - Location: Mine Site`);
    
    // TODO: Implement actual notification API call here
    // Example: await fetch('/api/emergency-alert', { method: 'POST', body: JSON.stringify({ minerId: user?.id, location: 'Mine Site' }) });
    
    Alert.alert(
      '🚨 SOS Alert Sent',
      'Emergency alert has been sent to Supervisors and Safety Officers. Help is on the way. Stay calm and follow safety protocols.',
      [{ text: 'OK', onPress: () => {
        setConfirmed(true);
      }}]
    );
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
        
        <Text className="text-white text-lg mt-4 text-center px-4">
          This will immediately alert Supervisors and Safety Officers about your emergency situation
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

            <Text className="text-white/80 text-center mb-8 px-6">
              Press to send emergency alert to rescue team
            </Text>

            <View className="bg-white/10 rounded-lg p-4 w-full">
              <Text className="text-white text-sm text-center">
                ⚠️ Your location and helmet data will be sent to supervisors for immediate assistance
              </Text>
            </View>
          </>
        ) : (
          <View className="mt-12 bg-white/20 rounded-lg p-6">
            <Text className="text-white text-xl font-bold text-center">
              ✓ SOS Alert Sent
            </Text>
            <Text className="text-white text-center mt-2">
              Supervisors have been notified. Help is on the way.
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-4 bg-white py-3 px-6 rounded-lg"
            >
              <Text className="text-destructive font-bold text-center">Go Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
