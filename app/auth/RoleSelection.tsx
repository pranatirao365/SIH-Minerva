import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { HardHat, Users, Shield, Wrench, Settings, Check } from '../../components/Icons';
import { translator } from '../../services/translator';
import { useRoleStore } from '../../hooks/useRoleStore';
import { Role, ROLE_LABELS, ROLE_DESCRIPTIONS } from '../../constants/roles';
import { COLORS } from '../../constants/styles';

const roleOptions = [
  { role: 'miner' as Role, icon: HardHat, color: COLORS.primary },
  { role: 'supervisor' as Role, icon: Users, color: COLORS.secondary },
  { role: 'safety-officer' as Role, icon: Shield, color: COLORS.accent },
  { role: 'engineer' as Role, icon: Wrench, color: '#8B5CF6' },
  { role: 'admin' as Role, icon: Settings, color: '#DC2626' },
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
      'admin': '/admin/AdminHome',
    };

    router.replace(routes[selectedRole] as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {translator.translate('selectRole')}
          </Text>
          <Text style={styles.subtitle}>
            Choose your role to continue
          </Text>
        </View>

        <View style={styles.roleList}>
          {roleOptions.map(({ role, icon: Icon, color }) => (
            <TouchableOpacity
              key={role}
              onPress={() => setSelectedRole(role)}
              style={[
                styles.roleCard,
                selectedRole === role && styles.roleCardSelected
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.roleCardContent}>
                <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                  <Icon size={32} color={color} />
                </View>
                <View style={styles.roleInfo}>
                  <Text style={styles.roleName}>{ROLE_LABELS[role]}</Text>
                  <Text style={styles.roleDescription}>{ROLE_DESCRIPTIONS[role]}</Text>
                </View>
              </View>
              {selectedRole === role && (
                <Check size={24} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selectedRole && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedRole}
        >
          <Text style={styles.buttonText}>
            {translator.translate('continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    paddingVertical: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  roleList: {
    marginTop: 16,
    gap: 16,
  },
  roleCard: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  roleCardSelected: {
    borderColor: COLORS.primary,
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
