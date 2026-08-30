import { Attendance, ComparisonResult, EventType, Intimacy, MealChoice, Relationship } from './types';

export const EVENT_LABELS: Record<EventType, { title: string; emoji: string }> = {
  wedding: { title: '결혼식', emoji: '💍' },
  funeral: { title: '장례식', emoji: '🕊️' },
  firstBirthday: { title: '돌잔치', emoji: '🎂' },
};

export const RELATIONSHIP_LABELS: Record<Relationship, string> = {
  family: '가족',
  relative: '친척',
  closeFriend: '친한 친구',
  friend: '친구',
  coworker: '직장동료',
  acquaintance: '지인',
  business: '거래처/업무 관계',
};

export const INTIMACY_LABELS: Record<Intimacy, string> = {
  close: '가까움',
  normal: '보통',
  light: '가벼운 관계',
};

export const ATTENDANCE_LABELS: Record<Attendance, string> = {
  attending: '직접 참석',
  notAttending: '참석하지 않음',
};

export function mealLabel(eventType: EventType, meal: MealChoice): string {
  if (eventType === 'funeral') {
    return meal === 'withMeal' ? '조문함' : '조문하지 않음';
  }
  return meal === 'withMeal' ? '식사함' : '식사하지 않음';
}

export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/** 추천 금액에 곁들이는 한 줄 설명. 정답처럼 느껴지지 않도록 단정적인 표현은 피한다. */
export function resultTagline(amount: number): string {
  if (amount <= 50_000) return '가벼운 마음을 담아 전해보세요.';
  if (amount <= 100_000) return '이 정도면 무난한 선택이에요.';
  if (amount <= 200_000) return '마음을 조금 더 담은 금액이에요.';
  return '각별한 마음을 담은 금액이에요.';
}

/** 사용자를 평가하지 않는, 담백한 비교 표현. */
export const COMPARISON_LABELS: Record<ComparisonResult, string> = {
  appropriate: '적당함',
  slightlyLess: '조금 적음',
  generous: '넉넉함',
};
