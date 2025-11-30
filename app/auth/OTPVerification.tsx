import { useLocalSearchParams, useRouter } from 'expo-router';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck } from '../../components/Icons';
import { auth, db } from '../../config/firebase';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';
import { translator } from '../../services/translator';

// 🧪 TEST MODE - Remove this in production!
const TEST_OTP = '123456';
const IS_TEST_MODE = true; // Set to false in production

export default function OTPVerification() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const phoneNumber = params.phoneNumber as string;
  const verificationId = params.verificationId as string;
  const isTestMode = params.isTestMode === 'true';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { setRole } = useRoleStore();

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter complete OTP');
      return;
    }

    setLoading(true);

    try {
      // 🧪 TEST MODE: Bypass Firebase authentication for test mode
      if (IS_TEST_MODE && isTestMode && verificationId === 'TEST_VERIFICATION_ID') {
        console.log('🧪 TEST MODE: Bypassing Firebase authentication');
        console.log('📱 Entered Phone Number:', phoneNumber);
        
        if (otpCode !== TEST_OTP) {
          Alert.alert('Invalid OTP', `Test OTP is: ${TEST_OTP}`);
          setLoading(false);
          return;
        }
        
        console.log('✅ Test OTP verified!');
        
        // CRITICAL: Normalize phone number - remove + and any spaces/dashes
        const normalizedPhone = phoneNumber.replace(/[^0-9]/g, '');
        
        console.log('📊 Normalized Phone for Firestore Query:', normalizedPhone);
        console.log('🔍 Querying Firestore: users/' + normalizedPhone);
        
        // Fetch user role from Firestore using EXACT document ID
        const userDocRef = doc(db, 'users', normalizedPhone);
        const userDoc = await getDoc(userDocRef);
        
        console.log('📄 Document exists:', userDoc.exists());
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('📋 Full User Data:', JSON.stringify(userData, null, 2));
          
          // CRITICAL: Read role field EXACTLY as stored
          const userRole = userData.role;
          
          console.log('🎭 Role Field Value:', userRole);
          console.log('🎭 Role Type:', typeof userRole);
          
          if (!userRole) {
            console.error('❌ Role field is missing or undefined!');
            Alert.alert('Error', 'User role not found in database. Please contact administrator.');
            setLoading(false);
            return;
          }
          
          // Normalize role to lowercase for consistent comparison
          const normalizedRole = userRole.toLowerCase().trim();
          console.log('✅ Normalized Role:', normalizedRole);
          
          // Set the role in the store (store original case)
          setRole(userRole);
          
          // CRITICAL: Store user information including phoneNumber for incident reporting
          const { setUser } = useRoleStore.getState();
          setUser({
            id: normalizedPhone,
            phoneNumber: normalizedPhone,
            phone: phoneNumber,
            name: userData.name || 'User',
            role: userRole
          });
          
          console.log('✅ User info stored in state:', {
            id: normalizedPhone,
            phoneNumber: normalizedPhone,
            name: userData.name || 'User',
            role: userRole
          });
          
          // Navigate based on role (case-insensitive comparison)
          console.log('🧭 Determining navigation for role:', normalizedRole);
          
          if (normalizedRole === 'miner') {
            console.log('➡️ Navigating to: /miner/MinerHome');
            router.replace('/miner/MinerHome');
          } else if (normalizedRole === 'engineer') {
            console.log('➡️ Navigating to: /engineer/EngineerHome');
            router.replace('/engineer/EngineerHome');
          } else if (normalizedRole === 'safety_officer' || normalizedRole === 'safety-officer') {
            console.log('➡️ Navigating to: /safety-officer/SafetyOfficerHome');
            router.replace('/safety-officer/SafetyOfficerHome');
          } else if (normalizedRole === 'supervisor') {
            console.log('➡️ Navigating to: /supervisor/SupervisorHome');
            router.replace('/supervisor/SupervisorHome');
          } else if (normalizedRole === 'admin') {
            console.log('➡️ Navigating to: /admin/AdminHome');
            router.replace('/admin/AdminHome');
          } else {
            console.error('❌ Unknown role:', normalizedRole);
            Alert.alert('Error', `Invalid user role: ${userRole}. Please contact administrator.`);
          }
          setLoading(false);
          return;
        } else {
          console.log('⚠️ User document not found in Firestore');
          console.log('🔍 Attempted path: users/' + normalizedPhone);
          Alert.alert(
            'Access Denied',
            `Phone number ${phoneNumber} is not registered.\n\nPlease contact your administrator to add your number to the system.`,
            [{ 
              text: 'OK', 
              onPress: () => router.replace('/auth/PhoneLogin')
            }]
          );
          setLoading(false);
          return;
        }
      }
      
      console.log('🔐 Verifying OTP for phone:', phoneNumber);
      console.log('📱 OTP Code:', otpCode);
      console.log('🆔 Verification ID:', verificationId);
      
      // Create credential with verification ID and OTP code
      const credential = PhoneAuthProvider.credential(verificationId, otpCode);
      
      console.log('✅ Credential created, signing in...');
      
      // Sign in with the credential
      const userCredential = await signInWithCredential(auth, credential);
      
      console.log('✅ Firebase authentication successful!');
      console.log('👤 User UID:', userCredential.user.uid);
      console.log('📞 Authenticated Phone:', userCredential.user.phoneNumber);
      
      // CRITICAL: Normalize phone number - remove all non-numeric characters
      const authenticatedPhone = userCredential.user.phoneNumber || phoneNumber;
      const normalizedPhone = authenticatedPhone.replace(/[^0-9]/g, '');
      
      console.log('📊 Normalized Phone for Firestore Query:', normalizedPhone);
      console.log('🔍 Querying Firestore: users/' + normalizedPhone);
      
      // Fetch user role from Firestore using EXACT document ID
      const userDocRef = doc(db, 'users', normalizedPhone);
      const userDoc = await getDoc(userDocRef);
      
      console.log('📄 Document exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('📋 Full User Data:', JSON.stringify(userData, null, 2));
        
        // CRITICAL: Read role field EXACTLY as stored
        const userRole = userData.role;
        
        console.log('🎭 Role Field Value:', userRole);
        console.log('🎭 Role Type:', typeof userRole);
        
        if (!userRole) {
          console.error('❌ Role field is missing or undefined!');
          Alert.alert('Error', 'User role not found in database. Please contact administrator.');
          setLoading(false);
          return;
        }
        
        // Normalize role to lowercase for consistent comparison
        const normalizedRole = userRole.toLowerCase().trim();
        console.log('✅ Normalized Role:', normalizedRole);
        
        // Set the role in the store (store original case)
        setRole(userRole);
        
        // Navigate based on role (case-insensitive comparison)
        console.log('🧭 Determining navigation for role:', normalizedRole);
        
        if (normalizedRole === 'miner') {
          console.log('➡️ Navigating to: /miner/MinerHome');
          router.replace('/miner/MinerHome');
        } else if (normalizedRole === 'engineer') {
          console.log('➡️ Navigating to: /engineer/EngineerHome');
          router.replace('/engineer/EngineerHome');
        } else if (normalizedRole === 'safety_officer' || normalizedRole === 'safety-officer') {
          console.log('➡️ Navigating to: /safety-officer/SafetyOfficerHome');
          router.replace('/safety-officer/SafetyOfficerHome');
        } else if (normalizedRole === 'supervisor') {
          console.log('➡️ Navigating to: /supervisor/SupervisorHome');
          router.replace('/supervisor/SupervisorHome');
        } else if (normalizedRole === 'admin') {
          console.log('➡️ Navigating to: /admin/AdminHome');
          router.replace('/admin/AdminHome');
        } else {
          console.error('❌ Unknown role:', normalizedRole);
          Alert.alert('Error', `Invalid user role: ${userRole}. Please contact administrator.`);
        }
      } else {
        console.log('⚠️ User document not found in Firestore');
        console.log('🔍 Attempted path: users/' + normalizedPhone);
        Alert.alert(
          'Access Denied',
          `Phone number ${phoneNumber} is not registered.\n\nPlease contact your administrator to add your number to the system.`,
          [{ 
            text: 'OK', 
            onPress: () => router.replace('/auth/PhoneLogin')
          }]
        );
      }
    } catch (err: any) {
      console.error('❌ Error verifying OTP:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      let errorMessage = 'Failed to verify OTP. Please try again.';
      
      if (err.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP code. Please check and try again.';
      } else if (err.code === 'auth/code-expired') {
        errorMessage = 'OTP code has expired. Please request a new one.';
      } else if (err.code === 'auth/session-expired') {
        errorMessage = 'Verification session expired. Please start over.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ShieldCheck size={80} color={COLORS.primary} />
          <Text style={styles.title}>
            {translator.translate('verifyOTP')}
          </Text>
          <Text style={styles.subtitle}>
            {translator.translate('enterOTP')}
          </Text>
          {phoneNumber && (
            <Text style={styles.phoneNumber}>
              Sent to {phoneNumber}
            </Text>
          )}
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              style={styles.otpInput}
            />
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {translator.translate('verify')}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Didn't receive code?{' '}
            <Text style={styles.resendText}>Resend OTP</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 24,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  phoneNumber: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    gap: 8,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  resendText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
