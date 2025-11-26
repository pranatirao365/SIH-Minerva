import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useRouter } from 'expo-router';
import { getApp } from 'firebase/app';
import { PhoneAuthProvider } from 'firebase/auth';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone } from '../../components/Icons';
import { auth } from '../../config/firebase';
import { COLORS } from '../../constants/styles';
import { translator } from '../../services/translator';

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
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (err.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded.';
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
        firebaseConfig={firebaseApp.options}
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
});
