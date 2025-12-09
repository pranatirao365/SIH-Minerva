import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icons } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useRoleStore } from '../../hooks/useRoleStore';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: any;
  read: boolean;
  recipientId?: string;
  priority?: string;
  metadata?: {
    requestId?: string;
    videoTopic?: string;
    requestPriority?: string;
    requestDescription?: string;
    requestLanguage?: string;
    [key: string]: any;
  };
  senderName?: string;
}

export default function NotificationScreen() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const userId = user?.id || user?.phone;
    if (!userId) {
      console.log('⚠️ No user ID found for notifications');
      return;
    }

    console.log('📱 Subscribing to notifications for user:', userId);

    // Subscribe to notifications
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification);
      });
      
      console.log(`✅ Fetched ${notifs.length} notifications for user ${userId}`);
      if (notifs.length > 0) {
        console.log('First notification:', notifs[0]);
      }
      
      // Sort in memory by createdAt descending
      notifs.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
        return bTime - aTime;
      });
      setNotifications(notifs);
    }, (error) => {
      console.error('❌ Error fetching notifications:', error);
    });

    return () => unsubscribe();
  }, [user?.id, user?.phone]);

  const onRefresh = async () => {
    setRefreshing(true);
    // The onSnapshot listener will automatically update
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const notif of notifications) {
                await deleteDoc(doc(db, 'notifications', notif.id));
              }
            } catch (error) {
              console.error('Error clearing notifications:', error);
            }
          },
        },
      ]
    );
  };

  const handleMarkAsRead = async (notification: Notification, e?: any) => {
    if (e) {
      e.stopPropagation();
    }
    
    try {
      // Delete the notification instead of just marking as read
      await deleteDoc(doc(db, 'notifications', notification.id));
      console.log('✅ Notification deleted:', notification.id);
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Handle different notification types with navigation
    if (notification.type === 'video_request' && user?.role === 'safety-officer') {
      // Navigate to Video Request Handler for safety officers
      router.push('/safety-officer/VideoRequestHandler' as any);
    } else if (notification.type === 'sos-alert' || notification.type === 'safety_alert') {
      // Navigate to SOS notifications for supervisors/safety officers
      if (user?.role === 'safety-officer') {
        router.push('/safety-officer/SOSNotifications' as any);
      }
    } else if (notification.type === 'video_assignment') {
      // Navigate to video library for miners
      if (user?.role === 'miner') {
        router.push('/miner/TrainingSafety' as any);
      }
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000); // minutes

    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    if (diff < 10080) return `${Math.floor(diff / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  const getIconColor = (type: string, priority?: string) => {
    switch (type) {
      case 'alert':
      case 'sos-alert':
      case 'safety_alert':
        return '#EF4444';
      case 'video_request':
        // Color based on priority
        if (priority === 'urgent') return '#EF4444';
        if (priority === 'high') return '#F59E0B';
        if (priority === 'medium') return '#0EA5E9';
        return '#10B981';
      case 'training':
      case 'daily_reminder':
      case 'video_assignment':
        return '#0EA5E9';
      case 'achievement':
        return '#10B981';
      default:
        return COLORS.primary;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
      case 'sos-alert':
      case 'safety_alert':
        return Icons.AlertTriangle;
      case 'video_request':
        return Icons.Video;
      case 'training':
      case 'daily_reminder':
      case 'video_assignment':
        return Icons.BookOpen;
      case 'achievement':
        return Icons.Award;
      default:
        return Icons.Bell;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icons.ChevronLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Icons.Bell size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyStateTitle}>No Notifications</Text>
            <Text style={styles.emptyStateText}>
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        ) : (
          notifications.map((notification) => {
            const IconComponent = getIcon(notification.type);
            const isVideoRequest = notification.type === 'video_request';
            
            return (
              <View
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.unreadCard,
                  isVideoRequest && styles.videoRequestCard,
                ]}
              >
                <TouchableOpacity
                  style={styles.notificationPressable}
                  onPress={() => handleNotificationPress(notification)}
                >
                  {isVideoRequest ? (
                    // Enhanced Video Request Display
                    <>
                      <View style={styles.videoRequestHeader}>
                        <View style={styles.videoRequestIcon}>
                          <IconComponent size={24} color={getIconColor(notification.type, notification.metadata?.requestPriority || notification.priority)} />
                        </View>
                        <View style={styles.videoRequestInfo}>
                          <View style={styles.videoRequestTitleRow}>
                            <Text style={styles.videoRequestTopic} numberOfLines={2}>
                              {notification.metadata?.videoTopic || notification.title}
                            </Text>
                            {!notification.read && <View style={styles.unreadDot} />}
                          </View>
                          <View style={styles.priorityBadgeContainer}>
                            <View style={[
                              styles.priorityBadge, 
                              { backgroundColor: getIconColor(notification.type, notification.metadata?.requestPriority || notification.priority) + '20' }
                            ]}>
                              <Text style={[
                                styles.priorityBadgeText,
                                { color: getIconColor(notification.type, notification.metadata?.requestPriority || notification.priority) }
                              ]}>
                                {(notification.metadata?.requestPriority || notification.priority || 'MEDIUM').toUpperCase()}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      <View style={styles.videoRequestMeta}>
                        <Text style={styles.videoRequestMetaText}>
                          Requested by: {notification.senderName || 'Supervisor'}
                        </Text>
                        <Text style={styles.videoRequestMetaText}>
                          {notification.metadata?.requestLanguage === 'en' ? '🇬🇧 English' : 
                           notification.metadata?.requestLanguage === 'hi' ? '🇮🇳 Hindi' :
                           notification.metadata?.requestLanguage === 'te' ? '🇮🇳 Telugu' : 'English'} • {formatTimestamp(notification.createdAt)}
                        </Text>
                      </View>
                      {notification.metadata?.requestDescription && (
                        <Text style={styles.videoRequestDescription} numberOfLines={2}>
                          {notification.metadata.requestDescription}
                        </Text>
                      )}
                    </>
                  ) : (
                    // Standard Notification Display
                    <>
                      <View style={styles.notificationIcon}>
                        <IconComponent size={24} color={getIconColor(notification.type, notification.priority)} />
                      </View>
                      <View style={styles.notificationContent}>
                        <View style={styles.notificationHeader}>
                          <Text style={styles.notificationTitle}>{notification.title}</Text>
                          {!notification.read && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.notificationMessage}>{notification.message}</Text>
                        <Text style={styles.notificationTime}>{formatTimestamp(notification.createdAt)}</Text>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
                
                {/* Mark as Read Button */}
                <TouchableOpacity 
                  style={styles.markAsReadButton}
                  onPress={(e) => handleMarkAsRead(notification, e)}
                >
                  <Icons.Check size={18} color={COLORS.primary} />
                  <Text style={styles.markAsReadText}>Mark as Read</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  clearButton: {
    padding: 8,
  },
  clearText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unreadCard: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary + '40',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Video Request specific styles
  videoRequestCard: {
    flexDirection: 'column',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  videoRequestHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  videoRequestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  videoRequestInfo: {
    flex: 1,
  },
  videoRequestTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  videoRequestTopic: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  priorityBadgeContainer: {
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  videoRequestMeta: {
    marginBottom: 12,
  },
  videoRequestMetaText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  videoRequestDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginTop: 4,
  },
  notificationPressable: {
    flex: 1,
  },
  markAsReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  markAsReadText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
});
