import React from 'react';
import { TextInput, Text, View, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-foreground text-sm font-medium mb-2">{label}</Text>
      )}
      <TextInput
        className={`bg-neutral-900 border border-border rounded-lg px-4 py-3 text-foreground ${error ? 'border-destructive' : ''} ${className}`}
        placeholderTextColor="#737373"
        {...props}
      />
      {error && (
        <Text className="text-destructive text-sm mt-1">{error}</Text>
      )}
    </View>
  );
};
