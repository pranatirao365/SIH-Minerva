import { useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from '../../components/Icons';

// This screen is redundant as SmartHelmetStatus.tsx already provides comprehensive helmet monitoring
// Redirecting to the main Smart Helmet Status screen
export default function HelmetStatus() {
  const router = useRouter();
  
  React.useEffect(() => {
    // Redirect to SmartHelmetStatus which has full helmet monitoring
    router.replace('/miner/SmartHelmetStatus');
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <TouchableOpacity onPress={() => router.back()}>
        <ArrowLeft size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
