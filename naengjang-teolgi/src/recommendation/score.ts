import { Recipe, RecommendationFilters, ScoredRecipe } from './types';

/** 부족한 필수 재료가 이보다 많으면 추천 후보에서 제외한다. */
export const MAX_MISSING_REQUIRED = 2;

export function scoreRecipe(recipe: Recipe, ownedIds: ReadonlySet<string>): ScoredRecipe {
  const ownedIngredientIds: string[] = [];
  const missingIngredientIds: string[] = [];
  const missingRequiredIds: string[] = [];

  for (const item of recipe.ingredients) {
    if (ownedIds.has(item.ingredientId)) {
      ownedIngredientIds.push(item.ingredientId);
    } else {
      missingIngredientIds.push(item.ingredientId);
      if (item.required) missingRequiredIds.push(item.ingredientId);
    }
  }

  const totalIngredientCount = recipe.ingredients.length;
  const matchRatio = totalIngredientCount === 0 ? 0 : ownedIngredientIds.length / totalIngredientCount;
  const missingOptionalCount = missingIngredientIds.length - missingRequiredIds.length;

  // 보유 재료 일치율을 가장 크게 반영하고, 부족한 필수 재료는 무겁게, 선택 재료는 가볍게 감점한다.
  const score = matchRatio * 100 - missingRequiredIds.length * 18 - missingOptionalCount * 5;

  return {
    recipe,
    ownedIngredientIds,
    missingIngredientIds,
    missingRequiredIds,
    totalIngredientCount,
    matchRatio,
    score,
  };
}

export function passesFilters(recipe: Recipe, filters: RecommendationFilters): boolean {
  if (filters.cookTime !== 'any' && recipe.cookTimeMinutes > filters.cookTime) return false;
  if (filters.difficulty !== 'any' && recipe.difficulty !== filters.difficulty) return false;
  if (filters.mealCategory !== 'any' && recipe.category !== filters.mealCategory) return false;
  return true;
}
