import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBl0ytxI6D1QKz4Megv12CzC3bi5SyaHAE",
  authDomain: "sihtut-1.firebaseapp.com",
  projectId: "sihtut-1",
  storageBucket: "sihtut-1.firebasestorage.app",
  messagingSenderId: "929345200458",
  appId: "1:929345200458:web:d9733c438dbdd61f8ae1b3",
  measurementId: "G-E4FYZ240XF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);

export default app;
