import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from '@granite-js/native/react-native-safe-area-context';
import { createRoute } from '@granite-js/react-native';
import { RECIPES } from '../data/recipes';
import { getIngredient } from '../data/ingredients';
import { recommendRandom, recommendSlots } from '../recommendation/recommend';
import { buildResultMessage } from '../recommendation/messages';
import { RecommendationFilters, RecommendationSlot, ScoredRecipe } from '../recommendation/types';
import { RecipeCard } from '../components/RecipeCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { ResultRouteParams } from '../routeParams';
import { colors, spacing } from '../theme';

export const Route = createRoute<ResultRouteParams>('/result', {
  component: ResultPage,
});

function ingredientNames(ids: string[]): string[] {
  return ids.map((id) => getIngredient(id)?.name ?? id);
}

interface ResultState {
  slots: RecommendationSlot[];
  randomPick: ScoredRecipe | null;
  shownIds: string[];
}

function computeState(
  isRandom: boolean,
  excludeIds: string[],
  ingredientIds: string[],
  filters: RecommendationFilters
): ResultState {
  if (isRandom) {
    const picked = recommendRandom(RECIPES, ingredientIds, filters, excludeIds);
    return { slots: [], randomPick: picked, shownIds: picked ? [...excludeIds, picked.recipe.id] : excludeIds };
  }
  const slots = recommendSlots(RECIPES, ingredientIds, filters, excludeIds);
  return { slots, randomPick: null, shownIds: slots.map((slot) => slot.scored.recipe.id) };
}

function ResultPage() {
  const navigation = Route.useNavigation();
  const insets = useSafeAreaInsets();
  const { ingredientIds, filters, mode } = Route.useParams();

  const [isRandomMode, setIsRandomMode] = useState(mode === 'random');
  const [state, setState] = useState<ResultState>(() => computeState(mode === 'random', [], ingredientIds, filters));

  const handleShowMore = useCallback(() => {
    setState((prev) => computeState(isRandomMode, prev.shownIds, ingredientIds, filters));
  }, [isRandomMode, ingredientIds, filters]);

  const handleRandomToggle = useCallback(() => {
    setIsRandomMode(true);
    setState((prev) => computeState(true, prev.shownIds, ingredientIds, filters));
  }, [ingredientIds, filters]);

  const goToDetail = useCallback(
    (recipeId: string) => {
      navigation.navigate('/recipe', { id: recipeId, ownedIds: ingredientIds });
    },
    [navigation, ingredientIds]
  );

  const topScored = isRandomMode ? state.randomPick : (state.slots[0]?.scored ?? null);
  const message = topScored ? buildResultMessage(topScored) : null;
  const hasResults = isRandomMode ? state.randomPick !== null : state.slots.length > 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ScreenHeader title={isRandomMode ? '🎲 랜덤 추천' : '🍳 오늘의 추천'} />

        {hasResults && message ? (
          <View style={styles.messageBlock}>
            <Text style={styles.messageTitle}>{message.title}</Text>
            <Text style={styles.messageSubtitle}>{message.subtitle}</Text>
          </View>
        ) : null}

        {!hasResults ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>조건에 맞는 요리를 찾지 못했어요.</Text>
            <Text style={styles.emptySubtitle}>필터를 조정하거나 재료를 더 선택해보세요.</Text>
          </View>
        ) : null}

        {isRandomMode
          ? state.randomPick && (
              <RecipeCard
                recipe={state.randomPick.recipe}
                ownedCount={state.randomPick.ownedIngredientIds.length}
                totalCount={state.randomPick.totalIngredientCount}
                onPress={() => goToDetail(state.randomPick!.recipe.id)}
                detail={{
                  ownedNames: ingredientNames(state.randomPick.ownedIngredientIds),
                  missingNames: ingredientNames(state.randomPick.missingIngredientIds),
                }}
                shoppingHint={
                  state.randomPick.missingIngredientIds.length === 1
                    ? `🛒 ${ingredientNames(state.randomPick.missingIngredientIds)[0]} 하나만 있으면 만들 수 있어요.`
                    : undefined
                }
              />
            )
          : state.slots.map((slot) => (
              <RecipeCard
                key={slot.scored.recipe.id}
                recipe={slot.scored.recipe}
                ownedCount={slot.scored.ownedIngredientIds.length}
                totalCount={slot.scored.totalIngredientCount}
                slotLabel={slot.label}
                onPress={() => goToDetail(slot.scored.recipe.id)}
                detail={
                  slot.label === 'top'
                    ? {
                        ownedNames: ingredientNames(slot.scored.ownedIngredientIds),
                        missingNames: ingredientNames(slot.scored.missingIngredientIds),
                      }
                    : undefined
                }
                shoppingHint={
                  slot.label === 'top' && slot.scored.missingIngredientIds.length === 1
                    ? `🛒 ${ingredientNames(slot.scored.missingIngredientIds)[0]} 하나만 있으면 만들 수 있어요.`
                    : undefined
                }
              />
            ))}

        <View style={styles.actionRow}>
          <Pressable style={styles.actionButton} onPress={handleShowMore}>
            <Text style={styles.actionButtonText}>🔄 다른 메뉴 추천</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleRandomToggle}>
            <Text style={styles.actionButtonText}>🎲 아무거나 골라줘</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  messageBlock: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.accent,
  },
  messageSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  emptyBlock: {
    marginTop: spacing.xxl,
    marginHorizontal: spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  actionButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
});
