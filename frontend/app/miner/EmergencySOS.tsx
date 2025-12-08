import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { Alert, Text, TouchableOpacity, View, ActivityIndicator, Animated, Vibration, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, Phone, X, MapPin, Heart, AlertTriangle, CheckCircle, Shield, Clock, Radio } from '../../components/Icons';
import { useRoleStore } from '../../hooks/useRoleStore';
import { sendSOSAlert } from '../../services/sosService';

export default function EmergencySOS() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [canSend, setCanSend] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [responseStatus, setResponseStatus] = useState<'waiting' | 'acknowledged' | 'dispatched'>('waiting');
  const { user } = useRoleStore();
  
  // Emergency contacts
  const emergencyContacts = [
    { name: 'Mine Control', phone: '1800-MINE-911', role: 'Emergency Center' },
    { name: 'Safety Officer', phone: '+91-9876543210', role: 'On-Duty Officer' },
    { name: 'Medical Team', phone: '+91-9876543211', role: 'First Responders' },
  ];
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Start animations on mount
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, []);

  // Timer for elapsed time after alert sent
  useEffect(() => {
    if (!confirmed) return;
    
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      
      // Simulate response status changes
      if (elapsedTime === 5) setResponseStatus('acknowledged');
      if (elapsedTime === 15) setResponseStatus('dispatched');
    }, 1000);
    
    return () => clearInterval(timer);
  }, [confirmed, elapsedTime]);

  // Countdown timer for hold-to-confirm
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanSend(true);
      Vibration.vibrate(200);
    }
  }, [countdown]);

  const startCountdown = () => {
    setCountdown(3);
    Vibration.vibrate(100);
    
    // Shake animation
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleEmergency = async () => {
    if (!canSend) {
      Alert.alert('⚠️ Hold to Confirm', 'Press and hold the button for 3 seconds to confirm emergency alert');
      return;
    }
    setSending(true);
    
    try {
      // Get user's location (in a real app, use geolocation API)
      const location = {
        description: 'Mine Site - Underground Sector B',
        latitude: 0, // Would be actual GPS coordinates
        longitude: 0,
      };

      // Get helmet data (if available from smart helmet connection)
      // In real implementation, this would come from the helmet's real-time data
      const helmetData = {
        pulse: { bpm: 95, spo2: 94 },
        env: { temp: 32 },
        helmet: { worn: true },
      };

      // Send SOS alert to Firebase
      const alertId = await sendSOSAlert(
        user.id || 'unknown',
        user.name || 'Unknown Miner',
        user.phone,
        location,
        helmetData
      );

      console.log('🚨 SOS Alert sent successfully:', alertId);
      
      setSending(false);
      setConfirmed(true);
      
      Vibration.vibrate([200, 100, 200]);
      
      Alert.alert(
        '🚨 SOS Alert Sent',
        'Emergency alert has been sent to all Supervisors and Safety Officers. Help is on the way. Stay calm and follow safety protocols.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Failed to send SOS alert:', error);
      setSending(false);
      
      Alert.alert(
        'Error',
        'Failed to send SOS alert. Please try again or contact supervisor directly.',
        [{ text: 'OK' }]
      );
    }
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.6],
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const makeCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <LinearGradient
      colors={['#7F1D1D', '#991B1B', '#B91C1C']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
        <View className="flex-1 items-center justify-center px-6 pt-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-4 right-4 p-3 bg-white/10 rounded-full z-10"
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {!confirmed ? (
            <>
              {/* Animated Alert Icon */}
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <AlertTriangle size={100} color="#FFFFFF" />
              </Animated.View>
              
              <Text className="text-white text-4xl font-bold mt-6 text-center">
                EMERGENCY SOS
              </Text>
              
              <Text className="text-white/90 text-base mt-3 text-center px-4 leading-6">
                Alert supervisors and safety officers immediately about your emergency
              </Text>

              {/* Status Cards */}
              <View className="flex-row mt-6 gap-3">
                <View className="bg-white/10 rounded-lg px-4 py-2 flex-row items-center">
                  <MapPin size={16} color="#FCD34D" />
                  <Text className="text-white text-xs ml-2">Location Tracked</Text>
                </View>
                <View className="bg-white/10 rounded-lg px-4 py-2 flex-row items-center">
                  <Heart size={16} color="#FCD34D" />
                  <Text className="text-white text-xs ml-2">Vitals Monitored</Text>
                </View>
              </View>

        {/* Main SOS Button Area */}
        (
          <View className="items-center mt-8">
            {/* Glow Ring */}
            <Animated.View 
              style={{
                position: 'absolute',
                width: 220,
                height: 220,
                borderRadius: 110,
                backgroundColor: '#FFFFFF',
                opacity: glowOpacity,
                top: 20,
              }}
            />
            
            {/* Main SOS Button */}
            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <TouchableOpacity
                onPressIn={startCountdown}
                onPress={handleEmergency}
                onPressOut={() => {
                  if (countdown !== null && countdown > 0) {
                    setCountdown(null);
                    setCanSend(false);
                  }
                }}
                disabled={sending}
                activeOpacity={0.8}
                className="mt-6"
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F3F4F6']}
                  className="rounded-full w-52 h-52 items-center justify-center"
                  style={{
                    shadowColor: '#FFFFFF',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.4,
                    shadowRadius: 30,
                    elevation: 15,
                  }}
                >
                  {sending ? (
                    <View className="items-center">
                      <ActivityIndicator size="large" color="#DC2626" />
                      <Text className="text-red-600 text-base font-bold mt-3">SENDING</Text>
                      <Text className="text-red-600/70 text-xs mt-1">Please wait...</Text>
                    </View>
                  ) : countdown !== null ? (
                    <View className="items-center">
                      <Text className="text-red-600 text-7xl font-bold">{countdown}</Text>
                      <Text className="text-red-600/80 text-sm mt-2">Hold to confirm</Text>
                    </View>
                  ) : (
                    <View className="items-center">
                      <AlertCircle size={70} color="#DC2626" />
                      <Text className="text-red-600 text-xl font-bold mt-3">PRESS & HOLD</Text>
                      <Text className="text-red-600/70 text-xs mt-1">For 3 seconds</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Instructions */}
            <View className="mt-8 bg-white/10 rounded-2xl p-5 w-full">
              <Text className="text-white text-sm font-semibold text-center mb-3">
                📡 Emergency Protocol Active
              </Text>
              <View className="space-y-2">
                <View className="flex-row items-start">
                  <Text className="text-yellow-300 mr-2">•</Text>
                  <Text className="text-white/90 text-xs flex-1">Location tracking enabled</Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-yellow-300 mr-2">•</Text>
                  <Text className="text-white/90 text-xs flex-1">Helmet vitals will be transmitted</Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-yellow-300 mr-2">•</Text>
                  <Text className="text-white/90 text-xs flex-1">All supervisors notified instantly</Text>
                </View>
              </View>
            </View>

            {/* Cancel Option */}
            {countdown !== null && (
              <TouchableOpacity
                onPress={() => {
                  setCountdown(null);
                  setCanSend(false);
                }}
                className="mt-4 bg-white/20 py-3 px-8 rounded-full"
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
            </>
          ) : (
          <View className="mt-6 items-center w-full">
            {/* Success Header */}
            <View className="bg-white/20 rounded-3xl p-6 w-full items-center mb-4">
              <View className="bg-green-500 rounded-full p-4 mb-4">
                <CheckCircle size={60} color="#FFFFFF" />
              </View>
              <Text className="text-white text-2xl font-bold text-center mb-2">
                SOS Alert Active!
              </Text>
              <Text className="text-white/90 text-center mb-4 leading-6">
                Emergency response team has been notified
              </Text>

              {/* Elapsed Time */}
              <View className="bg-white/10 rounded-xl p-3 flex-row items-center gap-2 mb-4">
                <Clock size={20} color="#FCD34D" />
                <Text className="text-white text-lg font-bold">
                  {formatTime(elapsedTime)}
                </Text>
                <Text className="text-white/70 text-sm">elapsed</Text>
              </View>

              {/* Response Status */}
              <View className="w-full bg-white/10 rounded-xl p-4 mb-4">
                <Text className="text-white font-semibold text-center mb-3">Response Status</Text>
                <View className="space-y-2">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View className={`w-3 h-3 rounded-full ${responseStatus === 'waiting' ? 'bg-yellow-400' : 'bg-green-500'}`} />
                      <Text className="text-white text-sm">Alert Sent</Text>
                    </View>
                    <Text className="text-green-400 text-xs">✓ Complete</Text>
                  </View>
                  
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View className={`w-3 h-3 rounded-full ${responseStatus === 'waiting' ? 'bg-gray-500' : responseStatus === 'acknowledged' ? 'bg-yellow-400' : 'bg-green-500'}`} />
                      <Text className="text-white text-sm">Acknowledged</Text>
                    </View>
                    {responseStatus !== 'waiting' && <Text className="text-green-400 text-xs">✓ Complete</Text>}
                  </View>
                  
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View className={`w-3 h-3 rounded-full ${responseStatus === 'dispatched' ? 'bg-yellow-400' : 'bg-gray-500'}`} />
                      <Text className="text-white text-sm">Team Dispatched</Text>
                    </View>
                    {responseStatus === 'dispatched' && (
                      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <Text className="text-yellow-400 text-xs font-bold">● IN PROGRESS</Text>
                      </Animated.View>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* Current Location */}
            <View className="bg-white/10 rounded-2xl p-4 w-full mb-4">
              <View className="flex-row items-center mb-3">
                <MapPin size={20} color="#FCD34D" />
                <Text className="text-white font-semibold ml-2">Your Location</Text>
              </View>
              <Text className="text-white/90 text-sm mb-3">Mine Site - Underground Sector B</Text>
              <View className="bg-white/5 rounded-lg h-32 items-center justify-center">
                <MapPin size={40} color="#FFFFFF" opacity={0.3} />
                <Text className="text-white/50 text-xs mt-2">Map View</Text>
              </View>
            </View>

            {/* Vital Signs */}
            <View className="bg-white/10 rounded-2xl p-4 w-full mb-4">
              <View className="flex-row items-center mb-3">
                <Heart size={20} color="#FCD34D" />
                <Text className="text-white font-semibold ml-2">Live Vitals</Text>
              </View>
              <View className="flex-row justify-around">
                <View className="items-center">
                  <Text className="text-white text-2xl font-bold">95</Text>
                  <Text className="text-white/70 text-xs mt-1">Heart Rate</Text>
                  <Text className="text-white/50 text-xs">BPM</Text>
                </View>
                <View className="items-center">
                  <Text className="text-white text-2xl font-bold">94%</Text>
                  <Text className="text-white/70 text-xs mt-1">SpO2</Text>
                  <Text className="text-white/50 text-xs">Oxygen</Text>
                </View>
                <View className="items-center">
                  <Text className="text-white text-2xl font-bold">32°</Text>
                  <Text className="text-white/70 text-xs mt-1">Temp</Text>
                  <Text className="text-white/50 text-xs">Celsius</Text>
                </View>
              </View>
            </View>

            {/* Emergency Contacts */}
            <View className="bg-white/10 rounded-2xl p-4 w-full mb-4">
              <View className="flex-row items-center mb-3">
                <Phone size={20} color="#FCD34D" />
                <Text className="text-white font-semibold ml-2">Emergency Contacts</Text>
              </View>
              {emergencyContacts.map((contact, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => makeCall(contact.phone)}
                  className="flex-row items-center justify-between bg-white/5 rounded-lg p-3 mb-2"
                  activeOpacity={0.7}
                >
                  <View className="flex-1">
                    <Text className="text-white font-semibold">{contact.name}</Text>
                    <Text className="text-white/60 text-xs">{contact.role}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white/80 text-sm">{contact.phone}</Text>
                    <View className="bg-green-500 rounded-full p-2">
                      <Phone size={16} color="#FFFFFF" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Safety Guidelines */}
            <View className="bg-yellow-900/30 border border-yellow-600/30 rounded-2xl p-4 w-full mb-4">
              <View className="flex-row items-center mb-3">
                <Shield size={20} color="#FCD34D" />
                <Text className="text-yellow-300 font-semibold ml-2">Safety Guidelines</Text>
              </View>
              <View className="space-y-2">
                <View className="flex-row items-start">
                  <Text className="text-yellow-300 mr-2">•</Text>
                  <Text className="text-white/90 text-xs flex-1">Stay in your current location unless in immediate danger</Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-yellow-300 mr-2">•</Text>
                  <Text className="text-white/90 text-xs flex-1">Keep your helmet and safety equipment on at all times</Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-yellow-300 mr-2">•</Text>
                  <Text className="text-white/90 text-xs flex-1">Conserve your energy and remain calm</Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-yellow-300 mr-2">•</Text>
                  <Text className="text-white/90 text-xs flex-1">Signal your location if you hear rescue team</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={() => makeCall('1800-MINE-911')}
                className="flex-1 bg-green-600 py-4 rounded-xl flex-row items-center justify-center"
              >
                <Phone size={20} color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">Call Control</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex-1 bg-white/20 py-4 rounded-xl"
              >
                <Text className="text-white font-bold text-center">Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
          )}
        </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
