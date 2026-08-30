import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ingredient } from '../data/ingredients';
import { IngredientCard } from './IngredientCard';
import { colors, spacing } from '../theme';

interface IngredientHorizontalListProps {
  title: string;
  ingredients: Ingredient[];
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
}

export function IngredientHorizontalList({ title, ingredients, selectedIds, onToggle }: IngredientHorizontalListProps) {
  if (ingredients.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {ingredients.map((ingredient) => (
          <View key={ingredient.id} style={styles.item}>
            <IngredientCard ingredient={ingredient} selected={selectedIds.has(ingredient.id)} onPress={onToggle} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    paddingLeft: spacing.lg,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  row: {
    paddingRight: spacing.lg,
  },
  item: {
    marginRight: spacing.sm,
  },
});
