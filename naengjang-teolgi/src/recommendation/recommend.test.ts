import { Recipe, DEFAULT_FILTERS } from './types';
import { getEligibleScoredRecipes, recommendRandom, recommendSlots } from './recommend';
import { scoreRecipe } from './score';
import { buildResultMessage } from './messages';

const KIMCHI_FRIED_RICE: Recipe = {
  id: 'kimchi-fried-rice',
  name: '김치볶음밥',
  category: 'rice',
  ingredients: [
    { ingredientId: 'rice', required: true },
    { ingredientId: 'kimchi', required: true },
    { ingredientId: 'cooking-oil', required: true },
    { ingredientId: 'green-onion', required: false },
    { ingredientId: 'egg', required: false },
  ],
  cookTimeMinutes: 15,
  difficulty: 1,
  tags: [],
  steps: [],
};

const KIMCHI_JJIGAE: Recipe = {
  id: 'kimchi-jjigae',
  name: '김치찌개',
  category: 'soup',
  ingredients: [
    { ingredientId: 'kimchi', required: true },
    { ingredientId: 'pork', required: true },
    { ingredientId: 'tofu', required: true },
    { ingredientId: 'green-onion', required: false },
  ],
  cookTimeMinutes: 25,
  difficulty: 2,
  tags: [],
  steps: [],
};

const RAMYEON: Recipe = {
  id: 'ramyeon',
  name: '라면',
  category: 'noodle',
  ingredients: [
    { ingredientId: 'ramen', required: true },
    { ingredientId: 'egg', required: false },
  ],
  cookTimeMinutes: 10,
  difficulty: 1,
  tags: [],
  steps: [],
};

const RECIPES = [KIMCHI_FRIED_RICE, KIMCHI_JJIGAE, RAMYEON];

describe('scoreRecipe', () => {
  it('모든 재료를 보유하면 활용률 1과 부족 재료 0을 반환한다', () => {
    const owned = new Set(['rice', 'kimchi', 'cooking-oil', 'green-onion', 'egg']);
    const scored = scoreRecipe(KIMCHI_FRIED_RICE, owned);
    expect(scored.matchRatio).toBe(1);
    expect(scored.missingIngredientIds).toHaveLength(0);
    expect(scored.missingRequiredIds).toHaveLength(0);
  });

  it('필수 재료가 하나 빠지면 missingRequiredIds에 포함된다', () => {
    const owned = new Set(['kimchi', 'pork']);
    const scored = scoreRecipe(KIMCHI_JJIGAE, owned);
    expect(scored.missingRequiredIds).toEqual(['tofu']);
    expect(scored.matchRatio).toBeCloseTo(2 / 4);
  });
});

describe('getEligibleScoredRecipes', () => {
  it('선택한 재료를 하나도 쓰지 않는 요리는 제외한다', () => {
    const results = getEligibleScoredRecipes(RECIPES, ['ramen'], DEFAULT_FILTERS);
    expect(results.map((r) => r.recipe.id)).toEqual(['ramyeon']);
  });

  it('조리시간 필터를 초과하는 요리는 제외한다', () => {
    const owned = ['kimchi', 'pork', 'tofu', 'rice', 'cooking-oil'];
    const results = getEligibleScoredRecipes(RECIPES, owned, { ...DEFAULT_FILTERS, cookTime: 20 });
    expect(results.some((r) => r.recipe.id === 'kimchi-jjigae')).toBe(false);
    expect(results.some((r) => r.recipe.id === 'kimchi-fried-rice')).toBe(true);
  });

  it('식사 종류 필터를 적용하면 해당 카테고리만 남는다', () => {
    const owned = ['kimchi', 'pork', 'tofu', 'rice', 'cooking-oil'];
    const results = getEligibleScoredRecipes(RECIPES, owned, { ...DEFAULT_FILTERS, mealCategory: 'soup' });
    expect(results.map((r) => r.recipe.id)).toEqual(['kimchi-jjigae']);
  });

  it('가장 활용률이 높은 요리를 최상단에 둔다', () => {
    // kimchi-jjigae는 필수 재료 3개를 모두 보유해 활용률(3/4)이 kimchi-fried-rice(3/5)보다 높다.
    const owned = ['rice', 'kimchi', 'cooking-oil', 'pork', 'tofu'];
    const results = getEligibleScoredRecipes(RECIPES, owned, DEFAULT_FILTERS);
    expect(results[0]?.recipe.id).toBe('kimchi-jjigae');
  });
});

describe('recommendSlots', () => {
  it('후보가 3개 이상이면 top/also/simple 3개를 반환한다', () => {
    const owned = ['rice', 'kimchi', 'cooking-oil', 'pork', 'tofu', 'ramen', 'egg', 'green-onion'];
    const slots = recommendSlots(RECIPES, owned, DEFAULT_FILTERS);
    expect(slots.map((s) => s.label)).toEqual(['top', 'also', 'simple']);
    const ids = slots.map((s) => s.scored.recipe.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('excludeIds로 넘긴 요리는 제외한다', () => {
    const owned = ['rice', 'kimchi', 'cooking-oil'];
    const slots = recommendSlots(RECIPES, owned, DEFAULT_FILTERS, ['kimchi-fried-rice']);
    expect(slots.some((s) => s.scored.recipe.id === 'kimchi-fried-rice')).toBe(false);
  });

  it('후보가 없으면 빈 배열을 반환한다', () => {
    const slots = recommendSlots(RECIPES, ['milk'], DEFAULT_FILTERS);
    expect(slots).toEqual([]);
  });
});

describe('recommendRandom', () => {
  it('필터를 통과하는 후보 중 하나를 반환한다', () => {
    const owned = ['ramen', 'egg'];
    const picked = recommendRandom(RECIPES, owned, DEFAULT_FILTERS);
    expect(picked?.recipe.id).toBe('ramyeon');
  });

  it('후보가 없으면 null을 반환한다', () => {
    const picked = recommendRandom(RECIPES, ['milk'], DEFAULT_FILTERS);
    expect(picked).toBeNull();
  });
});

describe('buildResultMessage', () => {
  it('부족한 재료가 없으면 성공 메시지를 준다', () => {
    const owned = new Set(['rice', 'kimchi', 'cooking-oil', 'green-onion', 'egg']);
    const message = buildResultMessage(scoreRecipe(KIMCHI_FRIED_RICE, owned));
    expect(message.title).toContain('성공');
  });

  it('부족한 재료가 1개면 거의 다 있다는 메시지를 준다', () => {
    const owned = new Set(['kimchi', 'pork', 'green-onion']);
    const message = buildResultMessage(scoreRecipe(KIMCHI_JJIGAE, owned));
    expect(message.title).toContain('거의');
  });
});
