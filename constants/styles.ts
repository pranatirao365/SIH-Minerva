import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#FF6B00',
  secondary: '#1E40AF',
  accent: '#10B981',
  destructive: '#EF4444',
  background: '#0A0A0A',
  card: '#1A1A1A',
  border: '#27272A',
  text: '#FAFAFA',
  textMuted: '#A1A1AA',
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    color: COLORS.text,
  },
  textMuted: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
});
