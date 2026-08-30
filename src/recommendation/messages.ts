import { ScoredRecipe } from './types';

export interface ResultMessage {
  title: string;
  subtitle: string;
}

/** 재료 활용률에 따라 결과 화면에 보여줄 상황별 메시지를 만든다. */
export function buildResultMessage(scored: ScoredRecipe): ResultMessage {
  const missingCount = scored.missingIngredientIds.length;

  if (missingCount === 0) {
    return { title: '냉장고 털기 성공! 🎉', subtitle: '오늘은 장보기 없이 해결 가능해요.' };
  }
  if (missingCount === 1) {
    return { title: '거의 다 있어요!', subtitle: '재료 하나만 사면 맛있는 한 끼 완성!' };
  }
  return { title: '오늘의 추천이에요', subtitle: `재료 ${missingCount}개만 더 있으면 완성돼요.` };
}
