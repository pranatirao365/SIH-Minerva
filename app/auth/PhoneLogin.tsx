import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Phone } from '../../components/Icons';
import { translator } from '../../services/translator';
import { COLORS } from '../../constants/styles';

export default function PhoneLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const validatePhone = (number: string) => {
    return /^[0-9]{10}$/.test(number);
  };

  const handleSendOTP = () => {
    setError('');
    
    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    // Simulate OTP sending
    Alert.alert(
      'OTP Sent',
      `Verification code sent to ${phone}`,
      [{ text: 'OK', onPress: () => router.push('/auth/OTPVerification') }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setError('');
            }}
            keyboardType="phone-pad"
            maxLength={10}
            placeholder="9876543210"
            placeholderTextColor={COLORS.textMuted}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleSendOTP}>
            <Text style={styles.buttonText}>
              {translator.translate('sendOTP')}
            </Text>
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
