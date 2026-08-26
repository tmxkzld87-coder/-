import { shouldShowInterstitial, __resetInterstitialCounterForTests } from './interstitialFrequency';

describe('interstitialFrequency', () => {
  beforeEach(() => {
    __resetInterstitialCounterForTests();
  });

  it('returns false for the first 4 calls and true on the 5th', () => {
    const results = Array.from({ length: 5 }, () => shouldShowInterstitial());
    expect(results).toEqual([false, false, false, false, true]);
  });

  it('returns true again on every subsequent multiple of 5', () => {
    for (let i = 0; i < 9; i++) shouldShowInterstitial();
    expect(shouldShowInterstitial()).toBe(true); // 10th call
  });
});
