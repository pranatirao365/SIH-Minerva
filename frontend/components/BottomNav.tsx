import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Animated } from 'react-native';
import { Home, MessageCircle, User, Bell, Briefcase, Shield, HardHat, Trophy, Video, AlertTriangle } from './Icons';
import { Role } from '../constants/roles';
import { translator } from '../services/translator';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/styles';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavProps {
  role: Role;
  activeTab: string;
  onTabPress: (tab: string) => void;
}

interface MinerFooterProps {
  activeTab: 'home' | 'training' | 'reels' | 'profile';
}

export const MinerFooter: React.FC<MinerFooterProps> = ({ activeTab }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [scaleAnims] = React.useState({
    home: new Animated.Value(1),
    training: new Animated.Value(1),
    report: new Animated.Value(1),
    reels: new Animated.Value(1),
    profile: new Animated.Value(1),
  });

  const handleNavigation = (tab: string, route: string) => {
    router.push(route);
  };

  const handlePressIn = (tab: keyof typeof scaleAnims) => {
    Animated.spring(scaleAnims[tab], {
      toValue: 0.94,
      useNativeDriver: true,
      tension: 150,
      friction: 5,
    }).start();
  };

  const handlePressOut = (tab: keyof typeof scaleAnims) => {
    Animated.spring(scaleAnims[tab], {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 5,
    }).start();
  };

  return (
    <View style={[styles.footerWrapper, { paddingBottom: insets.bottom }]}>
      {/* Circular Center Button - Overlapping 50% */}
      <Animated.View style={[styles.centerButtonContainer, { transform: [{ scale: scaleAnims.report }] }]}>
        <TouchableOpacity
          style={styles.centerButton}
          onPress={() => handleNavigation('report', '/miner/IncidentReport')}
          onPressIn={() => handlePressIn('report')}
          onPressOut={() => handlePressOut('report')}
          activeOpacity={0.9}
        >
          <View style={styles.centerButtonInner}>
            <AlertTriangle size={36} color="#FFF" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.footerContainer}>
        {/* Tab 1: Home */}
        <Animated.View style={[styles.tabWrapper, { transform: [{ scale: scaleAnims.home }] }]}>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handleNavigation('home', '/miner/MinerHome')}
            onPressIn={() => handlePressIn('home')}
            onPressOut={() => handlePressOut('home')}
            activeOpacity={1}
          >
            <View style={[styles.iconContainer, activeTab === 'home' && styles.activeIconContainer]}>
              <Home size={22} color={activeTab === 'home' ? COLORS.primary : COLORS.textMuted} />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
              Home
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Tab 2: Training */}
        <Animated.View style={[styles.tabWrapper, { transform: [{ scale: scaleAnims.training }] }]}>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handleNavigation('training', '/miner/TrainingModule')}
            onPressIn={() => handlePressIn('training')}
            onPressOut={() => handlePressOut('training')}
            activeOpacity={1}
          >
            <View style={[styles.iconContainer, activeTab === 'training' && styles.activeIconContainer]}>
              <Trophy size={22} color={activeTab === 'training' ? COLORS.primary : COLORS.textMuted} />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'training' && styles.tabLabelActive]}>
              Training
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Center Spacer for Button */}
        <View style={styles.centerSpacer} />

        {/* Tab 3: Reels */}
        <Animated.View style={[styles.tabWrapper, { transform: [{ scale: scaleAnims.reels }] }]}>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handleNavigation('reels', '/miner/Reels')}
            onPressIn={() => handlePressIn('reels')}
            onPressOut={() => handlePressOut('reels')}
            activeOpacity={1}
          >
            <View style={[styles.iconContainer, activeTab === 'reels' && styles.activeIconContainer]}>
              <Video size={22} color={activeTab === 'reels' ? COLORS.primary : COLORS.textMuted} />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'reels' && styles.tabLabelActive]}>
              Reels
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Tab 4: Profile */}
        <Animated.View style={[styles.tabWrapper, { transform: [{ scale: scaleAnims.profile }] }]}>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handleNavigation('profile', '/miner/Profile')}
            onPressIn={() => handlePressIn('profile')}
            onPressOut={() => handlePressOut('profile')}
            activeOpacity={1}
          >
            <View style={[styles.iconContainer, activeTab === 'profile' && styles.activeIconContainer]}>
              <User size={22} color={activeTab === 'profile' ? COLORS.primary : COLORS.textMuted} />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
              Profile
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  tabWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 60,
    minHeight: 44,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  activeIconContainer: {
    backgroundColor: COLORS.primary + '15',
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  centerSpacer: {
    flex: 1,
  },
  centerButtonContainer: {
    position: 'absolute',
    top: -30,
    left: '50%',
    marginLeft: -37.5,
    zIndex: 100,
  },
  centerButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonInner: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: COLORS.destructive,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.destructive,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 20,
    borderWidth: 5,
    borderColor: COLORS.card,
  },
});

export const BottomNav: React.FC<BottomNavProps> = ({ role, activeTab, onTabPress }) => {
  const tabs = getTabsForRole(role);

  return (
    <View className="bg-neutral-900 border-t border-border flex-row">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;
        const Icon = tab.icon;
        
        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => onTabPress(tab.name)}
            className="flex-1 items-center justify-center py-3"
          >
            <Icon
              size={24}
              color={isActive ? '#FF6B00' : '#A3A3A3'}
            />
            <Text
              className={`text-xs mt-1 ${isActive ? 'text-primary' : 'text-neutral-400'}`}
            >
              {translator.translate(tab.label)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

function getTabsForRole(role: Role) {
  const commonTabs = [
    { name: 'home', label: 'home', icon: Home },
    { name: 'chat', label: 'chat', icon: MessageCircle },
    { name: 'profile', label: 'profile', icon: User },
  ];

  switch (role) {
    case 'miner':
      return [
        { name: 'home', label: 'home', icon: HardHat },
        { name: 'notifications', label: 'notifications', icon: Bell },
        { name: 'chat', label: 'chat', icon: MessageCircle },
        { name: 'profile', label: 'profile', icon: User },
      ];
    case 'supervisor':
      return [
        { name: 'home', label: 'home', icon: Home },
        { name: 'tasks', label: 'Tasks', icon: Briefcase },
        { name: 'chat', label: 'chat', icon: MessageCircle },
        { name: 'profile', label: 'profile', icon: User },
      ];
    case 'safety-officer':
      return [
        { name: 'home', label: 'home', icon: Shield },
        { name: 'videos', label: 'Videos', icon: Bell },
        { name: 'chat', label: 'chat', icon: MessageCircle },
        { name: 'profile', label: 'profile', icon: User },
      ];
    case 'engineer':
      return [
        { name: 'home', label: 'home', icon: Home },
        { name: 'monitoring', label: 'Monitor', icon: Bell },
        { name: 'chat', label: 'chat', icon: MessageCircle },
        { name: 'profile', label: 'profile', icon: User },
      ];
    default:
      return commonTabs;
  }
}
