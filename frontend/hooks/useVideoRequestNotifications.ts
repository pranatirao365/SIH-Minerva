import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useRoleStore } from './useRoleStore';
import { ROLES } from '../constants/roles';
import { showNotification, requestNotificationPermissions } from '../services/notificationService';

interface VideoRequest {
  id: string;
  status: string;
  createdAt: any;
  // Add other fields as needed
}

export function useVideoRequestNotifications() {
  const { user } = useRoleStore();
  const [pendingRequests, setPendingRequests] = useState<VideoRequest[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const previousCountRef = useRef(0);

  useEffect(() => {
    if (!user.id && !user.phone) {
      return;
    }

    // Request notification permissions
    requestNotificationPermissions();

    const userId = user.id || user.phone;
    
    // Listen to unread notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('read', '==', false)
    );

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const unreadCount = snapshot.docs.length;
      setNotificationCount(unreadCount);
    });

    // For safety officers, also track pending video requests
    let unsubscribeRequests = () => {};
    if (user.role === ROLES.SAFETY_OFFICER) {
      const requestsQuery = query(
        collection(db, 'videoRequests'),
        where('status', '==', 'pending')
      );

      unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VideoRequest[];

        // Sort in memory by createdAt descending
        requests.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return bTime - aTime;
        });

        setPendingRequests(requests);

        // Check for new requests
        if (requests.length > previousCountRef.current) {
          const newRequests = requests.length - previousCountRef.current;
          if (newRequests > 0) {
            showNotification(
              'New Video Request',
              `You have ${newRequests} new video request${newRequests > 1 ? 's' : ''} pending review.`,
              { type: 'video_request', count: newRequests }
            );
          }
        }

        previousCountRef.current = requests.length;
      });
    }

    return () => {
      unsubscribeNotifications();
      unsubscribeRequests();
    };
  }, [user.id, user.phone, user.role]);

  return {
    pendingRequests,
    notificationCount,
  };
}
