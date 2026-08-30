import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface SelectedIngredientPillProps {
  label: string;
  onRemove: () => void;
}

export function SelectedIngredientPill({ label, onRemove }: SelectedIngredientPillProps) {
  return (
    <Pressable
      style={styles.pill}
      onPress={onRemove}
      accessibilityRole="button"
      accessibilityLabel={`${label} 선택 해제`}
    >
      <Text style={styles.text}>{label} ×</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    marginRight: spacing.sm,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
});
