import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import { useRoleStore } from '../../hooks/useRoleStore';
import { COLORS } from '../../constants/styles';

export default function EngineerHome() {
  const { user } = useRoleStore();

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        userName={user.name || 'Engineer'}
        showBack={false}
        showNotifications={true}
        showProfile={true}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Engineer Dashboard</Text>
          <Text style={styles.description}>Monitor environmental and structural data</Text>
        </View>
      </ScrollView>
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
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
});
