import { db } from '@/config/firebase';
import { addDoc, collection, getDocs, query, Timestamp, where } from 'firebase/firestore';

interface VideoAssignment {
  id: string;
  videoId: string;
  videoTopic: string;
  assignedTo: string[];
  assignedBy: string;
  deadline: Timestamp;
  isMandatory: boolean;
  isDailyTask: boolean;
  taskDate?: string;
  assignedAt: Timestamp;
  description?: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
}

interface AssignmentProgress {
  id: string;
  assignmentId: string;
  minerId: string;
  videoId: string;
  watched: boolean;
  completedAt?: Timestamp;
  progress: number;
  watchTime: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
}

interface Miner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  shift?: string;
  shiftStartTime?: string; // e.g., "08:00"
}

/**
 * Calculate notification time (8 hours before shift start)
 * @param shiftStartTime - Time in HH:MM format (e.g., "08:00")
 * @returns Date object for notification time
 */
function calculateNotificationTime(shiftStartTime: string = "08:00"): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Parse shift start time
  const [hours, minutes] = shiftStartTime.split(':').map(Number);
  tomorrow.setHours(hours, minutes, 0, 0);
  
  // Subtract 8 hours for notification time
  const notificationTime = new Date(tomorrow.getTime() - (8 * 60 * 60 * 1000));
  
  return notificationTime;
}

/**
 * Send auto notification to miner about pending assignments
 * 8 hours before their shift starts
 */
export async function sendAutoNotificationToMiner(
  minerId: string,
  minerName: string,
  minerShift: string = "Day Shift",
  pendingCount: number,
  overdueCount: number,
  supervisorId?: string,
  supervisorName?: string
): Promise<void> {
  try {
    const notificationsRef = collection(db, 'notifications');
    
    const message = overdueCount > 0
      ? `⚠️ You have ${overdueCount} overdue and ${pendingCount - overdueCount} pending video training assignments. Please complete them before your shift starts.`
      : `📚 Reminder: You have ${pendingCount} pending video training assignments to complete today.`;

    await addDoc(notificationsRef, {
      recipientId: minerId,
      recipientName: minerName,
      senderId: supervisorId || 'system',
      senderName: supervisorName || 'Training System',
      type: 'daily_reminder',
      title: '🔔 Daily Training Reminder',
      message,
      priority: overdueCount > 0 ? 'high' : 'medium',
      read: false,
      actionRequired: true,
      createdAt: Timestamp.now(),
      metadata: {
        pendingCount,
        overdueCount,
        shift: minerShift,
        reminderType: 'pre_shift',
      },
    });

    console.log(`✅ Auto notification sent to ${minerName} (${minerId})`);
  } catch (error) {
    console.error(`❌ Error sending auto notification to ${minerName}:`, error);
    throw error;
  }
}

/**
 * Check all miners and send notifications for pending assignments
 * Should be called 8 hours before shift start
 */
export async function checkAndSendDailyReminders(supervisorId: string): Promise<number> {
  try {
    console.log('🔍 Checking miners for daily reminders...');

    // Get supervisor's miners
    const { getMinersBySupervisor } = await import('./minerService');
    const miners = await getMinersBySupervisor(supervisorId);

    if (miners.length === 0) {
      console.log('ℹ️ No miners found for supervisor');
      return 0;
    }

    // Get all active assignments
    const assignmentsRef = collection(db, 'videoAssignments');
    const assignmentsQuery = query(
      assignmentsRef,
      where('status', '==', 'active')
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);

    const allAssignments: VideoAssignment[] = [];
    assignmentsSnapshot.forEach((doc) => {
      allAssignments.push({ id: doc.id, ...doc.data() } as VideoAssignment);
    });

    // Get all progress data
    const progressRef = collection(db, 'assignmentProgress');
    const progressSnapshot = await getDocs(progressRef);

    const allProgress: AssignmentProgress[] = [];
    progressSnapshot.forEach((doc) => {
      allProgress.push({ id: doc.id, ...doc.data() } as AssignmentProgress);
    });

    // Get supervisor details for notification
    const supervisorRef = collection(db, 'users');
    const supervisorQuery = query(supervisorRef, where('__name__', '==', supervisorId));
    const supervisorSnapshot = await getDocs(supervisorQuery);
    const supervisorData = supervisorSnapshot.docs[0]?.data();
    const supervisorName = supervisorData?.name || 'Supervisor';

    let notificationsSent = 0;

    // Check each miner
    for (const miner of miners) {
      const minerAssignments = allAssignments.filter(a =>
        a.assignedTo && a.assignedTo.includes(miner.id)
      );

      let pendingCount = 0;
      let overdueCount = 0;

      minerAssignments.forEach(assignment => {
        const progress = allProgress.find(
          p => p.assignmentId === assignment.id && p.minerId === miner.id
        );

        const isCompleted = progress?.watched || false;
        const isOverdue = !isCompleted && assignment.deadline.toDate() < new Date();

        if (!isCompleted) {
          pendingCount++;
          if (isOverdue) {
            overdueCount++;
          }
        }
      });

      // Send notification if there are pending assignments
      if (pendingCount > 0) {
        await sendAutoNotificationToMiner(
          miner.id,
          miner.name,
          miner.shift || 'Day Shift',
          pendingCount,
          overdueCount,
          supervisorId,
          supervisorName
        );
        notificationsSent++;
      }
    }

    console.log(`✅ Sent ${notificationsSent} daily reminders`);
    return notificationsSent;
  } catch (error) {
    console.error('❌ Error in checkAndSendDailyReminders:', error);
    throw error;
  }
}

/**
 * Schedule daily reminders for a specific time
 * Call this when supervisor logs in or when app starts
 */
export async function scheduleDailyReminders(
  supervisorId: string,
  shiftStartTime: string = "08:00"
): Promise<void> {
  try {
    const notificationTime = calculateNotificationTime(shiftStartTime);
    const now = new Date();

    console.log(`📅 Scheduling daily reminders for: ${notificationTime.toLocaleString()}`);

    // If notification time has passed for today, schedule for tomorrow
    if (notificationTime < now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
      console.log(`⏭️ Time passed, rescheduled for: ${notificationTime.toLocaleString()}`);
    }

    // Calculate delay in milliseconds
    const delay = notificationTime.getTime() - now.getTime();

    // Set timeout to send notifications
    setTimeout(async () => {
      await checkAndSendDailyReminders(supervisorId);
      
      // Reschedule for next day
      await scheduleDailyReminders(supervisorId, shiftStartTime);
    }, delay);

    console.log(`✅ Daily reminders scheduled successfully`);
  } catch (error) {
    console.error('❌ Error scheduling daily reminders:', error);
    throw error;
  }
}

/**
 * Send immediate notification to specific miner
 * Used for manual reminders from supervisor
 */
export async function sendImmediateReminder(
  minerId: string,
  minerName: string,
  supervisorId: string,
  supervisorName: string,
  assignmentCount: number,
  message?: string
): Promise<void> {
  try {
    const notificationsRef = collection(db, 'notifications');

    await addDoc(notificationsRef, {
      recipientId: minerId,
      recipientName: minerName,
      senderId: supervisorId,
      senderName: supervisorName,
      type: 'manual_reminder',
      title: '📢 Urgent Training Reminder',
      message: message || `You have ${assignmentCount} pending training assignments. Please complete them as soon as possible.`,
      priority: 'high',
      read: false,
      actionRequired: true,
      createdAt: Timestamp.now(),
      metadata: {
        assignmentCount,
        reminderType: 'immediate',
      },
    });

    console.log(`✅ Immediate reminder sent to ${minerName}`);
  } catch (error) {
    console.error(`❌ Error sending immediate reminder:`, error);
    throw error;
  }
}

/**
 * Initialize auto-notification system when app starts
 * Should be called from app initialization or supervisor login
 */
export async function initializeAutoNotifications(supervisorId: string): Promise<void> {
  try {
    console.log('🚀 Initializing auto-notification system...');

    // Get supervisor's shift configuration
    const usersRef = collection(db, 'users');
    const supervisorQuery = query(usersRef, where('__name__', '==', supervisorId));
    const supervisorSnapshot = await getDocs(supervisorQuery);
    const supervisorData = supervisorSnapshot.docs[0]?.data();
    
    const shiftStartTime = supervisorData?.shiftStartTime || "08:00";

    // Schedule daily reminders
    await scheduleDailyReminders(supervisorId, shiftStartTime);

    console.log('✅ Auto-notification system initialized');
  } catch (error) {
    console.error('❌ Error initializing auto-notifications:', error);
    throw error;
  }
}
