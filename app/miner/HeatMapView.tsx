import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, AlertTriangle, TrendingUp, ArrowLeft } from '../../components/Icons';

export default function HeatMapView() {
  const router = useRouter();

  const hazardZones = [
    { area: 'Shaft A', level: 'High', color: '#EF4444' },
    { area: 'Tunnel B', level: 'Medium', color: '#F59E0B' },
    { area: 'Level 3', level: 'Low', color: '#10B981' },
    { area: 'Shaft C', level: 'High', color: '#EF4444' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 flex-row items-center border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-bold ml-4">Heat Map</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        <View className="bg-neutral-800 rounded-lg h-64 items-center justify-center mb-6">
          <MapPin size={48} color="#FF6B00" />
          <Text className="text-neutral-400 mt-4 text-center">
            Heat Map Visualization{'\n'}
            (Interactive map would appear here)
          </Text>
        </View>

        <Text className="text-foreground text-xl font-bold mb-4">Hazard Zones</Text>

        {hazardZones.map((zone, index) => (
          <View
            key={index}
            className="bg-neutral-900 rounded-lg border border-border p-4 mb-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: zone.color }}
              />
              <View>
                <Text className="text-foreground font-semibold">{zone.area}</Text>
                <Text className="text-neutral-400 text-sm">Risk Level: {zone.level}</Text>
              </View>
            </View>
            <AlertTriangle size={20} color={zone.color} />
          </View>
        ))}

        <View className="bg-primary/20 rounded-lg border border-primary p-4 mt-6">
          <Text className="text-primary font-bold mb-2">Safety Advisory</Text>
          <Text className="text-foreground">
            Exercise extra caution in high-risk zones. Always wear proper PPE.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
