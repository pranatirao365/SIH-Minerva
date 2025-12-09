/**
 * Alert Helper - Suppress all popup alerts and log them instead
 * This prevents blank screens and popup interruptions
 */

export const showAlert = (title: string, message?: string, buttons?: any[]) => {
  // Log to console instead of showing popup
  console.log(`[ALERT] ${title}${message ? ': ' + message : ''}`);
  
  // If there are buttons with onPress callbacks, execute the first one's callback
  if (buttons && buttons.length > 0 && buttons[0].onPress) {
    buttons[0].onPress();
  }
};

export const showSuccess = (message: string) => {
  console.log(`[SUCCESS] ${message}`);
};

export const showError = (message: string) => {
  console.log(`[ERROR] ${message}`);
};

export const showInfo = (message: string) => {
  console.log(`[INFO] ${message}`);
};
