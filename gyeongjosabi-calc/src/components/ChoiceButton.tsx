import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface ChoiceButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** 관계/친밀도/참석/식사 여부 등 한 줄짜리 선택지를 위한 큰 터치 버튼. */
export function ChoiceButton({ label, selected, onPress }: ChoiceButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, selected && styles.buttonSelected]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  buttonSelected: {
    borderColor: colors.borderSelected,
    backgroundColor: colors.surfaceSelected,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  labelSelected: {
    color: colors.primary,
  },
});
