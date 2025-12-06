// Polyfills for deprecated React Native modules
// This file prevents errors when libraries try to access deprecated modules

import { LogBox } from 'react-native';

// Suppress specific warnings about deprecated modules
LogBox.ignoreLogs([
  'ProgressBarAndroid has been extracted from react-native core',
  'Clipboard has been extracted from react-native core',
  'PushNotificationIOS has been extracted from react-native core',
  'Your JavaScript code tried to access a native module that doesn\'t exist',
]);

// Polyfill for PushNotificationIOS (if any library tries to access it)
if (typeof global !== 'undefined') {
  // Mock PushNotificationIOS to prevent crashes
  const mockPushNotificationIOS = {
    addEventListener: () => {},
    removeEventListener: () => {},
    requestPermissions: () => Promise.resolve({ alert: false, badge: false, sound: false }),
    abandonPermissions: () => {},
    checkPermissions: () => {},
    getInitialNotification: () => Promise.resolve(null),
    getDeliveredNotifications: () => Promise.resolve([]),
    removeAllDeliveredNotifications: () => {},
    setApplicationIconBadgeNumber: () => {},
    getApplicationIconBadgeNumber: () => Promise.resolve(0),
  };

  // Try to set the mock on React Native if it exists
  try {
    const RN = require('react-native');
    if (RN && !RN.PushNotificationIOS) {
      Object.defineProperty(RN, 'PushNotificationIOS', {
        get: () => mockPushNotificationIOS,
        configurable: true,
      });
    }
  } catch (e) {
    // Ignore if React Native is not available
  }
}
