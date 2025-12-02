import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AlertTriangle,
    ArrowLeft,
    Bell,
    CheckCircle,
    Clock,
    Shield,
    Trash2,
    Video
} from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';

interface Notification {
  id: string;
  type: 'alert' | 'video' | 'safety' | 'general' | 'emergency';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionUrl?: string;
  fromUser?: string;
  fromRole?: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const key = `notifications_${user.id}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (stored) {
        const parsedNotifications = JSON.parse(stored);
        setNotifications(parsedNotifications);
      } else {
        // Sample notifications for demo
        const sampleNotifications: Notification[] = [
          {
            id: '1',
            type: 'emergency',
            title: '🚨 Emergency Alert',
            message: 'Emergency evacuation drill scheduled for tomorrow at 10:00 AM. Please report to designated assembly point.',
            timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
            read: false,
            priority: 'critical',
            fromUser: 'Safety Officer',
            fromRole: 'safety_officer',
          },
          {
            id: '2',
            type: 'video',
            title: '📹 New Training Video Assigned',
            message: 'You have been assigned a mandatory training video: "Gas Detection and Safety Procedures". Please complete within 48 hours.',
            timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
            read: false,
            priority: 'high',
            actionUrl: '/miner/AssignedVideos',
            fromUser: 'Supervisor',
            fromRole: 'supervisor',
          },
          {
            id: '3',
            type: 'safety',
            title: '✓ PPE Scan Approved',
            message: 'Your PPE scan from today has been approved. All equipment is compliant.',
            timestamp: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
            read: true,
            priority: 'medium',
          },
          {
            id: '4',
            type: 'alert',
            title: '⚠️ Hazard Alert',
            message: 'High gas levels detected in Section B. Avoid area until further notice.',
            timestamp: Date.now() - 1000 * 60 * 60 * 6, // 6 hours ago
            read: true,
            priority: 'high',
            fromUser: 'Gas Monitor System',
          },
          {
            id: '5',
            type: 'general',
            title: '📋 Daily Checklist Reminder',
            message: 'Don\'t forget to complete your daily safety checklist before starting work.',
            timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
            read: true,
            priority: 'low',
          },
          {
            id: '6',
            type: 'safety',
            title: '🎯 Safety Training Complete',
            message: 'Congratulations! You\'ve completed the "Emergency Procedures" training module.',
            timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
            read: true,
            priority: 'low',
          },
        ];
        
        setNotifications(sampleNotifications);
        await AsyncStorage.setItem(key, JSON.stringify(sampleNotifications));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const updated = notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      setNotifications(updated);
      
      const key = `notifications_${user.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      
      const key = `notifications_${user.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = notifications.filter(n => n.id !== notificationId);
              setNotifications(updated);
              
              const key = `notifications_${user.id}`;
              await AsyncStorage.setItem(key, JSON.stringify(updated));
            } catch (error) {
              console.error('Error deleting notification:', error);
            }
          },
        },
      ]
    );
  };

  const clearAll = async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setNotifications([]);
              const key = `notifications_${user.id}`;
              await AsyncStorage.setItem(key, JSON.stringify([]));
            } catch (error) {
              console.error('Error clearing notifications:', error);
            }
          },
        },
      ]
    );
  };

  const handleNotificationPress = async (notification: Notification) => {
    await markAsRead(notification.id);
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'emergency': return <AlertTriangle size={24} color="#EF4444" />;
      case 'video': return <Video size={24} color={COLORS.primary} />;
      case 'safety': return <Shield size={24} color="#10B981" />;
      case 'alert': return <Bell size={24} color="#F59E0B" />;
      default: return <Bell size={24} color={COLORS.textMuted} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#6B7280';
      default: return COLORS.textMuted;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={markAllAsRead} disabled={unreadCount === 0}>
          <CheckCircle size={24} color={unreadCount > 0 ? COLORS.primary : COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              {filter === 'unread'
                ? 'You\'re all caught up!'
                : 'No notifications yet. Check back later.'}
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map(notification => (
              <TouchableOpacity
                key={notification.id}
                style={[styles.notificationCard, !notification.read && styles.unreadCard]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationHeader}>
                  {getNotificationIcon(notification.type)}
                  <View style={styles.notificationInfo}>
                    <Text style={[styles.notificationTitle, !notification.read && styles.unreadTitle]}>
                      {notification.title}
                    </Text>
                    <View style={styles.notificationMeta}>
                      <Clock size={12} color={COLORS.textMuted} />
                      <Text style={styles.notificationTime}>{formatTimestamp(notification.timestamp)}</Text>
                      <View
                        style={[styles.priorityDot, { backgroundColor: getPriorityColor(notification.priority) }]}
                      />
                      <Text style={styles.priorityText}>{notification.priority}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteNotification(notification.id)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.notificationMessage}>{notification.message}</Text>

                {notification.fromUser && (
                  <View style={styles.fromContainer}>
                    <Text style={styles.fromText}>From: {notification.fromUser}</Text>
                  </View>
                )}

                {!notification.read && <View style={styles.unreadIndicator} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {notifications.length > 0 && (
          <TouchableOpacity style={styles.clearAllButton} onPress={clearAll}>
            <Trash2 size={18} color="#EF4444" />
            <Text style={styles.clearAllText}>Clear All Notifications</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  notificationsList: {
    paddingHorizontal: 20,
  },
  notificationCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  unreadCard: {
    borderColor: COLORS.primary,
    borderLeftWidth: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  notificationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 4,
    marginRight: 12,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 8,
  },
  fromContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  fromText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
});
