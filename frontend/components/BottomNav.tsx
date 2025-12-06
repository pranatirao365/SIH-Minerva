import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Home, MessageCircle, User, Bell, Briefcase, Shield, HardHat } from './Icons';
import { Role } from '../constants/roles';
import { translator } from '../services/translator';

interface BottomNavProps {
  role: Role;
  activeTab: string;
  onTabPress: (tab: string) => void;
}

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
