import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

interface PulseWaveformProps {
  bpm: number;
  signal: number;
  width?: number;
  height?: number;
  lineColor?: string;
  showBPM?: boolean;
}

export const PulseWaveform: React.FC<PulseWaveformProps> = ({
  bpm,
  signal,
  width = 300,
  height = 120,
  lineColor = '#ff4757',
  showBPM = true
}) => {
  const [signalHistory, setSignalHistory] = useState<number[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const maxDataPoints = 50;

  // Update signal history
  useEffect(() => {
    setSignalHistory(prev => {
      const newHistory = [...prev, signal];
      if (newHistory.length > maxDataPoints) {
        newHistory.shift();
      }
      return newHistory;
    });
  }, [signal]);

  // Animate pulse dot when BPM changes
  useEffect(() => {
    if (bpm > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [bpm]);

  // Normalize signal data to fit within graph height
  const normalizeSignal = (value: number, min: number, max: number): number => {
    if (max === min) return height / 2;
    return height - ((value - min) / (max - min)) * height * 0.8 - height * 0.1;
  };

  // Calculate min/max for normalization
  const minSignal = Math.min(...signalHistory, 0);
  const maxSignal = Math.max(...signalHistory, 4095);

  // Generate SVG path from signal history
  const generatePath = (): string => {
    if (signalHistory.length < 2) return '';

    const xStep = width / (maxDataPoints - 1);
    let path = '';

    signalHistory.forEach((value, index) => {
      const x = index * xStep;
      const y = normalizeSignal(value, minSignal, maxSignal);

      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });

    return path;
  };

  const path = generatePath();
  const lastY = signalHistory.length > 0 
    ? normalizeSignal(signalHistory[signalHistory.length - 1], minSignal, maxSignal)
    : height / 2;

  return (
    <View style={styles.container}>
      {showBPM && (
        <View style={styles.bpmHeader}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text style={[styles.bpmValue, { color: lineColor }]}>
              {bpm > 0 ? bpm : '--'}
            </Text>
          </Animated.View>
          <Text style={styles.bpmLabel}>BPM</Text>
        </View>
      )}

      <View style={[styles.graphContainer, { width, height }]}>
        <Svg width={width} height={height}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <Line
              key={`grid-${i}`}
              x1={0}
              y1={(height / 4) * i}
              x2={width}
              y2={(height / 4) * i}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          ))}

          {/* Waveform path */}
          {path && (
            <Path
              d={path}
              stroke={lineColor}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Current position indicator */}
          {signalHistory.length > 0 && (
            <Circle
              cx={width}
              cy={lastY}
              r="4"
              fill={lineColor}
              opacity={bpm > 0 ? 1 : 0.3}
            />
          )}
        </Svg>

        {/* Signal strength indicator */}
        <View style={styles.signalInfo}>
          <Text style={styles.signalText}>
            Signal: {signal > 0 ? signal : '--'}
          </Text>
          <View
            style={[
              styles.signalDot,
              {
                backgroundColor:
                  signal > 2000 ? '#2ecc71' : signal > 1000 ? '#f39c12' : '#95a5a6',
              },
            ]}
          />
        </View>
      </View>

      {bpm === 0 && signal < 500 && (
        <Text style={styles.warningText}>
          Place finger on sensor...
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  bpmHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  bpmValue: {
    fontSize: 42,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  bpmLabel: {
    fontSize: 16,
    color: '#888',
    marginLeft: 8,
    fontWeight: '600',
  },
  graphContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  signalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  signalText: {
    fontSize: 11,
    color: '#888',
    fontFamily: 'monospace',
    marginRight: 6,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  warningText: {
    marginTop: 8,
    fontSize: 12,
    color: '#f39c12',
    fontStyle: 'italic',
  },
});
