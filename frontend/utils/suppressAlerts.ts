/**
 * Global Alert Suppression
 * Import this file early in your app to suppress all Alert.alert popups
 * and replace them with console.log statements
 */

import { Alert as RNAlert } from 'react-native';

// Store the original Alert.alert method
const originalAlert = RNAlert.alert;

// Override Alert.alert globally
RNAlert.alert = (title: string, message?: string, buttons?: any[], options?: any) => {
  // Log to console instead of showing popup
  const logMessage = message 
    ? `[ALERT] ${title}: ${message}` 
    : `[ALERT] ${title}`;
  
  console.log(logMessage);
  
  // If there are buttons with onPress callbacks, execute the first one that's not "Cancel"
  if (buttons && buttons.length > 0) {
    const primaryButton = buttons.find((btn: any) => 
      btn.style !== 'cancel' && typeof btn.onPress === 'function'
    );
    
    if (primaryButton && primaryButton.onPress) {
      try {
        primaryButton.onPress();
      } catch (error) {
        console.log('[ALERT] Error executing button callback:', error);
      }
    }
  }
  
  // Don't show the actual alert popup
  return;
};

// Also suppress Alert.prompt if it exists
if ('prompt' in RNAlert) {
  (RNAlert as any).prompt = (title: string, message?: string, callbackOrButtons?: any) => {
    console.log(`[PROMPT] ${title}${message ? ': ' + message : ''}`);
  };
}

// Suppress global error handlers from showing popups
const originalErrorHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.log(`[ERROR] ${isFatal ? 'FATAL' : 'Non-fatal'} error:`, error);
  // Don't show error screen, just log it
  if (originalErrorHandler) {
    // Call original handler silently if needed
    try {
      originalErrorHandler(error, isFatal);
    } catch (e) {
      console.log('[ERROR] Error in original handler:', e);
    }
  }
});

// Suppress console.error from triggering any UI
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Just log to console, don't trigger any UI
  originalConsoleError.apply(console, args);
};

export default RNAlert;
