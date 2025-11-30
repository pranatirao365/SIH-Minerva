import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, ArrowLeft, MapPin } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { generateHeatMapData } from '../../services/supervisorEnhancements';

interface HazardZone {
  id: string;
  zoneName: string;
  coordinates: { x: number; y: number };
  hazardLevel: 'low' | 'medium' | 'high' | 'critical';
  density: number;
  incidents: number;
  lastIncident: string;
  hazardTypes: string[];
}

const GRID_SIZE = 6;
const screenWidth = Dimensions.get('window').width - 32;
const cellSize = screenWidth / GRID_SIZE;

export default function HazardZoneHeatMap() {
  const router = useRouter();
  const [zones, setZones] = useState<HazardZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedZone, setSelectedZone] = useState<HazardZone | null>(null);
  const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  // Mock data
  const mockZones: HazardZone[] = [
    {
      id: '1',
      zoneName: 'Zone A1',
      coordinates: { x: 0, y: 0 },
      hazardLevel: 'low',
      density: 15,
      incidents: 2,
      lastIncident: '3 days ago',
      hazardTypes: ['Dust', 'Noise'],
    },
    {
      id: '2',
      zoneName: 'Zone A2',
      coordinates: { x: 1, y: 0 },
      hazardLevel: 'medium',
      density: 45,
      incidents: 5,
      lastIncident: '12 hrs ago',
      hazardTypes: ['Gas', 'Dust'],
    },
    {
      id: '3',
      zoneName: 'Zone A3',
      coordinates: { x: 2, y: 0 },
      hazardLevel: 'high',
      density: 72,
      incidents: 8,
      lastIncident: '3 hrs ago',
      hazardTypes: ['Gas', 'Temperature', 'Structural'],
    },
    {
      id: '4',
      zoneName: 'Zone A4',
      coordinates: { x: 3, y: 0 },
      hazardLevel: 'critical',
      density: 95,
      incidents: 12,
      lastIncident: '30 mins ago',
      hazardTypes: ['Gas', 'Fire', 'Structural'],
    },
    {
      id: '5',
      zoneName: 'Zone B1',
      coordinates: { x: 0, y: 1 },
      hazardLevel: 'low',
      density: 20,
      incidents: 3,
      lastIncident: '5 days ago',
      hazardTypes: ['Noise'],
    },
    {
      id: '6',
      zoneName: 'Zone B2',
      coordinates: { x: 1, y: 1 },
      hazardLevel: 'medium',
      density: 50,
      incidents: 6,
      lastIncident: '1 day ago',
      hazardTypes: ['Dust', 'Gas'],
    },
    {
      id: '7',
      zoneName: 'Zone C3',
      coordinates: { x: 2, y: 2 },
      hazardLevel: 'high',
      density: 80,
      incidents: 10,
      lastIncident: '6 hrs ago',
      hazardTypes: ['Gas', 'Temperature'],
    },
    {
      id: '8',
      zoneName: 'Zone D4',
      coordinates: { x: 3, y: 3 },
      hazardLevel: 'low',
      density: 18,
      incidents: 1,
      lastIncident: '7 days ago',
      hazardTypes: ['Dust'],
    },
  ];

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    setLoading(true);
    try {
      const data = await generateHeatMapData(24);
      setZones(data);
    } catch (error) {
      console.error('Error loading hazard zones:', error);
      setZones(mockZones);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadZones();
    setRefreshing(false);
  };

  const getHazardColor = (level: string, density: number) => {
    switch (level) {
      case 'low':
        return `rgba(16, 185, 129, ${density / 100})`;
      case 'medium':
        return `rgba(245, 158, 11, ${density / 100})`;
      case 'high':
        return `rgba(239, 68, 68, ${density / 100})`;
      case 'critical':
        return `rgba(153, 27, 27, ${Math.max(density / 100, 0.8)})`;
      default:
        return '#E5E7EB';
    }
  };

  const filteredZones = zones.filter(zone =>
    filter === 'all' ? true : zone.hazardLevel === filter
  );

  const lowCount = zones.filter(z => z.hazardLevel === 'low').length;
  const mediumCount = zones.filter(z => z.hazardLevel === 'medium').length;
  const highCount = zones.filter(z => z.hazardLevel === 'high').length;
  const criticalCount = zones.filter(z => z.hazardLevel === 'critical').length;

  const renderGrid = () => {
    const grid = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null));

    zones.forEach(zone => {
      const { x, y } = zone.coordinates;
      if (x < GRID_SIZE && y < GRID_SIZE) {
        grid[y][x] = zone;
      }
    });

    return grid.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.gridRow}>
        {row.map((zone, colIndex) => (
          <TouchableOpacity
            key={`${rowIndex}-${colIndex}`}
            style={[
              styles.gridCell,
              {
                width: cellSize,
                height: cellSize,
                backgroundColor: zone
                  ? getHazardColor(zone.hazardLevel, zone.density)
                  : '#F3F4F6',
              },
            ]}
            onPress={() => zone && setSelectedZone(zone)}
          >
            {zone && (
              <View style={styles.cellContent}>
                <Text style={styles.cellText}>{zone.zoneName}</Text>
                {zone.hazardLevel === 'critical' && (
                  <AlertTriangle size={16} color="#FFFFFF" />
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    ));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading heat map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hazard Zone Heat Map</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{lowCount}</Text>
            <Text style={styles.statLabel}>Low Risk</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{mediumCount}</Text>
            <Text style={styles.statLabel}>Medium</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{highCount}</Text>
            <Text style={styles.statLabel}>High</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#991B1B' }]}>{criticalCount}</Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
        </View>

        {/* Heat Map Grid */}
        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>Mine Layout</Text>
          <View style={styles.gridContainer}>{renderGrid()}</View>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.sectionTitle}>Legend</Text>
          <View style={styles.legendItems}>
            {[
              { level: 'low', label: 'Low Risk', color: '#10B981' },
              { level: 'medium', label: 'Medium Risk', color: '#F59E0B' },
              { level: 'high', label: 'High Risk', color: '#EF4444' },
              { level: 'critical', label: 'Critical', color: '#991B1B' },
            ].map(item => (
              <View key={item.level} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Selected Zone Details */}
        {selectedZone && (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <MapPin size={24} color={COLORS.primary} />
              <Text style={styles.detailsTitle}>{selectedZone.zoneName}</Text>
              <TouchableOpacity onPress={() => setSelectedZone(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Hazard Level:</Text>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: getHazardColor(selectedZone.hazardLevel, 100) },
                ]}
              >
                <Text style={styles.levelText}>
                  {selectedZone.hazardLevel.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Density Score:</Text>
              <Text style={styles.detailValue}>{selectedZone.density}%</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Incidents:</Text>
              <Text style={styles.detailValue}>{selectedZone.incidents}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Incident:</Text>
              <Text style={styles.detailValue}>{selectedZone.lastIncident}</Text>
            </View>

            <View style={styles.hazardTypesContainer}>
              <Text style={styles.detailLabel}>Hazard Types:</Text>
              <View style={styles.hazardTypesList}>
                {selectedZone.hazardTypes.map((type, index) => (
                  <View key={index} style={styles.hazardTypeChip}>
                    <Text style={styles.hazardTypeText}>{type}</Text>
                  </View>
                ))}
              </View>
            </View>

            {selectedZone.hazardLevel === 'critical' && (
              <View style={styles.warningBanner}>
                <AlertTriangle size={16} color="#991B1B" />
                <Text style={styles.warningText}>
                  Restrict access to this zone immediately
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Zone List */}
        <View style={styles.zoneListContainer}>
          <Text style={styles.sectionTitle}>All Zones</Text>
          {zones
            .sort((a, b) => b.density - a.density)
            .map(zone => (
              <TouchableOpacity
                key={zone.id}
                style={styles.zoneCard}
                onPress={() => setSelectedZone(zone)}
              >
                <View style={styles.zoneHeader}>
                  <View style={styles.zoneHeaderLeft}>
                    <View
                      style={[
                        styles.zoneIndicator,
                        { backgroundColor: getHazardColor(zone.hazardLevel, zone.density) },
                      ]}
                    />
                    <View>
                      <Text style={styles.zoneName}>{zone.zoneName}</Text>
                      <Text style={styles.zoneSubtext}>{zone.incidents} incidents</Text>
                    </View>
                  </View>
                  <View style={styles.densityBadge}>
                    <Text style={styles.densityText}>{zone.density}%</Text>
                  </View>
                </View>
                <View style={styles.zoneFooter}>
                  <Text style={styles.lastIncidentText}>Last: {zone.lastIncident}</Text>
                  {zone.hazardLevel === 'critical' && (
                    <View style={styles.criticalTag}>
                      <AlertTriangle size={12} color="#991B1B" />
                      <Text style={styles.criticalTagText}>CRITICAL</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  mapContainer: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  gridContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellContent: {
    alignItems: 'center',
  },
  cellText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 2,
  },
  legendContainer: {
    padding: 16,
    paddingTop: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  detailsCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  detailsTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.textMuted,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  hazardTypesContainer: {
    marginTop: 8,
  },
  hazardTypesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  hazardTypeChip: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  hazardTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#991B1B' + '20',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#991B1B',
  },
  warningText: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '600',
  },
  zoneListContainer: {
    padding: 16,
    paddingTop: 8,
  },
  zoneCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  zoneIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  zoneSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  densityBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  densityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  zoneFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastIncidentText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  criticalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#991B1B' + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  criticalTagText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#991B1B',
  },
});
