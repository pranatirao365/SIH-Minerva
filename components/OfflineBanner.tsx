import React from 'react';
import { View, Text } from 'react-native';
import { WifiOff } from './Icons';
import { useNetwork } from '../hooks/useNetwork';
import { translator } from '../services/translator';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetwork();

  if (isOnline) return null;

  return (
    <View className="bg-neutral-800 border-b border-border px-4 py-2 flex-row items-center">
      <WifiOff size={16} color="#A3A3A3" />
      <Text className="text-neutral-400 text-sm ml-2">
        {translator.translate('offlineMessage')}
      </Text>
    </View>
  );
};
