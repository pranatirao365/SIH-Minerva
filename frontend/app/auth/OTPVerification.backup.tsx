import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShieldCheck } from '../../components/Icons';
import { translator } from '../../services/translator';
import { Button } from '../../components/ui/Button';

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
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6">
        <View className="items-center justify-center py-12">
          <ShieldCheck size={80} color="#FF6B00" />
          <Text className="text-3xl font-bold text-foreground mt-6">
            {translator.translate('verifyOTP')}
          </Text>
          <Text className="text-neutral-400 text-center mt-2">
            {translator.translate('enterOTP')}
          </Text>
        </View>

        <View className="mt-8 flex-row justify-center space-x-2">
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              className="w-12 h-14 bg-neutral-900 border-2 border-border rounded-lg text-center text-foreground text-xl font-bold"
              style={{ marginHorizontal: 4 }}
            />
          ))}
        </View>

        <Button onPress={handleVerify} size="lg" className="mt-8">
          {translator.translate('verify')}
        </Button>

        <View className="mt-6">
          <Text className="text-neutral-500 text-sm text-center">
            Didn't receive code?{' '}
            <Text className="text-primary">Resend OTP</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
