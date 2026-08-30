export type MealCategory = 'rice' | 'noodle' | 'soup' | 'side' | 'snack';

export type Difficulty = 1 | 2 | 3;

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: '초간단',
  2: '보통',
  3: '제대로 요리',
};

export const MEAL_CATEGORY_LABEL: Record<MealCategory, string> = {
  rice: '밥',
  noodle: '면',
  soup: '국/찌개',
  side: '반찬',
  snack: '간식',
};

export interface RecipeIngredient {
  ingredientId: string;
  /** 이 재료가 없으면 요리의 정체성이 무너지는 핵심 재료인지 여부 */
  required: boolean;
  /** 상세 화면에 보여줄 분량 표기 (예: "1공기", "1컵") */
  amountLabel?: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: MealCategory;
  ingredients: RecipeIngredient[];
  cookTimeMinutes: number;
  difficulty: Difficulty;
  steps: string[];
  tags: string[];
}

export type CookTimeFilterValue = 'any' | 10 | 20 | 30;
export type DifficultyFilterValue = 'any' | Difficulty;
export type MealCategoryFilterValue = 'any' | MealCategory;

export interface RecommendationFilters {
  cookTime: CookTimeFilterValue;
  difficulty: DifficultyFilterValue;
  mealCategory: MealCategoryFilterValue;
}

export const DEFAULT_FILTERS: RecommendationFilters = {
  cookTime: 'any',
  difficulty: 'any',
  mealCategory: 'any',
};

export interface ScoredRecipe {
  recipe: Recipe;
  ownedIngredientIds: string[];
  missingIngredientIds: string[];
  missingRequiredIds: string[];
  totalIngredientCount: number;
  matchRatio: number;
  score: number;
}

export type RecommendationSlotLabel = 'top' | 'also' | 'simple';

export interface RecommendationSlot {
  label: RecommendationSlotLabel;
  scored: ScoredRecipe;
}
