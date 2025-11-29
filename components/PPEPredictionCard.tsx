import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Detection {
  ppe_type: string;      // Mapped PPE category
  raw_class: string;     // Original YOLO class
  confidence: number;
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

interface PPEPredictionCardProps {
  detection: Detection;
}

const PPE_ICONS: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  helmet: 'construct',
  'hard-hat': 'construct',
  vest: 'shirt',
  'safety-vest': 'shirt',
  goggles: 'glasses',
  gloves: 'hand-right',
  mask: 'medical',
  boots: 'footsteps',
  default: 'shield-checkmark',
};

const PPE_COLORS: { [key: string]: string } = {
  helmet: '#FF9500',
  'hard-hat': '#FF9500',
  vest: '#34C759',
  'safety-vest': '#34C759',
  goggles: '#007AFF',
  gloves: '#5856D6',
  mask: '#FF3B30',
  boots: '#8E8E93',
  default: '#007AFF',
};

export default function PPEPredictionCard({ detection }: PPEPredictionCardProps) {
  const { ppe_type, raw_class, confidence, bbox } = detection;
  
  // Normalize PPE type for icon matching
  const normalizedType = ppe_type.toLowerCase().replace(/[_\s]/g, '-');
  
  // Get icon and color for this PPE type
  const iconName = PPE_ICONS[normalizedType] || PPE_ICONS.default;
  const iconColor = PPE_COLORS[normalizedType] || PPE_COLORS.default;
  
  // Format confidence as percentage
  const confidencePercent = (confidence * 100).toFixed(1);
  
  // Calculate confidence color
  const getConfidenceColor = (conf: number): string => {
    if (conf >= 0.8) return '#34C759'; // Green - High confidence
    if (conf >= 0.6) return '#FF9500'; // Orange - Medium confidence
    return '#FF3B30'; // Red - Low confidence
  };

  const confidenceColor = getConfidenceColor(confidence);

  // Calculate bounding box dimensions
  const boxWidth = (bbox.x2 - bbox.x1).toFixed(0);
  const boxHeight = (bbox.y2 - bbox.y1).toFixed(0);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={iconName} size={28} color={iconColor} />
        </View>
        
        <View style={styles.cardInfo}>
          <Text style={styles.className}>
            {ppe_type.replace(/_/g, ' ').toUpperCase()}
          </Text>
          <Text style={styles.rawClass}>({raw_class})</Text>
          <Text style={styles.bboxInfo}>
            Position: ({bbox.x1.toFixed(0)}, {bbox.y1.toFixed(0)})
          </Text>
          <Text style={styles.bboxInfo}>
            Size: {boxWidth} × {boxHeight}px
          </Text>
        </View>

        <View style={styles.confidenceContainer}>
          <Text style={[styles.confidenceText, { color: confidenceColor }]}>
            {confidencePercent}%
          </Text>
          <Text style={styles.confidenceLabel}>Confidence</Text>
        </View>
      </View>

      {/* Confidence bar */}
      <View style={styles.confidenceBar}>
        <View
          style={[
            styles.confidenceBarFill,
            {
              width: `${confidence * 100}%`,
              backgroundColor: confidenceColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  rawClass: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  bboxInfo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  confidenceLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
