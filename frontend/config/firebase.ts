import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// Updated for new project: sih-dec-2025
// Get your config from: https://console.firebase.google.com/project/sih-dec-2025/settings/general
const firebaseConfig = {
  apiKey: "AIzaSyAJZRgI_Zpp2iyeqBvreMhQCzvFxfHL2W0",
  authDomain: "sih-dec-2025.firebaseapp.com",
  databaseURL: "https://sih-dec-2025-default-rtdb.firebaseio.com",
  projectId: "sih-dec-2025",
  storageBucket: "sih-dec-2025.firebasestorage.app",
  messagingSenderId: "163692260644",
  appId: "1:163692260644:web:6cc4eac7446557182317b1",
  measurementId: "G-KN1E0ZQLW1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
// Firebase automatically uses AsyncStorage for persistence in React Native
export const auth = getAuth(app);

// Initialize Firestore with minerva1 database
export const db = getFirestore(app, 'minerva1');

// Initialize Firebase Storage
// Firebase will automatically use the bucket from firebaseConfig
export const storage = getStorage(app);

// Export the config for reCAPTCHA
export { firebaseConfig };

export default app;
