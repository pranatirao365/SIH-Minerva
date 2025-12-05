import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
const LAN_IP = '192.168.137.3'; // 👈 Your Wi-Fi IP (for physical devices)

const PPE_API_PORT = 8000;
const VIDEO_API_PORT = 4000;

/**
 * Get the appropriate API base URL based on the device/platform
 */
export const getPPEApiUrl = (): string => {
  // For development: Force LAN IP for all devices/emulators
  // The backend is running on your computer at 192.168.137.1:8000
  // Both physical devices and emulators need to use this IP on the same network
  return `http://${LAN_IP}:${PPE_API_PORT}`;
  
  /* Original logic (commented out for troubleshooting):
  const isDevice = Constants.isDevice;

  if (Platform.OS === 'android') {
    return isDevice 
      ? `http://${LAN_IP}:${PPE_API_PORT}`
      : `http://10.0.2.2:${PPE_API_PORT}`;
  } else if (Platform.OS === 'ios') {
    return isDevice
      ? `http://${LAN_IP}:${PPE_API_PORT}`
      : `http://localhost:${PPE_API_PORT}`;
  }

  return `http://localhost:${PPE_API_PORT}`;
  */
};

/**
 * Get the video generation API base URL
 */
export const getVideoApiUrl = (): string => {
  // Check if running on a physical device
  const isDevice = Constants.isDevice;

  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    // Physical Android device uses LAN IP
    return isDevice 
      ? `http://${LAN_IP}:${VIDEO_API_PORT}`
      : `http://10.0.2.2:${VIDEO_API_PORT}`;
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost directly
    // Physical iOS device uses LAN IP
    return isDevice
      ? `http://${LAN_IP}:${VIDEO_API_PORT}`
      : `http://localhost:${VIDEO_API_PORT}`;
  }

  // Default fallback (web or other platforms)
  return `http://localhost:${VIDEO_API_PORT}`;
};

/**
 * PPE API endpoints
 */
export const PPE_API_ENDPOINTS = {
  predict: '/predict',
};

/**
 * Video Generation API endpoints
 */
export const VIDEO_API_ENDPOINTS = {
  generate: '/api/video/generate',
  status: '/api/video/status',
  videos: '/videos',
};

/**
 * Get the full prediction endpoint URL
 */
export const getPPEPredictUrl = (): string => {
  return `${getPPEApiUrl()}${PPE_API_ENDPOINTS.predict}`;
};

/**
 * Get video generation endpoint URL
 */
export const getVideoGenerateUrl = (): string => {
  return `${getVideoApiUrl()}${VIDEO_API_ENDPOINTS.generate}`;
};

/**
 * Get video status endpoint URL
 */
export const getVideoStatusUrl = (jobId: string): string => {
  return `${getVideoApiUrl()}${VIDEO_API_ENDPOINTS.status}/${jobId}`;
};

/**
 * Get full video URL for streaming
 */
export const getVideoUrl = (videoPath: string): string => {
  // Remove leading slash if present
  const cleanPath = videoPath.startsWith('/') ? videoPath.substring(1) : videoPath;
  return `${getVideoApiUrl()}/${cleanPath}`;
};
