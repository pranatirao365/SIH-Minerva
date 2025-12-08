import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icons } from '../../components/Icons';
import AppHeader from '../../components/AppHeader';
import { useRoleStore } from '../../hooks/useRoleStore';

const { width } = Dimensions.get('window');

// Mining-themed training worlds
const TRAINING_WORLDS = [
  {
    id: 1,
    name: 'Hazard Spotting',
    icon: '⛏️',
    color: '#D97706',
    gradient: ['#854D0E', '#D97706', '#92400E'],
    description: 'Identify dangers in the dark tunnels',
    subtitle: 'Underground Detection',
    levels: 5,
    depth: '50m',
  },
  {
    id: 2,
    name: 'Equipment Handling',
    icon: '⚙️',
    color: '#0369A1',
    gradient: ['#0C4A6E', '#0369A1', '#075985'],
    description: 'Master underground machinery safely',
    subtitle: 'Tool Mastery',
    levels: 5,
    depth: '100m',
  },
  {
    id: 3,
    name: 'Situational Safety',
    icon: '🛡️',
    color: '#047857',
    gradient: ['#064E3B', '#047857', '#065F46'],
    description: 'Survive cave-ins and gas leaks',
    subtitle: 'Critical Thinking',
    levels: 5,
    depth: '150m',
  },
  {
    id: 4,
    name: 'Emergency Response',
    icon: '🚨',
    color: '#DC2626',
    gradient: ['#7F1D1D', '#DC2626', '#991B1B'],
    description: 'Escape routes & rescue protocols',
    subtitle: 'Life or Death',
    levels: 5,
    depth: '200m',
  },
  {
    id: 5,
    name: 'Safety Mindset',
    icon: '💎',
    color: '#7C3AED',
    gradient: ['#4C1D95', '#7C3AED', '#5B21B6'],
    description: 'Think like a veteran miner',
    subtitle: 'Expert Knowledge',
    levels: 5,
    depth: '250m',
  },
];

export default function TrainingModule() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [completedLevels, setCompletedLevels] = useState<{ [key: number]: number[] }>({});
  const [totalXP, setTotalXP] = useState(2450);
  const [streak, setStreak] = useState(7);

  const handleLevelPress = (worldId: number, level: number) => {
    const isUnlocked = level === 1 || completedLevels[worldId]?.includes(level - 1);
    if (isUnlocked) {
      router.push({
        pathname: '/miner/TrainingLevel',
        params: { worldId, levelNumber: level },
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Dark underground gradient background */}
      <LinearGradient
        colors={['#0F0F0F', '#1C1917', '#292524', '#1C1917']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Coal dust texture overlay */}
      <View style={[StyleSheet.absoluteFill, styles.textureOverlay]} />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* App Header with Notification & Profile */}
        <AppHeader 
          userName={user.name || 'Miner'}
          showBack={true}
          showNotifications={true}
          showProfile={true}
        />
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statContainer}>
              <Icons.Award size={12} color="#FCD34D" />
              <Text style={styles.statValue}>{totalXP}</Text>
            </View>
            <View style={styles.statContainer}>
              <Text style={styles.flameIcon}>🔥</Text>
              <Text style={styles.statValue}>{streak}</Text>
            </View>
          </View>

          {/* Training Zones with Mining Theme */}
          {TRAINING_WORLDS.map((world, worldIndex) => (
            <View key={world.id} style={styles.worldContainer}>
              {/* Mining Zone Header - Merged with Depth Indicator */}
              <LinearGradient
                colors={world.gradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.worldHeader}
              >
                {/* Compact world info */}
                <View style={styles.worldRow}>
                  <View style={styles.worldIconBox}>
                    <Text style={styles.worldIcon}>{world.icon}</Text>
                  </View>
                  
                  <View style={styles.worldInfoCompact}>
                    <Text style={styles.worldName}>{world.name}</Text>
                    <Text style={styles.worldDesc}>{world.description}</Text>
                    
                    {/* Inline depth and progress */}
                    <View style={styles.inlineStats}>
                      <View style={styles.depthBadgeInline}>
                        <Text style={styles.depthIconSmall}>↓</Text>
                        <Text style={styles.depthValueSmall}>{world.depth}</Text>
                      </View>
                      <View style={styles.progressBadge}>
                        <Icons.CheckCircle size={10} color="#10B981" />
                        <Text style={styles.progressTextSmall}>
                          {completedLevels[world.id]?.length || 0}/{world.levels}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </LinearGradient>

              {/* Connecting Bridge/Shaft */}
              <View style={styles.shaftConnector}>
                <View style={[styles.shaftLine, { backgroundColor: world.color }]} />
                <View style={styles.shaftSupports}>
                  {[...Array(3)].map((_, i) => (
                    <View key={i} style={styles.shaftSupport} />
                  ))}
                </View>
              </View>

              {/* Mining Cart Path - Tunnel Rails */}
              <View style={styles.levelPath}>
                {Array.from({ length: world.levels }).map((_, levelIndex) => {
                  const level = levelIndex + 1;
                  const isCompleted = completedLevels[world.id]?.includes(level);
                  const isUnlocked = level === 1 || completedLevels[world.id]?.includes(level - 1);
                  
                  // Zigzag tunnel path with extra spacing for first level
                  const xOffset = levelIndex % 2 === 0 ? 40 : width - 110;
                  const yPosition = levelIndex === 0 ? 30 : (levelIndex * 140) + 30;

                  return (
                    <View key={level} style={[styles.levelWrapper, { top: yPosition }]}>
                      {/* Tunnel Rail Track */}
                      {levelIndex > 0 && (
                        <>
                          <View
                            style={[
                              styles.railTrack,
                              {
                                left: levelIndex % 2 === 0 ? 65 : width - 145,
                                width: Math.abs(width - 210),
                                borderColor: isUnlocked ? `${world.color}80` : '#3F3F46',
                                transform: [{ rotate: levelIndex % 2 === 0 ? '25deg' : '-25deg' }],
                              },
                            ]}
                          >
                            {/* Railway ties */}
                            <View style={styles.railTiesContainer}>
                              {[...Array(4)].map((_, i) => (
                                <View
                                  key={i}
                                  style={[
                                    styles.railTie,
                                    { backgroundColor: isUnlocked ? '#52525B' : '#27272A' },
                                  ]}
                                />
                              ))}
                            </View>
                          </View>
                        </>
                      )}

                      {/* Mining Cart Station Node */}
                      <TouchableOpacity
                        onPress={() => handleLevelPress(world.id, level)}
                        disabled={!isUnlocked}
                        activeOpacity={0.7}
                        style={[
                          styles.miningCart,
                          { left: xOffset },
                          !isUnlocked && styles.cartLocked,
                        ]}
                      >
                        {/* Cart body with gradient */}
                        <LinearGradient
                          colors={
                            isCompleted
                              ? ['#10B981', '#059669', '#047857']
                              : isUnlocked
                              ? [world.color, world.gradient[1], world.gradient[0]]
                              : ['#3F3F46', '#27272A', '#18181B']
                          }
                          style={styles.cartBody}
                        >
                          {/* Headlamp beam for active level */}
                          {isUnlocked && !isCompleted && (
                            <View style={[styles.headlampBeam, { backgroundColor: `${world.color}20` }]} />
                          )}
                          
                          {/* Cart content */}
                          <View style={styles.cartContent}>
                            {isCompleted ? (
                              <>
                                <Icons.CheckCircle size={28} color="#FFF" />
                                <Text style={styles.gemIcon}>💎</Text>
                              </>
                            ) : isUnlocked ? (
                              <>
                                <Text style={styles.levelNumber}>{level}</Text>
                                <View style={styles.pickaxeIcon}>
                                  <Text style={styles.pickaxe}>⛏</Text>
                                </View>
                              </>
                            ) : (
                              <>
                                <Icons.Lock size={20} color="#71717A" />
                                <Text style={styles.lockedText}>Locked</Text>
                              </>
                            )}
                          </View>
                          
                          {/* Metal rivets */}
                          <View style={styles.cartRivets}>
                            <View style={styles.rivet} />
                            <View style={styles.rivet} />
                          </View>
                        </LinearGradient>
                        
                        {/* Cart wheels on rails */}
                        <View style={styles.cartWheels}>
                          <View style={[styles.wheel, { backgroundColor: isUnlocked ? '#52525B' : '#27272A' }]}>
                            <View style={styles.wheelSpoke} />
                          </View>
                          <View style={[styles.wheel, { backgroundColor: isUnlocked ? '#52525B' : '#27272A' }]}>
                            <View style={styles.wheelSpoke} />
                          </View>
                        </View>
                        
                        {/* Glowing aura for active level */}
                        {isUnlocked && !isCompleted && (
                          <View style={[styles.activeGlow, { backgroundColor: world.color }]} />
                        )}
                      </TouchableOpacity>

                      {/* Station Signboard */}
                      <View
                        style={[
                          styles.stationSign,
                          {
                            left: xOffset < width / 2 ? xOffset + 85 : xOffset - 195,
                          },
                        ]}
                      >
                        <View style={[styles.signBoard, { borderLeftColor: world.color }]}>
                          <View style={styles.signPost} />
                          <View style={styles.signContent}>
                            <Text style={styles.stationNumber}>STATION {level}</Text>
                            <View style={styles.signStatus}>
                              {isCompleted ? (
                                <>
                                  <Icons.CheckCircle size={12} color="#10B981" />
                                  <Text style={styles.signTextCompleted}>Cleared</Text>
                                </>
                              ) : isUnlocked ? (
                                <>
                                  <View style={styles.activeDot} />
                                  <Text style={styles.signTextActive}>ACTIVE</Text>
                                </>
                              ) : (
                                <>
                                  <Icons.Lock size={10} color="#71717A" />
                                  <Text style={styles.signTextLocked}>Locked</Text>
                                </>
                              )}
                            </View>
                            {isCompleted && (
                              <Text style={styles.signXp}>⭐ +150 XP</Text>
                            )}
                          </View>
                          {/* Warning stripes */}
                          <View style={styles.warningStripes}>
                            <View style={[styles.stripe, { backgroundColor: world.color }]} />
                            <View style={styles.stripe} />
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  safeArea: {
    flex: 1,
  },
  textureOverlay: {
    backgroundColor: '#000',
    opacity: 0.4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  
  // Stats Bar below header
  statsBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#27272A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  statValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FCD34D',
  },
  flameIcon: {
    fontSize: 11,
  },
  
  // World Container - Mining Zone
  worldContainer: {
    marginHorizontal: 12,
    marginTop: 20,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1C1917',
    borderWidth: 2,
    borderColor: '#3F3F46',
    elevation: 8,
  },
  
  // World Header - Compact & Merged
  worldHeader: {
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  depthBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  depthIcon: {
    fontSize: 10,
    color: '#FCD34D',
    fontWeight: '900',
  },
  depthValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },
  worldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  worldIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(252, 211, 77, 0.3)',
  },
  worldIcon: {
    fontSize: 28,
  },
  worldInfoCompact: {
    flex: 1,
  },
  worldName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 2,
  },
  worldDesc: {
    fontSize: 11,
    color: '#D4D4D8',
    lineHeight: 14,
    marginBottom: 6,
  },
  inlineStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  depthBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  depthIconSmall: {
    fontSize: 9,
    color: '#FCD34D',
    fontWeight: '900',
  },
  depthValueSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  progressTextSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  
  // Shaft Connector - Bridge between sections
  shaftConnector: {
    height: 40,
    backgroundColor: '#18181B',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#3F3F46',
    position: 'relative',
    overflow: 'hidden',
  },
  shaftLine: {
    position: 'absolute',
    left: '50%',
    marginLeft: -2,
    width: 4,
    height: '100%',
    opacity: 0.6,
  },
  shaftSupports: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 20,
  },
  shaftSupport: {
    width: 2,
    height: 16,
    backgroundColor: '#52525B',
    transform: [{ rotate: '45deg' }],
  },
  
  // Mining Cart Path
  levelPath: {
    minHeight: 780,
    position: 'relative',
    paddingVertical: 20,
    paddingBottom: 100,
    paddingHorizontal: 10,
    backgroundColor: '#18181B',
  },
  levelWrapper: {
    position: 'absolute',
    width: '100%',
  },
  
  // Railway Track
  railTrack: {
    position: 'absolute',
    height: 6,
    top: 35,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    backgroundColor: '#27272A',
  },
  railTiesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    height: '100%',
    alignItems: 'center',
  },
  railTie: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  
  // Mining Cart
  miningCart: {
    position: 'absolute',
    width: 75,
    height: 75,
  },
  cartLocked: {
    opacity: 0.5,
  },
  cartBody: {
    width: 75,
    height: 60,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  headlampBeam: {
    position: 'absolute',
    width: 120,
    height: 120,
    left: -20,
    top: -30,
    opacity: 0.5,
    transform: [{ rotate: '45deg' }],
  },
  cartContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  pickaxeIcon: {
    position: 'absolute',
    bottom: 4,
    right: 6,
  },
  pickaxe: {
    fontSize: 14,
  },
  gemIcon: {
    fontSize: 18,
    position: 'absolute',
    top: 2,
    right: 4,
  },
  lockedText: {
    fontSize: 9,
    color: '#71717A',
    fontWeight: '700',
    marginTop: 4,
  },
  cartRivets: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    gap: 50,
  },
  rivet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cartWheels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 2,
  },
  wheel: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelSpoke: {
    width: 8,
    height: 2,
    backgroundColor: '#18181B',
    borderRadius: 1,
  },
  activeGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    top: -8,
    left: -8,
    borderRadius: 45,
    opacity: 0.25,
  },
  
  // Station Signboard
  stationSign: {
    position: 'absolute',
    top: 20,
  },
  signBoard: {
    backgroundColor: '#27272A',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderRightColor: '#3F3F46',
    borderTopColor: '#3F3F46',
    borderBottomColor: '#18181B',
    minWidth: 130,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  signPost: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 4,
    height: '100%',
    backgroundColor: 'rgba(252, 211, 77, 0.3)',
  },
  signContent: {
    padding: 10,
  },
  stationNumber: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  signStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  signTextCompleted: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '700',
  },
  signTextActive: {
    fontSize: 10,
    color: '#FCD34D',
    fontWeight: '700',
  },
  signTextLocked: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: '600',
  },
  signXp: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '800',
  },
  warningStripes: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 8,
    height: '100%',
    gap: 2,
  },
  stripe: {
    flex: 1,
    backgroundColor: '#18181B',
  },
});
