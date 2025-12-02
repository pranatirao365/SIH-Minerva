/**
 * Professional Safety Officer Hazard Heat Map
 * 
 * Features:
 * - Real-time ML hazard detection (Fire YOLO + Crack DeepCrack)
 * - Firestore real-time listeners for all hazards
 * - Touch gesture controls (pinch-to-zoom, pan, double-tap)
 * - Bottom sheet for hazard details
 * - Filter bar for hazard types
 * - Miner markers with PPE status
 * - Mobile-first responsive design
 */

import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    ImageBackground,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PinchGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, ArrowLeft, Bell, Flame, MapPin, User, Wrench, Zap } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import {
    calculatePPECompliance,
    EquipmentHazard,
    getHazardTypeColor,
    getRiskLevelColor,
    ManualHazard,
    MinerLocation,
    MLHazard,
    subscribeToEquipmentHazards,
    subscribeToManualHazards,
    subscribeToMiners,
    subscribeToMLHazards
} from '../../services/hazardMapService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Map configuration - Full screen responsive
const MAP_WIDTH = SCREEN_WIDTH;
const MAP_HEIGHT = SCREEN_HEIGHT * 0.75; // 75% of screen to fill space above filters

type FilterType = 'fire' | 'crack' | 'blasting' | 'gas' | 'equipment' | 'miners' | 'ppeViolations' | null;

interface BottomSheetContent {
  type: 'mlHazard' | 'manualHazard' | 'miner' | 'equipment';
  data: MLHazard | ManualHazard | MinerLocation | EquipmentHazard;
}

export default function HazardZoneHeatMap() {
  const router = useRouter();

  // Firestore real-time data
  const [manualHazards, setManualHazards] = useState<ManualHazard[]>([]);
  const [mlHazards, setMLHazards] = useState<MLHazard[]>([]);
  const [miners, setMiners] = useState<MinerLocation[]>([]);
  const [equipment, setEquipment] = useState<EquipmentHazard[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(new Set([
    'fire', 'crack', 'blasting', 'gas', 'equipment', 'miners'
  ]));

  // Gesture state
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const baseScale = useRef(1);
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  // Bottom sheet
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [bottomSheetContent, setBottomSheetContent] = useState<BottomSheetContent | null>(null);
  const snapPoints = useMemo(() => ['50%', '90%'], []);

  // Animation for pulsing fire hazards
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulsing animation for critical hazards
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Subscribe to real-time Firestore data
  useEffect(() => {
    console.log('🔥 Subscribing to real-time hazard data...');

    const unsubscribeManual = subscribeToManualHazards(
      (hazards) => {
        console.log(`✅ Manual hazards updated: ${hazards.length}`);
        setManualHazards(hazards);
        setLoading(false);
      },
      (error) => console.error('❌ Manual hazards error:', error)
    );

    const unsubscribeML = subscribeToMLHazards(
      (mlHazardsData) => {
        console.log(`✅ ML hazards updated: ${mlHazardsData.length}`);
        setMLHazards(mlHazardsData);
      },
      (error) => console.error('❌ ML hazards error:', error)
    );

    const unsubscribeMiners = subscribeToMiners(
      (minersData) => {
        console.log(`✅ Miners updated: ${minersData.length}`);
        setMiners(minersData);
      },
      (error) => console.error('❌ Miners error:', error)
    );

    const unsubscribeEquipment = subscribeToEquipmentHazards(
      (equipmentData) => {
        console.log(`✅ Equipment updated: ${equipmentData.length}`);
        setEquipment(equipmentData);
      },
      (error) => console.error('❌ Equipment error:', error)
    );

    return () => {
      unsubscribeManual();
      unsubscribeML();
      unsubscribeMiners();
      unsubscribeEquipment();
    };
  }, []);

  // Filter toggle
  const toggleFilter = (filter: FilterType) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
      } else {
        newFilters.add(filter);
      }
      return newFilters;
    });
  };

  // Gesture handlers
  const handlePinchGesture = (event: any) => {
    const newScale = event.nativeEvent.scale;
    baseScale.current = Math.max(1, Math.min(lastScale.current * newScale, 3));
  };

  const onPinchStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastScale.current = baseScale.current;
    }
  };

  const handlePanGesture = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onPanStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastTranslateX.current += event.nativeEvent.translationX;
      lastTranslateY.current += event.nativeEvent.translationY;
      
      // Apply bounds
      const maxTranslate = (lastScale.current - 1) * MAP_WIDTH / 2;
      lastTranslateX.current = Math.max(-maxTranslate, Math.min(lastTranslateX.current, maxTranslate));
      lastTranslateY.current = Math.max(-maxTranslate, Math.min(lastTranslateY.current, maxTranslate));
      
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  const handleDoubleTap = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      // Toggle between 1x and 2x zoom
      const newScale = lastScale.current === 1 ? 2 : 1;
      lastScale.current = newScale;
      baseScale.current = newScale;
      
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      
      if (newScale === 1) {
        lastTranslateX.current = 0;
        lastTranslateY.current = 0;
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  // Convert percentage coordinates to screen pixels
  const coordsToPixels = (coords: { x: number; y: number }) => {
    return {
      x: (coords.x / 100) * MAP_WIDTH,
      y: (coords.y / 100) * MAP_HEIGHT,
    };
  };

  // Open bottom sheet with content
  const openBottomSheet = (content: BottomSheetContent) => {
    setBottomSheetContent(content);
    bottomSheetRef.current?.expand();
  };

  // Filter data
  const filteredMLHazards = mlHazards.filter(h => {
    if (h.hazardType === 'fire') return activeFilters.has('fire');
    if (h.hazardType === 'crack') return activeFilters.has('crack');
    return false;
  });

  const filteredManualHazards = manualHazards.filter(h => {
    if (h.type === 'blasting') return activeFilters.has('blasting');
    if (h.type === 'gas') return activeFilters.has('gas');
    if (h.type === 'equipment' || h.type === 'electrical') return activeFilters.has('equipment');
    return true; // Show all by default
  });

  const filteredMiners = activeFilters.has('miners') ? miners : [];
  const filteredEquipment = activeFilters.has('equipment') ? equipment : [];

  // PPE violations filter
  const ppeViolations = activeFilters.has('ppeViolations')
    ? miners.filter(m => m.status === 'missingPPE')
    : [];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading hazard map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.topBarButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Heat Map</Text>
          <View style={styles.topBarRight}>
            <TouchableOpacity style={styles.topBarButton}>
              <Bell size={24} color="#FFFFFF" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBarButton}>
              <User size={24} color="#f0e9e9ff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Map Container */}
        <View style={styles.mapWrapper}>
          <TapGestureHandler
            onHandlerStateChange={handleDoubleTap}
            numberOfTaps={2}
          >
            <Animated.View>
              <PinchGestureHandler
                onGestureEvent={handlePinchGesture}
                onHandlerStateChange={onPinchStateChange}
              >
                <Animated.View>
                  <PanGestureHandler
                    onGestureEvent={handlePanGesture}
                    onHandlerStateChange={onPanStateChange}
                    minPointers={1}
                    maxPointers={1}
                  >
                    <Animated.View
                      style={[
                        styles.mapContainer,
                        {
                          transform: [
                            { translateX: Animated.add(translateX, lastTranslateX.current) },
                            { translateY: Animated.add(translateY, lastTranslateY.current) },
                            { scale: baseScale.current },
                          ],
                        },
                      ]}
                    >
                      {/* Background Map */}
                      <ImageBackground
                        source={require('../../assets/images/mine-background.jpg')}
                        style={styles.mapBackground}
                        imageStyle={styles.mapBackgroundImage}
                        resizeMode="cover"
                      >
                        {/* Dark overlay for better contrast */}
                        <View style={styles.mapOverlay} />

                        {/* ML Fire Hazards (YOLO Bounding Boxes) */}
                        {filteredMLHazards
                          .filter(h => h.hazardType === 'fire')
                          .map(hazard => {
                            const pos = coordsToPixels(hazard.coordinates);
                            const isCritical = hazard.riskLevel === 'critical';
                            
                            return (
                              <TouchableOpacity
                                key={hazard.id}
                                style={[
                                  styles.fireHazardBox,
                                  {
                                    left: pos.x - 40,
                                    top: pos.y - 40,
                                  },
                                ]}
                                onPress={() => openBottomSheet({ type: 'mlHazard', data: hazard })}
                              >
                                <Animated.View
                                  style={[
                                    styles.fireHazardInner,
                                    isCritical && {
                                      transform: [{ scale: pulseAnim }],
                                    },
                                  ]}
                                >
                                  <Flame size={24} color="#FF3B30" />
                                  <Text style={styles.confidenceText}>
                                    {Math.round(hazard.confidence * 100)}%
                                  </Text>
                                </Animated.View>
                              </TouchableOpacity>
                            );
                          })}

                        {/* ML Crack Hazards (DeepCrack Masks) */}
                        {filteredMLHazards
                          .filter(h => h.hazardType === 'crack')
                          .map(hazard => {
                            const pos = coordsToPixels(hazard.coordinates);
                            
                            return (
                              <TouchableOpacity
                                key={hazard.id}
                                style={[
                                  styles.crackHazardMarker,
                                  {
                                    left: pos.x - 30,
                                    top: pos.y - 30,
                                    backgroundColor: getRiskLevelColor(hazard.riskLevel) + '50',
                                    borderColor: getRiskLevelColor(hazard.riskLevel),
                                  },
                                ]}
                                onPress={() => openBottomSheet({ type: 'mlHazard', data: hazard })}
                              >
                                <AlertTriangle size={20} color={getRiskLevelColor(hazard.riskLevel)} />
                                <Text style={[styles.crackSeverityText, { color: getRiskLevelColor(hazard.riskLevel) }]}>
                                  {hazard.severityScore?.toFixed(1)}%
                                </Text>
                              </TouchableOpacity>
                            );
                          })}

                        {/* Manual Hazards */}
                        {filteredManualHazards.map(hazard => {
                          const pos = coordsToPixels(hazard.coordinates);
                          const color = getHazardTypeColor(hazard.type);
                          
                          return (
                            <TouchableOpacity
                              key={hazard.id}
                              style={[
                                styles.manualHazardMarker,
                                {
                                  left: pos.x - 25,
                                  top: pos.y - 25,
                                  backgroundColor: color + '30',
                                  borderColor: color,
                                },
                              ]}
                              onPress={() => openBottomSheet({ type: 'manualHazard', data: hazard })}
                            >
                              {hazard.type === 'gas' && <Zap size={18} color={color} />}
                              {hazard.type === 'equipment' && <Wrench size={18} color={color} />}
                              {hazard.type === 'blasting' && <AlertTriangle size={18} color={color} />}
                            </TouchableOpacity>
                          );
                        })}

                        {/* Miners with PPE Status */}
                        {filteredMiners.map(miner => {
                          const pos = coordsToPixels(miner.coordinates);
                          const compliance = calculatePPECompliance(miner.PPEStatus);
                          const isViolation = compliance < 100;
                          
                          return (
                            <TouchableOpacity
                              key={miner.id}
                              style={[
                                styles.minerMarker,
                                {
                                  left: pos.x - 20,
                                  top: pos.y - 20,
                                },
                              ]}
                              onPress={() => openBottomSheet({ type: 'miner', data: miner })}
                            >
                              <View style={styles.minerIcon}>
                                <User size={16} color="#0A84FF" />
                              </View>
                              <View
                                style={[
                                  styles.ppeDot,
                                  {
                                    backgroundColor: isViolation ? '#FF3B30' : '#34C759',
                                  },
                                ]}
                              />
                            </TouchableOpacity>
                          );
                        })}

                        {/* Equipment Hazards */}
                        {filteredEquipment.map(equip => {
                          const pos = coordsToPixels(equip.coordinates);
                          
                          return (
                            <TouchableOpacity
                              key={equip.id}
                              style={[
                                styles.equipmentMarker,
                                {
                                  left: pos.x - 22,
                                  top: pos.y - 22,
                                  borderColor: getRiskLevelColor(equip.riskLevel),
                                },
                              ]}
                              onPress={() => openBottomSheet({ type: 'equipment', data: equip })}
                            >
                              <Wrench size={18} color={getRiskLevelColor(equip.riskLevel)} />
                            </TouchableOpacity>
                          );
                        })}
                      </ImageBackground>
                    </Animated.View>
                  </PanGestureHandler>
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </TapGestureHandler>

          {/* Floating Legend */}
          <View style={styles.legendFloating}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.legendText}>Fire</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#FF2D55' }]} />
              <Text style={styles.legendText}>Crack</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#0A84FF' }]} />
              <Text style={styles.legendText}>Miner</Text>
            </View>
          </View>
        </View>

        {/* Filter Bar */}
        <View style={styles.filterBar}>
          {[
            { type: 'fire' as FilterType, icon: Flame, label: 'Fire', color: '#EF4444' },
            { type: 'crack' as FilterType, icon: AlertTriangle, label: 'Crack', color: '#F59E0B' },
            { type: 'blasting' as FilterType, icon: AlertTriangle, label: 'Blast', color: '#F97316' },
            { type: 'gas' as FilterType, icon: Zap, label: 'Gas', color: '#3B82F6' },
            { type: 'equipment' as FilterType, icon: Wrench, label: 'Equipment', color: '#8B5CF6' },
            { type: 'miners' as FilterType, icon: User, label: 'Miners', color: '#10B981' },
          ].map(({ type, icon: Icon, label, color }) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                activeFilters.has(type) && styles.filterButtonActive,
              ]}
              onPress={() => toggleFilter(type)}
            >
              <View style={[
                styles.filterIconContainer,
                activeFilters.has(type) && { backgroundColor: color + '15' }
              ]}>
                <Icon
                  size={20}
                  color={activeFilters.has(type) ? color : '#9CA3AF'}
                />
              </View>
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilters.has(type) && { color: color },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Sheet */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetHandle}
        >
          <BottomSheetScrollView style={styles.bottomSheetContent}>
            {bottomSheetContent && (
              <>
                {bottomSheetContent.type === 'mlHazard' && (
                  <MLHazardDetail hazard={bottomSheetContent.data as MLHazard} />
                )}
                {bottomSheetContent.type === 'manualHazard' && (
                  <ManualHazardDetail hazard={bottomSheetContent.data as ManualHazard} />
                )}
                {bottomSheetContent.type === 'miner' && (
                  <MinerDetail miner={bottomSheetContent.data as MinerLocation} />
                )}
                {bottomSheetContent.type === 'equipment' && (
                  <EquipmentDetail equipment={bottomSheetContent.data as EquipmentHazard} />
                )}
              </>
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// Bottom Sheet Detail Components
const MLHazardDetail = ({ hazard }: { hazard: MLHazard }) => (
  <View style={styles.detailContainer}>
    <View style={styles.detailHeader}>
      {hazard.hazardType === 'fire' ? (
        <Flame size={32} color="#FF3B30" />
      ) : (
        <AlertTriangle size={32} color="#FF2D55" />
      )}
      <View style={styles.detailHeaderText}>
        <Text style={styles.detailTitle}>
          {hazard.hazardType === 'fire' ? 'Fire Detected' : 'Structural Crack'}
        </Text>
        <Text style={styles.detailSubtitle}>ML Detected Hazard</Text>
      </View>
    </View>

    <View style={[styles.severityBadge, { backgroundColor: getRiskLevelColor(hazard.riskLevel) + '20' }]}>
      <Text style={[styles.severityText, { color: getRiskLevelColor(hazard.riskLevel) }]}>
        {hazard.riskLevel.toUpperCase()}
      </Text>
    </View>

    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Confidence:</Text>
      <Text style={styles.detailValue}>{Math.round(hazard.confidence * 100)}%</Text>
    </View>

    {hazard.severityScore && (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Severity Score:</Text>
        <Text style={styles.detailValue}>{hazard.severityScore.toFixed(2)}%</Text>
      </View>
    )}

    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Detected:</Text>
      <Text style={styles.detailValue}>
        {hazard.timestamp?.toDate().toLocaleString() || 'N/A'}
      </Text>
    </View>

    {hazard.imagePreviewUrl && (
      <View style={styles.previewImageContainer}>
        <Text style={styles.previewImageLabel}>Detection Preview:</Text>
        <Image
          source={{ uri: `data:image/png;base64,${hazard.imagePreviewUrl}` }}
          style={styles.previewImage}
          resizeMode="contain"
        />
      </View>
    )}

    <View style={styles.warningBox}>
      <AlertTriangle size={20} color="#FF3B30" />
      <Text style={styles.warningText}>
        This hazard was automatically detected by AI. Verify immediately.
      </Text>
    </View>
  </View>
);

const ManualHazardDetail = ({ hazard }: { hazard: ManualHazard }) => (
  <View style={styles.detailContainer}>
    <View style={styles.detailHeader}>
      <MapPin size={32} color={getHazardTypeColor(hazard.type)} />
      <View style={styles.detailHeaderText}>
        <Text style={styles.detailTitle}>{hazard.type.toUpperCase()} Hazard</Text>
        <Text style={styles.detailSubtitle}>Manual Report</Text>
      </View>
    </View>

    <View style={[styles.severityBadge, { backgroundColor: getRiskLevelColor(hazard.riskLevel) + '20' }]}>
      <Text style={[styles.severityText, { color: getRiskLevelColor(hazard.riskLevel) }]}>
        {hazard.riskLevel.toUpperCase()} RISK
      </Text>
    </View>

    <Text style={styles.detailDescription}>{hazard.description}</Text>

    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>Causes:</Text>
      {hazard.causes.map((cause, i) => (
        <Text key={i} style={styles.detailListItem}>• {cause}</Text>
      ))}
    </View>

    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>Controls:</Text>
      {hazard.controls.map((control, i) => (
        <Text key={i} style={styles.detailListItem}>• {control}</Text>
      ))}
    </View>

    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>Required PPE:</Text>
      <View style={styles.ppeChipContainer}>
        {hazard.ppeRequired.map((ppe, i) => (
          <View key={i} style={styles.ppeChip}>
            <Text style={styles.ppeChipText}>{ppe}</Text>
          </View>
        ))}
      </View>
    </View>

    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Assigned Officer:</Text>
      <Text style={styles.detailValue}>{hazard.assignedOfficer}</Text>
    </View>

    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Last Inspection:</Text>
      <Text style={styles.detailValue}>
        {hazard.lastInspection?.toDate().toLocaleDateString() || 'N/A'}
      </Text>
    </View>
  </View>
);

const MinerDetail = ({ miner }: { miner: MinerLocation }) => {
  const compliance = calculatePPECompliance(miner.PPEStatus);

  return (
    <View style={styles.detailContainer}>
      <View style={styles.detailHeader}>
        <User size={32} color="#0A84FF" />
        <View style={styles.detailHeaderText}>
          <Text style={styles.detailTitle}>{miner.name}</Text>
          <Text style={styles.detailSubtitle}>{miner.assignedZone}</Text>
        </View>
      </View>

      <View style={[
        styles.statusBadge,
        { backgroundColor: miner.status === 'safe' ? '#34C759' : '#FF3B30' }
      ]}>
        <Text style={styles.statusBadgeText}>
          {miner.status === 'safe' ? 'SAFE' : miner.status === 'missingPPE' ? 'PPE MISSING' : 'IN DANGER'}
        </Text>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>PPE Status ({compliance}%):</Text>
        <View style={styles.ppeStatusGrid}>
          {Object.entries(miner.PPEStatus).map(([item, status]) => (
            <View key={item} style={styles.ppeStatusItem}>
              <View style={[styles.ppeStatusDot, { backgroundColor: status ? '#34C759' : '#FF3B30' }]} />
              <Text style={styles.ppeStatusText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Last Check:</Text>
        <Text style={styles.detailValue}>
          {miner.lastCheck?.toDate().toLocaleString() || 'N/A'}
        </Text>
      </View>

      {miner.department && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Department:</Text>
          <Text style={styles.detailValue}>{miner.department}</Text>
        </View>
      )}

      {miner.shift && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Shift:</Text>
          <Text style={styles.detailValue}>{miner.shift}</Text>
        </View>
      )}
    </View>
  );
};

const EquipmentDetail = ({ equipment }: { equipment: EquipmentHazard }) => (
  <View style={styles.detailContainer}>
    <View style={styles.detailHeader}>
      <Wrench size={32} color={getRiskLevelColor(equipment.riskLevel)} />
      <View style={styles.detailHeaderText}>
        <Text style={styles.detailTitle}>{equipment.name}</Text>
        <Text style={styles.detailSubtitle}>{equipment.equipmentType || 'Equipment'}</Text>
      </View>
    </View>

    <View style={[styles.statusBadge, { backgroundColor: getRiskLevelColor(equipment.riskLevel) + '20' }]}>
      <Text style={[styles.statusBadgeText, { color: getRiskLevelColor(equipment.riskLevel) }]}>
        {equipment.status.toUpperCase()}
      </Text>
    </View>

    <Text style={styles.detailDescription}>{equipment.description}</Text>

    {equipment.serialNumber && (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Serial Number:</Text>
        <Text style={styles.detailValue}>{equipment.serialNumber}</Text>
      </View>
    )}

    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Risk Level:</Text>
      <View style={[styles.riskBadge, { backgroundColor: getRiskLevelColor(equipment.riskLevel) + '20' }]}>
        <Text style={[styles.riskBadgeText, { color: getRiskLevelColor(equipment.riskLevel) }]}>
          {equipment.riskLevel.toUpperCase()}
        </Text>
      </View>
    </View>

    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Assigned Officer:</Text>
      <Text style={styles.detailValue}>{equipment.assignedOfficer}</Text>
    </View>

    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Last Inspection:</Text>
      <Text style={styles.detailValue}>
        {equipment.lastInspection?.toDate().toLocaleDateString() || 'N/A'}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27', // Dark blue background like Safety Officer dashboard
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C6C70',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1F3A', // Dark blue-gray
    borderBottomWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  topBarButton: {
    padding: 4,
    position: 'relative',
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mapWrapper: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#1A1F3A',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mapContainer: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
  },
  mapBackground: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
  },
  mapBackgroundImage: {
    borderRadius: 0,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // Lighter overlay to show mine detail
  },
  fireHazardBox: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireHazardInner: {
    backgroundColor: 'rgba(255, 59, 48, 0.35)',
    borderWidth: 2,
    borderColor: '#FF3B30',
    borderRadius: 40,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confidenceText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },
  crackHazardMarker: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crackSeverityText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  manualHazardMarker: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minerMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  minerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ppeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  equipmentMarker: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 214, 10, 0.3)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendFloating: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(26, 31, 58, 0.95)', // Dark blue with transparency
    backdropFilter: 'blur(10px)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  filterButton: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#e5e3ecff',
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  filterButtonActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  filterIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#d5ddecff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e9ecf2ff',
    flex: 1,
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
  },
  detailContainer: {
    paddingTop: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  detailHeaderText: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  detailSubtitle: {
    fontSize: 14,
    color: '#6C6C70',
    marginTop: 2,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  severityText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  detailLabel: {
    fontSize: 15,
    color: '#6C6C70',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  detailDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1D1D1F',
    marginBottom: 16,
  },
  detailSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  detailListItem: {
    fontSize: 14,
    color: '#6C6C70',
    marginBottom: 4,
    lineHeight: 20,
  },
  ppeChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  ppeChip: {
    backgroundColor: '#0A84FF' + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ppeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A84FF',
  },
  previewImageContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  previewImageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginTop: 16,
    backgroundColor: '#FF3B30' + '10',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ppeStatusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  ppeStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '45%',
  },
  ppeStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ppeStatusText: {
    fontSize: 14,
    color: '#1D1D1F',
    textTransform: 'capitalize',
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riskBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetHandle: {
    backgroundColor: '#D1D5DB',
    width: 40,
    height: 4,
  },
});
