import { calculateDiscount } from './calc';

describe('calculateDiscount', () => {
  it('mode rate: derives the discount rate from regular + discounted price', () => {
    const result = calculateDiscount({ mode: 'rate', regularPrice: 10000, discountedPrice: 8000 });
    expect(result).toEqual({ finalPrice: 8000, savings: 2000, effectiveRate: 20 });
  });

  it('mode price: derives the discounted price from regular price + rate', () => {
    const result = calculateDiscount({ mode: 'price', regularPrice: 10000, discountRate: 20 });
    expect(result).toEqual({ finalPrice: 8000, savings: 2000, effectiveRate: 20 });
  });

  it('mode stacked: applies discount rates sequentially, not additively', () => {
    // 10000 * 0.8 * 0.9 = 7200, not 10000 * (1 - 0.3) = 7000
    const result = calculateDiscount({ mode: 'stacked', regularPrice: 10000, discountRates: [20, 10] });
    expect(result.finalPrice).toBe(7200);
    expect(result.savings).toBe(2800);
    expect(result.effectiveRate).toBe(28);
  });

  it('rejects a discounted price above the regular price in rate mode', () => {
    expect(() =>
      calculateDiscount({ mode: 'rate', regularPrice: 10000, discountedPrice: 12000 }),
    ).toThrow(RangeError);
  });

  it('rejects a discount rate over 100 in price mode', () => {
    expect(() => calculateDiscount({ mode: 'price', regularPrice: 10000, discountRate: 120 })).toThrow(
      RangeError,
    );
  });

  it('rejects an empty discount list in stacked mode', () => {
    expect(() => calculateDiscount({ mode: 'stacked', regularPrice: 10000, discountRates: [] })).toThrow(
      RangeError,
    );
  });

  it('rejects a non-positive regular price', () => {
    expect(() => calculateDiscount({ mode: 'price', regularPrice: 0, discountRate: 10 })).toThrow(RangeError);
  });
});
