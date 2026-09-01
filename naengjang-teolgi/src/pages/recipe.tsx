import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from '@granite-js/native/react-native-safe-area-context';
import { createRoute } from '@granite-js/react-native';
import { getTossShareLink, share } from '@apps-in-toss/framework';
import { getRecipe } from '../data/recipes';
import { getIngredient } from '../data/ingredients';
import { DIFFICULTY_LABEL } from '../recommendation/types';
import { FavoritesStore } from '../storage/favorites';
import { RecipeRouteParams } from '../routeParams';
import { colors, spacing } from '../theme';

const APP_ICON_URL = 'https://static.toss.im/appsintoss/77253/012d25c1-b3db-4412-8500-24ba637d0a1a.png';

export const Route = createRoute<RecipeRouteParams>('/recipe', {
  component: RecipeDetailPage,
});

function RecipeDetailPage() {
  const insets = useSafeAreaInsets();
  const { id, ownedIds } = Route.useParams();
  const recipe = getRecipe(id);
  const ownedSet = new Set(ownedIds ?? []);

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    FavoritesStore.isFavorite(id)
      .then(setIsFavorite)
      .catch(() => {});
  }, [id]);

  const toggleFavorite = () => {
    FavoritesStore.toggle(id)
      .then(setIsFavorite)
      .catch(() => {});
  };

  const handleShare = async () => {
    if (!recipe) return;
    try {
      const shareLink = await getTossShareLink('intoss://naengjang-teolgi', APP_ICON_URL);
      await share({
        message: `🧊 냉장고 구조대에서 "${recipe.name}" 레시피를 찾았어요!\n⏱ ${recipe.cookTimeMinutes}분 · 난이도 ${DIFFICULTY_LABEL[recipe.difficulty]}\n\n${shareLink}`,
      });
    } catch {
      // 사용자가 공유 시트를 취소한 경우 — 처리할 것 없음
    }
  };

  if (!recipe) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.notFound}>요리를 찾을 수 없어요.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{recipe.name}</Text>
          <Pressable onPress={toggleFavorite} hitSlop={8} accessibilityLabel="즐겨찾기">
            <Text style={styles.favoriteIcon}>{isFavorite ? '♥' : '♡'}</Text>
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>⏱ {recipe.cookTimeMinutes}분</Text>
          <Text style={styles.meta}>
            난이도: {'⭐'.repeat(recipe.difficulty)} ({DIFFICULTY_LABEL[recipe.difficulty]})
          </Text>
        </View>

        <Text style={styles.sectionTitle}>필요한 재료</Text>
        <View style={styles.card}>
          {recipe.ingredients.map((item) => {
            const ingredient = getIngredient(item.ingredientId);
            const owned = ownedSet.has(item.ingredientId);
            return (
              <View key={item.ingredientId} style={styles.ingredientRow}>
                <Text style={owned ? styles.ownedMark : styles.missingMark}>{owned ? '✓' : '🛒'}</Text>
                <Text style={styles.ingredientName}>
                  {ingredient?.emoji ?? ''} {ingredient?.name ?? item.ingredientId}
                  {item.amountLabel ? ` ${item.amountLabel}` : ''}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>만드는 방법</Text>
        <View style={styles.card}>
          {recipe.steps.map((step, index) => (
            <View key={`step-${index}`} style={styles.stepRow}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.shareButton} onPress={handleShare} accessibilityLabel="공유하기">
          <Text style={styles.shareButtonText}>📤 공유하기</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    fontSize: 15,
    color: colors.textMuted,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
  },
  favoriteIcon: {
    fontSize: 28,
    color: colors.danger,
    marginLeft: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  meta: {
    fontSize: 14,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  ownedMark: {
    width: 24,
    fontSize: 15,
    fontWeight: '800',
    color: colors.success,
  },
  missingMark: {
    width: 24,
    fontSize: 15,
  },
  ingredientName: {
    fontSize: 15,
    color: colors.text,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 24,
    fontSize: 14,
    fontWeight: '800',
    color: colors.accent,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  shareButton: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
});
