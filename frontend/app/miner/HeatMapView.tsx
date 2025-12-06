import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, AlertTriangle, TrendingUp, ArrowLeft, Lock, CheckCircle } from '../../components/Icons';
import { canAccessWorkRoutes, getPendingMandatoryVideos } from '../../services/videoAccessControl';

export default function HeatMapView() {
  const router = useRouter();
  const [canAccessRoutes, setCanAccessRoutes] = useState(false);
  const [pendingVideos, setPendingVideos] = useState(0);
  const [loading, setLoading] = useState(true);

  // Mock miner ID - in real app, get from user context
  const currentMinerId = '1'; // Rajesh Kumar

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const accessGranted = await canAccessWorkRoutes(currentMinerId);
      const pending = await getPendingMandatoryVideos(currentMinerId);
      setCanAccessRoutes(accessGranted);
      setPendingVideos(pending);
    } catch (error) {
      console.error('Error checking access:', error);
    } finally {
      setLoading(false);
    }
  };

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

        {/* Work Route Access */}
        <View className="mt-6">
          <Text className="text-foreground text-xl font-bold mb-4">Work Route Access</Text>

          <View className={`rounded-lg border p-4 mb-4 ${
            canAccessRoutes
              ? 'bg-green-500/20 border-green-500'
              : 'bg-red-500/20 border-red-500'
          }`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                {canAccessRoutes ? (
                  <CheckCircle size={24} color="#10B981" />
                ) : (
                  <Lock size={24} color="#EF4444" />
                )}
                <View className="ml-3">
                  <Text className={`font-bold ${
                    canAccessRoutes ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {canAccessRoutes ? 'Access Granted' : 'Access Restricted'}
                  </Text>
                  <Text className="text-neutral-400 text-sm">
                    {canAccessRoutes
                      ? 'You can enter work routes'
                      : `${pendingVideos} mandatory video${pendingVideos !== 1 ? 's' : ''} remaining`
                    }
                  </Text>
                </View>
              </View>
              {!canAccessRoutes && (
                <TouchableOpacity
                  onPress={() => router.push('/miner/AssignedVideos' as any)}
                  className="bg-primary px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-semibold">Watch Videos</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {canAccessRoutes && (
            <TouchableOpacity
              onPress={() => Alert.alert('Success', 'Entering work route...')}
              className="bg-primary p-4 rounded-lg flex-row items-center justify-center"
            >
              <MapPin size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">Enter Work Route</Text>
            </TouchableOpacity>
          )}
        </View>

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
