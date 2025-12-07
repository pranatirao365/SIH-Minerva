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

// ⚠️ IMPORTANT: Update EXPO_PUBLIC_IP_ADDRESS in .env when your network changes
// Find your LAN IP:
// - Windows: Run `ipconfig` in terminal, look for "IPv4 Address" under your network adapter
// - macOS/Linux: Run `ifconfig | grep "inet 192"` for your local network IP (usually 192.168.x.x)
// Then update .env file: EXPO_PUBLIC_IP_ADDRESS=your.ip.address.here
const LAN_IP = process.env.EXPO_PUBLIC_IP_ADDRESS || '172.20.10.2'; // 👈 Fallback IP if env var not set

const PPE_API_PORT = 8888; // Updated to match backend_ppe/.env PORT value
const VIDEO_API_PORT = 4000;

/**
 * Get the appropriate API base URL based on the device/platform
 */
export const getPPEApiUrl = (): string => {
  // For development: Use LAN IP from environment variable
  // The backend is running on your computer (IP set in .env: EXPO_PUBLIC_IP_ADDRESS)
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
  // Always use LAN IP from environment variable for consistency
  // This ensures all devices (emulators, simulators, physical devices) can connect
  return `http://${LAN_IP}:${VIDEO_API_PORT}`;
  
  /* Old device-specific logic (commented out):
  const isDevice = Constants.isDevice;

  if (Platform.OS === 'android') {
    return isDevice 
      ? `http://${LAN_IP}:${VIDEO_API_PORT}`
      : `http://10.0.2.2:${VIDEO_API_PORT}`;
  } else if (Platform.OS === 'ios') {
    return isDevice
      ? `http://${LAN_IP}:${VIDEO_API_PORT}`
      : `http://localhost:${VIDEO_API_PORT}`;
  }

  return `http://localhost:${VIDEO_API_PORT}`;
  */
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
