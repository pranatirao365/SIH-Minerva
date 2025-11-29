import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface PPEResult {
  present: boolean;
}

interface PPEStatusListProps {
  results: {
    Helmet: PPEResult;
    Gloves: PPEResult;
    Vest: PPEResult;
    Shoes: PPEResult;
  };
}

export default function PPEStatusList({ results }: PPEStatusListProps) {
  const ppeItems = [
    'Helmet',
    'Gloves',
    'Vest',
    'Shoes'
  ] as const;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>PPE Detection Results</Text>
      <View style={styles.listContainer}>
        {ppeItems.map((item) => {
          const isPresent = results[item]?.present;
          return (
            <View key={item} style={styles.itemRow}>
              <Text style={styles.itemName}>{item}:</Text>
              <Text style={[
                styles.itemStatus,
                isPresent ? styles.statusPresent : styles.statusAbsent
              ]}>
                {isPresent ? 'PRESENT' : 'NOT PRESENT'}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  listContainer: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  itemName: {
    fontSize: 16,
    width: 120,
    fontWeight: '500',
  },
  itemStatus: {
    fontSize: 16,
    flex: 1,
    fontWeight: '600',
  },
  statusPresent: {
    color: '#10B981',
  },
  statusAbsent: {
    color: '#EF4444',
  },
});
