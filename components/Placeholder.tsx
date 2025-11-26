import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from './Icons';
import { COLORS } from '../constants/styles';

interface PlaceholderProps {
  title: string;
  description?: string;
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>
            {description || 'This screen is under development. Full functionality coming soon!'}
          </Text>
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
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 8,
  },
});
