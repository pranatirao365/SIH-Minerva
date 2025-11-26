import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Phone, Globe, Shield, LogOut, ArrowLeft } from '../../components/Icons';
import { useRoleStore } from '../../hooks/useRoleStore';
import { translator } from '../../services/translator';
import { ROLE_LABELS } from '../../constants/roles';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, language, logout, safetyScore } = useRoleStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/auth/LanguageSelect' as any);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 flex-row items-center border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-bold ml-4">
          {translator.translate('profile')}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Profile Header */}
        <View className="items-center py-6">
          <View className="w-24 h-24 bg-primary rounded-full items-center justify-center mb-4">
            <User size={48} color="#FFFFFF" />
          </View>
          <Text className="text-foreground text-2xl font-bold">
            {user.name || 'User Name'}
          </Text>
          <Text className="text-neutral-400 mt-1">
            {user.role ? ROLE_LABELS[user.role] : 'Role'}
          </Text>
        </View>

        {/* Safety Score */}
        {user.role === 'miner' && (
          <View className="bg-accent/20 border border-accent rounded-lg p-4 mb-6">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-neutral-400">Safety Score</Text>
                <Text className="text-foreground text-3xl font-bold mt-1">
                  {safetyScore}%
                </Text>
              </View>
              <Shield size={40} color="#10B981" />
            </View>
          </View>
        )}

        {/* Profile Details */}
        <View className="space-y-4 mb-6">
          <View className="bg-neutral-900 rounded-lg border border-border p-4 flex-row items-center">
            <Phone size={20} color="#FF6B00" />
            <View className="ml-4">
              <Text className="text-neutral-400 text-sm">Phone Number</Text>
              <Text className="text-foreground font-semibold">
                {user.phone || '+91 9876543210'}
              </Text>
            </View>
          </View>

          <View className="bg-neutral-900 rounded-lg border border-border p-4 flex-row items-center">
            <Globe size={20} color="#FF6B00" />
            <View className="ml-4">
              <Text className="text-neutral-400 text-sm">Language</Text>
              <Text className="text-foreground font-semibold">
                {language === 'en' ? 'English' : language === 'hi' ? 'हिंदी' : 'తెలుగు'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-destructive rounded-lg p-4 flex-row items-center justify-center"
        >
          <LogOut size={20} color="#FFFFFF" />
          <Text className="text-white font-bold text-lg ml-2">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
