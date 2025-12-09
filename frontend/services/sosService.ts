import { db } from '../config/firebase';
import { 
  addDoc, 
  collection, 
  Timestamp, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';

export interface SOSAlert {
  id?: string;
  minerId: string;
  minerName: string;
  minerPhone?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    description?: string;
  };
  helmetData?: {
    heartRate?: number;
    spo2?: number;
    temperature?: number;
    helmetWorn?: boolean;
  };
  timestamp: Timestamp;
  status: 'active' | 'acknowledged' | 'resolved' | 'cancelled';
  acknowledgedBy?: string;
  acknowledgedAt?: Timestamp;
  resolvedBy?: string;
  resolvedAt?: Timestamp;
  priority: 'critical' | 'high' | 'medium';
  notes?: string;
}

export interface SOSNotification {
  id?: string;
  alertId: string;
  recipientId: string;
  recipientRole: 'supervisor' | 'safety-officer' | 'admin';
  minerId: string;
  minerName: string;
  message: string;
  read: boolean;
  timestamp: Timestamp;
  type: 'sos-alert';
}

/**
 * Send SOS alert to supervisors and safety officers
 */
export async function sendSOSAlert(
  minerId: string,
  minerName: string,
  minerPhone?: string,
  location?: { latitude?: number; longitude?: number; description?: string },
  helmetData?: any
): Promise<string> {
  try {
    // Create SOS alert document
    const alertData: Omit<SOSAlert, 'id'> = {
      minerId,
      minerName,
      minerPhone,
      location: location || { description: 'Mine Site' },
      helmetData: helmetData ? {
        heartRate: helmetData.pulse?.bpm || 0,
        spo2: helmetData.pulse?.spo2 || 0,
        temperature: helmetData.env?.temp || 0,
        helmetWorn: helmetData.helmet?.worn || false,
      } : undefined,
      timestamp: Timestamp.now(),
      status: 'active',
      priority: 'critical',
    };

    // Add alert to Firestore
    const alertRef = await addDoc(collection(db, 'sos_alerts'), alertData);
    const alertId = alertRef.id;

    console.log('🚨 SOS Alert created:', alertId);

    // Get all supervisors and safety officers
    const recipients = await getAlertRecipients();

    // Create notifications for each recipient
    const notificationPromises = recipients.map(async (recipient) => {
      const notificationData: Omit<SOSNotification, 'id'> = {
        alertId,
        recipientId: recipient.id,
        recipientRole: recipient.role as 'supervisor' | 'safety-officer',
        minerId,
        minerName,
        message: `🚨 EMERGENCY: ${minerName} has triggered an SOS alert at ${location?.description || 'Mine Site'}`,
        read: false,
        timestamp: Timestamp.now(),
        type: 'sos-alert',
      };

      return addDoc(collection(db, 'notifications'), notificationData);
    });

    await Promise.all(notificationPromises);

    console.log(`✅ SOS notifications sent to ${recipients.length} recipients`);

    return alertId;
  } catch (error) {
    console.error('❌ Error sending SOS alert:', error);
    throw error;
  }
}

/**
 * Get all supervisors and safety officers to notify
 */
async function getAlertRecipients(): Promise<Array<{ id: string; role: string; name: string }>> {
  try {
    const recipients: Array<{ id: string; role: string; name: string }> = [];

    // Get supervisors
    const supervisorsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'supervisor')
    );
    const supervisorsSnapshot = await getDocs(supervisorsQuery);
    supervisorsSnapshot.forEach((doc) => {
      recipients.push({
        id: doc.id,
        role: 'supervisor',
        name: doc.data().name || 'Supervisor',
      });
    });

    // Get safety officers
    const safetyOfficersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'safety-officer')
    );
    const safetyOfficersSnapshot = await getDocs(safetyOfficersQuery);
    safetyOfficersSnapshot.forEach((doc) => {
      recipients.push({
        id: doc.id,
        role: 'safety-officer',
        name: doc.data().name || 'Safety Officer',
      });
    });

    return recipients;
  } catch (error) {
    console.error('❌ Error getting alert recipients:', error);
    return [];
  }
}

/**
 * Acknowledge SOS alert
 */
export async function acknowledgeSOSAlert(
  alertId: string,
  acknowledgedBy: string
): Promise<void> {
  try {
    const alertRef = doc(db, 'sos_alerts', alertId);
    await updateDoc(alertRef, {
      status: 'acknowledged',
      acknowledgedBy,
      acknowledgedAt: serverTimestamp(),
    });

    console.log(`✅ SOS alert ${alertId} acknowledged by ${acknowledgedBy}`);
  } catch (error) {
    console.error('❌ Error acknowledging SOS alert:', error);
    throw error;
  }
}

/**
 * Resolve SOS alert
 */
export async function resolveSOSAlert(
  alertId: string,
  resolvedBy: string,
  notes?: string
): Promise<void> {
  try {
    const alertRef = doc(db, 'sos_alerts', alertId);
    await updateDoc(alertRef, {
      status: 'resolved',
      resolvedBy,
      resolvedAt: serverTimestamp(),
      notes: notes || '',
    });

    console.log(`✅ SOS alert ${alertId} resolved by ${resolvedBy}`);
  } catch (error) {
    console.error('❌ Error resolving SOS alert:', error);
    throw error;
  }
}

/**
 * Cancel SOS alert (false alarm)
 */
export async function cancelSOSAlert(alertId: string): Promise<void> {
  try {
    const alertRef = doc(db, 'sos_alerts', alertId);
    await updateDoc(alertRef, {
      status: 'cancelled',
    });

    console.log(`✅ SOS alert ${alertId} cancelled`);
  } catch (error) {
    console.error('❌ Error cancelling SOS alert:', error);
    throw error;
  }
}

/**
 * Get active SOS alerts for supervisors/safety officers
 */
export async function getActiveSOSAlerts(): Promise<SOSAlert[]> {
  try {
    const alertsQuery = query(
      collection(db, 'sos_alerts'),
      where('status', 'in', ['active', 'acknowledged'])
    );
    
    const snapshot = await getDocs(alertsQuery);
    const alerts: SOSAlert[] = [];

    snapshot.forEach((doc) => {
      alerts.push({
        id: doc.id,
        ...doc.data(),
      } as SOSAlert);
    });

    return alerts.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
  } catch (error) {
    console.error('❌ Error getting active SOS alerts:', error);
    return [];
  }
}

/**
 * Get SOS notifications for a user
 */
export async function getSOSNotifications(userId: string): Promise<SOSNotification[]> {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('type', '==', 'sos-alert')
    );
    
    const snapshot = await getDocs(notificationsQuery);
    const notifications: SOSNotification[] = [];

    snapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
      } as SOSNotification);
    });

    return notifications.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
  } catch (error) {
    console.error('❌ Error getting SOS notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    throw error;
  }
}
