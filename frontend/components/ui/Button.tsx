import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClass = 'rounded-lg items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    destructive: 'bg-destructive',
    outline: 'bg-transparent border-2 border-primary',
  };

  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const textColorClasses = {
    primary: 'text-white',
    secondary: 'text-white',
    destructive: 'text-white',
    outline: 'text-primary',
  };

  return (
    <TouchableOpacity
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      <Text className={`${textSizeClasses[size]} ${textColorClasses[variant]} font-semibold`}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};
