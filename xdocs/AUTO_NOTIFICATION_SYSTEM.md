# Auto-Notification System for Miner Progress Tracker

## Overview
The Auto-Notification System automatically sends reminders to miners about pending video training assignments **8 hours before their shift starts**, ensuring they complete required training before beginning work.

## Features

### 🔔 Automatic Daily Reminders
- **Smart Scheduling**: Notifications are sent 8 hours before shift start time
- **Default Shift Time**: 08:00 AM (customizable per supervisor)
- **Notification Time**: 12:00 AM (midnight) for default 8 AM shift
- **Automatic Rescheduling**: System automatically schedules next day's reminders after sending

### 📊 Intelligent Filtering
- Only sends notifications to miners with **pending assignments**
- Prioritizes **overdue assignments** with urgent messaging
- Filters by supervisor's assigned miners only
- Prevents duplicate notifications

### 📱 Manual Controls
- **"Send Now" Button**: Trigger daily reminders immediately (testing/urgent)
- **"Send Bulk Reminders"**: Send to all miners with pending tasks
- **Individual Reminders**: Send to specific miners from their card

### 🎯 Notification Types

#### 1. Daily Auto-Reminders (8hrs before shift)
```
Type: 'daily_reminder'
Priority: 'high' (if overdue) or 'medium' (if pending)
Title: "🔔 Daily Training Reminder"
Message: 
  - With overdue: "⚠️ You have X overdue and Y pending video training assignments..."
  - Without overdue: "📚 Reminder: You have X pending video training assignments to complete today."
```

#### 2. Manual Immediate Reminders
```
Type: 'manual_reminder'
Priority: 'high'
Title: "📢 Urgent Training Reminder"
Message: "You have X pending training assignments. Please complete them as soon as possible."
```

#### 3. Bulk Notifications
Sends individual notifications to multiple miners simultaneously with rate limiting (300ms delay between sends).

## Implementation

### Files Structure
```
services/
  └── autoNotificationService.ts    # Core auto-notification logic
  
app/supervisor/
  └── VideoProgressDashboard.tsx    # UI with auto-notification integration
```

### Key Functions

#### `initializeAutoNotifications(supervisorId: string)`
Initializes the auto-notification system when supervisor logs in.
- Loads supervisor's shift configuration
- Schedules first daily reminder
- Called automatically on component mount

#### `scheduleDailyReminders(supervisorId: string, shiftStartTime: string)`
Schedules notifications for specific time (8 hours before shift).
- Calculates notification time
- Sets up setTimeout for automatic sending
- Auto-reschedules for next day

#### `checkAndSendDailyReminders(supervisorId: string)`
Core logic that checks miners and sends notifications.
- Loads supervisor's miners
- Loads all active assignments
- Loads progress data
- Filters pending/overdue assignments
- Sends notifications only to miners with pending work

#### `sendAutoNotificationToMiner(...)`
Sends individual auto-notification to miner.
- Creates Firestore notification document
- Includes metadata (pendingCount, overdueCount, shift, reminderType)
- Priority based on overdue status

#### `sendImmediateReminder(...)`
Sends manual reminder from supervisor.
- Used for urgent notifications
- Custom message support
- High priority always

## Database Schema

### Notifications Collection
```typescript
{
  recipientId: string,           // Miner's document ID
  recipientName: string,          // Miner's name
  senderId: string,               // Supervisor ID or 'system'
  senderName: string,             // Supervisor name or 'Training System'
  type: 'daily_reminder' | 'manual_reminder' | 'video_reminder',
  title: string,                  // Notification title
  message: string,                // Notification message
  priority: 'high' | 'medium' | 'low',
  read: boolean,                  // Read status
  actionRequired: boolean,        // Requires action
  createdAt: Timestamp,           // Creation time
  metadata: {
    pendingCount?: number,        // Number of pending assignments
    overdueCount?: number,        // Number of overdue assignments
    shift?: string,               // Miner's shift
    reminderType?: 'pre_shift' | 'immediate',
  }
}
```

## UI Components

### Auto-Notification Status Banner
Green banner showing system is active:
- 🔔 Icon
- "Auto-Reminders Active" title
- "Notifications sent 8hrs before shift daily" subtitle
- "Send Now" button for manual trigger

### Enhanced Miner Cards
- Shows pending/overdue counts with color coding
- "📨 SEND REMINDER" button (red for overdue, blue for pending)
- Loading indicator while sending
- "Urgent" badge for overdue assignments

### Bulk Actions Section
- Shows only if miners have pending assignments
- Displays count of miners with pending tasks
- Single tap sends to all miners with rate limiting

### Overall Stats (Scrollable)
- 👥 Total Miners
- ✅ Completed assignments
- ⏳ Pending assignments
- ⚠️ Overdue assignments

## Mobile Responsiveness

### Screen Breakpoints
```typescript
isSmallScreen: < 380px     // Compact phones
isMediumScreen: 380-768px  // Standard phones
isLargeScreen: > 768px     // Tablets/Desktop
```

### Responsive Adjustments
- **Small screens**: Reduced padding, smaller fonts, compact icons
- **All screens**: Horizontal scrollable stats, flexible layouts
- **Platform-specific**: iOS shadows, Android elevation
- **Touch targets**: Minimum 44px for accessibility

## Usage Guide

### For Supervisors

#### Initial Setup (Automatic)
1. Log in as supervisor
2. Navigate to "Video Progress Dashboard"
3. System automatically initializes on mount
4. Green banner confirms auto-notifications are active

#### Manual Actions
1. **View Miner Progress**: Scroll through miner cards
2. **Send Individual Reminder**: Tap "SEND REMINDER" on miner card
3. **Send Bulk Reminders**: Tap "Send Bulk Reminders" button at top
4. **Trigger Daily Reminders**: Tap "Send Now" in green banner
5. **Filter/Search**: Use filter button and search bar

#### Notification Flow
```
12:00 AM (Midnight) Daily
    ↓
System checks all miners
    ↓
Finds miners with pending assignments
    ↓
Sends notification to each miner
    ↓
Auto-schedules next day's reminders
```

### For Miners
Miners receive notifications:
- In-app notification badge
- Firebase Cloud Messaging (if configured)
- Can view in notifications screen
- Action: Navigate to video assignments

## Configuration

### Customize Shift Start Time
Update in Firestore users collection:
```javascript
{
  ...
  shiftStartTime: "08:00"  // HH:MM format
}
```

### Notification Timing
Default: 8 hours before shift
- 8 AM shift → 12:00 AM notification
- 6 AM shift → 10:00 PM (previous day) notification
- 2 PM shift → 6:00 AM notification

To change timing, modify `calculateNotificationTime()` in `autoNotificationService.ts`:
```typescript
const notificationTime = new Date(tomorrow.getTime() - (8 * 60 * 60 * 1000));
//                                                      ↑
//                                             Change hours here
```

## Testing

### Test Auto-Notifications
1. Login as supervisor with assigned miners
2. Ensure miners have pending assignments
3. Click "Send Now" in green banner
4. Verify notifications created in Firestore
5. Check console logs for success messages

### Test Manual Reminders
1. Find miner card with pending assignments
2. Tap "SEND REMINDER"
3. Confirm alert appears
4. Check Firestore notifications collection

### Test Bulk Notifications
1. Ensure multiple miners have pending tasks
2. Tap "Send Bulk Reminders"
3. Confirm count in alert dialog
4. Tap "Send to X"
5. Verify success count in final alert

## Console Logs

### Initialization
```
🚀 Initializing auto-notification system...
📅 Scheduling daily reminders for: [Date]
✅ Daily reminders scheduled successfully
✅ Auto-notifications enabled: Reminders will be sent 8 hours before shift
```

### Daily Reminder Execution
```
🔍 Checking miners for daily reminders...
✅ Auto notification sent to [Miner Name] ([Miner ID])
✅ Sent X daily reminders
```

### Error Handling
```
❌ Error in checkAndSendDailyReminders: [Error details]
❌ Error sending auto notification to [Miner Name]: [Error]
❌ Failed to initialize auto-notifications: [Error]
```

## Performance

### Optimization Features
- **Rate Limiting**: 300ms delay between bulk notifications
- **Efficient Filtering**: Only loads relevant data
- **Memoized Calculations**: useMemo for progress summaries
- **Conditional Rendering**: Shows only necessary UI elements
- **Platform-Specific Rendering**: Optimized shadows/elevation

### Best Practices
- Auto-notifications run in background (setTimeout)
- Firestore queries use indexes for speed
- Minimal re-renders with proper state management
- Error boundaries prevent crashes

## Troubleshooting

### Notifications Not Sending
1. Check supervisor has assigned miners
2. Verify miners have pending assignments
3. Check Firestore rules allow writes to notifications collection
4. Review console for error messages
5. Ensure supervisor ID and name exist in useRoleStore

### Wrong Timing
1. Verify supervisor's shiftStartTime in Firestore
2. Check server time vs local time
3. Ensure timezone consistency
4. Review calculateNotificationTime() logic

### Duplicate Notifications
1. System prevents duplicates via unique notification documents
2. Check for multiple component mounts
3. Verify cleanup on unmount (add if needed)

## Future Enhancements

### Potential Additions
- [ ] Push notifications via FCM
- [ ] Email notifications integration
- [ ] SMS alerts for critical overdue
- [ ] Custom reminder schedules per miner
- [ ] Analytics dashboard for notification effectiveness
- [ ] Notification acknowledgment tracking
- [ ] Escalation system for ignored reminders
- [ ] Multi-language notification support

## Security

### Firestore Rules
Ensure proper security rules:
```javascript
match /notifications/{notificationId} {
  allow read: if request.auth != null && 
    (request.auth.uid == resource.data.recipientId || 
     request.auth.uid == resource.data.senderId);
  
  allow create: if request.auth != null && 
    (request.auth.uid == request.resource.data.senderId || 
     request.auth.uid == 'system');
  
  allow update: if request.auth != null && 
    request.auth.uid == resource.data.recipientId;
}
```

## Support
For issues or questions:
1. Check console logs for error details
2. Verify Firestore data structure
3. Test with "Send Now" button first
4. Review this documentation
5. Check Firebase Functions logs (if using cloud functions)

---

**Last Updated**: December 2, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
