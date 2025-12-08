/**
 * Smart Helmet Configuration
 * 
 * Update the ESP32_IP with your actual ESP32's IP address
 * You can find the IP in Arduino Serial Monitor after ESP32 boots
 */

// ⚠️ UPDATE THIS WITH YOUR ESP32'S ACTUAL IP ADDRESS
export const ESP32_CONFIG = {
  // ESP32 IP Address - Check Arduino Serial Monitor to get this
  IP: '192.168.137.122', // Example: '192.168.1.100' or '10.0.0.50'
  
  // WebSocket Port (default: 81, don't change unless you modified ESP32 code)
  WS_PORT: 81,
  
  // HTTP Port for web dashboard (default: 80)
  HTTP_PORT: 80,
  
  // Data update interval in milliseconds (how often ESP32 sends data)
  UPDATE_INTERVAL: 500,
  
  // Reconnection settings
  MAX_RECONNECT_ATTEMPTS: 10,
  RECONNECT_DELAY: 2000, // milliseconds
  
  // Alert thresholds
  THRESHOLDS: {
    HIGH_TEMP_C: 35, // Alert if temperature exceeds this
    HIGH_HUMIDITY_PERCENT: 80, // Alert if humidity exceeds this
  },
};

/**
 * Helper function to get WebSocket URL
 */
export const getWebSocketURL = () => {
  return `ws://${ESP32_CONFIG.IP}:${ESP32_CONFIG.WS_PORT}/`;
};

/**
 * Helper function to get HTTP dashboard URL
 */
export const getHTTPDashboardURL = () => {
  return `http://${ESP32_CONFIG.IP}:${ESP32_CONFIG.HTTP_PORT}`;
};

/**
 * Quick setup instructions:
 * 
 * 1. Upload the Arduino code to your ESP32
 * 2. Open Serial Monitor (115200 baud)
 * 3. Note the IP address printed after "Connected! IP address: "
 * 4. Update the ESP32_CONFIG.IP above with that IP
 * 5. Make sure your phone is on the same WiFi network
 * 6. Restart your React Native app
 * 7. Navigate to Miner Home → Smart Helmet
 * 
 * Troubleshooting:
 * - If connection fails, verify ESP32 is on and WiFi connected
 * - Check that phone and ESP32 are on the same network
 * - Try opening http://[ESP32_IP] in your phone's browser first
 * - Disable VPN on your phone
 */
