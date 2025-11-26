import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetwork = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    // For demo purposes, assume always online
    // In production, use NetInfo:
    /*
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
    });

    return () => unsubscribe();
    */

    // Simulated offline mode for testing
    const checkConnection = () => {
      // Always online for demo
      setIsOnline(true);
      setIsInternetReachable(true);
    };

    checkConnection();
  }, []);

  return {
    isOnline,
    isInternetReachable,
  };
};
