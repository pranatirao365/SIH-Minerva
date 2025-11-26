import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShieldCheck } from '../../components/Icons';
import { translator } from '../../services/translator';
import { COLORS } from '../../constants/styles';

export default function OTPVerification() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

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

  const handleVerify = () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter complete OTP');
      return;
    }

    // Simulate OTP verification (accept any 6-digit code)
    Alert.alert(
      'Verification Successful',
      'Phone number verified successfully',
      [{ text: 'OK', onPress: () => router.push('/auth/RoleSelection') }]
    );
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

        <TouchableOpacity style={styles.button} onPress={handleVerify}>
          <Text style={styles.buttonText}>
            {translator.translate('verify')}
          </Text>
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
