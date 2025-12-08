import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Icons } from './Icons';
import { useRoleStore } from '../hooks/useRoleStore';
import { COLORS } from '../constants/styles';

interface AppHeaderProps {
  userName?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
}

export default function AppHeader({ 
  userName,
  showBack = false,
  showNotifications = true,
  showProfile = true 
}: AppHeaderProps) {
  const router = useRouter();
  const { user, logout } = useRoleStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
    router.replace('/auth/PhoneLogin' as any);
  };

  const handleProfilePress = () => {
    setShowProfileMenu(false);
    router.push('/profile/ProfileScreen' as any);
  };

  return (
    <View style={styles.header}>
      {/* Left side - Welcome & Name */}
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icons.ChevronLeft size={22} color="#A1A1AA" />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.welcomeText}>Welcome</Text>
          <Text style={styles.userNameText}>{userName || user.name || 'User'}</Text>
        </View>
      </View>

      {/* Right side - Notification & Profile */}
      <View style={styles.rightSection}>
        {showNotifications && (
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/miner/NotificationScreen' as any)}
          >
            <Icons.Bell size={22} color="#A1A1AA" />
            {/* Notification badge */}
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        )}

        {showProfile && (
          <>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setShowProfileMenu(true)}
            >
              <Icons.User size={22} color="#A1A1AA" />
            </TouchableOpacity>

            {/* Profile Menu Modal */}
            <Modal
              visible={showProfileMenu}
              transparent
              animationType="fade"
              onRequestClose={() => setShowProfileMenu(false)}
            >
              <Pressable 
                style={styles.modalOverlay}
                onPress={() => setShowProfileMenu(false)}
              >
                <View style={styles.menuContainer}>
                  <View style={styles.menuHeader}>
                    <View style={styles.userAvatar}>
                      <Icons.User size={24} color="#FFF" />
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name || 'User'}</Text>
                      <Text style={styles.userRole}>{user.role || 'Role'}</Text>
                    </View>
                  </View>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={handleProfilePress}
                  >
                    <Icons.User size={18} color="#FCD34D" />
                    <Text style={styles.menuItemText}>View Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.menuItem, styles.logoutItem]}
                    onPress={handleLogout}
                  >
                    <Icons.LogOut size={18} color="#EF4444" />
                    <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  titleContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 15,
    color: '#71717A',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FAFAFA',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 12,
  },
  menuContainer: {
    backgroundColor: '#1C1917',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FCD34D',
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 11,
    color: '#A1A1AA',
    textTransform: 'capitalize',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#3F3F46',
    marginHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    marginTop: 8,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  logoutItem: {
    marginBottom: 8,
  },
  logoutText: {
    color: '#EF4444',
  },
});
