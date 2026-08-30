import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ingredient } from '../data/ingredients';
import { SelectedIngredientPill } from './SelectedIngredientPill';
import { colors, radius, spacing } from '../theme';

interface SelectedTrayProps {
  selectedIngredients: Ingredient[];
  onRemove: (id: string) => void;
  onRecommend: () => void;
  onRandom: () => void;
  canRecommend: boolean;
}

export function SelectedTray({ selectedIngredients, onRemove, onRecommend, onRandom, canRecommend }: SelectedTrayProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>내 냉장고</Text>
        <Text style={styles.count}>선택한 재료 {selectedIngredients.length}개</Text>
      </View>

      {selectedIngredients.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {selectedIngredients.map((ingredient) => (
            <SelectedIngredientPill key={ingredient.id} label={ingredient.name} onRemove={() => onRemove(ingredient.id)} />
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.empty}>재료를 선택해주세요 (최소 2개)</Text>
      )}

      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.primaryButton, !canRecommend && styles.buttonDisabled]}
          onPress={onRecommend}
          disabled={!canRecommend}
        >
          <Text style={styles.primaryButtonText}>🍳 요리 추천받기</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryButton, !canRecommend && styles.buttonDisabled]}
          onPress={onRandom}
          disabled={!canRecommend}
          accessibilityLabel="아무거나 골라줘"
        >
          <Text style={styles.secondaryButtonText}>🎲</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  count: {
    fontSize: 12,
    color: colors.textMuted,
  },
  empty: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  pillRow: {
    marginTop: spacing.sm,
    paddingBottom: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  secondaryButton: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 20,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
