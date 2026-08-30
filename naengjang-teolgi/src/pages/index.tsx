import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from '@granite-js/native/react-native-safe-area-context';
import { createRoute } from '@granite-js/react-native';
import {
  FREQUENTLY_USED_INGREDIENT_IDS,
  getIngredient,
  Ingredient,
  INGREDIENT_CATEGORIES,
  INGREDIENTS,
} from '../data/ingredients';

function isIngredient(value: Ingredient | undefined): value is Ingredient {
  return value !== undefined;
}
import { CategorySection } from '../components/CategorySection';
import { IngredientHorizontalList } from '../components/IngredientHorizontalList';
import { SearchInput } from '../components/SearchInput';
import { SelectedTray } from '../components/SelectedTray';
import { FilterGroup } from '../components/FilterGroup';
import { ScreenHeader } from '../components/ScreenHeader';
import { AdBanner } from '../components/AdBanner';
import { SELECT_BANNER_AD_GROUP_ID } from '../ads';
import { RecentIngredientsStore } from '../storage/recentIngredients';
import { CookTimeFilterValue, DifficultyFilterValue, MealCategoryFilterValue } from '../recommendation/types';
import { colors, spacing } from '../theme';

export const Route = createRoute('/', {
  component: IngredientSelectPage,
});

const COOK_TIME_OPTIONS: { value: CookTimeFilterValue; label: string }[] = [
  { value: 'any', label: '상관없음' },
  { value: 10, label: '10분 이내' },
  { value: 20, label: '20분 이내' },
  { value: 30, label: '30분 이내' },
];

const DIFFICULTY_OPTIONS: { value: DifficultyFilterValue; label: string }[] = [
  { value: 'any', label: '상관없음' },
  { value: 1, label: '초간단' },
  { value: 2, label: '보통' },
  { value: 3, label: '제대로 요리' },
];

const MEAL_CATEGORY_OPTIONS: { value: MealCategoryFilterValue; label: string }[] = [
  { value: 'any', label: '상관없음' },
  { value: 'rice', label: '밥' },
  { value: 'noodle', label: '면' },
  { value: 'soup', label: '국/찌개' },
  { value: 'side', label: '반찬' },
  { value: 'snack', label: '간식' },
];

function IngredientSelectPage() {
  const navigation = Route.useNavigation();
  const insets = useSafeAreaInsets();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [cookTime, setCookTime] = useState<CookTimeFilterValue>('any');
  const [difficulty, setDifficulty] = useState<DifficultyFilterValue>('any');
  const [mealCategory, setMealCategory] = useState<MealCategoryFilterValue>('any');

  useEffect(() => {
    RecentIngredientsStore.getAll()
      .then(setRecentIds)
      .catch(() => {});
  }, []);

  const toggleIngredient = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const frequentlyUsed = useMemo(
    () => FREQUENTLY_USED_INGREDIENT_IDS.map(getIngredient).filter(isIngredient),
    []
  );

  const recentIngredients = useMemo(() => recentIds.map(getIngredient).filter(isIngredient), [recentIds]);

  const trimmedQuery = query.trim();
  const searchResults = useMemo(() => {
    if (!trimmedQuery) return [];
    return INGREDIENTS.filter((ingredient) => ingredient.name.includes(trimmedQuery));
  }, [trimmedQuery]);

  const selectedIngredients = useMemo(
    () => Array.from(selectedIds).map(getIngredient).filter(isIngredient),
    [selectedIds]
  );

  const canRecommend = selectedIds.size >= 2;
  const filters = useMemo(() => ({ cookTime, difficulty, mealCategory }), [cookTime, difficulty, mealCategory]);

  const goToResult = useCallback(
    (mode: 'top3' | 'random') => {
      if (!canRecommend) return;
      const ingredientIds = Array.from(selectedIds);
      RecentIngredientsStore.record(ingredientIds).catch(() => {});
      navigation.navigate('/result', { ingredientIds, filters, mode });
    },
    [canRecommend, selectedIds, filters, navigation]
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="냉장고 털기"
          subtitle="있는 재료로 오늘 뭐 먹지?"
          right={
            <Pressable onPress={() => navigation.navigate('/favorites')} hitSlop={8}>
              <Text style={styles.favoritesLink}>⭐ 즐겨찾기</Text>
            </Pressable>
          }
        />
        <Text style={styles.lead}>냉장고에 뭐가 있나요?{'\n'}가지고 있는 재료를 선택해주세요.</Text>

        <SearchInput value={query} onChangeText={setQuery} />

        {trimmedQuery.length > 0 ? (
          searchResults.length > 0 ? (
            <CategorySection
              category={{ label: `'${trimmedQuery}' 검색 결과`, emoji: '🔍' }}
              ingredients={searchResults}
              selectedIds={selectedIds}
              onToggle={toggleIngredient}
            />
          ) : (
            <Text style={styles.emptySearch}>{`'${trimmedQuery}'에 맞는 재료가 없어요.`}</Text>
          )
        ) : (
          <>
            <IngredientHorizontalList
              title="🔥 자주 쓰는 재료"
              ingredients={frequentlyUsed}
              selectedIds={selectedIds}
              onToggle={toggleIngredient}
            />
            <IngredientHorizontalList
              title="최근 사용"
              ingredients={recentIngredients}
              selectedIds={selectedIds}
              onToggle={toggleIngredient}
            />
            {INGREDIENT_CATEGORIES.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                ingredients={INGREDIENTS.filter((ingredient) => ingredient.categoryId === category.id)}
                selectedIds={selectedIds}
                onToggle={toggleIngredient}
              />
            ))}
          </>
        )}

        <FilterGroup title="조리시간" options={COOK_TIME_OPTIONS} value={cookTime} onChange={setCookTime} />
        <FilterGroup title="난이도" options={DIFFICULTY_OPTIONS} value={difficulty} onChange={setDifficulty} />
        <FilterGroup title="식사 종류" options={MEAL_CATEGORY_OPTIONS} value={mealCategory} onChange={setMealCategory} />

        <AdBanner adGroupId={SELECT_BANNER_AD_GROUP_ID} />
      </ScrollView>

      <SelectedTray
        selectedIngredients={selectedIngredients}
        onRemove={toggleIngredient}
        onRecommend={() => goToResult('top3')}
        onRandom={() => goToResult('random')}
        canRecommend={canRecommend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  lead: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
  },
  favoritesLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    marginTop: 4,
  },
  emptySearch: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
