import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { formatWon } from '../logic/labels';
import { colors, radius, spacing } from '../theme';

interface AmountChipProps {
  amount: number;
  selected: boolean;
  highlighted?: boolean;
  onPress: () => void;
}

/** 금액 선택 칩. highlighted는 추천 금액임을 표시할 때 쓴다. */
export function AmountChip({ amount, selected, highlighted, onPress }: AmountChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, highlighted && styles.chipHighlighted, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text
        style={[styles.label, highlighted && !selected && styles.labelHighlighted, selected && styles.labelSelected]}
      >
        {formatWon(amount)}
      </Text>
      {highlighted && <Text style={[styles.badge, selected && styles.labelSelected]}>추천</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 48,
    minWidth: 96,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  chipHighlighted: {
    borderColor: colors.borderSelected,
    backgroundColor: colors.surfaceSelected,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  labelHighlighted: {
    color: colors.primary,
  },
  labelSelected: {
    color: colors.white,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
