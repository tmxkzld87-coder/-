import { shouldShowResultActionAd, __resetResultActionAdCounterForTests } from './ads';

describe('shouldShowResultActionAd', () => {
  beforeEach(() => {
    __resetResultActionAdCounterForTests();
  });

  it('returns false for the first 2 calls and true on the 3rd', () => {
    const results = Array.from({ length: 3 }, () => shouldShowResultActionAd());
    expect(results).toEqual([false, false, true]);
  });

  it('returns true again on every subsequent multiple of 3', () => {
    for (let i = 0; i < 5; i++) shouldShowResultActionAd();
    expect(shouldShowResultActionAd()).toBe(true); // 6th call
  });
});
