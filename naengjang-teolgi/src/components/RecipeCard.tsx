import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Recipe, RecommendationSlotLabel } from '../recommendation/types';
import { colors, radius, spacing } from '../theme';

const SLOT_META: Record<RecommendationSlotLabel, { emoji: string; label: string }> = {
  top: { emoji: '🥇', label: '가장 추천' },
  also: { emoji: '🥈', label: '이것도 좋아요' },
  simple: { emoji: '🥉', label: '간단하게' },
};

export interface RecipeCardDetail {
  ownedNames: string[];
  missingNames: string[];
}

interface RecipeCardProps {
  recipe: Recipe;
  ownedCount: number;
  totalCount: number;
  slotLabel?: RecommendationSlotLabel;
  detail?: RecipeCardDetail;
  shoppingHint?: string;
  onPress: () => void;
}

export function RecipeCard({ recipe, ownedCount, totalCount, slotLabel, detail, shoppingHint, onPress }: RecipeCardProps) {
  const meta = slotLabel ? SLOT_META[slotLabel] : null;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {meta && (
        <Text style={styles.badge}>
          {meta.emoji} {meta.label}
        </Text>
      )}
      <Text style={styles.name}>{recipe.name}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>⏱ {recipe.cookTimeMinutes}분</Text>
        <Text style={styles.meta}>{'⭐'.repeat(recipe.difficulty)}</Text>
        <Text style={styles.match}>
          보유 재료 {ownedCount}/{totalCount}
        </Text>
      </View>

      {shoppingHint ? (
        <Text style={styles.shoppingHint}>{shoppingHint}</Text>
      ) : (
        detail && (
          <View style={styles.detailBlock}>
            <Text style={styles.detailHeading}>보유 재료</Text>
            <Text style={styles.detailList}>{detail.ownedNames.length ? detail.ownedNames.join(', ') : '없음'}</Text>
            <Text style={styles.detailHeading}>추가 재료</Text>
            <Text style={styles.detailList}>{detail.missingNames.length ? detail.missingNames.join(', ') : '없음'}</Text>
          </View>
        )
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  badge: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  match: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  detailBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  detailList: {
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  shoppingHint: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    fontSize: 14,
    fontWeight: '700',
    color: colors.warning,
  },
});
