import React from 'react';
import { TouchableOpacity, Text, Animated } from 'react-native';
import { AlertCircle } from './Icons';
import { useRouter } from 'expo-router';
import { translator } from '../services/translator';

export const EmergencyButton: React.FC = () => {
  const router = useRouter();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const handlePress = () => {
    router.push('/miner/EmergencySOS');
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 90,
        right: 20,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        className="bg-destructive rounded-full p-4 shadow-lg"
        style={{
          shadowColor: '#EF4444',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <AlertCircle size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};
