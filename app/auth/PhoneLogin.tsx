import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useRouter } from 'expo-router';
import { getApp } from 'firebase/app';
import { PhoneAuthProvider } from 'firebase/auth';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone } from '../../components/Icons';
import { auth, firebaseConfig } from '../../config/firebase';
import { COLORS } from '../../constants/styles';
import { translator } from '../../services/translator';

// 🧪 TEST MODE - Remove this in production!
const TEST_PHONES = [
  '+911234567890', // Miner
  '+911234567891', // Engineer
  '+911234567892', // Supervisor
  '+911234567893', // Safety Officer
  '+911234567894', // Admin
  '+919000000001',  // Ravi (Supervisor)
  '+919000000002',  // Suresh (Supervisor)
  '+918000000001',  // Arun (Miner)
  '+918000000002',  // Rakesh (Miner)
  '+918000000003',  // Mahesh (Miner)
  '+918000000004',  // Deepak (Miner)
  '+918000000005',  // Imran (Miner)
  '+918000000006',  // Harish (Miner)
  '+918000000007',  // Vijay (Miner)
  '+918000000008',  // Santosh (Miner)
  '+918000000009',  // Sunil (Miner)
  '+918000000010',  // Gopal (Miner)
  '+917000000001',  // Anita (Safety Officer)
  '+919876543210',  // miner-1 (Blasting Department) - Test OTP: 123456
  '+919876543211'   // miner-2 (Equipment Maintenance) - Test OTP: 123456
];
const IS_TEST_MODE = true; // Set to false in production

export default function PhoneLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState('+91');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const recaptchaVerifier = useRef<any>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const firebaseApp = getApp();

  // Validate phone number in E.164 format (+91XXXXXXXXXX)
  const validatePhone = (number: string) => {
    const phoneRegex = /^\+91[0-9]{10}$/;
    return phoneRegex.test(number);
  };

  // Format phone number input
  const handlePhoneChange = (text: string) => {
    if (!text.startsWith('+91')) {
      text = '+91' + text.replace(/[^0-9]/g, '');
    }
    const cleaned = '+91' + text.slice(3).replace(/[^0-9]/g, '');
    const limited = cleaned.slice(0, 13);
    setPhone(limited);
    setError('');
  };

  const handleSendOTP = async () => {
    setError('');

    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number (+91 followed by 10 digits)');
      return;
    }

    setLoading(true);

    try {
      // 🧪 TEST MODE: Skip real OTP for test numbers (but still apply rate limiting)
      if (IS_TEST_MODE && TEST_PHONES.includes(phone)) {
        console.log('🧪 TEST MODE: Using test phone number');
        
        const testVerificationId = 'TEST_VERIFICATION_ID';
        
        // Determine role based on phone number
        let roleInfo = '';
        if (phone === '+911234567890') roleInfo = 'Role: Miner';
        else if (phone === '+911234567891') roleInfo = 'Role: Engineer';
        else if (phone === '+911234567892') roleInfo = 'Role: Supervisor';
        else if (phone === '+911234567893') roleInfo = 'Role: Safety Officer';
        else if (phone === '+911234567894') roleInfo = 'Role: Admin';
        
        Alert.alert(
          '🧪 Test Mode',
          `Test phone detected!\n\nPhone: ${phone}\n${roleInfo}\nTest OTP: 123456\n\nEnter 123456 in the next screen.\n\n⏰ Next test OTP available in 30 seconds.`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                router.push({
                  pathname: '/auth/OTPVerification',
                  params: { 
                    phoneNumber: phone,
                    verificationId: testVerificationId,
                    isTestMode: 'true'
                  }
                });
              }
            }
          ]
        );
        setLoading(false);
        return;
      }
      
      console.log('📱 Sending OTP to:', phone);
      
      // Use PhoneAuthProvider.verifyPhoneNumber (matching your working flow)
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationIdResult = await phoneProvider.verifyPhoneNumber(
        phone,
        recaptchaVerifier.current
      );
      
      setVerificationId(verificationIdResult);
      
      console.log('✅ OTP sent successfully!');
      console.log('📧 Check your phone for the verification code');
      
      Alert.alert(
        'OTP Sent',
        `A verification code has been sent to ${phone}.\n\nPlease check your SMS messages.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              router.push({
                pathname: '/auth/OTPVerification',
                params: { 
                  phoneNumber: phone,
                  verificationId: verificationIdResult
                }
              });
            }
          }
        ]
      );
    } catch (err: any) {
      console.error('❌ Error sending OTP:', err);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (err.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many OTP requests. Please try again later.';
      } else if (err.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please contact support.';
      } else if (err.code === 'auth/captcha-check-failed') {
        errorMessage = 'Security verification failed. Please try again.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      Alert.alert('Error', errorMessage);
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
          <Phone size={80} color={COLORS.primary} />
          <Text style={styles.title}>
            {translator.translate('phoneLogin')}
          </Text>
          <Text style={styles.subtitle}>
            Enter your phone number to continue
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{translator.translate('enterPhone')}</Text>
          <View style={styles.phoneInputContainer}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              style={[styles.phoneInput, error ? styles.inputError : null]}
              value={phone.slice(3)} // Show only the digits after +91
              onChangeText={(text) => {
                // Only allow numbers and limit to 10 digits
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
                handlePhoneChange('+91' + cleaned);
              }}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="9876543210"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {translator.translate('sendOTP')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
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
  form: {
    marginTop: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.destructive,
  },
  errorText: {
    color: COLORS.destructive,
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
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
    marginTop: 32,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  cooldownContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.destructive + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.destructive + '30',
  },
  cooldownText: {
    color: COLORS.destructive,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
