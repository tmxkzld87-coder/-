import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius } from '../theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function PrimaryButton({ label, onPress, disabled, variant = 'primary' }: PrimaryButtonProps) {
  const isSecondary = variant === 'secondary';
  return (
    <TouchableOpacity
      style={[styles.button, isSecondary && styles.buttonSecondary, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={[styles.label, isSecondary && styles.labelSecondary]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  labelSecondary: {
    color: colors.text,
  },
});
