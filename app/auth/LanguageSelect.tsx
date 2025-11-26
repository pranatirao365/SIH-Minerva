import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Globe, Check } from '../../components/Icons';
import { translator } from '../../services/translator';
import { useRoleStore } from '../../hooks/useRoleStore';
import { Language } from '../../constants/translations';
import { COLORS } from '../../constants/styles';

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
];

export default function LanguageSelect() {
  const router = useRouter();
  const { language, setLanguage } = useRoleStore();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);

  const handleContinue = () => {
    setLanguage(selectedLanguage);
    translator.setLanguage(selectedLanguage);
    router.push('/auth/PhoneLogin');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Globe size={80} color={COLORS.primary} />
          <Text style={styles.title}>
            {translator.translate('selectLanguage', selectedLanguage)}
          </Text>
          <Text style={styles.subtitle}>
            Choose your preferred language
          </Text>
        </View>

        <View style={styles.languageList}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => setSelectedLanguage(lang.code)}
              style={[
                styles.languageCard,
                selectedLanguage === lang.code && styles.languageCardSelected
              ]}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.languageNative}>{lang.nativeName}</Text>
                <Text style={styles.languageName}>{lang.name}</Text>
              </View>
              {selectedLanguage === lang.code && (
                <Check size={24} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>
            {translator.translate('continue', selectedLanguage)}
          </Text>
        </TouchableOpacity>
      </View>
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  languageList: {
    marginTop: 32,
    gap: 16,
  },
  languageCard: {
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  languageCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  languageNative: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  languageName: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
