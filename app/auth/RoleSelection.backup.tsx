import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { HardHat, Users, Shield, Wrench, Check } from '../../components/Icons';
import { translator } from '../../services/translator';
import { useRoleStore } from '../../hooks/useRoleStore';
import { Role, ROLE_LABELS, ROLE_DESCRIPTIONS } from '../../constants/roles';
import { Button } from '../../components/ui/Button';

const roleOptions = [
  { role: 'miner' as Role, icon: HardHat, color: '#FF6B00' },
  { role: 'supervisor' as Role, icon: Users, color: '#1E40AF' },
  { role: 'safety-officer' as Role, icon: Shield, color: '#10B981' },
  { role: 'engineer' as Role, icon: Wrench, color: '#8B5CF6' },
];

export default function RoleSelection() {
  const router = useRouter();
  const { setRole, setAuthenticated } = useRoleStore();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleContinue = () => {
    if (!selectedRole) return;

    setRole(selectedRole);
    setAuthenticated(true);

    // Navigate to appropriate home screen
    const routes: Record<Role, string> = {
      'miner': '/miner/MinerHome',
      'supervisor': '/supervisor/SupervisorHome',
      'safety-officer': '/safety-officer/SafetyOfficerHome',
      'engineer': '/engineer/EngineerHome',
    };

    router.replace(routes[selectedRole] as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6">
        <View className="py-12">
          <Text className="text-3xl font-bold text-foreground text-center">
            {translator.translate('selectRole')}
          </Text>
          <Text className="text-neutral-400 text-center mt-2">
            Choose your role to continue
          </Text>
        </View>

        <View className="space-y-4">
          {roleOptions.map(({ role, icon: Icon, color }) => (
            <TouchableOpacity
              key={role}
              onPress={() => setSelectedRole(role)}
              className={`border-2 rounded-xl p-6 ${
                selectedRole === role
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-neutral-900'
              }`}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon size={24} color={color} />
                  </View>
                  <Text className="text-foreground text-xl font-bold ml-4">
                    {ROLE_LABELS[role]}
                  </Text>
                </View>
                {selectedRole === role && (
                  <Check size={24} color="#FF6B00" />
                )}
              </View>
              <Text className="text-neutral-400 text-sm">
                {ROLE_DESCRIPTIONS[role]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View className="px-6 pb-6">
        <Button
          onPress={handleContinue}
          size="lg"
          disabled={!selectedRole}
        >
          {translator.translate('continue')}
        </Button>
      </View>
    </SafeAreaView>
  );
}
