import { calculateProfitRate } from './calc';

describe('calculateProfitRate', () => {
  it('computes profit, ROI (cost basis), and margin rate (revenue basis)', () => {
    const result = calculateProfitRate({ costPrice: 8000, sellPrice: 10000 });
    expect(result).toEqual({ profit: 2000, roi: 25, marginRate: 20 });
  });

  it('represents a loss as a negative profit and negative rates', () => {
    const result = calculateProfitRate({ costPrice: 10000, sellPrice: 8000 });
    expect(result.profit).toBe(-2000);
    expect(result.roi).toBe(-20);
    expect(result.marginRate).toBe(-25);
  });

  it('rejects a cost price of 0 or less', () => {
    expect(() => calculateProfitRate({ costPrice: 0, sellPrice: 1000 })).toThrow(RangeError);
  });

  it('rejects a sell price of 0 or less', () => {
    expect(() => calculateProfitRate({ costPrice: 1000, sellPrice: 0 })).toThrow(RangeError);
  });
});
