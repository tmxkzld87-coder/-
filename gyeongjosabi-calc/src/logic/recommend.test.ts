import { Answers } from './types';
import {
  boostedAmounts,
  compareToRecommendation,
  getAvailableRelationships,
  receivedAmountRange,
  recommendAmount,
} from './recommend';

function answers(overrides: Partial<Answers> = {}): Answers {
  return {
    eventType: 'wedding',
    relationship: 'closeFriend',
    intimacy: 'normal',
    attendance: 'attending',
    meal: 'withMeal',
    ...overrides,
  };
}

describe('recommendAmount', () => {
  it('추천 예시: 결혼식 · 친한 친구 · 보통 · 직접 참석 · 식사함 = 100,000원', () => {
    expect(recommendAmount(answers())).toBe(100_000);
  });

  it('가족은 더 높은 금액을 추천한다', () => {
    expect(recommendAmount(answers({ relationship: 'family' }))).toBe(200_000);
  });

  it('친밀도가 가까울수록 금액이 올라간다', () => {
    expect(recommendAmount(answers({ intimacy: 'close' }))).toBe(150_000);
  });

  it('불참하면 금액이 낮아진다', () => {
    expect(recommendAmount(answers({ attendance: 'notAttending' }))).toBe(50_000);
  });

  it('아무리 낮아져도 최소 5만원 미만으로는 내려가지 않는다', () => {
    expect(
      recommendAmount(
        answers({ relationship: 'friend', intimacy: 'light', attendance: 'notAttending', meal: 'withoutMeal' })
      )
    ).toBe(50_000);
  });

  it('결과는 항상 5만원 단위다', () => {
    const result = recommendAmount(answers());
    expect(result % 50_000).toBe(0);
  });
});

describe('getAvailableRelationships', () => {
  it('돌잔치에는 거래처/업무 관계가 없다', () => {
    expect(getAvailableRelationships('firstBirthday')).not.toContain('business');
  });

  it('결혼식과 장례식에는 거래처/업무 관계가 포함된다', () => {
    expect(getAvailableRelationships('wedding')).toContain('business');
    expect(getAvailableRelationships('funeral')).toContain('business');
  });
});

describe('boostedAmounts', () => {
  it('추천 금액보다 5만원, 10만원 더 큰 값을 제안한다', () => {
    expect(boostedAmounts(100_000)).toEqual({ closer: 150_000, special: 200_000 });
  });
});

describe('compareToRecommendation', () => {
  it('추천 금액과 같으면 적당함', () => {
    expect(compareToRecommendation(100_000, 100_000)).toBe('appropriate');
  });

  it('추천 금액보다 적으면 조금 적음', () => {
    expect(compareToRecommendation(50_000, 100_000)).toBe('slightlyLess');
  });

  it('추천 금액보다 많으면 넉넉함', () => {
    expect(compareToRecommendation(200_000, 100_000)).toBe('generous');
  });
});

describe('receivedAmountRange', () => {
  it('10만원을 받았다면 10만원~15만원을 추천한다', () => {
    expect(receivedAmountRange(100_000)).toEqual({ min: 100_000, max: 150_000 });
  });

  it('최소 범위는 5만원~10만원이다', () => {
    expect(receivedAmountRange(0)).toEqual({ min: 50_000, max: 100_000 });
  });
});
