import { Recipe, RecommendationFilters, RecommendationSlot, ScoredRecipe } from './types';
import { MAX_MISSING_REQUIRED, passesFilters, scoreRecipe } from './score';

export interface RecommendOptions {
  excludeIds?: string[];
}

/**
 * 필터를 통과하고, 보유 재료를 하나라도 쓰며, 부족한 필수 재료가 너무 많지 않은
 * 요리만 골라 점수 높은 순으로 정렬한다.
 */
export function getEligibleScoredRecipes(
  recipes: Recipe[],
  ownedIds: string[],
  filters: RecommendationFilters,
  options: RecommendOptions = {}
): ScoredRecipe[] {
  const ownedSet = new Set(ownedIds);
  const excludeSet = new Set(options.excludeIds ?? []);

  return recipes
    .filter((recipe) => !excludeSet.has(recipe.id))
    .filter((recipe) => passesFilters(recipe, filters))
    .map((recipe) => scoreRecipe(recipe, ownedSet))
    .filter((scored) => scored.ownedIngredientIds.length > 0 && scored.missingRequiredIds.length <= MAX_MISSING_REQUIRED)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.missingIngredientIds.length - b.missingIngredientIds.length ||
        a.recipe.cookTimeMinutes - b.recipe.cookTimeMinutes
    );
}

/**
 * 결과 화면에 보여줄 3개 추천을 만든다.
 * 1) top: 가장 점수가 높은 요리
 * 2) also: 그다음으로 점수가 높은 요리
 * 3) simple: 남은 후보 중 재료를 가장 알뜰하게(적게, 완전 매치 우선) 쓰는 요리
 */
export function recommendSlots(
  recipes: Recipe[],
  ownedIds: string[],
  filters: RecommendationFilters,
  excludeIds: string[] = []
): RecommendationSlot[] {
  const eligible = getEligibleScoredRecipes(recipes, ownedIds, filters, { excludeIds });
  const top = eligible[0];
  if (!top) return [];

  const slots: RecommendationSlot[] = [{ label: 'top', scored: top }];
  const usedIds = new Set<string>([top.recipe.id]);

  const also = eligible.find((scored) => !usedIds.has(scored.recipe.id));
  if (also) {
    slots.push({ label: 'also', scored: also });
    usedIds.add(also.recipe.id);
  }

  const remaining = eligible.filter((scored) => !usedIds.has(scored.recipe.id));
  const simpleSorted = [...remaining].sort(
    (a, b) =>
      b.matchRatio - a.matchRatio ||
      a.totalIngredientCount - b.totalIngredientCount ||
      a.recipe.cookTimeMinutes - b.recipe.cookTimeMinutes
  );
  const simple = simpleSorted[0];
  if (simple) slots.push({ label: 'simple', scored: simple });

  return slots;
}

/** 선택한 재료로 무리 없이 만들 수 있는 요리 중 하나를 무작위로 뽑는다. */
export function recommendRandom(
  recipes: Recipe[],
  ownedIds: string[],
  filters: RecommendationFilters,
  excludeIds: string[] = []
): ScoredRecipe | null {
  const eligible = getEligibleScoredRecipes(recipes, ownedIds, filters, { excludeIds });
  const easyPool = eligible.filter((scored) => scored.missingRequiredIds.length === 0);
  const pool = easyPool.length > 0 ? easyPool : eligible;
  if (pool.length === 0) return null;

  const index = Math.floor(Math.random() * pool.length);
  const picked = pool[index];
  return picked ?? null;
}
