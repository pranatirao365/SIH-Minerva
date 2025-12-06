import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PPEDetectionItemProps {
  name: string;
  icon: string;
  confidence: number;
  isPresent: boolean;
}

export default function PPEDetectionItem({ 
  name, 
  icon, 
  confidence, 
  isPresent 
}: PPEDetectionItemProps) {
  const statusColor = isPresent ? '#28C76F' : '#EA5455';
  const statusBgColor = isPresent 
    ? 'rgba(40, 199, 111, 0.12)' 
    : 'rgba(234, 84, 85, 0.12)';

  return (
    <View style={[styles.container, { borderColor: isPresent ? 'rgba(40, 199, 111, 0.12)' : 'rgba(234, 84, 85, 0.12)' }]}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameContainer}>
            {icon ? <Text style={styles.icon}>{icon}</Text> : null}
            <Text style={styles.name}>{name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBgColor, borderColor: statusColor }]}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {isPresent ? 'Present' : 'Missing'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  icon: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  statusIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
