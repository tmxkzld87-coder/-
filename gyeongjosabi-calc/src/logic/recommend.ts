import { Answers, Attendance, EventType, Intimacy, MealChoice, Relationship, ComparisonResult } from './types';

/**
 * 추천 금액 기준값. 이 파일에서만 금액을 관리하며, 추후 기준을 바꿀 때는 이 값들만 수정하면 된다.
 * 계산식: baseAmount + relationshipAdjustment + intimacyAdjustment + attendanceAdjustment + mealAdjustment
 * 결과는 5만원 단위로 반올림하고, 최소 5만원을 보장한다.
 */
const MIN_AMOUNT = 50_000;
const ROUND_UNIT = 50_000;
const BASE_AMOUNT = 50_000;

const RELATIONSHIPS_BY_EVENT: Record<EventType, Relationship[]> = {
  wedding: ['family', 'relative', 'closeFriend', 'friend', 'coworker', 'acquaintance', 'business'],
  funeral: ['family', 'relative', 'closeFriend', 'friend', 'coworker', 'acquaintance', 'business'],
  firstBirthday: ['family', 'relative', 'closeFriend', 'friend', 'coworker', 'acquaintance'],
};

const RELATIONSHIP_ADJUSTMENT: Record<EventType, Partial<Record<Relationship, number>>> = {
  wedding: {
    family: 150_000,
    relative: 100_000,
    closeFriend: 50_000,
    friend: 0,
    coworker: 0,
    acquaintance: 0,
    business: 0,
  },
  funeral: {
    family: 150_000,
    relative: 100_000,
    closeFriend: 50_000,
    friend: 0,
    coworker: 0,
    acquaintance: 0,
    business: 0,
  },
  firstBirthday: {
    family: 100_000,
    relative: 50_000,
    closeFriend: 50_000,
    friend: 0,
    coworker: 0,
    acquaintance: 0,
  },
};

const INTIMACY_ADJUSTMENT: Record<Intimacy, number> = {
  close: 50_000,
  normal: 0,
  light: -50_000,
};

const ATTENDANCE_ADJUSTMENT: Record<Attendance, number> = {
  attending: 0,
  notAttending: -50_000,
};

const MEAL_ADJUSTMENT: Record<MealChoice, number> = {
  withMeal: 0,
  withoutMeal: -50_000,
};

export const PRESET_AMOUNTS = [50_000, 100_000, 150_000, 200_000, 300_000] as const;

function roundToNearest(amount: number, unit: number): number {
  return Math.round(amount / unit) * unit;
}

export function getAvailableRelationships(eventType: EventType): Relationship[] {
  return RELATIONSHIPS_BY_EVENT[eventType];
}

export function recommendAmount(answers: Answers): number {
  const relationshipAdjustment = RELATIONSHIP_ADJUSTMENT[answers.eventType][answers.relationship] ?? 0;
  const raw =
    BASE_AMOUNT +
    relationshipAdjustment +
    INTIMACY_ADJUSTMENT[answers.intimacy] +
    ATTENDANCE_ADJUSTMENT[answers.attendance] +
    MEAL_ADJUSTMENT[answers.meal];

  return Math.max(MIN_AMOUNT, roundToNearest(raw, ROUND_UNIT));
}

/** "조금 더 내고 싶다면" 섹션에 쓰이는 참고용 추가 금액. 확정 값이 아니라 제안일 뿐이다. */
export function boostedAmounts(recommended: number): { closer: number; special: number } {
  return {
    closer: recommended + 50_000,
    special: recommended + 100_000,
  };
}

export function compareToRecommendation(chosen: number, recommended: number): ComparisonResult {
  if (chosen === recommended) return 'appropriate';
  return chosen < recommended ? 'slightlyLess' : 'generous';
}

/** 과거에 받은 금액을 기준으로 이번에 낼 금액의 범위를 추천한다. */
export function receivedAmountRange(receivedAmount: number): { min: number; max: number } {
  const min = Math.max(MIN_AMOUNT, roundToNearest(receivedAmount, ROUND_UNIT));
  return { min, max: min + ROUND_UNIT };
}
