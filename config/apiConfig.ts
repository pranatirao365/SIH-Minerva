import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * API Configuration for PPE Detection Backend
 * 
 * Handles different environments:
 * - Android Emulator: Uses 10.0.2.2 (special Android emulator localhost alias)
 * - iOS Simulator: Uses localhost
 * - Physical Device: Uses LAN IP address (update LAN_IP constant)
 */

// ⚠️ IMPORTANT: Update this with your computer's LAN IP when testing on physical devices
// Find your LAN IP:
// - Windows: Run `ipconfig` in terminal, look for "IPv4 Address" under your network adapter
// - macOS/Linux: Run `ifconfig` or `ip addr`, look for your local network IP (usually 192.168.x.x)
const LAN_IP = '192.168.137.1'; // 👈 Your Wi-Fi IP (for physical devices)

const PPE_API_PORT = 8000;

/**
 * Get the appropriate API base URL based on the device/platform
 */
export const getPPEApiUrl = (): string => {
  // Check if running on a physical device
  const isDevice = Constants.isDevice;

  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    // Physical Android device uses LAN IP
    return isDevice 
      ? `http://${LAN_IP}:${PPE_API_PORT}`
      : `http://10.0.2.2:${PPE_API_PORT}`;
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost directly
    // Physical iOS device uses LAN IP
    return isDevice
      ? `http://${LAN_IP}:${PPE_API_PORT}`
      : `http://localhost:${PPE_API_PORT}`;
  }

  // Default fallback (web or other platforms)
  return `http://localhost:${PPE_API_PORT}`;
};

/**
 * PPE API endpoints
 */
export const PPE_API_ENDPOINTS = {
  predict: '/predict',
};

/**
 * Get the full prediction endpoint URL
 */
export const getPPEPredictUrl = (): string => {
  return `${getPPEApiUrl()}${PPE_API_ENDPOINTS.predict}`;
};
