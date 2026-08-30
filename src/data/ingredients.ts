export type IngredientCategoryId = 'meat' | 'dairy' | 'vegetable' | 'carb' | 'seasoning' | 'etc';

export interface IngredientCategory {
  id: IngredientCategoryId;
  label: string;
  emoji: string;
}

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  categoryId: IngredientCategoryId;
  frequentlyUsed?: boolean;
}

export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  { id: 'meat', label: '고기', emoji: '🥩' },
  { id: 'dairy', label: '계란/유제품', emoji: '🥚' },
  { id: 'vegetable', label: '채소', emoji: '🥬' },
  { id: 'carb', label: '탄수화물', emoji: '🍚' },
  { id: 'seasoning', label: '기본 재료', emoji: '🧂' },
  { id: 'etc', label: '기타', emoji: '🐟' },
];

export const INGREDIENTS: Ingredient[] = [
  // 🥩 고기
  { id: 'pork', name: '돼지고기', emoji: '🐖', categoryId: 'meat' },
  { id: 'beef', name: '소고기', emoji: '🐄', categoryId: 'meat' },
  { id: 'chicken', name: '닭고기', emoji: '🍗', categoryId: 'meat' },
  { id: 'bacon', name: '베이컨', emoji: '🥓', categoryId: 'meat' },
  { id: 'ham', name: '햄', emoji: '🍖', categoryId: 'meat' },
  { id: 'sausage', name: '소시지', emoji: '🌭', categoryId: 'meat' },
  { id: 'spam', name: '스팸', emoji: '🥫', categoryId: 'meat', frequentlyUsed: true },
  { id: 'canned-tuna', name: '참치캔', emoji: '🐟', categoryId: 'meat' },

  // 🥚 계란/유제품
  { id: 'egg', name: '계란', emoji: '🥚', categoryId: 'dairy', frequentlyUsed: true },
  { id: 'milk', name: '우유', emoji: '🥛', categoryId: 'dairy' },
  { id: 'cheese', name: '치즈', emoji: '🧀', categoryId: 'dairy' },
  { id: 'butter', name: '버터', emoji: '🧈', categoryId: 'dairy' },
  { id: 'tofu', name: '두부', emoji: '🧊', categoryId: 'dairy', frequentlyUsed: true },

  // 🥬 채소
  { id: 'onion', name: '양파', emoji: '🧅', categoryId: 'vegetable', frequentlyUsed: true },
  { id: 'green-onion', name: '대파', emoji: '🌱', categoryId: 'vegetable', frequentlyUsed: true },
  { id: 'garlic', name: '마늘', emoji: '🧄', categoryId: 'vegetable' },
  { id: 'potato', name: '감자', emoji: '🥔', categoryId: 'vegetable' },
  { id: 'carrot', name: '당근', emoji: '🥕', categoryId: 'vegetable' },
  { id: 'zucchini', name: '애호박', emoji: '🥒', categoryId: 'vegetable' },
  { id: 'mushroom', name: '버섯', emoji: '🍄', categoryId: 'vegetable' },
  { id: 'cabbage', name: '양배추', emoji: '🥬', categoryId: 'vegetable' },
  { id: 'chili-pepper', name: '고추', emoji: '🌶️', categoryId: 'vegetable' },
  { id: 'lettuce', name: '상추', emoji: '🍃', categoryId: 'vegetable' },
  { id: 'kimchi', name: '김치', emoji: '🫙', categoryId: 'vegetable', frequentlyUsed: true },

  // 🍚 탄수화물
  { id: 'rice', name: '밥', emoji: '🍚', categoryId: 'carb', frequentlyUsed: true },
  { id: 'ramen', name: '라면', emoji: '🍜', categoryId: 'carb' },
  { id: 'somyeon', name: '소면', emoji: '🥢', categoryId: 'carb' },
  { id: 'udon', name: '우동', emoji: '🍲', categoryId: 'carb' },
  { id: 'pasta', name: '파스타', emoji: '🍝', categoryId: 'carb' },
  { id: 'bread', name: '식빵', emoji: '🍞', categoryId: 'carb' },
  { id: 'rice-cake', name: '떡', emoji: '🍡', categoryId: 'carb' },

  // 🧂 기본 재료
  { id: 'soy-sauce', name: '간장', emoji: '🍶', categoryId: 'seasoning' },
  { id: 'gochujang', name: '고추장', emoji: '🌶️', categoryId: 'seasoning' },
  { id: 'doenjang', name: '된장', emoji: '🫘', categoryId: 'seasoning' },
  { id: 'sugar', name: '설탕', emoji: '🍯', categoryId: 'seasoning' },
  { id: 'salt', name: '소금', emoji: '🧂', categoryId: 'seasoning' },
  { id: 'cooking-oil', name: '식용유', emoji: '🛢️', categoryId: 'seasoning' },
  { id: 'sesame-oil', name: '참기름', emoji: '🫗', categoryId: 'seasoning' },
  { id: 'red-pepper-powder', name: '고춧가루', emoji: '🌶️', categoryId: 'seasoning' },

  // 🐟 기타
  { id: 'shrimp', name: '새우', emoji: '🍤', categoryId: 'etc' },
  { id: 'squid', name: '오징어', emoji: '🦑', categoryId: 'etc' },
  { id: 'fish-cake', name: '어묵', emoji: '🍢', categoryId: 'etc' },
  { id: 'seaweed', name: '김', emoji: '🍙', categoryId: 'etc' },
  { id: 'corn', name: '옥수수', emoji: '🌽', categoryId: 'etc' },
  { id: 'dumpling', name: '만두', emoji: '🥟', categoryId: 'etc' },
  { id: 'anchovy', name: '멸치', emoji: '🐠', categoryId: 'etc' },
];

export const INGREDIENT_MAP: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENTS.map((ingredient) => [ingredient.id, ingredient])
);

export function getIngredient(id: string): Ingredient | undefined {
  return INGREDIENT_MAP[id];
}

export const FREQUENTLY_USED_INGREDIENT_IDS = INGREDIENTS.filter((i) => i.frequentlyUsed).map((i) => i.id);
