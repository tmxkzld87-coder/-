import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ingredient } from '../data/ingredients';
import { colors, radius, spacing } from '../theme';

interface IngredientCardProps {
  ingredient: Ingredient;
  selected: boolean;
  onPress: (id: string) => void;
}

/** 재료 선택 카드. 자주 쓰는 재료/최근 사용/카테고리 그리드/검색 결과에서 모두 재사용한다. */
export function IngredientCard({ ingredient, selected, onPress }: IngredientCardProps) {
  return (
    <Pressable
      style={[styles.card, selected && styles.cardSelected]}
      onPress={() => onPress(ingredient.id)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={styles.emoji}>{ingredient.emoji}</Text>
      <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
        {ingredient.name}
      </Text>
    </Pressable>
  );
}

const CARD_SIZE = 76;

const styles = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    minHeight: CARD_SIZE,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    gap: 4,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  emoji: {
    fontSize: 26,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  nameSelected: {
    color: colors.accent,
  },
});
