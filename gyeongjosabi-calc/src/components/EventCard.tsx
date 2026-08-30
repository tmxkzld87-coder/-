import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface EventCardProps {
  emoji: string;
  title: string;
  selected: boolean;
  onPress: () => void;
}

/** 홈 화면의 큰 행사 선택 카드(결혼식/장례식/돌잔치). */
export function EventCard({ emoji, title, selected, onPress }: EventCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 120,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  cardSelected: {
    borderColor: colors.borderSelected,
    backgroundColor: colors.surfaceSelected,
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  titleSelected: {
    color: colors.primary,
  },
});
