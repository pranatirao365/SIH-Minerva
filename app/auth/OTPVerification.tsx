import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getApp } from 'firebase/app';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck } from '../../components/Icons';
import { auth, db, firebaseConfig } from '../../config/firebase';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';
import { translator } from '../../services/translator';

// 🧪 TEST MODE - Remove this in production!
const TEST_OTP = '123456';
const IS_TEST_MODE = true; // Set to false in production

/**
 * Helper function to find user by phone number.
 * Supports multiple storage formats:
 * 1. Document ID = phone number (e.g., 918074540124)
 * 2. Document ID = employee ID, with phoneNumber field query
 * 
 * @param phoneWithPrefix - Phone number in format +918074540124
 * @returns User data with document ID, or null if not found
 */
async function getUserByPhone(phoneWithPrefix: string) {
  // Remove + prefix for document ID lookup
  const phone = phoneWithPrefix.replace('+', '');
  
  console.log('🔍 Searching for user with phone:', phoneWithPrefix);
  console.log('📊 Strategy 1: Direct document ID lookup with:', phone);
  
  // Strategy 1: Try direct document lookup (for users stored as docId = phoneNumber)
  try {
    const userDoc = await getDoc(doc(db, 'users', phone));
    if (userDoc.exists()) {
      console.log('✅ User found via document ID:', phone);
      return { id: userDoc.id, ...userDoc.data() };
    }
  } catch (error) {
    console.log('⚠️ Direct lookup failed:', error);
  }
  
  console.log('📊 Strategy 2: Query by phoneNumber field (with + prefix)');
  
  // Strategy 2: Query by phoneNumber field with +91 prefix
  try {
    const q = query(collection(db, 'users'), where('phoneNumber', '==', phoneWithPrefix));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      console.log('✅ User found via phoneNumber query (with +):', userDoc.id);
      return { id: userDoc.id, ...userDoc.data() };
    }
  } catch (error) {
    console.log('⚠️ Query with + prefix failed:', error);
  }
  
  console.log('📊 Strategy 3: Query by phoneNumber field (without + prefix)');
  
  // Strategy 3: Query by phoneNumber field without + prefix
  try {
    const phoneWithoutPlus = phoneWithPrefix.replace('+', '');
    const q = query(collection(db, 'users'), where('phoneNumber', '==', phoneWithoutPlus));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      console.log('✅ User found via phoneNumber query (no +):', userDoc.id);
      return { id: userDoc.id, ...userDoc.data() };
    }
  } catch (error) {
    console.log('⚠️ Query without + prefix failed:', error);
  }
  
  console.log('❌ User not found with any strategy');
  return null;
}

export default function OTPVerification() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const phoneNumber = params.phoneNumber as string;
  const verificationId = params.verificationId as string;
  const isTestMode = params.isTestMode === 'true';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const recaptchaVerifier = useRef<any>(null);
  const firebaseApp = getApp();
  const { setRole, setUser } = useRoleStore();

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
      // Test data OTP mapping
      const testOTPs: { [key: string]: string } = {
        '9000000001': '123456', // Ravi
        '9000000002': '234567', // Suresh
        '8000000001': '345678', // Arun
        '8000000002': '456789', // Rakesh
        '8000000003': '567890', // Mahesh
        '8000000004': '678901', // Deepak
        '8000000005': '789012', // Imran
        '8000000006': '890123', // Harish
        '8000000007': '901234', // Vijay
        '8000000008': '012345', // Santosh
        '8000000009': '123789', // Sunil
        '8000000010': '234890', // Gopal
        '7000000001': '345901', // Anita
        '1234567890': '111111', // Test Miner
        '1234567891': '222222', // Test Engineer
        '1234567892': '333333', // Test Supervisor
        '1234567893': '444444', // Test Safety Officer
        '1234567894': '555555', // Test Admin
        '9876543210': '123456', // miner-1 (Blasting Department)
        '9876543211': '123456'  // miner-2 (Equipment Maintenance)
      };
      
      const phoneWithoutPrefix = phoneNumber.replace('+91', '');
      if (testOTPs[phoneWithoutPrefix] && testOTPs[phoneWithoutPrefix] === otpCode) {
        console.log('✅ Test data OTP verified for phone:', phoneNumber);
        
        console.log('📊 Fetching user data from Firestore for phone:', phoneNumber);
        
        // Fetch user using query-based approach
        const userData = await getUserByPhone(phoneNumber);
        
        if (userData) {
          const userRole = userData.role;
          
          console.log('✅ User found with role:', userRole);
          
          // Set the user data in the store
          setUser({
            id: userData.id,
            name: (userData as any).name || 'User',
            phone: phoneNumber,
            role: userRole
          });
          setRole(userRole);
          
          // Navigate based on role
          switch (userRole) {
            case 'miner':
              router.replace('/miner/MinerHome');
              break;
            case 'engineer':
              router.replace('/engineer/EngineerHome');
              break;
            case 'safety_officer':
            case 'safety-officer':
              router.replace('/safety-officer/SafetyOfficerHome');
              break;
            case 'supervisor':
              router.replace('/supervisor/SupervisorHome');
              break;
            case 'admin':
              router.replace('/admin/AdminHome');
              break;
            default:
              Alert.alert('Error', `Invalid user role: ${userRole}`);
          }
          setLoading(false);
          return;
        } else {
          console.log('⚠️ User not found in database');
          Alert.alert(
            'Access Denied',
            'Your phone number is not registered in the system. Please contact your administrator.',
            [{ 
              text: 'OK', 
              onPress: () => router.replace('/auth/PhoneLogin')
            }]
          );
          setLoading(false);
          return;
        }
      }

      // 🧪 TEST MODE: Bypass Firebase authentication for test mode
      if (IS_TEST_MODE && isTestMode && verificationId === 'TEST_VERIFICATION_ID') {
        console.log('🧪 TEST MODE: Bypassing Firebase authentication');
        
        if (otpCode !== TEST_OTP) {
          Alert.alert('Invalid OTP', `Test OTP is: ${TEST_OTP}`);
          setLoading(false);
          return;
        }
        
        console.log('✅ Test OTP verified!');
        
        console.log('📊 Fetching user data from Firestore for phone:', phoneNumber);
        
        // Fetch user using query-based approach
        const userData = await getUserByPhone(phoneNumber);
        
        if (userData) {
          const userRole = userData.role;
          
          console.log('✅ User found with role:', userRole);
          
          // Set the user data in the store
          setUser({
            id: userData.id,
            name: (userData as any).name || 'User',
            phone: phoneNumber,
            role: userRole
          });
          setRole(userRole);
          
          // Navigate based on role
          switch (userRole) {
            case 'miner':
              router.replace('/miner/MinerHome');
              break;
            case 'engineer':
              router.replace('/engineer/EngineerHome');
              break;
            case 'safety_officer':
            case 'safety-officer':
              router.replace('/safety-officer/SafetyOfficerHome');
              break;
            case 'supervisor':
              router.replace('/supervisor/SupervisorHome');
              break;
            case 'admin':
              router.replace('/admin/AdminHome');
              break;
            default:
              Alert.alert('Error', `Invalid user role: ${userRole}`);
          }
          setLoading(false);
          return;
        } else {
          console.log('⚠️ User not found in database');
          Alert.alert(
            'Access Denied',
            'Your phone number is not registered in the system. Please contact your administrator.',
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
      console.log('📞 Phone:', userCredential.user.phoneNumber);
      
      // Get phone from authenticated user (already in format +918074540124)
      const authenticatedPhone = userCredential.user.phoneNumber || phoneNumber;
      
      console.log('📊 Fetching user data from Firestore for phone:', authenticatedPhone);
      
      // Fetch user using query-based approach (supports both docId formats)
      const userData = await getUserByPhone(authenticatedPhone);
      
      if (userData) {
        const userRole = userData.role;
        
        console.log('✅ User found with role:', userRole);
        
        // Register authenticated user for progress tracking
        if (userRole === 'miner') {
          try {
            const authenticatedUsers = await AsyncStorage.getItem('authenticatedUsers');
            const userIds = authenticatedUsers ? JSON.parse(authenticatedUsers) : [];
            
            if (!userIds.includes(userCredential.user.uid)) {
              userIds.push(userCredential.user.uid);
              await AsyncStorage.setItem('authenticatedUsers', JSON.stringify(userIds));
              console.log('✅ User registered for progress tracking:', userCredential.user.uid);
            }
          } catch (error) {
            console.error('❌ Error registering user for progress tracking:', error);
          }
        }
        
        // Set the user data in the store
        setUser({
          id: userData.id,
          name: userData.name || 'User',
          phone: authenticatedPhone,
          role: userRole
        });
        setRole(userRole);
        
        // Navigate based on role
        switch (userRole) {
          case 'miner':
            router.replace('/miner/MinerHome');
            break;
          case 'engineer':
            router.replace('/engineer/EngineerHome');
            break;
          case 'safety_officer':
          case 'safety-officer':
            router.replace('/safety-officer/SafetyOfficerHome');
            break;
          case 'supervisor':
            router.replace('/supervisor/SupervisorHome');
            break;
          case 'admin':
            router.replace('/admin/AdminHome');
            break;
          default:
            Alert.alert('Error', `Invalid user role: ${userRole}`);
        }
      } else {
        console.log('⚠️ User not found in database');
        Alert.alert(
          'Access Denied',
          'Your phone number is not registered in the system. Please contact your administrator.',
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
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification={true}
      />
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
              ref={(ref) => { inputRefs.current[index] = ref; }}
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
