// services/ppeApi.js
// API service for PPE detection

const API_BASE_URL = 'https://your-backend-url.com'; // TODO: Replace with your actual backend URL

/**
 * Upload image to PPE detection backend
 * @param {string} imageUri - Local URI of the captured image
 * @returns {Promise<Object>} Detection results
 */
export const uploadImageForPPEDetection = async (imageUri) => {
  try {
    // Create FormData with the image
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: 'ppe_image.jpg',
      type: 'image/jpeg',
    });

    // Send to backend
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    // Check response status
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // Parse JSON response
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('PPE API Error:', error);
    throw error;
  }
};

/**
 * Test backend connection
 * @returns {Promise<boolean>} True if backend is reachable
 */
export const testBackendConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
};

export default {
  uploadImageForPPEDetection,
  testBackendConnection,
  API_BASE_URL,
};
