import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ingredient, IngredientCategory } from '../data/ingredients';
import { IngredientCard } from './IngredientCard';
import { colors, spacing } from '../theme';

interface CategorySectionProps {
  category: Pick<IngredientCategory, 'label' | 'emoji'>;
  ingredients: Ingredient[];
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
}

export function CategorySection({ category, ingredients, selectedIds, onToggle }: CategorySectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {category.emoji} {category.label}
      </Text>
      <View style={styles.grid}>
        {ingredients.map((ingredient) => (
          <IngredientCard
            key={ingredient.id}
            ingredient={ingredient}
            selected={selectedIds.has(ingredient.id)}
            onPress={onToggle}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
