/**
 * PPE API Service
 * 
 * Handles communication with the NEW PPE detection backend.
 * This service ONLY uses the /ppe-scan endpoint.
 */

// ⚠️ CONFIGURATION: Use computer's IP when testing on physical device
const BACKEND_URL = `http://${process.env.EXPO_PUBLIC_IP_ADDRESS || '172.16.58.121'}:8888`; // Your computer's local IP from .env

interface PPEItem {
  present: boolean;
  confidence: number | null;
  raw_class: string | null;
}

interface PPEResults {
  helmet: PPEItem;
  no_helmet: PPEItem;
  vest: PPEItem;
  no_vest: PPEItem;
  gloves: PPEItem;
  goggles: PPEItem;
  shoes: PPEItem;
  suit: PPEItem;
}

interface PPEScanResponse {
  success: boolean;
  ppe_results: PPEResults;
}

/**
 * Upload an image for PPE detection
 * @param imageUri - Local URI of the image to analyze
 * @returns Detection results from the backend
 */
export async function uploadImageForPPEDetection(
  imageUri: string
): Promise<PPEScanResponse> {
  try {
    // Create FormData
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // Append image file to FormData
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    // Send POST request
    const response = await fetch(`${BACKEND_URL}/ppe-scan`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Server error: ${response.status} ${response.statusText}`
      );
    }

    const data: PPEScanResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error('PPE API Error:', error);
    
    if (error.message.includes('Network request failed')) {
      throw new Error(
        'Network error. Please check your connection and ensure the backend is running.'
      );
    }
    
    throw error;
  }
}

/**
 * Check if the backend is accessible
 * @returns true if backend is reachable, false otherwise
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

/**
 * Get the configured backend URL
 * @returns The current backend URL
 */
export function getBackendURL(): string {
  return BACKEND_URL;
}
