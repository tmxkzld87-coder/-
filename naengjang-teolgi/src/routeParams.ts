import { RecommendationFilters } from './recommendation/types';

export interface ResultRouteParams {
  ingredientIds: string[];
  filters: RecommendationFilters;
  mode: 'top3' | 'random';
}

export interface RecipeRouteParams {
  id: string;
  ownedIds?: string[];
}
