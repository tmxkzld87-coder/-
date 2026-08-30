import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from '@granite-js/native/react-native-safe-area-context';
import { createRoute } from '@granite-js/react-native';
import { useFocusEffect } from '@granite-js/native/@react-navigation/native';
import { getRecipe } from '../data/recipes';
import { Recipe } from '../recommendation/types';
import { RecipeCard } from '../components/RecipeCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { FavoritesStore } from '../storage/favorites';
import { colors, spacing } from '../theme';

export const Route = createRoute('/favorites', {
  component: FavoritesPage,
});

function isRecipe(value: Recipe | undefined): value is Recipe {
  return value !== undefined;
}

function FavoritesPage() {
  const navigation = Route.useNavigation();
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<Recipe[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      FavoritesStore.getAll()
        .then((ids) => {
          if (!cancelled) setFavorites(ids.map(getRecipe).filter(isRecipe));
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ScreenHeader title="⭐ 내가 좋아하는 메뉴" />

        {favorites.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>즐겨찾기한 메뉴가 없어요.</Text>
            <Text style={styles.emptySubtitle}>요리 상세 화면에서 ♡를 눌러 저장해보세요.</Text>
          </View>
        ) : (
          favorites.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              ownedCount={0}
              totalCount={recipe.ingredients.length}
              onPress={() => navigation.navigate('/recipe', { id: recipe.id })}
            />
          ))
        )}
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
});
