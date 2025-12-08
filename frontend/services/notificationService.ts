import * as Notifications from 'expo-notifications';

let notificationsModule: typeof Notifications | null = null;

async function getNotificationsModule(): Promise<typeof Notifications> {
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
  }
  return notificationsModule;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const Notifications = await getNotificationsModule();
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

export async function showNotification(title: string, body: string, data?: any): Promise<void> {
  try {
    const Notifications = await getNotificationsModule();
    await Notifications.presentNotificationAsync({
      title,
      body,
      data: data || {},
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

export async function scheduleNotification(
  title: string,
  body: string,
  secondsFromNow: number,
  data?: any
): Promise<string | null> {
  try {
    const Notifications = await getNotificationsModule();
    const trigger = { seconds: secondsFromNow };
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger,
    });
    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    const Notifications = await getNotificationsModule();
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}
